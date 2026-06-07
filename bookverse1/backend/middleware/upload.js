const multer = require('multer');
const path = require('path');
const { persistUpload } = require('../services/cloudinaryService');

const memory = multer.memoryStorage();

const fileFilterByExt = (allowed) => (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mimeExt = (file.mimetype || '').split('/').pop();
  const ok = allowed.includes(ext) || allowed.includes(mimeExt);
  if (ok) cb(null, true);
  else cb(new Error(`File type .${ext || mimeExt} not allowed. Allowed: ${allowed.join(', ')}`), false);
};

const makeUploadMiddleware = ({ field, allowed, maxSize, folder, resourceType = 'image' }) => {
  const upload = multer({
    storage: memory,
    fileFilter: fileFilterByExt(allowed),
    limits: { fileSize: maxSize },
  });

  return (req, res, next) => {
    upload.single(field)(req, res, async (err) => {
      if (err) return next(err);
      if (!req.file) return next();

      try {
        const result = await persistUpload(req.file, {
          folder,
          resourceType,
          localSubfolder: folder,
        });
        req.file.path = result.url;
        req.file.filename = result.publicId;
        req.file.cloudinaryResourceType = result.resourceType;
        next();
      } catch (uploadErr) {
        next(uploadErr);
      }
    });
  };
};

const IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'webp'];
const CHAT_TYPES = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'webm', 'mov', 'mp3', 'wav', 'm4a', 'ogg'];

exports.uploadCover = {
  single: (field = 'coverImage') => makeUploadMiddleware({
    field, allowed: IMAGE_TYPES, maxSize: 5 * 1024 * 1024, folder: 'covers',
  }),
};

exports.uploadBanner = {
  single: (field = 'image') => makeUploadMiddleware({
    field, allowed: IMAGE_TYPES, maxSize: 10 * 1024 * 1024, folder: 'banners',
  }),
};

exports.uploadAvatar = {
  single: (field = 'avatar') => makeUploadMiddleware({
    field, allowed: IMAGE_TYPES, maxSize: 2 * 1024 * 1024, folder: 'avatars',
  }),
};

exports.uploadChatMedia = {
  single: (field = 'media') => makeUploadMiddleware({
    field, allowed: CHAT_TYPES, maxSize: 25 * 1024 * 1024, folder: 'chat', resourceType: 'auto',
  }),
};

exports.uploadPDF = multer({
  storage: memory,
  fileFilter: fileFilterByExt(['pdf']),
  limits: { fileSize: 100 * 1024 * 1024 },
});

exports.uploadAudio = multer({
  storage: memory,
  fileFilter: fileFilterByExt(['mp3', 'wav', 'm4a', 'ogg', 'webm']),
  limits: { fileSize: 200 * 1024 * 1024 },
});
