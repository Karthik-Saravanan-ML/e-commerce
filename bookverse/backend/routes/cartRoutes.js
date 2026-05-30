const express = require('express');
const router = express.Router();
const mainCtrl = require('../controllers/mainController');
const { protect } = require('../middleware/auth');

router.get('/', protect, mainCtrl.getCart);
router.post('/add', protect, mainCtrl.addToCart);
router.put('/update', protect, mainCtrl.updateCartItem);
router.delete('/remove/:bookId', protect, mainCtrl.removeFromCart);
router.delete('/clear', protect, mainCtrl.clearCart);
router.put('/wishlist/:bookId', protect, mainCtrl.toggleWishlist);
router.put('/read-later/:bookId', protect, mainCtrl.toggleReadLater);

module.exports = router;
