import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AxolotlSvg, MascotMood } from './axolotl-svg';
import { playMascotSound } from './axolotl-sfx';

export interface AxolotlMascotProps {
  mood?: MascotMood;
  defaultMood?: MascotMood;
  speech?: string;
  showSpeech?: boolean;
  interactive?: boolean;
  soundEnabled?: boolean;
  autoSleep?: boolean;
  trackPointer?: boolean;
  className?: string;
  bubbleClassName?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero' | number;
  onMoodChange?: (mood: MascotMood) => void;
  onZoneInteract?: (zone: string, mood: MascotMood, line: string) => void;
  onSnap?: () => void;
}

const DEFAULT_LINES: Record<MascotMood, string> = {
  idle: 'Hi! Ready to snap?',
  wink: 'Psst, say cheese!',
  happy: 'Yay, photo time!',
  love: 'You look amazing! ♥',
  surprised: 'Whoa, flash!',
  sleepy: 'Zzz... poke me to wake me up',
};

export function AxolotlMascot({
  mood: controlledMood,
  defaultMood = 'idle',
  speech: customSpeech,
  showSpeech = true,
  interactive = true,
  soundEnabled = true,
  autoSleep = true,
  trackPointer = true,
  className = '',
  bubbleClassName = '',
  size = 'md',
  onMoodChange,
  onZoneInteract,
  onSnap,
}: AxolotlMascotProps) {
  const [internalMood, setInternalMood] = useState<MascotMood>(defaultMood);
  const [currentLine, setCurrentLine] = useState<string>(customSpeech || DEFAULT_LINES[defaultMood]);
  const [isSquishing, setIsSquishing] = useState(false);
  const [isWagging, setIsWagging] = useState(false);
  const [isTickling, setIsTickling] = useState(false);
  const [lookOffset, setLookOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const rootRef = useRef<HTMLDivElement>(null);
  const sleepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const downRef = useRef<{ zone: string; x: number; y: number } | null>(null);
  const petDistanceRef = useRef(0);
  const wasPettedRef = useRef(false);
  const tapCountRef = useRef(0);

  const activeMood = controlledMood ?? internalMood;

  // Sync external speech override
  useEffect(() => {
    if (customSpeech) {
      setCurrentLine(customSpeech);
    }
  }, [customSpeech]);

  // Haptics helper
  const triggerHaptic = (pattern: number | number[]) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {
      // ignore
    }
  };

  // Sound helper
  const playSound = useCallback((type: Parameters<typeof playMascotSound>[0]) => {
    if (soundEnabled) {
      playMascotSound(type);
    }
  }, [soundEnabled]);

  // Set mood and message
  const setMood = useCallback((newMood: MascotMood, line?: string) => {
    if (!controlledMood) {
      setInternalMood(newMood);
    }
    const chosenLine = line || DEFAULT_LINES[newMood];
    setCurrentLine(chosenLine);
    if (onMoodChange) {
      onMoodChange(newMood);
    }
  }, [controlledMood, onMoodChange]);

  // Squish animation trigger
  const triggerSquish = useCallback(() => {
    setIsSquishing(false);
    requestAnimationFrame(() => {
      setIsSquishing(true);
      setTimeout(() => setIsSquishing(false), 450);
    });
  }, []);

  // Sleep & wake management
  const resetSleepTimer = useCallback(() => {
    if (!autoSleep) return;
    if (sleepTimerRef.current) {
      clearTimeout(sleepTimerRef.current);
    }
    sleepTimerRef.current = setTimeout(() => {
      setMood('sleepy', 'Zzz... poke me to wake me up');
      playSound('sleep');
    }, 14000);
  }, [autoSleep, setMood, playSound]);

  const wakeUp = useCallback(() => {
    if (activeMood === 'sleepy') {
      setMood('surprised', "Oh! You're back! ✨");
      playSound('wake');
      triggerSquish();
      triggerHaptic([15, 30]);
    }
    resetSleepTimer();
  }, [activeMood, setMood, playSound, triggerSquish, resetSleepTimer]);

  // Periodic random idle winks
  useEffect(() => {
    if (!interactive) return;
    const interval = setInterval(() => {
      if (activeMood === 'idle') {
        setMood('wink');
        setTimeout(() => {
          setMood('idle');
        }, 1300);
      }
    }, 8500);
    return () => clearInterval(interval);
  }, [activeMood, interactive, setMood]);

  // Start sleep timer on mount
  useEffect(() => {
    resetSleepTimer();
    return () => {
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    };
  }, [resetSleepTimer]);

  // Eye pupil tracking
  useEffect(() => {
    if (!trackPointer || typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!rootRef.current || activeMood === 'sleepy') {
        setLookOffset({ x: 0, y: 0 });
        return;
      }

      const rect = rootRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) / (window.innerWidth || 1);
      const deltaY = (e.clientY - centerY) / (window.innerHeight || 1);

      // Clamp pupil travel for natural, cute look
      const clampedX = Math.max(-16, Math.min(16, deltaX * 22));
      const clampedY = Math.max(-10, Math.min(10, deltaY * 16));

      setLookOffset({
        x: Number(clampedX.toFixed(1)),
        y: Number(clampedY.toFixed(1)),
      });
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [trackPointer, activeMood]);

  // Zone interactions
  const handleZonePointerDown = (zone: string, e: React.PointerEvent<SVGSVGElement>) => {
    if (!interactive) return;
    downRef.current = { zone, x: e.clientX, y: e.clientY };
    petDistanceRef.current = 0;
    wasPettedRef.current = false;
    wakeUp();
  };

  const handleZonePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!interactive || !downRef.current) return;

    // Petting head detection (dragging / rubbing head)
    if (downRef.current.zone === 'head') {
      const dist = Math.abs(e.clientX - downRef.current.x) + Math.abs(e.clientY - downRef.current.y);
      petDistanceRef.current += dist;
      downRef.current.x = e.clientX;
      downRef.current.y = e.clientY;

      if (petDistanceRef.current > 180) {
        petDistanceRef.current = 0;
        wasPettedRef.current = true;
        setMood('love', 'Mmm, that feels nice... ♥');
        playSound('purr');
        triggerHaptic([15, 20]);
        if (onZoneInteract) onZoneInteract('head', 'love', 'Mmm, that feels nice... ♥');
      }
    }
  };

  const handleZonePointerUp = () => {
    downRef.current = null;
  };

  const handleZoneClick = (zone: string) => {
    if (!interactive) return;
    wakeUp();

    if (wasPettedRef.current) {
      wasPettedRef.current = false;
      return;
    }

    triggerSquish();

    let newMood: MascotMood = 'happy';
    let line = '';

    if (zone === 'belly') {
      newMood = 'happy';
      line = 'Hehe, that tickles! 🌸';
      playSound('giggle');
      triggerHaptic([10, 15]);
    } else if (zone === 'gill') {
      newMood = 'surprised';
      line = 'My gills! Wiggle wiggle~ ✨';
      setIsTickling(true);
      setTimeout(() => setIsTickling(false), 1400);
      playSound('flutter');
      triggerHaptic([15, 20, 15]);
    } else if (zone === 'tail') {
      newMood = 'love';
      line = 'Tail wag! Swish~ 💕';
      setIsWagging(true);
      setTimeout(() => setIsWagging(false), 1600);
      playSound('purr');
      triggerHaptic([20, 25]);
    } else if (zone === 'arm') {
      newMood = 'wink';
      line = 'High five, bestie! ✋✨';
      playSound('highfive');
      triggerHaptic([20]);
    } else {
      tapCountRef.current += 1;
      if (tapCountRef.current % 5 === 0) {
        newMood = 'love';
        line = 'Okay okay, I love you too! 💕';
        playSound('purr');
      } else {
        const pool: MascotMood[] = ['happy', 'wink', 'love', 'surprised'];
        newMood = pool[Math.floor(Math.random() * pool.length)];
        line = DEFAULT_LINES[newMood];
        playSound('giggle');
      }
      triggerHaptic([15]);
    }

    setMood(newMood, line);
    if (onZoneInteract) {
      onZoneInteract(zone, newMood, line);
    }
  };

  // Camera snap routine
  const handleSnapPose = () => {
    wakeUp();
    setMood('happy', '3...');
    playSound('highfive');
    triggerHaptic([15]);

    setTimeout(() => {
      setCurrentLine('2...');
      triggerHaptic([15]);
    }, 800);

    setTimeout(() => {
      setMood('wink', '1... Say cheese!');
      triggerHaptic([15]);
    }, 1600);

    setTimeout(() => {
      setMood('happy', 'Snap! So cute! 📸✨');
      triggerSquish();
      playSound('snap');
      triggerHaptic([30, 40]);
      if (onSnap) onSnap();
    }, 2400);
  };

  // Size styling
  const sizeStyles: Record<string, string> = {
    sm: 'max-w-[130px]',
    md: 'max-w-[210px]',
    lg: 'max-w-[300px]',
    hero: 'max-w-[380px]',
  };
  const sizeClass = typeof size === 'string' ? sizeStyles[size] || 'max-w-[210px]' : '';
  const inlineWidth = typeof size === 'number' ? `${size}px` : undefined;

  return (
    <div
      ref={rootRef}
      className={`relative flex flex-col items-center justify-center select-none ${className}`}
      style={{ width: inlineWidth }}
    >
      {/* Interactive Speech Bubble */}
      {showSpeech && (
        <div
          data-testid="mascot-speech-bubble"
          className={`relative mb-2.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-white/95 dark:bg-zinc-800/95 backdrop-blur-md border-2 border-pink-200 dark:border-pink-900/60 shadow-[0_6px_20px_rgba(245,61,137,0.15)] text-center transition-all duration-300 transform-gpu cursor-pointer group hover:scale-105 active:scale-95 ${bubbleClassName}`}
          onClick={() => {
            wakeUp();
            triggerSquish();
            const pool: MascotMood[] = ['happy', 'wink', 'love', 'surprised'];
            const next = pool[Math.floor(Math.random() * pool.length)];
            setMood(next);
            playSound('giggle');
          }}
          title="Click to talk with me!"
        >
          <span className="font-bold text-[11.5px] sm:text-xs text-foreground/90 tracking-wide font-sans leading-snug">
            {currentLine}
          </span>
          {/* Bubble tail arrow pointing down to head */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-zinc-800 border-r-2 border-b-2 border-pink-200 dark:border-pink-900/60 transform rotate-45" />
        </div>
      )}

      {/* Axolotl SVG Hero with gentle ambient bobbing */}
      <div
        className={`w-full ${sizeClass} transform-gpu will-change-transform`}
        style={{
          animation: interactive && activeMood !== 'sleepy' ? 'pk-bob 3.2s ease-in-out infinite' : undefined,
        }}
      >
        <AxolotlSvg
          mood={activeMood}
          isSquishing={isSquishing}
          isWagging={isWagging}
          isTickling={isTickling}
          lookOffset={lookOffset}
          onZoneClick={handleZoneClick}
          onZonePointerDown={handleZonePointerDown}
          onZonePointerMove={handleZonePointerMove}
          onZonePointerUp={handleZonePointerUp}
          className="w-full h-auto cursor-pointer drop-shadow-[0_12px_24px_rgba(208,67,111,0.2)]"
        />
      </div>

      <style>{`
        @keyframes pk-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }
      `}</style>
    </div>
  );
}
