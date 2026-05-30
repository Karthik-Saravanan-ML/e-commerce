// ═══════════════════════════════════════════════════════════════
// CART CONTROLLER
// ═══════════════════════════════════════════════════════════════
const { Cart, Review } = require('../models/index');
const Book = require('../models/Book');
const User = require('../models/User');
const Order = require('../models/Order');
const { Banner, SubscriptionPlan } = require('../models/index');

// ─── CART ─────────────────────────────────────────────────────
exports.getCart = async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate('items.book', 'title coverImage price discount stock status authorName bookId');
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });
  res.json({ success: true, cart });
};

exports.addToCart = async (req, res) => {
  const { bookId, quantity = 1 } = req.body;
  const book = await Book.findById(bookId);
  if (!book || book.status !== 'approved') return res.status(404).json({ success: false, message: 'Book not available' });

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = new Cart({ user: req.user._id, items: [] });

  const existingIndex = cart.items.findIndex(i => i.book.toString() === bookId);
  if (existingIndex > -1) cart.items[existingIndex].quantity += quantity;
  else cart.items.push({ book: bookId, quantity });

  cart.lastUpdated = new Date();
  // Reset reminder flag when cart is updated
  await User.findByIdAndUpdate(req.user._id, { cartReminderSent: false, cartReminderDate: new Date() });

  await cart.save();
  res.json({ success: true, message: 'Added to cart', cart });
};

exports.updateCartItem = async (req, res) => {
  const { bookId, quantity } = req.body;
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

  const item = cart.items.find(i => i.book.toString() === bookId);
  if (!item) return res.status(404).json({ success: false, message: 'Item not in cart' });

  if (quantity <= 0) cart.items = cart.items.filter(i => i.book.toString() !== bookId);
  else item.quantity = quantity;

  await cart.save();
  res.json({ success: true, cart });
};

exports.removeFromCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });
  cart.items = cart.items.filter(i => i.book.toString() !== req.params.bookId);
  await cart.save();
  res.json({ success: true, cart });
};

exports.clearCart = async (req, res) => {
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
  res.json({ success: true, message: 'Cart cleared' });
};

// ─── WISHLIST / FAVORITES ──────────────────────────────────────
exports.toggleWishlist = async (req, res) => {
  const user = await User.findById(req.user._id);
  const bookId = req.params.bookId;
  const idx = user.wishlist.indexOf(bookId);
  if (idx > -1) user.wishlist.splice(idx, 1);
  else user.wishlist.push(bookId);
  await user.save();
  res.json({ success: true, wishlist: user.wishlist });
};

exports.toggleReadLater = async (req, res) => {
  const user = await User.findById(req.user._id);
  const bookId = req.params.bookId;
  const idx = user.readLater.indexOf(bookId);
  if (idx > -1) user.readLater.splice(idx, 1);
  else user.readLater.push(bookId);
  await user.save();
  res.json({ success: true, readLater: user.readLater });
};

// ─── REVIEWS ──────────────────────────────────────────────────
exports.createReview = async (req, res) => {
  const { rating, comment, title } = req.body;
  const bookId = req.params.bookId;

  const book = await Book.findById(bookId);
  if (!book) return res.status(404).json({ success: false, message: 'Book not found' });

  // Check purchase
  const hasPurchased = req.user.purchasedBooks.includes(bookId);

  const review = await Review.create({
    book: bookId,
    user: req.user._id,
    userName: req.user.name,
    userAvatar: req.user.avatar,
    rating,
    comment,
    title,
    isVerifiedPurchase: hasPurchased,
  });

  // Update book avg rating
  const reviews = await Review.find({ book: bookId });
  const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
  await Book.findByIdAndUpdate(bookId, { ratings: Math.round(avgRating * 10) / 10, numReviews: reviews.length });

  res.status(201).json({ success: true, review });
};

exports.getBookReviews = async (req, res) => {
  const reviews = await Review.find({ book: req.params.bookId })
    .sort('-createdAt')
    .limit(50);
  res.json({ success: true, reviews });
};

exports.likeReview = async (req, res) => {
  const review = await Review.findById(req.params.reviewId);
  if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
  const idx = review.likes.indexOf(req.user._id);
  if (idx > -1) review.likes.splice(idx, 1);
  else review.likes.push(req.user._id);
  await review.save();
  res.json({ success: true, likes: review.likes.length });
};

// ─── BANNERS ──────────────────────────────────────────────────
exports.getBanners = async (req, res) => {
  const { type } = req.query;
  const query = { isActive: true };
  if (type) query.type = type;
  const now = new Date();
  query.$or = [{ startDate: null }, { startDate: { $lte: now } }];
  const banners = await Banner.find(query).sort('order');
  res.json({ success: true, banners });
};

exports.createBanner = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Banner image required' });
  const { title, subtitle, linkTo, linkType, type, discountPercent, couponCode, startDate, endDate, order } = req.body;
  const banner = await Banner.create({
    title, subtitle, linkTo, linkType, type, discountPercent, couponCode, startDate, endDate,
    order: order || 0,
    imageUrl: req.file.path,
    imagePublicId: req.file.filename,
  });
  res.status(201).json({ success: true, banner });
};

exports.updateBanner = async (req, res) => {
  const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, banner });
};

exports.deleteBanner = async (req, res) => {
  const { cloudinary, getSupabase } = require('../config/storage');
  const banner = await Banner.findById(req.params.id);
  if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
  if (banner.imagePublicId) await cloudinary.uploader.destroy(banner.imagePublicId);
  await banner.deleteOne();
  res.json({ success: true, message: 'Banner deleted' });
};

// ─── ADMIN BOOK MANAGEMENT ────────────────────────────────────
exports.adminGetAllBooks = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = {};
  if (status) query.status = status;
  const [books, total] = await Promise.all([
    Book.find(query).populate('author', 'name email').sort('-createdAt').skip((page - 1) * limit).limit(Number(limit)),
    Book.countDocuments(query),
  ]);
  res.json({ success: true, total, pages: Math.ceil(total / limit), books });
};

exports.adminApproveBook = async (req, res) => {
  const { action, rejectionReason } = req.body; // action: 'approve' | 'reject'
  const book = await Book.findById(req.params.id).populate('author', 'email name');
  if (!book) return res.status(404).json({ success: false, message: 'Book not found' });

  book.status = action === 'approve' ? 'approved' : 'rejected';
  if (rejectionReason) book.rejectionReason = rejectionReason;
  await book.save();

  const { sendEmail } = require('../services/emailService');
  await sendEmail({
    to: book.author.email,
    subject: `Book ${action === 'approve' ? 'Approved' : 'Rejected'} - "${book.title}"`,
    html: action === 'approve'
      ? `<p>Congratulations! Your book "<strong>${book.title}</strong>" has been approved and is now live on BookVerse.</p>`
      : `<p>Your book "<strong>${book.title}</strong>" was rejected. Reason: ${rejectionReason}</p>`,
  });

  res.json({ success: true, message: `Book ${action}d`, book });
};

exports.adminUpdateBook = async (req, res) => {
  const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, book });
};

exports.adminDeleteBook = async (req, res) => {
  const { cloudinary, getSupabase } = require('../config/storage');
  const book = await Book.findById(req.params.id);
  if (!book) return res.status(404).json({ success: false, message: 'Book not found' });
  if (book.coverImagePublicId) await cloudinary.uploader.destroy(book.coverImagePublicId);
  await book.deleteOne();
  res.json({ success: true, message: 'Book deleted' });
};

exports.adminToggleBestSeller = async (req, res) => {
  const book = await Book.findById(req.params.id);
  book.isBestSeller = !book.isBestSeller;
  await book.save();
  res.json({ success: true, isBestSeller: book.isBestSeller });
};

exports.adminToggleFeatured = async (req, res) => {
  const book = await Book.findById(req.params.id);
  book.isFeatured = !book.isFeatured;
  await book.save();
  res.json({ success: true, isFeatured: book.isFeatured });
};

// ─── ADMIN ANALYTICS ──────────────────────────────────────────
exports.getAnalytics = async (req, res) => {
  const [
    totalUsers, totalWriters, totalBooks, totalOrders,
    totalRevenue, pendingBooks, recentOrders, topBooks,
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'writer' }),
    Book.countDocuments({ status: 'approved' }),
    Order.countDocuments(),
    Order.aggregate([{ $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
    Book.countDocuments({ status: 'pending' }),
    Order.find().sort('-createdAt').limit(5).populate('user', 'name email'),
    Book.find({ status: 'approved' }).sort('-totalSales').limit(5).select('title totalSales ratings coverImage'),
  ]);

  // Revenue by month (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const revenueByMonth = await Order.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo }, paymentStatus: 'paid' } },
    { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, revenue: { $sum: '$totalPrice' }, orders: { $sum: 1 } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  res.json({
    success: true,
    stats: {
      totalUsers, totalWriters, totalBooks, totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      pendingBooks,
    },
    recentOrders,
    topBooks,
    revenueByMonth,
  });
};

exports.getWriterAnalytics = async (req, res) => {
  const writerId = req.user._id;
  const books = await Book.find({ author: writerId });
  const bookIds = books.map(b => b._id);

  const totalRevenue = books.reduce((acc, b) => acc + (b.sellerRevenue || 0), 0);
  const totalSales = books.reduce((acc, b) => acc + (b.totalSales || 0), 0);
  const avgRating = books.length > 0 ? books.reduce((acc, b) => acc + (b.ratings || 0), 0) / books.length : 0;

  res.json({
    success: true,
    stats: { totalBooks: books.length, totalRevenue, totalSales, avgRating: avgRating.toFixed(1) },
    books: books.map(b => ({ title: b.title, sales: b.totalSales, revenue: b.sellerRevenue, rating: b.ratings })),
  });
};

// ─── ADMIN USER MANAGEMENT ────────────────────────────────────
exports.adminGetUsers = async (req, res) => {
  const { role, page = 1, limit = 20, search } = req.query;
  const query = {};
  if (role) query.role = role;
  if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];

  const [users, total] = await Promise.all([
    User.find(query).select('-password').sort('-createdAt').skip((page - 1) * limit).limit(Number(limit)),
    User.countDocuments(query),
  ]);
  res.json({ success: true, total, pages: Math.ceil(total / limit), users });
};

exports.adminToggleUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  user.isActive = !user.isActive;
  await user.save();
  res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'suspended'}`, isActive: user.isActive });
};
