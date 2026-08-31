import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  User, 
  Lock, 
  Mail, 
  Check, 
  ShieldCheck,
  AlertCircle,
  Key
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { api } from '../../services/api';

export const AuthModal: React.FC = () => {
  const { activeModal, setActiveModal, setUser, user } = useAppStore();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const googleBtnRef = useRef<HTMLDivElement>(null);

  if (activeModal !== 'auth') return null;

  // Initialize official Google Identity Services button if available
  useEffect(() => {
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
          theme: 'filled_black',
          size: 'large',
          shape: 'pill',
          width: 320
        });
      } catch (e) {
        console.log('Google Identity Services setup:', e);
      }
    }
  }, [activeModal]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const u = await api.loginEmail(email.trim(), password);
        setUser(u);
        setActiveModal(null);
      } else {
        const u = await api.registerEmail(email.trim(), password, displayName.trim());
        setUser(u);
        setActiveModal(null);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-md rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-medium)] shadow-2xl overflow-hidden text-xs">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-main)]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
              ✦
            </div>
            <span className="text-sm font-bold text-[var(--text-primary)]">
              {isLogin ? 'Sign In to Your Account' : 'Create an Account'}
            </span>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-sidebar-hover)] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Real Google Identity Services Button Container */}
          <div className="flex flex-col items-center justify-center pt-1 pb-1">
            <div ref={googleBtnRef} className="min-h-[40px] flex items-center justify-center" />
          </div>

          <div className="flex items-center gap-3 my-2 text-[var(--text-muted)]">
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
            <span className="text-[10px] uppercase font-bold tracking-wider">or continue with email</span>
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
          </div>

          {/* Real Email & Password Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3.5">
            {!isLogin && (
              <div>
                <label className="block text-[var(--text-primary)] font-semibold mb-1">Your Full Name</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Huzaifa Rajput"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-medium)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-emerald-500"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[var(--text-primary)] font-semibold mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="huzaifa@example.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-medium)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[var(--text-primary)] font-semibold mb-1">Password *</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-medium)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-1">Minimum 6 characters with secure salted hash.</p>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold shadow-md transition cursor-pointer mt-2"
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>

            <div className="text-center pt-2 text-[var(--text-muted)]">
              {isLogin ? (
                <span>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(false);
                      setError(null);
                    }}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer underline ml-1"
                  >
                    Sign up
                  </button>
                </span>
              ) : (
                <span>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(true);
                      setError(null);
                    }}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer underline ml-1"
                  >
                    Sign in
                  </button>
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
