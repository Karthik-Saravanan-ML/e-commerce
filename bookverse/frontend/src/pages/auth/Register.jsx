import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../../store/slices/authSlice';
import { BookOpen } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

// ─── Register ─────────────────────────────────────────────────────────────────
export function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user', phone: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(register(form));
    if (register.fulfilled.match(result)) {
      const role = result.payload.user.role;
      navigate(role === 'writer' ? '/writer/subscription' : '/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 mb-8 justify-center">
          <BookOpen className="w-7 h-7 text-primary-600" />
          <span className="text-xl font-bold text-primary-700">BookVerse</span>
        </Link>
        <div className="card p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create account</h1>
          <p className="text-gray-500 text-sm mb-6">Join the BookVerse community</p>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[['user', '🛍️ Reader / Buyer'], ['writer', '✍️ Author / Writer']].map(([role, label]) => (
              <button key={role} type="button" onClick={() => setForm({ ...form, role })}
                className={`py-3 rounded-xl text-sm font-medium border-2 transition-all ${form.role === role ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Full Name</label>
              <input className="input" placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
              <input type="email" className="input" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Phone (optional)</label>
              <input className="input" placeholder="+91 98765 43210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Password</label>
              <input type="password" className="input" placeholder="Min. 6 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
          {form.role === 'writer' && (
            <p className="mt-3 text-xs text-amber-700 bg-amber-50 rounded-lg p-3">
              📢 Writers need an active subscription to publish books. After signup you'll be taken to the subscription page.
            </p>
          )}
          <p className="mt-5 text-center text-sm text-gray-500">
            Already have an account? <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── ForgotPassword ───────────────────────────────────────────────────────────
export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Reset link sent to your email');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md card p-8">
        <h1 className="text-2xl font-bold mb-1">Forgot Password</h1>
        <p className="text-gray-500 text-sm mb-6">We'll send a reset link to your email</p>
        {sent ? (
          <div className="bg-green-50 text-green-800 rounded-xl p-4 text-sm">
            ✅ Check your inbox! A reset link has been sent to <strong>{email}</strong>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="email" className="input" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">{loading ? 'Sending…' : 'Send Reset Link'}</button>
          </form>
        )}
        <p className="mt-5 text-center text-sm"><Link to="/login" className="text-primary-600 hover:underline">Back to login</Link></p>
      </div>
    </div>
  );
}

// ─── ResetPassword ────────────────────────────────────────────────────────────
export function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/auth/reset-password/${token}`, { password });
      toast.success('Password reset successful');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md card p-8">
        <h1 className="text-2xl font-bold mb-1">Reset Password</h1>
        <p className="text-gray-500 text-sm mb-6">Enter your new password</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="password" className="input" placeholder="New password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">{loading ? 'Resetting…' : 'Reset Password'}</button>
        </form>
      </div>
    </div>
  );
}

export default Register;
