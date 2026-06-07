import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getMe } from './store/slices/authSlice';
import { fetchCart } from './store/slices/cartSlice';
import { useSocket } from './hooks/useSocket';

// Layouts
import UserLayout from './components/common/UserLayout';
import AdminLayout from './components/common/AdminLayout';
import WriterLayout from './components/common/WriterLayout';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/Register';
import { ResetPassword } from './pages/auth/Register';

// User pages
import Home from './pages/user/Home';
import Shop from './pages/user/Shop';
import BookDetail from './pages/user/BookDetail';
import Cart from './pages/user/Cart';
import Checkout from './pages/user/Checkout';
import OrderSuccess from './pages/user/OrderSuccess';
import MyOrders from './pages/user/MyOrders';
import OrderDetail from './pages/user/OrderDetail';
import { Wishlist } from './pages/user/MyOrders';
import ReadingPlatform from './pages/user/ReadingPlatform';
import { ReadBook } from './pages/user/ReadingPlatform';
import { ListenBook } from './pages/user/ReadingPlatform';
import { Subscription } from './pages/user/ReadingPlatform';
import { UserProfile } from './pages/user/MyOrders';
import { CategoryPage } from './pages/user/MyOrders';

// Writer pages
import WriterDashboard from './pages/writer/WriterDashboard';
import { WriterBooks } from './pages/writer/WriterDashboard';
import { UploadBook } from './pages/writer/WriterDashboard';
import { EditBook } from './pages/writer/WriterDashboard';
import { WriterAnalytics } from './pages/writer/WriterDashboard';
import { WriterSubscription } from './pages/writer/WriterDashboard';
import WriterNetwork from './pages/writer/WriterNetwork';
import { WriterChat } from './pages/writer/WriterNetwork';
import { WriterProfile } from './pages/writer/WriterNetwork';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import { AdminBooks } from './pages/admin/AdminDashboard';
import { AdminOrders } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminDashboard';
import { AdminBanners } from './pages/admin/AdminDashboard';
import { AdminAnalytics } from './pages/admin/AdminDashboard';

import LoadingSpinner from './components/common/LoadingSpinner';

// ─── Route Guards ─────────────────────────────────────────────────────────────

// ProtectedRoute: requires login. If not logged in → redirect to /login
const ProtectedRoute = ({ children, roles }) => {
  const { user, token, initialized } = useSelector((s) => s.auth);
  if (!initialized) return <LoadingSpinner fullScreen />;
  if (!token || !user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

// GuestRoute: if already logged in → redirect to their dashboard, NOT to home
// This fixes the "new tab shows dashboard" problem:
// GuestRoute checks token in localStorage each render, so new tab will
// not have an active Redux session yet → shows login page ✅
const GuestRoute = ({ children }) => {
  const { user, initialized } = useSelector((s) => s.auth);
  if (!initialized) return <LoadingSpinner fullScreen />;
  // Only redirect if we've confirmed the user is logged in (initialized + user exists)
  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'writer') return <Navigate to="/writer" replace />;
    return <Navigate to="/" replace />;
  }
  return children;
};

export default function App() {
  const dispatch = useDispatch();
  const { token } = useSelector((s) => s.auth);
  useSocket();

  useEffect(() => {
    if (token) {
      dispatch(getMe());
      dispatch(fetchCart());
    } else {
      dispatch({ type: 'auth/getMe/rejected', payload: null });
    }
  }, [token, dispatch]);

  return (
    <Routes>
      {/* Auth routes — only accessible when NOT logged in */}
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Public + User routes */}
      <Route element={<UserLayout />}>
        <Route index element={<Home />} />
        <Route path="shop" element={<Shop />} />
        <Route path="books/:id" element={<BookDetail />} />
        <Route path="category/:category" element={<CategoryPage />} />
        <Route path="subscription" element={<Subscription />} />

        <Route path="cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
        <Route path="checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="order-success/:id" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
        <Route path="orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
        <Route path="orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
        <Route path="wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
        <Route path="library" element={<ProtectedRoute><ReadingPlatform /></ProtectedRoute>} />
        <Route path="read/:bookId" element={<ProtectedRoute><ReadBook /></ProtectedRoute>} />
        <Route path="listen/:bookId" element={<ProtectedRoute><ListenBook /></ProtectedRoute>} />
      </Route>

      {/* Writer routes */}
      <Route path="/writer" element={<ProtectedRoute roles={['writer', 'admin']}><WriterLayout /></ProtectedRoute>}>
        <Route index element={<WriterDashboard />} />
        <Route path="books" element={<WriterBooks />} />
        <Route path="upload" element={<UploadBook />} />
        <Route path="edit/:id" element={<EditBook />} />
        <Route path="network" element={<WriterNetwork />} />
        <Route path="chat" element={<WriterChat />} />
        <Route path="chat/:conversationId" element={<WriterChat />} />
        <Route path="profile/:id" element={<WriterProfile />} />
        <Route path="analytics" element={<WriterAnalytics />} />
        <Route path="subscription" element={<WriterSubscription />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="books" element={<AdminBooks />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="banners" element={<AdminBanners />} />
        <Route path="analytics" element={<AdminAnalytics />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
