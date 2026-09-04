import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Sparkles, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { api } from '../../services/api';

export const AuthModal: React.FC = () => {
  const { activeModal, setActiveModal, setUser } = useAppStore();

  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeModal !== 'auth') return;
    setError(null);
    setSuccess(null);

    // Official Google Identity Services initialization
    const google = (window as any).google;
    if (google?.accounts?.id && googleBtnRef.current) {
      try {
        const clientId = '726426845811-ibbspi9a7cld4mr126q9nvr4hn8vo9ak.apps.googleusercontent.com';
        google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            if (response?.credential) {
              setLoading(true);
              setError(null);
              try {
                const u = await api.loginGoogle(response.credential);
                setUser(u);
                setActiveModal(null);
              } catch (err: any) {
                setError(err.message || 'Google sign-in failed');
              } finally {
                setLoading(false);
              }
            }
          }
        });

        google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          width: 340
        });
      } catch (e) {
        console.log('Google Identity Services setup:', e);
      }
    }
  }, [activeModal, mode]);

  if (activeModal !== 'auth') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (cleanPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const cleanName = displayName.trim() || cleanEmail.split('@')[0];
        const userProfile = await api.registerEmail(cleanEmail, cleanPassword, cleanName);
        setUser(userProfile);
        setSuccess('Account created successfully!');
        setTimeout(() => setActiveModal(null), 700);
      } else {
        const userProfile = await api.loginEmail(cleanEmail, cleanPassword);
        setUser(userProfile);
        setSuccess('Signed in successfully!');
        setTimeout(() => setActiveModal(null), 700);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-md rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-medium)] shadow-2xl overflow-hidden transition-colors">
        
        {/* Top Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <img 
              src="/assets/guts-logo.png" 
              alt="Guts AI" 
              className="w-8 h-8 rounded-xl object-cover shadow-sm ring-1 ring-red-500/20" 
            />
            <div>
              <h2 className="text-sm font-bold text-[var(--text-main)]">
                {mode === 'signup' ? 'Create your Guts AI account' : 'Welcome back to Guts AI'}
              </h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                {mode === 'signup' ? 'Sign up to sync your chats & custom models' : 'Enter your email and password to sign in'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-sidebar-hover)] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-4">
          <div className="flex rounded-2xl bg-[var(--bg-sidebar-hover)] p-1 border border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                mode === 'signup'
                  ? 'bg-[var(--bg-main)] text-[var(--text-main)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                mode === 'login'
                  ? 'bg-[var(--bg-main)] text-[var(--text-main)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {success && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Display Name (Only in Sign Up mode) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-sub)] mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Johnson"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-main)] text-xs placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-color)] transition"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-[11px] font-medium text-[var(--text-sub)] mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-main)] text-xs placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-color)] transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[11px] font-medium text-[var(--text-sub)] mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-main)] text-xs placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-color)] transition"
                />
              </div>
              <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
                Must be at least 6 characters.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md disabled:opacity-50 mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Google Sign In Divider */}
          <div className="relative flex items-center justify-center py-2">
            <div className="w-full border-t border-[var(--border-subtle)]" />
            <span className="absolute bg-[var(--bg-surface)] px-2 text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
              Or continue with
            </span>
          </div>

          {/* Google Button Container */}
          <div className="flex justify-center pt-1" ref={googleBtnRef}>
            <button
              type="button"
              onClick={() => {
                setError('Please click the official Google prompt or sign up with email and password.');
              }}
              className="w-full py-2 px-4 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-sidebar-hover)] border border-[var(--border-input)] text-[var(--text-main)] text-xs font-medium flex items-center justify-center gap-2.5 transition cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="pt-2 text-center text-[10px] text-[var(--text-muted)] flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Private database on your local hardware. 100% encrypted.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
