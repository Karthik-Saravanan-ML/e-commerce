import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { ShoppingCart, Heart, Search, BookOpen, User, LogOut, Menu, X, ChevronDown, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
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
    }
  };

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary-700">
            <BookOpen className="w-6 h-6" />
            BookVerse
          </Link>

          {/* Search bar - desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, author, or Book ID…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
            </div>
          </form>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/shop" className="text-sm text-gray-600 hover:text-primary-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">Shop</Link>
            <Link to="/library" className="text-sm text-gray-600 hover:text-primary-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">Library</Link>
            <Link to="/subscription" className="text-sm text-gray-600 hover:text-primary-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">Plans</Link>

            {user ? (
              <>
                <Link to="/wishlist" className="relative p-2 text-gray-600 hover:text-primary-600 rounded-lg hover:bg-gray-50">
                  <Heart className="w-5 h-5" />
                </Link>
                <Link to="/cart" className="relative p-2 text-gray-600 hover:text-primary-600 rounded-lg hover:bg-gray-50">
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </Link>

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <img
                      src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=6366f1&color=fff`}
                      alt={user.name}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <ChevronDown className="w-3 h-3 text-gray-500" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50" onClick={() => setUserMenuOpen(false)}>
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-medium text-sm text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                      </div>
                      <Link to="/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        <User className="w-4 h-4" /> My Profile
                      </Link>
                      <Link to="/orders" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        <ShoppingCart className="w-4 h-4" /> My Orders
                      </Link>
                      {user.role === 'writer' && (
                        <Link to="/writer" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                          <LayoutDashboard className="w-4 h-4" /> Writer Studio
                        </Link>
                      )}
                      {user.role === 'admin' && (
                        <Link to="/admin" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                          <LayoutDashboard className="w-4 h-4" /> Admin Panel
                        </Link>
                      )}
                      <hr className="my-1 border-gray-100" />
                      <button onClick={() => { dispatch(logout()); navigate('/'); }} className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full text-left">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Link to="/login" className="btn-ghost text-sm py-1.5">Login</Link>
                <Link to="/register" className="btn-primary text-sm py-1.5">Sign Up</Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-100 mt-1 pt-3 animate-fade-in">
            <form onSubmit={handleSearch} className="mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search books…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
            </form>
            <div className="flex flex-col gap-1">
              {[['/', 'Home'], ['/shop', 'Shop'], ['/library', 'Library'], ['/subscription', 'Plans']].map(([path, label]) => (
                <Link key={path} to={path} onClick={() => setMenuOpen(false)} className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">{label}</Link>
              ))}
              {user ? (
                <>
                  <Link to="/cart" onClick={() => setMenuOpen(false)} className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">Cart ({cartCount})</Link>
                  <Link to="/orders" onClick={() => setMenuOpen(false)} className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">Orders</Link>
                  {user.role === 'writer' && <Link to="/writer" onClick={() => setMenuOpen(false)} className="px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg">Writer Studio</Link>}
                  {user.role === 'admin' && <Link to="/admin" onClick={() => setMenuOpen(false)} className="px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg">Admin Panel</Link>}
                  <button onClick={() => { dispatch(logout()); navigate('/'); setMenuOpen(false); }} className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg text-left">Sign Out</button>
                </>
              ) : (
                <div className="flex gap-2 mt-2">
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-secondary flex-1 text-center text-sm">Login</Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary flex-1 text-center text-sm">Sign Up</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
