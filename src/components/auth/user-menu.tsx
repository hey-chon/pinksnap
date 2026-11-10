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

      {/* Dropdown Menu with True Open & Close Transitions — PinkSnap Theme */}
      <div
        role="menu"
        aria-orientation="vertical"
        aria-hidden={!isOpen}
        className={`absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white/98 backdrop-blur-xl shadow-[0_16px_38px_rgba(245,61,137,0.18),0_2px_8px_rgba(0,0,0,0.04)] border border-pink-200 p-1.5 z-50 origin-top-right transform transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] select-none ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
        }`}
      >
        {/* User Info Header */}
        <div className="px-3.5 py-2.5 border-b border-pink-100 bg-pink-50/40 rounded-xl mb-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-xs text-zinc-900 truncate">{user.displayName}</span>
            {isAdmin && (
              <span className="px-1.5 py-0.5 rounded-full bg-pink-100 border border-pink-300 text-primary text-[8.5px] font-black tracking-wider uppercase inline-flex items-center gap-1 shadow-2xs">
                <Crown className="w-2.5 h-2.5 stroke-[2.5]" aria-hidden="true" />
                <span>CREATOR</span>
              </span>
            )}
            {isContributor && !isAdmin && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-[8.5px] font-black tracking-wider uppercase inline-flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 fill-current stroke-none" aria-hidden="true" />
                <span>CONTRIBUTOR</span>
              </span>
            )}
          </div>
          <p className="text-[10.5px] font-medium text-zinc-400 truncate">{user.email}</p>
        </div>

        {/* Navigation Links — Clean, Simple, No Description Words */}
        <div className="py-0.5 flex flex-col gap-0.5">
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
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-zinc-700 hover:text-primary hover:bg-pink-50 active:scale-[0.98] transition-all"
          >
            <User className="w-4 h-4 text-primary shrink-0" />
            <span>Profile</span>
          </Link>

          <Link
            href="/gallery"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-zinc-700 hover:text-primary hover:bg-pink-50 active:scale-[0.98] transition-all"
          >
            <Images className="w-4 h-4 text-primary shrink-0" />
            <span>Gallery</span>
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-purple-700 hover:bg-purple-50 active:scale-[0.98] transition-all"
            >
              <Shield className="w-4 h-4 text-purple-600 shrink-0" />
              <span>Admin Dashboard</span>
            </Link>
          )}
        </div>

        {/* Sign Out Button */}
        <div className="pt-1 mt-1 border-t border-pink-100">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-destructive hover:bg-rose-50 active:scale-[0.98] transition-all text-left cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
