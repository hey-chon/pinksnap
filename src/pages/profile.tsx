import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { TopNav, BottomNav } from '@/components/layout';
import { useAuth } from '@/hooks/use-auth';
import { useAppContext } from '@/lib/store';
import { useToast } from '@/hooks/use-toast.tsx';
import { supabase } from '@/lib/supabase';
import {
  AVATAR_ACCEPT_ATTRIBUTE,
  AVATAR_BUCKET,
  AVATAR_MAX_FILE_BYTES,
  buildAvatarStoragePath,
  normalizeAvatarUrl,
} from '@/lib/avatar';
import { sanitizeAvatarForUpload, validateAvatarFile } from '@/lib/avatar-upload';
import {
  User,
  Mail,
  Shield,
  Sparkles,
  KeyRound,
  LogOut,
  Save,
  Upload,
  Trash2,
} from 'lucide-react';

const MAX_AVATAR_MB = Math.round(AVATAR_MAX_FILE_BYTES / (1024 * 1024));

export default function ProfilePage() {
  const { user, updateProfile, signOut, resetPassword, isAdmin } = useAuth();
  const { savedMemories } = useAppContext();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  if (!user) {
    return (
      <div className="flex flex-col h-dvh">
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

  const storedAvatarUrl = normalizeAvatarUrl(user.avatarUrl);
  const shownAvatarUrl = isRemovingAvatar
    ? undefined
    : avatarPreviewUrl || storedAvatarUrl;
  const hasAvatarToRemove = Boolean(
    avatarPreviewUrl || storedAvatarUrl || user.avatarStoragePath
  );

  const resetAvatarSelection = () => {
    setSelectedAvatarFile(null);
    setAvatarPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return null;
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateAvatarFile(file);
    if (!validation.isValid) {
      toast({
        title: 'Invalid Image File',
        description: validation.error || 'Please choose a valid image file.',
        variant: 'destructive',
      });
      event.target.value = '';
      return;
    }

    setAvatarPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return URL.createObjectURL(file);
    });
    setSelectedAvatarFile(file);
    setIsRemovingAvatar(false);
  };

  const handleRemoveAvatar = () => {
    resetAvatarSelection();
    setIsRemovingAvatar(true);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedDisplayName = displayName.trim();
    if (!trimmedDisplayName) {
      toast({
        title: 'Display Name Required',
        description: 'Please enter a display name before saving.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    let uploadedAvatarPath: string | null = null;

    const cleanupUploadedAvatar = async () => {
      if (!uploadedAvatarPath) return;
      try {
        await supabase.storage.from(AVATAR_BUCKET).remove([uploadedAvatarPath]);
      } catch {
      } finally {
        uploadedAvatarPath = null;
      }
    };

    try {
      const updates: {
        displayName?: string;
        avatarUrl?: string | null;
        avatarStoragePath?: string | null;
      } = {
        displayName: trimmedDisplayName,
      };

      const previousAvatarPath = user.avatarStoragePath;

      if (isRemovingAvatar) {
        updates.avatarUrl = null;
        updates.avatarStoragePath = null;
      } else if (selectedAvatarFile) {
        const sanitizedAvatar = await sanitizeAvatarForUpload(selectedAvatarFile);
        const nextAvatarPath = buildAvatarStoragePath(user.id);
        uploadedAvatarPath = nextAvatarPath;

        const { error: uploadError } = await supabase.storage
          .from(AVATAR_BUCKET)
          .upload(nextAvatarPath, sanitizedAvatar, {
            upsert: false,
            cacheControl: '31536000',
            contentType: sanitizedAvatar.type,
          });

        if (uploadError) {
          throw new Error(uploadError.message || 'Failed to upload avatar image.');
        }

        const { data: publicUrlData } = supabase.storage
          .from(AVATAR_BUCKET)
          .getPublicUrl(nextAvatarPath);

        const trustedAvatarUrl = normalizeAvatarUrl(publicUrlData.publicUrl);
        if (!trustedAvatarUrl) {
          await cleanupUploadedAvatar();
          throw new Error('Uploaded avatar URL could not be verified.');
        }

        updates.avatarUrl = trustedAvatarUrl;
        updates.avatarStoragePath = nextAvatarPath;
      }

      const res = await updateProfile(updates);

      if (res.error) {
        await cleanupUploadedAvatar();
        toast({
          title: 'Update Failed',
          description: res.error,
          variant: 'destructive',
        });
      } else {
        if (isRemovingAvatar && previousAvatarPath) {
          try {
            await supabase.storage.from(AVATAR_BUCKET).remove([previousAvatarPath]);
          } catch {
          }
        }

        if (selectedAvatarFile && previousAvatarPath && updates.avatarStoragePath && previousAvatarPath !== updates.avatarStoragePath) {
          try {
            await supabase.storage.from(AVATAR_BUCKET).remove([previousAvatarPath]);
          } catch {
          }
        }

        resetAvatarSelection();
        setIsRemovingAvatar(false);

        toast({
          title: 'Profile Saved',
          description: selectedAvatarFile || isRemovingAvatar
            ? 'Your profile and avatar changes were saved securely.'
            : 'Your changes have been updated.',
        });
      }
    } catch (err: unknown) {
      await cleanupUploadedAvatar();
      const message = err instanceof Error ? err.message : 'Could not save profile changes.';
      toast({
        title: 'Update Failed',
        description: message,
        variant: 'destructive',
      });
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
    <div className="flex flex-col h-dvh">
      <TopNav backTo="/" title="MY PROFILE" />

      <main className="flex-1 overflow-y-auto scrollbar-hide">
        {/* ── Cover Banner ── */}
        <div className="relative h-28 sm:h-36 lg:h-44 bg-gradient-to-br from-primary/90 via-primary to-pink-400 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23fff\' fill-opacity=\'1\'%3E%3Cpath d=\'M20 0L0 20h8l12-12 12 12h8z\'/%3E%3C/g%3E%3C/svg%3E")', backgroundSize: '24px 24px' }} />
        </div>

        <div className="max-w-2xl mx-auto px-3 sm:px-6 pb-8 sm:pb-16">
          {/* ── Avatar + Identity Card ── */}
          <div className="relative -mt-12 sm:-mt-16 lg:-mt-20 mb-4 sm:mb-6">
            <div className="ticket p-4 sm:p-6 pt-12 sm:pt-16">
              {/* Avatar — positioned to overlap the banner */}
              <div className="absolute -top-10 sm:-top-14 left-4 sm:left-6">
                <div className="relative">
                  <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl bg-white border-[3px] border-white shadow-lg flex items-center justify-center text-primary font-display text-3xl sm:text-5xl overflow-hidden ring-1 ring-black/5">
                    {shownAvatarUrl ? (
                      <img
                        src={shownAvatarUrl}
                        alt={user.displayName}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      initial
                    )}
                  </div>
                  {isAdmin && (
                    <div className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-purple-600 text-white shadow-sm">
                      <Shield className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </div>

              {/* Name + meta */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
                <div className="min-w-0 overflow-hidden">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                    <h1 className="font-hero text-lg sm:text-2xl text-foreground truncate max-w-[200px] sm:max-w-none">
                      {user.displayName}
                    </h1>
                    <span className={`shrink-0 px-2 py-0.5 rounded-md text-[8px] sm:text-[9px] font-black uppercase tracking-wider ${isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-primary/10 text-primary'}`}>
                      {isAdmin ? 'ADMIN' : 'MEMBER'}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs font-mono text-foreground/50 flex items-center gap-1.5 truncate">
                    <Mail className="w-3 h-3 shrink-0" /> <span className="truncate">{user.email}</span>
                  </p>
                </div>

                {isAdmin && (
                  <Link
                    href="/admin"
                    className="shrink-0 self-start px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    <Shield className="w-3.5 h-3.5" /> Admin Panel
                  </Link>
                )}
              </div>

              {/* Stats row */}
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-black/[0.06] flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/8 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm sm:text-lg font-black text-foreground leading-none">{savedMemories.length}</p>
                    <p className="text-[8px] sm:text-[9px] font-bold text-foreground/45 uppercase tracking-wider">Strips Saved</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Edit Profile Section ── */}
          <div className="ticket p-4 sm:p-6 mb-4">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-foreground/[0.04] flex items-center justify-center">
                <User className="w-4 h-4 text-foreground/60" />
              </div>
              <h2 className="text-sm font-black uppercase tracking-wider text-foreground/80">Edit Profile</h2>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-5">
              {/* Display Name */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-foreground/50 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Your booth star name"
                  className="w-full px-3.5 py-2.5 bg-foreground/[0.02] border border-black/[0.08] focus:border-primary/50 focus:ring-2 focus:ring-primary/15 rounded-xl text-sm outline-none transition-all placeholder:text-foreground/30"
                />
              </div>

              {/* Avatar Upload */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-foreground/50 mb-1.5">
                  Profile Picture
                </label>
                <div className="p-3.5 rounded-xl border border-dashed border-black/[0.1] bg-foreground/[0.015] space-y-2.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={AVATAR_ACCEPT_ATTRIBUTE}
                    onChange={handleAvatarFileChange}
                    className="w-full text-xs text-foreground/70 file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-[10px] file:font-black file:uppercase file:tracking-wide file:text-primary file:cursor-pointer hover:file:bg-primary/15 transition-all"
                  />
                  <p className="text-[10px] text-foreground/40 font-medium leading-relaxed">
                    JPG, PNG, or WEBP up to {MAX_AVATAR_MB}MB. Auto-cropped to square.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      disabled={!hasAvatarToRemove || isRemovingAvatar}
                      className="px-2.5 py-1 bg-destructive/5 hover:bg-destructive/10 text-destructive text-[10px] font-bold uppercase tracking-wide rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      {isRemovingAvatar ? 'Removed on save' : 'Remove'}
                    </button>
                    {selectedAvatarFile && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                        <Upload className="w-3 h-3" /> New image selected
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions row */}
              <div className="pt-3 sm:pt-4 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-2 sm:gap-3 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={isSendingReset}
                  className="px-3.5 py-2.5 sm:py-2 bg-foreground/[0.03] hover:bg-foreground/[0.06] border border-black/[0.08] text-foreground/70 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 active:scale-[0.97] disabled:opacity-40"
                >
                  <KeyRound className="w-3.5 h-3.5 text-foreground/40" />
                  {isSendingReset ? 'Sending...' : 'Reset Password'}
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30 hover:brightness-110 active:scale-[0.97] transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                  {isSaving ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* ── Sign Out ── */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground/35 hover:text-destructive transition-colors py-2 px-3 rounded-lg"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out of PinkSnap
            </button>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
