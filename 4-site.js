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

  var padelEl = document.getElementById('quiero-padel');
  var modalidadEl = document.getElementById('padel-modalidad');
  function actualizarPadel() {
    document.getElementById('padel-datos').hidden = !padelEl.checked;
    document.getElementById('padel-pareja').hidden = modalidadEl.value !== 'pareja';
  }

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
    if (padelEl.checked) {
      var pareja = modalidadEl.value === 'pareja';
      out.push({ producto: 'Inscripción torneo de pádel', detalle: pareja ? 'Por parejas' : 'Individual', precio: 20, cantidad: pareja ? 2 : 1 });
    }
    return out;
  }

  function total(ls) {
    return ls.reduce(function (s, l) { return s + l.precio * l.cantidad; }, 0);
  }

  function resumen() {
    actualizarPadel();
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
    if (!ls.length && !donativo) { estado.textContent = 'Elige productos, inscripción al torneo o «Quiero colaborar».'; estado.className = 'estado error'; return; }
    if (padelEl.checked && (!document.getElementById('padel-nivel').value || (modalidadEl.value === 'pareja' && !document.getElementById('padel-pareja-nivel').value))) { estado.textContent = 'Indica el nivel de juego de cada persona inscrita.'; estado.className = 'estado error'; return; }
    if (padelEl.checked && modalidadEl.value === 'pareja' && !document.getElementById('padel-pareja-nombre').value.trim()) { estado.textContent = 'Indica el nombre de tu pareja de juego.'; estado.className = 'estado error'; return; }
    if (padelEl.checked && !document.getElementById('padel-edad').checked) { estado.textContent = 'Confirma que todas las personas inscritas tienen al menos 12 años.'; estado.className = 'estado error'; return; }
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
      comentario: [padelEl.checked ? 'Pádel: ' + (modalidadEl.value === 'pareja' ? 'por parejas' : 'individual') +
          (document.getElementById('padel-nivel').value ? '; nivel: ' + document.getElementById('padel-nivel').value : '') +
          (modalidadEl.value === 'pareja' ? '; pareja: ' + document.getElementById('padel-pareja-nombre').value.trim() +
            (document.getElementById('padel-pareja-nivel').value ? '; nivel pareja: ' + document.getElementById('padel-pareja-nivel').value : '') : '') + '; edad mínima 12 años confirmada' : '', form.comentario.value.trim(), form.clase.value.trim() ? 'Clase: ' + form.clase.value.trim() : ''].filter(Boolean).join('\n'),
      empresa: form.empresa ? form.empresa.value : ''
    }, estado, form, 'Hemos procesado tu reserva. ¡Gracias!');
  });
})();
