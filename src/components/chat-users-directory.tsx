import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'wouter';
import {
  Search,
  RefreshCw,
  Sparkles,
  Crown,
  Zap,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { normalizeAvatarUrl } from '@/lib/avatar';
import { useAuth } from '@/hooks/use-auth';
import { seedProfilesCache } from '@/hooks/use-community-chat';

export interface DirectoryUser {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string | null;
  created_at?: string;
}

const AVATAR_TONES = ['tone-a', 'tone-b', 'tone-c', 'tone-d'];
const toneFor = (name: string) => {
  const sum = [...(name || 'USER')].reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_TONES[sum % AVATAR_TONES.length];
};

const formatJoinedDate = (isoString?: string) => {
  if (!isoString) return 'Member';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Member';
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return 'Member';
  }
};

function DirectoryUserAvatar({
  avatarSrc,
  displayName,
  isAdmin,
}: {
  avatarSrc?: string;
  displayName: string;
  isAdmin?: boolean;
}) {
  const [hasError, setHasError] = useState(false);
  const initial = (displayName || 'U').slice(0, 1).toUpperCase();

  return (
    <div className="relative shrink-0">
      <span
        className={`pixel-avatar w-8 h-8 ${toneFor(
          displayName
        )} flex items-center justify-center rounded-lg overflow-hidden border border-black/20 shadow-xs`}
      >
        {avatarSrc && !hasError ? (
          <img
            src={avatarSrc}
            alt={displayName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setHasError(true)}
          />
        ) : (
          <span className="font-black text-xs text-white/95 select-none">{initial}</span>
        )}
      </span>
      {isAdmin && (
        <span className="absolute -top-1 -right-1 p-0.5 bg-primary text-white rounded-full shadow-xs">
          <Crown className="w-2 h-2" />
        </span>
      )}
    </div>
  );
}

export default function ChatUsersDirectory() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchUsers = async () => {
    setIsRefreshing(true);
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, role, created_at')
        .order('created_at', { ascending: false });

      if (profilesData && !profilesError && profilesData.length > 0) {
        setUsers(profilesData);
        seedProfilesCache(profilesData);
        return;
      }

      const { data: publicData, error: publicError } = await supabase
        .from('profiles_public')
        .select('id, display_name, avatar_url, role');

      if (publicData && !publicError && publicData.length > 0) {
        setUsers(publicData);
        seedProfilesCache(publicData);
      }
    } catch (err) {
      console.warn('[Users Directory] Failed to fetch users:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    let list = [...users];

    // Strict Role assignments: Jimson is always Creator, Rezn1r is always Contributor
    list = list.map((u) => {
      const isJimson = u.id === '3375e2f7-c77a-458d-b6aa-ae2aca636b16' || u.display_name?.toLowerCase() === 'jimson';
      const isRezn1r = u.id === '8366e1a3-f9a4-44ca-8425-7af932c4fe66' || (u.display_name?.toLowerCase() || '').includes('rezn1r');
      if (isJimson) {
        return {
          ...u,
          role: 'admin',
          avatar_url: normalizeAvatarUrl(u.avatar_url) || 'https://gthbvhefwctugvmouqrg.supabase.co/storage/v1/object/public/avatars/3375e2f7-c77a-458d-b6aa-ae2aca636b16/avatar-f93617eb-ef2b-404e-9b34-049e1f1949be.webp',
        };
      }
      if (isRezn1r) {
        return { ...u, role: 'contributor' };
      }
      return u;
    });

    if (typeof window !== 'undefined') {
      try {
        const storedOverrides = JSON.parse(localStorage.getItem('pinksnap_role_overrides') || '{}');
        list = list.map((u) => {
          if (u.id === '3375e2f7-c77a-458d-b6aa-ae2aca636b16' || u.id === '8366e1a3-f9a4-44ca-8425-7af932c4fe66') {
            return u;
          }
          if (storedOverrides[u.id]) {
            return { ...u, role: storedOverrides[u.id] };
          }
          return u;
        });
      } catch {}
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((u) => (u.display_name || 'Member').toLowerCase().includes(q));
    }

    return list.sort((a, b) => {
      const roleWeight = (r: string | null) => (r === 'admin' ? 3 : r === 'contributor' ? 2 : 1);
      const weightDiff = roleWeight(b.role) - roleWeight(a.role);
      if (weightDiff !== 0) return weightDiff;
      if (a.created_at && b.created_at) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return 0;
    });
  }, [users, searchQuery]);

  return (
    <div className="w-full flex flex-col">
      {/* Compact Retro Pixel Window */}
      <div className="pixel-panel shadow-xl relative w-full flex flex-col overflow-hidden">
        {/* Pixel Titlebar: Clean header without profile counter */}
        <div className="pixel-titlebar relative flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="pixel-dots" aria-hidden="true">
              <i /><i /><i />
            </span>
            <span className="pixel-text text-[10px] tracking-wider font-bold uppercase whitespace-nowrap">
              PINKSNAP USERS
            </span>
          </div>

          <button
            type="button"
            onClick={fetchUsers}
            disabled={isRefreshing}
            title="Refresh member list"
            className={`hover:rotate-180 transition-transform duration-300 text-white/80 hover:text-white cursor-pointer ${
              isRefreshing ? 'animate-spin' : ''
            }`}
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>

        {/* Clean Search Input */}
        <div className="p-2 bg-[#fff4f8] border-b-2 border-[#2a1f33]/30">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-foreground/40 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members..."
              className="w-full pl-8 pr-3 py-1 bg-white border border-[#2a1f33]/30 rounded-lg text-xs font-medium placeholder:text-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-foreground/40 hover:text-foreground cursor-pointer"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Compact Scrollable Members List */}
        <div
          className="flex flex-col gap-1.5 p-2 overflow-y-auto max-h-[360px] sm:max-h-[390px] scrollbar-thin scrollbar-thumb-pink-200"
          style={{
            backgroundImage:
              'linear-gradient(rgba(245, 61, 137, .04) 1px, transparent 1px), linear-gradient(90deg, rgba(245, 61, 137, .04) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        >
          {isLoading ? (
            <div className="py-10 flex flex-col items-center justify-center gap-2 text-center">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="pixel-text text-[9px] text-foreground/50">LOADING USERS...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-center text-foreground/50 gap-1">
              <Sparkles className="w-4 h-4 text-primary/40 animate-pulse" />
              <p className="text-xs font-bold">No members found</p>
            </div>
          ) : (
            filteredUsers.map((member, idx) => {
              const displayName = member.display_name || 'Member';
              const avatarSrc = normalizeAvatarUrl(member.avatar_url);
              const isCurrentUser = currentUser?.id === member.id;
              const isAdmin = member.role === 'admin';
              const isContributor = member.role === 'contributor';
              const rank = idx + 1;

              return (
                <Link
                  key={member.id}
                  href={`/profile?user=${member.id}`}
                  className={`group flex items-center justify-between gap-2 p-2 rounded-xl border transition-all duration-150 cursor-pointer ${
                    isCurrentUser
                      ? 'bg-pink-100/70 border-pink-300 shadow-xs'
                      : 'bg-white/90 hover:bg-white border-pink-100 hover:border-pink-300 hover:shadow-sm hover:scale-[1.01]'
                  }`}
                  title={`Stalk ${displayName}'s profile wall`}
                >
                  {/* Left: Rank & Avatar */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`text-[10px] font-black w-4 text-center shrink-0 ${
                        rank === 1
                          ? 'text-amber-500 font-extrabold'
                          : rank === 2
                          ? 'text-slate-400 font-extrabold'
                          : rank === 3
                          ? 'text-amber-700 font-extrabold'
                          : 'text-foreground/35'
                      }`}
                    >
                      {rank}
                    </span>

                    <DirectoryUserAvatar
                      avatarSrc={avatarSrc}
                      displayName={displayName}
                      isAdmin={isAdmin}
                    />

                    {/* Name & Role */}
                    <div className="flex flex-col min-w-0 text-left">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-black text-foreground truncate max-w-[95px] group-hover:text-primary transition-colors">
                          {displayName}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[7px] font-black bg-pink-200 text-primary px-1 py-0.2 rounded">
                            YOU
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[9px]">
                        {isAdmin ? (
                          <span className="text-[8px] font-black tracking-wider uppercase text-primary inline-flex items-center gap-0.5">
                            <Crown className="w-2 h-2 stroke-[2.5]" />
                            <span>CREATOR</span>
                          </span>
                        ) : isContributor ? (
                          <span className="text-[8px] font-black tracking-wider uppercase text-amber-600 inline-flex items-center gap-0.5">
                            <Zap className="w-2 h-2 fill-current" />
                            <span>CONTRIBUTOR</span>
                          </span>
                        ) : (
                          <span className="text-[9px] font-medium text-foreground/45">
                            {formatJoinedDate(member.created_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Action Pill */}
                  <div className="shrink-0">
                    <span className="text-[10px] font-black text-primary/70 group-hover:text-primary group-hover:bg-primary/10 px-2 py-0.5 rounded-lg border border-transparent group-hover:border-primary/20 transition-all inline-flex items-center gap-0.5">
                      <span>Wall</span>
                      <ExternalLink className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
