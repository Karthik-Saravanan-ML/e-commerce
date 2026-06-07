import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Star, ShoppingCart, Heart, BookOpen, Headphones, Package, ChevronRight } from 'lucide-react';
import api from '../../utils/api';
import { addToCart, toggleWishlist } from '../../store/slices/cartSlice';
import { formatPrice, getDiscountedPrice, formatDate, CATEGORIES } from '../../utils/helpers';
import BookCard from '../../components/common/BookCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function BookDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { wishlist } = useSelector((s) => s.cart);
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [bookRes, simRes] = await Promise.all([
          api.get(`/books/${id}`),
          api.get(`/recommend/similar/${id}`).catch(() => ({ data: { books: [] } })),
        ]);
        setBook(bookRes.data.book);
        setReviews(bookRes.data.reviews || []);
        setSimilar(simRes.data.books || []);
      } catch { } finally { setLoading(false); }
    };
    load();
    window.scrollTo(0, 0);
  }, [id]);

  const isWishlisted = wishlist?.includes(book?._id);
  const discountedPrice = book ? getDiscountedPrice(book.price, book.discount) : 0;

  const handleAddToCart = () => {
    if (!user) { window.location.href = '/login'; return; }
    dispatch(addToCart({ bookId: book._id }));
  };

  const handleWishlist = () => {
    if (!user) { window.location.href = '/login'; return; }
    dispatch(toggleWishlist(book._id));
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please login to review'); return; }
    setSubmittingReview(true);
    try {
      const { data } = await api.post(`/reviews/${book._id}`, reviewForm);
      setReviews((prev) => [data.review, ...prev]);
      setReviewForm({ rating: 5, title: '', comment: '' });
      toast.success('Review submitted');
      // Re-fetch book to get updated ratings
      const bookRes = await api.get(`/books/${id}`);
      setBook(bookRes.data.book);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Review failed');
    } finally { setSubmittingReview(false); }
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!book) return <div className="text-center py-20">Book not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-primary-600">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to={`/category/${book.category}`} className="hover:text-primary-600 capitalize">{book.category}</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-900">{book.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Cover */}
        <div className="lg:col-span-2">
          <div className="sticky top-24">
            <div className="rounded-2xl overflow-hidden shadow-xl max-w-sm mx-auto">
              <img src={book.coverImage} alt={book.title} className="w-full object-cover" />
            </div>
            <div className="flex items-center justify-center gap-3 mt-4">
              {book.bookId && (
                <span className="badge bg-gray-100 text-gray-600 text-xs font-mono">ID: {book.bookId}</span>
              )}
              {book.isAudiobook && <span className="badge bg-purple-100 text-purple-800 flex items-center gap-1"><Headphones className="w-3 h-3" /> Audiobook</span>}
              {book.isEbook && <span className="badge bg-blue-100 text-blue-800 flex items-center gap-1"><BookOpen className="w-3 h-3" /> eBook</span>}
              {book.isPhysical && <span className="badge bg-green-100 text-green-800 flex items-center gap-1"><Package className="w-3 h-3" /> Physical</span>}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-3 space-y-5">
          <div>
            <p className="text-sm text-primary-600 font-medium capitalize mb-1">{book.category}</p>
            <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-2">{book.title}</h1>
            <p className="text-gray-600">by <Link to={`/writer/${book.author?._id}`} className="text-primary-600 hover:underline font-medium">{book.authorName}</Link></p>
          </div>

          {/* Rating bar */}
          {book.ratings > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className={`w-5 h-5 ${i < Math.round(book.ratings) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                ))}
              </div>
              <span className="font-semibold text-gray-800">{book.ratings.toFixed(1)}</span>
              <span className="text-gray-500 text-sm">({book.numReviews} reviews)</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-gray-900">{formatPrice(discountedPrice)}</span>
            {book.discount > 0 && (
              <>
                <span className="text-lg text-gray-400 line-through">{formatPrice(book.price)}</span>
                <span className="badge bg-red-100 text-red-700">{book.discount}% off</span>
              </>
            )}
          </div>

          {/* Book info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[['Language', book.language], ['Pages', book.pages], ['Publisher', book.publisher], ['Year', book.publishedYear]].filter(([,v]) => v).map(([k, v]) => (
              <div key={k} className="bg-gray-50 rounded-xl p-3">
                <p className="text-gray-500 text-xs mb-1">{k}</p>
                <p className="font-medium text-gray-800">{v}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {book.isPhysical && book.stock > 0 ? (
              <button onClick={handleAddToCart} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 text-base">
                <ShoppingCart className="w-5 h-5" /> Add to Cart
              </button>
            ) : book.isPhysical ? (
              <button disabled className="flex-1 py-3 bg-gray-200 text-gray-500 rounded-lg font-medium cursor-not-allowed">Out of Stock</button>
            ) : null}

            {book.isEbook && user?.readingSubscription?.active && (
              <Link to={`/read/${book._id}`} className="btn-secondary flex-1 py-3 flex items-center justify-center gap-2 text-base text-center">
                <BookOpen className="w-5 h-5" /> Read Now
              </Link>
            )}

            {book.isAudiobook && user?.readingSubscription?.active && (
              <Link to={`/listen/${book._id}`} className="flex items-center justify-center gap-2 px-5 py-3 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition">
                <Headphones className="w-5 h-5" /> Listen
              </Link>
            )}

            <button onClick={handleWishlist} className={`p-3 rounded-lg border-2 transition-all ${isWishlisted ? 'bg-red-50 border-red-300 text-red-500' : 'border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-400'}`}>
              <Heart className="w-5 h-5" fill={isWishlisted ? 'currentColor' : 'none'} />
            </button>
          </div>

          {!user?.readingSubscription?.active && (book.isEbook || book.isAudiobook) && (
            <div className="bg-purple-50 rounded-xl p-4 text-sm text-purple-700 flex items-center justify-between">
              <span className="flex items-center gap-2"><Headphones className="w-4 h-4 flex-shrink-0" /> Subscribe to read/listen to this book digitally</span>
              <Link to="/subscription" className="font-semibold underline">View plans</Link>
            </div>
          )}

          {/* Tabs */}
          <div className="border-t border-gray-100 pt-5">
            <div className="flex gap-1 mb-4">
              {['details', 'reviews'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${activeTab === tab ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:bg-gray-100'}`}>
                  {tab} {tab === 'reviews' && `(${reviews.length})`}
                </button>
              ))}
            </div>

            {activeTab === 'details' && (
              <p className="text-gray-700 leading-relaxed">{book.description}</p>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-5">
                {/* Write review */}
                {user && (
                  <form onSubmit={submitReview} className="bg-gray-50 rounded-2xl p-5 space-y-3">
                    <h4 className="font-semibold">Write a Review</h4>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <button key={i} type="button" onClick={() => setReviewForm((p) => ({ ...p, rating: i + 1 }))}>
                          <Star className={`w-6 h-6 cursor-pointer ${i < reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                        </button>
                      ))}
                    </div>
                    <input className="input" placeholder="Review title" value={reviewForm.title} onChange={(e) => setReviewForm((p) => ({ ...p, title: e.target.value }))} />
                    <textarea className="input resize-none" rows={3} placeholder="Share your thoughts…" value={reviewForm.comment} onChange={(e) => setReviewForm((p) => ({ ...p, comment: e.target.value }))} required />
                    <button type="submit" disabled={submittingReview} className="btn-primary py-2">
                      {submittingReview ? 'Submitting…' : 'Submit Review'}
                    </button>
                  </form>
                )}

                {reviews.length === 0 ? (
                  <p className="text-gray-500 text-sm">No reviews yet. Be the first!</p>
                ) : reviews.map((review) => (
                  <div key={review._id} className="bg-white border border-gray-100 rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <img src={review.userAvatar || `https://ui-avatars.com/api/?name=${review.userName}&background=6366f1&color=fff`}
                          alt={review.userName} className="w-9 h-9 rounded-full" />
                        <div>
                          <p className="font-medium text-sm">{review.userName}
                            {review.isVerifiedPurchase && <span className="ml-2 badge bg-green-100 text-green-700 text-xs">✓ Verified</span>}
                          </p>
                          <p className="text-xs text-gray-400">{formatDate(review.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                        ))}
                      </div>
                    </div>
                    {review.title && <p className="font-medium text-sm mb-1">{review.title}</p>}
                    <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Similar books */}
      {similar.length > 0 && (
        <section className="mt-16">
          <h2 className="section-title">You may also like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 mt-5">
            {similar.map((book) => <BookCard key={book._id} book={book} />)}
          </div>
        </section>
      )}
    </div>
  );
}
