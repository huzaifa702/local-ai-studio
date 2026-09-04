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
  CheckCircle2,
  KeyRound,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { api } from '../../services/api';

export const AuthModal: React.FC = () => {
  const { activeModal, setActiveModal, setUser } = useAppStore();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('signup');
  const [signupStep, setSignupStep] = useState<'details' | 'otp'>('details');
  const [forgotStep, setForgotStep] = useState<'email' | 'reset'>('email');

  // Form Fields
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Resend Timer Countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  useEffect(() => {
    if (activeModal !== 'auth') return;
    setError(null);
    setSuccess(null);

    // Official Google Identity Services initialization
    const google = (window as any).google;
    if (google?.accounts?.id && googleBtnRef.current && mode !== 'forgot') {
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

  // --- Sign In Handler ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const userProfile = await api.loginEmail(cleanEmail, cleanPassword);
      setUser(userProfile);
      setSuccess('Signed in successfully!');
      setTimeout(() => setActiveModal(null), 600);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // --- Sign Up Step 1: Send Verification OTP ---
  const handleSendSignupOtp = async (e: React.FormEvent) => {
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
      const res = await api.sendEmailOtp(cleanEmail);
      setSuccess(res.message || `Verification code sent to ${cleanEmail}`);
      setSignupStep('otp');
      setResendTimer(60);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  // --- Sign Up Step 2: Verify OTP & Create Account ---
  const handleVerifySignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otpCode.trim();

    if (!cleanOtp || cleanOtp.length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const cleanName = displayName.trim() || cleanEmail.split('@')[0];
      const userProfile = await api.verifyEmailOtp(cleanEmail, cleanOtp, password.trim(), cleanName);
      setUser(userProfile);
      setSuccess('Email verified! Welcome to Guts AI.');
      setTimeout(() => setActiveModal(null), 700);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  // --- Forgot Password Step 1: Send Reset OTP ---
  const handleSendForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.sendForgotPasswordOtp(cleanEmail);
      setSuccess(res.message || `Reset code sent to ${cleanEmail}`);
      setForgotStep('reset');
      setResendTimer(60);
    } catch (err: any) {
      setError(err.message || 'No registered account found with this email.');
    } finally {
      setLoading(false);
    }
  };

  // --- Forgot Password Step 2: Verify OTP & Reset Password ---
  const handleVerifyForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otpCode.trim();
    const cleanPw = password.trim();

    if (!cleanOtp || cleanOtp.length < 6) {
      setError('Please enter the 6-digit reset code.');
      return;
    }

    if (cleanPw.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    if (cleanPw !== confirmPassword.trim()) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const userProfile = await api.verifyForgotPassword(cleanEmail, cleanOtp, cleanPw);
      setUser(userProfile);
      setSuccess('Password reset successfully! You are now logged in.');
      setTimeout(() => setActiveModal(null), 800);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please check your code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in select-none">
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
                {mode === 'signup' 
                  ? (signupStep === 'otp' ? 'Verify Your Email' : 'Create Guts AI Account')
                  : mode === 'forgot'
                  ? 'Reset Your Password'
                  : 'Welcome back to Guts AI'
                }
              </h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                {mode === 'signup'
                  ? (signupStep === 'otp' ? 'Enter the code sent to your email' : 'Sign up to sync your chats & models')
                  : mode === 'forgot'
                  ? 'Verify your email to choose a new password'
                  : 'Enter your email and password to sign in'
                }
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

        {/* Tab Switcher (Only in Login & Signup mode) */}
        {mode !== 'forgot' && (
          <div className="px-6 pt-4">
            <div className="flex rounded-2xl bg-[var(--bg-sidebar-hover)] p-1 border border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setSignupStep('details');
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
        )}

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

          {/* 1. SIGN IN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3.5">
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

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-medium text-[var(--text-sub)]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setForgotStep('email');
                      setOtpCode('');
                      setPassword('');
                      setError(null);
                      setSuccess(null);
                    }}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
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
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md disabled:opacity-50 mt-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* 2. SIGN UP - STEP 1 (DETAILS) */}
          {mode === 'signup' && signupStep === 'details' && (
            <form onSubmit={handleSendSignupOtp} className="space-y-3.5">
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

              <div>
                <label className="block text-[11px] font-medium text-[var(--text-sub)] mb-1">
                  Create Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="password"
                    required
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-main)] text-xs placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-color)] transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md disabled:opacity-50 mt-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* 2. SIGN UP - STEP 2 (OTP CONFIRMATION) */}
          {mode === 'signup' && signupStep === 'otp' && (
            <form onSubmit={handleVerifySignupOtp} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-[var(--bg-sidebar)] border border-[var(--border-subtle)] text-center space-y-1">
                <span className="text-xs text-[var(--text-sub)]">
                  Enter the 6-digit confirmation code sent to:
                </span>
                <div className="font-semibold text-xs text-[var(--text-main)] font-mono">{email}</div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--text-sub)] mb-1 text-center">
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    maxLength={6}
                    required
                    autoFocus
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-center text-lg tracking-[8px] font-mono font-bold text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setSignupStep('details')}
                  className="text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>

                <button
                  type="button"
                  disabled={resendTimer > 0 || loading}
                  onClick={async () => {
                    setError(null);
                    setLoading(true);
                    try {
                      await api.sendEmailOtp(email.trim().toLowerCase());
                      setSuccess(`New code sent to ${email}`);
                      setResendTimer(60);
                    } catch (e: any) {
                      setError(e.message || 'Failed to resend code');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="text-indigo-400 hover:text-indigo-300 disabled:text-[var(--text-muted)] flex items-center gap-1 cursor-pointer font-medium"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length < 6}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    <span>Verify & Create Account</span>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* 3. FORGOT PASSWORD - STEP 1 (ENTER EMAIL) */}
          {mode === 'forgot' && forgotStep === 'email' && (
            <form onSubmit={handleSendForgotOtp} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-sub)] mb-1">
                  Registered Email Address
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md disabled:opacity-50 mt-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    <span>Send Reset Code</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer flex items-center justify-center gap-1 mx-auto"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </form>
          )}

          {/* 3. FORGOT PASSWORD - STEP 2 (RESET PASSWORD WITH OTP) */}
          {mode === 'forgot' && forgotStep === 'reset' && (
            <form onSubmit={handleVerifyForgotReset} className="space-y-3.5">
              <div className="p-3 rounded-2xl bg-[var(--bg-sidebar)] border border-[var(--border-subtle)] text-center space-y-0.5">
                <span className="text-[11px] text-[var(--text-sub)]">Reset code sent to:</span>
                <div className="font-semibold text-xs text-[var(--text-main)] font-mono">{email}</div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--text-sub)] mb-1 text-center">
                  6-Digit Reset Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    maxLength={6}
                    required
                    autoFocus
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-10 pr-3 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-center text-lg tracking-[8px] font-mono font-bold text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--text-sub)] mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="password"
                    required
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-main)] text-xs placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-color)] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--text-sub)] mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="password"
                    required
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-main)] text-xs placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-color)] transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setForgotStep('email')}
                  className="text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change Email</span>
                </button>

                <button
                  type="button"
                  disabled={resendTimer > 0 || loading}
                  onClick={async () => {
                    setError(null);
                    setLoading(true);
                    try {
                      await api.sendForgotPasswordOtp(email.trim().toLowerCase());
                      setSuccess(`New reset code sent to ${email}`);
                      setResendTimer(60);
                    } catch (e: any) {
                      setError(e.message || 'Failed to resend code');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="text-indigo-400 hover:text-indigo-300 disabled:text-[var(--text-muted)] flex items-center gap-1 cursor-pointer font-medium"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length < 6}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    <span>Reset Password & Sign In</span>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Google Sign In Divider (Only in Login & Signup Details) */}
          {(mode === 'login' || (mode === 'signup' && signupStep === 'details')) && (
            <>
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
            </>
          )}

          <div className="pt-2 text-center text-[10px] text-[var(--text-muted)] flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Private database on your local hardware. 100% encrypted.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
