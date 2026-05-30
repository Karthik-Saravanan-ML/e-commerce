import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ShoppingBag, Heart, ChevronRight } from 'lucide-react';
import api from '../../utils/api';
import { formatPrice, formatDate, ORDER_STATUSES, CATEGORIES } from '../../utils/helpers';
import BookCard from '../../components/common/BookCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toggleWishlist } from '../../store/slices/cartSlice';
import toast from 'react-hot-toast';

// ─── MyOrders ─────────────────────────────────────────────────────────────────
export function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const params = filter ? `?status=${filter}` : '';
    api.get(`/orders/my${params}`)
      .then(r => setOrders(r.data.orders || []))
      .finally(() => setLoading(false));
  }, [filter]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>
      <div className="flex gap-2 flex-wrap mb-6">
        {[['', 'All'], ['order_placed', 'Placed'], ['packing', 'Packing'], ['out_for_delivery', 'In Transit'], ['delivered', 'Delivered'], ['cancelled', 'Cancelled']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${filter === val ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-600 hover:border-primary-300'}`}>
            {label}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <ShoppingBag className="w-14 h-14 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">No orders found</p>
          <Link to="/shop" className="btn-primary mt-4 inline-block px-6 py-2">Shop Now</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = ORDER_STATUSES[order.orderStatus];
            return (
              <Link key={order._id} to={`/orders/${order._id}`}
                className="card block p-5 hover:shadow-md transition-all hover:border-primary-100">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    {order.items.slice(0, 3).map((item, i) => (
                      <img key={i} src={item.coverImage} alt={item.title}
                        className="w-12 h-16 object-cover rounded-lg" />
                    ))}
                    {order.items.length > 3 && (
                      <div className="w-12 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-500 font-medium">
                        +{order.items.length - 3}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{order.items.length} item{order.items.length > 1 ? 's' : ''}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{order._id}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-900">{formatPrice(order.totalPrice)}</p>
                    <span className={`badge mt-1 text-xs ${
                      order.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>{status?.label}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Wishlist ─────────────────────────────────────────────────────────────────
export function Wishlist() {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.get(`/users/${user._id}/wishlist`)
      .then(r => setBooks(r.data.wishlist || []))
      .finally(() => setLoading(false));
  }, [user]);

  const remove = async (bookId) => {
    await dispatch(toggleWishlist(bookId));
    setBooks(prev => prev.filter(b => b._id !== bookId));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">My Wishlist</h1>
      <p className="text-gray-500 text-sm mb-8">{books.length} books saved</p>
      {books.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Heart className="w-14 h-14 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">Your wishlist is empty</p>
          <Link to="/shop" className="btn-primary mt-4 inline-block px-6 py-2">Discover Books</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {books.map(book => (
            <div key={book._id} className="relative">
              <BookCard book={book} />
              <button onClick={() => remove(book._id)}
                className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition z-10">
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CategoryPage ─────────────────────────────────────────────────────────────
export function CategoryPage() {
  const { category } = useParams();
  const [books, setBooks] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('-ratings');

  const catInfo = CATEGORIES.find(c => c.value === category);

  useEffect(() => {
    setLoading(true);
    api.get(`/books/category/${category}?sort=${sort}&page=${page}&limit=12`)
      .then(r => { setBooks(r.data.books); setTotal(r.data.total); setPages(r.data.pages); })
      .finally(() => setLoading(false));
  }, [category, sort, page]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-2 text-sm text-gray-500">
        <Link to="/" className="hover:text-primary-600">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="capitalize">{category}</span>
      </div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            {catInfo?.emoji} {catInfo?.label || category}
          </h1>
          <p className="text-gray-500 text-sm mt-1">{total} books</p>
        </div>
        <select className="input w-44" value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}>
          <option value="-ratings">Top Rated</option>
          <option value="-totalSales">Best Selling</option>
          <option value="-createdAt">Newest</option>
          <option value="price">Price: Low-High</option>
        </select>
      </div>
      {loading ? <LoadingSpinner /> : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {books.map(book => <BookCard key={book._id} book={book} />)}
          </div>
          {pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium ${page === p ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 hover:border-primary-300'}`}>{p}</button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── UserProfile ──────────────────────────────────────────────────────────────
export function UserProfile() {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/auth/profile', form);
      toast.success('Profile updated');
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">My Profile</h1>
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=6366f1&color=fff&size=80`}
            alt={user?.name} className="w-16 h-16 rounded-full object-cover" />
          <div>
            <p className="font-semibold text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className={`badge mt-1 ${user?.role === 'writer' ? 'bg-indigo-100 text-indigo-700' : user?.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'} capitalize`}>
              {user?.role}
            </span>
          </div>
        </div>
        <form onSubmit={save} className="space-y-4">
          <div><label className="text-sm font-medium text-gray-700 block mb-1">Full Name</label>
            <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
          <div><label className="text-sm font-medium text-gray-700 block mb-1">Phone</label>
            <input className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
          <div><label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
            <input className="input bg-gray-50 cursor-not-allowed" value={user?.email} disabled /></div>
          <button type="submit" disabled={saving} className="btn-primary px-6 py-2">{saving ? 'Saving…' : 'Save Changes'}</button>
        </form>
      </div>

      {/* Subscription status */}
      <div className="card p-6">
        <h2 className="font-semibold mb-4">Reading Subscription</h2>
        {user?.readingSubscription?.active ? (
          <div className="bg-green-50 rounded-xl p-4">
            <p className="font-medium text-green-800">✓ Active — {user.readingSubscription.plan} plan</p>
            <p className="text-sm text-green-600 mt-1">Expires: {formatDate(user.readingSubscription.endDate)}</p>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
            <p className="text-gray-600 text-sm">No active subscription</p>
            <Link to="/subscription" className="btn-primary py-1.5 text-sm px-4">Subscribe</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyOrders;
