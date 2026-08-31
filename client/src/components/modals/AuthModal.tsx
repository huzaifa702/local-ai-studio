import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Mail, 
  Check, 
  ShieldCheck,
  AlertCircle,
  KeyRound,
  ArrowRight,
  RefreshCw,
  Sparkles,
  User
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { api } from '../../services/api';

export const AuthModal: React.FC = () => {
  const { activeModal, setActiveModal, setUser } = useAppStore();

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [otpStep, setOtpStep] = useState<'input_email' | 'enter_otp'>('input_email');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Initialize official Google Identity Services button
  useEffect(() => {
    if (activeModal !== 'auth') return;

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

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  if (activeModal !== 'auth') return null;

  // Handle Step 1: Send 6-digit OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await api.sendEmailOtp(email.trim().toLowerCase());
      setOtpStep('enter_otp');
      setSuccessMsg(`6-digit code generated for ${email}. (Code: ${res.otpCode || 'Check terminal'})`);
      setCountdown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 2: Verify 6-digit OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.trim().length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const u = await api.verifyEmailOtp(
        email.trim().toLowerCase(),
        otpCode.trim(),
        displayName.trim() || undefined
      );
      setUser(u);
      setActiveModal(null);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP code.');
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
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Welcome to LocalAI Studio</h2>
              <p className="text-[11px] text-[var(--text-muted)]">Sign in or create your local account</p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-sidebar-hover)] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="text-xs leading-relaxed">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && !error && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-start gap-2 animate-in fade-in">
              <Check className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="text-xs leading-relaxed font-mono">{successMsg}</span>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* OPTION 1: 1-Click Real Google Sign-In */}
          {/* ------------------------------------------------------------- */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Option 1: Google Account
            </div>
            <div className="flex justify-center py-1">
              <div ref={googleBtnRef} className="min-h-[44px] flex items-center justify-center" />
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="h-[1px] flex-1 bg-[var(--border-subtle)]" />
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
              Or with Email OTP
            </span>
            <div className="h-[1px] flex-1 bg-[var(--border-subtle)]" />
          </div>

          {/* ------------------------------------------------------------- */}
          {/* OPTION 2: Real 6-Digit Email OTP Sign-Up / Sign-In */}
          {/* ------------------------------------------------------------- */}
          {otpStep === 'input_email' ? (
            <form onSubmit={handleSendOtp} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                  Display Name (Optional)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Your Name (e.g. Alex, Huzaifa)"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white font-semibold text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Send 6-Digit Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                <span>Code sent to: <strong className="text-[var(--text-primary)]">{email}</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    setOtpStep('input_email');
                    setOtpCode('');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-indigo-400 hover:underline cursor-pointer"
                >
                  Change Email
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                  Enter 6-Digit Verification Code *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" />
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    autoFocus
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[var(--bg-main)] border border-indigo-500/50 text-[var(--text-primary)] text-center tracking-[0.3em] font-mono text-base font-bold focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-[var(--text-muted)]">
                  {countdown > 0 ? `Resend in ${countdown}s` : "Didn't receive code?"}
                </span>
                <button
                  type="button"
                  disabled={countdown > 0 || loading}
                  onClick={handleSendOtp}
                  className="text-indigo-400 disabled:opacity-40 hover:underline cursor-pointer font-medium"
                >
                  Resend Code
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.trim().length !== 6}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-semibold text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Verify & Sign In</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Privacy Footnote */}
          <div className="pt-2 flex items-center justify-center gap-1.5 text-[10px] text-[var(--text-muted)]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Encrypted local database on your SSD. 100% private.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
