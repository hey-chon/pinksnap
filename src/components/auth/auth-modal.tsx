import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast.tsx';
import {
  Mail,
  Lock,
  User,
  Sparkles,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  PartyPopper,
} from 'lucide-react';

interface AuthModalProps {
  initialMode?: 'signin' | 'signup' | 'reset';
  onSuccess?: () => void;
  isInline?: boolean;
}

export function AuthModal({
  initialMode = 'signin',
  onSuccess,
  isInline = false,
}: AuthModalProps) {
  const { signIn, signUp, resetPassword, isConfigured, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Welcome splash state
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeType, setWelcomeType] = useState<'signin' | 'signup'>('signin');
  const [welcomeName, setWelcomeName] = useState('');
  const [countdown, setCountdown] = useState(6);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Email verification state
  const [showVerification, setShowVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSuccessMessage(null);
    setSubmitting(true);

    try {
      if (mode === 'signin') {
        if (!email || !password) {
          setAuthError('Please enter both email and password.');
          setSubmitting(false);
          return;
        }
        const res = await signIn(email, password);
        if (res.error) {
          setAuthError(res.error);
          toast({
            title: 'Sign In Failed',
            description: res.error,
            variant: 'destructive',
          });
        } else {
          // Show welcome splash — do NOT call onSuccess yet
          setWelcomeType('signin');
          setWelcomeName((res as any).user?.displayName || email.split('@')[0] || 'there');
          setShowWelcome(true);
        }
      } else if (mode === 'signup') {
        if (!email || !password) {
          setAuthError('Please fill in all required fields.');
          setSubmitting(false);
          return;
        }
        if (password.length < 6) {
          setAuthError('Password must be at least 6 characters long.');
          setSubmitting(false);
          return;
        }
        const res = await signUp(email, password, displayName);
        if (res.error) {
          setAuthError(res.error);
          toast({
            title: 'Sign Up Failed',
            description: res.error,
            variant: 'destructive',
          });
        } else if (res.needsVerification) {
          // Email verification required — show verification instructions
          setVerificationEmail(email);
          setShowVerification(true);
        } else {
          // Instant sign-in (no verification needed)
          setWelcomeType('signup');
          setWelcomeName(displayName || email.split('@')[0] || 'there');
          setShowWelcome(true);
        }
      } else if (mode === 'reset') {
        if (!email) {
          setAuthError('Please enter your account email.');
          setSubmitting(false);
          return;
        }
        const res = await resetPassword(email);
        if (res.error) {
          setAuthError(res.error);
          toast({
            title: 'Reset Failed',
            description: res.error,
            variant: 'destructive',
          });
        } else {
          const msg = res.message || 'Password reset link sent to your email.';
          setSuccessMessage(msg);
          toast({
            title: 'Check Your Inbox',
            description: msg,
          });
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Proceed immediately
  const handleWelcomeContinue = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setShowWelcome(false);
    if (onSuccess) {
      onSuccess();
    } else {
      navigate('/profile', { replace: true });
    }
  };

  // When splash appears, mark WelcomeGate as done and smoothly proceed
  useEffect(() => {
    if (!showWelcome) return;
    sessionStorage.setItem('ps_welcome_gate_done', '1');
    const timer = setTimeout(() => {
      setShowWelcome(false);
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/profile', { replace: true });
      }
    }, 1250);
    return () => clearTimeout(timer);
  }, [showWelcome, onSuccess, navigate]);

  // ── Email Verification Required Screen ───────────────────────────────────
  if (showVerification) {
    return (
      <div
        className={`w-full max-w-md mx-auto ${isInline ? '' : 'ticket p-6 sm:p-8'}`}
        style={{ animation: 'verifyFadeIn 0.45s cubic-bezier(.36,.07,.19,.97) both' }}
      >
        <style>{`
          @keyframes verifyFadeIn {
            from { opacity: 0; transform: scale(0.93) translateY(18px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes verifyIconPop {
            0%   { transform: scale(0); opacity: 0; }
            60%  { transform: scale(1.18); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes verifyEnvelopeBounce {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            25% { transform: translateY(-6px) rotate(-3deg); }
            75% { transform: translateY(-3px) rotate(3deg); }
          }
          @keyframes verifyPulse {
            0%, 100% { box-shadow: 0 0 20px rgba(245,61,137,0.25); }
            50%       { box-shadow: 0 0 40px rgba(245,61,137,0.5); }
          }
          @keyframes verifySparkle {
            0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.7; }
            50%       { transform: translateY(-6px) rotate(12deg); opacity: 1; }
          }
          .verify-icon-pop { animation: verifyIconPop 0.55s cubic-bezier(.36,.07,.19,.97) both; }
          .verify-bounce   { animation: verifyEnvelopeBounce 2.5s ease-in-out infinite; }
          .verify-pulse    { animation: verifyPulse 2s ease-in-out infinite; }
          .verify-sparkle1 { animation: verifySparkle 2s ease-in-out infinite; }
          .verify-sparkle2 { animation: verifySparkle 2s ease-in-out infinite 0.5s; }
        `}</style>

        <div className="flex flex-col items-center text-center mb-6">
          {/* Envelope icon */}
          <div className="relative mb-5">
            <div className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center verify-icon-pop verify-pulse verify-bounce">
              <Mail className="w-9 h-9 text-emerald-600" />
            </div>
            <span className="absolute -top-1 -right-1 text-xl verify-sparkle1 select-none">✉️</span>
            <span className="absolute -bottom-1 -left-2 text-lg verify-sparkle2 select-none">✨</span>
          </div>

          <span className="booth-heading-kicker mb-2 !text-emerald-600">Almost there!</span>
          <h2 className="font-display text-3xl sm:text-4xl text-foreground tracking-wide mb-1">
            CHECK YOUR <span className="text-primary">EMAIL!</span>
          </h2>
          <p className="text-sm text-foreground/60 font-medium mt-2 max-w-xs">
            We sent a verification link to:
          </p>
          <p className="text-sm font-bold text-primary mt-1 break-all">
            {verificationEmail}
          </p>
        </div>

        {/* Steps */}
        <div className="bg-black/[.03] rounded-2xl p-4 sm:p-5 mb-6 text-left space-y-3">
          <p className="text-[11px] font-black uppercase tracking-[.15em] text-foreground/50 mb-3">WHAT TO DO:</p>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">1</span>
            <p className="text-sm text-foreground/70 font-medium">Open your <strong className="text-foreground">email inbox</strong> (check spam/junk too!)</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">2</span>
            <p className="text-sm text-foreground/70 font-medium">Click the <strong className="text-foreground">confirmation link</strong> from PinkSnap</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">3</span>
            <p className="text-sm text-foreground/70 font-medium">Come back here and <strong className="text-foreground">sign in</strong> with your new account!</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowVerification(false);
            setMode('signin');
            setPassword('');
            setAuthError(null);
            setSuccessMessage(null);
          }}
          className="w-full py-3 px-4 bg-primary text-white font-black text-xs sm:text-sm uppercase tracking-widest rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          <span>GO TO SIGN IN</span>
        </button>

        <p className="text-[11px] text-center text-foreground/40 font-medium mt-4">
          Didn't receive it? Check your spam folder or try signing up again.
        </p>
      </div>
    );
  }

  // ── Welcome Splash Screen ────────────────────────────────────────────────
  if (showWelcome) {
    const firstName = welcomeName.trim().split(' ')[0] || 'there';
    const isSignup = welcomeType === 'signup';

    return (
      <div className={`w-full max-w-md mx-auto ${isInline ? '' : 'ticket p-6 sm:p-8'}`}>
        <div className="flex flex-col items-center text-center py-4 animate-in fade-in zoom-in-95 duration-200">
          {/* Icon */}
          <div className="mb-5">
            <div className="w-16 h-16 rounded-full bg-primary/10 ring-1 ring-primary/20 shadow-md shadow-primary/10 flex items-center justify-center">
              {isSignup ? (
                <PartyPopper className="w-7 h-7 text-primary" />
              ) : (
                <Sparkles className="w-7 h-7 text-primary" />
              )}
            </div>
          </div>

          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] bg-primary/10 text-primary border border-primary/20 mb-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            {isSignup ? 'Account Created' : 'Authenticated'}
          </span>

          {/* Title */}
          <h2 className="font-hero text-3xl sm:text-4xl text-foreground tracking-wide mb-1">
            {isSignup ? (
              <>WELCOME TO <span className="text-primary">PINKSNAP</span></>
            ) : (
              <>WELCOME <span className="text-primary">BACK</span></>
            )}
          </h2>

          <p className="text-xs sm:text-sm text-foreground/60 font-medium mb-6">
            {isSignup ? `Hey ${firstName}, your account is ready!` : `Hey ${firstName}, good to see you again.`}
          </p>

          {/* Minimal hairline progress indicator */}
          <div className="w-36 h-[2.5px] rounded-full bg-foreground/10 overflow-hidden relative">
            <div
              className="absolute inset-y-0 left-0 w-full"
              style={{
                background: 'linear-gradient(90deg, transparent, var(--color-primary, #f53d89), transparent)',
                animation: 'modalShimmer 1.1s cubic-bezier(0.4, 0, 0.2, 1) infinite'
              }}
            />
          </div>
          <style>{`
            @keyframes modalShimmer {
              0%   { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // ── Auth Form ────────────────────────────────────────────────────────────
  return (
    <div className={`w-full max-w-md mx-auto ${isInline ? '' : 'ticket p-6 sm:p-8'}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="auth-header-title font-display text-3xl sm:text-4xl text-foreground tracking-wide">
          {mode === 'signin' && (
            <>WELCOME <span className="text-primary">BACK!</span></>
          )}
          {mode === 'signup' && (
            <>JOIN <span className="text-primary">PINKSNAP</span></>
          )}
          {mode === 'reset' && (
            <>RESET <span className="text-primary">PASSWORD</span></>
          )}
        </h2>
        <p className="text-xs sm:text-sm text-foreground/60 mt-1 font-medium">
          {mode === 'signin' && 'Sign in to access PinkSnap.'}
          {mode === 'signup' && 'Create your account to use PinkSnap.'}
          {mode === 'reset' && 'Enter your email to receive recovery instructions.'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-black/5 p-1 rounded-2xl mb-6">
        <button
          type="button"
          onClick={() => { setMode('signin'); setAuthError(null); setSuccessMessage(null); }}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all uppercase tracking-wider ${
            mode === 'signin'
              ? 'bg-white text-primary shadow-sm'
              : 'text-foreground/50 hover:text-foreground'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => { setMode('signup'); setAuthError(null); setSuccessMessage(null); }}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all uppercase tracking-wider ${
            mode === 'signup'
              ? 'bg-white text-primary shadow-sm'
              : 'text-foreground/50 hover:text-foreground'
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Error / Success Alerts */}
      {authError && (
        <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{authError}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {mode === 'signup' && (
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-foreground/70 mb-1.5">
              Display Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40" />
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="e.g. Chon"
                className="w-full pl-10 pr-4 py-2.5 bg-white/80 border border-black/10 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-[16px] sm:text-sm transition-all outline-none"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-black uppercase tracking-wider text-foreground/70 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40" />
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="w-full pl-10 pr-4 py-2.5 bg-white/80 border border-black/10 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-[16px] sm:text-sm transition-all outline-none"
            />
          </div>
        </div>

        {mode !== 'reset' && (
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-foreground/70">
                Password
              </label>
              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => { setMode('reset'); setAuthError(null); }}
                  className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider"
                >
                  Forgot?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-white/80 border border-black/10 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-[16px] sm:text-sm transition-all outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || isLoading}
          className="w-full mt-3 py-3 px-4 bg-primary text-white font-black text-xs sm:text-sm uppercase tracking-widest rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : mode === 'signin' ? (
            <>
              <span>SIGN IN</span>
              <ArrowRight className="w-4 h-4" />
            </>
          ) : mode === 'signup' ? (
            <>
              <span>CREATE FREE ACCOUNT</span>
            </>
          ) : (
            <>
              <span>SEND RESET LINK</span>
            </>
          )}
        </button>

        {mode === 'signup' && (
          <p className="mt-3 text-[11px] text-center text-foreground/50 leading-tight">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-primary transition-colors">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            .
          </p>
        )}
      </form>

      {/* Footer link to switch mode */}
      <div className="mt-6 text-center text-xs text-foreground/60">
        {mode === 'reset' ? (
          <button
            type="button"
            onClick={() => { setMode('signin'); setAuthError(null); }}
            className="text-primary font-bold hover:underline"
          >
            ← Back to Sign In
          </button>
        ) : mode === 'signin' ? (
          <span>
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => { setMode('signup'); setAuthError(null); }}
              className="text-primary font-bold hover:underline"
            >
              Sign Up
            </button>
          </span>
        ) : (
          <span>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => { setMode('signin'); setAuthError(null); }}
              className="text-primary font-bold hover:underline"
            >
              Sign in
            </button>
          </span>
        )}
      </div>
    </div>
  );
}
