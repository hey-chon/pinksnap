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
  ChevronRight,
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
        className={`absolute right-0 top-full mt-2 w-64 rounded-2xl bg-[#160f1c]/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_28px_rgba(245,61,137,0.18)] border border-white/12 p-1.5 z-50 origin-top-right transform transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] select-none ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-90 -translate-y-2 pointer-events-none'
        }`}
      >
        {/* User Info Header Card */}
        <div className="p-3 bg-gradient-to-b from-white/[0.08] to-transparent rounded-xl border border-white/[0.06] mb-1">
          <div className="flex items-center gap-2.5">
            {/* Glowing Avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary via-[#ff8cb8] to-[#b31454] p-[1.5px] shadow-[0_0_12px_rgba(245,61,137,0.5)] shrink-0">
              <div className="w-full h-full rounded-full bg-[#160f1c] overflow-hidden flex items-center justify-center text-white font-black text-xs">
                {safeAvatarUrl && !imgError ? (
                  <img
                    src={safeAvatarUrl}
                    alt={user.displayName}
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  initial
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold text-xs text-white truncate max-w-[100px]">{user.displayName}</span>
                {isAdmin && (
                  <span className="px-1.5 py-0.5 rounded-full bg-purple-500/25 border border-purple-400/50 text-purple-200 text-[8.5px] font-black tracking-wider uppercase inline-flex items-center gap-1 shadow-2xs">
                    <Crown className="w-2.5 h-2.5 stroke-[2.5]" aria-hidden="true" />
                    <span>CREATOR</span>
                  </span>
                )}
                {isContributor && !isAdmin && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[8.5px] font-black tracking-wider uppercase inline-flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 fill-current stroke-none" aria-hidden="true" />
                    <span>CONTRIBUTOR</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/45 truncate mt-0.5 font-medium">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="py-1 flex flex-col gap-1">
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
            className="group flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-white/[0.08] active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary group-hover:scale-105 group-hover:bg-primary/30 transition-all shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-white/90 group-hover:text-white transition-colors">Profile</span>
                <span className="block text-[9.5px] text-white/40 group-hover:text-white/60 transition-colors">View public wall & bio</span>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-white/25 group-hover:text-white/70 group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            href="/gallery"
            onClick={() => setIsOpen(false)}
            className="group flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-white/[0.08] active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-pink-500/20 border border-pink-400/30 flex items-center justify-center text-pink-300 group-hover:scale-105 group-hover:bg-pink-500/30 transition-all shrink-0">
                <Images className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-white/90 group-hover:text-white transition-colors">Gallery</span>
                <span className="block text-[9.5px] text-white/40 group-hover:text-white/60 transition-colors">Community photostrips</span>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-white/25 group-hover:text-white/70 group-hover:translate-x-0.5 transition-all" />
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setIsOpen(false)}
              className="group flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-purple-500/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-500/25 border border-purple-400/40 flex items-center justify-center text-purple-300 group-hover:scale-105 group-hover:bg-purple-500/35 transition-all shrink-0">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <span className="block text-xs font-bold text-purple-200 group-hover:text-white transition-colors">Admin Dashboard</span>
                  <span className="block text-[9.5px] text-purple-300/50 group-hover:text-purple-200/70 transition-colors">Manage users & posts</span>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-purple-400/40 group-hover:text-purple-300 group-hover:translate-x-0.5 transition-all" />
            </Link>
          )}
        </div>

        {/* Sign Out Button */}
        <div className="pt-1 mt-1 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={handleSignOut}
            className="group w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-rose-500/15 active:scale-[0.98] transition-all text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-400 group-hover:scale-105 group-hover:bg-rose-500/30 transition-all shrink-0">
                <LogOut className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-rose-300 group-hover:text-rose-200 transition-colors">Log Out</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-rose-400/40 group-hover:text-rose-300/80 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>
      </div>
    </div>
  );
}
