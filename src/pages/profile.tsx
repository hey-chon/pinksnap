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
import { sanitizeAvatarForUpload, validateAvatarFile, fileToAvatarDataUrl } from '@/lib/avatar-upload';
import { downloadImage } from '@/lib/image-utils';
import {
  User,
  Mail,
  Shield,
  Crown,
  Zap,
  Sparkles,
  KeyRound,
  LogOut,
  Save,
  Upload,
  Trash2,
  Camera,
  Share2,
  Check,
  Flame,
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
  Images,
  Settings,
  Settings2,
  Lock,
  Plus,
  EyeOff,
  Eye,
} from 'lucide-react';

const MAX_AVATAR_MB = Math.round(AVATAR_MAX_FILE_BYTES / (1024 * 1024));

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const { user, updateProfile, signOut, resetPassword, isAdmin, isContributor } = useAuth();
  const { savedMemories, deleteMemory } = useAppContext();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const safeAvatarSrc = normalizeAvatarUrl(user?.avatarUrl);

  useEffect(() => {
    setAvatarLoadError(false);
  }, [user?.avatarUrl]);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [activeTab, setActiveTab] = useState<'strips' | 'edit'>('strips');
  const [selectedMemory, setSelectedMemory] = useState<{ id: string; url: string; date: number; frame: string } | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);

  // Profile wall privacy: only strips explicitly chosen by user are displayed on their wall
  const [postedStripIds, setPostedStripIds] = useState<string[]>(() => {
    if (typeof window === 'undefined' || !user?.id) return [];
    if (Array.isArray(user.wallStripIds)) return user.wallStripIds;
    try {
      const stored = localStorage.getItem(`pinksnap_wall_strips_${user.id}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cloudSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state if user changes
  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user?.displayName]);

  useEffect(() => {
    if (user?.bio !== undefined) {
      setBio(user.bio ?? '');
    }
  }, [user?.bio]);

  // Sync wall strips from user profile or localStorage
  const wallStripIdsKey = JSON.stringify(user?.wallStripIds || []);
  useEffect(() => {
    if (!user?.id || showPostModal) return;

    if (Array.isArray(user.wallStripIds)) {
      setPostedStripIds(user.wallStripIds);
      try {
        localStorage.setItem(`pinksnap_wall_strips_${user.id}`, JSON.stringify(user.wallStripIds));
      } catch {}
    } else if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`pinksnap_wall_strips_${user.id}`);
        setPostedStripIds(stored ? JSON.parse(stored) : []);
      } catch {
        setPostedStripIds([]);
      }
    }
  }, [user?.id, wallStripIdsKey, showPostModal]);

  const postedStrips = savedMemories.filter((m) => postedStripIds.includes(m.id));

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

  const handleAvatarClick = () => {
    if (user?.avatarUrl || user?.avatarStoragePath) {
      setShowAvatarMenu(true);
    } else {
      // iOS Safari: trigger file input synchronously within the user gesture
      // Using setTimeout(0) ensures the click fires in the same gesture context on iOS
      const input = fileInputRef.current;
      if (input) {
        // Reset value first so re-selecting the same file still triggers onChange
        input.value = '';
        input.click();
      }
    }
  };

  const handleDirectAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // iOS Safari: clear the file input value synchronously to allow re-selection
    // of the same photo. Use try/catch because some iOS versions throw on assignment.
    try { event.target.value = ''; } catch { /* iOS quirk - ignore */ }
    setShowAvatarMenu(false);

    const validation = validateAvatarFile(file);
    if (!validation.isValid) {
      toast({
        title: 'Invalid Image File',
        description: validation.error || 'Please choose a valid image file.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingAvatar(true);

    try {
      // 1. Generate clean, optimized base64 data-URL (instant, guaranteed to work)
      const dataUrl = await fileToAvatarDataUrl(file);

      if (typeof window !== 'undefined' && user?.id) {
        localStorage.removeItem(`pinksnap_avatar_cleared_${user.id}`);
      }

      let nextAvatarUrl = dataUrl;
      let nextAvatarPath: string | null = null;

      // 2. Attempt Supabase Storage upload in the background if bucket is available
      try {
        const sanitizedAvatar = await sanitizeAvatarForUpload(file);
        const ext = sanitizedAvatar.name.split('.').pop() || 'webp';
        const storagePath = buildAvatarStoragePath(user.id, ext);

        const { error: uploadError } = await supabase.storage
          .from(AVATAR_BUCKET)
          .upload(storagePath, sanitizedAvatar, {
            upsert: true,
            cacheControl: '31536000',
            contentType: sanitizedAvatar.type,
          });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from(AVATAR_BUCKET)
            .getPublicUrl(storagePath);
          if (publicUrlData?.publicUrl) {
            nextAvatarUrl = publicUrlData.publicUrl;
            nextAvatarPath = storagePath;
          }
        }
      } catch (storageErr) {
        console.warn('[Avatar Upload] Storage bucket upload skipped or failed, using local avatar:', storageErr);
      }

      const res = await updateProfile({
        avatarUrl: nextAvatarUrl,
        avatarStoragePath: nextAvatarPath,
      });

      if (res.error) {
        toast({
          title: 'Update Notice',
          description: res.error,
          variant: 'destructive',
        });
      } else {
        setAvatarLoadError(false);
        toast({
          title: 'Profile Picture Updated ✨',
          description: 'Your new avatar is live on your profile.',
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not process avatar.';
      toast({
        title: 'Upload Notice',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleDirectRemoveAvatar = async () => {
    // iOS Safari: close menu & clear state SYNCHRONOUSLY in the same gesture frame
    // This prevents stale state from re-rendering the old avatar before the async work completes
    setShowAvatarMenu(false);
    setIsUploadingAvatar(true);
    setAvatarLoadError(false);

    // Immediately clear all local caches so avatar disappears instantly on iOS
    if (typeof window !== 'undefined' && user?.id) {
      try {
        localStorage.removeItem(`pinksnap_user_avatar_${user.id}`);
        localStorage.setItem(`pinksnap_avatar_cleared_${user.id}`, 'true');
      } catch { /* iOS private browsing may throw */ }
    }

    // Also reset the hidden file input so iOS doesn't cache the old selection
    if (fileInputRef.current) {
      try { fileInputRef.current.value = ''; } catch { /* iOS quirk */ }
    }

    const previousAvatarPath = user?.avatarStoragePath;

    try {
      await updateProfile({
        avatarUrl: null,
        avatarStoragePath: null,
      });

      // Clean up remote storage in background (non-blocking)
      if (previousAvatarPath) {
        supabase.storage.from(AVATAR_BUCKET).remove([previousAvatarPath]).catch(() => {});
      }

      toast({
        title: 'Profile Picture Removed',
        description: 'Your avatar has been reset to default.',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to remove avatar image.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingAvatar(false);
    }
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

  const handleTogglePostToWall = (stripId: string, e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation();
    if (!user?.id) return;

    setPostedStripIds((prev) => {
      const isPosted = prev.includes(stripId);
      const next = isPosted ? prev.filter((id) => id !== stripId) : [...prev, stripId];
      try {
        localStorage.setItem(`pinksnap_wall_strips_${user.id}`, JSON.stringify(next));
      } catch {
      }

      // Debounce cloud sync so rapid clicks / taps don't conflict or overwrite
      if (cloudSyncTimeoutRef.current) {
        clearTimeout(cloudSyncTimeoutRef.current);
      }
      cloudSyncTimeoutRef.current = setTimeout(() => {
        updateProfile({ wallStripIds: next }).catch(() => {});
      }, 500);

      return next;
    });
  };

  const handleClosePostModal = () => {
    setShowPostModal(false);
    if (cloudSyncTimeoutRef.current) {
      clearTimeout(cloudSyncTimeoutRef.current);
      cloudSyncTimeoutRef.current = null;
    }
    if (user?.id) {
      updateProfile({ wallStripIds: postedStripIds }).catch(() => {});
    }
  };

  const handleDeleteMemory = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (confirm('Are you sure you want to permanently delete this photo strip?')) {
      deleteMemory(id);
      if (selectedMemory?.id === id) setSelectedMemory(null);
      if (user?.id) {
        setPostedStripIds((prev) => {
          const next = prev.filter((stripId) => stripId !== id);
          try {
            localStorage.setItem(`pinksnap_wall_strips_${user.id}`, JSON.stringify(next));
          } catch {
          }
          // Cloud sync across phone, laptop, and tablet
          updateProfile({ wallStripIds: next }).catch(() => {});
          return next;
        });
      }
      toast({
        title: 'Memory Deleted',
        description: 'Photo strip has been deleted.',
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
    try {
      const trimmedBio = bio.trim();
      const updates = {
        displayName: trimmedDisplayName,
        bio: trimmedBio,
      };

      const res = await updateProfile(updates);

      if (res.error) {
        toast({
          title: 'Update Failed',
          description: res.error,
          variant: 'destructive',
        });
      } else {
        setDisplayName(trimmedDisplayName);
        setBio(trimmedBio);

        if (typeof window !== 'undefined' && user?.id) {
          localStorage.setItem(`pinksnap_user_name_${user.id}`, trimmedDisplayName);
          if (trimmedBio) {
            localStorage.setItem(`pinksnap_user_bio_${user.id}`, trimmedBio);
          } else {
            localStorage.removeItem(`pinksnap_user_bio_${user.id}`);
          }
        }

        toast({
          title: 'Profile Saved ✨',
          description: 'Your changes have been saved.',
        });
      }
    } catch (err: unknown) {
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
  const [emailName = '', emailDomain = ''] = (user.email || '').split('@');

  return (
    <div className="flex flex-col h-dvh bg-[#fff7fa] relative overflow-hidden">
      {/* ── Cute Aesthetic Background & Floating Sparkle/Heart Doodles ── */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(245,61,137,0.12) 1.5px, transparent 1.5px), radial-gradient(circle, rgba(255,182,193,0.18) 1px, transparent 1px)',
          backgroundSize: '24px 24px, 48px 48px',
          backgroundPosition: '0 0, 12px 12px',
        }}
      />
      {/* Ambient pastel glow orbs */}
      <div className="fixed top-16 -left-20 w-80 h-80 bg-pink-300/25 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-16 -right-20 w-96 h-96 bg-rose-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34rem] h-[34rem] bg-pink-100/35 rounded-full blur-3xl pointer-events-none" />

      {/* Floating cute SVG stickers in viewport background */}
      <div className="fixed top-24 left-8 pointer-events-none select-none text-pink-300/50 hidden lg:block animate-pulse">
        <Sparkles className="w-8 h-8" />
      </div>
      <div className="fixed top-36 right-10 pointer-events-none select-none text-pink-300/50 hidden lg:block">
        <Heart className="w-7 h-7 fill-pink-200/40 stroke-pink-300/60" />
      </div>
      <div className="fixed bottom-32 left-12 pointer-events-none select-none text-pink-300/45 hidden lg:block">
        <Camera className="w-7 h-7 stroke-pink-300/55" />
      </div>
      <div className="fixed bottom-24 right-14 pointer-events-none select-none text-pink-300/50 hidden lg:block animate-pulse">
        <Sparkles className="w-9 h-9" />
      </div>

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

      <main className="flex-1 overflow-y-auto scrollbar-hide pb-12 relative z-10">
        {/* ── Modern Social Media Cover Banner ── */}
        <div className="relative h-36 sm:h-48 md:h-56 bg-gradient-to-tr from-pink-600 via-primary to-rose-400 overflow-hidden shadow-inner">
          {/* Decorative Pattern & Ambient Glow */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle at 25px 25px, white 2%, transparent 0%), radial-gradient(circle at 75px 75px, white 2%, transparent 0%)',
              backgroundSize: '100px 100px',
            }}
          />
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-900/30 rounded-full blur-2xl pointer-events-none" />
          

          {/* Big PINKSNAP Brand text with subtle soft white glow */}
          <div className="absolute inset-0 flex items-center justify-center pb-6 sm:pb-8 select-none pointer-events-none">
            <div className="relative inline-block">
              <div className="font-display text-4xl sm:text-6xl md:text-7xl font-black tracking-wider flex items-center px-3 py-1 drop-shadow-[0_0_12px_rgba(255,255,255,0.65)]">
                <span className="text-white">PINK</span>
                <span className="text-black">SNAP</span>
              </div>

              {/* Cute corner accents */}
              <Sparkles className="w-5 h-5 sm:w-7 sm:h-7 text-white/90 absolute -top-3 -left-5 sm:-top-5 sm:-left-8 pointer-events-none drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
              <Heart className="w-4 h-4 sm:w-6 sm:h-6 text-pink-200 fill-pink-200 absolute -bottom-2 -right-5 sm:-bottom-3 sm:-right-7 rotate-12 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ── Main Profile Container ── */}
        <div className="max-w-3xl mx-auto px-3.5 sm:px-6">
          {/* ── Social Profile Card (Completely Solves Mobile Overlap) ── */}
          <div className={`relative -mt-14 sm:-mt-16 mb-5 rounded-3xl p-4 sm:p-7 backdrop-blur-sm ${isAdmin ? 'bg-[#0e0f13]/[0.97] border border-orange-900/40 shadow-[0_12px_45px_-12px_rgba(255,100,0,0.12)]' : 'bg-white/95 border border-pink-100/90 shadow-[0_12px_45px_-12px_rgba(245,61,137,0.18)]'}`}>
            {/* Cute Scrapbook Washi Tape Sticker on Card */}
            <div className={`absolute -top-2.5 left-1/2 -translate-x-1/2 w-20 sm:w-24 h-4 rounded-xs rotate-[-1.5deg] border shadow-xs pointer-events-none z-20 ${isAdmin ? 'bg-gradient-to-r from-orange-800/60 via-orange-700/70 to-orange-800/60 border-orange-600/30' : 'bg-gradient-to-r from-pink-300/80 via-pink-200/95 to-pink-300/80 border-white/80'}`} />
            
            {/* ROW 1: Avatar + Action Buttons (Twitter / Instagram Header Row) */}
            <div className="flex items-end justify-between gap-3 relative">
              {/* Profile Avatar with direct click-to-change functions */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                  title="Change profile photo"
                  className="group relative block rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 active:scale-95 transition-transform cursor-pointer"
                  style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                >
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white border-4 border-white shadow-xl flex items-center justify-center text-primary font-display text-4xl sm:text-5xl overflow-hidden ring-4 ring-pink-500/10">
                    {safeAvatarSrc && !avatarLoadError ? (
                      <img
                        key={user.avatarUrl}
                        src={safeAvatarSrc}
                        alt={user.displayName}
                        onError={() => setAvatarLoadError(true)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      initial
                    )}
                  </div>

                  {/* Loading spinner overlay when uploading */}
                  {isUploadingAvatar ? (
                    <div className="absolute inset-0 rounded-full bg-black/60 flex flex-col items-center justify-center text-white text-[9px] font-bold z-10">
                      <Loader2 className="w-6 h-6 animate-spin text-primary mb-0.5" />
                      <span>Saving...</span>
                    </div>
                  ) : (
                    <>
                      {/* Hover Camera Overlay */}
                      <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-bold">
                        <Camera className="w-5 h-5 mb-0.5" />
                        <span>Change</span>
                      </div>

                      {/* Camera icon badge at bottom-right of avatar */}
                      <div className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-white shadow-md border-2 border-white group-hover:scale-110 transition-transform">
                        <Camera className="w-3.5 h-3.5" />
                      </div>
                    </>
                  )}
                </button>

                {isAdmin && (
                  <div
                    title="Verified Creator"
                    className="absolute -top-1 -right-1 p-1.5 rounded-full bg-purple-600 text-white shadow-md border-2 border-white"
                  >
                    <Shield className="w-3 h-3" />
                  </div>
                )}
                {isContributor && !isAdmin && (
                  <div
                    title="Verified Contributor"
                    className="absolute -top-1 -right-1 p-1.5 rounded-full bg-amber-500 text-white shadow-md border-2 border-white"
                  >
                    <Zap className="w-3 h-3 fill-white stroke-none" />
                  </div>
                )}
              </div>

              {/* Action Buttons: Positioned cleanly opposite the avatar */}
              <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2.5 pb-1 sm:pb-2">
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
              </div>
            </div>

            {/* ROW 2: Name & Identity (Dedicated Block — GUARANTEED NEVER OVERLAPPED BY AVATAR) */}
            <div className="mt-4 sm:mt-5 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className={`font-hero text-2xl sm:text-3xl tracking-tight leading-tight break-words ${isAdmin ? 'text-white' : 'text-foreground'}`}>
                  {user.displayName}
                </h1>
                
                {/* Verified Checkmark (Shown for Admin and Contributor) */}
                {isAdmin && (
                  <span
                    title="Verified Creator"
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-600 text-white shadow-sm shrink-0"
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
                {isContributor && (
                  <span
                    title="Verified Contributor"
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white shadow-sm shrink-0"
                  >
                    <Zap className="w-3 h-3 fill-white stroke-none" />
                  </span>
                )}

                {/* Role Badge — CREATOR+ glows with an animated flame */}
                <span
                  className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider border ${
                    isAdmin
                      ? 'creator-plus-badge text-white border-transparent bg-black/40'
                      : isContributor
                      ? 'bg-amber-100 text-amber-900 border border-amber-300/80 shadow-xs'
                      : 'bg-primary/10 text-primary border border-primary/20'
                  }`}
                >
                  {isAdmin ? (
                    <>
                      <Flame className="creator-flame w-3 h-3 stroke-[2.5] fill-none text-orange-500" aria-hidden="true" />
                      <span>CREATOR</span>
                    </>
                  ) : isContributor ? (
                    <>
                      <Zap className="w-3 h-3 fill-current stroke-none" aria-hidden="true" />
                      <span>CONTRIBUTOR</span>
                    </>
                  ) : (
                    'MEMBER+'
                  )}
                </span>
              </div>

              {/* Metadata without the username handle — 100% untouchable & unclickable on iOS/Android */}
              <div
                className={`flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs font-medium select-none pointer-events-none ${isAdmin ? 'text-white/45' : 'text-foreground/55'}`}
                style={{
                  pointerEvents: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none',
                  touchAction: 'none',
                }}
              >
                <span
                  className="flex items-center gap-1 truncate max-w-full select-none pointer-events-none cursor-default"
                  style={{
                    pointerEvents: 'none',
                    WebkitUserSelect: 'none',
                    userSelect: 'none',
                    touchAction: 'none',
                  }}
                  aria-label="Account email"
                >
                  <Mail className="w-3 h-3 text-primary/70 shrink-0 select-none pointer-events-none" />
                  <span
                    className={`truncate select-none pointer-events-none cursor-default no-underline font-medium inline-flex items-center ${isAdmin ? 'text-white/45' : 'text-foreground/55'}`}
                    style={{
                      pointerEvents: 'none',
                      WebkitUserSelect: 'none',
                      userSelect: 'none',
                      touchAction: 'none',
                      textDecoration: 'none',
                    }}
                  >
                    <span>{emailName}</span>
                    <span aria-hidden="true" style={{ display: 'none' }}>__</span>
                    <span aria-hidden="true">@</span>
                    <span aria-hidden="true" style={{ display: 'none' }}>__</span>
                    <span>{emailDomain}</span>
                  </span>
                </span>
                <span
                  className="flex items-center gap-1 shrink-0 select-none pointer-events-none cursor-default"
                  style={{
                    pointerEvents: 'none',
                    WebkitUserSelect: 'none',
                    userSelect: 'none',
                  }}
                >
                  <Calendar className="w-3 h-3 text-primary/70 shrink-0" />
                  <span>Joined {joinedDate}</span>
                </span>
              </div>

              {/* Custom User Bio */}
              {bio ? (
                <p className={`text-xs sm:text-sm font-medium leading-relaxed pt-1 whitespace-pre-wrap break-words ${isAdmin ? 'text-white/65' : 'text-foreground/80'}`}>
                  {bio}
                </p>
              ) : (
                <p className={`text-xs italic font-medium pt-1 ${isAdmin ? 'text-white/30' : 'text-foreground/40'}`}>
                  No bio yet. Tap &ldquo;Settings&rdquo; to add your bio!
                </p>
              )}
            </div>

            {/* ROW 3: Social Media Stats Counters — Customized By Role */}
            <div className={`mt-5 pt-4 border-t grid grid-cols-3 gap-2 text-center ${isAdmin ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
              {isAdmin ? (
                /* ── CREATOR ROLE: Clean, refined dark card with subtle accent ── */
                <>
                  <button
                    type="button"
                    onClick={() => setActiveTab('strips')}
                    className="p-2 sm:p-3 rounded-2xl creator-role-card flex flex-col items-center justify-center transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-1">
                      <p className="text-sm sm:text-base font-black text-orange-400 group-hover:text-orange-300 transition-colors leading-none">
                        {postedStrips.length}
                      </p>
                      <Flame className="w-3 h-3 text-orange-400/70 fill-none" aria-hidden="true" />
                    </div>
                    <p className="text-[9px] sm:text-[10px] font-bold text-white/50 uppercase tracking-wider mt-1">
                      Photo Strips
                    </p>
                  </button>

                  <div className="p-2 sm:p-3 rounded-2xl creator-role-card flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1">
                      <p className="text-sm sm:text-base font-black text-orange-400 leading-none">
                        Creator+
                      </p>
                    </div>
                    <p className="text-[9px] sm:text-[10px] font-bold text-white/50 uppercase tracking-wider mt-1">
                      Booth Role
                    </p>
                  </div>

                  <div className="p-2 sm:p-3 rounded-2xl creator-role-card flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1">
                      <p className="text-sm sm:text-base font-black text-orange-400 leading-none">
                        Activated
                      </p>
                    </div>
                    <p className="text-[9px] sm:text-[10px] font-bold text-white/50 uppercase tracking-wider mt-1">
                      Community
                    </p>
                  </div>
                </>
              ) : isContributor ? (
                /* ── CONTRIBUTOR ROLE: Basic clean amber look ── */
                <>
                  <button
                    type="button"
                    onClick={() => setActiveTab('strips')}
                    className="p-2 sm:p-3 rounded-2xl bg-amber-50/50 hover:bg-amber-100/60 border border-amber-200/70 transition-colors group cursor-pointer flex flex-col items-center justify-center"
                  >
                    <p className="text-sm sm:text-base font-black text-foreground group-hover:text-amber-700 transition-colors leading-none">
                      {postedStrips.length}
                    </p>
                    <p className="text-[9px] sm:text-[10px] font-bold text-foreground/50 uppercase tracking-wider mt-1">
                      Photo Strips
                    </p>
                  </button>

                  <div className="p-2 sm:p-3 rounded-2xl bg-amber-50/50 border border-amber-200/70 flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1">
                      <p className="text-sm sm:text-base font-black text-amber-700 leading-none">
                        Contributor+
                      </p>
                      <Zap className="w-3 h-3 fill-amber-500 text-amber-500" aria-hidden="true" />
                    </div>
                    <p className="text-[9px] sm:text-[10px] font-bold text-foreground/50 uppercase tracking-wider mt-1">
                      Booth Role
                    </p>
                  </div>

                  <div className="p-2 sm:p-3 rounded-2xl bg-amber-50/50 border border-amber-200/70 flex flex-col items-center justify-center">
                    <p className="text-sm sm:text-base font-black text-amber-600 leading-none">
                      Active
                    </p>
                    <p className="text-[9px] sm:text-[10px] font-bold text-foreground/50 uppercase tracking-wider mt-1">
                      Community
                    </p>
                  </div>
                </>
              ) : (
                /* ── MEMBER ROLE: Basic clean pastel pink look ── */
                <>
                  <button
                    type="button"
                    onClick={() => setActiveTab('strips')}
                    className="p-2 sm:p-3 rounded-2xl bg-pink-50/40 hover:bg-pink-100/50 border border-pink-100/60 transition-colors group cursor-pointer flex flex-col items-center justify-center"
                  >
                    <p className="text-sm sm:text-base font-black text-foreground group-hover:text-primary transition-colors leading-none">
                      {postedStrips.length}
                    </p>
                    <p className="text-[9px] sm:text-[10px] font-bold text-foreground/50 uppercase tracking-wider mt-1">
                      Photo Strips
                    </p>
                  </button>

                  <div className="p-2 sm:p-3 rounded-2xl bg-pink-50/40 border border-pink-100/60 flex flex-col items-center justify-center">
                    <p className="text-sm sm:text-base font-black text-foreground leading-none">
                      Member+
                    </p>
                    <p className="text-[9px] sm:text-[10px] font-bold text-foreground/50 uppercase tracking-wider mt-1">
                      Booth Role
                    </p>
                  </div>

                  <div className="p-2 sm:p-3 rounded-2xl bg-pink-50/40 border border-pink-100/60 flex flex-col items-center justify-center">
                    <p className="text-sm sm:text-base font-black text-pink-600 leading-none">
                      Active
                    </p>
                    <p className="text-[9px] sm:text-[10px] font-bold text-foreground/50 uppercase tracking-wider mt-1">
                      Community
                    </p>
                  </div>
                </>
              )}
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
              <span>Strips ({postedStrips.length})</span>
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
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPostModal(true)}
              className="flex-1 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all text-foreground/60 hover:text-foreground hover:bg-foreground/[0.03] cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post</span>
            </button>
          </div>

          {/* ── TAB 1: Profile Wall ── */}
          {activeTab === 'strips' && (
            <div>
              {postedStrips.length === 0 ? (
                /* Empty Wall State */
                <div className="bg-white rounded-3xl p-5 sm:p-10 text-center border border-pink-100 shadow-[0_10px_30px_-15px_rgba(245,61,137,0.12)]">
                  <div className="w-14 h-14 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-pink-100 to-pink-50 flex items-center justify-center text-primary border border-pink-200/60 shadow-sm">
                    <Images className="w-7 h-7 sm:w-10 sm:h-10 stroke-[1.75]" />
                  </div>
                  <h3 className="font-hero text-xl sm:text-2xl text-foreground mb-1.5 sm:mb-2">PROFILE WALL</h3>
                  <p className="text-foreground/60 text-xs sm:text-sm max-w-sm mx-auto mb-5 sm:mb-6 leading-relaxed">
                    Strips in your gallery are private by default. Pick your favorite snapshots to showcase here on your public wall.
                  </p>
                </div>
              ) : (
                /* Wall Strips Grid */
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {postedStrips.map((memory) => (
                    <div
                      key={memory.id}
                      onClick={() => setSelectedMemory({ id: memory.id, url: memory.url, date: memory.date, frame: memory.frame })}
                      className="group relative bg-white rounded-2xl p-2.5 sm:p-3 border border-pink-100/90 shadow-sm hover:shadow-xl hover:border-primary/40 transition-all cursor-pointer flex flex-col justify-between"
                    >
                      {/* Cute Scrapbook Polaroid Tape */}
                      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 sm:w-10 h-2 sm:h-2.5 bg-gradient-to-r from-pink-300/80 via-pink-200/90 to-rose-300/80 rounded-xs rotate-[-2deg] border border-white/70 shadow-xs pointer-events-none z-10" />

                      {/* Photo Thumbnail */}
                      <div className="aspect-[3/4] w-full rounded-xl overflow-hidden bg-black/5 relative flex items-center justify-center mb-2.5">
                        <img
                          src={memory.url}
                          alt="Wall photo strip"
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
                            onClick={(e) => handleTogglePostToWall(memory.id, e)}
                            className="p-1 rounded-md hover:bg-foreground/[0.06] text-foreground/50 hover:text-amber-600 transition-colors"
                            aria-label="Hide from wall"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDownloadMemory(memory.url, memory.date, e)}
                            className="p-1 rounded-md hover:bg-foreground/[0.06] text-foreground/50 hover:text-primary transition-colors"
                            aria-label="Download strip"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteMemory(memory.id, e)}
                            className="p-1 rounded-md hover:bg-destructive/10 text-foreground/50 hover:text-destructive transition-colors"
                            aria-label="Delete permanently"
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
                  <p className="text-[11px] text-foreground/50 font-medium">Update your public name and bio</p>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                {/* Profile Photo Section */}
                <div className="p-4 rounded-2xl bg-foreground/[0.02] border border-black/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white border-2 border-pink-200 shadow-sm flex items-center justify-center text-primary font-display text-2xl overflow-hidden shrink-0">
                      {safeAvatarSrc && !avatarLoadError ? (
                        <img
                          src={safeAvatarSrc}
                          alt={user.displayName}
                          onError={() => setAvatarLoadError(true)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        initial
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-foreground/80">Profile Photo</p>
                      <p className="text-[11px] text-foreground/45 font-medium">JPG, PNG, WEBP, or HEIC up to {MAX_AVATAR_MB}MB</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="px-3.5 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{isUploadingAvatar ? 'Saving...' : 'Change Photo'}</span>
                      <input
                        type="file"
                        accept={AVATAR_ACCEPT_ATTRIBUTE}
                        onChange={handleDirectAvatarUpload}
                        disabled={isUploadingAvatar}
                        className="sr-only"
                      />
                    </label>

                    {(user.avatarUrl || user.avatarStoragePath) && (
                      <button
                        type="button"
                        onClick={handleDirectRemoveAvatar}
                        disabled={isUploadingAvatar}
                        className="px-3 py-2 text-foreground/60 hover:text-destructive hover:bg-destructive/10 border border-black/[0.06] rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                        title="Remove profile photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
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
                    enterKeyHint="done"
                    autoComplete="name"
                    autoCorrect="off"
                    className="w-full px-4 py-3 bg-foreground/[0.02] border border-black/[0.08] focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl text-sm font-semibold outline-none transition-all placeholder:text-foreground/30"
                    style={{ fontSize: '16px' }}
                  />
                  <p className="text-[11px] text-foreground/45 mt-1.5 font-medium">
                    This name appears on your profile and public chat.
                  </p>
                </div>

                {/* Custom User Bio Input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-foreground/60">
                      Bio
                    </label>
                    <span className="text-[10px] font-bold text-foreground/40">
                      {bio.length}/160
                    </span>
                  </div>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 160))}
                    placeholder="Write something about yourself, your booth style, favorite memories..."
                    rows={3}
                    enterKeyHint="done"
                    autoCorrect="on"
                    className="w-full px-4 py-3 bg-foreground/[0.02] border border-black/[0.08] focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl text-sm font-medium outline-none transition-all placeholder:text-foreground/30 resize-none"
                    style={{ fontSize: '16px' }}
                  />
                  <p className="text-[11px] text-foreground/45 mt-1.5 font-medium">
                    Share a personal description on your social profile. Visible to the community.
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
                        <Save className="w-4 h-4" /> Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          
        </div>
      </main>

      {/* ── Avatar Action Modal (Clean, Minimal, Non-Pink UI) ── */}
      {showAvatarMenu && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowAvatarMenu(false)}
        >
          <div
            className="bg-white rounded-2xl p-5 max-w-[280px] sm:max-w-xs w-full shadow-xl border border-neutral-200/90 space-y-3 animate-in zoom-in-95 duration-150 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pt-1 pb-1">
              <h3 className="text-sm font-bold tracking-tight text-neutral-900 uppercase">
                Profile Photo
              </h3>
              <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
                JPG, PNG, or HEIC up to {MAX_AVATAR_MB}MB
              </p>
            </div>

            <div className="space-y-2 pt-1">
              {/* iOS Safari: <label> wrapping <input type=file> is the most reliable way
                  to trigger the Photo Library / Camera sheet. Never use programmatic .click() here. */}
              <label
                className="relative w-full py-2.5 px-3.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer select-none overflow-hidden"
                style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '44px' }}
              >
                <Upload className="w-3.5 h-3.5 text-neutral-300 pointer-events-none" />
                <span className="pointer-events-none">Choose from Library</span>
                <input
                  type="file"
                  accept={AVATAR_ACCEPT_ATTRIBUTE}
                  capture={undefined}
                  onChange={handleDirectAvatarUpload}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10 block"
                  style={{ fontSize: '16px' }}
                  title="Choose profile photo"
                />
              </label>

              {(user.avatarUrl || user.avatarStoragePath) && (
                <button
                  type="button"
                  onClick={handleDirectRemoveAvatar}
                  className="w-full py-2.5 px-3.5 rounded-xl border border-neutral-200 text-neutral-700 hover:text-red-600 hover:border-red-200 hover:bg-red-50/40 text-xs font-semibold flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
                  style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '44px' }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Photo</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowAvatarMenu(false)}
                className="w-full py-2 rounded-xl text-neutral-400 hover:text-neutral-700 text-xs font-medium transition-colors cursor-pointer"
                style={{ touchAction: 'manipulation', minHeight: '44px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Post to Wall Modal (Select strips from private gallery) ── */}
      {showPostModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-150 p-0 sm:p-4"
          onClick={handleClosePostModal}
        >
          <div
            className="bg-white w-full max-w-lg h-[82dvh] sm:h-auto sm:max-h-[85dvh] rounded-t-[28px] sm:rounded-3xl shadow-2xl border border-pink-100 flex flex-col animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Sheet Drag Indicator */}
            <div className="w-12 h-1.5 rounded-full bg-foreground/15 mx-auto mt-3 sm:hidden" />

            {/* Modal Header */}
            <div className="flex items-center justify-between px-3.5 sm:px-5 pt-2.5 sm:pt-4 pb-2.5 sm:pb-3.5 border-b border-pink-100 shrink-0">
              <div>
                <h3 className="font-hero text-base sm:text-xl text-foreground tracking-tight">CHOOSE STRIPS TO POST</h3>
                <p className="text-[10px] sm:text-xs text-foreground/50 font-medium">
                  Tap any photo strip to toggle it on or off your wall
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClosePostModal}
                  className="px-3.5 py-1.5 rounded-full bg-primary text-white text-xs font-black uppercase tracking-wider hover:brightness-105 active:scale-95 shadow-sm shadow-primary/25 cursor-pointer sm:hidden"
                >
                  Done
                </button>
                <button
                  type="button"
                  onClick={handleClosePostModal}
                  className="w-7 h-7 rounded-full bg-foreground/[0.04] hover:bg-foreground/[0.08] active:scale-90 text-foreground/60 flex items-center justify-center transition-all cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Modal Body — Gallery strip grid */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-4 overscroll-contain">
              {savedMemories.length === 0 ? (
                <div className="text-center py-10 px-3">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-pink-50 flex items-center justify-center text-primary border border-pink-100/80 shadow-sm">
                    <Camera className="w-7 h-7 stroke-[1.75]" />
                  </div>
                  <h4 className="font-hero text-base sm:text-lg text-foreground mb-1">NO STRIPS IN GALLERY</h4>
                  <p className="text-xs text-foreground/55 max-w-xs mx-auto mb-4 font-medium leading-relaxed">
                    You haven't saved any photobooth strips yet. Start snapping to build your collection!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {savedMemories.map((memory) => {
                    const isOnWall = postedStripIds.includes(memory.id);
                    return (
                      <button
                        type="button"
                        key={memory.id}
                        onClick={(e) => handleTogglePostToWall(memory.id, e)}
                        style={{ touchAction: 'manipulation' }}
                        className={`relative rounded-xl sm:rounded-2xl p-1.5 sm:p-2 select-none border-2 flex flex-col justify-between text-left cursor-pointer transition-colors active:scale-[0.98] ${
                          isOnWall
                            ? 'bg-primary/[0.06] border-primary shadow-sm'
                            : 'bg-white border-pink-100/90 shadow-xs'
                        }`}
                      >
                        {/* Thumbnail Container — No hover zoom */}
                        <div className="aspect-[3/4] w-full rounded-lg sm:rounded-xl overflow-hidden bg-black/5 relative mb-1.5 sm:mb-2 pointer-events-none">
                          <img
                            src={memory.url}
                            alt="Strip preview"
                            className="w-full h-full object-cover select-none"
                            loading="lazy"
                          />

                          {/* Selection Badge in Corner */}
                          <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2">
                            {isOnWall ? (
                              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-md shadow-primary/30">
                                <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-black/40 backdrop-blur-sm border border-white/60 text-white flex items-center justify-center">
                                <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Footer Info */}
                        <div className="flex items-center justify-between px-0.5 sm:px-1 text-[10px] sm:text-[11px] pointer-events-none">
                          <span className="font-semibold text-foreground/50 text-[9px] sm:text-[10px] truncate">
                            {new Date(memory.date).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider ${
                              isOnWall ? 'text-primary' : 'text-foreground/40'
                            }`}
                          >
                            {isOnWall ? 'Public' : 'Private'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-t border-pink-100 bg-white/95 backdrop-blur-xs flex items-center justify-between gap-3 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <p className="text-xs font-bold text-foreground/75">
                  <span className="text-primary font-black">{postedStripIds.length}</span> of {savedMemories.length} on wall
                </p>
              </div>
              <button
                type="button"
                onClick={handleClosePostModal}
                className="px-6 py-2.5 bg-primary text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-primary/25 hover:brightness-105 active:scale-95 transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Native File Input for Photo Library and Camera Upload (Accessible to iOS Safari)
          iOS Safari requires the input to be in the DOM (not display:none) for .click() to work.
          Using sr-only positions it off-screen but keeps it functional. */}
      <input
        id="avatar-file-input"
        ref={fileInputRef}
        type="file"
        accept={AVATAR_ACCEPT_ATTRIBUTE}
        capture={undefined}
        onChange={handleDirectAvatarUpload}
        className="sr-only"
        style={{ position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0, fontSize: '16px' }}
        tabIndex={-1}
        aria-hidden="true"
      />

      <BottomNav />
    </div>
  );
}
