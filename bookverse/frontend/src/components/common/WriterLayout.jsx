import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { LayoutDashboard, BookOpen, Upload, Users, MessageCircle, BarChart2, LogOut, CreditCard, Globe } from 'lucide-react';

const writerLinks = [
  { to: '/writer', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/writer/books', icon: BookOpen, label: 'My Books' },
  { to: '/writer/upload', icon: Upload, label: 'Upload Book' },
  { to: '/writer/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/writer/network', icon: Users, label: 'Writer Network' },
  { to: '/writer/chat', icon: MessageCircle, label: 'Messages' },
  { to: '/writer/subscription', icon: CreditCard, label: 'Subscription' },
];

export function WriterLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-indigo-950 text-white flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-indigo-900">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <BookOpen className="w-5 h-5 text-indigo-300" />
            Writer Studio
          </Link>
          <div className="flex items-center gap-2 mt-3">
            <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=4f46e5&color=fff`}
              alt={user?.name} className="w-8 h-8 rounded-full object-cover" />
            <div>
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-indigo-400 flex items-center gap-1"><Globe className="w-3 h-3" />{user?.writerProfile?.language || 'en'}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {writerLinks.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-indigo-700 text-white' : 'text-indigo-300 hover:bg-indigo-900 hover:text-white'}`}>
              <Icon className="w-4 h-4" /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-indigo-900 space-y-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-indigo-300 hover:bg-indigo-900 hover:text-white">
            <Globe className="w-4 h-4" /> Go to Store
          </Link>
          <button onClick={() => { dispatch(logout()); navigate('/'); }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-indigo-300 hover:bg-indigo-900 hover:text-red-400 w-full transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}

export default WriterLayout;
