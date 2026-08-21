import React from 'react';
import { Link, Redirect } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import type { UserRole } from '@/types/auth';
import { TopNav, BottomNav } from '@/components/layout';
import { ShieldAlert, ArrowLeft, KeyRound, Sparkles } from 'lucide-react';

interface ProtectedRouteProps {
  component: React.ComponentType<any>;
  requiredRole?: UserRole | UserRole[];
  redirectTo?: string;
  [key: string]: any;
}

export function ProtectedRoute({
  component: Component,
  requiredRole,
  redirectTo = '/auth',
  ...rest
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole, user, role } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col h-[100dvh] items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center animate-pulse">
            <KeyRound className="w-6 h-6 text-primary" />
          </div>
          <p className="font-display text-2xl text-foreground/80 tracking-wider">CHECKING PERMISSIONS...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to={redirectTo} />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    const requiredList = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return (
      <div className="flex flex-col h-[100dvh]">
        <TopNav backTo="/" title="ACCESS RESTRICTED" />
        <main className="flex-1 overflow-y-auto flex items-center justify-center p-4 sm:p-6">
          <div className="ticket max-w-lg w-full p-6 sm:p-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center mb-5">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <span className="booth-heading-kicker mb-3">Authorization Required</span>
            <h1 className="font-display text-3xl sm:text-4xl text-foreground mb-2">ACCESS RESTRICTED</h1>

            <p className="text-xs sm:text-sm text-foreground/70 mb-4 max-w-sm">
              This area is restricted to users with <span className="font-bold text-primary uppercase">{requiredList.join(' or ')}</span> privileges.
            </p>

            <div className="p-3 bg-black/5 rounded-xl text-xs font-mono mb-6 text-foreground/60 w-full">
              Logged in as: <strong className="text-foreground">{user?.email}</strong>
              <br />
              Current Role: <span className="text-primary font-bold uppercase">{role}</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 w-full">
              <Link
                href="/profile"
                className="px-5 py-2.5 bg-primary text-white text-xs font-black tracking-wider uppercase rounded-full hover:scale-105 transition-transform flex items-center gap-2"
              >
                Go to Profile
              </Link>
              <Link
                href="/"
                className="px-5 py-2.5 bg-white/60 hover:bg-white text-foreground text-xs font-black tracking-wider uppercase rounded-full border border-black/10 transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Return Home
              </Link>
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return <Component {...rest} />;
}
