const express = require('express');
const router = express.Router();
const payCtrl = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/create-order', protect, payCtrl.createRazorpayOrder);
router.post('/verify', protect, payCtrl.verifyPayment);
router.post('/subscribe', protect, payCtrl.createSubscription);
router.post('/verify-subscription', protect, payCtrl.verifySubscription);

module.exports = router;
