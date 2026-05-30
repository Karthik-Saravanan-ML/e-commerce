import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { MapPin, CreditCard, Truck } from 'lucide-react';
import api from '../../utils/api';
import { initiateRazorpayPayment, formatPrice, getDiscountedPrice } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function Checkout() {
  const navigate = useNavigate();
  const { items } = useSelector((s) => s.cart);
  const { user } = useSelector((s) => s.auth);

  const [address, setAddress] = useState({ name: user?.name || '', phone: user?.phone || '', street: '', city: '', state: '', pincode: '', country: 'India' });
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);

  const subtotal = items.reduce((acc, item) => {
    if (!item.book) return acc;
    return acc + getDiscountedPrice(item.book.price, item.book.discount) * item.quantity;
  }, 0);
  const shipping = subtotal > 499 ? 0 : 49;
  const tax = Math.round(subtotal * 0.05);
  const discountAmount = couponCode === 'FIRST20' ? Math.round(subtotal * 0.2) : couponCode === 'SAVE50' ? 50 : 0;
  const total = subtotal + shipping + tax - discountAmount;

  const placeOrder = async () => {
    if (!address.street || !address.city || !address.pincode) {
      toast.error('Please fill in your complete delivery address');
      return;
    }
    setLoading(true);
    try {
      const orderItems = items.filter(i => i.book).map(i => ({ book: i.book._id, quantity: i.quantity }));
      const { data } = await api.post('/orders', { items: orderItems, shippingAddress: address, paymentMethod, couponCode: couponCode || undefined });

      if (paymentMethod === 'cod') {
        toast.success('Order placed!');
        navigate(`/order-success/${data.order._id}`);
      } else {
        // Razorpay payment
        initiateRazorpayPayment({
          orderId: data.order._id,
          name: user?.name,
          description: `BookVerse Order #${data.order._id}`,
          onSuccess: () => navigate(`/order-success/${data.order._id}`),
          onFailure: () => { toast.error('Payment failed. Your order is saved.'); navigate(`/orders/${data.order._id}`); },
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery address */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <MapPin className="w-5 h-5 text-primary-600" />
              <h2 className="font-semibold text-gray-900">Delivery Address</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="label-sm">Full Name</label><input className="input" value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} /></div>
              <div><label className="label-sm">Phone</label><input className="input" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} /></div>
              <div className="sm:col-span-2"><label className="label-sm">Street Address</label><input className="input" placeholder="House/Flat, Street, Area" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} /></div>
              <div><label className="label-sm">City</label><input className="input" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} /></div>
              <div><label className="label-sm">State</label><input className="input" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} /></div>
              <div><label className="label-sm">PIN Code</label><input className="input" value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} /></div>
              <div><label className="label-sm">Country</label><input className="input" value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} /></div>
            </div>
          </div>

          {/* Payment method */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <CreditCard className="w-5 h-5 text-primary-600" />
              <h2 className="font-semibold text-gray-900">Payment Method</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[['online', '💳 Online Payment', 'UPI, Cards, Net Banking via Razorpay'], ['cod', '💵 Cash on Delivery', 'Pay when your order arrives']].map(([val, label, desc]) => (
                <button key={val} onClick={() => setPaymentMethod(val)}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${paymentMethod === val ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <p className="font-medium text-sm">{label}</p>
                  <p className="text-xs text-gray-500 mt-1">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Coupon */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Have a Coupon?</h2>
            <div className="flex gap-3">
              <input className="input flex-1" placeholder="Enter coupon code (e.g. FIRST20)" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} />
              <button className="btn-secondary px-5">Apply</button>
            </div>
            {discountAmount > 0 && <p className="text-green-600 text-sm mt-2 font-medium">✓ Coupon applied! You save {formatPrice(discountAmount)}</p>}
          </div>
        </div>

        {/* Summary */}
        <div className="card p-6 h-fit sticky top-24 space-y-4">
          <h3 className="font-semibold text-lg">Order Summary</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {items.filter(i => i.book).map((item) => (
              <div key={item._id} className="flex gap-2 text-sm">
                <img src={item.book.coverImage} alt={item.book.title} className="w-10 h-14 object-cover rounded" />
                <div className="flex-1">
                  <p className="font-medium line-clamp-1">{item.book.title}</p>
                  <p className="text-gray-500">×{item.quantity} = {formatPrice(getDiscountedPrice(item.book.price, item.book.discount) * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>
          <hr className="border-gray-100" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Shipping</span><span className={shipping === 0 ? 'text-green-600' : ''}>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">GST</span><span>{formatPrice(tax)}</span></div>
            {discountAmount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatPrice(discountAmount)}</span></div>}
          </div>
          <hr className="border-gray-100" />
          <div className="flex justify-between font-bold text-lg"><span>Total</span><span className="text-primary-700">{formatPrice(total)}</span></div>
          <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
            <Truck className="w-4 h-4 flex-shrink-0" /> Estimated delivery in 3-7 business days
          </div>
          <button onClick={placeOrder} disabled={loading} className="btn-primary w-full py-3 text-base">
            {loading ? 'Placing Order…' : paymentMethod === 'cod' ? '📦 Place Order (COD)' : '💳 Pay & Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
