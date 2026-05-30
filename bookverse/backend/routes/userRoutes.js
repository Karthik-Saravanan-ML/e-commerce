const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.get('/:id/wishlist', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('wishlist', 'title coverImage price ratings bookId authorName discount');
    res.json({ success: true, wishlist: user?.wishlist || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
