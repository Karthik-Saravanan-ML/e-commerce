import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../../store/slices/authSlice';
import { BookOpen, Eye, EyeOff, AlertCircle, Headphones, PenLine } from 'lucide-react';

const STATS = [
  { icon: BookOpen, val: '10,000+', label: 'Books' },
  { icon: Headphones, val: 'Audio', label: 'Chapters' },
  { icon: PenLine, val: '500+', label: 'Authors' },
];

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((s) => s.auth);

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email.trim()) { setError('Please enter your email address.'); return; }
    if (!form.password) { setError('Please enter your password.'); return; }

    const result = await dispatch(login(form));

    if (login.fulfilled.match(result)) {
      const role = result.payload.user.role;
      if (role === 'admin') navigate('/admin', { replace: true });
      else if (role === 'writer') navigate('/writer', { replace: true });
      else navigate('/', { replace: true });
    } else {
      const msg = result.payload || 'Something went wrong. Please try again.';
      if (msg.toLowerCase().includes('password')) {
        setError('Incorrect password. Please check and try again.');
      } else if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('user')) {
        setError('No account found with this email address.');
      } else {
        setError(msg);
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-surface-50">
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary-700 via-primary-600 to-indigo-800 text-white flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />

        <div className="relative z-10 max-w-md w-full">
          <div className="flex items-center gap-3 mb-10">
            <span className="w-12 h-12 bg-white/15 backdrop-blur rounded-2xl flex items-center justify-center border border-white/10">
              <BookOpen className="w-7 h-7" />
            </span>
            <span className="text-3xl font-bold tracking-tight">BookVerse</span>
          </div>

          <h2 className="text-4xl font-extrabold leading-tight mb-4 tracking-tight">
            Your complete<br />book universe
          </h2>
          <p className="text-primary-100 text-lg leading-relaxed mb-10">
            Buy physical books, read ebooks, listen to audiobooks, and connect with authors worldwide.
          </p>

          <div className="grid grid-cols-3 gap-3">
            {STATS.map(({ icon: Icon, val, label }) => (
              <div key={label} className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/10">
                <Icon className="w-5 h-5 mx-auto mb-2 text-primary-200" />
                <div className="font-bold text-sm">{val}</div>
                <div className="text-primary-200 text-xs mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <span className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-sm">
              <BookOpen className="w-5 h-5 text-white" />
            </span>
            <span className="text-xl font-bold text-gray-900">BookVerse</span>
          </div>

          <div className="card p-8 sm:p-10">
            <h1 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">Welcome back</h1>
            <p className="text-gray-500 text-sm mb-7">Sign in to continue to BookVerse</p>

            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm animate-fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label className="label-sm">Email address</label>
                <input
                  type="email"
                  name="bv-login-email"
                  autoComplete="off"
                  className="input"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={(e) => { setForm({ ...form, email: e.target.value }); setError(''); }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-700">Password</label>
                  <Link to="/forgot-password" className="text-xs text-primary-600 hover:text-primary-700 font-medium hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="input pr-11"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) => { setForm({ ...form, password: e.target.value }); setError(''); }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-1">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </span>
                ) : 'Sign In'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              New to BookVerse?{' '}
              <Link to="/register" className="text-primary-600 font-semibold hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
