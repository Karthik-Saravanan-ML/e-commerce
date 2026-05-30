const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes – verify JWT
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user || !req.user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

// Role-based authorization
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Role '${req.user.role}' is not authorized for this action`,
    });
  }
  next();
};

// Writer subscription guard
const requireWriterSub = async (req, res, next) => {
  const user = req.user;
  if (user.role !== 'writer' && user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Writer access required' });
  }
  if (user.role === 'writer' && (!user.writerSubscription?.active || new Date() > user.writerSubscription.endDate)) {
    return res.status(403).json({ success: false, message: 'Active writer subscription required to publish books' });
  }
  next();
};

// Reading subscription guard
const requireReadingSub = async (req, res, next) => {
  const user = req.user;
  if (user.role === 'admin') return next();
  const sub = user.readingSubscription;
  if (!sub?.active || new Date() > sub.endDate) {
    return res.status(403).json({ success: false, message: 'Reading subscription required' });
  }
  next();
};

module.exports = { protect, authorize, requireWriterSub, requireReadingSub };
