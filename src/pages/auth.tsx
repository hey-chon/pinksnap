import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { TopNav, BottomNav } from '@/components/layout';
import { AuthModal } from '@/components/auth/auth-modal';
import { useAuth } from '@/hooks/use-auth';
import { normalizeAvatarUrl } from '@/lib/avatar';
import { ArrowRight, Sparkles } from 'lucide-react';

const REDIRECT_DELAY = 6; // seconds

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const safeAvatarUrl = normalizeAvatarUrl(user?.avatarUrl);

  const [countdown, setCountdown] = useState(REDIRECT_DELAY);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const search = typeof window !== 'undefined' ? window.location.search : '';
  const params = new URLSearchParams(search);
  const initialMode = params.get('mode') === 'signup'
    ? 'signup'
    : params.get('mode') === 'reset'
    ? 'reset'
    : 'signin';

  const goToProfile = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setLocation('/profile', { replace: true });
  };

  // Quick, smooth redirect when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    if (sessionStorage.getItem('ps_auth_splash_done') === '1') {
      setLocation('/profile', { replace: true });
      return;
    }

    sessionStorage.setItem('ps_welcome_gate_done', '1');

    timerRef.current = setTimeout(() => {
      sessionStorage.setItem('ps_auth_splash_done', '1');
      setLocation('/profile', { replace: true });
    }, 1250);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isAuthenticated, user?.email, setLocation]);

  // progress percentage for the bar (unused for dots but kept for future)
  const progressPct = Math.round(((REDIRECT_DELAY - countdown) / REDIRECT_DELAY) * 100);

  const splashDone = typeof window !== 'undefined' ? sessionStorage.getItem('ps_auth_splash_done') === '1' : false;

  // Prevent flashing the splash if we're just going to redirect
  if (isAuthenticated && user && splashDone) {
    return null;
  }

  if (isAuthenticated && user) {
    const rawName = user.displayName || user.email.split('@')[0] || '';
    const firstName = rawName.trim().split(' ')[0] || 'there';

    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/95 backdrop-blur-md">
        <div className="flex flex-col items-center text-center px-6 max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
          {/* Avatar */}
          <div className="mb-5">
            <div className="w-16 h-16 rounded-full bg-primary/10 ring-1 ring-primary/20 shadow-md shadow-primary/10 flex items-center justify-center overflow-hidden">
              {safeAvatarUrl ? (
                <img
                  src={safeAvatarUrl}
                  alt={user.displayName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="font-hero text-2xl text-primary tracking-wide">
                  {firstName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] bg-primary/10 text-primary border border-primary/20 mb-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Authenticated
          </span>

          {/* Title */}
          <h1 className="font-hero text-3xl sm:text-4xl text-foreground tracking-wide mb-1">
            WELCOME <span className="text-primary">BACK</span>
          </h1>

          <p className="text-xs sm:text-sm text-foreground/60 font-medium mb-6">
            Hey {firstName}, redirecting to your profile…
          </p>

          {/* Minimal hairline progress indicator */}
          <div className="w-36 h-[2.5px] rounded-full bg-foreground/10 overflow-hidden relative">
            <div
              className="absolute inset-y-0 left-0 w-full"
              style={{
                background: 'linear-gradient(90deg, transparent, var(--color-primary, #f53d89), transparent)',
                animation: 'authShimmer 1.1s cubic-bezier(0.4, 0, 0.2, 1) infinite'
              }}
            />
          </div>
          <style>{`
            @keyframes authShimmer {
              0%   { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh]">
      <TopNav backTo="/" title="AUTHENTICATION" />

      <main className="flex-1 overflow-y-auto flex items-center justify-center p-4 sm:p-6 md:p-8">
        <AuthModal initialMode={initialMode} onSuccess={() => setLocation('/profile', { replace: true })} />
      </main>

      <BottomNav />
    </div>
  );
}

