const crypto = require('crypto');
const Order = require('../models/Order');
const User = require('../models/User');
const Book = require('../models/Book');

const getRazorpay = () => {
  const key = process.env.RAZORPAY_KEY_ID || '';
  const secret = process.env.RAZORPAY_KEY_SECRET || '';
  if (!key || key.includes('xxxx')) return null;
  const Razorpay = require('razorpay');
  return new Razorpay({ key_id: key, key_secret: secret });
};

// @desc  Create Razorpay order
exports.createRazorpayOrder = async (req, res) => {
  const razorpay = getRazorpay();
  if (!razorpay) return res.status(503).json({ success: false, message: 'Payment gateway not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env' });

  const { orderId } = req.body;
  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(order.totalPrice * 100),
    currency: 'INR',
    receipt: `order_${order._id}`,
    notes: { orderId: order._id.toString() },
  });

  order.razorpayOrderId = razorpayOrder.id;
  await order.save();

  res.json({ success: true, razorpayOrderId: razorpayOrder.id, amount: razorpayOrder.amount, currency: razorpayOrder.currency, keyId: process.env.RAZORPAY_KEY_ID });
};

// @desc  Verify payment
exports.verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

  const expectedSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy')
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSig !== razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Payment verification failed' });
  }

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  order.paymentStatus = 'paid';
  order.paymentId = razorpay_payment_id;
  order.razorpaySignature = razorpay_signature;
  order.paidAt = new Date();
  order.orderStatus = 'payment_confirmed';
  order.tracking.push({ status: 'payment_confirmed', description: 'Payment received and confirmed', timestamp: new Date() });
  await order.save();

  // Update book sales stats
  for (const item of order.items) {
    const saleAmount = item.price * item.quantity;
    await Book.findByIdAndUpdate(item.book, {
      $inc: { totalSales: item.quantity, sellerRevenue: saleAmount * 0.7, platformRevenue: saleAmount * 0.3 },
    });
  }

  res.json({ success: true, message: 'Payment verified', order });
};

// @desc  Create subscription Razorpay order
exports.createSubscription = async (req, res) => {
  const razorpay = getRazorpay();
  if (!razorpay) return res.status(503).json({ success: false, message: 'Payment gateway not configured' });

  const { planType, subscriptionType } = req.body;
  const prices = { reading: { monthly: 99, yearly: 799 }, writer: { monthly: 299, yearly: 2499 } };
  const amount = prices[subscriptionType]?.[planType];
  if (!amount) return res.status(400).json({ success: false, message: 'Invalid plan' });

  const razorpayOrder = await razorpay.orders.create({
    amount: amount * 100,
    currency: 'INR',
    receipt: `sub_${req.user._id}_${Date.now()}`,
    notes: { userId: req.user._id.toString(), subscriptionType, planType },
  });

  res.json({ success: true, razorpayOrderId: razorpayOrder.id, amount: razorpayOrder.amount, currency: 'INR', keyId: process.env.RAZORPAY_KEY_ID, meta: { subscriptionType, planType } });
};

// @desc  Verify subscription payment
exports.verifySubscription = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, subscriptionType, planType } = req.body;

  const expectedSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy')
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSig !== razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Subscription payment verification failed' });
  }

  const user = await User.findById(req.user._id);
  const now = new Date();
  const endDate = new Date(now);
  if (planType === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1);
  else endDate.setMonth(endDate.getMonth() + 1);

  const subData = { active: true, plan: planType, startDate: now, endDate, paymentId: razorpay_payment_id };
  if (subscriptionType === 'reading') user.readingSubscription = subData;
  if (subscriptionType === 'writer') user.writerSubscription = subData;
  await user.save();

  res.json({ success: true, message: 'Subscription activated', user });
};
