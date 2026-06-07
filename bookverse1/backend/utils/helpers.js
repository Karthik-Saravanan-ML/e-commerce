const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = generateToken(user._id);
  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      readingSubscription: user.readingSubscription,
      writerSubscription: user.writerSubscription,
    },
  });
};

const apiResponse = (res, statusCode, success, message, data = {}) => {
  return res.status(statusCode).json({ success, message, ...data });
};

module.exports = { generateToken, sendTokenResponse, apiResponse };
