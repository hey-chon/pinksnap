import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast.tsx';
import { normalizeAvatarUrl } from '@/lib/avatar';
import {
  User,
  LogOut,
  Shield,
  Images,
  Sparkles,
  ChevronDown,
  LogIn,
  Sliders,
  Crown,
  Zap,
} from 'lucide-react';

export function UserMenu() {
  const { user, isAuthenticated, signOut, role, isAdmin, isContributor } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    setImgError(false);
  }, [user?.avatarUrl]);

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
    toast({
      title: 'Signed Out',
      description: 'You have been safely signed out of PinkSnap.',
    });
    setLocation('/');
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-1.5 shrink-0">
        <Link
          href="/auth?mode=signup"
          data-testid="button-signup-nav"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary hover:bg-primary/90 text-white text-xs font-black tracking-wider uppercase shadow-md shadow-primary/30 transition-all hover:scale-105 active:scale-95 border border-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>SIGN UP</span>
        </Link>
        <Link
          href="/auth"
          data-testid="button-login-nav"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-black tracking-wider uppercase border border-white/30 transition-all hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>LOGIN</span>
        </Link>
      </div>
    );
  }

  const initial = (user.displayName || user.email || 'U').charAt(0).toUpperCase();
  const safeAvatarUrl = normalizeAvatarUrl(user.avatarUrl);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        data-testid="button-user-menu"
        className="inline-flex items-center gap-2 py-1 px-2 sm:px-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar */}
        <div className="w-7 h-7 rounded-full bg-primary text-white font-black text-xs flex items-center justify-center shadow-[0_0_10px_rgba(245,61,137,0.6)] overflow-hidden">
          {safeAvatarUrl && !imgError ? (
            <img
              src={safeAvatarUrl}
              alt={user.displayName}
              onError={() => setImgError(true)}
              className="w-full h-full rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            initial
          )}
        </div>

        {/* Role Pill & Name */}
        <div className="hidden sm:flex flex-col text-left leading-none">
          <span className="text-[11px] font-bold text-white max-w-[90px] truncate">
            {user.displayName}
          </span>
          <span className={`text-[9px] font-black tracking-wider uppercase inline-flex items-center gap-1 ${isContributor ? 'text-amber-500' : 'text-primary'}`}>
            {isAdmin ? (
              <>
                <Crown className="w-2.5 h-2.5 stroke-[2.5]" aria-hidden="true" />
                <span>CREATOR</span>
              </>
            ) : isContributor ? (
              <>
                <Zap className="w-2.5 h-2.5 fill-current stroke-none" aria-hidden="true" />
                <span>CONTRIBUTOR</span>
              </>
            ) : (
              'MEMBER+'
            )}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-white/75 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`}
        />
      </button>

      {/* Dropdown Menu with True Open & Close Transitions */}
      <div
        role="menu"
        aria-orientation="vertical"
        aria-hidden={!isOpen}
        className={`absolute right-0 mt-2.5 w-60 rounded-2xl bg-white/95 dark:bg-[#18111e]/95 backdrop-blur-xl shadow-[0_16px_40px_rgba(20,10,30,0.22),0_2px_8px_rgba(0,0,0,0.06)] border border-pink-200/60 dark:border-white/10 p-1.5 z-50 origin-top-right transform transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] select-none ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
        }`}
      >
        {/* User Info Header */}
        <div className="px-3.5 py-2.5 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-xs text-foreground truncate">{user.displayName}</span>
            {isAdmin && (
              <span className="px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[9px] font-black tracking-wider uppercase inline-flex items-center gap-1 shadow-2xs">
                <Crown className="w-2.5 h-2.5 stroke-[2.5]" aria-hidden="true" />
                <span>CREATOR</span>
              </span>
            )}
            {isContributor && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300/70 text-[9px] font-black tracking-wider uppercase inline-flex items-center gap-1 shadow-2xs">
                <Zap className="w-2.5 h-2.5 fill-current stroke-none" aria-hidden="true" />
                <span>CONTRIBUTOR</span>
              </span>
            )}
          </div>
          <p className="text-[10px] font-mono text-foreground/55 truncate">{user.email}</p>
        </div>

        {/* Navigation Links */}
        <div className="py-1 flex flex-col gap-0.5">
          <Link
            href="/profile"
            onClick={() => {
              setIsOpen(false);
              if (typeof window !== 'undefined' && window.location.search.includes('user=')) {
                window.history.pushState({}, '', '/profile');
                window.dispatchEvent(new PopStateEvent('popstate'));
                window.dispatchEvent(new Event('pinksnap:nav-profile'));
              }
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-foreground/80 hover:text-primary hover:bg-primary/8 active:scale-[0.98] transition-all"
          >
            <User className="w-4 h-4 text-primary shrink-0" />
            <span>Profile</span>
          </Link>

          <Link
            href="/gallery"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-foreground/80 hover:text-primary hover:bg-primary/8 active:scale-[0.98] transition-all"
          >
            <Images className="w-4 h-4 text-primary shrink-0" />
            <span>Gallery</span>
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 active:scale-[0.98] transition-all"
            >
              <Shield className="w-4 h-4 text-purple-600 shrink-0" />
              <span>Admin Dashboard</span>
            </Link>
          )}
        </div>

        {/* Sign Out Button */}
        <div className="pt-1 border-t border-black/5 dark:border-white/10">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10 active:scale-[0.98] transition-all text-left cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
