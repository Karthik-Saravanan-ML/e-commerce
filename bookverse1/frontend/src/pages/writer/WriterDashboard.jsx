import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Upload, BookOpen, TrendingUp, Star, DollarSign, AlertCircle, Plus, Edit2, Trash2, CheckCircle, XCircle, Clock, Check, Package, Smartphone, Headphones, Info, Lightbulb } from 'lucide-react';
import api from '../../utils/api';
import { formatPrice, formatDate, CATEGORIES, initiateSubscriptionPayment } from '../../utils/helpers';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

// ─── WriterDashboard ──────────────────────────────────────────────────────────
export function WriterDashboard() {
  const { user } = useSelector(s => s.auth);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/writers/analytics').then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  const hasSub = user?.writerSubscription?.active;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="dashboard-content">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">Welcome, {user?.name}</h1>
          <p className="text-gray-500 text-sm mt-1">Your author dashboard</p>
        </div>
        {hasSub && <Link to="/writer/upload" className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Upload Book</Link>}
      </div>

      {!hasSub && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800">Subscription Required</h3>
              <p className="text-amber-700 text-sm mt-1">You need an active writer subscription to publish and sell books on BookVerse.</p>
              <Link to="/writer/subscription" className="btn-primary mt-3 inline-block py-2 px-5 text-sm">Get Writer Subscription</Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          ['Total Books', stats?.stats?.totalBooks || 0, BookOpen, 'blue'],
          ['Total Sales', stats?.stats?.totalSales || 0, TrendingUp, 'green'],
          ['Revenue', `₹${stats?.stats?.totalRevenue?.toFixed(0) || 0}`, DollarSign, 'purple'],
          ['Avg Rating', (stats?.stats?.avgRating || 0), Star, 'amber'],
        ].map(([label, value, Icon, color]) => (
          <div key={label} className="card p-5">
            <div className={`w-10 h-10 rounded-xl bg-${color}-100 flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 text-${color}-600`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Books performance */}
      {stats?.books?.length > 0 && (
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Books Performance</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.books.slice(0, 8)}>
              <XAxis dataKey="title" tick={{ fontSize: 11 }} tickFormatter={t => t.slice(0, 12) + '…'} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="sales" fill="#6366f1" radius={[4, 4, 0, 0]} name="Sales" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent books */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">My Books</h2>
          <Link to="/writer/books" className="text-sm text-primary-600 hover:underline">View all</Link>
        </div>
        {stats?.books?.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No books yet. <Link to="/writer/upload" className="text-primary-600 underline">Upload your first book</Link></p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats?.books?.slice(0, 5).map((book, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="flex-1 font-medium text-gray-900 line-clamp-1">{book.title}</div>
                <span className="text-gray-500">{book.sales} sales</span>
                <span className="text-green-600 font-medium">{formatPrice(book.revenue)}</span>
                <div className="flex items-center gap-1 text-amber-500"><Star className="w-3 h-3 fill-current" />{book.rating?.toFixed(1)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── WriterBooks ──────────────────────────────────────────────────────────────
export function WriterBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.get('/books/my-books').then(r => setBooks(r.data.books || [])).finally(() => setLoading(false));
  }, []);

  const deleteBook = async (id) => {
    if (!window.confirm('Delete this book?')) return;
    try {
      await api.delete(`/books/${id}`);
      setBooks(b => b.filter(bk => bk._id !== id));
      toast.success('Book deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const filtered = filter ? books.filter(b => b.status === filter) : books;

  const statusBadge = (s) => ({
    approved: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    rejected: 'bg-red-100 text-red-700',
    draft: 'bg-gray-100 text-gray-600',
  }[s] || 'bg-gray-100 text-gray-600');

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Books</h1>
        <Link to="/writer/upload" className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Upload New</Link>
      </div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {[['', 'All'], ['approved', 'Approved'], ['pending', 'Pending Review'], ['rejected', 'Rejected'], ['draft', 'Draft']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-4 py-1.5 rounded-full text-sm border ${filter === val ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-600 hover:border-primary-300'}`}>
            {label}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400"><BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>No books found</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(book => (
            <div key={book._id} className="card p-4 flex items-center gap-4">
              <img src={book.coverImage} alt={book.title} className="w-14 h-20 object-cover rounded-lg flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900">{book.title}</h3>
                  <span className={`badge text-xs ${statusBadge(book.status)}`}>{book.status}</span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5 capitalize">{book.category} · {formatPrice(book.price)}</p>
                {book.status === 'rejected' && book.rejectionReason && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><XCircle className="w-3 h-3" />{book.rejectionReason}</p>
                )}
                <div className="flex gap-4 text-xs text-gray-400 mt-1">
                  <span>{book.totalSales} sales</span>
                  <span>{book.ratings?.toFixed(1)} ★</span>
                  <span>{formatDate(book.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link to={`/writer/edit/${book._id}`} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition">
                  <Edit2 className="w-4 h-4" />
                </Link>
                <button onClick={() => deleteBook(book._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── UploadBook ───────────────────────────────────────────────────────────────
export function UploadBook() {
  const { user } = useSelector(s => s.auth);
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', category: 'fiction', price: '', mrp: '', stock: '', language: 'English', tags: '', isbn: '', publisher: '', publishedYear: '', pages: '', isPhysical: true, isEbook: false, isAudiobook: false });
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!user?.writerSubscription?.active) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Subscription Required</h2>
        <p className="text-gray-500 mb-4">You need an active writer subscription to upload books.</p>
        <Link to="/writer/subscription" className="btn-primary px-6 py-2">Get Subscription</Link>
      </div>
    );
  }

  const handleCover = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!coverFile) { toast.error('Cover image required'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append('coverImage', coverFile);

      const { data } = await api.post('/books', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const bookId = data.book._id;

      if (pdfFile) {
        const pdfFd = new FormData();
        pdfFd.append('pdf', pdfFile);
        const pdfRes = await api.post(`/books/${bookId}/upload-pdf`, pdfFd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success(pdfRes.data?.message || 'E-book uploaded!');
      } else {
        toast.success('Book submitted for review!');
      }
      navigate('/writer/books');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally { setLoading(false); }
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Upload className="w-6 h-6 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Upload New Book</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cover image */}
        <div className="card p-5">
          <h2 className="font-semibold mb-4">Cover Image *</h2>
          <div className="flex gap-5 items-start">
            <label className="flex-shrink-0 w-32 h-44 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 transition overflow-hidden">
              {coverPreview ? <img src={coverPreview} className="w-full h-full object-cover" /> : <><Upload className="w-6 h-6 text-gray-400 mb-1" /><span className="text-xs text-gray-400">Click to upload</span></>}
              <input type="file" className="hidden" accept="image/*" onChange={handleCover} />
            </label>
            <div className="text-sm text-gray-500 pt-2">
              <p className="font-medium text-gray-700 mb-1">Cover image guidelines:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Ratio: 2:3 (portrait)</li><li>Min size: 600×900px</li>
                <li>Max size: 5MB</li><li>Format: JPG, PNG, WebP</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Book details */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold">Book Details</h2>
          <div><label className="text-sm font-medium text-gray-700 block mb-1">Title *</label>
            <input className="input" value={form.title} onChange={e => set('title', e.target.value)} required /></div>
          <div><label className="text-sm font-medium text-gray-700 block mb-1">Description *</label>
            <textarea className="input resize-none" rows={4} value={form.description} onChange={e => set('description', e.target.value)} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-gray-700 block mb-1">Category *</label>
              <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select></div>
            <div><label className="text-sm font-medium text-gray-700 block mb-1">Language</label>
              <input className="input" value={form.language} onChange={e => set('language', e.target.value)} /></div>
            <div><label className="text-sm font-medium text-gray-700 block mb-1">Price (₹) *</label>
              <input type="number" className="input" value={form.price} onChange={e => set('price', e.target.value)} required /></div>
            <div><label className="text-sm font-medium text-gray-700 block mb-1">MRP (₹)</label>
              <input type="number" className="input" value={form.mrp} onChange={e => set('mrp', e.target.value)} /></div>
            <div><label className="text-sm font-medium text-gray-700 block mb-1">Stock</label>
              <input type="number" min="0" className="input" placeholder="0" value={form.stock}
                onChange={e => set('stock', e.target.value)} /></div>
            <div><label className="text-sm font-medium text-gray-700 block mb-1">Pages</label>
              <input type="number" className="input" value={form.pages} onChange={e => set('pages', e.target.value)} /></div>
            <div><label className="text-sm font-medium text-gray-700 block mb-1">Publisher</label>
              <input className="input" value={form.publisher} onChange={e => set('publisher', e.target.value)} /></div>
            <div><label className="text-sm font-medium text-gray-700 block mb-1">Published Year</label>
              <input type="number" className="input" value={form.publishedYear} onChange={e => set('publishedYear', e.target.value)} /></div>
          </div>
          <div><label className="text-sm font-medium text-gray-700 block mb-1">Tags (comma separated)</label>
            <input className="input" placeholder="thriller, suspense, bestseller" value={form.tags} onChange={e => set('tags', e.target.value)} /></div>
          <div><label className="text-sm font-medium text-gray-700 block mb-1">ISBN</label>
            <input className="input" value={form.isbn} onChange={e => set('isbn', e.target.value)} /></div>
        </div>

        {/* Format */}
        <div className="card p-5">
          <h2 className="font-semibold mb-4">Book Format</h2>
          <div className="flex gap-4 flex-wrap">
            {[
              { key: 'isPhysical', label: 'Physical Book', icon: Package },
              { key: 'isEbook', label: 'eBook', icon: Smartphone },
              { key: 'isAudiobook', label: 'Audiobook', icon: Headphones },
            ].map(({ key, label, icon: Icon }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer text-sm font-medium px-3 py-2 rounded-xl border border-gray-200 hover:border-primary-200 hover:bg-primary-50/50 transition-colors">
                <input type="checkbox" checked={form[key]} onChange={e => set(key, e.target.checked)} className="w-4 h-4 accent-primary-600" />
                <Icon className="w-4 h-4 text-gray-500" />
                {label}
              </label>
            ))}
          </div>

          {form.isEbook && (
            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <label className="text-sm font-semibold text-gray-900 block mb-3">Upload PDF (eBook)</label>
              <div className="space-y-3">
                <label className="block p-4 bg-white border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
                  <input type="file" accept=".pdf" onChange={e => {
                    const file = e.target.files[0];
                    if (!file) return;
                    if (file.size > 100 * 1024 * 1024) { // 100MB limit
                      toast.error('PDF file must be less than 100MB');
                      return;
                    }
                    if (file.type !== 'application/pdf') {
                      toast.error('Only PDF files are supported');
                      return;
                    }
                    setPdfFile(file);
                  }}
                    className="hidden" />
                  <div className="text-center py-2">
                    <Upload className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                    <p className="text-sm font-medium text-gray-900">Click to select PDF</p>
                    <p className="text-xs text-gray-500 mt-1">or drag and drop (max 100MB)</p>
                  </div>
                </label>
                {pdfFile && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200 flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-900">{pdfFile.name}</p>
                      <p className="text-xs text-green-700">{(pdfFile.size / 1024 / 1024).toFixed(2)}MB</p>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-3 flex items-start gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-blue-500" />
                The PDF will be uploaded and processed once the book is submitted for review.
              </p>
            </div>
          )}

          {form.isAudiobook && (
            <p className="mt-3 text-sm text-amber-700 bg-amber-50 rounded-lg p-3 flex items-start gap-2">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              You can upload audio chapters after the book is submitted via the book edit page.
            </p>
          )}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
          {loading ? 'Uploading…' : 'Submit Book for Review'}
        </button>
      </form>
    </div>
  );
}

// ─── WriterAnalytics ──────────────────────────────────────────────────────────
export function WriterAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/writers/analytics').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Analytics</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          ['Books', data?.stats?.totalBooks || 0],
          ['Sales', data?.stats?.totalSales || 0],
          ['Revenue', `₹${(data?.stats?.totalRevenue || 0).toFixed(0)}`],
          ['Avg Rating', data?.stats?.avgRating || '0'],
        ].map(([label, value]) => (
          <div key={label} className="card p-5 text-center">
            <p className="text-3xl font-bold text-primary-700">{value}</p>
            <p className="text-gray-500 text-sm mt-1">{label}</p>
          </div>
        ))}
      </div>
      {data?.books?.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold mb-4">Sales by Book</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.books}>
              <XAxis dataKey="title" tickFormatter={t => t.slice(0, 15)} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v, n) => n === 'revenue' ? `₹${v}` : v} />
              <Bar dataKey="sales" fill="#6366f1" name="Sales" radius={[4, 4, 0, 0]} />
              <Bar dataKey="revenue" fill="#10b981" name="Revenue (₹)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ─── WriterSubscription ───────────────────────────────────────────────────────
export function WriterSubscription() {
  const { user } = useSelector(s => s.auth);
  const navigate = useNavigate();
  const hasSub = user?.writerSubscription?.active;

  const subscribe = (planType) => {
    initiateSubscriptionPayment({
      subscriptionType: 'writer', planType, userName: user?.name,
      onSuccess: () => window.location.reload(),
    });
  };

  const plans = [
    { plan: 'monthly', price: 299, features: ['Publish unlimited books', 'Revenue analytics', 'Writer network', '70% royalty'] },
    { plan: 'yearly', price: 2499, badge: 'Best Value', features: ['All monthly features', '2 months FREE', 'Featured placement', 'Priority review'] },
  ];

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Writer Subscription</h1>
      {hasSub && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-8">
          <p className="font-semibold text-green-800">✓ Active subscription — {user.writerSubscription.plan} plan</p>
          <p className="text-sm text-green-600 mt-1">Expires: {formatDate(user.writerSubscription.endDate)}</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map(({ plan, price, badge, features }) => (
          <div key={plan} className={`card p-7 relative ${badge ? 'ring-2 ring-indigo-500' : ''}`}>
            {badge && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full">{badge}</span>}
            <h3 className="text-lg font-bold capitalize mb-1">{plan}</h3>
            <p className="text-3xl font-bold text-indigo-700 mb-5">₹{price}<span className="text-sm font-normal text-gray-400">/{plan === 'monthly' ? 'mo' : 'yr'}</span></p>
            <ul className="space-y-2 mb-6">{features.map(f => <li key={f} className="text-sm flex items-center gap-2"><span className="text-green-500">✓</span>{f}</li>)}</ul>
            <button onClick={() => subscribe(plan)} className={`w-full py-3 rounded-xl font-semibold ${badge ? 'btn-primary' : 'btn-secondary'}`}>
              {hasSub ? 'Renew' : 'Subscribe'} — ₹{price}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── EditBook ─────────────────────────────────────────────────────────────────
export function EditBook() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [chapterNum, setChapterNum] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [uploadingAudio, setUploadingAudio] = useState(false);

  useEffect(() => {
    api.get(`/books/${id}`).then(r => setBook(r.data.book)).finally(() => setLoading(false));
  }, [id]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/books/${id}`, { title: book.title, description: book.description, price: book.price, stock: book.stock });
      toast.success('Book updated and submitted for re-review');
      navigate('/writer/books');
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const uploadAudio = async () => {
    if (!audioFile || !chapterNum || !chapterTitle) { toast.error('Fill all audio fields'); return; }
    setUploadingAudio(true);
    try {
      const fd = new FormData();
      fd.append('audio', audioFile);
      fd.append('chapterNumber', chapterNum);
      fd.append('chapterTitle', chapterTitle);
      fd.append('isFree', 'false');
      await api.post(`/books/${id}/upload-audio`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Audio chapter uploaded');
      setAudioFile(null); setChapterNum(''); setChapterTitle('');
    } catch { toast.error('Audio upload failed'); }
    finally { setUploadingAudio(false); }
  };

  if (loading) return <LoadingSpinner />;
  if (!book) return <div className="p-8 text-gray-400">Book not found</div>;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Book</h1>
      <form onSubmit={save} className="card p-6 space-y-4 mb-6">
        <div><label className="text-sm font-medium text-gray-700 block mb-1">Title</label>
          <input className="input" value={book.title} onChange={e => setBook({...book, title: e.target.value})} /></div>
        <div><label className="text-sm font-medium text-gray-700 block mb-1">Description</label>
          <textarea className="input resize-none" rows={4} value={book.description} onChange={e => setBook({...book, description: e.target.value})} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-sm font-medium text-gray-700 block mb-1">Price (₹)</label>
            <input type="number" className="input" value={book.price} onChange={e => setBook({...book, price: e.target.value})} /></div>
          <div><label className="text-sm font-medium text-gray-700 block mb-1">Stock</label>
            <input type="number" className="input" value={book.stock} onChange={e => setBook({...book, stock: e.target.value})} /></div>
        </div>
        <button type="submit" disabled={saving} className="btn-primary py-2 px-6">{saving ? 'Saving…' : 'Save Changes'}</button>
      </form>

      {/* Audio chapter upload */}
      <div className="card p-6">
        <h2 className="font-semibold mb-4">Upload Audio Chapter</h2>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium text-gray-700 block mb-1">Chapter Number</label>
              <input type="number" className="input" value={chapterNum} onChange={e => setChapterNum(e.target.value)} /></div>
            <div><label className="text-sm font-medium text-gray-700 block mb-1">Chapter Title</label>
              <input className="input" value={chapterTitle} onChange={e => setChapterTitle(e.target.value)} /></div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Audio File (MP3/WAV)</label>
            <input type="file" accept=".mp3,.wav,.m4a,.ogg" onChange={e => setAudioFile(e.target.files[0])}
              className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 cursor-pointer" />
          </div>
          <button onClick={uploadAudio} disabled={uploadingAudio} className="btn-primary py-2 px-5 text-sm">
            {uploadingAudio ? 'Uploading…' : 'Upload Chapter'}
          </button>
        </div>
        {book.chapters?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-2">{book.chapters.length} chapters uploaded</p>
            {book.chapters.map(c => <p key={c.number} className="text-xs text-gray-500">Ch.{c.number}: {c.title}</p>)}
          </div>
        )}
      </div>
    </div>
  );
}

export default WriterDashboard;
