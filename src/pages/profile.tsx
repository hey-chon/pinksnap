import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
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
import { downloadImage } from '@/lib/image-utils';
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
  Camera,
  Share2,
  Check,
  Grid,
  Award,
  Calendar,
  
  Download,
  X,
  Sliders,
  ExternalLink,
  PlusCircle,
  Loader2,
  Heart,
  ImageIcon,
} from 'lucide-react';

const MAX_AVATAR_MB = Math.round(AVATAR_MAX_FILE_BYTES / (1024 * 1024));

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const { user, updateProfile, signOut, resetPassword, isAdmin } = useAuth();
  const { savedMemories, deleteMemory } = useAppContext();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [activeTab, setActiveTab] = useState<'strips' | 'edit' | 'badges'>('strips');
  const [selectedMemory, setSelectedMemory] = useState<{ id: string; url: string; date: number; frame: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state if user changes
  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user?.displayName]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  if (!user) {
    return (
      <div className="flex flex-col h-dvh bg-[#faf7f9]">
        <TopNav backTo="/" title="MY PROFILE" />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="ticket p-8 text-center max-w-sm w-full bg-white shadow-xl rounded-3xl border border-pink-100">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <User className="w-8 h-8" />
            </div>
            <h2 className="font-hero text-2xl text-foreground mb-2">JOIN PINKSNAP</h2>
            <p className="text-foreground/70 mb-6 font-medium text-xs leading-relaxed">
              Sign in to view your social profile, customize your booth avatar, and access your saved photo strips.
            </p>
            <Link
              href="/auth"
              className="w-full py-3.5 bg-primary text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-primary/30 inline-flex items-center justify-center gap-2 hover:brightness-105 active:scale-98 transition-all"
            >
              <Sparkles className="w-4 h-4" /> Sign In / Sign Up
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
    setActiveTab('edit'); // Switch to edit tab so user can preview and save
  };

  const handleRemoveAvatar = () => {
    resetAvatarSelection();
    setIsRemovingAvatar(true);
  };

  const handleShareProfile = async () => {
    const profileUrl = window.location.href;
    const shareData = {
      title: `${user.displayName}'s PinkSnap Profile`,
      text: `Check out ${user.displayName}'s photo booth profile on PinkSnap! ✨`,
      url: profileUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(profileUrl);
      toast({
        title: 'Profile Link Copied!',
        description: 'Share this link with friends to show off your booth style ✨',
      });
    } catch {
      toast({
        title: 'Share Profile',
        description: profileUrl,
      });
    }
  };

  const handleDownloadMemory = async (url: string, date: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await downloadImage(url, `pinksnap-${date}.png`);
      toast({
        title: 'Downloading...',
        description: 'Your photo strip is downloading.',
      });
    } catch {
      toast({
        title: 'Download unavailable',
        description: 'Please try again on this device.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteMemory = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (confirm('Are you sure you want to delete this photo strip?')) {
      deleteMemory(id);
      if (selectedMemory?.id === id) setSelectedMemory(null);
      toast({
        title: 'Memory Deleted',
        description: 'Photo strip removed from your profile.',
      });
    }
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
          title: 'Profile Saved ✨',
          description: selectedAvatarFile || isRemovingAvatar
            ? 'Your profile picture and details were updated.'
            : 'Your changes have been saved.',
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
  const userHandle = (user.displayName || 'star').toLowerCase().replace(/[^a-z0-9_]/g, '');
  const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : 'Member';

  return (
    <div className="flex flex-col h-dvh bg-[#faf7f9]">
      {/* ── Fullscreen Lightbox Modal for Photo Strips ── */}
      {selectedMemory && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setSelectedMemory(null)}
        >
          <div className="w-full max-w-4xl flex items-center justify-between text-white z-10 pt-2 sm:pt-4">
            <div className="flex items-center gap-2">
              <span className="font-hero text-lg sm:text-xl tracking-wider text-primary">PINKSNAP</span>
              <span className="text-white/40 text-xs">·</span>
              <span className="text-xs text-white/70 font-mono">
                {new Date(selectedMemory.date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => handleDownloadMemory(selectedMemory.url, selectedMemory.date, e)}
                className="p-2 sm:px-3 sm:py-2 bg-white/10 hover:bg-white/20 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors border border-white/20"
                aria-label="Download strip"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Save</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedMemory(null)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors border border-white/20"
                aria-label="Close preview"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          <div
            className="flex-1 flex flex-col items-center justify-center py-4 w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedMemory.url}
              alt="Photo strip preview"
              className="max-h-[70dvh] sm:max-h-[78dvh] w-auto object-contain drop-shadow-[0_25px_60px_rgba(245,61,137,0.35)] rounded-2xl select-none animate-in zoom-in-95 duration-200"
            />
          </div>

          <div className="w-full max-w-xs pb-3 flex justify-center gap-3">
            <button
              type="button"
              onClick={(e) => handleDeleteMemory(selectedMemory.id, e)}
              className="text-xs text-destructive/80 hover:text-destructive flex items-center gap-1.5 transition-colors py-1.5 px-3 rounded-lg hover:bg-white/5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Strip
            </button>
          </div>
        </div>
      )}

      <TopNav backTo="/" title="MY PROFILE" />

      <main className="flex-1 overflow-y-auto scrollbar-hide pb-12">
        {/* ── Modern Social Media Cover Banner ── */}
        <div className="relative h-36 sm:h-48 md:h-56 bg-gradient-to-tr from-pink-600 via-primary to-rose-400 overflow-hidden shadow-inner">
          {/* Decorative Pattern & Ambient Glow */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: 'radial-gradient(circle at 25px 25px, white 2%, transparent 0%), radial-gradient(circle at 75px 75px, white 2%, transparent 0%)',
              backgroundSize: '100px 100px',
            }}
          />
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-900/30 rounded-full blur-2xl pointer-events-none" />

          {/* Social Booth Banner Watermark / Badge */}
          <div className="absolute top-3.5 right-3.5 sm:top-5 sm:right-6 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/25 backdrop-blur-md border border-white/20 text-white text-[10px] sm:text-xs font-bold tracking-wide">
            <Sparkles className="w-3 h-3 text-pink-200" />
            <span>Booth Star Profile</span>
          </div>
        </div>

        {/* ── Main Profile Container ── */}
        <div className="max-w-3xl mx-auto px-3.5 sm:px-6">
          {/* ── Social Profile Card (Completely Solves Mobile Overlap) ── */}
          <div className="relative -mt-14 sm:-mt-16 mb-5 bg-white rounded-3xl shadow-[0_12px_45px_-12px_rgba(245,61,137,0.18)] border border-pink-100/90 p-4 sm:p-7">
            
            {/* ROW 1: Avatar + Action Buttons (Twitter / Instagram Header Row) */}
            <div className="flex items-end justify-between gap-3 relative">
              {/* Profile Avatar with dedicated upload trigger */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Click to change profile photo"
                  className="group relative block rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 active:scale-95 transition-transform"
                >
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white border-4 border-white shadow-xl flex items-center justify-center text-primary font-display text-4xl sm:text-5xl overflow-hidden ring-4 ring-pink-500/10">
                    {shownAvatarUrl ? (
                      <img
                        src={shownAvatarUrl}
                        alt={user.displayName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      initial
                    )}
                  </div>

                  {/* Hover Camera Overlay */}
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-bold">
                    <Camera className="w-5 h-5 mb-0.5" />
                    <span>Change</span>
                  </div>

                  {/* Camera icon badge at bottom-right of avatar */}
                  <div className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-white shadow-md border-2 border-white group-hover:scale-110 transition-transform">
                    <Camera className="w-3.5 h-3.5" />
                  </div>
                </button>

                {isAdmin && (
                  <div
                    title="Verified Administrator"
                    className="absolute -top-1 -right-1 p-1.5 rounded-full bg-purple-600 text-white shadow-md border-2 border-white"
                  >
                    <Shield className="w-3 h-3" />
                  </div>
                )}
              </div>

              {/* Action Buttons: Positioned cleanly opposite the avatar */}
              <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2.5 pb-1 sm:pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('edit')}
                  data-testid="button-edit-profile-tab"
                  className={`px-3.5 sm:px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95 ${
                    activeTab === 'edit'
                      ? 'bg-primary text-white shadow-md shadow-primary/25'
                      : 'bg-foreground/[0.04] hover:bg-foreground/[0.08] text-foreground/80 border border-black/[0.08]'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareProfile}
                  data-testid="button-share-profile"
                  className="p-2 sm:px-3 sm:py-2 rounded-full bg-foreground/[0.04] hover:bg-foreground/[0.08] text-foreground/80 border border-black/[0.08] text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95"
                  title="Share profile"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Share</span>
                </button>

                {isAdmin && (
                  <Link
                    href="/admin"
                    className="px-3 sm:px-3.5 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                )}
              </div>
            </div>

            {/* ROW 2: Name & Identity (Dedicated Block — GUARANTEED NEVER OVERLAPPED BY AVATAR) */}
            <div className="mt-4 sm:mt-5 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-hero text-2xl sm:text-3xl text-foreground tracking-tight leading-tight break-words">
                  {user.displayName}
                </h1>
                
                {/* Verified Pink Checkmark */}
                <span
                  title="Verified Booth Star"
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white shadow-sm shrink-0"
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>

                {/* Role Badge */}
                <span
                  className={`shrink-0 px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${
                    isAdmin
                      ? 'bg-purple-100 text-purple-700 border border-purple-200'
                      : 'bg-primary/10 text-primary border border-primary/20'
                  }`}
                >
                  {isAdmin ? 'ADMIN' : 'VIP STAR'}
                </span>
              </div>

              {/* Username Handle & Metadata */}
              <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-foreground/55 font-medium">
                <span className="font-bold text-foreground/75">@{userHandle}</span>
                <span className="flex items-center gap-1 truncate max-w-full">
                  <Mail className="w-3 h-3 text-primary/70 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </span>
                <span className="flex items-center gap-1 shrink-0">
                  <Calendar className="w-3 h-3 text-primary/70 shrink-0" />
                  <span>Joined {joinedDate}</span>
                </span>
              </div>

              {/* Bio / Tagline */}
              <p className="text-xs sm:text-sm text-foreground/75 font-medium leading-relaxed pt-1">
                📸 Snapping aesthetic 4-cut memories & classic photo strips on PinkSnap ✨
              </p>
            </div>

            {/* ROW 3: Social Media Stats Counters (Instagram / TikTok Style) */}
            <div className="mt-5 pt-4 border-t border-black/[0.06] grid grid-cols-3 gap-2 text-center">
              <button
                type="button"
                onClick={() => setActiveTab('strips')}
                className="p-2 rounded-2xl hover:bg-foreground/[0.02] transition-colors group cursor-pointer"
              >
                <p className="text-lg sm:text-2xl font-black text-foreground group-hover:text-primary transition-colors leading-none">
                  {savedMemories.length}
                </p>
                <p className="text-[9px] sm:text-[10px] font-bold text-foreground/50 uppercase tracking-wider mt-1">
                  Photo Strips
                </p>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('badges')}
                className="p-2 rounded-2xl hover:bg-foreground/[0.02] transition-colors group cursor-pointer"
              >
                <p className="text-lg sm:text-2xl font-black text-foreground group-hover:text-primary transition-colors leading-none">
                  {isAdmin ? 'Creator+' : 'VIP Star'}
                </p>
                <p className="text-[9px] sm:text-[10px] font-bold text-foreground/50 uppercase tracking-wider mt-1">
                  Booth Tier
                </p>
              </button>

              <div className="p-2 rounded-2xl">
                <p className="text-lg sm:text-2xl font-black text-emerald-600 leading-none">
                  Active
                </p>
                <p className="text-[9px] sm:text-[10px] font-bold text-foreground/50 uppercase tracking-wider mt-1">
                  Community
                </p>
              </div>
            </div>
          </div>

          {/* ── Social Profile Feed Tabs ── */}
          <div className="flex items-center justify-center p-1 bg-white rounded-2xl border border-pink-100 shadow-sm mb-5 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('strips')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                activeTab === 'strips'
                  ? 'bg-primary text-white shadow-md shadow-primary/25'
                  : 'text-foreground/60 hover:text-foreground hover:bg-foreground/[0.03]'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>My Strips ({savedMemories.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                activeTab === 'edit'
                  ? 'bg-primary text-white shadow-md shadow-primary/25'
                  : 'text-foreground/60 hover:text-foreground hover:bg-foreground/[0.03]'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('badges')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                activeTab === 'badges'
                  ? 'bg-primary text-white shadow-md shadow-primary/25'
                  : 'text-foreground/60 hover:text-foreground hover:bg-foreground/[0.03]'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Badges</span>
            </button>
          </div>

          {/* ── TAB 1: Photo Strips Feed ── */}
          {activeTab === 'strips' && (
            <div>
              {savedMemories.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-pink-100 shadow-sm">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-pink-50 flex items-center justify-center text-primary border border-pink-100 shadow-inner">
                    <ImageIcon className="w-10 h-10 stroke-[1.5]" />
                  </div>
                  <h3 className="font-hero text-2xl text-foreground mb-2">NO PHOTO STRIPS YET</h3>
                  <p className="text-foreground/65 text-xs sm:text-sm max-w-sm mx-auto mb-6 leading-relaxed">
                    Step into the photobooth to capture your first memory! Your saved prints will appear on your profile feed.
                  </p>
                  <Link
                    href="/loading"
                    className="px-6 py-3.5 bg-primary text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-primary/30 inline-flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Camera className="w-4 h-4" /> Start Snapping
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {savedMemories.map((memory) => (
                    <div
                      key={memory.id}
                      onClick={() => setSelectedMemory({ id: memory.id, url: memory.url, date: memory.date, frame: memory.frame })}
                      className="group relative bg-white rounded-2xl p-2.5 sm:p-3 border border-pink-100/90 shadow-sm hover:shadow-xl hover:border-primary/40 transition-all cursor-pointer flex flex-col justify-between"
                    >
                      {/* Photo Thumbnail */}
                      <div className="aspect-[3/4] w-full rounded-xl overflow-hidden bg-black/5 relative flex items-center justify-center mb-2.5">
                        <img
                          src={memory.url}
                          alt="Saved photo strip"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 select-none"
                          loading="lazy"
                        />
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
                          <span className="p-2 rounded-full bg-white/20 backdrop-blur-md">
                            <Sparkles className="w-4 h-4 text-white" />
                          </span>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="flex items-center justify-between gap-1 text-[10px] text-foreground/60 font-semibold px-1">
                        <span className="truncate">{new Date(memory.date).toLocaleDateString()}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleDownloadMemory(memory.url, memory.date, e)}
                            className="p-1 rounded-md hover:bg-foreground/[0.06] text-foreground/50 hover:text-primary transition-colors"
                            title="Download strip"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteMemory(memory.id, e)}
                            className="p-1 rounded-md hover:bg-destructive/10 text-foreground/50 hover:text-destructive transition-colors"
                            title="Delete strip"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 2: Edit Profile ── */}
          {activeTab === 'edit' && (
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-pink-100 shadow-[0_10px_35px_-10px_rgba(245,61,137,0.12)]">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-black uppercase tracking-wider text-foreground">Profile Settings</h2>
                  <p className="text-[11px] text-foreground/50 font-medium">Update your public name and profile picture</p>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                {/* Profile Picture Uploader with Live Preview */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-foreground/60 mb-2">
                    Profile Picture
                  </label>
                  <div className="p-4 rounded-2xl border-2 border-dashed border-pink-200 bg-pink-50/30 flex flex-col sm:flex-row items-center gap-4">
                    {/* Live Preview circle */}
                    <div className="w-20 h-20 rounded-full border-2 border-white shadow-md bg-white overflow-hidden shrink-0 flex items-center justify-center text-primary font-display text-3xl ring-2 ring-primary/20">
                      {shownAvatarUrl ? (
                        <img
                          src={shownAvatarUrl}
                          alt="Avatar preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        initial
                      )}
                    </div>

                    <div className="flex-1 text-center sm:text-left space-y-2">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-wider shadow-sm hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" /> Choose Photo
                        </button>

                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          disabled={!hasAvatarToRemove || isRemovingAvatar}
                          className="px-3 py-2 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {isRemovingAvatar ? 'Removed' : 'Remove'}
                        </button>
                      </div>

                      <p className="text-[11px] text-foreground/45 font-medium">
                        JPG, PNG, or WEBP up to {MAX_AVATAR_MB}MB. Auto-cropped to square.
                      </p>

                      {selectedAvatarFile && (
                        <p className="text-xs text-emerald-600 font-bold flex items-center justify-center sm:justify-start gap-1">
                          <Check className="w-3.5 h-3.5" /> New image selected: {selectedAvatarFile.name}
                        </p>
                      )}
                    </div>

                    {/* Hidden Native File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={AVATAR_ACCEPT_ATTRIBUTE}
                      onChange={handleAvatarFileChange}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Display Name Input */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-foreground/60 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your booth star name"
                    className="w-full px-4 py-3 bg-foreground/[0.02] border border-black/[0.08] focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl text-sm font-semibold outline-none transition-all placeholder:text-foreground/30"
                  />
                  <p className="text-[11px] text-foreground/45 mt-1.5 font-medium">
                    This name appears on your profile and public chat.
                  </p>
                </div>

                {/* Email (Read-Only) */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-foreground/60 mb-2">
                    Account Email
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-4 py-3 bg-foreground/[0.03] border border-black/[0.06] rounded-2xl text-sm font-mono text-foreground/50 cursor-not-allowed"
                  />
                </div>

                {/* Password Reset Section */}
                <div className="pt-2">
                  <div className="p-4 rounded-2xl bg-foreground/[0.02] border border-black/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-foreground/80">Security & Password</p>
                      <p className="text-[11px] text-foreground/45 font-medium">Send a reset link to your email</p>
                    </div>
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      disabled={isSendingReset}
                      className="px-3.5 py-2 bg-white hover:bg-foreground/[0.04] border border-black/[0.1] text-foreground/75 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-40"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-primary" />
                      {isSendingReset ? 'Sending...' : 'Reset Password'}
                    </button>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="pt-3 border-t border-black/[0.06] flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    data-testid="button-save-profile"
                    className="w-full sm:w-auto px-6 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> Save Profile Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── TAB 3: Badges & Perks ── */}
          {activeTab === 'badges' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Badge 1 */}
                <div className="bg-white rounded-2xl p-4 border border-pink-100 shadow-sm flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white flex items-center justify-center shadow-md shadow-pink-500/20 shrink-0">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-foreground">Booth Pioneer</h4>
                      <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Unlocked</span>
                    </div>
                    <p className="text-xs text-foreground/60 font-medium mt-1 leading-relaxed">
                      Official PinkSnap member with cloud profile & photo synchronization.
                    </p>
                  </div>
                </div>

                {/* Badge 2 */}
                <div className="bg-white rounded-2xl p-4 border border-pink-100 shadow-sm flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-400 text-white flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-foreground">Memory Keeper</h4>
                      <span className="text-[9px] font-black uppercase bg-pink-100 text-primary px-2 py-0.5 rounded-full">
                        {savedMemories.length} Strips
                      </span>
                    </div>
                    <p className="text-xs text-foreground/60 font-medium mt-1 leading-relaxed">
                      Captured aesthetic snapshots and archived them in your cloud feed.
                    </p>
                  </div>
                </div>

                {/* Badge 3 */}
                <div className="bg-white rounded-2xl p-4 border border-pink-100 shadow-sm flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-rose-400 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-foreground">Custom Star</h4>
                      <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Unlocked</span>
                    </div>
                    <p className="text-xs text-foreground/60 font-medium mt-1 leading-relaxed">
                      Personalized avatar & booth handle for community chat and prints.
                    </p>
                  </div>
                </div>

                {/* Badge 4 */}
                <div className="bg-white rounded-2xl p-4 border border-pink-100 shadow-sm flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-400 to-pink-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20 shrink-0">
                    <Heart className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-foreground">VIP Access</h4>
                      <span className="text-[9px] font-black uppercase bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Active</span>
                    </div>
                    <p className="text-xs text-foreground/60 font-medium mt-1 leading-relaxed">
                      Access to artisan frame templates, live community chat & high-res downloads.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Sign Out Button ── */}
          <div className="mt-8 pt-4 text-center">
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground/40 hover:text-destructive transition-colors py-2.5 px-4 rounded-xl hover:bg-destructive/5 active:scale-95"
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
