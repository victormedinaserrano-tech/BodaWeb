# Worker de fotos

Este Worker implementa `POST /api/photos` para GitHub Pages y Cloudinary.

## Configuracion

1. Instala Wrangler: `npm install -g wrangler`.
2. Inicia sesion: `wrangler login`.
3. Edita `wrangler.toml` y sustituye `ALLOWED_ORIGIN` por el origen exacto de GitHub Pages, sin barra final.
4. Desde esta carpeta, crea los secretos:

```text
wrangler secret put CLOUDINARY_CLOUD_NAME
wrangler secret put CLOUDINARY_API_KEY
wrangler secret put CLOUDINARY_API_SECRET
```

5. Publica el Worker:

```text
wrangler deploy
```

6. Copia la URL entregada, termina en `/api/photos`, y escribela en `site-config.js`:

```js
window.WEDDING_UPLOAD_ENDPOINT = 'https://boda-api.TU_SUBDOMINIO.workers.dev/api/photos';
```

No guardes secretos en este repositorio ni en `site-config.js`.