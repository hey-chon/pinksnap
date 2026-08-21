import { useEffect, useRef, useState } from 'react';
import { Hash, Send, ShieldCheck, Smile, Users } from 'lucide-react';

type ChatMessage = {
  id: string;
  name: string;
  text: string;
  time: string;
  mine?: boolean;
};

const clock = (d = new Date()) =>
  d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

const seed: ChatMessage[] = [

];

const AVATAR_TONES = ['tone-a', 'tone-b', 'tone-c', 'tone-d'];
const toneFor = (name: string) =>
  AVATAR_TONES[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_TONES.length];

export default function CommunityChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(seed);
  const [draft, setDraft] = useState('');
  const [name, setName] = useState('');
  const [room, setRoom] = useState('general');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim().slice(0, 240);
    if (!text) return;
    setMessages(prev => [...prev, {
      id: `${Date.now()}`,
      name: (name.trim() || 'YOU').toUpperCase().slice(0, 12),
      text, time: clock(), mine: true,
    }]);
    setDraft('');
  };

  return (
    <section
      id="community-chat"
      className="w-full"
      aria-labelledby="community-chat-title"
    >
      <div className="text-center mb-7">
        <span className="booth-heading-kicker mb-3">BOOTH.CHAT</span>
        <h1 id="community-chat-title" className="font-display text-[2.5rem] leading-[.95] sm:text-6xl mt-4">
          COMMUNITY <span className="text-primary">CHAT</span>
        </h1>
        <p className="mt-3 text-sm sm:text-base text-foreground/65 font-medium">
          This community chat is built for feedbacks and future improvements. Please keep the chat clean and be mindful with your words, no spams, no malicious and inappropriate messages. Thank you!  
        </p>
      </div>

      <div className="pixel-panel">
        <div className="pixel-titlebar relative">
          <span className="pixel-dots" aria-hidden="true"><i /><i /><i /></span>
          <span className="pixel-text absolute left-1/2 -translate-x-1/2">PINKSNAP.CHAT</span>
          <span className="pixel-online"><span className="pixel-live-dot" /> <Users className="w-3.5 h-3.5" /><span className="pixel-text">FEEDBACK</span></span>
        </div>
        <div className="pixel-roombar" aria-label="Chat rooms">
          {['general'].map(item => (
            <button key={item} type="button" onClick={() => setRoom(item)} className={`pixel-room ${room === item ? 'is-active' : ''}`}>
              <Hash className="w-3.5 h-3.5" /> {item}
            </button>
          ))}
        </div>
        <div ref={listRef} className="pixel-log" role="log" aria-live="polite" aria-label={`${room} chat messages`}>
          {messages.map(m => (
            <div key={m.id} className={`pixel-msg${m.mine ? ' is-mine' : ''}`}>
              <span className={`pixel-avatar ${toneFor(m.name)}`} aria-hidden="true">{m.name.slice(0, 1)}</span>
              <div className="pixel-bubble">
                <div className="pixel-meta"><span className="pixel-text">{m.name}</span><span className="pixel-time">{m.time}</span></div>
                <p className="pixel-body">{m.text}</p>
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={send} className="pixel-composer">
          <input value={name} onChange={e => setName(e.target.value)} maxLength={12} placeholder="NAME" aria-label="Your display name" className="pixel-input pixel-input-name" />
          <div className="pixel-message-wrap">
            <input value={draft} onChange={e => setDraft(e.target.value)} maxLength={240} placeholder={`Message #${room}...`} aria-label="Message" className="pixel-input pixel-input-msg" />
            <Smile className="pixel-smile" aria-hidden="true" />
          </div>
          <button type="submit" className="pixel-send" aria-label="Send message"><Send className="w-4 h-4" /></button>
        </form>
      </div>
      <div className="mt-4 flex items-center justify-center gap-2 text-center text-[.68rem] font-bold uppercase tracking-[.14em] text-foreground/45">
        <ShieldCheck className="w-4 h-4 text-primary/70" /> Be kind — everyone is here for the feedback, suggestions and future improvements.
      </div>
    </section>
  );
}