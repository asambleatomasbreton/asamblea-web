/**
 * Receptor de la web de la Asamblea Tomás Bretón: un solo formulario de
 * apoyo (productos y/o donativo). La asamblea contacta después con cada
 * persona para concretar.
 *
 * PUESTA EN MARCHA (5 pasos):
 * 1. Entra en https://sheets.new con la cuenta asambleatomasbreton@gmail.com
 *    y crea una hoja llamada "Pedidos". Copia el ID de la hoja
 *    (la parte larga de la URL entre /d/ y /edit).
 * 2. Entra en https://script.google.com con la misma cuenta, crea un proyecto
 *    y pega este código. En "Propiedades del proyecto" > "Propiedades del
 *    script" añade: SHEET_ID = el ID copiado.
 * 3. Implementar > Nueva implementación > tipo "Aplicación web":
 *    Ejecutar como: "Yo". Acceso: "Cualquier persona".
 * 4. Copia la URL que termina en /exec y pégala en assets/config.js
 *    como valor de pedidosEndpoint.
 * 5. Haz una solicitud de prueba y borra la fila de prueba de la hoja.
 *
 * Cada envío válido se guarda en la hoja "Pedidos" (pestaña Solicitudes)
 * y se avisa por correo a la asamblea. La persona recibe además una
 * confirmación automática en su correo.
 *
 * Protecciones incluidas (la URL es pública, así que el servidor valida):
 * - Solo acepta el tipo "apoyo", con campos válidos.
 * - Limita el tamaño de cada texto y el número de líneas.
 * - Campo trampa ("empresa"): si viene relleno, es un robot; se descarta
 *   sin avisar ni gastar correos.
 * - Freno de rachas: como máximo 20 envíos por hora en total.
 * - Antes de escribir en la hoja, los textos que empiezan por = + - @
 *   se neutralizan para que no se interpreten como fórmulas.
 * - Los correos solo se envían después de guardar la fila, para no gastar
 *   la cuota diaria (100 destinatarios) en envíos fallidos.
 */

var CORREO_ASAMBLEA = 'asambleatomasbreton@gmail.com';

var MAX_ENVIOS_POR_HORA = 20;
var MAX_TEXTO = 500;
var MAX_NOMBRE = 100;
var MAX_LINEAS = 10;
var MAX_CANTIDAD = 50;
var MAX_CUERPO = 10000;

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents ||
        e.postData.contents.length > MAX_CUERPO) {
      return salida({ ok: false, error: 'solicitud no válida' });
    }

    var datos = JSON.parse(e.postData.contents);

    // Campo trampa: los robots lo rellenan, las personas no lo ven.
    if (datos.empresa) {
      return salida({ ok: true });
    }

    var error = validar(datos);
    if (error) {
      return salida({ ok: false, error: error });
    }

    if (!huecoDisponible()) {
      return salida({ ok: false, error: 'demasiados envíos seguidos; inténtalo más tarde' });
    }

    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    var libro = SpreadsheetApp.openById(sheetId);

    var resumen = resumenSolicitud(datos);
    var tipo = datos.lineas.length && datos.donativo ? 'Productos y donativo'
      : datos.donativo ? 'Donativo' : 'Productos';

    pestania(libro, 'Solicitudes', ['Fecha', 'Nombre', 'Correo', 'Teléfono', 'Tipo', 'Detalle', 'Comentario'])
      .appendRow([new Date(), limpiar(datos.nombre, MAX_NOMBRE), limpiar(datos.email, MAX_TEXTO),
        limpiar(datos.telefono || '', 30), tipo, limpiar(resumen, MAX_TEXTO),
        limpiar(datos.comentario || '', MAX_TEXTO)]);

    MailApp.sendEmail({
      to: CORREO_ASAMBLEA,
      subject: 'Nueva solicitud (' + tipo + '): ' + datos.nombre,
      body: 'Solicitud de ' + datos.nombre + ' <' + datos.email + '>' +
        (datos.telefono ? ' · ' + datos.telefono : '') + '\n\n' + resumen +
        (datos.comentario ? '\n\nComentario: ' + datos.comentario : '')
    });

    MailApp.sendEmail({
      to: datos.email,
      subject: 'Hemos recibido tu solicitud - Asamblea Tomás Bretón',
      body: 'Hola ' + datos.nombre + ',\n\nHemos recibido tu solicitud:\n\n' + resumen + '\n\n' +
        'Te escribiremos para confirmarla y concretar contigo los detalles.\n\n' +
        'Asamblea Tomás Bretón'
    });

    return salida({ ok: true });
  } catch (err) {
    return salida({ ok: false, error: 'no se pudo procesar' });
  }
}

function validar(datos) {
  if (!datos || datos.tipo !== 'apoyo') {
    return 'tipo desconocido';
  }
  if (!datos.nombre || typeof datos.nombre !== 'string' || !datos.nombre.trim()) {
    return 'falta el nombre';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email || '')) {
    return 'correo no válido';
  }
  var lineas = Array.isArray(datos.lineas) ? datos.lineas : [];
  if (!lineas.length && datos.donativo !== true) {
    return 'solicitud vacía';
  }
  if (lineas.length > MAX_LINEAS) {
    return 'demasiadas líneas';
  }
  for (var i = 0; i < lineas.length; i++) {
    var l = lineas[i];
    var cantidad = Number(l.cantidad);
    if (!l.producto || typeof l.producto !== 'string' ||
        !Number.isInteger(cantidad) || cantidad < 1 || cantidad > MAX_CANTIDAD) {
      return 'línea no válida';
    }
  }
  datos.lineas = lineas;
  return null;
}

function limpiar(texto, maximo) {
  var limpio = String(texto).trim().slice(0, maximo);
  // Si empieza como una fórmula de hoja de cálculo, se neutraliza.
  if (/^[=+\-@]/.test(limpio)) {
    limpio = "'" + limpio;
  }
  return limpio;
}

function huecoDisponible() {
  var cache = CacheService.getScriptCache();
  var ahora = Date.now();
  var registro = JSON.parse(cache.get('envios') || '[]');
  registro = registro.filter(function (marca) { return ahora - marca < 3600000; });
  if (registro.length >= MAX_ENVIOS_POR_HORA) {
    return false;
  }
  registro.push(ahora);
  cache.put('envios', JSON.stringify(registro), 3700);
  return true;
}

function pestania(libro, nombre, cabecera) {
  var hoja = libro.getSheetByName(nombre);
  if (!hoja) {
    hoja = libro.insertSheet(nombre);
    hoja.appendRow(cabecera);
  }
  return hoja;
}

function resumenSolicitud(datos) {
  var partes = (datos.lineas || []).map(function (l) {
    return l.cantidad + ' x ' + l.producto + (l.detalle ? ' (' + l.detalle + ')' : '');
  });
  if (datos.donativo) {
    partes.push('Quiere hacer un donativo');
  }
  var total = Number(datos.totalEstimado) || 0;
  return partes.join('\n') + (total > 0 ? '\nTotal estimado: ' + total + ' € (precios provisionales)' : '');
}

function salida(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
