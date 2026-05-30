import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Package, Truck, MapPin, Clock, XCircle, ChevronRight } from 'lucide-react';
import api from '../../utils/api';
import { formatPrice, formatDate, ORDER_STATUSES } from '../../utils/helpers';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

// ─── OrderSuccess ─────────────────────────────────────────────────────────────
export function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    api.get(`/orders/${id}`).then(r => setOrder(r.data.order)).catch(() => {});
  }, [id]);

  return (
    <div className="max-w-2xl mx-auto px-6 py-20 text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed!</h1>
      <p className="text-gray-500 mb-2">Thank you for your purchase. We'll send a confirmation to your email.</p>
      {order && <p className="text-sm text-gray-400 mb-8 font-mono">Order ID: {order._id}</p>}
      <div className="flex gap-3 justify-center">
        <Link to={`/orders/${id}`} className="btn-primary px-6 py-3">Track Order</Link>
        <Link to="/shop" className="btn-secondary px-6 py-3">Continue Shopping</Link>
      </div>
    </div>
  );
}

// ─── OrderDetail ──────────────────────────────────────────────────────────────
export function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then(r => setOrder(r.data.order))
      .finally(() => setLoading(false));
  }, [id]);

  const cancelOrder = async () => {
    if (!window.confirm('Cancel this order?')) return;
    setCancelling(true);
    try {
      const { data } = await api.put(`/orders/${id}/cancel`, { reason: 'Cancelled by customer' });
      setOrder(data.order);
      toast.success('Order cancelled');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot cancel');
    } finally { setCancelling(false); }
  };

  if (loading) return <LoadingSpinner />;
  if (!order) return <div className="text-center py-20 text-gray-400">Order not found</div>;

  const STEPS = ['order_placed', 'payment_confirmed', 'packing', 'out_for_delivery', 'delivered'];
  const currentStep = STEPS.indexOf(order.orderStatus);
  const isCancelled = order.orderStatus === 'cancelled';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/orders" className="text-sm text-primary-600 hover:underline">My Orders</Link>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-600 font-mono">{order._id}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-5">
          {/* Tracking timeline */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary-600" /> Order Tracking
            </h2>
            {isCancelled ? (
              <div className="flex items-center gap-3 text-red-600 bg-red-50 rounded-xl p-4">
                <XCircle className="w-6 h-6" />
                <div>
                  <p className="font-semibold">Order Cancelled</p>
                  <p className="text-sm">{order.cancelReason}</p>
                  {order.cancelledAt && <p className="text-xs mt-1">{formatDate(order.cancelledAt)}</p>}
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-200" />
                {STEPS.map((step, idx) => {
                  const done = idx <= currentStep;
                  const active = idx === currentStep;
                  const info = ORDER_STATUSES[step];
                  const trackEntry = order.tracking?.find(t => t.status === step);
                  return (
                    <div key={step} className="relative flex items-start gap-4 pb-6 last:pb-0">
                      <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${done ? 'bg-primary-600 border-primary-600' : 'bg-white border-gray-300'}`}>
                        {done ? <CheckCircle className="w-4 h-4 text-white" /> : <div className="w-2 h-2 rounded-full bg-gray-300" />}
                      </div>
                      <div className={`pt-1 ${done ? 'opacity-100' : 'opacity-40'}`}>
                        <p className={`font-medium text-sm ${active ? 'text-primary-700' : 'text-gray-700'}`}>{info?.label}</p>
                        {trackEntry && (
                          <>
                            <p className="text-xs text-gray-500 mt-0.5">{trackEntry.description}</p>
                            {trackEntry.location && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{trackEntry.location}</p>}
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />{formatDate(trackEntry.timestamp)}</p>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {order.estimatedDelivery && !isCancelled && (
              <div className="mt-4 bg-blue-50 rounded-xl p-3 text-sm text-blue-700 flex items-center gap-2">
                <Truck className="w-4 h-4" /> Estimated delivery: {formatDate(order.estimatedDelivery)}
              </div>
            )}
          </div>

          {/* Items */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Items Ordered</h2>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item._id} className="flex gap-3 items-center">
                  <img src={item.coverImage} alt={item.title} className="w-14 h-20 object-cover rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-2">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.author}</p>
                    <p className="text-sm font-semibold text-primary-700 mt-1">{formatPrice(item.price)} × {item.quantity}</p>
                  </div>
                  <p className="font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Payment summary */}
          <div className="card p-5">
            <h3 className="font-semibold mb-3">Payment</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Method</span><span className="capitalize">{order.paymentMethod}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span>
                <span className={`font-medium capitalize ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>{order.paymentStatus}</span>
              </div>
              <hr className="border-gray-100" />
              <div className="flex justify-between"><span className="text-gray-500">Items</span><span>{formatPrice(order.itemsPrice)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{order.shippingPrice === 0 ? 'FREE' : formatPrice(order.shippingPrice)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>{formatPrice(order.taxPrice)}</span></div>
              {order.discountAmount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatPrice(order.discountAmount)}</span></div>}
              <hr className="border-gray-100" />
              <div className="flex justify-between font-bold"><span>Total</span><span>{formatPrice(order.totalPrice)}</span></div>
            </div>
          </div>

          {/* Delivery address */}
          <div className="card p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-primary-600" />Delivery To</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-medium text-gray-900">{order.shippingAddress?.name}</p>
              <p>{order.shippingAddress?.phone}</p>
              <p>{order.shippingAddress?.street}</p>
              <p>{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
              <p>{order.shippingAddress?.pincode}, {order.shippingAddress?.country}</p>
            </div>
          </div>

          {/* Cancel button */}
          {['order_placed', 'payment_confirmed', 'packing'].includes(order.orderStatus) && (
            <button onClick={cancelOrder} disabled={cancelling}
              className="w-full py-2.5 border border-red-300 text-red-600 rounded-xl text-sm hover:bg-red-50 transition font-medium disabled:opacity-50">
              {cancelling ? 'Cancelling…' : 'Cancel Order'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderDetail;
