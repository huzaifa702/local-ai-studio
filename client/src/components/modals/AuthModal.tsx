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
  User,
  Lock,
  Calendar
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { api } from '../../services/api';

export const AuthModal: React.FC = () => {
  const { activeModal, setActiveModal, setUser } = useAppStore();

  // Mode: 'signup' or 'login'
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');

  // Multi-step signup: 'enter_email' -> 'enter_otp' -> 'complete_profile'
  const [signupStep, setSignupStep] = useState<'enter_email' | 'enter_otp' | 'complete_profile'>('enter_email');

  // Multi-step forgot password: 'enter_email' -> 'enter_otp' -> 'new_password'
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<'enter_email' | 'enter_otp' | 'new_password'>('enter_email');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState('');

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
  }, [activeModal, authMode, signupStep]);

  // Resend Countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  if (activeModal !== 'auth') return null;

  // 1. Send OTP for Sign Up
  const handleSendSignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api.sendEmailOtp(email.trim().toLowerCase());
      setSignupStep('enter_otp');
      setSuccessMsg(`6-digit code sent to ${email}. (Code: ${res.otpCode || 'Check terminal'})`);
      setCountdown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify OTP for Sign Up
  const handleVerifySignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.trim().length !== 6) {
      setError('Please enter the full 6-digit OTP code.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // Advance to profile name & age setup
      setSignupStep('complete_profile');
      setSuccessMsg('Email verified! Please choose your profile name and age.');
    } catch (err: any) {
      setError('Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Complete Sign Up with Profile Name and Age
  const handleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Please enter your profile name.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const u = await api.verifyEmailOtp(
        email.trim().toLowerCase(),
        otpCode.trim(),
        displayName.trim()
      );
      setUser(u);
      setActiveModal(null);
    } catch (err: any) {
      setError(err.message || 'Failed to complete registration.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle Direct Log In with Password
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const u = await api.loginEmail(email.trim().toLowerCase(), password);
      setUser(u);
      setActiveModal(null);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Handle Forgot Password OTP
  const handleForgotSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter your registered email address.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api.sendEmailOtp(email.trim().toLowerCase());
      setForgotStep('enter_otp');
      setSuccessMsg(`Reset code sent to ${email}. (Code: ${res.otpCode || 'Check terminal'})`);
      setCountdown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.trim().length !== 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const u = await api.verifyEmailOtp(email.trim().toLowerCase(), otpCode.trim());
      setUser(u);
      setActiveModal(null);
    } catch (err: any) {
      setError('Invalid or expired OTP code.');
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
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                {isForgotPassword ? 'Reset Password' : authMode === 'signup' ? 'Create your account' : 'Welcome back'}
              </h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                {isForgotPassword ? 'Verify code and set password' : authMode === 'signup' ? 'Sign up to sync your chats' : 'Sign in to your Guts AI account'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-sidebar-hover)] transition cursor-pointer"
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
          {/* CASE A: FORGOT PASSWORD FLOW */}
          {/* ------------------------------------------------------------- */}
          {isForgotPassword ? (
            forgotStep === 'enter_email' ? (
              <form onSubmit={handleForgotSendOtp} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                    Enter your email to receive a 6-digit OTP code
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition cursor-pointer"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Send 6-Digit OTP'}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setError(null);
                    }}
                    className="text-indigo-400 hover:underline cursor-pointer"
                  >
                    Back to Log in
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleForgotVerifyAndReset} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                    Enter 6-digit code sent to {email}
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-indigo-500/50 text-[var(--text-primary)] font-mono text-center tracking-widest text-sm font-bold focus:outline-none"
                    autoFocus
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otpCode.trim().length !== 6}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition cursor-pointer"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Verify Code & Log in'}
                </button>
              </form>
            )
          ) : authMode === 'signup' ? (
            /* ------------------------------------------------------------- */
            /* CASE B: SIGN UP FLOW (Google OR Email -> OTP -> Name & Age)   */
            /* ------------------------------------------------------------- */
            signupStep === 'enter_email' ? (
              <div className="space-y-4">
                {/* 1. Google Account Option */}
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider text-center">
                    Continue with Google
                  </div>
                  <div className="flex justify-center py-1">
                    <div ref={googleBtnRef} className="min-h-[44px] flex items-center justify-center" />
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 py-1">
                  <div className="h-[1px] flex-1 bg-[var(--border-subtle)]" />
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
                    Or with email
                  </span>
                  <div className="h-[1px] flex-1 bg-[var(--border-subtle)]" />
                </div>

                {/* 2. Email Address Input */}
                <form onSubmit={handleSendSignupOtp} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                      <input
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-200 text-black font-semibold text-xs transition cursor-pointer"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Continue'}
                  </button>
                </form>

                {/* Switch to Log in */}
                <div className="text-center pt-1 text-[11px] text-[var(--text-muted)]">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="text-indigo-400 font-semibold hover:underline cursor-pointer"
                  >
                    Log in
                  </button>
                </div>
              </div>
            ) : signupStep === 'enter_otp' ? (
              /* Step 2: 6-Digit OTP */
              <form onSubmit={handleVerifySignupOtp} className="space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                  <span>Code sent to: <strong>{email}</strong></span>
                  <button
                    type="button"
                    onClick={() => setSignupStep('enter_email')}
                    className="text-indigo-400 hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                    Enter 6-digit code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-indigo-500 text-[var(--text-primary)] font-mono text-center tracking-widest text-base font-bold focus:outline-none"
                    autoFocus
                    required
                  />
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[var(--text-muted)]">
                    {countdown > 0 ? `Resend in ${countdown}s` : "Didn't receive code?"}
                  </span>
                  <button
                    type="button"
                    disabled={countdown > 0 || loading}
                    onClick={handleSendSignupOtp}
                    className="text-indigo-400 disabled:opacity-40 hover:underline cursor-pointer"
                  >
                    Resend code
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || otpCode.trim().length !== 6}
                  className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-200 text-black font-semibold text-xs transition cursor-pointer mt-2"
                >
                  Continue
                </button>
              </form>
            ) : (
              /* Step 3: Choose Profile Name & Age (Audio 5 Requirement) */
              <form onSubmit={handleCompleteSignup} className="space-y-3 animate-in fade-in">
                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                    Choose your profile name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      placeholder="e.g. huzaifa rajput"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      autoFocus
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                    Your Age / Birthday (Optional)
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type="number"
                      placeholder="e.g. 21"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !displayName.trim()}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md transition cursor-pointer mt-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Complete & Create Account'}
                </button>
              </form>
            )
          ) : (
            /* ------------------------------------------------------------- */
            /* CASE C: LOG IN FLOW (Google OR Email + Password)              */
            /* ------------------------------------------------------------- */
            <div className="space-y-4">
              {/* 1. Google Option */}
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider text-center">
                  Continue with Google
                </div>
                <div className="flex justify-center py-1">
                  <div ref={googleBtnRef} className="min-h-[44px] flex items-center justify-center" />
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="h-[1px] flex-1 bg-[var(--border-subtle)]" />
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
                  Or with password
                </span>
                <div className="h-[1px] flex-1 bg-[var(--border-subtle)]" />
              </div>

              {/* 2. Email + Password Form */}
              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                    Email address
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setForgotStep('enter_email');
                        setError(null);
                      }}
                      className="text-[10px] text-indigo-400 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim() || !password}
                  className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-200 text-black font-semibold text-xs transition cursor-pointer mt-1"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Log In'}
                </button>
              </form>

              {/* Switch to Sign Up */}
              <div className="text-center pt-1 text-[11px] text-[var(--text-muted)]">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setSignupStep('enter_email');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-indigo-400 font-semibold hover:underline cursor-pointer"
                >
                  Sign up
                </button>
              </div>
            </div>
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
