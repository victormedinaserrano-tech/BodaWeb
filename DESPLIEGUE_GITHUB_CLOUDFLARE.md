# Despliegue: GitHub Pages, Cloudflare Worker y Cloudinary

## Objetivo

Esta arquitectura publica la web de la boda en GitHub Pages y usa un Cloudflare Worker como API HTTPS. El Worker sube las fotos a Cloudinary sin exponer credenciales en el navegador.

```text
Invitado -> GitHub Pages -> Cloudflare Worker -> Cloudinary
                              |
                              +-> Google Forms (RSVP)
```

## Servicios

- GitHub Pages: publica los archivos estaticos de la raiz del repositorio.
- Cloudflare Worker: recibe `POST /api/photos`, valida el envio y llama a Cloudinary.
- Cloudinary: conserva las fotos en `fotos/<nombre-normalizado>/`.
- Google Forms: recibe las confirmaciones RSVP. Si se mantiene el wizard actual, el Worker necesitara posteriormente un segundo endpoint para RSVP.

## 1. Preparar el repositorio de GitHub

1. Crea un repositorio privado o publico en GitHub.
2. Sube los archivos del frontend y excluye `backend/.env` y cualquier clave.
3. En GitHub, abre `Settings > Pages`.
4. Selecciona `Deploy from a branch`, la rama principal y la carpeta `/ (root)`.
5. Copia la URL HTTPS que GitHub Pages entrega, por ejemplo `https://usuario.github.io/nombre-repositorio/`.

Si el sitio se publica en un repositorio de proyecto, las rutas relativas existentes (`styles.css`, `script.js`, `rsvp.html`) funcionan sin cambios.

## 2. Crear el Worker en Cloudflare

1. Crea una cuenta de Cloudflare y entra en `Workers & Pages`.
2. Crea un Worker nuevo, por ejemplo `boda-api`.
3. Configura una ruta o usa la URL HTTPS asignada por Cloudflare, por ejemplo `https://boda-api.<subdominio>.workers.dev`.
4. El codigo del endpoint `POST /api/photos` ya esta en `workers/boda-api/src/index.js`.
  - Recibe `guestName` y una o varias entradas `photos` mediante `multipart/form-data`.
  - Limita cantidad, tamano y formatos de imagen.
  - Normaliza el nombre del invitado.
  - Reenvia cada foto a la API de carga firmada de Cloudinary en `fotos/<nombre-normalizado>/`.
  - Devuelve HTTP 201, `count`, `guestName`, `publicId` y `url`.
5. En `workers/boda-api/wrangler.toml`, confirma que `ALLOWED_ORIGIN` es `https://victormedinaserrano-tech.github.io`. El Worker responde a solicitudes `OPTIONS` y solo acepta peticiones desde ese origen.

## 3. Guardar secretos en Cloudflare

En `Worker > Settings > Variables and Secrets`, crea secretos, nunca variables visibles, para:

```text
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

No subas estos valores a GitHub ni los incluyas en archivos JavaScript, HTML, `wrangler.toml` o documentos.

Como variable no secreta, configura:

```text
ALLOWED_ORIGIN=https://usuario.github.io
```

Si GitHub Pages usa un dominio propio, `ALLOWED_ORIGIN` debe ser ese dominio HTTPS exacto.

## 4. Conectar el frontend

Antes de cargar `script.js` en `boda.html`, define la URL publica del Worker:

```html
<script>
  window.WEDDING_UPLOAD_ENDPOINT = 'https://boda-api.<subdominio>.workers.dev/api/photos';
</script>
<script src="script.js"></script>
```

El valor contiene solo una URL publica, no una clave.

Para RSVP, el boton puede abrir el enlace publico del Google Form. Si se conserva `rsvp.html`, debera migrarse su guardado actual a Google Forms o a un endpoint adicional del Worker.

## 5. Pruebas antes de publicar

1. Abre la URL de GitHub Pages desde el movil usando datos moviles.
2. Sube una imagen pequena y confirma el mensaje de exito.
3. Comprueba en Cloudinary que esta bajo `fotos/<nombre-normalizado>/`.
4. Prueba una extension no permitida y confirma que recibe un error claro.
5. Verifica la confirmacion RSVP por separado.

## Estado de migracion

- El frontend actual usa `site-config.js` para recibir la URL publica del Worker y el enlace de Google Forms.
- El backend Flask en `backend/` queda como referencia local y no se desplegara en esta arquitectura.
- El Worker ya esta implementado; faltan crear sus secretos, desplegarlo y pegar su URL en `site-config.js`.
- Para RSVP falta crear el Google Form y pegar su URL publica en `site-config.js`.