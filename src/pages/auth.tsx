import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { TopNav, BottomNav } from '@/components/layout';
import { AuthModal } from '@/components/auth/auth-modal';
import { useAuth } from '@/hooks/use-auth';
import { Sparkles, Camera, ArrowRight, LogOut, Shield } from 'lucide-react';
import { Link } from 'wouter';

export default function AuthPage() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, user, signOut, role, isAdmin } = useAuth();

  const search = typeof window !== 'undefined' ? window.location.search : '';
  const params = new URLSearchParams(search);
  const initialMode = params.get('mode') === 'signup'
    ? 'signup'
    : params.get('mode') === 'reset'
    ? 'reset'
    : 'signin';

  const handleSuccess = () => {
    setLocation('/profile');
  };

  return (
    <div className="flex flex-col h-[100dvh]">
      <TopNav backTo="/" title="AUTHENTICATION" />

      <main className="flex-1 overflow-y-auto flex items-center justify-center p-4 sm:p-6 md:p-8">
        {isAuthenticated && user ? (
          <div className="ticket max-w-md w-full p-6 sm:p-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-primary font-display text-2xl mb-4 shadow-[0_0_20px_rgba(245,61,137,0.3)]">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full rounded-full object-cover" />
              ) : (
                (user.displayName || user.email).charAt(0).toUpperCase()
              )}
            </div>

            <span className="booth-heading-kicker mb-2">Authenticated</span>
            <h1 className="font-display text-3xl sm:text-4xl text-foreground mb-1">
              HELLO, <span className="text-primary">{user.displayName}</span>!
            </h1>
            <p className="text-xs text-foreground/60 mb-6 font-mono">{user.email}</p>

            <div className="w-full p-4 rounded-xl bg-black/5 mb-6 text-left space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-foreground/60 uppercase tracking-wider">Account Type</span>
                <span className="font-black text-primary uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-primary/10 text-[10px]">
                  {role === 'admin' ? 'Administrator' : 'Member'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-foreground/60 uppercase tracking-wider">Status</span>
                <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 w-full">
              <Link
                href="/profile"
                className="w-full py-3 px-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Go to Profile & Settings
              </Link>
              <Link
                href="/setup"
                className="w-full py-3 px-4 bg-white/70 hover:bg-white text-foreground font-black text-xs uppercase tracking-widest rounded-xl border border-black/10 transition-colors flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4 text-primary" /> Start Photobooth Session
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="w-full py-3 px-4 bg-purple-100 hover:bg-purple-200 text-purple-800 font-black text-xs uppercase tracking-widest rounded-xl border border-purple-300 transition-colors flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4 text-purple-600" /> Admin Dashboard
                </Link>
              )}
              <button
                type="button"
                onClick={signOut}
                className="w-full py-2.5 px-4 text-destructive hover:bg-destructive/10 font-black text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        ) : (
          <AuthModal initialMode={initialMode} onSuccess={handleSuccess} />
        )}
      </main>

      <BottomNav />
    </div>
  );
}
