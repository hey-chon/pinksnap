import React, { useState, useEffect, useRef } from 'react';
import { AxolotlSvg, MascotMood } from '@/components/axolotl/axolotl-svg';
import { playMascotSound } from '@/components/axolotl/axolotl-sfx';

export function ChatAxolotlGuide() {
  const [mood, setMood] = useState<MascotMood>('idle');
  const [isSquishing, setIsSquishing] = useState(false);
  const [isWagging, setIsWagging] = useState(false);
  const [isTickling, setIsTickling] = useState(false);
  const [lookOffset, setLookOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  const triggerHaptic = (pattern: number | number[]) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {}
  };

  const playSound = (type: Parameters<typeof playMascotSound>[0]) => {
    playMascotSound(type);
  };

  // Squish animation helper
  const triggerSquish = () => {
    setIsSquishing(false);
    requestAnimationFrame(() => {
      setIsSquishing(true);
      setTimeout(() => setIsSquishing(false), 450);
    });
  };

  // Periodic playful idle winks
  useEffect(() => {
    const interval = setInterval(() => {
      if (mood === 'idle') {
        setMood('wink');
        setTimeout(() => setMood('idle'), 1300);
      }
    }, 7000);
    return () => clearInterval(interval);
  }, [mood]);

  // Eye tracking: pupils follow cursor/finger everywhere on screen
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height * 0.42; // eyes height

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
      setMood('happy');
      setIsTickling(false);
      playSound('giggle');
      triggerHaptic([10, 15]);
      setTimeout(() => setMood('idle'), 2000);
    } else if (zone === 'gill') {
      setMood('surprised');
      setIsTickling(true);
      setTimeout(() => setIsTickling(false), 1400);
      playSound('flutter');
      triggerHaptic([15, 20]);
      setTimeout(() => setMood('idle'), 2000);
    } else if (zone === 'tail') {
      setMood('love');
      setIsWagging(true);
      setTimeout(() => setIsWagging(false), 1600);
      playSound('purr');
      triggerHaptic([20, 25]);
      setTimeout(() => setMood('idle'), 2000);
    } else if (zone === 'arm') {
      setMood('wink');
      playSound('highfive');
      triggerHaptic([20]);
      setTimeout(() => setMood('idle'), 2000);
    } else {
      setMood('happy');
      playSound('giggle');
      triggerHaptic([15]);
      setTimeout(() => setMood('idle'), 2000);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center select-none w-full"
    >
      <style>{`
        .axolotl-chat-bob {
          animation: axolotlChatBobbing 3.8s ease-in-out infinite;
        }
        @keyframes axolotlChatBobbing {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>

      {/* Radiant Pink Glow Aura in Background */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[420px] lg:w-[480px] h-[340px] sm:h-[420px] lg:h-[480px] bg-gradient-to-br from-primary/35 via-pink-400/25 to-transparent rounded-full blur-[95px] -z-10" />

      {/* ── BIG AXOLOTL MASCOT ONLY (Clean, No Chat Bubbles or Other Elements) ── */}
      <div
        className="w-[270px] sm:w-[330px] lg:w-[390px] xl:w-[440px] 2xl:w-[480px] axolotl-chat-bob transform-gpu will-change-transform drop-shadow-[0_20px_45px_rgba(208,67,111,0.32)]"
        title="PinkSnap Axolotl Mascot"
      >
        <AxolotlSvg
          mood={mood}
          isSquishing={isSquishing}
          isWagging={isWagging}
          isTickling={isTickling}
          lookOffset={lookOffset}
          onZoneClick={handleZoneClick}
          className="w-full h-auto cursor-pointer"
        />
      </div>
    </div>
  );
}
