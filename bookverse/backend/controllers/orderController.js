const Order = require('../models/Order');
const Book = require('../models/Book');
const { Cart } = require('../models/index');
const { sendEmail } = require('../services/emailService');

// @desc  Create order
// @route POST /api/orders
exports.createOrder = async (req, res) => {
  const { items, shippingAddress, paymentMethod, couponCode } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'No items in order' });
  }

  // Validate books and calculate prices
  let itemsPrice = 0;
  const orderItems = [];

  for (const item of items) {
    const book = await Book.findById(item.book);
    if (!book || book.status !== 'approved') {
      return res.status(400).json({ success: false, message: `Book ${item.book} not available` });
    }
    if (book.isPhysical && book.stock < item.quantity) {
      return res.status(400).json({ success: false, message: `Insufficient stock for "${book.title}"` });
    }

    const price = book.price * (1 - (book.discount || 0) / 100);
    itemsPrice += price * item.quantity;
    orderItems.push({
      book: book._id,
      title: book.title,
      coverImage: book.coverImage,
      author: book.authorName,
      price,
      quantity: item.quantity,
    });
  }

  const shippingPrice = itemsPrice > 499 ? 0 : 49;
  const taxPrice = Math.round(itemsPrice * 0.05); // 5% GST
  let discountAmount = 0;

  // Coupon logic (simple)
  if (couponCode) {
    if (couponCode === 'FIRST20') discountAmount = Math.round(itemsPrice * 0.2);
    if (couponCode === 'SAVE50') discountAmount = 50;
  }

  const totalPrice = itemsPrice + shippingPrice + taxPrice - discountAmount;

  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    paymentMethod,
    couponCode,
    itemsPrice,
    shippingPrice,
    taxPrice,
    discountAmount,
    totalPrice,
    estimatedDelivery,
    tracking: [{
      status: 'order_placed',
      description: 'Your order has been placed successfully',
      timestamp: new Date(),
    }],
  });

  // Reduce stock
  for (const item of orderItems) {
    await Book.findByIdAndUpdate(item.book, { $inc: { stock: -item.quantity } });
  }

  // Clear cart
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

  // Mark books as purchased
  const User = require('../models/User');
  const bookIds = orderItems.map(i => i.book);
  await User.findByIdAndUpdate(req.user._id, { $addToSet: { purchasedBooks: { $each: bookIds } } });

  // Confirmation email
  await sendEmail({
    to: req.user.email,
    subject: `Order Confirmed - #${order._id}`,
    html: `<h2>Order Confirmed!</h2><p>Your order has been placed successfully. Order ID: <strong>${order._id}</strong></p>
    <p>Estimated delivery: ${estimatedDelivery.toDateString()}</p>`,
  });

  res.status(201).json({ success: true, message: 'Order placed successfully', order });
};

// @desc  Get user orders
// @route GET /api/orders/my
exports.getMyOrders = async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const query = { user: req.user._id };
  if (status) query.orderStatus = status;

  const [orders, total] = await Promise.all([
    Order.find(query).sort('-createdAt').skip((page - 1) * limit).limit(Number(limit)),
    Order.countDocuments(query),
  ]);

  res.json({ success: true, total, orders });
};

// @desc  Get single order
// @route GET /api/orders/:id
exports.getOrder = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  res.json({ success: true, order });
};

// @desc  Cancel order
// @route PUT /api/orders/:id/cancel
exports.cancelOrder = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  if (!['order_placed', 'payment_confirmed', 'packing'].includes(order.orderStatus)) {
    return res.status(400).json({ success: false, message: 'Cannot cancel order at this stage' });
  }

  order.orderStatus = 'cancelled';
  order.cancelledAt = new Date();
  order.cancelReason = req.body.reason || 'Cancelled by user';
  order.tracking.push({
    status: 'cancelled',
    description: `Order cancelled: ${order.cancelReason}`,
    timestamp: new Date(),
  });

  // Restore stock
  for (const item of order.items) {
    await Book.findByIdAndUpdate(item.book, { $inc: { stock: item.quantity } });
  }

  await order.save();
  res.json({ success: true, message: 'Order cancelled successfully', order });
};

// ─── ADMIN order management ─────────────────────────────────────────────────

// @desc  Get all orders (admin)
// @route GET /api/orders (admin)
exports.getAllOrders = async (req, res) => {
  const { page = 1, limit = 20, status, userId } = req.query;
  const query = {};
  if (status) query.orderStatus = status;
  if (userId) query.user = userId;

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('user', 'name email phone')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit)),
    Order.countDocuments(query),
  ]);

  res.json({ success: true, total, pages: Math.ceil(total / limit), orders });
};

// @desc  Update order status (admin)
// @route PUT /api/orders/:id/status
exports.updateOrderStatus = async (req, res) => {
  const { status, location, description } = req.body;

  const order = await Order.findById(req.params.id).populate('user', 'email name');
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  order.orderStatus = status;
  order.tracking.push({
    status,
    location: location || '',
    description: description || `Status updated to ${status}`,
    timestamp: new Date(),
  });

  if (status === 'delivered') order.deliveredAt = new Date();
  if (status === 'payment_confirmed') order.paymentStatus = 'paid';

  await order.save();

  // Notify user
  const statusMessages = {
    packing: 'Your order is being packed',
    out_for_delivery: 'Your order is out for delivery',
    delivered: 'Your order has been delivered!',
  };

  if (statusMessages[status]) {
    await sendEmail({
      to: order.user.email,
      subject: `Order Update - ${statusMessages[status]}`,
      html: `<p>Hi ${order.user.name}, ${statusMessages[status]}. Order ID: ${order._id}</p>`,
    });
  }

  res.json({ success: true, message: 'Order status updated', order });
};
