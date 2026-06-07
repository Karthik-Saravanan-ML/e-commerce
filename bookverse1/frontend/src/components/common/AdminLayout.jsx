import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { LayoutDashboard, BookOpen, ShoppingBag, Users, Image, BarChart2, LogOut, Menu, X } from 'lucide-react';

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/books', icon: BookOpen, label: 'Books' },
  { to: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/banners', icon: Image, label: 'Banners' },
  { to: '/admin/analytics', icon: BarChart2, label: 'Analytics' },
];

function SidebarContent({ user, onNavigate, onLogout }) {
  return (
    <>
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-2.5 font-bold text-lg">
          <span className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </span>
          <div>
            <span className="block leading-tight">BookVerse</span>
            <span className="text-xs font-normal text-gray-500">Admin Panel</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3 truncate">{user?.email}</p>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {adminLinks.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-800">
        <button
          onClick={onLogout}
          className="sidebar-link sidebar-link-inactive hover:text-red-400 w-full"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </>
  );
}

export function AdminLayout() {
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
      <aside className="hidden lg:flex w-64 bg-gray-900 text-white flex-col flex-shrink-0">
        <SidebarContent user={user} onLogout={handleLogout} />
      </aside>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 max-w-[85vw] bg-gray-900 text-white flex flex-col h-full animate-slide-in-left shadow-xl">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
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
          <span className="font-semibold text-gray-900">Admin Panel</span>
        </header>
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
