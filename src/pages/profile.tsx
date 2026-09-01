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

      <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 sm:py-10">
        <div className="max-w-3xl mx-auto space-y-6 pb-12">
          {/* Header Banner Ticket */}
          <div className="ticket p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-primary/10 border-4 border-white shadow-xl flex items-center justify-center text-primary font-display text-4xl overflow-hidden">
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
                    MEMBER
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
                    Profile Picture
                  </label>
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={AVATAR_ACCEPT_ATTRIBUTE}
                      onChange={handleAvatarFileChange}
                      className="w-full px-3 py-2 bg-white/80 border border-black/10 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-xs sm:text-sm outline-none transition-all file:mr-3 file:rounded-lg file:border file:border-black/10 file:bg-white file:px-2.5 file:py-1 file:text-[11px] file:font-black file:uppercase file:tracking-wide"
                    />

                    <p className="text-[11px] text-foreground/60 font-medium">
                      JPG, PNG, or WEBP up to {MAX_AVATAR_MB}MB. The image is cropped to a square and re-encoded before upload.
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        disabled={!hasAvatarToRemove || isRemovingAvatar}
                        className="px-3 py-1.5 bg-white hover:bg-black/[0.02] border border-black/10 text-foreground text-[11px] font-black uppercase tracking-wide rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        <span>{isRemovingAvatar ? 'Avatar Removed On Save' : 'Remove Avatar'}</span>
                      </button>

                      {selectedAvatarFile && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                          <Upload className="w-3.5 h-3.5" />
                          New image selected
                        </span>
                      )}
                    </div>
                  </div>
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
