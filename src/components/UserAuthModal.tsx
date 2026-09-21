import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Sparkles,
  KeyRound
} from 'lucide-react';
import { useUserAuth } from '../context/UserAuthContext';

export const UserAuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalMode,
    verificationEmail,
    closeAuthModal,
    openAuthModal,
    registerUser,
    verifyCode,
    resendVerificationCode,
    loginUser,
    loginWithGoogle
  } = useUserAuth();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 4-digit code state
  const [digit1, setDigit1] = useState('');
  const [digit2, setDigit2] = useState('');
  const [digit3, setDigit3] = useState('');
  const [digit4, setDigit4] = useState('');

  const input1Ref = useRef<HTMLInputElement>(null);
  const input2Ref = useRef<HTMLInputElement>(null);
  const input3Ref = useRef<HTMLInputElement>(null);
  const input4Ref = useRef<HTMLInputElement>(null);

  // Status & error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [emailDeliveryWarning, setEmailDeliveryWarning] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Sync email when mode changes to verify
  useEffect(() => {
    if (authModalMode === 'verify' && verificationEmail) {
      setEmail(verificationEmail);
    }
  }, [authModalMode, verificationEmail]);

  // Focus first digit input when entering verify mode
  useEffect(() => {
    if (isAuthModalOpen && authModalMode === 'verify') {
      setTimeout(() => input1Ref.current?.focus(), 150);
    }
  }, [isAuthModalOpen, authModalMode]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isAuthModalOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setEmailDeliveryWarning('');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await registerUser({
        email: email.trim(),
        password,
        confirmPassword,
        name: name.trim()
      });

      if (result.success) {
        if (result.emailSent === false) {
          setEmailDeliveryWarning(result.message || 'Verification email could not be sent. Check SMTP settings or try resending.');
        } else {
          setSuccessMessage('4-digit verification code sent to your email!');
        }
        setResendCooldown(60);
      } else {
        setErrorMessage(result.error || 'Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email || !password) {
      setErrorMessage('Please enter your email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await loginUser({
        email: email.trim(),
        password
      });

      if (!result.success && result.error) {
        setErrorMessage(result.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const fullCode = `${digit1}${digit2}${digit3}${digit4}`.trim();
    if (fullCode.length !== 4) {
      setErrorMessage('Please enter all 4 digits of the verification code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await verifyCode(email.trim() || verificationEmail, fullCode);
      if (!result.success) {
        setErrorMessage(result.error || 'Invalid verification code.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isSubmitting) return;

    setErrorMessage('');
    setSuccessMessage('');
    setEmailDeliveryWarning('');
    setIsSubmitting(true);

    try {
      const targetEmail = email.trim() || verificationEmail;
      const result = await resendVerificationCode(targetEmail);

      if (result.success) {
        setSuccessMessage('A fresh 4-digit verification code has been dispatched to your email.');
        setResendCooldown(60);
      } else if (result.cooldown) {
        setResendCooldown(result.remainingSeconds || 60);
        setErrorMessage(result.error || 'Please wait before requesting a new code.');
      } else {
        setErrorMessage(result.error || 'Failed to resend code.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google sign in trigger
  const handleGoogleSignIn = async () => {
    // If Google Identity Services client is available on the window
    const gClient = (window as any).google?.accounts?.id;
    const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;

    if (gClient && clientId) {
      gClient.initialize({
        client_id: clientId,
        callback: (response: any) => {
          if (response?.credential) {
            loginWithGoogle({ idToken: response.credential });
          }
        }
      });
      gClient.prompt();
      return;
    }

    // Fallback: prompt for Google ID Token
    const promptToken = prompt('Enter your Google ID Token to authenticate:');
    if (promptToken && promptToken.trim()) {
      setIsSubmitting(true);
      try {
        const res = await loginWithGoogle({ idToken: promptToken.trim() });
        if (!res.success) {
          setErrorMessage(res.error || 'Google authentication failed.');
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Auto-advance digit input handlers
  const handleDigitChange = (
    val: string,
    setVal: (v: string) => void,
    nextRef?: React.RefObject<HTMLInputElement | null>
  ) => {
    const clean = val.replace(/\D/g, '').slice(-1);
    setVal(clean);
    if (clean && nextRef && nextRef.current) {
      nextRef.current.focus();
    }
  };

  const handleDigitKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    val: string,
    prevRef?: React.RefObject<HTMLInputElement | null>
  ) => {
    if (e.key === 'Backspace' && !val && prevRef && prevRef.current) {
      prevRef.current.focus();
    }
  };

  const handlePasteCode = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length > 0) setDigit1(pasted[0] || '');
    if (pasted.length > 1) setDigit2(pasted[1] || '');
    if (pasted.length > 2) setDigit3(pasted[2] || '');
    if (pasted.length > 3) {
      setDigit4(pasted[3] || '');
      input4Ref.current?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#04142F] border border-white/16 rounded-3xl p-6 sm:p-8 text-white shadow-2xl overflow-hidden"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#FFC928]/10 blur-3xl rounded-full pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFC928]/15 border border-[#FFC928]/30 text-[#FFC928] text-xs font-black tracking-widest uppercase mb-3">
            <Sparkles className="w-3 h-3" />
            Shendam Connect
          </div>
          <h3 className="text-2xl font-bold text-white tracking-tight">
            {authModalMode === 'verify' && 'Verify Your Email'}
            {authModalMode === 'signin' && 'Welcome Back'}
            {authModalMode === 'register' && 'Create Your Account'}
          </h3>
          <p className="text-xs text-[#9BAABD] mt-1">
            {authModalMode === 'verify' && `Enter the 4-digit code sent to ${verificationEmail || email}`}
            {authModalMode === 'signin' && 'Sign in to access saved places, bookings & community hubs'}
            {authModalMode === 'register' && 'Join Shendam Connect to explore, book & connect'}
          </p>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <div className="flex-1 font-medium leading-relaxed">
              {errorMessage}
              {/apppasswords|Application-Specific Password/i.test(errorMessage) && (
                <div className="mt-2 pt-2 border-t border-rose-500/20">
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#FFC928] hover:underline font-bold inline-flex items-center gap-1"
                  >
                    <span>→ Open Google App Passwords page</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <div className="flex-1 font-medium">{successMessage}</div>
          </div>
        )}

        {emailDeliveryWarning && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <div className="flex-1 font-medium leading-relaxed">
              {emailDeliveryWarning}
              {/apppasswords|Application-Specific Password/i.test(emailDeliveryWarning) && (
                <div className="mt-2 pt-2 border-t border-amber-500/20">
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#FFC928] hover:underline font-bold inline-flex items-center gap-1"
                  >
                    <span>→ Generate 16-character Google App Password</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE: VERIFY 4-DIGIT OTP                                                  */}
        {/* ========================================================================= */}
        {authModalMode === 'verify' && (
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="flex justify-center items-center gap-3 my-4">
              <input
                ref={input1Ref}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit1}
                onChange={(e) => handleDigitChange(e.target.value, setDigit1, input2Ref)}
                onKeyDown={(e) => handleDigitKeyDown(e, digit1)}
                onPaste={handlePasteCode}
                className="w-14 h-16 text-center text-3xl font-black bg-[#08254D] border-2 border-[#FFC928]/40 focus:border-[#FFC928] rounded-2xl text-[#FFC928] outline-none shadow-inner transition"
              />
              <input
                ref={input2Ref}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit2}
                onChange={(e) => handleDigitChange(e.target.value, setDigit2, input3Ref)}
                onKeyDown={(e) => handleDigitKeyDown(e, digit2, input1Ref)}
                onPaste={handlePasteCode}
                className="w-14 h-16 text-center text-3xl font-black bg-[#08254D] border-2 border-[#FFC928]/40 focus:border-[#FFC928] rounded-2xl text-[#FFC928] outline-none shadow-inner transition"
              />
              <input
                ref={input3Ref}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit3}
                onChange={(e) => handleDigitChange(e.target.value, setDigit3, input4Ref)}
                onKeyDown={(e) => handleDigitKeyDown(e, digit3, input2Ref)}
                onPaste={handlePasteCode}
                className="w-14 h-16 text-center text-3xl font-black bg-[#08254D] border-2 border-[#FFC928]/40 focus:border-[#FFC928] rounded-2xl text-[#FFC928] outline-none shadow-inner transition"
              />
              <input
                ref={input4Ref}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit4}
                onChange={(e) => handleDigitChange(e.target.value, setDigit4)}
                onKeyDown={(e) => handleDigitKeyDown(e, digit4, input3Ref)}
                onPaste={handlePasteCode}
                className="w-14 h-16 text-center text-3xl font-black bg-[#08254D] border-2 border-[#FFC928]/40 focus:border-[#FFC928] rounded-2xl text-[#FFC928] outline-none shadow-inner transition"
              />
            </div>

            <p className="text-center text-xs text-[#9BAABD]">
              ⏱️ Code expires in 10 minutes.
            </p>

            <button
              type="submit"
              disabled={isSubmitting || `${digit1}${digit2}${digit3}${digit4}`.length !== 4}
              className="w-full py-3.5 bg-[#FFC928] hover:bg-[#F5B800] active:scale-[0.98] disabled:opacity-50 text-[#061B3A] font-extrabold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Complete Verification</span>
                </>
              )}
            </button>

            {/* Resend Action */}
            <div className="pt-2 text-center text-xs text-[#9BAABD]">
              Didn't receive the email?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || isSubmitting}
                className="text-[#FFC928] font-bold hover:underline disabled:opacity-50 ml-1 cursor-pointer"
              >
                {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : 'Resend Code'}
              </button>
            </div>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => openAuthModal('signin')}
                className="text-xs text-slate-400 hover:text-white transition"
              >
                ← Return to Sign In
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* MODE: REGISTER (SIGN UP)                                                  */}
        {/* ========================================================================= */}
        {authModalMode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#CBD5E1] mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. Raymond Domnan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#08254D] border border-white/10 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-[#FFC928] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#CBD5E1] mb-1">
                Gmail / Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#08254D] border border-white/10 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-[#FFC928] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#CBD5E1] mb-1">
                Password (min 6 characters) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#08254D] border border-white/10 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-[#FFC928] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#CBD5E1] mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#08254D] border border-white/10 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-[#FFC928] transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 bg-[#FFC928] hover:bg-[#F5B800] active:scale-[0.98] disabled:opacity-50 text-[#061B3A] font-extrabold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Creating Account & Sending Code...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Google Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-[#04142F] px-2 text-[#9BAABD] font-bold">Or continue with</span>
              </div>
            </div>

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Switch to Sign In */}
            <div className="pt-2 text-center text-xs text-[#9BAABD]">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => openAuthModal('signin')}
                className="text-[#FFC928] font-bold hover:underline ml-1 cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* MODE: SIGN IN (LOGIN)                                                     */}
        {/* ========================================================================= */}
        {authModalMode === 'signin' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#CBD5E1] mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#08254D] border border-white/10 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-[#FFC928] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#CBD5E1] mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#08254D] border border-white/10 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-[#FFC928] transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 bg-[#FFC928] hover:bg-[#F5B800] active:scale-[0.98] disabled:opacity-50 text-[#061B3A] font-extrabold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Google Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-[#04142F] px-2 text-[#9BAABD] font-bold">Or sign in with</span>
              </div>
            </div>

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Switch to Register */}
            <div className="pt-2 text-center text-xs text-[#9BAABD]">
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => openAuthModal('register')}
                className="text-[#FFC928] font-bold hover:underline ml-1 cursor-pointer"
              >
                Create Account
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default UserAuthModal;
