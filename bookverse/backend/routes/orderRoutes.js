const express = require('express');
const router = express.Router();
const orderCtrl = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, orderCtrl.createOrder);
router.get('/my', protect, orderCtrl.getMyOrders);
router.get('/all', protect, authorize('admin'), orderCtrl.getAllOrders);
router.put('/:id/cancel', protect, orderCtrl.cancelOrder);
router.put('/:id/status', protect, authorize('admin'), orderCtrl.updateOrderStatus);
router.get('/:id', protect, orderCtrl.getOrder);

module.exports = router;
