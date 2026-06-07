require('dotenv').config();
require('express-async-errors');
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const connectDB = require('./config/db');
const { initSocket } = require('./socket/socketServer');
const { startCronJobs } = require('./services/cronService');
const { verifyCloudinary, getStorageInfo } = require('./services/cloudinaryService');
const { verifySupabase, getSupabaseInfo } = require('./config/storage');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const bookRoutes = require('./routes/bookRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const cartRoutes = require('./routes/cartRoutes');
const writerRoutes = require('./routes/writerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const chatRoutes = require('./routes/chatRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const recommendRoutes = require('./routes/recommendRoutes');

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));

app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Dev fallback only — production uses Cloudinary URLs
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date(), storage: getStorageInfo(), supabase: getSupabaseInfo() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/writers', writerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/recommend', recommendRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  const result = await verifyCloudinary();
  const info = getStorageInfo();
  if (result.ok) {
    console.log(`☁️  Cloudinary ready — uploads via ${result.mode}${result.preset ? ` (preset: ${result.preset})` : ''}`);
  } else if (info.production) {
    console.error(`❌ Cloudinary upload failed:\n${result.reason}`);
    process.exit(1);
  } else {
    console.warn('⚠️  Cloudinary uploads NOT working — files will save locally until you fix this:');
    console.warn(result.reason);
  }

  // Verify Supabase Storage (PDF/audio uploads)
  const sbResult = await verifySupabase();
  if (sbResult.ok) {
    console.log(`📦 Supabase Storage ready — bucket: ${sbResult.bucket}`);
  } else if (process.env.NODE_ENV === 'production') {
    console.error(`❌ Supabase Storage required in production but failed:\n${sbResult.reason}`);
    process.exit(1);
  } else {
    console.warn('⚠️  Supabase Storage NOT configured — PDF/audio files will save locally (dev only):');
    console.warn(sbResult.reason);
  }

  initSocket(server);
  startCronJobs();

  server.listen(PORT, () => {
    console.log(`🚀 BookVerse API running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = { app, server };
