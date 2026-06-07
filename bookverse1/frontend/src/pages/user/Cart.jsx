// ─── Cart.jsx ─────────────────────────────────────────────────────────────────
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { updateCartItem, removeFromCart } from '../../store/slices/cartSlice';
import { formatPrice, getDiscountedPrice } from '../../utils/helpers';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, loading } = useSelector((s) => s.cart);

  const subtotal = items.reduce((acc, item) => {
    const book = item.book;
    if (!book) return acc;
    return acc + getDiscountedPrice(book.price, book.discount) * item.quantity;
  }, 0);
  const shipping = subtotal > 499 ? 0 : 49;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + shipping + tax;

  if (loading) return <LoadingSpinner />;

  if (!items || items.length === 0) return (
    <div className="max-w-2xl mx-auto text-center py-24 px-6">
      <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h2 className="text-2xl font-semibold text-gray-700 mb-2">Your cart is empty</h2>
      <p className="text-gray-400 mb-6">Looks like you haven't added any books yet</p>
      <Link to="/shop" className="btn-primary px-8 py-3">Browse Books</Link>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Shopping Cart ({items.length} items)</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items list */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            if (!item.book) return null;
            const book = item.book;
            const price = getDiscountedPrice(book.price, book.discount);
            return (
              <div key={item._id} className="card flex gap-4 p-4">
                <img src={book.coverImage} alt={book.title} className="w-20 h-28 object-cover rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Link to={`/books/${book.bookId || book._id}`} className="font-medium text-gray-900 hover:text-primary-600 line-clamp-2">{book.title}</Link>
                  <p className="text-sm text-gray-500 mt-0.5">{book.authorName}</p>
                  <p className="text-sm font-semibold text-primary-700 mt-1">{formatPrice(price)}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <button onClick={() => dispatch(updateCartItem({ bookId: book._id, quantity: item.quantity - 1 }))} className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-medium w-6 text-center">{item.quantity}</span>
                    <button onClick={() => dispatch(updateCartItem({ bookId: book._id, quantity: item.quantity + 1 }))} className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center">
                      <Plus className="w-3 h-3" />
                    </button>
                    <button onClick={() => dispatch(removeFromCart(book._id))} className="ml-3 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-right font-bold text-gray-900">
                  {formatPrice(price * item.quantity)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Order summary */}
        <div className="card p-6 h-fit sticky top-24 space-y-4">
          <h3 className="font-semibold text-lg">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Shipping</span><span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">GST (5%)</span><span>{formatPrice(tax)}</span></div>
            {subtotal < 499 && <p className="text-xs text-gray-400">Add items worth {formatPrice(499 - subtotal)} more for free shipping</p>}
          </div>
          <hr className="border-gray-100" />
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span><span className="text-primary-700">{formatPrice(total)}</span>
          </div>
          <button onClick={() => navigate('/checkout')} className="btn-primary w-full py-3 text-base">Proceed to Checkout</button>
          <Link to="/shop" className="block text-center text-sm text-primary-600 hover:underline">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}

export default Cart;
