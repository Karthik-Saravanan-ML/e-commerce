import api from './api';
import toast from 'react-hot-toast';

// ─── Format price ─────────────────────────────────────────────
export const formatPrice = (price) => {
  if (price == null || isNaN(price)) return '₹0';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
};

// ─── Format date ──────────────────────────────────────────────
export const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

// ─── Razorpay payment ─────────────────────────────────────────
export const initiateRazorpayPayment = async ({ orderId, amount, currency = 'INR', name, description, onSuccess, onFailure }) => {
  try {
    const { data } = await api.post('/payments/create-order', { orderId });

    const options = {
      key: data.keyId,
      amount: data.amount,
      currency: data.currency || currency,
      name: 'BookVerse',
      description,
      order_id: data.razorpayOrderId,
      handler: async (response) => {
        try {
          const verifyRes = await api.post('/payments/verify', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            orderId,
          });
          toast.success('Payment successful!');
          onSuccess && onSuccess(verifyRes.data);
        } catch {
          toast.error('Payment verification failed');
          onFailure && onFailure();
        }
      },
      prefill: { name, email: '', contact: '' },
      theme: { color: '#6366f1' },
      modal: { ondismiss: () => { toast('Payment cancelled'); onFailure && onFailure(); } },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (err) {
    toast.error('Could not initiate payment');
    onFailure && onFailure();
  }
};

// ─── Razorpay subscription payment ───────────────────────────
export const initiateSubscriptionPayment = async ({ subscriptionType, planType, userName, onSuccess }) => {
  try {
    const { data } = await api.post('/payments/subscribe', { subscriptionType, planType });

    if (data.devMode) {
      const verifyRes = await api.post('/payments/verify-subscription', {
        devMode: true,
        subscriptionType,
        planType,
      });
      toast.success('Subscription activated!');
      onSuccess && onSuccess(verifyRes.data);
      return;
    }

    const options = {
      key: data.keyId,
      amount: data.amount,
      currency: 'INR',
      name: 'BookVerse',
      description: `${subscriptionType === 'reading' ? 'Reading' : 'Writer'} Subscription - ${planType}`,
      order_id: data.razorpayOrderId,
      handler: async (response) => {
        try {
          const verifyRes = await api.post('/payments/verify-subscription', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            subscriptionType,
            planType,
          });
          toast.success('Subscription activated!');
          onSuccess && onSuccess(verifyRes.data);
        } catch {
          toast.error('Subscription verification failed');
        }
      },
      prefill: { name: userName },
      theme: { color: '#6366f1' },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (err) {
    toast.error(err.response?.data?.message || 'Could not initiate subscription');
  }
};

// ─── Category helpers ─────────────────────────────────────────
export const CATEGORIES = [
  { value: 'fiction', label: 'Fiction' },
  { value: 'non-fiction', label: 'Non-Fiction' },
  { value: 'kids', label: 'Kids' },
  { value: 'test-prep', label: 'Test Prep' },
  { value: 'biography', label: 'Biography' },
  { value: 'science', label: 'Science' },
  { value: 'history', label: 'History' },
  { value: 'self-help', label: 'Self Help' },
  { value: 'romance', label: 'Romance' },
  { value: 'thriller', label: 'Thriller' },
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'other', label: 'Other' },
];

export const getCategoryLabel = (cat) => CATEGORIES.find(c => c.value === cat)?.label || cat;

// ─── Order status helpers ─────────────────────────────────────
export const ORDER_STATUSES = {
  order_placed: { label: 'Order Placed', color: 'blue', step: 0 },
  payment_confirmed: { label: 'Payment Confirmed', color: 'purple', step: 1 },
  packing: { label: 'Packing', color: 'yellow', step: 2 },
  out_for_delivery: { label: 'Out for Delivery', color: 'orange', step: 3 },
  delivered: { label: 'Delivered', color: 'green', step: 4 },
  cancelled: { label: 'Cancelled', color: 'red', step: -1 },
  returned: { label: 'Returned', color: 'gray', step: -1 },
};

// ─── Star rating display ──────────────────────────────────────
export const renderStars = (rating) => {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return Array.from({ length: 5 }, (_, i) => {
    if (i < full) return '★';
    if (i === full && half) return '½';
    return '☆';
  }).join('');
};

// ─── Truncate text ────────────────────────────────────────────
export const truncate = (str, len = 80) => str?.length > len ? str.slice(0, len) + '…' : str;

// ─── Discount price ───────────────────────────────────────────
export const getDiscountedPrice = (price, discount) => {
  if (price == null || isNaN(price)) return 0;
  if (!discount || isNaN(discount)) return Math.round(price);
  return Math.round(price * (1 - discount / 100));
};
