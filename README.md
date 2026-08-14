# BodaWeb

Web estatica preparada para GitHub Pages con fotos gestionadas por un Cloudflare Worker y Cloudinary.

## Subir a GitHub

En la pantalla de carga de GitHub, selecciona todos los archivos y carpetas de esta raiz excepto:

- `.venv/`
- `backend/`
- `github-pages/` (esta vacia y no se utiliza)

No subas nunca `backend/.env`. El archivo `.gitignore` ya protege estos elementos si mas adelante usas Git desde el ordenador.

Despues activa GitHub Pages en `Settings > Pages`, con la rama `main` y la carpeta `/ (root)`.

## Antes de publicar las fotos

1. Despliega el Worker de [workers/boda-api](workers/boda-api).
2. Crea los secretos de Cloudinary en Cloudflare siguiendo la guia de esa carpeta.
3. Copia la URL del Worker en `site-config.js` como `WEDDING_UPLOAD_ENDPOINT` y vuelve a subir ese archivo a GitHub.
4. Cuando tengas el Google Form, pega su URL publica como `WEDDING_RSVP_FORM_URL` en `site-config.js` y vuelve a subirlo.

La guia completa se encuentra en [DESPLIEGUE_GITHUB_CLOUDFLARE.md](DESPLIEGUE_GITHUB_CLOUDFLARE.md).