import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { ShoppingCart, Heart, Search, BookOpen, User, LogOut, Menu, X, ChevronDown, LayoutDashboard, Library } from 'lucide-react';

const NAV_LINKS = [
  { to: '/shop', label: 'Shop' },
  { to: '/library', label: 'Library', icon: Library },
  { to: '/subscription', label: 'Plans' },
];

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((s) => s.auth);
  const { items } = useSelector((s) => s.cart);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const cartCount = items?.reduce((acc, i) => acc + i.quantity, 0) || 0;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMenuOpen(false);
    }
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-nav">
      <div className="page-container">
        <div className="flex items-center justify-between h-16 lg:h-[4.25rem] gap-4">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-lg sm:text-xl text-gray-900 flex-shrink-0">
            <span className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center shadow-sm">
              <BookOpen className="w-5 h-5 text-white" />
            </span>
            <span className="hidden xs:inline tracking-tight">BookVerse</span>
          </Link>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by title, author, or Book ID…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 focus:bg-white transition-all"
              />
            </div>
          </form>

          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`nav-link ${isActive(to) ? 'nav-link-active' : ''}`}
              >
                {label}
              </Link>
            ))}

            {user ? (
              <>
                <Link to="/wishlist" className="relative p-2.5 text-gray-500 hover:text-primary-600 rounded-xl hover:bg-gray-50 transition-colors" aria-label="Wishlist">
                  <Heart className="w-5 h-5" />
                </Link>
                <Link to="/cart" className="relative p-2.5 text-gray-500 hover:text-primary-600 rounded-xl hover:bg-gray-50 transition-colors" aria-label="Cart">
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[1.125rem] h-[1.125rem] px-1 bg-primary-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </Link>

                <div className="relative ml-1">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
                  >
                    <img
                      src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=4f46e5&color=fff`}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-white"
                    />
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-60 bg-white border border-gray-100 rounded-2xl shadow-card-hover py-1.5 z-50 animate-fade-in">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="font-semibold text-sm text-gray-900 truncate">{user.name}</p>
                          <p className="text-xs text-gray-500 capitalize mt-0.5">{user.role} account</p>
                        </div>
                        <div className="py-1">
                          <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                            <User className="w-4 h-4 text-gray-400" /> My Profile
                          </Link>
                          <Link to="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                            <ShoppingCart className="w-4 h-4 text-gray-400" /> My Orders
                          </Link>
                          {user.role === 'writer' && (
                            <Link to="/writer" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                              <LayoutDashboard className="w-4 h-4 text-gray-400" /> Writer Studio
                            </Link>
                          )}
                          {user.role === 'admin' && (
                            <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                              <LayoutDashboard className="w-4 h-4 text-gray-400" /> Admin Panel
                            </Link>
                          )}
                        </div>
                        <hr className="border-gray-100" />
                        <button
                          onClick={() => { dispatch(logout()); navigate('/'); setUserMenuOpen(false); }}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                        >
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Link to="/login" className="btn-ghost text-sm py-2">Login</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">Sign Up</Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 md:hidden">
            {user && (
              <Link to="/cart" className="relative p-2 text-gray-600" aria-label="Cart">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-primary-600 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>
            )}
            <button className="p-2 rounded-xl hover:bg-gray-50" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-5 border-t border-gray-100 pt-4 animate-slide-up">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search books…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </form>
            <div className="flex flex-col gap-0.5">
              {[['/', 'Home'], ...NAV_LINKS.map(l => [l.to, l.label])].map(([path, label]) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMenuOpen(false)}
                  className={`px-3 py-2.5 text-sm rounded-xl ${isActive(path) ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  {label}
                </Link>
              ))}
              {user ? (
                <>
                  <Link to="/wishlist" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl">Wishlist</Link>
                  <Link to="/orders" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl">Orders</Link>
                  <Link to="/profile" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl">Profile</Link>
                  {user.role === 'writer' && <Link to="/writer" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 text-sm text-primary-600 font-medium hover:bg-primary-50 rounded-xl">Writer Studio</Link>}
                  {user.role === 'admin' && <Link to="/admin" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 text-sm text-primary-600 font-medium hover:bg-primary-50 rounded-xl">Admin Panel</Link>}
                  <button onClick={() => { dispatch(logout()); navigate('/'); setMenuOpen(false); }} className="px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl text-left mt-1">Sign Out</button>
                </>
              ) : (
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-secondary flex-1 text-center text-sm py-2.5">Login</Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary flex-1 text-center text-sm py-2.5">Sign Up</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
