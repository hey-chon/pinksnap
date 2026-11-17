import React, { useState, useEffect, useRef } from 'react';
import { AxolotlSvg, MascotMood } from '@/components/axolotl/axolotl-svg';
import { playMascotSound } from '@/components/axolotl/axolotl-sfx';
import { Sparkles, Heart, ShieldAlert, Smile, Volume2, VolumeX, ChevronRight, ChevronLeft } from 'lucide-react';

interface AdviceItem {
  id: number;
  mood: MascotMood;
  title: string;
  badge: string;
  message: string;
  actionHint: string;
}

const CHAT_ADVICE_TIPS: AdviceItem[] = [
  {
    id: 1,
    mood: 'love',
    title: 'Spread Kindness',
    badge: 'BE RESPECTFUL',
    message: 'Be sweet and uplifting! Treat every PinkSnap bestie with kindness and friendly energy! 💕',
    actionHint: 'Axolotl is feeling the love!',
  },
  {
    id: 2,
    mood: 'surprised',
    title: 'Protect Privacy',
    badge: 'STAY SAFE',
    message: 'Never share private details! Keep your full name, passwords, phone numbers, and addresses secret! 🔒',
    actionHint: 'Axolotl says safety first!',
  },
  {
    id: 3,
    mood: 'wink',
    title: 'Keep It Clean',
    badge: 'WHOLESOME VIBES',
    message: 'No mean words, swearing, or bullying! Let’s keep this a safe, cute space for everyone! 🌸',
    actionHint: 'Axolotl gives a wink of approval!',
  },
  {
    id: 4,
    mood: 'happy',
    title: 'Share Photobooth Fun',
    badge: 'BE CREATIVE',
    message: 'Talk about your favorite photo strips, cute aesthetic ideas, and photobooth memories! ✨',
    actionHint: 'Axolotl is excited to see your snaps!',
  },
  {
    id: 5,
    mood: 'idle',
    title: 'No Flooding or Spam',
    badge: 'THOUGHTFUL CHAT',
    message: 'Please don’t spam or send repeated messages. Give everyone room to chat and be heard! 🎀',
    actionHint: 'Axolotl is listening calmly!',
  },
  {
    id: 6,
    mood: 'wink',
    title: 'Look Out for Others',
    badge: 'COMMUNITY LOVE',
    message: 'See someone being negative? Report it to our moderators so we keep PinkSnap super safe! 🛡️',
    actionHint: 'Axolotl has your back!',
  },
];

export function ChatAxolotlGuide() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isSquishing, setIsSquishing] = useState(false);
  const [isWagging, setIsWagging] = useState(false);
  const [isTickling, setIsTickling] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lookOffset, setLookOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeAdvice = CHAT_ADVICE_TIPS[currentIdx];

  const triggerHaptic = (pattern: number | number[]) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {}
  };

  const playSound = (type: Parameters<typeof playMascotSound>[0]) => {
    if (soundEnabled) {
      playMascotSound(type);
    }
  };

  // Squish animation helper
  const triggerSquish = () => {
    setIsSquishing(false);
    requestAnimationFrame(() => {
      setIsSquishing(true);
      setTimeout(() => setIsSquishing(false), 450);
    });
  };

  // Switch to next advice tip
  const handleNextTip = () => {
    setCurrentIdx((prev) => (prev + 1) % CHAT_ADVICE_TIPS.length);
    triggerSquish();
    triggerHaptic([15]);
    playSound('highfive');
  };

  const handlePrevTip = () => {
    setCurrentIdx((prev) => (prev - 1 + CHAT_ADVICE_TIPS.length) % CHAT_ADVICE_TIPS.length);
    triggerSquish();
    triggerHaptic([15]);
    playSound('giggle');
  };

  // Auto-advance advice messages periodically
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % CHAT_ADVICE_TIPS.length);
    }, 7500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Eye tracking following cursor everywhere
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height * 0.45; // mascot eye height

      const deltaX = (e.clientX - centerX) / (window.innerWidth || 1);
      const deltaY = (e.clientY - centerY) / (window.innerHeight || 1);

      const clampedX = Math.max(-18, Math.min(18, deltaX * 28));
      const clampedY = Math.max(-12, Math.min(12, deltaY * 20));

      setLookOffset({
        x: Number(clampedX.toFixed(1)),
        y: Number(clampedY.toFixed(1)),
      });
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  // Interactive mascot body zone clicks
  const handleZoneClick = (zone: string) => {
    triggerSquish();
    if (zone === 'belly') {
      setIsTickling(false);
      playSound('giggle');
      triggerHaptic([10, 15]);
    } else if (zone === 'gill') {
      setIsTickling(true);
      setTimeout(() => setIsTickling(false), 1400);
      playSound('flutter');
      triggerHaptic([15, 20]);
    } else if (zone === 'tail') {
      setIsWagging(true);
      setTimeout(() => setIsWagging(false), 1600);
      playSound('purr');
      triggerHaptic([20, 25]);
    } else if (zone === 'arm') {
      playSound('highfive');
      triggerHaptic([20]);
    } else {
      playSound('giggle');
      triggerHaptic([15]);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center select-none w-full max-w-[420px] mx-auto"
    >
      <style>{`
        .cinematic-glow-pink {
          text-shadow: 
            0 0 18px rgba(245, 61, 137, 0.65),
            0 0 40px rgba(245, 61, 137, 0.4),
            0 0 70px rgba(245, 61, 137, 0.22);
          animation: cinematicGlowPulse 3.5s ease-in-out infinite alternate;
        }
        @keyframes cinematicGlowPulse {
          0% {
            text-shadow: 
              0 0 14px rgba(245, 61, 137, 0.5),
              0 0 32px rgba(245, 61, 137, 0.25);
          }
          100% {
            text-shadow: 
              0 0 24px rgba(245, 61, 137, 0.85),
              0 0 52px rgba(245, 61, 137, 0.5),
              0 0 85px rgba(245, 61, 137, 0.28);
          }
        }
        .axolotl-chat-bob {
          animation: axolotlChatBobbing 3.8s ease-in-out infinite;
        }
        @keyframes axolotlChatBobbing {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>

      {/* Radiant Pink Glow Aura in Background */}
      <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-[340px] h-[340px] bg-gradient-to-br from-primary/30 via-pink-400/20 to-transparent rounded-full blur-[90px] -z-10" />

      {/* Header Badge */}
      <div className="w-full text-center mb-4">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/70 dark:bg-zinc-800/70 backdrop-blur-md border border-pink-200 dark:border-pink-900/50 shadow-sm mb-2">
          <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
            COMMUNITY GUARDIAN
          </span>
        </div>

        <h2 className="font-hero text-2xl sm:text-3xl text-foreground uppercase tracking-tight leading-none">
          <span className="text-white drop-shadow-sm mr-1.5">PINKSNAP</span>
          <span className="text-primary cinematic-glow-pink">AXOLOTL</span>
        </h2>
        <p className="text-[11px] font-bold text-foreground/55 uppercase tracking-wider mt-1">
          Chat Guidelines & Kindness Advocate
        </p>
      </div>

      {/* Stage: Big Axolotl with Speech Bubble on Right-Top */}
      <div className="relative w-full flex flex-col items-center">
        {/* ── SPEECH BUBBLE: Positioned on the RIGHT TOP of Axolotl ── */}
        <div
          onClick={handleNextTip}
          data-testid="axolotl-chat-advice-bubble"
          title="Click for next responsible chat tip!"
          className="relative lg:absolute lg:top-[-10px] lg:right-[-25px] xl:right-[-45px] z-20 w-full lg:w-[260px] xl:w-[285px] mb-4 lg:mb-0 p-3.5 sm:p-4 rounded-3xl bg-white/95 dark:bg-zinc-800/95 backdrop-blur-xl border-2 border-pink-300 dark:border-pink-800/70 shadow-[0_14px_35px_rgba(245,61,137,0.22)] cursor-pointer group hover:scale-[1.03] active:scale-[0.98] transition-all duration-300"
        >
          {/* Tip Category Badge & Sound toggle */}
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950/80 text-primary text-[9px] font-black tracking-wider uppercase border border-pink-200 dark:border-pink-800">
              <Heart className="w-2.5 h-2.5 fill-current" />
              {activeAdvice.badge}
            </span>

            <div className="flex items-center gap-1">
              <span className="text-[9px] font-mono font-bold text-foreground/45">
                {currentIdx + 1}/{CHAT_ADVICE_TIPS.length}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSoundEnabled(!soundEnabled);
                }}
                className="p-1 rounded-full text-foreground/50 hover:text-primary transition-colors"
                title={soundEnabled ? 'Mute sound' : 'Enable sound'}
              >
                {soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Advice Text */}
          <p className="text-xs sm:text-[12.5px] font-bold text-foreground/90 leading-snug tracking-wide">
            {activeAdvice.message}
          </p>

          {/* Action indicator & tap cue */}
          <div className="mt-2.5 pt-2 border-t border-dashed border-pink-200 dark:border-pink-900/40 flex items-center justify-between text-[9.5px] font-bold text-primary">
            <span className="opacity-80 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              {activeAdvice.actionHint}
            </span>
            <span className="text-[9px] font-mono tracking-wider opacity-60 group-hover:opacity-100 flex items-center">
              NEXT TIP <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>

          {/* Speech Bubble Arrow pointing towards Axolotl (down-left) on desktop */}
          <div className="hidden lg:block absolute -bottom-2 left-6 w-4 h-4 bg-white dark:bg-zinc-800 border-r-2 border-b-2 border-pink-300 dark:border-pink-800/70 transform rotate-45" />
          {/* Speech Bubble Arrow pointing down on mobile */}
          <div className="block lg:hidden absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-zinc-800 border-r-2 border-b-2 border-pink-300 dark:border-pink-800/70 transform rotate-45" />
        </div>

        {/* ── BIG AXOLOTL MASCOT on Desktop ── */}
        <div
          className="w-[240px] sm:w-[280px] lg:w-[320px] xl:w-[350px] axolotl-chat-bob transform-gpu will-change-transform drop-shadow-[0_16px_36px_rgba(208,67,111,0.28)]"
          title="Poke my belly, tickle my gills, or touch my tail!"
        >
          <AxolotlSvg
            mood={activeAdvice.mood}
            isSquishing={isSquishing}
            isWagging={isWagging}
            isTickling={isTickling}
            lookOffset={lookOffset}
            onZoneClick={handleZoneClick}
            className="w-full h-auto cursor-pointer"
          />
        </div>

        {/* Tip Navigation Controls Pill */}
        <div className="mt-4 flex items-center gap-2 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-pink-200 dark:border-pink-900/40 shadow-sm">
          <button
            type="button"
            onClick={handlePrevTip}
            aria-label="Previous tip"
            className="p-1 rounded-full text-foreground/60 hover:text-primary hover:bg-pink-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <span className="text-[10px] font-black uppercase tracking-wider text-foreground/75 px-1.5">
            TIP {currentIdx + 1} OF {CHAT_ADVICE_TIPS.length}
          </span>

          <button
            type="button"
            onClick={handleNextTip}
            aria-label="Next tip"
            className="p-1 rounded-full text-foreground/60 hover:text-primary hover:bg-pink-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
