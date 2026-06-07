const User = require('../models/User');
const { sendTokenResponse } = require('../utils/helpers');
const { cloudinary } = require('../config/storage');
const crypto = require('crypto');
const { sendEmail } = require('../services/emailService');

// @desc  Register user
// @route POST /api/auth/register
exports.register = async (req, res) => {
  const { name, email, password, role, phone, preferredLanguage } = req.body;

  const allowedRoles = ['user', 'writer'];
  const userRole = allowedRoles.includes(role) ? role : 'user';
  const lang = preferredLanguage || 'en';

  const existing = await User.findOne({ email: email?.toLowerCase?.() || email });
  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'An account with this email already exists. Please sign in instead.',
    });
  }

  const userData = {
    name, email, password,
    role: userRole,
    phone: phone || undefined,
    preferredLanguage: lang,
  };

  // For writers, pre-set writerProfile language so chat translation works immediately
  if (userRole === 'writer') {
    userData.writerProfile = { language: lang, isPublic: true, friends: [], friendRequests: [], followers: [], following: [] };
  }

  const user = await User.create(userData);
  sendTokenResponse(user, 201, res, 'Registration successful');
};

// @desc  Login
// @route POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  if (!user.isActive) {
    return res.status(403).json({ success: false, message: 'Account suspended. Contact support.' });
  }

  sendTokenResponse(user, 200, res, 'Login successful');
};

// @desc  Get current user
// @route GET /api/auth/me
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('wishlist', 'title coverImage price bookId')
    .populate('readLater', 'title coverImage bookId')
    .populate('purchasedBooks', 'title coverImage bookId isEbook isAudiobook');

  res.json({ success: true, user });
};

// @desc  Update profile
// @route PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  const { name, phone, preferredLanguage, address } = req.body;
  const updateFields = {};
  if (name) updateFields.name = name;
  if (phone) updateFields.phone = phone;
  if (preferredLanguage) updateFields.preferredLanguage = preferredLanguage;
  if (address) updateFields.address = address;

  const user = await User.findByIdAndUpdate(req.user._id, updateFields, { new: true, runValidators: true });
  res.json({ success: true, message: 'Profile updated', user });
};

// @desc  Update avatar
// @route PUT /api/auth/avatar
exports.updateAvatar = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No image file provided' });

  // Delete old avatar from cloudinary
  const user = await User.findById(req.user._id);
  if (user.avatarPublicId) {
    await cloudinary.uploader.destroy(user.avatarPublicId);
  }

  user.avatar = req.file.path;
  user.avatarPublicId = req.file.filename;
  await user.save();

  res.json({ success: true, message: 'Avatar updated', avatar: user.avatar });
};

// @desc  Update writer profile
// @route PUT /api/auth/writer-profile
exports.updateWriterProfile = async (req, res) => {
  const { bio, language, country, website, socialLinks, isPublic } = req.body;
  const user = await User.findById(req.user._id);

  user.writerProfile = {
    ...user.writerProfile,
    bio: bio || user.writerProfile?.bio,
    language: language || user.writerProfile?.language,
    country: country || user.writerProfile?.country,
    website: website || user.writerProfile?.website,
    socialLinks: socialLinks || user.writerProfile?.socialLinks,
    isPublic: isPublic !== undefined ? isPublic : user.writerProfile?.isPublic,
    followers: user.writerProfile?.followers || [],
    following: user.writerProfile?.following || [],
    friends: user.writerProfile?.friends || [],
    friendRequests: user.writerProfile?.friendRequests || [],
  };

  await user.save();
  res.json({ success: true, message: 'Writer profile updated', writerProfile: user.writerProfile });
};

// @desc  Forgot Password
// @route POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(404).json({ success: false, message: 'No user with that email' });

  const resetToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 min
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  await sendEmail({
    to: user.email,
    subject: 'BookVerse Password Reset',
    html: `<p>Reset your password: <a href="${resetUrl}">${resetUrl}</a>. Link expires in 10 minutes.</p>`,
  });

  res.json({ success: true, message: 'Password reset link sent to your email' });
};

// @desc  Reset Password
// @route PUT /api/auth/reset-password/:token
exports.resetPassword = async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res, 'Password reset successful');
};
