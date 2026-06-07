const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');

// ─── Cloudinary Config ──────────────────────────────────────────────────────

const configureCloudinary = () => {
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config({ secure: true });
    return;
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
};

configureCloudinary();

const isCloudinaryConfigured = () => {
  if (process.env.CLOUDINARY_URL) return true;
  const name = (process.env.CLOUDINARY_CLOUD_NAME || '').trim();
  const key = (process.env.CLOUDINARY_API_KEY || '').trim();
  const secret = (process.env.CLOUDINARY_API_SECRET || '').trim();
  return name.length > 2 && key.length > 5 && secret.length > 5;
};

const hasUploadPreset = () => Boolean((process.env.CLOUDINARY_UPLOAD_PRESET || '').trim());

const isCloudinaryEnabled = () => isCloudinaryConfigured() || hasUploadPreset();

// ─── Local Uploads Directory (dev fallback only) ────────────────────────────

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const publicUploadUrl = (filename) => {
  const base = process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`;
  return `${base.replace(/\/$/, '')}/uploads/${filename.replace(/^\//, '')}`;
};

// ─── Supabase Storage ───────────────────────────────────────────────────────

let supabase = null;
let supabaseError = null;
let supabaseReady = false;

const getSupabase = () => {
  if (supabase) return supabase;
  if (supabaseError) return null;

  try {
    const url = (process.env.SUPABASE_URL || '').trim();
    const key = (process.env.SUPABASE_SERVICE_KEY || '').trim();

    if (!url || url.includes('your_project') || !key || key.includes('your_key')) {
      supabaseError = 'Supabase credentials not configured — URL or service key contains placeholder values';
      return null;
    }

    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(url, key);
    return supabase;
  } catch (err) {
    supabaseError = err.message;
    console.error('❌ Supabase initialization failed:', supabaseError);
    return null;
  }
};

const isSupabaseConfigured = () => {
  const url = (process.env.SUPABASE_URL || '').trim();
  const key = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
  return Boolean(url && !url.includes('your_project') && key && !key.includes('your_key'));
};

/**
 * Verify Supabase connectivity at startup:
 *  1. Check credentials are not placeholders
 *  2. Test actual connectivity by listing the bucket
 *  3. Create the bucket if it doesn't exist (with public access)
 */
const verifySupabase = async () => {
  supabaseReady = false;
  supabaseError = null;

  if (!isSupabaseConfigured()) {
    supabaseError = 'Supabase credentials not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env';
    return { ok: false, reason: supabaseError };
  }

  const sb = getSupabase();
  if (!sb) {
    return { ok: false, reason: supabaseError || 'Failed to create Supabase client' };
  }

  const bucket = (process.env.SUPABASE_BUCKET || 'bookverse-files').trim();

  try {
    // Try to get the bucket — this tests connectivity + auth + bucket existence
    const { data: bucketData, error: bucketError } = await sb.storage.getBucket(bucket);

    if (bucketError) {
      // If bucket doesn't exist, try to create it
      if (bucketError.message?.includes('not found') || bucketError.statusCode === '404' || bucketError.status === 404) {
        console.log(`📦 Bucket "${bucket}" not found — creating it...`);
        const { error: createError } = await sb.storage.createBucket(bucket, {
          public: true,
          fileSizeLimit: 200 * 1024 * 1024, // 200MB max
          allowedMimeTypes: ['application/pdf', 'audio/*'],
        });

        if (createError) {
          supabaseError = `Failed to create bucket "${bucket}": ${createError.message}`;
          return { ok: false, reason: supabaseError };
        }
        console.log(`✅ Bucket "${bucket}" created with public access`);
      } else {
        supabaseError = `Supabase bucket error: ${bucketError.message}`;
        return { ok: false, reason: supabaseError };
      }
    }

    // Test upload a tiny file to verify write permissions
    const testPath = `_healthcheck/${Date.now()}.txt`;
    const testBuffer = Buffer.from('supabase-healthcheck');
    const { error: uploadError } = await sb.storage
      .from(bucket)
      .upload(testPath, testBuffer, { contentType: 'text/plain', upsert: true });

    if (uploadError) {
      supabaseError = `Supabase upload test failed: ${uploadError.message}`;
      return { ok: false, reason: supabaseError };
    }

    // Clean up test file (best-effort, don't fail if this errors)
    await sb.storage.from(bucket).remove([testPath]).catch(() => {});

    supabaseReady = true;
    return { ok: true, bucket };
  } catch (err) {
    supabaseError = `Supabase verification failed: ${err.message}`;
    return { ok: false, reason: supabaseError };
  }
};

const getSupabaseInfo = () => ({
  configured: isSupabaseConfigured(),
  ready: supabaseReady,
  bucket: (process.env.SUPABASE_BUCKET || 'bookverse-files').trim(),
  error: supabaseReady ? null : (supabaseError || null),
});

// ─── Local Fallback ─────────────────────────────────────────────────────────

const saveBufferLocally = (buffer, subfolder, originalname) => {
  const ext = path.extname(originalname) || '';
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const dir = path.join(uploadsDir, subfolder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), buffer);
  const rel = `${subfolder}/${filename}`;
  return { url: publicUploadUrl(rel), publicId: rel, storage: 'local' };
};

// ─── Upload File (Supabase-first, local fallback in dev only) ───────────────

/**
 * Upload file to Supabase Storage.
 * In production: throws if Supabase is unavailable (no silent local fallback).
 * In development: falls back to local disk with a warning.
 */
const uploadFile = async (buffer, { filePath, contentType, originalname, localSubfolder }) => {
  const bucket = (process.env.SUPABASE_BUCKET || 'bookverse-files').trim();
  const isProduction = process.env.NODE_ENV === 'production';
  const sb = getSupabase();

  if (sb && supabaseReady) {
    const { error } = await sb.storage
      .from(bucket)
      .upload(filePath, buffer, { contentType, upsert: true });

    if (!error) {
      const { data } = sb.storage.from(bucket).getPublicUrl(filePath);
      return { url: data.publicUrl, publicId: filePath, storage: 'supabase' };
    }

    // Supabase upload failed
    const errMsg = `Supabase upload failed: ${error.message}`;
    if (isProduction) {
      throw new Error(errMsg + '. Cannot fall back to local storage in production.');
    }
    console.warn(`⚠️  ${errMsg} — falling back to local storage (dev only)`);
  } else {
    // Supabase not available at all
    const reason = supabaseError || 'Supabase not configured';
    if (isProduction) {
      throw new Error(`Supabase Storage is required in production but unavailable: ${reason}`);
    }
    console.warn(`⚠️  Supabase unavailable (${reason}) — saving locally (dev only)`);
  }

  // Dev-only local fallback
  const subfolder = localSubfolder || path.dirname(filePath).replace(/\\/g, '/');
  return saveBufferLocally(buffer, subfolder, originalname || path.basename(filePath));
};

module.exports = {
  cloudinary,
  configureCloudinary,
  getSupabase,
  isSupabaseConfigured,
  verifySupabase,
  getSupabaseInfo,
  uploadFile,
  isCloudinaryConfigured,
  isCloudinaryEnabled,
  hasUploadPreset,
  uploadsDir,
  publicUploadUrl,
};
