import React, { useState } from 'react';
import { Link } from 'wouter';
import { TopNav, BottomNav } from '@/components/layout';
import { useAuth } from '@/hooks/use-auth';
import { useAppContext } from '@/lib/store';
import { useToast } from '@/hooks/use-toast.tsx';
import {
  User,
  Mail,
  Shield,
  Sparkles,
  KeyRound,
  LogOut,
  Save,
} from 'lucide-react';

function isValidAvatarUrl(url: string): boolean {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && url.length <= 2048;
  } catch {
    return false;
  }
}

export default function ProfilePage() {
  const { user, updateProfile, signOut, resetPassword, isAdmin } = useAuth();
  const { savedMemories } = useAppContext();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  if (!user) {
    return (
      <div className="flex flex-col h-[100dvh]">
        <TopNav backTo="/" title="MY PROFILE" />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="ticket p-8 text-center max-w-sm">
            <p className="text-foreground/70 mb-4 font-semibold text-sm">Please sign in to view your profile.</p>
            <Link
              href="/auth"
              className="px-6 py-3 bg-primary text-white font-black text-xs uppercase tracking-wider rounded-full shadow-lg shadow-primary/30 inline-block"
            >
              Sign In
            </Link>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAvatar = avatarUrl.trim();
    if (cleanAvatar && !isValidAvatarUrl(cleanAvatar)) {
      toast({
        title: 'Invalid Avatar URL',
        description: 'Please provide a valid secure https:// image URL.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateProfile({
        displayName: displayName.trim(),
        avatarUrl: cleanAvatar || undefined,
      });

      if (res.error) {
        toast({
          title: 'Update Failed',
          description: res.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Profile Saved',
          description: 'Your changes have been updated.',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    setIsSendingReset(true);
    try {
      const res = await resetPassword(user.email);
      if (res.error) {
        toast({
          title: 'Reset Failed',
          description: res.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Reset Email Sent',
          description: res.message || 'Check your inbox for password reset instructions.',
        });
      }
    } finally {
      setIsSendingReset(false);
    }
  };

  const initial = (user.displayName || user.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="flex flex-col h-[100dvh]">
      <TopNav backTo="/" title="MY PROFILE" />

      <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 sm:py-10">
        <div className="max-w-3xl mx-auto space-y-6 pb-12">
          {/* Header Banner Ticket */}
          <div className="ticket p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-primary/10 border-4 border-white shadow-xl flex items-center justify-center text-primary font-display text-4xl overflow-hidden">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
                ) : (
                  initial
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-primary text-white shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h1 className="font-display text-3xl sm:text-4xl text-foreground">
                  {user.displayName}
                </h1>
                {isAdmin ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <Shield className="w-3 h-3" /> ADMIN
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-black uppercase tracking-wider">
                    MEMBER PASS
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-mono text-foreground/60 flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="w-3.5 h-3.5" /> {user.email}
              </p>
              <div className="mt-3 flex items-center justify-center sm:justify-start gap-3">
                <div className="text-[11px] font-bold text-foreground/60">
                  Gallery: <strong className="text-primary font-black">{savedMemories.length}</strong> strips saved
                </div>
              </div>
            </div>

            {isAdmin && (
              <Link
                href="/admin"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-purple-500/20 flex items-center gap-2"
              >
                <Shield className="w-4 h-4" /> Admin Panel
              </Link>
            )}
          </div>

          {/* Edit Profile Form */}
          <div className="ticket p-6 sm:p-8">
            <h2 className="font-display text-2xl text-foreground mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> PROFILE INFORMATION
            </h2>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-foreground/70 mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Your booth star name"
                    className="w-full px-4 py-2.5 bg-white/80 border border-black/10 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-xs sm:text-sm outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-foreground/70 mb-1.5">
                    Avatar Image URL
                  </label>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={e => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full px-4 py-2.5 bg-white/80 border border-black/10 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-xs sm:text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-black/10">
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={isSendingReset}
                  className="px-4 py-2.5 bg-white/80 hover:bg-white border border-black/10 text-foreground text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 hover:border-black/20 active:scale-95 disabled:opacity-50"
                >
                  <KeyRound className="w-3.5 h-3.5 text-primary" />
                  <span>{isSendingReset ? 'Sending...' : 'Reset Password'}</span>
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-md shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Profile Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Sign Out Section */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-destructive hover:text-destructive/80 transition-colors p-2"
            >
              <LogOut className="w-4 h-4" /> Sign Out of PinkSnap
            </button>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
