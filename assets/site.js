/* Lógica de la web de la Asamblea Tomás Bretón.
   Las reservas y los avisos de "quiero ayudar" se envían al endpoint de
   Google Apps Script configurado en assets/config.js.
   Nada se cobra en la web: la asamblea contacta después con cada persona. */
(function () {
  'use strict';
  var cfg = window.ASAMBLEA_CONFIG || {};

  function enviar(datos, estado, form, hecho) {
    if (!cfg.pedidosEndpoint) {
      estado.innerHTML = 'Modo demostración: este formulario todavía no envía nada. Falta conectar la hoja de pedidos (ver README).';
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
        if (form.id === 'form-pedido') resumen();
      } else { throw new Error((r && r.error) || 'error'); }
    }).catch(function () {
      estado.textContent = 'No se pudo enviar. Inténtalo de nuevo en unos minutos; si sigue fallando, escribe a ' + (cfg.email || 'la asamblea') + '.';
      estado.className = 'estado error';
    });
  }

  /* ---- Formulario de reserva ---- */
  var form = document.getElementById('form-pedido');
  var estado = document.getElementById('estado-envio');
  var detalleEl = document.getElementById('resumen-detalle');

  function lineas() {
    var out = [];
    document.querySelectorAll('.tallas[data-producto]').forEach(function (grupo) {
      var producto = grupo.getAttribute('data-producto');
      grupo.querySelectorAll('input[type="number"]').forEach(function (input) {
        var n = parseInt(input.value, 10) || 0;
        if (n > 0) out.push({ producto: producto, talla: input.getAttribute('data-talla'), cantidad: n });
      });
    });
    return out;
  }

  function resumen() {
    var ls = lineas();
    detalleEl.textContent = ls.length
      ? ls.map(function (l) { return l.cantidad + ' × ' + l.producto + ' ' + l.talla; }).join(' · ')
      : 'Todavía no has elegido nada.';
  }

  form.addEventListener('input', resumen);
  resumen();

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var ls = lineas();
    if (!ls.length) { estado.textContent = 'Elige al menos una cosa para reservar.'; estado.className = 'estado error'; return; }
    if (!form.nombre.value.trim() || !form.email.value.trim()) { estado.textContent = 'Faltan tu nombre o tu correo.'; estado.className = 'estado error'; return; }
    if (!document.getElementById('privacidad-ok').checked) { estado.textContent = 'Marca la casilla para que podamos escribirte.'; estado.className = 'estado error'; return; }
    enviar({
      tipo: 'reserva',
      lineas: ls,
      nombre: form.nombre.value.trim(),
      email: form.email.value.trim(),
      telefono: form.telefono.value.trim(),
      comentario: form.comentario.value.trim(),
      empresa: form.empresa ? form.empresa.value : ''
    }, estado, form, 'Reserva enviada. Te escribiremos para confirmarla. ¡Gracias!');
  });

  /* ---- Formulario de "quiero ayudar" ---- */
  var formD = document.getElementById('form-donacion');
  var estadoD = document.getElementById('estado-donacion');
  formD.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (!formD.nombre.value.trim() || !formD.contacto.value.trim()) { estadoD.textContent = 'Faltan tu nombre o tu contacto.'; estadoD.className = 'estado error'; return; }
    if (!document.getElementById('privacidad-donacion-ok').checked) { estadoD.textContent = 'Marca la casilla para que podamos escribirte.'; estadoD.className = 'estado error'; return; }
    enviar({
      tipo: 'quiero-ayudar',
      nombre: formD.nombre.value.trim(),
      contacto: formD.contacto.value.trim(),
      mensaje: formD.mensaje.value.trim(),
      empresa: formD.empresa ? formD.empresa.value : ''
    }, estadoD, formD, 'Anotado. Te escribiremos pronto. ¡Gracias!');
  });
})();
