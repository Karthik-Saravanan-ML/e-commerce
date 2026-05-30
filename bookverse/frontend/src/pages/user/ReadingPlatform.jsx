import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { BookOpen, Headphones, Clock, ChevronLeft, ChevronRight, Play, Pause, Volume2, SkipBack, SkipForward, Crown } from 'lucide-react';
import api from '../../utils/api';
import { initiateSubscriptionPayment, formatPrice } from '../../utils/helpers';
import BookCard from '../../components/common/BookCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

// ─── ReadingPlatform ──────────────────────────────────────────────────────────
export function ReadingPlatform() {
  const { user } = useSelector(s => s.auth);
  const [books, setBooks] = useState([]);
  const [readLater, setReadLater] = useState([]);
  const [progress, setProgress] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const hasSub = user?.readingSubscription?.active;

  useEffect(() => {
    const load = async () => {
      try {
        const [booksRes, meRes] = await Promise.all([
          api.get(`/books?isEbook=true&limit=24&sort=-ratings${category ? '&category=' + category : ''}${search ? '&search=' + search : ''}`),
          api.get('/auth/me'),
        ]);
        setBooks(booksRes.data.books || []);
        setReadLater(meRes.data.user?.readLater || []);
        setProgress(meRes.data.user?.readingProgress || []);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, [category, search]);

  if (!hasSub) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <Crown className="w-16 h-16 text-amber-400 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Unlock the Reading Library</h1>
        <p className="text-gray-500 text-lg mb-8">Subscribe to access thousands of ebooks and audiobooks</p>
        <Link to="/subscription" className="btn-primary px-10 py-4 text-lg">View Subscription Plans</Link>
      </div>
    );
  }

  const tabs = [['all', 'All Books', books.length], ['reading', 'Continue Reading', progress.length], ['later', 'Read Later', readLater.length]];
  const readLaterIds = readLater.map(b => b._id || b);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📚 My Library</h1>
        <div className="flex items-center gap-2 text-sm bg-green-50 text-green-700 px-4 py-2 rounded-full font-medium">
          <Crown className="w-4 h-4" /> Active Subscriber
        </div>
      </div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(([key, label, count]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === key ? 'bg-white shadow text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}>
            {label} <span className="ml-1 text-xs opacity-60">({count})</span>
          </button>
        ))}
      </div>

      {activeTab === 'reading' && (
        <div>
          {progress.length === 0 ? (
            <div className="text-center py-10 text-gray-400"><p>No books started yet. Pick one below!</p></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {progress.map(prog => (
                <Link key={prog.book} to={`/read/${prog.book}`}
                  className="card p-4 flex gap-3 hover:shadow-md transition-all">
                  <BookOpen className="w-8 h-8 text-primary-500 flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 line-clamp-1">Book Progress</p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                      <div className="bg-primary-600 h-1.5 rounded-full" style={{ width: `${prog.percentage}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{prog.percentage}% complete · Ch. {prog.currentChapter}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1"><Clock className="w-3 h-3" /> {new Date(prog.lastRead).toLocaleDateString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'later' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {readLater.length === 0 ? <p className="text-gray-400 col-span-full py-10 text-center">No books saved for later</p>
            : readLater.map(book => typeof book === 'object' ? <BookCard key={book._id} book={book} /> : null)}
        </div>
      )}

      {activeTab === 'all' && (
        <>
          <div className="flex gap-3 mb-6">
            <input className="input flex-1" placeholder="Search ebooks…" value={search} onChange={e => setSearch(e.target.value)} />
            <select className="input w-44" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              {['fiction','non-fiction','kids','test-prep','biography','science','self-help'].map(c => (
                <option key={c} value={c} className="capitalize">{c}</option>
              ))}
            </select>
          </div>
          {loading ? <LoadingSpinner /> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {books.map(book => <BookCard key={book._id} book={book} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── ReadBook ─────────────────────────────────────────────────────────────────
export function ReadBook() {
  const { bookId } = useParams();
  const { user } = useSelector(s => s.auth);
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chapter, setChapter] = useState(0);
  const [fontSize, setFontSize] = useState(16);

  useEffect(() => {
    api.get(`/books/${bookId}`)
      .then(r => setBook(r.data.book))
      .finally(() => setLoading(false));
  }, [bookId]);

  const saveProgress = async (chapterIdx, pct) => {
    try {
      await api.put(`/books/${bookId}/progress`, { currentChapter: chapterIdx, percentage: pct });
    } catch {}
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!book) return <div className="text-center py-20">Book not found</div>;

  const hasChapters = book.chapters?.length > 0;
  const currentChapter = hasChapters ? book.chapters[chapter] : null;

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Reader toolbar */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
        <Link to="/library" className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <p className="font-medium text-sm text-gray-900 line-clamp-1">{book.title}</p>
          {hasChapters && <p className="text-xs text-gray-500">Chapter {chapter + 1} of {book.chapters.length}</p>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Aa</span>
          <button onClick={() => setFontSize(s => Math.max(12, s - 2))} className="w-7 h-7 bg-gray-100 rounded-full text-sm font-bold">−</button>
          <span className="text-sm w-8 text-center">{fontSize}</span>
          <button onClick={() => setFontSize(s => Math.min(24, s + 2))} className="w-7 h-7 bg-gray-100 rounded-full text-sm font-bold">+</button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-10">
        {hasChapters && currentChapter ? (
          <>
            <h2 className="text-xl font-bold mb-6 text-gray-900">Chapter {currentChapter.number}: {currentChapter.title}</h2>
            <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed" style={{ fontSize }}>
              {currentChapter.content?.split('\n').map((p, i) => <p key={i} className="mb-4">{p}</p>)}
            </div>
            {/* Chapter navigation */}
            <div className="flex justify-between mt-12 pt-6 border-t border-amber-200">
              <button disabled={chapter === 0} onClick={() => { setChapter(c => c - 1); saveProgress(chapter - 1, Math.round(((chapter - 1) / book.chapters.length) * 100)); }}
                className="btn-secondary flex items-center gap-2 disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <span className="text-sm text-gray-500 self-center">{chapter + 1} / {book.chapters.length}</span>
              <button disabled={chapter === book.chapters.length - 1} onClick={() => { setChapter(c => c + 1); saveProgress(chapter + 1, Math.round(((chapter + 1) / book.chapters.length) * 100)); }}
                className="btn-primary flex items-center gap-2 disabled:opacity-40">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : book.softCopyUrl ? (
          <iframe src={book.softCopyUrl} title={book.title} className="w-full h-screen rounded-xl shadow-lg" />
        ) : (
          <div className="text-center py-20 text-gray-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>No reading content available for this book yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ListenBook ───────────────────────────────────────────────────────────────
export function ListenBook() {
  const { bookId } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    api.get(`/books/${bookId}`).then(r => setBook(r.data.book)).finally(() => setLoading(false));
  }, [bookId]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause();
    else audioRef.current.play();
    setPlaying(!playing);
  };

  const skip = (secs) => { if (audioRef.current) audioRef.current.currentTime += secs; };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  if (loading) return <LoadingSpinner fullScreen />;
  if (!book?.isAudiobook) return <div className="text-center py-20 text-gray-400">This book has no audio version</div>;

  const chapters = book.chapters?.filter(c => c.audioUrl) || [];
  const ch = chapters[currentChapter];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link to="/library" className="flex items-center gap-2 text-indigo-300 mb-8 hover:text-white"><ChevronLeft className="w-4 h-4" /> Library</Link>

        {/* Cover art */}
        <div className="w-52 h-72 mx-auto rounded-2xl shadow-2xl overflow-hidden mb-8">
          <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
        </div>

        <h1 className="text-xl font-bold text-center mb-1">{book.title}</h1>
        <p className="text-indigo-300 text-center text-sm mb-2">{book.authorName}</p>
        {ch && <p className="text-center text-xs text-indigo-400 mb-6">Chapter {ch.number}: {ch.title}</p>}

        {/* Audio element */}
        {ch?.audioUrl && (
          <audio ref={audioRef} src={ch.audioUrl}
            onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
            onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
            onEnded={() => { setPlaying(false); if (currentChapter < chapters.length - 1) { setCurrentChapter(c => c + 1); setPlaying(false); } }}
          />
        )}

        {/* Progress */}
        <div className="mb-4">
          <input type="range" min={0} max={duration || 1} value={currentTime}
            onChange={e => { const t = Number(e.target.value); setCurrentTime(t); if (audioRef.current) audioRef.current.currentTime = t; }}
            className="w-full accent-white" />
          <div className="flex justify-between text-xs text-indigo-300 mt-1">
            <span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6">
          <button onClick={() => skip(-10)} className="p-3 hover:bg-white/10 rounded-full transition"><SkipBack className="w-5 h-5" /></button>
          <button onClick={() => setCurrentChapter(c => Math.max(0, c - 1))} className="p-3 hover:bg-white/10 rounded-full"><ChevronLeft className="w-5 h-5" /></button>
          <button onClick={togglePlay} className="w-16 h-16 bg-white text-indigo-900 rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition">
            {playing ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
          </button>
          <button onClick={() => setCurrentChapter(c => Math.min(chapters.length - 1, c + 1))} className="p-3 hover:bg-white/10 rounded-full"><ChevronRight className="w-5 h-5" /></button>
          <button onClick={() => skip(10)} className="p-3 hover:bg-white/10 rounded-full transition"><SkipForward className="w-5 h-5" /></button>
        </div>

        {/* Chapter list */}
        {chapters.length > 1 && (
          <div className="mt-8 bg-white/10 rounded-2xl p-4 max-h-40 overflow-y-auto">
            {chapters.map((c, i) => (
              <button key={i} onClick={() => { setCurrentChapter(i); setPlaying(false); setTimeout(() => { setPlaying(true); audioRef.current?.play(); }, 100); }}
                className={`w-full text-left text-sm py-2 px-3 rounded-lg transition ${i === currentChapter ? 'bg-white/20 font-medium' : 'hover:bg-white/10 text-indigo-300'}`}>
                Ch.{c.number} — {c.title}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Subscription ─────────────────────────────────────────────────────────────
export function Subscription() {
  const { user } = useSelector(s => s.auth);
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState('reading');
  const [loading, setLoading] = useState({});

  const readingPlans = [
    { plan: 'monthly', price: 99, label: 'Monthly', duration: '1 Month', features: ['Unlimited ebooks', 'Chapter-wise audiobooks', 'Offline reading', 'No ads', 'Read Later list'] },
    { plan: 'yearly', price: 799, label: 'Yearly', duration: '12 Months', badge: 'Best Value', features: ['All Monthly features', '2 months FREE', 'Priority support', 'Early access to new titles'] },
  ];
  const writerPlans = [
    { plan: 'monthly', price: 299, label: 'Monthly', duration: '1 Month', features: ['Publish unlimited books', 'Analytics dashboard', 'Writer community', 'Revenue tracking'] },
    { plan: 'yearly', price: 2499, label: 'Yearly', duration: '12 Months', badge: 'Best Value', features: ['All Monthly features', '2 months FREE', 'Featured placement', 'Priority review'] },
  ];

  const subscribe = (planType, subscriptionType) => {
    if (!user) { navigate('/login'); return; }
    setLoading({ [planType + subscriptionType]: true });
    initiateSubscriptionPayment({
      subscriptionType, planType, userName: user?.name,
      onSuccess: (data) => { window.location.reload(); },
    });
    setTimeout(() => setLoading({}), 3000);
  };

  const plans = selectedTab === 'reading' ? readingPlans : writerPlans;
  const activeSub = selectedTab === 'reading' ? user?.readingSubscription : user?.writerSubscription;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Choose Your Plan</h1>
        <p className="text-gray-500 text-lg">Unlock the full BookVerse experience</p>
      </div>

      {/* Tab switch */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex bg-gray-100 p-1 rounded-xl">
          {[['reading', '📚 Reading'], ['writer', '✍️ Writer']].map(([key, label]) => (
            <button key={key} onClick={() => setSelectedTab(key)}
              className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${selectedTab === key ? 'bg-white shadow text-primary-700' : 'text-gray-500'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeSub?.active && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-8 text-center">
          <p className="font-semibold text-green-800">✓ You have an active {selectedTab} subscription ({activeSub.plan})</p>
          <p className="text-sm text-green-600 mt-1">Expires: {new Date(activeSub.endDate).toLocaleDateString()}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map(({ plan, price, label, duration, badge, features }) => (
          <div key={plan} className={`card p-8 relative ${badge ? 'ring-2 ring-primary-500' : ''}`}>
            {badge && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-bold px-4 py-1 rounded-full">{badge}</span>}
            <h3 className="text-xl font-bold text-gray-900 mb-1">{label}</h3>
            <p className="text-gray-500 text-sm mb-4">{duration}</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-primary-700">₹{price}</span>
              <span className="text-gray-400">/{plan === 'monthly' ? 'month' : 'year'}</span>
            </div>
            <ul className="space-y-2.5 mb-8">
              {features.map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">✓</div>
                  {f}
                </li>
              ))}
            </ul>
            <button onClick={() => subscribe(plan, selectedTab)} disabled={loading[plan + selectedTab]}
              className={`w-full py-3 rounded-xl font-semibold transition ${badge ? 'btn-primary' : 'btn-secondary'}`}>
              {loading[plan + selectedTab] ? 'Opening…' : activeSub?.active ? 'Renew Plan' : `Subscribe — ₹${price}`}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-gray-50 rounded-2xl p-6 text-center text-sm text-gray-500">
        <p>🔒 Secure payment via Razorpay · Cancel anytime · No hidden charges</p>
      </div>
    </div>
  );
}

export default ReadingPlatform;
