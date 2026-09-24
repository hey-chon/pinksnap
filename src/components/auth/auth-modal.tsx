import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
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
        } else {
          // Show welcome splash — do NOT call onSuccess yet
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

  // Start 10-second countdown when splash appears
  useEffect(() => {
    if (!showWelcome) return;
    setCountdown(6);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          setShowWelcome(false);
          if (onSuccess) {
            onSuccess();
          } else {
            navigate('/profile', { replace: true });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showWelcome]);

  // ── Welcome Splash Screen ────────────────────────────────────────────────
  if (showWelcome) {
    return (
      <div
        className={`w-full max-w-md mx-auto ${isInline ? '' : 'ticket p-6 sm:p-8'}`}
        style={{ animation: 'welcomeFadeIn 0.45s cubic-bezier(.36,.07,.19,.97) both' }}
      >
        <style>{`
          @keyframes welcomeFadeIn {
            from { opacity: 0; transform: scale(0.93) translateY(18px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes welcomePop {
            0%   { transform: scale(0); opacity: 0; }
            60%  { transform: scale(1.18); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes sparkleFloat {
            0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.8; }
            50%       { transform: translateY(-8px) rotate(15deg); opacity: 1; }
          }
          @keyframes pulseGlow {
            0%, 100% { box-shadow: 0 0 24px rgba(245,61,137,0.35); }
            50%       { box-shadow: 0 0 44px rgba(245,61,137,0.65); }
          }
          .welcome-icon-pop    { animation: welcomePop 0.55s cubic-bezier(.36,.07,.19,.97) both; }
          .sparkle-float       { animation: sparkleFloat 2s ease-in-out infinite; }
          .sparkle-float-delay { animation: sparkleFloat 2s ease-in-out infinite 0.45s; }
          .pulse-glow          { animation: pulseGlow 2s ease-in-out infinite; }
        `}</style>

        {/* Icon + heading */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-5">
            <div className="w-20 h-20 rounded-full bg-primary/15 border-2 border-primary/40 flex items-center justify-center pulse-glow welcome-icon-pop">
              {welcomeType === 'signup'
                ? <PartyPopper className="w-9 h-9 text-primary" />
                : <Sparkles className="w-9 h-9 text-primary" />
              }
            </div>
            <span className="absolute -top-1 -right-1 text-xl sparkle-float select-none">✨</span>
            <span className="absolute -bottom-1 -left-2 text-lg sparkle-float-delay select-none">🌸</span>
          </div>

          <span className="booth-heading-kicker mb-2">
            {welcomeType === 'signup' ? "You're in!" : 'Signed in'}
          </span>
          <h2 className="font-display text-4xl sm:text-5xl text-foreground tracking-wide mb-1">
            {welcomeType === 'signin'
              ? <>WELCOME <span className="text-primary">BACK!</span></>
              : <>WELCOME TO <span className="text-primary">PINKSNAP!</span></>
            }
          </h2>
          <p className="text-sm text-foreground/60 font-medium mt-1">
            {welcomeType === 'signin'
              ? `Hey ${welcomeName} 👋 Great to see you again!`
              : `Hey ${welcomeName} 🎉 Your account is all set!`
            }
          </p>
        </div>

        {/* Dot loading animation */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <style>{`
            @keyframes modalDotBounce {
              0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
              40%           { transform: scale(1.2); opacity: 1; }
            }
            .modal-dot-1 { animation: modalDotBounce 1.2s ease-in-out infinite 0s; }
            .modal-dot-2 { animation: modalDotBounce 1.2s ease-in-out infinite 0.2s; }
            .modal-dot-3 { animation: modalDotBounce 1.2s ease-in-out infinite 0.4s; }
            .modal-dot-4 { animation: modalDotBounce 1.2s ease-in-out infinite 0.6s; }
            .modal-dot-5 { animation: modalDotBounce 1.2s ease-in-out infinite 0.8s; }
          `}</style>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-primary modal-dot-1" />
            <span className="w-3 h-3 rounded-full bg-primary/80 modal-dot-2" />
            <span className="w-3 h-3 rounded-full bg-primary/60 modal-dot-3" />
            <span className="w-3 h-3 rounded-full bg-primary/80 modal-dot-4" />
            <span className="w-3 h-3 rounded-full bg-primary modal-dot-5" />
          </div>
          <p className="text-xs text-foreground/50 font-semibold uppercase tracking-wider">
            Redirecting to your profile…
          </p>
        </div>

        {/* Removed Skip button at the bottom as requested */}
      </div>
    );
  }

  // ── Auth Form ────────────────────────────────────────────────────────────
  return (
    <div className={`w-full max-w-md mx-auto ${isInline ? '' : 'ticket p-6 sm:p-8'}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="font-display text-3xl sm:text-4xl text-foreground tracking-wide">
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
