// ─── errorHandler.js ─────────────────────────────────────────────────────────
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`, err.stack);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server Error';

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    statusCode = 400;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map(e => e.message).join(', ');
    statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid token';
    statusCode = 401;
  }
  if (err.name === 'TokenExpiredError') {
    message = 'Token expired';
    statusCode = 401;
  }

  if (err.name === 'MulterError') {
    statusCode = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'File too large' : err.message;
  }

  if (err.message?.includes('not allowed')) {
    statusCode = 400;
  }

  if (err.message?.includes('Cloudinary') || err.message?.includes('unexpected status code')) {
    statusCode = 502;
    message = 'Image upload failed. Use local storage: set USE_CLOUDINARY=false in .env and restart the server.';
  }

  res.status(statusCode).json({ success: false, message });
};

module.exports = errorHandler;
