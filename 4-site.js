/* Lógica de la web de la Asamblea Tomás Bretón.
   El formulario único (productos y/o donativo) se envía al endpoint de
   Google Apps Script configurado en assets/config.js.
   La asamblea contacta después con cada persona para concretar. */
(function () {
  'use strict';
  var cfg = window.ASAMBLEA_CONFIG || {};
   
try { if (cfg.pedidosEndpoint) { fetch(cfg.pedidosEndpoint + '?v=1' + (/[?&]o=qr(&|$)/.test(location.search) ? '&o=qr' : ''), { mode: 'no-cors', keepalive: true }); } } catch (e) {} /* contador privado: solo fecha y hora */


  function enviar(datos, estado, form, hecho) {
    if (!cfg.pedidosEndpoint) {
      estado.textContent = 'Modo demostración: este formulario todavía no envía nada. Falta conectar la hoja de pedidos (ver README).';
      estado.className = 'estado demo';
      return;
    }
    estado.textContent = 'Enviando…';
    estado.className = 'estado';
    fetch(cfg.pedidosEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(datos)
    }).then(function (r) { return r.json(); }).then(function (r) {
      if (r && r.ok) {
        estado.textContent = hecho;
        estado.className = 'estado ok';
        form.reset();
        form.dispatchEvent(new Event('input', { bubbles: true }));
        resumen();
      } else { throw new Error((r && r.error) || 'error'); }
    }).catch(function () {
      estado.textContent = 'No se pudo enviar. Inténtalo de nuevo en unos minutos; si sigue fallando, escribe a ' + (cfg.email || 'la asamblea') + '.';
      estado.className = 'estado error';
    });
  }

  var form = document.getElementById('form-apoyo');
  var estado = document.getElementById('estado-envio');
  var detalleEl = document.getElementById('resumen-detalle');
  var donativoEl = document.getElementById('quiero-donar');

  function lineas() {
    var out = [];
    document.querySelectorAll('.tallas[data-producto]').forEach(function (grupo) {
      var producto = grupo.getAttribute('data-producto');
      grupo.querySelectorAll('input[type="number"]').forEach(function (input) {
        var n = parseInt(input.value, 10) || 0;
        if (n > 0) out.push({
          producto: producto,
          detalle: input.getAttribute('data-detalle') || '',
          precio: parseFloat(input.getAttribute('data-precio')) || 0,
          cantidad: n
        });
      });
    });
    return out;
  }

  function total(ls) {
    return ls.reduce(function (s, l) { return s + l.precio * l.cantidad; }, 0);
  }

  function resumen() {
    var ls = lineas();
    var partes = ls.map(function (l) {
      return l.cantidad + ' × ' + l.producto + (l.detalle ? ' (' + l.detalle + ')' : '');
    });
    if (donativoEl.checked) partes.push('Quiero colaborar');
    if (!partes.length) {
      detalleEl.textContent = 'Todavía no has elegido nada.';
      return;
    }
    var t = total(ls);
    detalleEl.textContent = partes.join(' · ') + (t > 0 ? ' — Total estimado: ' + t + ' € (precios provisionales)' : '');
  }

  form.addEventListener('input', resumen);
  resumen();

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var ls = lineas();
    var donativo = donativoEl.checked;
    if (!ls.length && !donativo) { estado.textContent = 'Elige productos o «Quiero colaborar».'; estado.className = 'estado error'; return; }
    if (!form.nombre.value.trim() || !form.email.value.trim()) { estado.textContent = 'Faltan tu nombre o tu correo.'; estado.className = 'estado error'; return; }
    if (!document.getElementById('privacidad-ok').checked) { estado.textContent = 'Marca la casilla para que podamos escribirte.'; estado.className = 'estado error'; return; }
    enviar({
      tipo: 'apoyo',
      lineas: ls,
      donativo: donativo,
      totalEstimado: total(ls),
      nombre: form.nombre.value.trim(),
      email: form.email.value.trim(),
      telefono: form.telefono.value.trim(),
      comentario: [form.comentario.value.trim(), form.clase.value.trim() ? 'Clase: ' + form.clase.value.trim() : ''].filter(Boolean).join('\n'),
      empresa: form.empresa ? form.empresa.value : ''
    }, estado, form, 'Hemos procesado tu reserva. ¡Gracias!');
  });

  /* Inscripción al torneo de pádel: formulario independiente del de productos.
     Usa el mismo receptor y el mismo formato de envío. */
  var formPadel = document.getElementById('form-padel');
  if (formPadel) {
    var modalidadEl = document.getElementById('padel-modalidad');
    var estadoPadel = document.getElementById('padel-estado');
    function actualizarPadel() {
      document.getElementById('padel-pareja').hidden = modalidadEl.value !== 'pareja';
    }
    formPadel.addEventListener('input', actualizarPadel);
    actualizarPadel();

    formPadel.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var pareja = modalidadEl.value === 'pareja';
      var nivel = document.getElementById('padel-nivel').value;
      var parejaNivel = document.getElementById('padel-pareja-nivel').value;
      var parejaNombre = document.getElementById('padel-pareja-nombre').value.trim();
      var nombre = document.getElementById('padel-nombre').value.trim();
      var email = document.getElementById('padel-email').value.trim();
      if (!nivel || (pareja && !parejaNivel)) { estadoPadel.textContent = 'Indica el nivel de juego de cada persona inscrita.'; estadoPadel.className = 'estado error'; return; }
      if (pareja && !parejaNombre) { estadoPadel.textContent = 'Indica el nombre de tu pareja de juego.'; estadoPadel.className = 'estado error'; return; }
      if (!document.getElementById('padel-edad').checked) { estadoPadel.textContent = 'Confirma que todas las personas inscritas tienen al menos 12 años.'; estadoPadel.className = 'estado error'; return; }
      if (!nombre || !email) { estadoPadel.textContent = 'Faltan el nombre de la persona que se inscribe o el correo.'; estadoPadel.className = 'estado error'; return; }
      if (!document.getElementById('padel-privacidad-ok').checked) { estadoPadel.textContent = 'Marca la casilla para que podamos escribirte.'; estadoPadel.className = 'estado error'; return; }
      enviar({
        tipo: 'apoyo',
        lineas: [{ producto: 'Inscripción torneo de pádel', detalle: pareja ? 'Por parejas' : 'Individual', precio: 20, cantidad: pareja ? 2 : 1 }],
        donativo: false,
        totalEstimado: pareja ? 40 : 20,
        nombre: nombre,
        email: email,
        telefono: document.getElementById('padel-telefono').value.trim(),
        comentario: 'Pádel: ' + (pareja ? 'por parejas' : 'individual') +
          (nivel ? '; nivel: ' + nivel : '') +
          (pareja ? '; pareja: ' + parejaNombre + (parejaNivel ? '; nivel pareja: ' + parejaNivel : '') : '') +
          '; edad mínima 12 años confirmada',
        empresa: document.getElementById('padel-empresa') ? document.getElementById('padel-empresa').value : ''
      }, estadoPadel, formPadel, 'Hemos recibido tu inscripción. La plaza se confirma con el pago presencial (20 € por persona), a la entrada o a la salida del colegio. ¡Gracias!');
    });
  }
})();
