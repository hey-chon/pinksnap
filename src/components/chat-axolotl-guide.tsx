import React, { useState, useEffect, useRef } from 'react';
import { AxolotlSvg } from '@/components/axolotl/axolotl-svg';
import { Sparkles, Heart } from 'lucide-react';

export function ChatAxolotlGuide() {
  const [lookOffset, setLookOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Eye tracking: pupils follow the user's cursor/touch across the screen
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height * 0.18; // eye level with raised head

      const deltaX = (e.clientX - centerX) / (window.innerWidth || 1);
      const deltaY = (e.clientY - centerY) / (window.innerHeight || 1);

      // Smooth bounded pupil travel
      const clampedX = Math.max(-18, Math.min(18, deltaX * 26));
      const clampedY = Math.max(-12, Math.min(12, deltaY * 18));

      setLookOffset({
        x: Number(clampedX.toFixed(1)),
        y: Number(clampedY.toFixed(1)),
      });
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center select-none w-full max-w-[360px] sm:max-w-[410px] xl:max-w-[450px] mx-auto"
    >
      <style>{`
        .axolotl-chat-bob {
          animation: axolotlFullBobbing 3.8s ease-in-out infinite;
        }
        @keyframes axolotlFullBobbing {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>

      {/* Radiant Soft Pink Glow Aura in Background */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[420px] lg:w-[480px] h-[340px] sm:h-[420px] lg:h-[480px] bg-gradient-to-br from-primary/30 via-pink-400/20 to-transparent rounded-full blur-[90px] -z-10" />

      {/* ── FULL BODY AXOLOTL HOLDING BIG PRESENTATION CARD ── */}
      <div className="relative w-full axolotl-chat-bob transform-gpu will-change-transform">
        {/* Layer 1 (z-0): Full Body Axolotl with Head Raised High & Default Happy Arms Removed */}
        <div className="w-full drop-shadow-[0_18px_40px_rgba(208,67,111,0.26)]">
          <AxolotlSvg
            mood="happy"
            hideArms={true}
            headOffsetY={-55}
            lookOffset={lookOffset}
            className="w-full h-auto block"
          />
        </div>

        {/* Layer 2 (z-20): The Big Cute Presentation Card Held Right Below Her Chin */}
        {/* Positioned at top-[46.5%] so her head is 100% visible above, and legs/feet are 100% visible below! */}
        <div className="absolute top-[46.5%] left-1/2 -translate-x-1/2 w-[92%] sm:w-[94%] z-20 pointer-events-none">
          <div className="relative rounded-[22px] sm:rounded-[26px] bg-white/98 dark:bg-zinc-900/98 backdrop-blur-xl border-2 border-pink-200/90 dark:border-pink-900/60 p-3.5 sm:p-4 shadow-[0_16px_36px_rgba(0,0,0,0.13),0_6px_16px_rgba(245,61,137,0.18)] flex flex-col gap-2">
            
            {/* Top Card Header */}
            <div className="flex items-center justify-between border-b border-dashed border-pink-200 dark:border-pink-900/50 pb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="font-mono text-[9px] sm:text-[9.5px] font-black uppercase tracking-[0.2em] text-foreground/60">
                  COMMUNITY CHAT
                </span>
              </div>
              <div className="flex items-center gap-1 text-primary">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="font-hero text-xs sm:text-sm tracking-wider">PINKSNAP</span>
              </div>
            </div>

            {/* Note for Everyone */}
            <div className="py-0.5">
              <p className="font-sans text-[11px] sm:text-[11.8px] font-bold text-foreground/85 leading-relaxed tracking-normal">
                Welcome to the community! Please remember to be polite, treat everyone with kindness, keep our chat wholesome, and never share private personal info. Let's make PinkSnap a sweet and safe space for all besties!
              </p>
            </div>

            {/* Card Footer */}
            <div className="pt-1.5 border-t border-dashed border-pink-200 dark:border-pink-900/50 flex items-center justify-between">
              <span className="text-[9px] sm:text-[9.5px] font-black text-primary flex items-center gap-1">
                <Heart className="w-2.5 h-2.5 fill-current" /> Safe & Friendly Space
              </span>
             
            </div>

            {/* ── Layer 3: Left Hand Clutching Left End of the Card ── */}
            <div
              className="absolute left-[-10px] sm:left-[-13px] top-1/2 -translate-y-1/2 z-30 pointer-events-none w-[26px] sm:w-[32px]"
              aria-hidden="true"
            >
              <svg viewBox="0 0 32 36" className="w-full h-auto drop-shadow-[0_4px_8px_rgba(208,67,111,0.38)]">
                <g stroke="#d0436f" strokeWidth="2.5" strokeLinejoin="round" fill="#ffc2d4">
                  {/* Palm coming from behind */}
                  <path d="M4 8 C4 18 8 28 18 30 C24 31 28 26 26 18 C25 10 18 6 10 6 Z" />
                  {/* 4 Little Clutched Axolotl Fingers gripping the front edge */}
                  <circle cx="16" cy="10" r="4.2" />
                  <circle cx="21" cy="14" r="4.2" />
                  <circle cx="22" cy="20" r="4.2" />
                  <circle cx="18" cy="25" r="4.2" />
                  {/* Highlights */}
                  <circle cx="16" cy="9" r="1.5" fill="#fff" stroke="none" opacity=".7" />
                  <circle cx="21" cy="13" r="1.5" fill="#fff" stroke="none" opacity=".7" />
                  <circle cx="22" cy="19" r="1.5" fill="#fff" stroke="none" opacity=".7" />
                  <circle cx="18" cy="24" r="1.5" fill="#fff" stroke="none" opacity=".7" />
                </g>
              </svg>
            </div>

            {/* ── Layer 4: Right Hand Clutching Right End of the Card ── */}
            <div
              className="absolute right-[-10px] sm:right-[-13px] top-1/2 -translate-y-1/2 z-30 pointer-events-none w-[26px] sm:w-[32px]"
              aria-hidden="true"
            >
              <svg viewBox="0 0 32 36" className="w-full h-auto drop-shadow-[0_4px_8px_rgba(208,67,111,0.38)]">
                <g
                  transform="translate(16 18) scale(-1 1) translate(-16 -18)"
                  stroke="#d0436f"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  fill="#ffc2d4"
                >
                  {/* Palm coming from behind */}
                  <path d="M4 8 C4 18 8 28 18 30 C24 31 28 26 26 18 C25 10 18 6 10 6 Z" />
                  {/* 4 Little Clutched Axolotl Fingers gripping the front edge */}
                  <circle cx="16" cy="10" r="4.2" />
                  <circle cx="21" cy="14" r="4.2" />
                  <circle cx="22" cy="20" r="4.2" />
                  <circle cx="18" cy="25" r="4.2" />
                  {/* Highlights */}
                  <circle cx="16" cy="9" r="1.5" fill="#fff" stroke="none" opacity=".7" />
                  <circle cx="21" cy="13" r="1.5" fill="#fff" stroke="none" opacity=".7" />
                  <circle cx="22" cy="19" r="1.5" fill="#fff" stroke="none" opacity=".7" />
                  <circle cx="18" cy="24" r="1.5" fill="#fff" stroke="none" opacity=".7" />
                </g>
              </svg>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
