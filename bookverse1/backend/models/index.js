const mongoose = require('mongoose');

// ─── Review Model ────────────────────────────────────────────────────────────
const reviewSchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: String,
  userAvatar: String,
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: String,
  comment: { type: String, required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isVerifiedPurchase: { type: Boolean, default: false },
}, { timestamps: true });

reviewSchema.index({ book: 1, user: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

// ─── Cart Model ──────────────────────────────────────────────────────────────
const cartItemSchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  quantity: { type: Number, default: 1 },
  addedAt: { type: Date, default: Date.now },
});

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [cartItemSchema],
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

const Cart = mongoose.model('Cart', cartSchema);

// ─── Chat / Message Model ─────────────────────────────────────────────────────
const messageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalText: { type: String, required: true },
  translatedTexts: [{
    language: String,
    text: String,
  }],
  messageType: { type: String, enum: ['text', 'image', 'video', 'audio', 'file'], default: 'text' },
  fileUrl: String,
  fileName: String,
  mimeType: String,
  isRead: { type: Boolean, default: false },
  readAt: Date,
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);

const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  lastMessageAt: { type: Date, default: Date.now },
  isGroup: { type: Boolean, default: false },
  groupName: String,
}, { timestamps: true });

const Conversation = mongoose.model('Conversation', conversationSchema);

// ─── Banner Model ─────────────────────────────────────────────────────────────
const bannerSchema = new mongoose.Schema({
  title: String,
  subtitle: String,
  imageUrl: { type: String, required: true },
  imagePublicId: String,
  linkTo: String, // book id, category, etc.
  linkType: { type: String, enum: ['book', 'category', 'external', 'subscription'] },
  type: { type: String, enum: ['main', 'discount', 'reading'], default: 'main' },
  discountPercent: Number,
  couponCode: String,
  isActive: { type: Boolean, default: true },
  startDate: Date,
  endDate: Date,
  order: { type: Number, default: 0 },
}, { timestamps: true });

const Banner = mongoose.model('Banner', bannerSchema);

// ─── Subscription Plan Model ──────────────────────────────────────────────────
const subscriptionPlanSchema = new mongoose.Schema({
  name: String,
  type: { type: String, enum: ['reading', 'writer'] },
  duration: { type: String, enum: ['monthly', 'yearly'] },
  price: Number,
  features: [String],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);

module.exports = { Review, Cart, Message, Conversation, Banner, SubscriptionPlan };
