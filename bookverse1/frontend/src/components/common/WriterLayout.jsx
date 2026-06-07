import { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { LayoutDashboard, BookOpen, Upload, Users, MessageCircle, BarChart2, LogOut, CreditCard, Globe, Menu, X } from 'lucide-react';

const writerLinks = [
  { to: '/writer', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/writer/books', icon: BookOpen, label: 'My Books' },
  { to: '/writer/upload', icon: Upload, label: 'Upload Book' },
  { to: '/writer/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/writer/network', icon: Users, label: 'Writer Network' },
  { to: '/writer/chat', icon: MessageCircle, label: 'Messages' },
  { to: '/writer/subscription', icon: CreditCard, label: 'Subscription' },
];

function SidebarContent({ user, onNavigate, onLogout }) {
  return (
    <>
      <div className="p-5 border-b border-primary-900/50">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-2.5 font-bold text-lg">
          <span className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </span>
          <div>
            <span className="block leading-tight">Writer Studio</span>
            <span className="text-xs font-normal text-primary-300/70">BookVerse</span>
          </div>
        </Link>
        <div className="flex items-center gap-3 mt-4 p-2.5 rounded-xl bg-primary-900/40">
          <img
            src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=4f46e5&color=fff`}
            alt={user?.name}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-primary-700"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-xs text-primary-300/80 flex items-center gap-1">
              <Globe className="w-3 h-3 flex-shrink-0" />
              {user?.writerProfile?.language || 'en'}
            </p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {writerLinks.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'bg-primary-600 text-white shadow-sm' : 'text-primary-200/80 hover:bg-primary-900/60 hover:text-white'}`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-primary-900/50 space-y-1">
        <Link
          to="/"
          onClick={onNavigate}
          className="sidebar-link text-primary-200/80 hover:bg-primary-900/60 hover:text-white"
        >
          <Globe className="w-4 h-4" /> Go to Store
        </Link>
        <button
          onClick={onLogout}
          className="sidebar-link text-primary-200/80 hover:bg-primary-900/60 hover:text-red-300 w-full"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </>
  );
}

export function WriterLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-surface-50">
      <aside className="hidden lg:flex w-64 bg-primary-950 text-white flex-col flex-shrink-0">
        <SidebarContent user={user} onLogout={handleLogout} />
      </aside>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 max-w-[85vw] bg-primary-950 text-white flex flex-col h-full animate-slide-in-left shadow-xl">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-primary-300 hover:text-white hover:bg-primary-900"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent user={user} onNavigate={() => setSidebarOpen(false)} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 shadow-sm flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl hover:bg-gray-50" aria-label="Open menu">
            <Menu className="w-5 h-5 text-gray-700" />
          </button>
          <span className="font-semibold text-gray-900">Writer Studio</span>
        </header>
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default WriterLayout;
