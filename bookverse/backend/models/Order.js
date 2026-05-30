const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  title: String,
  coverImage: String,
  author: String,
  price: Number,
  quantity: { type: Number, default: 1 },
});

const trackingSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['order_placed', 'payment_confirmed', 'packing', 'out_for_delivery', 'delivered', 'cancelled', 'returned'],
  },
  location: String,
  description: String,
  timestamp: { type: Date, default: Date.now },
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  shippingAddress: {
    name: String,
    phone: String,
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String,
  },

  // Pricing
  itemsPrice: Number,
  shippingPrice: { type: Number, default: 0 },
  taxPrice: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  totalPrice: Number,
  couponCode: String,

  // Payment
  paymentMethod: { type: String, enum: ['cod', 'online'], required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  paymentId: String,
  razorpayOrderId: String,
  razorpaySignature: String,
  paidAt: Date,

  // Order status
  orderStatus: {
    type: String,
    enum: ['order_placed', 'payment_confirmed', 'packing', 'out_for_delivery', 'delivered', 'cancelled', 'returned'],
    default: 'order_placed',
  },
  tracking: [trackingSchema],
  deliveredAt: Date,
  cancelledAt: Date,
  cancelReason: String,
  estimatedDelivery: Date,

  // Reminder
  reminderSent: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
