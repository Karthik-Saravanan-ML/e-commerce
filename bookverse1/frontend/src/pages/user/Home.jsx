import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ChevronRight, Headphones, BookOpen, Star, Zap, Truck, Smartphone,
  ShieldCheck, Trophy, Sparkles, TrendingUp, BadgePercent, PenLine,
} from 'lucide-react';
import api from '../../utils/api';
import BookCard from '../../components/common/BookCard';
import { CategoryIconBadge } from '../../components/common/CategoryIcon';
import SectionHeader from '../../components/common/SectionHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { CATEGORIES } from '../../utils/helpers';

const FEATURES = [
  { icon: Truck, title: 'Free Shipping', sub: 'On orders above ₹499' },
  { icon: Headphones, title: 'Audiobooks', sub: 'Chapter by chapter' },
  { icon: Smartphone, title: 'Read Anywhere', sub: 'eBook on any device' },
  { icon: ShieldCheck, title: 'Secure Payment', sub: 'Razorpay protected' },
];

const HERO_STATS = [
  { icon: BookOpen, val: '10,000+', label: 'Books' },
  { icon: Headphones, val: 'Audio', label: 'Chapters' },
  { icon: PenLine, val: '500+', label: 'Authors' },
  { icon: Star, val: '4.8', label: 'Avg Rating' },
  { icon: Truck, val: 'Fast', label: 'Delivery' },
  { icon: ShieldCheck, val: 'Secure', label: 'Payments' },
];

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

  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => setActiveBanner((prev) => (prev + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners]);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="pb-16">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-800 via-primary-700 to-indigo-800 text-white">
        {banners.length > 0 ? (
          <div className="relative h-72 sm:h-80 md:h-[420px]">
            {banners.map((banner, i) => (
              <div
                key={banner._id}
                className={`absolute inset-0 transition-opacity duration-700 ${i === activeBanner ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              >
                <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-gray-900/75 via-gray-900/40 to-transparent flex items-center">
                  <div className="page-container">
                    <div className="max-w-xl py-8">
                      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 tracking-tight">{banner.title}</h2>
                      {banner.subtitle && <p className="text-white/80 mb-5 text-sm sm:text-base">{banner.subtitle}</p>}
                      {banner.couponCode && (
                        <div className="inline-flex items-center gap-2 bg-amber-400 text-gray-900 px-4 py-2 rounded-full font-bold text-sm mb-4">
                          <Zap className="w-4 h-4" /> Use code: {banner.couponCode} — {banner.discountPercent}% OFF
                        </div>
                      )}
                      {banner.linkTo && (
                        <Link
                          to={banner.linkType === 'book' ? `/books/${banner.linkTo}` : `/category/${banner.linkTo}`}
                          className="inline-flex items-center gap-2 bg-white text-primary-700 px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-100 transition shadow-sm"
                        >
                          Shop Now <ChevronRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {banners.length > 1 && (
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveBanner(i)}
                    aria-label={`Banner ${i + 1}`}
                    className={`h-2 rounded-full transition-all ${i === activeBanner ? 'bg-white w-7' : 'bg-white/40 w-2 hover:bg-white/60'}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="page-container py-16 sm:py-20 lg:py-24">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-sm mb-6 border border-white/10">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  Over 10,000 books available
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4 tracking-tight">
                  Your complete book universe
                </h1>
                <p className="text-primary-100 text-base sm:text-lg mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">
                  Buy physical books, read ebooks, listen to audiobooks, and connect with authors worldwide — all in one place.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <Link to="/shop" className="btn-primary bg-white text-primary-700 hover:bg-gray-100 px-8 py-3">
                    Browse Books
                  </Link>
                  <Link to="/subscription" className="btn-secondary bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 px-8 py-3">
                    Reading Plans
                  </Link>
                </div>
              </div>
              <div className="hidden md:grid grid-cols-3 gap-3 w-full max-w-md lg:max-w-none lg:w-auto">
                {HERO_STATS.map(({ icon: Icon, val, label }) => (
                  <div key={label} className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/10">
                    <Icon className="w-5 h-5 mx-auto mb-2 text-primary-200" />
                    <div className="font-bold text-sm">{val}</div>
                    <div className="text-primary-200 text-xs mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Features strip */}
      <section className="bg-white border-b border-gray-100">
        <div className="page-container py-6 sm:py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {FEATURES.map(({ icon: Icon, title, sub }) => (
              <div key={title} className="feature-strip-item">
                <div className="feature-icon-wrap">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{title}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="page-container">
        {/* Categories */}
        <section className="mt-12 sm:mt-16">
          <SectionHeader title="Browse by Category" subtitle="Find your next read" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {CATEGORIES.map(({ value, label }) => (
              <Link
                key={value}
                to={`/category/${value}`}
                className="group flex flex-col items-center gap-2.5 p-4 sm:p-5 bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-card-hover transition-all text-center"
              >
                <CategoryIconBadge category={value} size="lg" />
                <span className="text-xs sm:text-sm font-semibold text-gray-700 group-hover:text-primary-700 transition-colors">{label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Best Sellers */}
        {bestSellers.length > 0 && (
          <section className="mt-14 sm:mt-16">
            <SectionHeader
              icon={Trophy}
              title="Best Sellers"
              subtitle="Top rated by our readers"
              actionLabel="View all"
              actionTo="/shop?isBestSeller=true"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {bestSellers.slice(0, 5).map((book) => <BookCard key={book._id} book={book} />)}
            </div>
          </section>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <section className="mt-14 sm:mt-16">
            <SectionHeader
              icon={Sparkles}
              title="Recommended for You"
              subtitle="Based on your reading history"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {recommendations.slice(0, 6).map((book) => <BookCard key={book._id} book={book} />)}
            </div>
          </section>
        )}

        {/* Subscription CTA */}
        {!user?.readingSubscription?.active && (
          <section className="mt-14 sm:mt-16">
            <div className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-indigo-700 to-purple-800 rounded-3xl p-8 sm:p-10 lg:p-12 text-white">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
              <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="flex-1 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 mb-4 text-primary-200 text-sm font-medium">
                    <BookOpen className="w-5 h-5" />
                    Reading Subscription
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight">Unlimited Books for ₹99/month</h2>
                  <p className="text-primary-100 text-base sm:text-lg max-w-lg">Access thousands of ebooks and audiobooks. Cancel anytime.</p>
                  <ul className="mt-5 space-y-2 text-sm text-primary-100 inline-block text-left">
                    {['Unlimited ebook access', 'Chapter-wise audiobooks', 'Offline reading', 'No ads'].map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center text-xs">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-shrink-0 w-full sm:w-auto">
                  <Link to="/subscription" className="block w-full sm:w-auto text-center bg-white text-primary-700 font-bold px-8 py-4 rounded-xl hover:bg-primary-50 transition text-lg shadow-sm">
                    Start Reading — ₹99/mo
                  </Link>
                  <p className="text-center text-primary-200 text-xs mt-3">No credit card required to browse</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* New Arrivals */}
        {newArrivals.length > 0 && (
          <section className="mt-14 sm:mt-16">
            <SectionHeader
              icon={BadgePercent}
              title="New Arrivals"
              subtitle="Fresh on the shelves"
              actionLabel="View all"
              actionTo="/shop?sort=-createdAt"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {newArrivals.slice(0, 8).map((book) => <BookCard key={book._id} book={book} />)}
            </div>
          </section>
        )}

        {/* Trending */}
        {trending.length > 0 && (
          <section className="mt-14 sm:mt-16 mb-4">
            <SectionHeader
              icon={TrendingUp}
              title="Trending Now"
              subtitle="Most viewed this week"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {trending.slice(0, 4).map((book) => <BookCard key={book._id} book={book} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
