import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, ShoppingCart, Star, Headphones, BookOpen } from 'lucide-react';
import { addToCart } from '../../store/slices/cartSlice';
import { toggleWishlist } from '../../store/slices/cartSlice';
import { formatPrice, getDiscountedPrice, truncate } from '../../utils/helpers';

export default function BookCard({ book }) {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { wishlist } = useSelector((s) => s.cart);
  const isWishlisted = wishlist?.includes(book._id);

  const discountedPrice = getDiscountedPrice(book.price, book.discount);

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!user) { window.location.href = '/login'; return; }
    dispatch(addToCart({ bookId: book._id }));
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    if (!user) { window.location.href = '/login'; return; }
    dispatch(toggleWishlist(book._id));
  };

  return (
    <Link to={`/books/${book.bookId || book._id}`} className="book-card group block">
      <div className="card hover:shadow-md transition-all duration-300 h-full flex flex-col">
        {/* Cover image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
          <img
            src={book.coverImage}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {book.isBestSeller && <span className="badge bg-amber-100 text-amber-800">Best Seller</span>}
            {book.discount > 0 && <span className="badge bg-red-100 text-red-800">{book.discount}% off</span>}
            {book.isAudiobook && <span className="badge bg-purple-100 text-purple-800 flex items-center gap-1"><Headphones className="w-3 h-3" />Audio</span>}
            {book.isEbook && <span className="badge bg-blue-100 text-blue-800 flex items-center gap-1"><BookOpen className="w-3 h-3" />eBook</span>}
          </div>
          {/* Hover overlay */}
          <div className="book-overlay absolute inset-0 bg-black/40 opacity-0 flex items-end p-3 gap-2">
            <button onClick={handleAddToCart} className="flex-1 bg-primary-600 text-white text-xs py-2 rounded-lg flex items-center justify-center gap-1 hover:bg-primary-700">
              <ShoppingCart className="w-3 h-3" /> Add to Cart
            </button>
            <button onClick={handleWishlist} className={`p-2 rounded-lg ${isWishlisted ? 'bg-red-500 text-white' : 'bg-white text-gray-700'}`}>
              <Heart className="w-4 h-4" fill={isWishlisted ? 'white' : 'none'} />
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col gap-1 flex-1">
          <p className="text-xs text-gray-500 capitalize">{book.category}</p>
          <h3 className="font-medium text-sm text-gray-900 leading-snug line-clamp-2">{book.title}</h3>
          <p className="text-xs text-gray-500">{book.authorName}</p>

          {/* Rating */}
          {book.ratings > 0 && (
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-medium text-gray-700">{book.ratings.toFixed(1)}</span>
              <span className="text-xs text-gray-400">({book.numReviews})</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2 mt-auto pt-2">
            <span className="font-semibold text-gray-900">{formatPrice(discountedPrice)}</span>
            {book.discount > 0 && (
              <span className="text-xs text-gray-400 line-through">{formatPrice(book.price)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
