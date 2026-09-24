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

  // Start countdown when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    if (sessionStorage.getItem('ps_auth_splash_done') === '1') {
      setLocation('/profile', { replace: true });
      return;
    }

    setCountdown(REDIRECT_DELAY);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          sessionStorage.setItem('ps_auth_splash_done', '1');
          setLocation('/profile', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 800);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.email]);

  // progress percentage for the bar (unused for dots but kept for future)
  const progressPct = Math.round(((REDIRECT_DELAY - countdown) / REDIRECT_DELAY) * 100);

  const splashDone = typeof window !== 'undefined' ? sessionStorage.getItem('ps_auth_splash_done') === '1' : false;

  // Prevent flashing the splash if we're just going to redirect
  if (isAuthenticated && user && splashDone) {
    return null;
  }

  if (isAuthenticated && user) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white">
        <style>{`
          @keyframes authFadeIn {
            from { opacity: 0; transform: scale(0.93) translateY(18px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes authIconPop {
            0%   { transform: scale(0); opacity: 0; }
            60%  { transform: scale(1.18); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes authSparkleFloat {
            0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.8; }
            50%       { transform: translateY(-8px) rotate(15deg); opacity: 1; }
          }
          @keyframes authPulseGlow {
            0%, 100% { box-shadow: 0 0 20px rgba(245,61,137,0.3); }
            50%       { box-shadow: 0 0 40px rgba(245,61,137,0.6); }
          }
          .auth-icon-pop   { animation: authIconPop 0.55s cubic-bezier(.36,.07,.19,.97) both; }
          .auth-sparkle    { animation: authSparkleFloat 2s ease-in-out infinite; }
          .auth-sparkle-d  { animation: authSparkleFloat 2s ease-in-out infinite 0.45s; }
          .auth-pulse-glow { animation: authPulseGlow 2s ease-in-out infinite; }
          @keyframes authDotBounce {
            0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
            40%           { transform: scale(1.2); opacity: 1; }
          }
          .auth-dot-1 { animation: authDotBounce 1.2s ease-in-out infinite 0s; }
          .auth-dot-2 { animation: authDotBounce 1.2s ease-in-out infinite 0.2s; }
          .auth-dot-3 { animation: authDotBounce 1.2s ease-in-out infinite 0.4s; }
          .auth-dot-4 { animation: authDotBounce 1.2s ease-in-out infinite 0.6s; }
          .auth-dot-5 { animation: authDotBounce 1.2s ease-in-out infinite 0.8s; }
        `}</style>
        
        <div className="flex flex-col items-center text-center px-4" style={{ animation: 'authFadeIn 0.45s cubic-bezier(.36,.07,.19,.97) both' }}>
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-5">
              <div className="w-20 h-20 rounded-full bg-primary/15 border-2 border-primary/40 flex items-center justify-center text-primary font-display text-2xl auth-icon-pop auth-pulse-glow overflow-hidden">
                {safeAvatarUrl ? (
                  <img
                    src={safeAvatarUrl}
                    alt={user.displayName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  (user.displayName || user.email).charAt(0).toUpperCase()
                )}
              </div>
              <span className="absolute -top-1 -right-1 text-xl auth-sparkle select-none">✨</span>
              <span className="absolute -bottom-1 -left-2 text-lg auth-sparkle-d select-none">🌸</span>
            </div>

            <span className="booth-heading-kicker mb-2">Authenticated</span>
            <h1 className="font-display text-4xl sm:text-5xl text-black tracking-wide mb-1">
              WELCOME <span className="text-primary">BACK!</span>
            </h1>
            <p className="text-sm text-black/60 font-medium mt-1">
              Hey {user.displayName || user.email.split('@')[0]} 👋 Great to see you again!
            </p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-primary auth-dot-1" />
              <span className="w-3 h-3 rounded-full bg-primary/80 auth-dot-2" />
              <span className="w-3 h-3 rounded-full bg-primary/60 auth-dot-3" />
              <span className="w-3 h-3 rounded-full bg-primary/80 auth-dot-4" />
              <span className="w-3 h-3 rounded-full bg-primary auth-dot-5" />
            </div>
            <p className="text-xs text-black/40 font-semibold uppercase tracking-wider">
              Redirecting to your profile…
            </p>
          </div>
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

