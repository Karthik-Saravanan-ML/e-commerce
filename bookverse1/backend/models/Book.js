const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const chapterSchema = new mongoose.Schema({
  number: Number,
  title: String,
  content: String, // for ebook
  audioUrl: String, // Supabase URL
  audioPublicId: String,
  duration: Number, // in seconds
  isFree: { type: Boolean, default: false },
});

const bookSchema = new mongoose.Schema({
  bookId: { type: String, unique: true, default: () => `BK-${uuidv4().slice(0, 8).toUpperCase()}` },
  title: { type: String, required: true, trim: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  description: { type: String, required: true },
  language: { type: String, default: 'English' },

  // Category & classification
  category: {
    type: String,
    enum: ['fiction', 'non-fiction', 'kids', 'test-prep', 'biography', 'science', 'history', 'self-help', 'romance', 'thriller', 'fantasy', 'other'],
    required: true,
  },
  tags: [String],
  isbn: String,
  publisher: String,
  publishedYear: Number,
  pages: Number,
  edition: String,

  // Media
  coverImage: { type: String, required: true },
  coverImagePublicId: String,
  previewImages: [{ url: String, publicId: String }],

  // E-Commerce
  price: { type: Number, required: true, min: 0 },
  mrp: { type: Number },
  discount: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  isPhysical: { type: Boolean, default: true },

  // Reading Platform
  isEbook: { type: Boolean, default: false },
  softCopyUrl: String, // Supabase URL for full PDF
  softCopyPublicId: String,
  isAudiobook: { type: Boolean, default: false },
  chapters: [chapterSchema],
  totalChapters: { type: Number, default: 0 },

  // Visibility
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'draft'], default: 'pending' },
  rejectionReason: String,
  isFeatured: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  isAvailableForReading: { type: Boolean, default: false },

  // Analytics
  ratings: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  totalSales: { type: Number, default: 0 },
  views: { type: Number, default: 0 },

  // Seller info
  sellerRevenue: { type: Number, default: 0 },
  platformRevenue: { type: Number, default: 0 },
  royaltyPercentage: { type: Number, default: 70 }, // author gets 70%

}, { timestamps: true });

// Indexes for fast search
bookSchema.index({ title: 'text', authorName: 'text', tags: 'text', description: 'text' });
bookSchema.index({ category: 1, status: 1 });
bookSchema.index({ ratings: -1, totalSales: -1 });
bookSchema.index({ status: 1, createdAt: -1 }); // For admin book listing
bookSchema.index({ author: 1, status: 1 }); // For writer's books
bookSchema.index({ isBestSeller: 1, status: 1 }); // For best sellers
bookSchema.index({ isFeatured: 1, status: 1 }); // For featured books

module.exports = mongoose.model('Book', bookSchema);
