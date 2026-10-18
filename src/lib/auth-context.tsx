import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { normalizeAvatarFields } from '@/lib/avatar';
import type { AuthState, UserProfile, UserRole } from '@/types/auth';

const AuthContext = createContext<AuthState | null>(null);

function profileFromSupabaseUser(user: User): UserProfile {
  const metadata = user.user_metadata || {};
  const email = user.email || '';
  const emailLower = email.toLowerCase();
  const displayName = metadata.display_name || metadata.name || metadata.full_name || email.split('@')[0] || 'User';
  const bio = (metadata.bio as string) || '';
  const role: UserRole = emailLower === 'rezn1r@proton.me' ? 'contributor' : (metadata.role as UserRole || 'user');
  const avatar = normalizeAvatarFields({
    avatarUrl: metadata.avatar_url,
    avatarStoragePath: metadata.avatar_storage_path,
  });

  const wallStripIds = Array.isArray(metadata.wall_strip_ids) ? metadata.wall_strip_ids : undefined;

  return {
    id: user.id,
    email,
    displayName,
    bio,
    avatarUrl: avatar.avatarUrl,
    avatarStoragePath: avatar.avatarStoragePath,
    role,
    wallStripIds,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

function getLocalProfile(userId: string): { displayName?: string; bio?: string; wallStripIds?: string[] } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`pinksnap_user_profile_${userId}`);
    const nameOnly = localStorage.getItem(`pinksnap_user_name_${userId}`);
    const bioOnly = localStorage.getItem(`pinksnap_user_bio_${userId}`);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      ...parsed,
      ...(nameOnly ? { displayName: nameOnly } : {}),
      ...(bioOnly ? { bio: bioOnly } : {}),
    };
  } catch {
    return null;
  }
}

function saveLocalProfile(userId: string, data: { displayName?: string; bio?: string; wallStripIds?: string[] }) {
  if (typeof window === 'undefined') return;
  try {
    const current = getLocalProfile(userId) || {};
    const updated = { ...current, ...data };
    localStorage.setItem(`pinksnap_user_profile_${userId}`, JSON.stringify(updated));
    if (data.displayName) {
      localStorage.setItem(`pinksnap_user_name_${userId}`, data.displayName);
    }
    if (data.bio !== undefined) {
      if (data.bio) {
        localStorage.setItem(`pinksnap_user_bio_${userId}`, data.bio);
      } else {
        localStorage.removeItem(`pinksnap_user_bio_${userId}`);
      }
    }
  } catch {}
}

async function resolveUserProfile(sbUser: User): Promise<UserProfile> {
  const localCache = getLocalProfile(sbUser.id);
  const metadata = sbUser.user_metadata || {};
  const email = sbUser.email || '';
  const emailLower = email.toLowerCase();

  // 1. Fetch from Supabase 'profiles' table
  let dbProfile: any = null;
  try {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sbUser.id)
      .maybeSingle();
    dbProfile = data;
  } catch (err) {
    console.warn('[Supabase Auth] profiles fetch notice:', err);
  }

  // Priority: Database profile row > local saved profile edits > JWT metadata > email handle fallback
  // Database is the source of truth so cloud changes take precedence over stale localStorage cache.
  const resolvedDisplayName =
    dbProfile?.display_name ||
    localCache?.displayName ||
    metadata.display_name ||
    metadata.name ||
    metadata.full_name ||
    email.split('@')[0] ||
    'User';

  const resolvedBio =
    dbProfile?.bio ??
    (localCache?.bio !== undefined ? localCache.bio : undefined) ??
    metadata.bio ??
    '';

  // For avatar: When dbProfile exists, it is the primary cloud truth across devices.
  // If dbProfile explicitly has null or empty avatar fields (e.g. user removed avatar),
  // we do NOT resurrect stale JWT metadata.
  const rawAvatarUrl = dbProfile
    ? (dbProfile.avatar_url ?? undefined)
    : (metadata.avatar_url ?? undefined);

  const rawAvatarPath = dbProfile
    ? (dbProfile.avatar_storage_path ?? undefined)
    : (metadata.avatar_storage_path ?? undefined);

  const avatar = (rawAvatarUrl || rawAvatarPath)
    ? normalizeAvatarFields({
        avatarUrl: rawAvatarUrl,
        avatarStoragePath: rawAvatarPath,
      })
    : {};

  let roleOverride: UserRole | undefined;
  if (typeof window !== 'undefined') {
    try {
      const storedOverrides = JSON.parse(localStorage.getItem('pinksnap_role_overrides') || '{}');
      roleOverride = storedOverrides[sbUser.id] || storedOverrides[emailLower];
    } catch {}
  }
  const resolvedRole: UserRole = roleOverride || (emailLower === 'rezn1r@proton.me'
    ? 'contributor'
    : (dbProfile?.role || metadata.role || 'user'));

  const cloudWallStripIds = (
    Array.isArray(dbProfile?.wall_strip_ids)
      ? dbProfile.wall_strip_ids
      : (Array.isArray(metadata.wall_strip_ids) ? metadata.wall_strip_ids : localCache?.wallStripIds)
  );

  const profile: UserProfile = {
    id: sbUser.id,
    email,
    displayName: resolvedDisplayName,
    bio: resolvedBio,
    avatarUrl: avatar.avatarUrl,
    avatarStoragePath: avatar.avatarStoragePath,
    role: resolvedRole,
    wallStripIds: cloudWallStripIds,
    createdAt: dbProfile?.created_at || sbUser.created_at,
    updatedAt: dbProfile?.updated_at || sbUser.updated_at,
  };

  // If there wasn't a profile row in the database yet, initialize it
  if (!dbProfile) {
    try {
      await supabase.from('profiles').upsert({
        id: sbUser.id,
        email,
        display_name: resolvedDisplayName,
        avatar_url: avatar.avatarUrl ?? null,
        avatar_storage_path: avatar.avatarStoragePath ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    } catch {}
  }

  // Ensure local cache preserves the resolved name and bio
  saveLocalProfile(sbUser.id, {
    displayName: resolvedDisplayName,
    bio: resolvedBio,
    wallStripIds: cloudWallStripIds,
  });

  return profile;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = useCallback(async (): Promise<void> => {
    try {
      const { data: { user: freshAuthUser } } = await supabase.auth.getUser();
      let targetUser = freshAuthUser;
      if (!targetUser) {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        targetUser = currentSession?.user ?? null;
      }
      if (!targetUser) return;

      setSupabaseUser(targetUser);
      const prof = await resolveUserProfile(targetUser);
      setUser(prof);
    } catch (err) {
      console.warn('[Supabase Auth] refreshProfile notice:', err);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('[Supabase Auth] Session fetch error:', error.message);
        }
        if (isMounted && initialSession?.user) {
          setSession(initialSession);
          setSupabaseUser(initialSession.user);
          const prof = await resolveUserProfile(initialSession.user);
          if (isMounted) {
            setUser(prof);
          }
        }
      } catch (err) {
        console.error('[Supabase Auth] Init error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      setSupabaseUser(newSession?.user ?? null);

      if (newSession?.user) {
        const prof = await resolveUserProfile(newSession.user);
        if (isMounted) {
          setUser(prof);
        }
      } else {
        setUser(null);
      }
      if (isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Realtime cross-device sync & active window/tab synchronization
  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured) return;

    // Realtime postgres changes on profiles table for cross-device sync
    const channelName = `profile-sync-${user.id}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        async () => {
          await refreshProfile();
        }
      )
      .subscribe();

    // Re-verify cloud profile when device wakes, tab becomes active, or window gains focus
    const handleActiveSync = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        refreshProfile();
      }
    };

    window.addEventListener('focus', handleActiveSync);
    document.addEventListener('visibilitychange', handleActiveSync);

    const handleStorage = (e: StorageEvent) => {
      if (
        e.key?.includes(`pinksnap_user_profile_${user.id}`) ||
        e.key?.includes('pinksnap_role_overrides')
      ) {
        refreshProfile();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('focus', handleActiveSync);
      document.removeEventListener('visibilitychange', handleActiveSync);
      window.removeEventListener('storage', handleStorage);
    };
  }, [user?.id, refreshProfile]);

  const signIn = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };

      if (data.user) {
        const prof = profileFromSupabaseUser(data.user);
        setUser(prof);
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: prof.email,
            display_name: prof.displayName,
            avatar_url: prof.avatarUrl ?? null,
            avatar_storage_path: prof.avatarStoragePath ?? null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });
        } catch {
        }
      }
      return {};
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sign in. Please try again.';
      return { error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (
    email: string,
    password: string,
    displayName?: string
  ): Promise<{ error?: string; message?: string; needsVerification?: boolean }> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || email.split('@')[0],
          },
        },
      });

      if (error) {
        console.error('[Supabase SignUp Error]:', error.message);
        const msg = error.message.toLowerCase();
        if (msg.includes('rate limit') || msg.includes('too many requests') || msg.includes('email rate limit')) {
          return { error: 'Too many sign-up attempts. Please wait a minute and try again.' };
        }
        if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('user already exists')) {
          return { error: 'An account with this email already exists. Try signing in instead!' };
        }
        return { error: error.message };
      }

      // Supabase returns a user with a fake id and no identities when the
      // email is already taken but "email confirmations" are enabled. Detect
      // this edge-case so we don't mislead the user into thinking the
      // account was created.
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        return { error: 'An account with this email already exists. Try signing in instead!' };
      }

      if (data.session && data.user) {
        const prof = profileFromSupabaseUser(data.user);
        setUser(prof);
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: prof.email,
            display_name: prof.displayName,
            avatar_url: prof.avatarUrl ?? null,
            avatar_storage_path: prof.avatarStoragePath ?? null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });
        } catch {
        }
        return { message: 'Account created and signed in!' };
      }

      if (data.user) {
        try {
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (!signInErr && signInData.session && signInData.user) {
            const prof = profileFromSupabaseUser(signInData.user);
            setUser(prof);
            return { message: 'Account created and signed in!' };
          }
        } catch {
        }
      }

      return {
        needsVerification: true,
        message: 'Account created! Please check your email inbox for a confirmation link to verify your account.',
      };
    } catch (err: unknown) {
      console.error('[SignUp Exception]:', err);
      const message = err instanceof Error ? err.message : 'Sign up failed. Please try again.';
      return { error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('ps_welcome_gate_done');
        sessionStorage.removeItem('ps_auth_splash_done');
      }
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setSupabaseUser(null);
    } catch (err) {
      console.error('[Supabase Auth] Sign out error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<{ error?: string; message?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });

      if (error) return { error: error.message };
      return { message: `Password reset link sent to ${email}!` };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send password reset email.';
      return { error: message };
    }
  }, []);

  const updateProfile = useCallback(async (updates: {
    displayName?: string;
    bio?: string;
    avatarUrl?: string | null;
    avatarStoragePath?: string | null;
    wallStripIds?: string[];
  }): Promise<{ error?: string }> => {
    try {
      if (!user) return { error: 'No authenticated user' };

      const hasDisplayNameUpdate = Object.prototype.hasOwnProperty.call(updates, 'displayName');
      const hasBioUpdate = Object.prototype.hasOwnProperty.call(updates, 'bio');
      const hasAvatarUrlUpdate = Object.prototype.hasOwnProperty.call(updates, 'avatarUrl');
      const hasAvatarStoragePathUpdate = Object.prototype.hasOwnProperty.call(updates, 'avatarStoragePath');

      const candidateDisplayName = hasDisplayNameUpdate
        ? (updates.displayName || '')
        : user.displayName;
      const newDisplayName = candidateDisplayName.trim();

      if (!newDisplayName) {
        return { error: 'Display name cannot be empty.' };
      }

      const newBio = hasBioUpdate ? (updates.bio ?? '').trim() : (user.bio || '');

      let nextAvatar = normalizeAvatarFields({
        avatarUrl: user.avatarUrl,
        avatarStoragePath: user.avatarStoragePath,
      });

      if (hasAvatarUrlUpdate || hasAvatarStoragePathUpdate) {
        const shouldClearAvatar = updates.avatarUrl === null || updates.avatarStoragePath === null;
        if (shouldClearAvatar) {
          nextAvatar = {};
        } else {
          nextAvatar = normalizeAvatarFields({
            avatarUrl: hasAvatarUrlUpdate ? updates.avatarUrl : user.avatarUrl,
            avatarStoragePath: hasAvatarStoragePathUpdate ? updates.avatarStoragePath : user.avatarStoragePath,
          });

          if (!nextAvatar.avatarUrl || !nextAvatar.avatarStoragePath) {
            return { error: 'Avatar payload is invalid or untrusted.' };
          }
        }
      }

      const hasWallStripIdsUpdate = 'wallStripIds' in updates;
      const nextWallStripIds: string[] | undefined = hasWallStripIdsUpdate ? updates.wallStripIds : user.wallStripIds;

      const authDataUpdate: Record<string, any> = {
        display_name: newDisplayName,
        bio: newBio,
        avatar_url: nextAvatar.avatarUrl ?? null,
        avatar_storage_path: nextAvatar.avatarStoragePath ?? null,
      };
      if (hasWallStripIdsUpdate) {
        authDataUpdate.wall_strip_ids = nextWallStripIds;
      }

      // 1. Immediately persist to client local storage cache
      saveLocalProfile(user.id, {
        displayName: newDisplayName,
        bio: newBio,
        wallStripIds: nextWallStripIds,
      });

      // 2. Update Supabase Auth user metadata
      let authUpdateError: string | undefined;
      try {
        const { data: authUpdateRes, error: auErr } = await supabase.auth.updateUser({
          data: authDataUpdate,
        });
        if (auErr) authUpdateError = auErr.message;
        if (authUpdateRes?.user) {
          setSupabaseUser(authUpdateRes.user);
        }
      } catch (authErr: any) {
        authUpdateError = authErr?.message;
        console.warn('[Supabase Auth] updateUser error:', authUpdateError);
      }

      // 3. Upsert into Supabase 'profiles' table with guaranteed core columns fallback
      let profileUpsertError: string | undefined;
      try {
        const profileUpsert: Record<string, any> = {
          id: user.id,
          email: user.email,
          display_name: newDisplayName,
          bio: newBio,
          avatar_url: nextAvatar.avatarUrl ?? null,
          avatar_storage_path: nextAvatar.avatarStoragePath ?? null,
          updated_at: new Date().toISOString(),
        };
        if (hasWallStripIdsUpdate) {
          profileUpsert.wall_strip_ids = nextWallStripIds;
        }

        let { error: profErr } = await supabase
          .from('profiles')
          .upsert(profileUpsert, { onConflict: 'id' });

        // If unknown columns (like bio or wall_strip_ids) caused an error, retry with core schema columns
        if (profErr && (profErr.message?.includes('column') || profErr.code === 'PGRST204' || profErr.code === '42703')) {
          console.warn('[Supabase Profiles] Retrying upsert with core schema columns only:', profErr.message);
          const coreUpsert: Record<string, any> = {
            id: user.id,
            email: user.email,
            display_name: newDisplayName,
            avatar_url: nextAvatar.avatarUrl ?? null,
            avatar_storage_path: nextAvatar.avatarStoragePath ?? null,
            updated_at: new Date().toISOString(),
          };
          const { error: retryErr } = await supabase
            .from('profiles')
            .upsert(coreUpsert, { onConflict: 'id' });
          if (!retryErr) {
            profErr = null;
          } else {
            profileUpsertError = retryErr.message;
          }
        } else if (profErr) {
          profileUpsertError = profErr.message;
        }

        if (profileUpsertError) {
          console.warn('[Supabase Profiles] upsert error:', profileUpsertError);
        }
      } catch (profErr: any) {
        profileUpsertError = profErr?.message;
        console.warn('[Supabase Profiles] upsert exception:', profileUpsertError);
      }

      // If both cloud writes failed, return the error so the caller can surface it
      if (authUpdateError && profileUpsertError) {
        return { error: `Save failed: ${profileUpsertError}` };
      }

      // Optimistic update of local user state
      setUser(prev => prev ? {
        ...prev,
        displayName: newDisplayName,
        bio: newBio,
        avatarUrl: nextAvatar.avatarUrl,
        avatarStoragePath: nextAvatar.avatarStoragePath,
        wallStripIds: nextWallStripIds,
        updatedAt: new Date().toISOString(),
      } : null);

      // Refresh from cloud so state is 100% verified against cloud truth
      await refreshProfile();

      return {};
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { error: message };
    }
  }, [user, refreshProfile]);

  const hasRole = useCallback((roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const allowed = Array.isArray(roles) ? roles : [roles];
    return allowed.includes(user.role);
  }, [user]);

  const role: UserRole = user?.role || 'user';
  const isAdmin = role === 'admin';
  const isContributor = role === 'contributor';
  const isAuthenticated = Boolean(user);

  const value: AuthState = useMemo(() => ({
    user,
    supabaseUser,
    session,
    role,
    isLoading,
    isConfigured: isSupabaseConfigured,
    isAuthenticated,
    isAdmin,
    isContributor,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    refreshProfile,
    hasRole,
  }), [
    user,
    supabaseUser,
    session,
    role,
    isLoading,
    isAuthenticated,
    isAdmin,
    isContributor,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    refreshProfile,
    hasRole,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
