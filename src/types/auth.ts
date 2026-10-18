import type { Session, User } from '@supabase/supabase-js';

export type UserRole = 'user' | 'admin' | 'contributor';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  avatarStoragePath?: string;
  role: UserRole;
  wallStripIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthState {
  user: UserProfile | null;
  supabaseUser: User | null;
  session: Session | null;
  role: UserRole;
  isLoading: boolean;
  isConfigured: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isContributor: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<{ error?: string; message?: string; needsVerification?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string; message?: string }>;
  updateProfile: (updates: {
    displayName?: string;
    bio?: string;
    avatarUrl?: string | null;
    avatarStoragePath?: string | null;
    wallStripIds?: string[];
  }) => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}
