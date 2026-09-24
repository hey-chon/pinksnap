import { Route, Switch, Router as WouterRouter } from 'wouter';
import { useEffect, useRef, useState } from 'react';

import { AppProvider } from '@/lib/store';
import { AuthProvider } from '@/lib/auth-context';
import { ToastProvider } from '@/hooks/use-toast.tsx';
import { useAuth } from '@/hooks/use-auth';
import NotFound from '@/pages/not-found';
import Home from '@/pages/home';
import Setup from '@/pages/setup';
import Styles from '@/pages/styles';
import Studio from '@/pages/studio';
import Edit from '@/pages/edit';
import Gallery from '@/pages/gallery';
import HowItWorks from '@/pages/how-it-works';
import Chat from '@/pages/chat';
import StudioLoading from '@/components/studio-loading';
import AuthPage from '@/pages/auth';
import ProfilePage from '@/pages/profile';
import AdminPage from '@/pages/admin';
import PrivacyPolicy from '@/pages/privacy-policy';
import TermsOfService from '@/pages/terms-of-service';
import { CookieNotice } from '@/components/cookie-notice';
import { ProtectedRoute } from '@/components/auth/protected-route';

// ── Welcome Gate ────────────────────────────────────────────────────────────
// Shows a dot-loading splash for 8 s after authentication is detected for the
// first time in this browser session. Prevents URL-bar bypassing.
const GATE_KEY = 'ps_welcome_gate_done';
const GATE_DURATION = 4800; // ms

function WelcomeGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [gating, setGating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Auth still initialising — wait
    if (isLoading) return;

    const alreadyShown = sessionStorage.getItem(GATE_KEY) === '1';

    if (isAuthenticated && !alreadyShown) {
      // Mark immediately so re-renders don't retrigger
      sessionStorage.setItem(GATE_KEY, '1');
      setGating(true);
      timerRef.current = setTimeout(() => setGating(false), GATE_DURATION);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLoading]);

  if (gating) {
    const name = user?.displayName || user?.email?.split('@')[0] || '';
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
        <style>{`
          @keyframes gateFadeIn {
            from { opacity: 0; transform: scale(0.94) translateY(14px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes gateIconPop {
            0%   { transform: scale(0); opacity: 0; }
            60%  { transform: scale(1.18); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes gateSparkle {
            0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.8; }
            50%       { transform: translateY(-6px) rotate(12deg); opacity: 1; }
          }
          @keyframes gatePulse {
            0%, 100% { box-shadow: 0 0 20px rgba(245,61,137,0.3); }
            50%       { box-shadow: 0 0 40px rgba(245,61,137,0.65); }
          }
          @keyframes gateDotBounce {
            0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
            40%           { transform: scale(1.2); opacity: 1; }
          }
          .gate-wrap     { animation: gateFadeIn 0.45s cubic-bezier(.36,.07,.19,.97) both; }
          .gate-icon-pop { animation: gateIconPop 0.55s cubic-bezier(.36,.07,.19,.97) both; }
          .gate-sparkle  { animation: gateSparkle 2s ease-in-out infinite; }
          .gate-sparkle2 { animation: gateSparkle 2s ease-in-out infinite 0.45s; }
          .gate-pulse    { animation: gatePulse 2s ease-in-out infinite; }
          .gate-d1 { animation: gateDotBounce 1.2s ease-in-out infinite 0s; }
          .gate-d2 { animation: gateDotBounce 1.2s ease-in-out infinite 0.2s; }
          .gate-d3 { animation: gateDotBounce 1.2s ease-in-out infinite 0.4s; }
          .gate-d4 { animation: gateDotBounce 1.2s ease-in-out infinite 0.6s; }
          .gate-d5 { animation: gateDotBounce 1.2s ease-in-out infinite 0.8s; }
        `}</style>

        <div className="gate-wrap flex flex-col items-center text-center px-4">
          {/* Icon */}
          <div className="relative mb-5">
            <div className="w-20 h-20 rounded-full bg-primary/15 border-2 border-primary/40 flex items-center justify-center gate-icon-pop gate-pulse text-primary font-display text-2xl overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                name.charAt(0).toUpperCase()
              )}
            </div>
            <span className="absolute -top-1 -right-1 text-xl gate-sparkle select-none">✨</span>
            <span className="absolute -bottom-1 -left-2 text-lg gate-sparkle2 select-none">🌸</span>
          </div>

          <span className="booth-heading-kicker mb-2 text-primary">Authenticated</span>
          <h1 className="font-display text-4xl sm:text-5xl text-black tracking-wide mb-1">
            WELCOME <span className="text-primary">BACK!</span>
          </h1>
          <p className="text-sm text-black/60 font-medium mt-1 mb-8">
            Hey {name} - Setting up your session…
          </p>

          {/* Bouncing dots */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-primary gate-d1" />
              <span className="w-3 h-3 rounded-full bg-primary/80 gate-d2" />
              <span className="w-3 h-3 rounded-full bg-primary/60 gate-d3" />
              <span className="w-3 h-3 rounded-full bg-primary/80 gate-d4" />
              <span className="w-3 h-3 rounded-full bg-primary gate-d5" />
            </div>
            <p className="text-xs text-black/40 font-semibold uppercase tracking-wider">
              Just a moment…
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/loading">
        {() => <ProtectedRoute component={StudioLoading} />}
      </Route>
      <Route path="/get-started">
        {() => <ProtectedRoute component={StudioLoading} />}
      </Route>
      <Route path="/setup">
        {() => <ProtectedRoute component={Setup} />}
      </Route>
      <Route path="/styles">
        {() => <ProtectedRoute component={Styles} />}
      </Route>
      <Route path="/studio">
        {() => <ProtectedRoute component={Studio} />}
      </Route>
      <Route path="/edit">
        {() => <ProtectedRoute component={Edit} />}
      </Route>
      <Route path="/gallery" component={Gallery} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/chat" component={Chat} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/login" component={AuthPage} />
      <Route path="/signup" component={AuthPage} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsOfService} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/profile">
        {() => <ProtectedRoute component={ProfilePage} />}
      </Route>
      <Route path="/admin">
        {() => <ProtectedRoute component={AdminPage} requiredRole="admin" />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <ToastProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <WelcomeGate>
              <Router />
            </WelcomeGate>
            <CookieNotice />
          </WouterRouter>
        </ToastProvider>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;

