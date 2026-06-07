import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../../store/slices/authSlice';
import { BookOpen, Eye, EyeOff, AlertCircle, Check, Globe, ShoppingBag, PenLine, Info, Mail } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

// ─── Language options for writer chat translation ────────────────────────────
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'Tamil' },
  { code: 'hi', label: 'Hindi' },
  { code: 'te', label: 'Telugu' },
  { code: 'kn', label: 'Kannada' },
  { code: 'ml', label: 'Malayalam' },
  { code: 'mr', label: 'Marathi' },
  { code: 'bn', label: 'Bengali' },
  { code: 'gu', label: 'Gujarati' },
  { code: 'pa', label: 'Punjabi' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'ar', label: 'Arabic' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'es', label: 'Spanish' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ru', label: 'Russian' },
];

// ─── Password strength checker ────────────────────────────────────────────────
function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-400' };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-amber-400' };
  if (score <= 3) return { score, label: 'Good', color: 'bg-blue-400' };
  return { score, label: 'Strong', color: 'bg-green-500' };
}

// ─── Register Page ────────────────────────────────────────────────────────────
export function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((s) => s.auth);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    phone: '',
    preferredLanguage: 'en',
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');

  const strength = getPasswordStrength(form.password);

  const set = (key, val) => { setForm((p) => ({ ...p, [key]: val })); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate
    if (!form.name.trim()) { setError('Please enter your full name.'); return; }
    if (!form.email.trim()) { setError('Please enter your email address.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Please enter a valid email address.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match. Please re-enter.'); return; }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      role: form.role,
      phone: form.phone.trim() || undefined,
      preferredLanguage: form.preferredLanguage,
    };

    const result = await dispatch(register(payload));
    if (register.fulfilled.match(result)) {
      const role = result.payload.user.role;
      navigate(role === 'writer' ? '/writer/subscription' : '/', { replace: true });
    } else {
      const msg = result.payload || 'Registration failed.';
      if (msg.includes('exists') || msg.includes('duplicate')) {
        setError(
          form.role === 'user'
            ? 'This email is already registered. Sign in with the same email — one BookVerse account works for reading and publishing (writers can shop as readers after login).'
            : 'This email is already registered. Sign in to your account, or use a different email for a new author account.'
        );
      } else {
        setError(msg);
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex w-2/5 bg-gradient-to-br from-primary-600 via-indigo-700 to-purple-800 text-white flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full translate-y-40 -translate-x-40" />
        <div className="relative z-10 max-w-sm">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-7 h-7" />
            </div>
            <span className="text-2xl font-bold">BookVerse</span>
          </div>
          <h2 className="text-3xl font-bold leading-tight mb-4">Join thousands of readers & authors</h2>
          <ul className="space-y-3 text-indigo-200 text-sm">
            {[
              'Buy & read books in one place',
              'Chapter-wise audiobooks',
              'Connect with global authors',
              'Personalized recommendations',
              'Auto-translate writer chats',
            ].map((f) => (
              <li key={f} className="flex items-center gap-2.5">
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-lg py-6">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-primary-700">BookVerse</span>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
            <p className="text-gray-500 text-sm mb-6">Join the BookVerse community today</p>

            {/* Role selector */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { role: 'user', icon: ShoppingBag, title: 'Reader', desc: 'Buy & read books' },
                { role: 'writer', icon: PenLine, title: 'Author', desc: 'Publish & sell books' },
              ].map(({ role, icon: Icon, title, desc }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => set('role', role)}
                  className={`flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all ${
                    form.role === role
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${form.role === role ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'}`}>
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="font-semibold text-sm">{title}</span>
                  <span className="text-xs opacity-70">{desc}</span>
                </button>
              ))}
            </div>

            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm animate-fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Full name */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Full Name</label>
                <input
                  className="input"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  autoComplete="name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Email Address</label>
                <input
                  type="email"
                  className="input"
                  placeholder="Enter your email address"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  autoComplete="email"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Phone Number <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  className="input"
                  placeholder="Enter your mobile number"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  autoComplete="tel"
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="input pr-11"
                    placeholder="Create a strong password"
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    autoComplete="new-password"
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Strength bar */}
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength.score ? strength.color : 'bg-gray-200'}`} />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${strength.score <= 1 ? 'text-red-500' : strength.score <= 2 ? 'text-amber-600' : strength.score <= 3 ? 'text-blue-600' : 'text-green-600'}`}>
                      {strength.label} password
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className={`input pr-11 ${form.confirmPassword && form.password !== form.confirmPassword ? 'border-red-300 focus:ring-red-400' : ''}`}
                    placeholder="Re-enter your password"
                    value={form.confirmPassword}
                    onChange={(e) => set('confirmPassword', e.target.value)}
                    autoComplete="new-password"
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
                {form.confirmPassword && form.password === form.confirmPassword && form.password && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><Check className="w-3 h-3" /> Passwords match</p>
                )}
              </div>

              {/* Writer-only: preferred language for chat translation */}
              {form.role === 'writer' && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="w-4 h-4 text-indigo-600" />
                    <label className="text-sm font-semibold text-indigo-800">Your Mother Tongue / Preferred Language</label>
                  </div>
                  <p className="text-xs text-indigo-600 mb-3">
                    When other writers message you, their messages will be auto-translated into this language so you can read in your own language.
                  </p>
                  <select
                    className="input bg-white"
                    value={form.preferredLanguage}
                    onChange={(e) => set('preferredLanguage', e.target.value)}
                  >
                    {LANGUAGES.map(({ code, label }) => (
                      <option key={code} value={code}>{label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Writer subscription notice */}
              {form.role === 'writer' && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>After signup you'll be taken to the subscription page. A writer subscription is required to publish books on BookVerse.</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-base font-semibold rounded-xl"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Creating account…
                  </span>
                ) : `Create ${form.role === 'writer' ? 'Author' : 'Reader'} Account`}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 font-semibold hover:underline">Sign in</Link>
            </p>
          </div>
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
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md">
        <Link to="/login" className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-primary-700">BookVerse</span>
        </Link>
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Forgot your password?</h1>
          <p className="text-gray-500 text-sm mb-6">No worries — we'll send a reset link to your email</p>
          {sent ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
              <p className="font-semibold text-green-800">Check your inbox!</p>
              <p className="text-sm text-green-600 mt-1">A password reset link has been sent to <strong>{email}</strong></p>
              <Link to="/login" className="btn-primary mt-4 inline-block px-6 py-2 text-sm">Back to Login</Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /><span>{error}</span>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Email Address</label>
                  <input type="email" className="input" placeholder="Enter your registered email" value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }} autoComplete="email" />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3 rounded-xl font-semibold">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Sending…
                    </span>
                  ) : 'Send Reset Link'}
                </button>
              </form>
              <p className="mt-5 text-center text-sm">
                <Link to="/login" className="text-primary-600 hover:underline">← Back to login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ResetPassword ────────────────────────────────────────────────────────────
export function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await api.put(`/auth/reset-password/${token}`, { password: form.password });
      toast.success('Password reset successful!');
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Reset link may have expired. Please request a new one.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md">
        <Link to="/login" className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-primary-700">BookVerse</span>
        </Link>
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create new password</h1>
          <p className="text-gray-500 text-sm mb-6">Choose a strong password for your account</p>
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /><span>{error}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">New Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} className="input pr-11" placeholder="Create a new password"
                  value={form.password} onChange={(e) => { setForm({ ...form, password: e.target.value }); setError(''); }}
                  autoComplete="new-password" />
                <button type="button" tabIndex={-1} onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Confirm New Password</label>
              <input type="password" className="input" placeholder="Re-enter your new password"
                value={form.confirmPassword} onChange={(e) => { setForm({ ...form, confirmPassword: e.target.value }); setError(''); }}
                autoComplete="new-password" />
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 rounded-xl font-semibold">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Resetting…
                </span>
              ) : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
