// ─── Shop.jsx ─────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import api from '../../utils/api';
import BookCard from '../../components/common/BookCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { CATEGORIES } from '../../utils/helpers';

export function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [books, setBooks] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    isBestSeller: searchParams.get('isBestSeller') || '',
    isAudiobook: searchParams.get('isAudiobook') || '',
    isEbook: searchParams.get('isEbook') || '',
    minPrice: '', maxPrice: '',
    sort: searchParams.get('sort') || '-ratings',
    page: 1,
  });

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      params.set('limit', '12');
      const { data } = await api.get(`/books?${params}`);
      setBooks(data.books);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const updateFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar filters */}
        <aside className={`w-full md:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden md:block'}`}>
          <div className="card p-5 sticky top-20 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Filters</h3>
              <button onClick={() => setFilters({ search: '', category: '', isBestSeller: '', isAudiobook: '', isEbook: '', minPrice: '', maxPrice: '', sort: '-ratings', page: 1 })}
                className="text-xs text-primary-600 hover:underline">Clear all</button>
            </div>
            {/* Category */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Category</p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {[{ value: '', label: 'All Categories' }, ...CATEGORIES].map(({ value, label, emoji }) => (
                  <button key={value} onClick={() => updateFilter('category', value)}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${filters.category === value ? 'bg-primary-100 text-primary-700 font-medium' : 'hover:bg-gray-50 text-gray-600'}`}>
                    {emoji && `${emoji} `}{label}
                  </button>
                ))}
              </div>
            </div>
            {/* Format */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Format</p>
              <div className="space-y-2">
                {[['isAudiobook', '🎧 Audiobook'], ['isEbook', '📱 eBook'], ['isBestSeller', '🏆 Best Seller']].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={filters[key] === 'true'} onChange={(e) => updateFilter(key, e.target.checked ? 'true' : '')} className="accent-primary-600" />
                    <span className="text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            {/* Price range */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Price Range (₹)</p>
              <div className="flex gap-2">
                <input type="number" placeholder="Min" className="input text-sm py-2" value={filters.minPrice} onChange={(e) => updateFilter('minPrice', e.target.value)} />
                <input type="number" placeholder="Max" className="input text-sm py-2" value={filters.maxPrice} onChange={(e) => updateFilter('maxPrice', e.target.value)} />
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1">
          {/* Search and sort bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input className="input pl-9" placeholder="Search by title, author, or Book ID…"
                value={filters.search} onChange={(e) => updateFilter('search', e.target.value)} />
            </div>
            <select className="input w-full sm:w-44" value={filters.sort} onChange={(e) => updateFilter('sort', e.target.value)}>
              <option value="-ratings">Top Rated</option>
              <option value="-totalSales">Best Selling</option>
              <option value="-createdAt">Newest</option>
              <option value="price">Price: Low-High</option>
              <option value="-price">Price: High-Low</option>
            </select>
            <button onClick={() => setShowFilters(!showFilters)} className="md:hidden btn-secondary flex items-center gap-2 py-2.5">
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </button>
          </div>

          {/* Results info */}
          <p className="text-sm text-gray-500 mb-4">{total} books found</p>

          {loading ? <LoadingSpinner /> : (
            <>
              {books.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">No books found</p>
                  <p className="text-sm">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {books.map((book) => <BookCard key={book._id} book={book} />)}
                </div>
              )}

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => setFilters((prev) => ({ ...prev, page: p }))}
                      className={`w-9 h-9 rounded-lg text-sm font-medium ${filters.page === p ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-primary-300'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Shop;
