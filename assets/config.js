/* Configuración pública de la web. Sin contraseñas ni claves privadas.
   1) pedidosEndpoint: pega aquí la URL /exec de tu aplicación web de Google Apps Script
      (ver apps-script/Code.gs y el README). Mientras esté vacía, el formulario
      funciona en modo demostración y NO envía pedidos.
   2) Revisa privacidad.html con los datos reales y cambia privacidadRevisada a true. */
window.ASAMBLEA_CONFIG = {
  email: 'asambleatomasbreton@gmail.com',
  pedidosEndpoint: 'https://script.google.com/macros/s/AKfycbyhAK2-NWWYi2Y9hY-dp030fZpySHxR3K6KDaxaEpire84gWQ1VjyyUU7dUy52ZA4-M/exec',
  privacidadRevisada: false
};
