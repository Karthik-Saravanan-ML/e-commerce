import { useState, useEffect } from 'react';
import { BookOpen, Users, ShoppingBag, DollarSign, TrendingUp, CheckCircle, XCircle, Clock, Eye, Trash2, ToggleLeft, ToggleRight, Plus, Image } from 'lucide-react';
import api from '../../utils/api';
import { formatPrice, formatDate, ORDER_STATUSES } from '../../utils/helpers';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

// ─── AdminDashboard ───────────────────────────────────────────────────────────
export function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const stats = data?.stats || {};

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard Overview</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[
          ['Users', stats.totalUsers, Users, 'blue'],
          ['Writers', stats.totalWriters, BookOpen, 'indigo'],
          ['Books', stats.totalBooks, BookOpen, 'violet'],
          ['Orders', stats.totalOrders, ShoppingBag, 'amber'],
          ['Revenue', formatPrice(stats.totalRevenue || 0), DollarSign, 'green'],
          ['Pending', stats.pendingBooks, Clock, 'red'],
        ].map(([label, value, Icon, color]) => (
          <div key={label} className="card p-4">
            <div className={`w-9 h-9 bg-${color}-100 rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 text-${color}-600`} />
            </div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      {data?.revenueByMonth?.length > 0 && (
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Revenue (Last 6 Months)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey={d => `${d._id.month}/${d._id.year}`} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => formatPrice(v)} />
              <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} name="Revenue" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Orders</h2>
          <div className="space-y-3">
            {(data?.recentOrders || []).map(order => (
              <div key={order._id} className="flex items-center gap-3 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{order.user?.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{order._id.slice(-8)}</p>
                </div>
                <span className="font-semibold text-gray-900">{formatPrice(order.totalPrice)}</span>
                <span className={`badge text-xs ${order.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                  {ORDER_STATUSES[order.orderStatus]?.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top books */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Top Selling Books</h2>
          <div className="space-y-3">
            {(data?.topBooks || []).map((book, i) => (
              <div key={book._id} className="flex items-center gap-3 text-sm">
                <span className="w-5 text-center font-bold text-gray-400">{i + 1}</span>
                <img src={book.coverImage} alt={book.title} className="w-8 h-12 object-cover rounded" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 line-clamp-1">{book.title}</p>
                  <p className="text-xs text-gray-400">{book.totalSales} sales</p>
                </div>
                <span className="text-amber-500 text-xs">{book.ratings?.toFixed(1)} ★</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AdminBooks ───────────────────────────────────────────────────────────────
export function AdminBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [rejReason, setRejReason] = useState({});

  const load = () => {
    setLoading(true);
    api.get(`/admin/books?status=${filter}&page=${page}&limit=15`)
      .then(r => { setBooks(r.data.books || []); setTotal(r.data.total || 0); })
      .finally(() => setLoading(false));
  };

  useEffect(load, [filter, page]);

  const approve = async (id, action, reason) => {
    try {
      await api.put(`/admin/books/${id}/approve`, { action, rejectionReason: reason });
      toast.success(`Book ${action}d`);
      load();
    } catch { toast.error('Failed'); }
  };

  const toggleBestSeller = async (id) => {
    await api.put(`/admin/books/${id}/best-seller`);
    load();
  };

  const toggleFeatured = async (id) => {
    await api.put(`/admin/books/${id}/featured`);
    load();
  };

  const deleteBook = async (id) => {
    if (!window.confirm('Delete this book permanently?')) return;
    await api.delete(`/admin/books/${id}`);
    load();
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Books Management</h1>
      <div className="flex gap-2 mb-6 flex-wrap">
        {[['pending', 'Pending Review'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['', 'All']].map(([val, label]) => (
          <button key={val} onClick={() => { setFilter(val); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm border ${filter === val ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-600 hover:border-primary-300'}`}>
            {label}
          </button>
        ))}
      </div>
      {loading ? <LoadingSpinner /> : (
        <div className="space-y-3">
          {books.map(book => (
            <div key={book._id} className="card p-4">
              <div className="flex items-start gap-4">
                <img src={book.coverImage} alt={book.title} className="w-16 h-22 object-cover rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{book.title}</h3>
                    <span className="badge text-xs bg-gray-100 text-gray-600">{book.bookId}</span>
                    {book.isBestSeller && <span className="badge bg-amber-100 text-amber-700 text-xs">Best Seller</span>}
                    {book.isFeatured && <span className="badge bg-purple-100 text-purple-700 text-xs">Featured</span>}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">by {book.author?.name} · {book.category} · {formatPrice(book.price)}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(book.createdAt)}</p>

                  {/* Rejection reason input */}
                  {book.status === 'pending' && (
                    <input className="input text-xs py-1.5 mt-2 w-full max-w-sm" placeholder="Rejection reason (optional)"
                      value={rejReason[book._id] || ''} onChange={e => setRejReason(r => ({ ...r, [book._id]: e.target.value }))} />
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {book.status === 'pending' && (
                    <>
                      <button onClick={() => approve(book._id, 'approve')} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                        <CheckCircle className="w-3 h-3" /> Approve
                      </button>
                      <button onClick={() => approve(book._id, 'reject', rejReason[book._id])} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                        <XCircle className="w-3 h-3" /> Reject
                      </button>
                    </>
                  )}
                  <button onClick={() => toggleBestSeller(book._id)} className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg ${book.isBestSeller ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {book.isBestSeller ? '⭐ Best Seller' : 'Set Best Seller'}
                  </button>
                  <button onClick={() => toggleFeatured(book._id)} className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg ${book.isFeatured ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {book.isFeatured ? '✨ Featured' : 'Set Featured'}
                  </button>
                  <button onClick={() => deleteBook(book._id)} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-gray-100 text-red-500 rounded-lg hover:bg-red-50">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AdminOrders ──────────────────────────────────────────────────────────────
export function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [updating, setUpdating] = useState({});

  useEffect(() => {
    setLoading(true);
    const q = filter ? `?status=${filter}` : '';
    api.get(`/orders/all${q}`).then(r => setOrders(r.data.orders || [])).finally(() => setLoading(false));
  }, [filter]);

  const updateStatus = async (orderId, status, location = '') => {
    setUpdating(u => ({ ...u, [orderId]: true }));
    try {
      await api.put(`/orders/${orderId}/status`, { status, location });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, orderStatus: status } : o));
      toast.success('Order status updated');
    } catch { toast.error('Failed'); }
    finally { setUpdating(u => ({ ...u, [orderId]: false })); }
  };

  const nextStatus = { order_placed: 'payment_confirmed', payment_confirmed: 'packing', packing: 'out_for_delivery', out_for_delivery: 'delivered' };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders Management</h1>
      <div className="flex gap-2 mb-6 flex-wrap">
        {[['', 'All'], ['order_placed', 'Placed'], ['packing', 'Packing'], ['out_for_delivery', 'In Transit'], ['delivered', 'Delivered'], ['cancelled', 'Cancelled']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-4 py-1.5 rounded-full text-sm border ${filter === val ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-600'}`}>{label}</button>
        ))}
      </div>
      {loading ? <LoadingSpinner /> : (
        <div className="space-y-3">
          {orders.map(order => {
            const next = nextStatus[order.orderStatus];
            return (
              <div key={order._id} className="card p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900">{order.user?.name}</p>
                      <span className="badge bg-gray-100 text-gray-600 text-xs font-mono">{order._id.slice(-8)}</span>
                      <span className={`badge text-xs ${order.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' : order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                        {ORDER_STATUSES[order.orderStatus]?.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{order.user?.email} · {order.user?.phone}</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{formatPrice(order.totalPrice)} · {order.items.length} items · {order.paymentMethod.toUpperCase()}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(order.createdAt)}</p>
                    <div className="text-xs text-gray-500 mt-1">📍 {order.shippingAddress?.city}, {order.shippingAddress?.state}</div>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {next && (
                      <button onClick={() => updateStatus(order._id, next)} disabled={updating[order._id]}
                        className="text-xs px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 disabled:opacity-50">
                        → {ORDER_STATUSES[next]?.label}
                      </button>
                    )}
                    {order.orderStatus === 'out_for_delivery' && (
                      <button onClick={() => updateStatus(order._id, 'delivered', order.shippingAddress?.city)}
                        className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                        ✓ Mark Delivered
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── AdminUsers ───────────────────────────────────────────────────────────────
export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [toggling, setToggling] = useState({});

  const load = () => {
    setLoading(true);
    api.get(`/admin/users?search=${search}&role=${role}&limit=30`)
      .then(r => setUsers(r.data.users || [])).finally(() => setLoading(false));
  };

  useEffect(load, [role]);

  const toggleUser = async (id) => {
    setToggling(t => ({ ...t, [id]: true }));
    try {
      const { data } = await api.put(`/admin/users/${id}/toggle`);
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: data.isActive } : u));
      toast.success(data.message);
    } catch { toast.error('Failed'); }
    finally { setToggling(t => ({ ...t, [id]: false })); }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Users Management</h1>
      <div className="flex gap-3 mb-6">
        <input className="input flex-1" placeholder="Search by name or email…" value={search}
          onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} />
        <select className="input w-36" value={role} onChange={e => { setRole(e.target.value); }}>
          <option value="">All Roles</option>
          <option value="user">Users</option>
          <option value="writer">Writers</option>
          <option value="admin">Admins</option>
        </select>
        <button onClick={load} className="btn-primary px-5">Search</button>
      </div>
      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>{['Name', 'Email', 'Role', 'Joined', 'Sub Status', 'Status', 'Action'].map(h => <th key={h} className="text-left px-4 py-3">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&size=28&background=6366f1&color=fff`}
                        alt="" className="w-7 h-7 rounded-full" />
                      <span className="font-medium text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{user.email}</td>
                  <td className="px-4 py-3"><span className={`badge text-xs capitalize ${user.role === 'admin' ? 'bg-red-100 text-red-700' : user.role === 'writer' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>{user.role}</span></td>
                  <td className="px-4 py-3 text-gray-400">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3">
                    {user.readingSubscription?.active ? <span className="badge bg-green-100 text-green-700 text-xs">Reader ✓</span> : <span className="badge bg-gray-100 text-gray-500 text-xs">No sub</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleUser(user._id)} disabled={toggling[user._id]}
                      className={`p-1.5 rounded-lg transition ${user.isActive ? 'text-green-600 hover:bg-red-50 hover:text-red-600' : 'text-red-500 hover:bg-green-50 hover:text-green-600'} disabled:opacity-50`}>
                      {user.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── AdminBanners ─────────────────────────────────────────────────────────────
export function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', subtitle: '', type: 'main', linkType: 'category', linkTo: '', discountPercent: '', couponCode: '' });
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    api.get('/banners').then(r => setBanners(r.data.banners || [])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!imageFile) { toast.error('Banner image required'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
      fd.append('image', imageFile);
      await api.post('/banners', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Banner created');
      setShowForm(false);
      setForm({ title: '', subtitle: '', type: 'main', linkType: 'category', linkTo: '', discountPercent: '', couponCode: '' });
      setImageFile(null);
      load();
    } catch { toast.error('Failed'); }
    finally { setSubmitting(false); }
  };

  const toggle = async (id, isActive) => {
    await api.put(`/banners/${id}`, { isActive: !isActive });
    load();
  };

  const del = async (id) => {
    if (!window.confirm('Delete this banner?')) return;
    await api.delete(`/banners/${id}`);
    load();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Banner Management</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Banner
        </button>
      </div>

      {showForm && (
        <div className="card p-6 mb-6">
          <h2 className="font-semibold mb-4">Create Banner</h2>
          <form onSubmit={submit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 block mb-1">Banner Image *</label>
              <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])}
                className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-100 file:text-primary-700" />
              {imageFile && <p className="text-xs text-green-600 mt-1">✓ {imageFile.name}</p>}
            </div>
            <div><label className="text-sm font-medium text-gray-700 block mb-1">Title</label>
              <input className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
            <div><label className="text-sm font-medium text-gray-700 block mb-1">Subtitle</label>
              <input className="input" value={form.subtitle} onChange={e => setForm({...form, subtitle: e.target.value})} /></div>
            <div><label className="text-sm font-medium text-gray-700 block mb-1">Type</label>
              <select className="input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                <option value="main">Main Banner</option>
                <option value="discount">Discount Banner</option>
                <option value="reading">Reading Platform</option>
              </select></div>
            <div><label className="text-sm font-medium text-gray-700 block mb-1">Link Type</label>
              <select className="input" value={form.linkType} onChange={e => setForm({...form, linkType: e.target.value})}>
                <option value="category">Category</option>
                <option value="book">Book ID</option>
                <option value="subscription">Subscription</option>
              </select></div>
            <div><label className="text-sm font-medium text-gray-700 block mb-1">Link To</label>
              <input className="input" placeholder="e.g. fiction, BK-XXXX" value={form.linkTo} onChange={e => setForm({...form, linkTo: e.target.value})} /></div>
            <div><label className="text-sm font-medium text-gray-700 block mb-1">Discount %</label>
              <input type="number" className="input" value={form.discountPercent} onChange={e => setForm({...form, discountPercent: e.target.value})} /></div>
            <div><label className="text-sm font-medium text-gray-700 block mb-1">Coupon Code</label>
              <input className="input" value={form.couponCode} onChange={e => setForm({...form, couponCode: e.target.value})} /></div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" disabled={submitting} className="btn-primary px-6 py-2">{submitting ? 'Creating…' : 'Create Banner'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost px-5">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.map(banner => (
            <div key={banner._id} className={`card overflow-hidden ${!banner.isActive ? 'opacity-60' : ''}`}>
              <img src={banner.imageUrl} alt={banner.title} className="w-full h-32 object-cover" />
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{banner.title || 'No title'}</p>
                    <span className={`badge text-xs mt-1 ${banner.type === 'main' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{banner.type}</span>
                    {banner.couponCode && <p className="text-xs text-gray-500 mt-1">🎟 {banner.couponCode} — {banner.discountPercent}% off</p>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => toggle(banner._id, banner.isActive)}
                      className={`p-1.5 rounded-lg ${banner.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}>
                      {banner.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button onClick={() => del(banner._id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AdminAnalytics ───────────────────────────────────────────────────────────
export function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const monthLabels = data?.revenueByMonth?.map(d => `${d._id.month}/${String(d._id.year).slice(2)}`) || [];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-semibold mb-4">Monthly Revenue</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data?.revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey={d => `${d._id.month}/${String(d._id.year).slice(2)}`} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => formatPrice(v)} />
              <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-6">
          <h2 className="font-semibold mb-4">Monthly Orders</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data?.revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey={d => `${d._id.month}/${String(d._id.year).slice(2)}`} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} name="Orders" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-6 md:col-span-2">
          <h2 className="font-semibold mb-4">Platform Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ['Total Revenue', formatPrice(data?.stats?.totalRevenue || 0)],
              ['Total Orders', data?.stats?.totalOrders],
              ['Total Users', data?.stats?.totalUsers],
              ['Total Books', data?.stats?.totalBooks],
            ].map(([label, val]) => (
              <div key={label} className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-primary-700">{val}</p>
                <p className="text-sm text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
