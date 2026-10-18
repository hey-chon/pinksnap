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
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [activeTab, setActiveTab] = useState<'strips' | 'edit'>('strips');
  const [selectedMemory, setSelectedMemory] = useState<{ id: string; url: string; date: number; frame: string } | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);

  // Profile wall privacy: only strips explicitly chosen by user are displayed on their wall
  const [postedStripIds, setPostedStripIds] = useState<string[]>(() => {
    if (typeof window === 'undefined' || !user?.id) return [];
    try {
      const stored = localStorage.getItem(`pinksnap_wall_strips_${user.id}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  // Sync wall strips from localStorage if user changes
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.id) {
      try {
        const stored = localStorage.getItem(`pinksnap_wall_strips_${user.id}`);
        setPostedStripIds(stored ? JSON.parse(stored) : []);
      } catch {
        setPostedStripIds([]);
      }
    }
  }, [user?.id]);

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
      fileInputRef.current?.click();
    }
  };

  const handleDirectAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';
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
      const sanitizedAvatar = await sanitizeAvatarForUpload(file);
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

      const previousAvatarPath = user.avatarStoragePath;
      const res = await updateProfile({
        avatarUrl: trustedAvatarUrl,
        avatarStoragePath: nextAvatarPath,
      });

      if (res.error) {
        await cleanupUploadedAvatar();
        toast({
          title: 'Update Failed',
          description: res.error,
          variant: 'destructive',
        });
      } else {
        if (previousAvatarPath && previousAvatarPath !== nextAvatarPath) {
          try {
            await supabase.storage.from(AVATAR_BUCKET).remove([previousAvatarPath]);
          } catch {
          }
        }
        toast({
          title: 'Profile Picture Updated ✨',
          description: 'Your new avatar is live on your profile.',
        });
      }
    } catch (err: unknown) {
      await cleanupUploadedAvatar();
      const message = err instanceof Error ? err.message : 'Could not upload avatar.';
      toast({
        title: 'Upload Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleDirectRemoveAvatar = async () => {
    setShowAvatarMenu(false);
    setIsUploadingAvatar(true);
    try {
      const previousAvatarPath = user.avatarStoragePath;
      const res = await updateProfile({
        avatarUrl: null,
        avatarStoragePath: null,
      });

      if (res.error) {
        toast({
          title: 'Removal Failed',
          description: res.error,
          variant: 'destructive',
        });
      } else {
        if (previousAvatarPath) {
          try {
            await supabase.storage.from(AVATAR_BUCKET).remove([previousAvatarPath]);
          } catch {
          }
        }
        toast({
          title: 'Profile Picture Removed',
          description: 'Your avatar has been reset.',
        });
      }
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

  const handleTogglePostToWall = (stripId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user?.id) return;

    setPostedStripIds((prev) => {
      const isPosted = prev.includes(stripId);
      const next = isPosted ? prev.filter((id) => id !== stripId) : [...prev, stripId];
      try {
        localStorage.setItem(`pinksnap_wall_strips_${user.id}`, JSON.stringify(next));
      } catch {
      }
      if (isPosted) {
        toast({
          title: 'Removed from Wall',
          description: 'This strip is now hidden from your wall and safe in your private gallery.',
        });
      } else {
        toast({
          title: 'Posted to Wall ✨',
          description: 'This photo strip is now showcased on your public profile wall.',
        });
      }
      return next;
    });
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
        setBio(trimmedBio);

        if (typeof window !== 'undefined' && user?.id) {
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
          </div>      

        {/* ── Main Profile Container ── */}
        <div className="max-w-3xl mx-auto px-3.5 sm:px-6">
          {/* ── Social Profile Card (Completely Solves Mobile Overlap) ── */}
          <div className="relative -mt-14 sm:-mt-16 mb-5 bg-white rounded-3xl shadow-[0_12px_45px_-12px_rgba(245,61,137,0.18)] border border-pink-100/90 p-4 sm:p-7">
            
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
                >
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white border-4 border-white shadow-xl flex items-center justify-center text-primary font-display text-4xl sm:text-5xl overflow-hidden ring-4 ring-pink-500/10">
                    {user.avatarUrl ? (
                      <img
                        src={normalizeAvatarUrl(user.avatarUrl)}
                        alt={user.displayName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
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
                
                {/* Verified Checkmark (Shown for Admin and Contributor) */}
                {isAdmin && (
                  <span
                    title="Verified Administrator"
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-600 text-white shadow-sm shrink-0"
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
                {isContributor && (
                  <span
                    title="Verified Contributor"
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white shadow-sm shrink-0"
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}

                {/* Role Badge */}
                <span
                  className={`shrink-0 px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${
                    isAdmin
                      ? 'bg-purple-100 text-purple-700 border border-purple-200'
                      : isContributor
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-primary/10 text-primary border border-primary/20'
                  }`}
                >
                  {isAdmin ? 'ADMIN' : isContributor ? 'CONTRIBUTOR' : 'MEMBER+'}
                </span>
              </div>

              {/* Metadata without the username handle */}
              <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-foreground/55 font-medium">
                <span className="flex items-center gap-1 truncate max-w-full">
                  <Mail className="w-3 h-3 text-primary/70 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </span>
                <span className="flex items-center gap-1 shrink-0">
                  <Calendar className="w-3 h-3 text-primary/70 shrink-0" />
                  <span>Joined {joinedDate}</span>
                </span>
              </div>

              {/* Custom User Bio */}
              {bio ? (
                <p className="text-xs sm:text-sm text-foreground/80 font-medium leading-relaxed pt-1 whitespace-pre-wrap break-words">
                  {bio}
                </p>
              ) : (
                <p className="text-xs text-foreground/40 italic font-medium pt-1">
                  No bio yet. Tap &ldquo;Settings&rdquo; to add your bio!
                </p>
              )}
            </div>

            {/* ROW 3: Social Media Stats Counters (Booth Tier is Member+ for members) */}
            <div className="mt-5 pt-4 border-t border-black/[0.06] grid grid-cols-3 gap-2 text-center">
              <button
                type="button"
                onClick={() => setActiveTab('strips')}
                className="p-2 rounded-2xl hover:bg-foreground/[0.02] transition-colors group cursor-pointer"
              >
                <p className="text-lg sm:text-2xl font-black text-foreground group-hover:text-primary transition-colors leading-none">
                  {postedStrips.length}
                </p>
                <p className="text-[9px] sm:text-[10px] font-bold text-foreground/50 uppercase tracking-wider mt-1">
                 Photo Strips
                </p>
              </button>

              <div className="p-2 rounded-2xl">
                <p className="text-lg sm:text-2xl font-black text-foreground leading-none">
                  {isAdmin ? 'Creator+' : isContributor ? 'Contributor+' : 'Member+'}
                </p>
                <p className="text-[9px] sm:text-[10px] font-bold text-foreground/50 uppercase tracking-wider mt-1">
                  Booth Tier
                </p>
              </div>

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
                  <h3 className="font-hero text-xl sm:text-2xl text-foreground mb-1.5 sm:mb-2">YOUR PROFILE WALL</h3>
                  <p className="text-foreground/60 text-xs sm:text-sm max-w-sm mx-auto mb-5 sm:mb-6 leading-relaxed">
                    Strips in your gallery are private by default. Pick your favorite snapshots to showcase here on your public wall.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowPostModal(true)}
                    className="w-full sm:w-auto px-5 py-3 sm:px-7 sm:py-3.5 bg-primary text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-primary/25 inline-flex items-center justify-center gap-2 hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" /> Choose Strips to Post
                  </button>
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
                            title="Remove from Wall (keeps in private gallery)"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                          </button>
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
                            title="Delete permanently"
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
                    className="w-full px-4 py-3 bg-foreground/[0.02] border border-black/[0.08] focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl text-sm font-medium outline-none transition-all placeholder:text-foreground/30 resize-none"
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

      {/* ── Avatar Action Modal (Upload New Photo or Remove Photo) ── */}
      {showAvatarMenu && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowAvatarMenu(false)}
        >
          <div
            className="bg-white rounded-3xl p-5 max-w-xs w-full shadow-2xl border border-pink-100 space-y-2.5 animate-in zoom-in-95 duration-150 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pb-1">
              <h3 className="font-hero text-lg text-foreground">PROFILE PHOTO</h3>
              <p className="text-[11px] text-foreground/50 font-medium">Update or remove your booth picture</p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowAvatarMenu(false);
                fileInputRef.current?.click();
              }}
              className="w-full py-3 px-4 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-wider shadow-md shadow-primary/25 flex items-center justify-center gap-2 active:scale-98 transition-all hover:brightness-105"
            >
              <Upload className="w-4 h-4" /> Upload New Photo
            </button>

            <button
              type="button"
              onClick={handleDirectRemoveAvatar}
              className="w-full py-3 px-4 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive/15 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              <Trash2 className="w-4 h-4" /> Remove Photo
            </button>

            <button
              type="button"
              onClick={() => setShowAvatarMenu(false)}
              className="w-full py-2.5 px-4 rounded-2xl text-foreground/50 hover:bg-foreground/[0.04] text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Post to Wall Modal (Select strips from private gallery) ── */}
      {showPostModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-150 p-0 sm:p-4"
          onClick={() => setShowPostModal(false)}
        >
          <div
            className="bg-white w-full max-w-lg max-h-[90dvh] sm:max-h-[85dvh] rounded-t-[28px] sm:rounded-3xl shadow-2xl border border-pink-100 flex flex-col animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Sheet Drag Indicator */}
            <div className="w-12 h-1.5 rounded-full bg-foreground/15 mx-auto mt-3 sm:hidden" />

            {/* Modal Header */}
            <div className="flex items-center justify-between px-3.5 sm:px-5 pt-2.5 sm:pt-4 pb-2.5 sm:pb-3.5 border-b border-pink-100">
              <div>
                <h3 className="font-hero text-base sm:text-xl text-foreground tracking-tight">CHOOSE STRIPS TO POST</h3>
                <p className="text-[10px] sm:text-xs text-foreground/50 font-medium">
                  Tap any photo strip to toggle it on or off your wall
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPostModal(false)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-foreground/[0.04] hover:bg-foreground/[0.08] active:scale-90 text-foreground/60 flex items-center justify-center transition-all cursor-pointer"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
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
                      <div
                        key={memory.id}
                        onClick={() => handleTogglePostToWall(memory.id)}
                        className={`group relative rounded-xl sm:rounded-2xl p-1.5 sm:p-2 transition-all cursor-pointer select-none border-2 flex flex-col justify-between active:scale-[0.98] ${
                          isOnWall
                            ? 'bg-primary/[0.04] border-primary shadow-sm ring-1 ring-primary/25'
                            : 'bg-white border-pink-100/90 hover:border-pink-200 shadow-xs'
                        }`}
                      >
                        {/* Thumbnail Container */}
                        <div className="aspect-[3/4] w-full rounded-lg sm:rounded-xl overflow-hidden bg-black/5 relative mb-1.5 sm:mb-2">
                          <img
                            src={memory.url}
                            alt="Strip preview"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                            loading="lazy"
                          />

                          {/* Selection Badge in Corner */}
                          <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2">
                            {isOnWall ? (
                              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-md shadow-primary/30">
                                <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-black/35 backdrop-blur-sm border border-white/60 text-white/90 flex items-center justify-center group-hover:bg-primary/80 transition-colors">
                                <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Footer Info */}
                        <div className="flex items-center justify-between px-0.5 sm:px-1 text-[10px] sm:text-[11px]">
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
                            {isOnWall ? 'On Wall' : 'Private'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-3.5 sm:px-5 py-2.5 sm:py-3.5 border-t border-pink-100 bg-white flex items-center justify-between gap-2 sm:gap-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary" />
                <p className="text-[11px] sm:text-xs font-bold text-foreground/70">
                  <span className="text-primary font-black">{postedStripIds.length}</span> of {savedMemories.length} on wall
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPostModal(false)}
                className="px-5 py-2 sm:px-6 sm:py-2.5 bg-primary text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-primary/25 hover:brightness-105 active:scale-95 transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Native File Input for Direct Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept={AVATAR_ACCEPT_ATTRIBUTE}
        onChange={handleDirectAvatarUpload}
        className="hidden"
      />

      <BottomNav />
    </div>
  );
}
