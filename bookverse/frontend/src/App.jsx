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
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// User pages
import Home from './pages/user/Home';
import Shop from './pages/user/Shop';
import BookDetail from './pages/user/BookDetail';
import Cart from './pages/user/Cart';
import Checkout from './pages/user/Checkout';
import OrderSuccess from './pages/user/OrderSuccess';
import MyOrders from './pages/user/MyOrders';
import OrderDetail from './pages/user/OrderDetail';
import Wishlist from './pages/user/Wishlist';
import ReadingPlatform from './pages/user/ReadingPlatform';
import ReadBook from './pages/user/ReadBook';
import ListenBook from './pages/user/ListenBook';
import Subscription from './pages/user/Subscription';
import UserProfile from './pages/user/UserProfile';
import CategoryPage from './pages/user/CategoryPage';

// Writer pages
import WriterDashboard from './pages/writer/WriterDashboard';
import UploadBook from './pages/writer/UploadBook';
import EditBook from './pages/writer/EditBook';
import WriterBooks from './pages/writer/WriterBooks';
import WriterNetwork from './pages/writer/WriterNetwork';
import WriterChat from './pages/writer/WriterChat';
import WriterProfile from './pages/writer/WriterProfile';
import WriterAnalytics from './pages/writer/WriterAnalytics';
import WriterSubscription from './pages/writer/WriterSubscription';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBooks from './pages/admin/AdminBooks';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminBanners from './pages/admin/AdminBanners';
import AdminAnalytics from './pages/admin/AdminAnalytics';

import LoadingSpinner from './components/common/LoadingSpinner';

// Guards
const ProtectedRoute = ({ children, roles }) => {
  const { user, token, initialized } = useSelector((s) => s.auth);
  if (!initialized) return <LoadingSpinner fullScreen />;
  if (!token || !user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const GuestRoute = ({ children }) => {
  const { user } = useSelector((s) => s.auth);
  if (user) return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((s) => s.auth);
  useSocket(); // Initialize socket connection

  useEffect(() => {
    if (token) {
      dispatch(getMe());
      dispatch(fetchCart());
    } else {
      // No token — mark as initialized so the spinner goes away
      dispatch({ type: 'auth/getMe/rejected', payload: null });
    }
  }, [token, dispatch]);

  return (
    <Routes>
      {/* Guest routes */}
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* User / Public routes */}
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

        {/* Reading platform */}
        <Route path="library" element={<ProtectedRoute roles={['user', 'writer', 'admin']}><ReadingPlatform /></ProtectedRoute>} />
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
