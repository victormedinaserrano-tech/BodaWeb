const UPLOAD_BATCH_SIZE = 5;
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
]);

const DEFAULT_ALLOWED_ORIGINS = ['https://victormedinaserrano-tech.github.io'];

function allowedOrigins(env) {
  const configured = String(env.ALLOWED_ORIGIN || '')
    .split(',')
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean);
  return configured.length ? configured : DEFAULT_ALLOWED_ORIGINS;
}

function isAllowedOrigin(request, env) {
  const origin = request.headers.get('Origin');
  return Boolean(origin) && allowedOrigins(env).includes(origin.replace(/\/$/, ''));
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin');
  if (!origin) {
    return {};
  }
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin(request, env) ? origin : allowedOrigins(env)[0],
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

function jsonResponse(request, env, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(request, env),
    },
  });
}

function normalizeGuestName(rawName) {
  const name = String(rawName || '').trim();
  if (!name) {
    return 'invitado';
  }
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'invitado';
}

function normalizeFileStem(fileName, index) {
  const stem = String(fileName || `foto-${index + 1}`)
    .replace(/\.[^/.]+$/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return stem || `foto-${index + 1}`;
}

async function sha1Hex(value) {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function createCloudinarySignature(parameters, apiSecret) {
  const signatureBase = Object.entries(parameters)
    .filter(([, value]) => value !== undefined && value !== '')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  return sha1Hex(`${signatureBase}${apiSecret}`);
}

async function uploadToCloudinary(file, guestName, index, env) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const uniqueId = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  const publicId = `${timestamp}-${index + 1}-${normalizeFileStem(file.name, index)}-${uniqueId}`;
  const folder = `fotos/${guestName}`;
  const context = `guest_name=${guestName}|original_name=${file.name || 'foto'}`;
  const signatureParameters = {
    context,
    folder,
    public_id: publicId,
    tags: `boda,invitado:${guestName}`,
    timestamp,
  };
  const signature = await createCloudinarySignature(signatureParameters, env.CLOUDINARY_API_SECRET);
  const uploadData = new FormData();

  Object.entries(signatureParameters).forEach(([key, value]) => uploadData.append(key, value));
  uploadData.append('api_key', env.CLOUDINARY_API_KEY);
  uploadData.append('signature', signature);
  uploadData.append('file', file, file.name || `${publicId}.jpg`);

  const cloudinaryResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(env.CLOUDINARY_CLOUD_NAME)}/image/upload`,
    { method: 'POST', body: uploadData },
  );
  const result = await cloudinaryResponse.json().catch(() => ({}));
  if (!cloudinaryResponse.ok) {
    throw new Error(result.error?.message || 'Cloudinary no ha podido guardar la foto.');
  }

  return {
    originalName: file.name,
    mimeType: file.type,
    storedAs: publicId,
    publicId: result.public_id,
    url: result.secure_url,
  };
}

async function handlePhotoUpload(request, env) {
  const formData = await request.formData();
  const guestName = normalizeGuestName(formData.get('guestName') || formData.get('name'));
  const files = formData.getAll('photos').filter((entry) => entry instanceof File);

  if (!files.length) {
    return jsonResponse(request, env, { error: 'Debes enviar al menos una foto.' }, 400);
  }
  for (const file of files) {
    if (!ALLOWED_IMAGE_TYPES.has(file.type.toLowerCase())) {
      return jsonResponse(request, env, { error: 'Solo se permiten imagenes JPEG, PNG, WEBP, GIF, HEIC o HEIF.' }, 400);
    }
  }

  try {
    // Se sube por lotes para no agotar los limites de subpeticiones del Worker con envios grandes.
    const uploaded = [];
    for (let start = 0; start < files.length; start += UPLOAD_BATCH_SIZE) {
      const batch = files.slice(start, start + UPLOAD_BATCH_SIZE);
      const results = await Promise.all(
        batch.map((file, offset) => uploadToCloudinary(file, guestName, start + offset, env)),
      );
      uploaded.push(...results);
    }
    return jsonResponse(request, env, {
      message: 'Fotos subidas correctamente.',
      guestName,
      count: uploaded.length,
      files: uploaded,
    }, 201);
  } catch (error) {
    console.error('Cloudinary upload failed', error);
    return jsonResponse(request, env, { error: error?.message || 'No se ha podido completar la subida de fotos.' }, 502);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const allowedOrigin = isAllowedOrigin(request, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }
    if (url.pathname === '/health' && request.method === 'GET') {
      return jsonResponse(request, env, {
        ok: true,
        allowedOrigins: allowedOrigins(env),
        hasCloudName: Boolean(env.CLOUDINARY_CLOUD_NAME),
        hasApiKey: Boolean(env.CLOUDINARY_API_KEY),
        hasApiSecret: Boolean(env.CLOUDINARY_API_SECRET),
      });
    }
    if (url.pathname === '/api/photos' && request.method === 'POST') {
      if (!allowedOrigin) {
        return jsonResponse(request, env, { error: 'Origen no autorizado.' }, 403);
      }
      return handlePhotoUpload(request, env);
    }
    return jsonResponse(request, env, { error: 'Ruta no encontrada.' }, 404);
  },
};