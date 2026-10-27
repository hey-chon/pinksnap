import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
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
import Printing from '@/pages/printing';
import Receipt from '@/pages/receipt';
import { CookieNotice } from '@/components/cookie-notice';
import { ProtectedRoute } from '@/components/auth/protected-route';

// ── Flow Guard ──────────────────────────────────────────────────────────────
// Prevents direct URL shortcuts to flow pages by requiring users to start at /
export function resetAppFlow() {
  sessionStorage.setItem('ps_has_entered_app', 'true');
  sessionStorage.removeItem('ps_has_loaded');
  sessionStorage.removeItem('ps_intent_start');
}

function FlowGuard({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Whenever on home, ensure app entry is marked and clear previous completed loads
    if (location === '/') {
      sessionStorage.setItem('ps_has_entered_app', 'true');
      sessionStorage.removeItem('ps_has_loaded');
      return;
    }

    // /loading is the entry point into the booth flow
    if (location === '/loading') {
      sessionStorage.setItem('ps_has_entered_app', 'true');
      return;
    }

    // Guard internal booth flow pages: require entering the app
    const flowPages = ['/setup', '/styles', '/studio', '/edit', '/printing', '/receipt'];
    if (flowPages.includes(location)) {
      if (!sessionStorage.getItem('ps_has_entered_app')) {
        setLocation('/', { replace: true });
        return;
      }
      // Direct URL jump to setup/styles/studio/edit without passing through loading
      if (['/setup', '/styles', '/studio', '/edit'].includes(location) && !sessionStorage.getItem('ps_has_loaded')) {
        setLocation('/', { replace: true });
        return;
      }
    }
  }, [location, setLocation]);

  return <>{children}</>;
}

// ── Welcome Gate ────────────────────────────────────────────────────────────
// Shows a smooth, elegant welcome transition when returning to PinkSnap
// with an active authenticated session.
const GATE_KEY = 'ps_welcome_gate_done';

function WelcomeGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [gating, setGating] = useState(false);
  const [fading, setFading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isLoading) return;

    const alreadyShown = sessionStorage.getItem(GATE_KEY) === '1';

    if (isAuthenticated && !alreadyShown) {
      sessionStorage.setItem(GATE_KEY, '1');
      setGating(true);
      setFading(false);
      timerRef.current = setTimeout(() => {
        setFading(true);
        setTimeout(() => setGating(false), 300);
      }, 3500);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isAuthenticated, isLoading]);

  if (gating) {
    const name = user?.displayName || user?.email?.split('@')[0] || '';

    return (
      <div
        className={`fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-md transition-opacity duration-300 ${
          fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div className="flex flex-col items-center text-center px-6 max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
          {/* Avatar / Monogram */}
          <div className="mb-5">
            <div className="w-16 h-16 rounded-full bg-primary/10 ring-1 ring-primary/20 shadow-md shadow-primary/10 flex items-center justify-center overflow-hidden">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="font-hero text-2xl text-primary tracking-wide">
                  {name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Kicker */}
          <span className="booth-heading-kicker mb-2 text-primary">
            Authenticating
          </span>

          {/* Heading */}
          <h1 className="font-hero text-3xl sm:text-4xl text-foreground tracking-wide mb-1">
            HELLO <span className="text-primary">WELCOME!</span>
          </h1>

          {/* Exact original description */}
          <p className="text-xs sm:text-sm text-foreground/60 font-medium mb-6">
            Hey {name} - Setting up your session…
          </p>

          {/* Minimal hairline progress indicator */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-40 h-[2.5px] rounded-full bg-foreground/10 overflow-hidden relative">
              <div
                className="absolute inset-y-0 left-0 w-full"
                style={{
                  background: 'linear-gradient(90deg, transparent, var(--color-primary, #f53d89), transparent)',
                  animation: 'gateShimmer 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite'
                }}
              />
            </div>
            <p className="text-[11px] text-foreground/40 font-semibold uppercase tracking-wider">
              Just a moment…
            </p>
          </div>
          <style>{`
            @keyframes gateShimmer {
              0%   { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
          `}</style>
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
      <Route path="/printing">
        {() => <ProtectedRoute component={Printing} />}
      </Route>
      <Route path="/receipt" component={Receipt} />
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
            <FlowGuard>
              <WelcomeGate>
                <Router />
              </WelcomeGate>
            </FlowGuard>
            <CookieNotice />
          </WouterRouter>
        </ToastProvider>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;

