import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { AuthState, UserProfile, UserRole } from '@/types/auth';

const AuthContext = createContext<AuthState | null>(null);

function profileFromSupabaseUser(user: User): UserProfile {
  const metadata = user.user_metadata || {};
  const email = user.email || '';
  const displayName = metadata.display_name || metadata.name || metadata.full_name || email.split('@')[0] || 'User';
  const role: UserRole = 'user';

  return {
    id: user.id,
    email,
    displayName,
    avatarUrl: metadata.avatar_url,
    role,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
          const prof = profileFromSupabaseUser(initialSession.user);
          setUser(prof);

          try {
            await supabase.from('profiles').upsert({
              id: initialSession.user.id,
              email: prof.email,
              display_name: prof.displayName,
              avatar_url: prof.avatarUrl,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'id' });
          } catch {
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
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newSession.user.id)
            .maybeSingle();

          if (profileData && isMounted) {
            setUser({
              id: newSession.user.id,
              email: newSession.user.email || profileData.email || '',
              displayName: profileData.display_name || newSession.user.user_metadata?.display_name || 'User',
              avatarUrl: profileData.avatar_url || newSession.user.user_metadata?.avatar_url,
              role: profileData.role || newSession.user.user_metadata?.role || 'user',
              createdAt: profileData.created_at || newSession.user.created_at,
              updatedAt: profileData.updated_at,
            });
            setIsLoading(false);
            return;
          } else {
            const prof = profileFromSupabaseUser(newSession.user);
            await supabase.from('profiles').upsert({
              id: newSession.user.id,
              email: prof.email,
              display_name: prof.displayName,
              avatar_url: prof.avatarUrl,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'id' });
          }
        } catch {
        }
        setUser(profileFromSupabaseUser(newSession.user));
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

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
            avatar_url: prof.avatarUrl,
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
  ): Promise<{ error?: string; message?: string }> => {
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
        return { error: error.message };
      }

      if (data.session && data.user) {
        const prof = profileFromSupabaseUser(data.user);
        setUser(prof);
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: prof.email,
            display_name: prof.displayName,
            avatar_url: prof.avatarUrl,
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
        message: 'Account created! If email confirmation is enabled in your Supabase project, check your inbox to confirm.',
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

  const updateProfile = useCallback(async (updates: { displayName?: string; avatarUrl?: string }): Promise<{ error?: string }> => {
    try {
      if (!user) return { error: 'No authenticated user' };

      const newDisplayName = updates.displayName !== undefined ? updates.displayName : user.displayName;
      const newAvatarUrl = updates.avatarUrl !== undefined ? updates.avatarUrl : user.avatarUrl;

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          display_name: newDisplayName,
          avatar_url: newAvatarUrl,
        },
      });

      if (authError) return { error: authError.message };

      try {
        await supabase
          .from('profiles')
          .update({
            display_name: newDisplayName,
            avatar_url: newAvatarUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
      } catch {
      }

      setUser(prev => prev ? {
        ...prev,
        displayName: newDisplayName,
        avatarUrl: newAvatarUrl,
        updatedAt: new Date().toISOString(),
      } : null);

      return {};
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update profile.';
      return { error: message };
    }
  }, [user]);

  const hasRole = useCallback((roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const allowed = Array.isArray(roles) ? roles : [roles];
    return allowed.includes(user.role);
  }, [user]);

  const role: UserRole = user?.role || 'user';
  const isAdmin = role === 'admin';
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
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    hasRole,
  }), [
    user,
    supabaseUser,
    session,
    role,
    isLoading,
    isAuthenticated,
    isAdmin,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
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
