const multer = require('multer');
const { cloudinary } = require('../config/storage');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');

// Cloudinary storage for images
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'bookverse/images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, crop: 'limit', quality: 'auto' }],
  },
});

// Cloudinary storage for cover images (book)
const coverStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'bookverse/covers',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 600, height: 900, crop: 'fill', quality: 'auto' }],
  },
});

// Cloudinary storage for banners
const bannerStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'bookverse/banners',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1400, height: 500, crop: 'fill', quality: 'auto' }],
  },
});

// Memory storage for files to be uploaded to Supabase
const memoryStorage = multer.memoryStorage();

const fileFilter = (allowed) => (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error(`File type .${ext} not allowed`), false);
};

exports.uploadCover = multer({ storage: coverStorage, fileFilter: fileFilter(['jpg', 'jpeg', 'png', 'webp']), limits: { fileSize: 5 * 1024 * 1024 } });
exports.uploadBanner = multer({ storage: bannerStorage, fileFilter: fileFilter(['jpg', 'jpeg', 'png', 'webp']), limits: { fileSize: 10 * 1024 * 1024 } });
exports.uploadAvatar = multer({ storage: imageStorage, fileFilter: fileFilter(['jpg', 'jpeg', 'png', 'webp']), limits: { fileSize: 2 * 1024 * 1024 } });

// For PDF and audio — memory storage, then send to Supabase
exports.uploadPDF = multer({ storage: memoryStorage, fileFilter: fileFilter(['pdf']), limits: { fileSize: 100 * 1024 * 1024 } });
exports.uploadAudio = multer({ storage: memoryStorage, fileFilter: fileFilter(['mp3', 'wav', 'm4a', 'ogg']), limits: { fileSize: 200 * 1024 * 1024 } });
