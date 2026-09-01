import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { normalizeAvatarUrl } from '@/lib/avatar';
import { useAuth } from '@/hooks/use-auth';
import type { CommunityMessage, ChatRoomId } from '@/types/chat';
import { validateMessageContent } from '@/lib/word-filter';
import { globalChatRateLimiter } from '@/lib/rate-limiter';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useCommunityChat(room: ChatRoomId = 'general') {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const profilesCache = useRef<Map<string, { displayName: string; avatarUrl?: string; role: 'user' | 'admin' }>>(new Map());

  const getProfileForUser = useCallback(async (userId: string) => {
    if (profilesCache.current.has(userId)) {
      return profilesCache.current.get(userId)!;
    }

    try {
      const { data } = await supabase
        .from('profiles_public')
        .select('id, display_name, avatar_url, role')
        .eq('id', userId)
        .maybeSingle();

      if (data && data.display_name) {
        const profile = {
          displayName: data.display_name,
          avatarUrl: normalizeAvatarUrl(data.avatar_url),
          role: (data.role as 'user' | 'admin') || 'user',
        };
        profilesCache.current.set(userId, profile);
        return profile;
      }

      // Fallback: try profiles table
      const { data: pData } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, role')
        .eq('id', userId)
        .maybeSingle();

      if (pData && pData.display_name) {
        const profile = {
          displayName: pData.display_name,
          avatarUrl: normalizeAvatarUrl(pData.avatar_url),
          role: (pData.role as 'user' | 'admin') || 'user',
        };
        profilesCache.current.set(userId, profile);
        return profile;
      }

      const fallback: { displayName: string; avatarUrl?: string; role: 'user' | 'admin' } = {
        displayName: 'Member',
        avatarUrl: undefined,
        role: 'user',
      };
      profilesCache.current.set(userId, fallback);
      return fallback;
    } catch {
      const fallback: { displayName: string; avatarUrl?: string; role: 'user' | 'admin' } = {
        displayName: 'Member',
        avatarUrl: undefined,
        role: 'user',
      };
      profilesCache.current.set(userId, fallback);
      return fallback;
    }
  }, []);

  const loadMessages = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorNotice(null);

    try {
      // Query the latest 50 messages in descending order
      const { data: rows, error } = await supabase
        .from('community_messages')
        .select('id, user_id, room, content, created_at')
        .eq('room', room)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.warn('[Community Chat] Messages fetch notice:', error.message);
        setMessages([]);
        if (error.code === '42P01') {
          setErrorNotice('Database table is being prepared. Realtime chat will activate once schema is loaded.');
        }
        return;
      }

      if (!rows || rows.length === 0) {
        setMessages([]);
        return;
      }

      // Reverse so they appear chronologically in the chat feed
      const chronologicalRows = [...rows].reverse();

      const userIds = Array.from(new Set(chronologicalRows.map(r => r.user_id)));
      const missingUserIds = userIds.filter(id => !profilesCache.current.has(id));

      if (missingUserIds.length > 0) {
        try {
          const { data: profiles } = await supabase
            .from('profiles_public')
            .select('id, display_name, avatar_url, role')
            .in('id', missingUserIds);

          if (profiles && profiles.length > 0) {
            profiles.forEach(p => {
              if (p.id) {
                profilesCache.current.set(p.id, {
                  displayName: p.display_name || 'Member',
                  avatarUrl: normalizeAvatarUrl(p.avatar_url),
                  role: (p.role as 'user' | 'admin') || 'user',
                });
              }
            });
          }

          // Check for any still-missing profiles in profiles table
          const stillMissing = missingUserIds.filter(id => !profilesCache.current.has(id));
          if (stillMissing.length > 0) {
            const { data: fallbackProfiles } = await supabase
              .from('profiles')
              .select('id, display_name, avatar_url, role')
              .in('id', stillMissing);

            if (fallbackProfiles && fallbackProfiles.length > 0) {
              fallbackProfiles.forEach(p => {
                if (p.id) {
                  profilesCache.current.set(p.id, {
                    displayName: p.display_name || 'Member',
                    avatarUrl: normalizeAvatarUrl(p.avatar_url),
                    role: (p.role as 'user' | 'admin') || 'user',
                  });
                }
              });
            }
          }
        } catch {
        }
      }

      const formatted: CommunityMessage[] = chronologicalRows.map(r => {
        const cached = profilesCache.current.get(r.user_id);
        const isMine = user?.id === r.user_id;
        return {
          id: r.id,
          userId: r.user_id,
          room: r.room,
          content: r.content,
          createdAt: r.created_at,
          mine: isMine,
          author: {
            id: r.user_id,
            displayName: isMine && user ? user.displayName : (cached?.displayName || 'Member'),
            avatarUrl: isMine && user ? normalizeAvatarUrl(user.avatarUrl) : normalizeAvatarUrl(cached?.avatarUrl),
            role: isMine && user ? user.role : (cached?.role || 'user'),
          },
        };
      });

      setMessages(formatted);
    } catch (err: unknown) {
      console.error('[Community Chat] Error loading messages:', err);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [room, user]);

  useEffect(() => {
    loadMessages();

    if (!isSupabaseConfigured) {
      setIsConnected(true);
      return;
    }

    const channelName = `community_chat_room_${room}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user?.id || `guest_${Math.random().toString(36).substring(2, 8)}`,
        },
      },
    });

    channelRef.current = channel;

    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'community_messages',
        filter: `room=eq.${room}`,
      },
      async (payload) => {
        const newRow = payload.new as {
          id: string;
          user_id: string;
          room: string;
          content: string;
          created_at: string;
        };

        const profile = await getProfileForUser(newRow.user_id);
        const isMine = user?.id === newRow.user_id;

        const newMsg: CommunityMessage = {
          id: newRow.id,
          userId: newRow.user_id,
          room: newRow.room,
          content: newRow.content,
          createdAt: newRow.created_at,
          mine: isMine,
          author: {
            id: newRow.user_id,
            displayName: isMine && user ? user.displayName : profile.displayName,
            avatarUrl: isMine && user ? normalizeAvatarUrl(user.avatarUrl) : normalizeAvatarUrl(profile.avatarUrl),
            role: isMine && user ? user.role : profile.role,
          },
        };

        setMessages((prev) => {
          let next: CommunityMessage[];
          if (prev.some(m => m.id === newMsg.id || (m.mine && m.content === newMsg.content && Math.abs(new Date(m.createdAt).getTime() - new Date(newMsg.createdAt).getTime()) < 3000))) {
            next = prev.map(m => m.content === newMsg.content && m.id.startsWith('opt-') ? newMsg : m);
          } else {
            next = [...prev, newMsg];
          }
          return next.length > 100 ? next.slice(-100) : next;
        });
      }
    );

    channel.on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'community_messages',
      },
      (payload) => {
        const oldRow = payload.old as { id: string };
        if (oldRow?.id) {
          setMessages((prev) => prev.filter(m => m.id !== oldRow.id));
        }
      }
    );

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const count = Object.keys(state).length;
      setOnlineCount(Math.max(1, count));
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        try {
          await channel.track({
            online_at: new Date().toISOString(),
            user_id: user?.id || null,
            name: user?.displayName || 'Guest',
          });
        } catch {
        }
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        setIsConnected(false);
      }
    });

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [room, user, loadMessages, getProfileForUser]);

  const sendMessage = useCallback(
    async (text: string): Promise<{ success: boolean; error?: string }> => {
      if (!isAuthenticated || !user) {
        return {
          success: false,
          error: 'You must be signed in to send messages.',
        };
      }

      const validation = validateMessageContent(text);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error || 'Message contains prohibited content.',
        };
      }

      const finalContent = validation.censoredText || text.trim();

      const rateLimit = globalChatRateLimiter.checkRateLimit(finalContent);
      if (!rateLimit.isAllowed) {
        return {
          success: false,
          error: rateLimit.reason,
        };
      }

      const optimisticId = `opt-${Date.now()}`;
      const optimisticMsg: CommunityMessage = {
        id: optimisticId,
        userId: user.id,
        room,
        content: finalContent,
        createdAt: new Date().toISOString(),
        mine: true,
        author: {
          id: user.id,
          displayName: user.displayName,
          avatarUrl: normalizeAvatarUrl(user.avatarUrl),
          role: user.role,
        },
      };

      setMessages(prev => [...prev, optimisticMsg]);

      if (!isSupabaseConfigured) {
        globalChatRateLimiter.recordMessageSent(finalContent);
        return { success: true };
      }

      try {
        const { data, error } = await supabase
          .from('community_messages')
          .insert({
            user_id: user.id,
            room,
            content: finalContent,
          })
          .select('id, user_id, room, content, created_at')
          .single();

        if (error) {
          setMessages(prev => prev.filter(m => m.id !== optimisticId));
          return {
            success: false,
            error: error.message || 'Failed to send message.',
          };
        }

        globalChatRateLimiter.recordMessageSent(finalContent);

        if (data) {
          setMessages(prev =>
            prev.map(m =>
              m.id === optimisticId
                ? {
                    ...m,
                    id: data.id,
                    createdAt: data.created_at,
                  }
                : m
            )
          );
        }

        return { success: true };
      } catch (err: unknown) {
        setMessages(prev => prev.filter(m => m.id !== optimisticId));
        const message = err instanceof Error ? err.message : 'Failed to send message.';
        return { success: false, error: message };
      }
    },
    [isAuthenticated, user, room]
  );

  const deleteMessage = useCallback(
    async (messageId: string): Promise<{ success: boolean; error?: string }> => {
      if (!isAuthenticated || !user) {
        return { success: false, error: 'Authentication required.' };
      }

      const target = messages.find(m => m.id === messageId);
      if (!target) return { success: false, error: 'Message not found.' };

      if (target.userId !== user.id && !isAdmin) {
        return { success: false, error: 'You can only delete your own messages.' };
      }

      setMessages(prev => prev.filter(m => m.id !== messageId));

      if (!isSupabaseConfigured || messageId.startsWith('opt-')) {
        return { success: true };
      }

      try {
        const { error } = await supabase
          .from('community_messages')
          .delete()
          .eq('id', messageId);

        if (error) {
          loadMessages();
          return { success: false, error: error.message };
        }

        return { success: true };
      } catch (err: unknown) {
        loadMessages();
        const msg = err instanceof Error ? err.message : 'Failed to delete message.';
        return { success: false, error: msg };
      }
    },
    [isAuthenticated, user, isAdmin, messages, loadMessages]
  );

  return {
    messages,
    isLoading,
    isConnected,
    onlineCount,
    errorNotice,
    sendMessage,
    deleteMessage,
    refreshMessages: loadMessages,
  };
}
