# Web de la Asamblea Tomás Bretón

Web estática para reservas de camisetas y chapas y avisos de "quiero ayudar".
No cobra nada online: cada solicitud llega a una hoja de cálculo de Google y al
correo asambleatomasbreton@gmail.com, y la asamblea contacta después con cada
persona para acordar pago (Bizum, efectivo, etc.) y entrega.

## Qué hay que confirmar antes de publicar (IMPORTANTE)

Todo lo marcado como "provisional" en la web:
- Catálogo real: productos, modelos de chapas, diseños y tallas.
- Precios reales: la web muestra "Precio por confirmar" hasta que la asamblea los fije. No hay ningún precio inventado.
- Textos de "Quiénes somos" y la presentación de la asamblea.
- Revisar privacidad.html y poner `privacidadRevisada: true` en assets/config.js.

## Estructura

- `index.html` - la web (una página).
- `privacidad.html` - información de privacidad (revisar antes de publicar).
- `assets/style.css` - el diseño.
- `assets/site.js` - la lógica de los formularios.
- `assets/config.js` - configuración pública (correo y endpoint de pedidos).
- `apps-script/Code.gs` - el receptor que guarda los pedidos en Google Sheets
  y avisa por correo. Las instrucciones de puesta en marcha están dentro.

## Cómo conectar los pedidos (resumen)

1. Crea la hoja "Pedidos" en Google Sheets con la cuenta de la asamblea.
2. Pega `apps-script/Code.gs` en script.google.com, configura SHEET_ID y
   publica como aplicación web (instrucciones detalladas dentro del archivo).
3. Copia la URL /exec en `assets/config.js` → `pedidosEndpoint`.
4. Sube todo al repositorio y haz una reserva de prueba.

## Dónde alojar la web

Guardar el código en GitHub es solo eso: guardarlo. Para que la web esté
visible hace falta alojarla. Ojo con GitHub Pages: sus reglas de uso no
permiten webs "orientadas principalmente a facilitar transacciones
comerciales", y no aclaran si una web de reservas de una asamblea sin ánimo
de lucro entra ahí. Opciones sin esa duda:

- Cloudflare Pages: gratis, sin restricción comercial equivalente en sus
  límites publicados. Se conecta al repositorio de GitHub y publica solo.
- Netlify: gratis, también conecta con GitHub.

En ambos, cada cambio que subas al repositorio actualiza la web.

## Cómo editar

El código está pensado para editarse sin instalar nada: desde github.com,
entra en el repositorio, abre el archivo y pulsa el lápiz (Edit). Los
productos y tallas están en `index.html`; los colores y el estilo en
`assets/style.css`.
