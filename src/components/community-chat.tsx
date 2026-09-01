import { useEffect, useRef, useState, useMemo } from 'react';
import {
  Hash,
  Send,
  ShieldCheck,
  Smile,
  Lock,
  Sparkles,
  Trash2,
  RefreshCw,
  AlertCircle,
  Clock,
  ArrowDown,
  Radio,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast.tsx';
import { useCommunityChat } from '@/hooks/use-community-chat';
import { globalChatRateLimiter } from '@/lib/rate-limiter';
import { normalizeAvatarUrl } from '@/lib/avatar';
import { findProhibitedSlur } from '@/lib/word-filter';
import type { ChatRoom, ChatRoomId, CommunityMessage } from '@/types/chat';
import { AuthModal } from '@/components/auth/auth-modal';

const ROOMS: ChatRoom[] = [
  { id: 'general', name: 'general' },
  { id: 'feedback', name: 'feedback' },
  { id: 'ideas', name: 'ideas' },
];

const AVATAR_TONES = ['tone-a', 'tone-b', 'tone-c', 'tone-d'];
const toneFor = (name: string) => {
  const sum = [...(name || 'USER')].reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_TONES[sum % AVATAR_TONES.length];
};

const formatTime = (isoString: string) => {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return '';
  }
};

const POPULAR_EMOJIS = ['✨', '💖', '📸', '✌️', '🌸', '🎀', '🎉', '🔥', '👏', '😍'];

export default function CommunityChat() {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { toast } = useToast();

  const [currentRoom, setCurrentRoom] = useState<ChatRoomId>('general');
  const [draft, setDraft] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isScrolledUp, setIsScrolledUp] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading,
    isConnected,
    onlineCount,
    errorNotice,
    sendMessage,
    deleteMessage,
    refreshMessages,
  } = useCommunityChat(currentRoom);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = globalChatRateLimiter.getCooldownSeconds();
      setCooldownSeconds(remaining);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [showEmojiPicker]);

  const scrollToBottom = (smooth = true) => {
    const el = listRef.current;
    if (el) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
      setIsScrolledUp(false);
    }
  };

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setIsScrolledUp(!isNearBottom);
  };

  useEffect(() => {
    if (!isScrolledUp) {
      scrollToBottom(false);
    }
  }, [messages, isScrolledUp]);

  const draftSlurWarning = useMemo(() => {
    if (!draft.trim()) return null;
    return findProhibitedSlur(draft);
  }, [draft]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    const trimmed = draft.trim();
    if (!trimmed || isSending) return;

    if (draftSlurWarning) {
      toast({
        title: 'Prohibited Language',
        description: 'Your message contains prohibited words or slurs. Please keep the chat friendly.',
        variant: 'destructive',
      });
      return;
    }

    const rateStatus = globalChatRateLimiter.checkRateLimit(trimmed);
    if (!rateStatus.isAllowed) {
      toast({
        title: 'Slow Down',
        description: rateStatus.reason || 'Please wait before sending another message.',
        variant: 'destructive',
      });
      setCooldownSeconds(rateStatus.cooldownRemainingSeconds);
      return;
    }

    setIsSending(true);
    try {
      const res = await sendMessage(trimmed);
      if (!res.success) {
        toast({
          title: 'Message Not Sent',
          description: res.error || 'Failed to send message.',
          variant: 'destructive',
        });
      } else {
        setDraft('');
        setShowEmojiPicker(false);
        setTimeout(() => scrollToBottom(true), 50);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (msg: CommunityMessage) => {
    const res = await deleteMessage(msg.id);
    if (!res.success) {
      toast({
        title: 'Delete Failed',
        description: res.error || 'Could not delete message.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Message Deleted',
        description: 'The message has been removed.',
      });
    }
  };

  const addEmoji = (emoji: string) => {
    setDraft(prev => (prev + emoji).slice(0, 280));
    setShowEmojiPicker(false);
  };

  return (
    <section
      id="community-chat"
      className="w-full max-w-2xl mx-auto"
      aria-labelledby="community-chat-title"
    >
      <div className="text-center mb-6">
        <h1 id="community-chat-title" className="font-display text-[2.5rem] leading-[.95] sm:text-6xl mt-2">
          COMMUNITY <span className="text-primary">CHAT</span>
        </h1>
        <p className="mt-2.5 text-xs sm:text-sm text-foreground/65 font-medium max-w-lg mx-auto">
          Thanks to my friend Vien for helping me integrate this community chat! This space was built to collect user feedback, share experiences, and feel free to give your ideas for future improvements.
        </p>
      </div>

      <div className="pixel-panel shadow-2xl relative w-full">
        <div className="pixel-titlebar relative flex items-center justify-between">
          <span className="pixel-dots" aria-hidden="true">
            <i /><i /><i />
          </span>
          <span className="pixel-text absolute left-1/2 -translate-x-1/2 text-[10px] tracking-wider font-bold whitespace-nowrap">
            COMMUNITY CHAT
          </span>
          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={refreshMessages}
              title="Refresh messages"
              className="hover:rotate-180 transition-transform duration-300 text-white/80 hover:text-white cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
            <span className="pixel-online">
              <span className={`pixel-live-dot ${isConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400'}`} />
              <span className="pixel-text text-[9px] uppercase">{isConnected ? `${onlineCount} ONLINE` : 'CONNECTING'}</span>
            </span>
          </div>
        </div>

        <div className="pixel-roombar flex items-center overflow-x-auto" aria-label="Chat rooms">
          <div className="flex gap-1.5">
            {ROOMS.map(room => (
              <button
                key={room.id}
                type="button"
                onClick={() => setCurrentRoom(room.id)}
                className={`pixel-room ${currentRoom === room.id ? 'is-active' : ''} cursor-pointer`}
              >
                <Hash className="w-3.5 h-3.5" />
                <span>{room.name}</span>
              </button>
            ))}
          </div>
        </div>

        {errorNotice && (
          <div className="px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-700 text-[11px] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errorNotice}
            </span>
            <span className="text-[9px] font-mono opacity-70">Demo Mode Active</span>
          </div>
        )}

        <div
          ref={listRef}
          onScroll={handleScroll}
          className="pixel-log relative"
          role="log"
          aria-live="polite"
          aria-label={`${currentRoom} chat messages`}
        >
          {isLoading && messages.length === 0 ? (
            <div className="flex-1 my-auto py-10 text-center flex flex-col items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="pixel-text text-[9px] text-foreground/50">LOADING FEED...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 my-auto py-10 text-center flex flex-col items-center justify-center text-foreground/50">
              <Sparkles className="w-5 h-5 mx-auto mb-1.5 text-primary/40 animate-bounce" />
              <p className="pixel-text text-[9px]">NO MESSAGES YET IN #{currentRoom}</p>
              <p className="text-xs text-foreground/40 mt-0.5">Be the first to leave a message!</p>
            </div>
          ) : (
            messages.map(m => {
              const isOwner = user && user.id === m.userId;
              const canDelete = isOwner || isAdmin;
              const isMsgAdmin = m.author.role === 'admin';
              const nameDisplay = m.author.displayName || 'MEMBER';
              const avatarSrc = normalizeAvatarUrl(m.author.avatarUrl);

              return (
                <div
                  key={m.id}
                  className={`pixel-msg group relative ${m.mine ? 'is-mine' : ''}`}
                >
                  <span className={`pixel-avatar ${toneFor(nameDisplay)}`} aria-hidden="true">
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      nameDisplay.slice(0, 1).toUpperCase()
                    )}
                  </span>

                  <div className="pixel-bubble relative">
                    <div className="pixel-meta">
                      <div className="flex items-center gap-1.5">
                        <span className="pixel-text font-black">{nameDisplay}</span>
                        {isMsgAdmin && (
                          <span className="px-1.5 py-0.5 rounded bg-primary text-white text-[8px] font-black tracking-widest leading-none">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <span className="pixel-time">{formatTime(m.createdAt)}</span>
                    </div>

                    <p className="pixel-body">{m.content}</p>

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(m)}
                        title="Delete message"
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity absolute -top-2 -right-2 p-1 bg-destructive text-white rounded-full shadow-md hover:scale-110 active:scale-95 cursor-pointer"
                        aria-label="Delete message"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {isScrolledUp && (
            <button
              type="button"
              onClick={() => scrollToBottom(true)}
              className="sticky bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-primary text-white text-[11px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 hover:bg-primary/90 transition-transform active:scale-95 z-10 cursor-pointer"
            >
              <ArrowDown className="w-3.5 h-3.5" /> Latest Messages
            </button>
          )}
        </div>

        {draftSlurWarning && (
          <div className="px-3 py-1.5 bg-destructive/10 border-t border-destructive/20 text-destructive text-[11px] font-bold flex items-center gap-1.5 animate-in fade-in">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Prohibited word detected. Please remove inappropriate terms before sending.</span>
          </div>
        )}

        {isAuthenticated && user ? (
          <form onSubmit={handleSend} className="pixel-composer relative flex flex-col gap-1">
            <div className="flex items-stretch gap-1.5 sm:gap-2 w-full">
              <div className="hidden sm:flex items-center px-2.5 py-1.5 bg-white border-2 border-[var(--pixel-ink)] shadow-[2px_2px_0_var(--pixel-ink)] text-xs font-bold shrink-0">
                <span className="truncate max-w-[90px] uppercase font-mono text-[10px] font-black">{user.displayName}</span>
              </div>

              <div className="pixel-message-wrap relative flex-1">
                <input
                  value={draft}
                  onChange={e => setDraft(e.target.value.slice(0, 280))}
                  maxLength={280}
                  placeholder={`Message #${currentRoom}...`}
                  aria-label="Message"
                  className={`pixel-input pixel-input-msg ${draftSlurWarning ? 'border-destructive focus:ring-destructive' : ''}`}
                  disabled={isSending}
                />

                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="pixel-smile hover:text-primary transition-colors cursor-pointer"
                  title="Add emoji"
                >
                  <Smile className="w-4 h-4" />
                </button>

                {showEmojiPicker && (
                  <div
                    ref={emojiPickerRef}
                    className="absolute bottom-full right-0 mb-2 p-2 bg-white border-2 border-[var(--pixel-ink)] shadow-[3px_3px_0_var(--pixel-ink)] rounded flex gap-1 z-20 flex-wrap max-w-[200px]"
                  >
                    {POPULAR_EMOJIS.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => addEmoji(emoji)}
                        className="p-1 hover:bg-black/5 rounded text-base transition-transform hover:scale-125 cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-foreground/45 shrink-0 px-1">
                {cooldownSeconds > 0 ? (
                  <span className="text-primary font-black flex items-center gap-0.5">
                    <Clock className="w-3 h-3" /> {cooldownSeconds}s
                  </span>
                ) : (
                  <span>{draft.length}/280</span>
                )}
              </div>

              <button
                type="submit"
                disabled={!draft.trim() || Boolean(draftSlurWarning) || cooldownSeconds > 0 || isSending}
                className="pixel-send disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                aria-label="Send message"
              >
                {isSending ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="sm:hidden flex justify-end items-center gap-1 text-[9px] font-mono text-foreground/45 px-0.5">
              {cooldownSeconds > 0 ? (
                <span className="text-primary font-black flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" /> {cooldownSeconds}s
                </span>
              ) : (
                <span>{draft.length}/280</span>
              )}
            </div>
          </form>
        ) : (
          <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 border-t-2 border-[var(--pixel-ink)] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                  JOIN THE CONVERSATION
                </h4>
                <p className="text-[11px] text-foreground/60">
                  Sign in or create a free account to chat and share feedback with the community.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="py-2 px-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-lg shadow-md hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" /> Sign In / Join
            </button>
          </div>
        )}
      </div>

      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative max-w-md w-full animate-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              className="absolute right-3.5 top-3.5 z-10 p-1.5 rounded-full bg-black/5 hover:bg-black/10 text-foreground/50 hover:text-foreground transition-all cursor-pointer"
              aria-label="Close authentication modal"
            >
              <X className="w-4 h-4" />
            </button>
            <AuthModal
              initialMode="signin"
              isInline={false}
              onSuccess={() => setShowAuthModal(false)}
            />
          </div>
        </div>
      )}
    </section>
  );
}
