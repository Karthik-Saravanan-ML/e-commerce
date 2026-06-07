import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, Flame, Headphones, BookOpen, Trophy } from 'lucide-react';
import api from '../../utils/api';
import BookCard from '../../components/common/BookCard';
import CategoryIcon from '../../components/common/CategoryIcon';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { CATEGORIES } from '../../utils/helpers';

const FORMAT_FILTERS = [
  { key: 'onSale', label: 'On Sale', icon: Flame },
  { key: 'isAudiobook', label: 'Audiobook', icon: Headphones },
  { key: 'isEbook', label: 'eBook', icon: BookOpen },
  { key: 'isBestSeller', label: 'Best Seller', icon: Trophy },
];

export function Shop() {
  const [searchParams] = useSearchParams();
  const [books, setBooks] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    isBestSeller: searchParams.get('isBestSeller') || '',
    onSale: searchParams.get('onSale') || '',
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

  const clearFilters = () => setFilters({
    search: '', category: '', isBestSeller: '', isAudiobook: '', isEbook: '', onSale: '',
    minPrice: '', maxPrice: '', sort: '-ratings', page: 1,
  });

  return (
    <div className="page-container py-8 sm:py-10">
      <PageHeader
        title="Book Shop"
        subtitle="Discover your next favorite read"
        breadcrumbs={[{ to: '/', label: 'Home' }, { label: 'Shop' }]}
      />

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <aside className={`w-full lg:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="card p-5 lg:sticky lg:top-24 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Filters</h3>
              <button onClick={clearFilters} className="text-xs text-primary-600 hover:text-primary-700 font-medium hover:underline">
                Clear all
              </button>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Category</p>
              <div className="space-y-0.5 max-h-52 overflow-y-auto pr-1">
                {[{ value: '', label: 'All Categories' }, ...CATEGORIES].map(({ value, label }) => (
                  <button
                    key={value || 'all'}
                    onClick={() => updateFilter('category', value)}
                    className={`w-full flex items-center gap-2.5 text-left text-sm px-3 py-2 rounded-xl transition-colors ${
                      filters.category === value ? 'bg-primary-50 text-primary-700 font-semibold' : 'hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    {value && <CategoryIcon category={value} className="w-4 h-4 flex-shrink-0" />}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Format</p>
              <div className="space-y-2">
                {FORMAT_FILTERS.map(({ key, label, icon: Icon }) => (
                  <label key={key} className="flex items-center gap-2.5 text-sm cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filters[key] === 'true'}
                      onChange={(e) => updateFilter(key, e.target.checked ? 'true' : '')}
                      className="accent-primary-600 rounded"
                    />
                    <Icon className="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
                    <span className="text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Price Range (₹)</p>
              <div className="flex gap-2">
                <input type="number" placeholder="Min" className="input text-sm py-2" value={filters.minPrice} onChange={(e) => updateFilter('minPrice', e.target.value)} />
                <input type="number" placeholder="Max" className="input text-sm py-2" value={filters.maxPrice} onChange={(e) => updateFilter('maxPrice', e.target.value)} />
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <Link to="/subscription" className="block mb-6 bg-gradient-to-r from-primary-700 to-indigo-700 text-white rounded-2xl p-5 sm:p-6 hover:shadow-card-hover transition-shadow">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-lg">Reading Subscription</p>
                <p className="text-primary-100 text-sm mt-1">Unlimited ebooks & audiobooks from ₹99/month</p>
              </div>
              <span className="hidden sm:inline bg-white/15 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap">View Plans</span>
            </div>
          </Link>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="input pl-10"
                placeholder="Search by title, author, or Book ID…"
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
              />
            </div>
            <select className="input w-full sm:w-44" value={filters.sort} onChange={(e) => updateFilter('sort', e.target.value)}>
              <option value="-ratings">Top Rated</option>
              <option value="-totalSales">Best Selling</option>
              <option value="-createdAt">Newest</option>
              <option value="price">Price: Low-High</option>
              <option value="-price">Price: High-Low</option>
            </select>
            <button onClick={() => setShowFilters(!showFilters)} className="lg:hidden btn-secondary flex items-center justify-center gap-2 py-2.5">
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </button>
          </div>

          <p className="text-sm text-gray-500 mb-4">{total} book{total !== 1 ? 's' : ''} found</p>

          {loading ? <LoadingSpinner /> : (
            <>
              {books.length === 0 ? (
                <div className="text-center py-20 text-gray-400 card">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="text-lg font-medium text-gray-600">No books found</p>
                  <p className="text-sm mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {books.map((book) => <BookCard key={book._id} book={book} />)}
                </div>
              )}

              {pages > 1 && (
                <div className="flex justify-center gap-2 mt-8 flex-wrap">
                  {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setFilters((prev) => ({ ...prev, page: p }))}
                      className={`min-w-[2.25rem] h-9 px-2 rounded-xl text-sm font-medium transition-colors ${
                        filters.page === p ? 'bg-primary-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-700 hover:border-primary-300'
                      }`}
                    >
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
