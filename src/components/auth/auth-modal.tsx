import React, { useState } from 'react';
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
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
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
          toast({
            title: 'Welcome Back!',
            description: 'You have signed in successfully.',
          });
          if (onSuccess) onSuccess();
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
          const msg = res.message || 'Account created successfully!';
          setSuccessMessage(msg);
          toast({
            title: 'Account Created',
            description: msg,
          });
          if (onSuccess) onSuccess();
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

  return (
    <div className={`w-full max-w-md mx-auto ${isInline ? '' : 'ticket p-6 sm:p-8'}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-2">
          <Sparkles className="w-3 h-3" />
          {mode === 'signin' ? 'MEMBER PASS' : mode === 'signup' ? 'NEW STAR PASS' : 'PASS RECOVERY'}
        </div>
        <h2 className="font-display text-3xl sm:text-4xl text-foreground tracking-wide">
          {mode === 'signin' && (
            <>ENTER THE <span className="text-primary">BOOTH</span></>
          )}
          {mode === 'signup' && (
            <>JOIN <span className="text-primary">PINKSNAP</span></>
          )}
          {mode === 'reset' && (
            <>RESET <span className="text-primary">PASSWORD</span></>
          )}
        </h2>
        <p className="text-xs sm:text-sm text-foreground/60 mt-1 font-medium">
          {mode === 'signin' && 'Sign in to access your saved cloud strips and settings.'}
          {mode === 'signup' && 'Create your account to save and customize your prints.'}
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
                placeholder="e.g. Cherry Snap"
                className="w-full pl-10 pr-4 py-2.5 bg-white/80 border border-black/10 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-xs sm:text-sm transition-all outline-none"
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
              className="w-full pl-10 pr-4 py-2.5 bg-white/80 border border-black/10 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-xs sm:text-sm transition-all outline-none"
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
                className="w-full pl-10 pr-10 py-2.5 bg-white/80 border border-black/10 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-xs sm:text-sm transition-all outline-none"
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
              <span>SIGN IN TO BOOTH</span>
              <ArrowRight className="w-4 h-4" />
            </>
          ) : mode === 'signup' ? (
            <>
              <span>CREATE FREE ACCOUNT</span>
              <Sparkles className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>SEND RESET LINK</span>
              <KeyRound className="w-4 h-4" />
            </>
          )}
        </button>
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
              Sign up free
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
