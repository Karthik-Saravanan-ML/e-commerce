import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ChevronRight, Headphones, BookOpen, Star, Zap } from 'lucide-react';
import api from '../../utils/api';
import BookCard from '../../components/common/BookCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { CATEGORIES, formatPrice } from '../../utils/helpers';

export default function Home() {
  const { user } = useSelector((s) => s.auth);
  const [banners, setBanners] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [trending, setTrending] = useState([]);
  const [activeBanner, setActiveBanner] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [bannersRes, bestRes, newRes, trendRes] = await Promise.all([
          api.get('/banners?type=main'),
          api.get('/books/best-sellers'),
          api.get('/books?sort=-createdAt&limit=8'),
          api.get('/recommend/trending'),
        ]);
        setBanners(bannersRes.data.banners || []);
        setBestSellers(bestRes.data.books || []);
        setNewArrivals(newRes.data.books || []);
        setTrending(trendRes.data.books || []);

        if (user) {
          const recRes = await api.get('/recommend');
          setRecommendations(recRes.data.recommendations || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  // Auto-advance banner
  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => setActiveBanner((prev) => (prev + 1) % banners.length), 4000);
    return () => clearInterval(t);
  }, [banners]);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="pb-16">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-indigo-700 to-purple-800 text-white">
        {banners.length > 0 ? (
          <div className="relative h-80 md:h-[420px]">
            {banners.map((banner, i) => (
              <div key={banner._id}
                className={`absolute inset-0 transition-opacity duration-700 ${i === activeBanner ? 'opacity-100' : 'opacity-0'}`}>
                <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center">
                  <div className="px-8 md:px-16 max-w-lg">
                    <h2 className="text-3xl md:text-4xl font-bold mb-3">{banner.title}</h2>
                    {banner.subtitle && <p className="text-white/80 mb-5">{banner.subtitle}</p>}
                    {banner.couponCode && (
                      <div className="inline-flex items-center gap-2 bg-amber-400 text-gray-900 px-4 py-2 rounded-full font-bold text-sm mb-4">
                        <Zap className="w-4 h-4" /> Use code: {banner.couponCode} — {banner.discountPercent}% OFF
                      </div>
                    )}
                    {banner.linkTo && (
                      <Link to={banner.linkType === 'book' ? `/books/${banner.linkTo}` : `/category/${banner.linkTo}`}
                        className="inline-flex items-center gap-2 bg-white text-primary-700 px-6 py-2.5 rounded-full font-semibold hover:bg-gray-100 transition">
                        Shop Now <ChevronRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {/* Dots */}
            {banners.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {banners.map((_, i) => (
                  <button key={i} onClick={() => setActiveBanner(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === activeBanner ? 'bg-white w-6' : 'bg-white/50'}`} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-sm mb-5">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Over 10,000 books available
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">Your complete<br />book universe</h1>
              <p className="text-indigo-200 text-lg mb-8 leading-relaxed">Buy, read, listen and connect with the world's best authors — all in one place.</p>
              <div className="flex gap-3">
                <Link to="/shop" className="bg-white text-primary-700 px-7 py-3 rounded-full font-semibold hover:bg-gray-100 transition">Browse Books</Link>
                <Link to="/subscription" className="bg-white/10 border border-white/30 text-white px-7 py-3 rounded-full font-semibold hover:bg-white/20 transition">Reading Plans</Link>
              </div>
            </div>
            <div className="hidden md:grid grid-cols-3 gap-3 text-center">
              {['📚\n10K+ Books', '🎧\nAudiobooks', '✍️\n500+ Authors', '⭐\n4.8 Avg Rating', '🚚\nFast Delivery', '🔒\nSecure Pay'].map((item, i) => (
                <div key={i} className="bg-white/10 rounded-2xl p-4 text-sm whitespace-pre-line font-medium">{item}</div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Platform features strip */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[['🚚', 'Free Shipping', 'On orders above ₹499'],['🎧','Audiobooks','Chapter by chapter'],['📱','Read Anywhere','eBook on any device'],['🔒','Secure Payment','Razorpay protected']].map(([emoji, title, sub]) => (
            <div key={title} className="flex items-center gap-3 text-sm">
              <span className="text-2xl">{emoji}</span>
              <div><p className="font-medium text-gray-900">{title}</p><p className="text-gray-500 text-xs">{sub}</p></div>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6">
        {/* Categories */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="section-title">Browse by Category</h2>
              <p className="section-subtitle">Find your next read</p>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 gap-3">
            {CATEGORIES.map(({ value, label, emoji }) => (
              <Link key={value} to={`/category/${value}`}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50 hover:shadow-sm transition-all text-center group">
                <span className="text-3xl group-hover:scale-110 transition-transform">{emoji}</span>
                <span className="text-xs font-medium text-gray-700">{label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Best Sellers */}
        {bestSellers.length > 0 && (
          <section className="mt-14">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="section-title">🏆 Best Sellers</h2>
                <p className="section-subtitle">Top rated by our readers</p>
              </div>
              <Link to="/shop?isBestSeller=true" className="flex items-center gap-1 text-sm text-primary-600 hover:underline">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4">
              {bestSellers.slice(0, 5).map((book) => <BookCard key={book._id} book={book} />)}
            </div>
          </section>
        )}

        {/* Personalized Recommendations */}
        {recommendations.length > 0 && (
          <section className="mt-14">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="section-title">✨ Recommended for You</h2>
                <p className="section-subtitle">Based on your reading history</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recommendations.slice(0, 6).map((book) => <BookCard key={book._id} book={book} />)}
            </div>
          </section>
        )}

        {/* Subscription banner */}
        {!user?.readingSubscription?.active && (
          <section className="mt-14">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-6 h-6" />
                  <span className="font-semibold text-purple-200">Reading Subscription</span>
                </div>
                <h2 className="text-3xl font-bold mb-2">Unlimited Books for ₹99/month</h2>
                <p className="text-purple-200 text-lg">Access thousands of ebooks and audiobooks. Cancel anytime.</p>
                <ul className="mt-4 space-y-1 text-sm text-purple-100">
                  {['Unlimited ebook access', 'Chapter-wise audiobooks', 'Offline reading', 'No ads'].map(f => (
                    <li key={f} className="flex items-center gap-2">✓ {f}</li>
                  ))}
                </ul>
              </div>
              <div className="flex-shrink-0">
                <Link to="/subscription" className="bg-white text-purple-700 font-bold px-8 py-4 rounded-full hover:bg-purple-50 transition text-lg block text-center">
                  Start Reading — ₹99/mo
                </Link>
                <p className="text-center text-purple-200 text-xs mt-2">No credit card required to browse</p>
              </div>
            </div>
          </section>
        )}

        {/* New Arrivals */}
        {newArrivals.length > 0 && (
          <section className="mt-14">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="section-title">🆕 New Arrivals</h2>
                <p className="section-subtitle">Fresh on the shelves</p>
              </div>
              <Link to="/shop?sort=-createdAt" className="flex items-center gap-1 text-sm text-primary-600 hover:underline">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
              {newArrivals.slice(0, 8).map((book) => <BookCard key={book._id} book={book} />)}
            </div>
          </section>
        )}

        {/* Trending */}
        {trending.length > 0 && (
          <section className="mt-14">
            <h2 className="section-title">🔥 Trending Now</h2>
            <p className="section-subtitle">Most viewed this week</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {trending.slice(0, 4).map((book) => <BookCard key={book._id} book={book} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
