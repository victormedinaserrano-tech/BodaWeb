# BodaWeb

Web estatica publicada en GitHub Pages. Las fotos se suben a Cloudinary y las confirmaciones de asistencia se guardan en Google Sheets, en ambos casos a traves de un Cloudflare Worker.

## Que se sube al repositorio

Todo el contenido de esta carpeta debe quedar en la **raiz** del repositorio, no dentro de una subcarpeta:

- `index.html`, `boda.html`, `rsvp.html`
- `styles.css`, `landing.css`
- `script.js`, `landing.js`, `rsvp.js`, `site-config.js`
- `Iconos/` e `images.jpg`
- `workers/` es opcional, solo como copia de seguridad del codigo del Worker

No subas nunca `.venv/`, `backend/`, `backend/.env` ni `netlify.toml`.

Despues activa GitHub Pages en `Settings > Pages`, con la rama `main` y la carpeta `/ (root)`. El repositorio debe ser publico.

## Puesta en marcha

1. Despliega el Worker de [workers/boda-api](workers/boda-api).
2. Crea en Cloudflare los secretos de Cloudinary y los del RSVP, segun la guia de esa carpeta.
3. Copia la URL del Worker en `site-config.js` como `WEDDING_UPLOAD_ENDPOINT` y vuelve a subir ese archivo.

`WEDDING_RSVP_FORM_URL` debe quedarse vacia: el boton de confirmar asistencia abre `rsvp.html`, el formulario propio. Solo se rellena si algun dia se quiere volver a un Google Form.

## Al modificar CSS o JavaScript

Los HTML cargan los recursos con un numero de version, por ejemplo `script.js?v=2`. Cada vez que cambies un `.css` o un `.js`, incrementa ese numero en los HTML y subelos tambien. Asi los navegadores descargan la version nueva en lugar de reutilizar la guardada en cache.

## Documentacion

- [workers/boda-api/README.md](workers/boda-api/README.md): despliegue tecnico del Worker.
- `REGISTROS_PARA_PUBLICAR.txt`, fuera del repositorio: guia completa de configuracion.