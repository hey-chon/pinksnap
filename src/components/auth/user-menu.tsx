import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast.tsx';
import {
  User,
  LogOut,
  Shield,
  Images,
  Sparkles,
  ChevronDown,
  LogIn,
  Sliders,
} from 'lucide-react';

export function UserMenu() {
  const { user, isAuthenticated, signOut, role, isAdmin } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      <Link
        href="/auth"
        data-testid="button-signin-nav"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary hover:bg-primary/90 text-white text-xs font-black tracking-wider uppercase shadow-md shadow-primary/30 transition-all hover:scale-105 active:scale-95 border border-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0"
      >
        <LogIn className="w-3.5 h-3.5" />
        <span>SIGN IN</span>
      </Link>
    );
  }

  const initial = (user.displayName || user.email || 'U').charAt(0).toUpperCase();

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
        <div className="w-7 h-7 rounded-full bg-primary text-white font-black text-xs flex items-center justify-center shadow-[0_0_10px_rgba(245,61,137,0.6)]">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full rounded-full object-cover" />
          ) : (
            initial
          )}
        </div>

        {/* Role Pill & Name */}
        <div className="hidden sm:flex flex-col text-left leading-none">
          <span className="text-[11px] font-bold text-white max-w-[90px] truncate">
            {user.displayName}
          </span>
          <span className="text-[9px] font-black tracking-wider uppercase text-primary">
            {role}
          </span>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-white/70 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl border border-black/10 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* User Info Header */}
          <div className="px-4 py-2.5 border-b border-black/5">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-xs text-foreground truncate">{user.displayName}</span>
              {isAdmin && (
                <span className="px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[9px] font-black tracking-wider uppercase">
                  ADMIN
                </span>
              )}
            </div>
            <p className="text-[10px] font-mono text-foreground/60 truncate">{user.email}</p>
          </div>

          {/* Navigation Links */}
          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-foreground/80 hover:text-primary hover:bg-primary/5 transition-colors"
            >
              <User className="w-4 h-4 text-primary" />
              <span>My Profile & Settings</span>
            </Link>

            <Link
              href="/gallery"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-foreground/80 hover:text-primary hover:bg-primary/5 transition-colors"
            >
              <Images className="w-4 h-4 text-primary" />
              <span>Saved Photo Strips</span>
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-purple-700 hover:bg-purple-50 transition-colors"
              >
                <Shield className="w-4 h-4 text-purple-600" />
                <span>Admin Dashboard</span>
              </Link>
            )}
          </div>

          {/* Sign Out Button */}
          <div className="pt-1 border-t border-black/5">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
