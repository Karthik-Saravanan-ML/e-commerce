const {
  cloudinary,
  configureCloudinary,
  isCloudinaryConfigured,
  hasUploadPreset,
  uploadsDir,
  publicUploadUrl,
} = require('../config/storage');
const fs = require('fs');
const path = require('path');

let cloudinaryReady = false;
let cloudinaryUploadMode = 'none'; // signed | unsigned | none
let lastCloudinaryError = '';

const PERMISSION_ERROR = `Cloudinary API key cannot upload (403). Fix in Cloudinary Dashboard:
  1. Settings → Product environment → API Keys
  2. Use the "Root" key (full permissions) — click Reveal and copy BOTH API Key + Secret to .env
     OR edit your "book" key and enable Upload permission
  3. Easier option: Settings → Upload → Upload presets → Add preset
     - Name: bookverse
     - Signing mode: Unsigned
     - Then add to .env: CLOUDINARY_UPLOAD_PRESET=bookverse
  API Key and Secret MUST be from the same row in Cloudinary.`;

const streamUpload = (buffer, opts) =>
  new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(opts, (err, result) => {
      if (err) {
        err.http_code = err.http_code || err.error?.http_code;
        err.detailedMessage = err.error?.message || err.message;
        return reject(err);
      }
      resolve({
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
      });
    });
    upload.end(buffer);
  });

const buildUploadOpts = ({ folder, resourceType = 'image' }) => ({
  folder: `bookverse/${folder}`,
  resource_type: resourceType === 'auto' ? 'auto' : resourceType,
  use_filename: true,
  unique_filename: true,
  overwrite: false,
});

/** Test real upload — ping alone is not enough (restricted keys can ping but not upload) */
const verifyCloudinary = async () => {
  configureCloudinary();
  cloudinaryReady = false;
  cloudinaryUploadMode = 'none';
  lastCloudinaryError = '';

  if (!isCloudinaryConfigured() && !hasUploadPreset()) {
    return { ok: false, reason: 'Missing Cloudinary credentials. Set CLOUDINARY_URL or CLOUDINARY_* in .env' };
  }

  const tinyPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  );

  // 1) Try signed upload (Root key or key with Upload permission)
  if (isCloudinaryConfigured()) {
    try {
      await streamUpload(tinyPng, buildUploadOpts({ folder: '_healthcheck' }));
      cloudinaryReady = true;
      cloudinaryUploadMode = 'signed';
      return { ok: true, mode: 'signed' };
    } catch (err) {
      lastCloudinaryError = err.detailedMessage || err.message;
      console.warn('Cloudinary signed upload failed:', lastCloudinaryError);
    }
  }

  // 2) Fallback: unsigned upload preset (works without Upload permission on API key)
  const preset = process.env.CLOUDINARY_UPLOAD_PRESET?.trim();
  if (preset) {
    try {
      configureCloudinary();
      await streamUpload(tinyPng, {
        ...buildUploadOpts({ folder: '_healthcheck' }),
        upload_preset: preset,
      });
      cloudinaryReady = true;
      cloudinaryUploadMode = 'unsigned';
      return { ok: true, mode: 'unsigned', preset };
    } catch (err) {
      lastCloudinaryError = err.detailedMessage || err.message;
      return { ok: false, reason: `Upload preset "${preset}" failed: ${lastCloudinaryError}` };
    }
  }

  return {
    ok: false,
    reason: lastCloudinaryError?.includes('permission') || lastCloudinaryError?.includes('403')
      ? PERMISSION_ERROR
      : (lastCloudinaryError || 'Cloudinary upload test failed'),
  };
};

const isCloudinaryReady = () => cloudinaryReady;

const useCloudinaryStorage = () => {
  const mode = (process.env.STORAGE_MODE || 'auto').toLowerCase();
  if (mode === 'local') return false;
  if (!cloudinaryReady) {
    if (mode === 'cloudinary' || process.env.NODE_ENV === 'production') {
      throw new Error(PERMISSION_ERROR);
    }
    return false;
  }
  return true;
};

const uploadBufferToCloudinary = async (buffer, { folder, resourceType = 'image' }) => {
  const baseOpts = buildUploadOpts({ folder, resourceType });

  if (cloudinaryUploadMode === 'unsigned' || (!cloudinaryReady && hasUploadPreset())) {
    const preset = process.env.CLOUDINARY_UPLOAD_PRESET.trim();
    return streamUpload(buffer, { ...baseOpts, upload_preset: preset });
  }

  try {
    return await streamUpload(buffer, baseOpts);
  } catch (err) {
    if (err.http_code === 403 && hasUploadPreset()) {
      const preset = process.env.CLOUDINARY_UPLOAD_PRESET.trim();
      return streamUpload(buffer, { ...baseOpts, upload_preset: preset });
    }
    if (err.http_code === 403) {
      const e = new Error(PERMISSION_ERROR);
      e.http_code = 403;
      throw e;
    }
    throw err;
  }
};

const saveBufferLocally = (buffer, subfolder, originalname, mimetype) => {
  const ext = path.extname(originalname) || extFromMime(mimetype);
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const dir = path.join(uploadsDir, subfolder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), buffer);
  const rel = `${subfolder}/${filename}`;
  return { url: publicUploadUrl(rel), publicId: rel };
};

const extFromMime = (mime = '') => {
  const map = {
    'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif',
    'video/mp4': '.mp4', 'video/webm': '.webm', 'audio/webm': '.webm',
    'audio/mpeg': '.mp3', 'audio/wav': '.wav', 'audio/ogg': '.ogg',
  };
  return map[mime] || '';
};

const persistUpload = async (file, { folder, resourceType = 'image', localSubfolder }) => {
  let useCloud = false;
  try {
    useCloud = useCloudinaryStorage();
  } catch (err) {
    if (process.env.NODE_ENV === 'production') throw err;
    console.warn(err.message);
  }

  if (useCloud) {
    try {
      return await uploadBufferToCloudinary(file.buffer, { folder, resourceType });
    } catch (err) {
      if (process.env.NODE_ENV === 'production') throw err;
      console.warn(`Cloudinary upload failed (${folder}):`, err.message?.split('\n')[0]);
    }
  }

  const local = saveBufferLocally(file.buffer, localSubfolder || folder, file.originalname, file.mimetype);
  return { url: local.url, publicId: local.publicId, resourceType: 'local' };
};

const destroyAsset = async (publicId, resourceType = 'image') => {
  if (!publicId) return;
  if (publicId.startsWith('bookverse/') || !publicId.includes('/')) {
    if (isCloudinaryConfigured()) {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType }).catch(() => {});
    }
    return;
  }
  const localPath = path.join(uploadsDir, publicId);
  if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
};

const getStorageInfo = () => {
  let activeStorage = 'local';
  try {
    activeStorage = useCloudinaryStorage() ? 'cloudinary' : 'local';
  } catch {
    activeStorage = 'local';
  }
  return {
    mode: process.env.STORAGE_MODE || 'auto',
    cloudinaryConfigured: isCloudinaryConfigured(),
    cloudinaryReady,
    cloudinaryUploadMode,
    uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || null,
    activeStorage,
    production: process.env.NODE_ENV === 'production',
  };
};

module.exports = {
  verifyCloudinary,
  isCloudinaryReady,
  useCloudinaryStorage,
  persistUpload,
  destroyAsset,
  getStorageInfo,
  uploadBufferToCloudinary,
  PERMISSION_ERROR,
};
