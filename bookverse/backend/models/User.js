const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['user', 'writer', 'admin'], default: 'user' },
  phone: { type: String },
  avatar: { type: String, default: '' },
  avatarPublicId: { type: String },

  // E-Commerce
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
  purchasedBooks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],

  // Reading Platform
  readingSubscription: {
    active: { type: Boolean, default: false },
    plan: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    startDate: Date,
    endDate: Date,
    paymentId: String,
  },
  readLater: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
  readingProgress: [{
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
    currentChapter: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    lastRead: { type: Date, default: Date.now },
  }],

  // Writer Subscription (for selling)
  writerSubscription: {
    active: { type: Boolean, default: false },
    plan: String,
    startDate: Date,
    endDate: Date,
    paymentId: String,
  },

  // Writer Social
  writerProfile: {
    bio: String,
    language: { type: String, default: 'en' },
    country: String,
    website: String,
    socialLinks: {
      twitter: String,
      instagram: String,
      facebook: String,
    },
    isPublic: { type: Boolean, default: true },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    friendRequests: [{
      from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
      createdAt: { type: Date, default: Date.now },
    }],
  },

  // Notifications / Reminders
  cartReminderSent: { type: Boolean, default: false },
  cartReminderDate: Date,
  isActive: { type: Boolean, default: true },

  address: [{
    label: String,
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String,
    isDefault: { type: Boolean, default: false },
  }],

  preferredLanguage: { type: String, default: 'en' },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toPublicProfile = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
