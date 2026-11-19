import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Heart, ShieldCheck, Gift, Camera } from 'lucide-react';
import { AxolotlSvg } from '@/components/axolotl/axolotl-svg';

export function HomePurposeSection() {
  const [isRevealed, setIsRevealed] = useState(false);
  const [lookOffset, setLookOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const sectionRef = useRef<HTMLElement>(null);
  const mascotRef = useRef<HTMLDivElement>(null);

  // Smooth scroll-driven reveal without layout shift
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Eye tracking: pupils follow the user's cursor across the section
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!mascotRef.current) return;

      const rect = mascotRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height * 0.38; // eye height on axolotl

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
    <section
      id="purpose-section"
      ref={sectionRef}
      aria-labelledby="purpose-heading"
      className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 my-6 sm:my-10"
    >
      <style>{`
        .axolotl-purpose-float {
          animation: axolotlPurposeFloating 4.4s ease-in-out infinite;
        }
        @keyframes axolotlPurposeFloating {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .cinematic-glow-pink {
          text-shadow: 
            0 0 18px rgba(245, 61, 137, 0.55),
            0 0 42px rgba(245, 61, 137, 0.35),
            0 0 75px rgba(245, 61, 137, 0.18);
          animation: cinematicGlowPulse 3.8s ease-in-out infinite alternate;
        }
        @keyframes cinematicGlowPulse {
          0% {
            text-shadow: 
              0 0 14px rgba(245, 61, 137, 0.45),
              0 0 32px rgba(245, 61, 137, 0.22);
          }
          100% {
            text-shadow: 
              0 0 24px rgba(245, 61, 137, 0.75),
              0 0 52px rgba(245, 61, 137, 0.42),
              0 0 85px rgba(245, 61, 137, 0.22);
          }
        }
      `}</style>

      <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 xl:gap-16 w-full">
        
        {/* ── LEFT: Big PinkSnap Axolotl Pointing to the Right ── */}
        <div
          ref={mascotRef}
          className={`shrink-0 flex flex-col items-center justify-center relative transition-all duration-1000 ease-out transform ${
            isRevealed ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-[0.96]'
          }`}
        >
          {/* Radiant Soft Pink Glow Aura behind the mascot */}
          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[420px] lg:w-[480px] h-[340px] sm:h-[420px] lg:h-[480px] bg-gradient-to-br from-primary/30 via-pink-400/20 to-transparent rounded-full blur-[95px] -z-10" />

          {/* Big Axolotl Mascot pointing Right */}
          <div className="w-[270px] sm:w-[340px] md:w-[390px] lg:w-[430px] xl:w-[460px] axolotl-purpose-float drop-shadow-[0_20px_45px_rgba(208,67,111,0.26)]">
            <AxolotlSvg
              mood="happy"
              armPose="pointing-right"
              lookOffset={lookOffset}
              className="w-full h-auto block select-none pointer-events-none"
            />
          </div>

          {/* Under-mascot cute label */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 dark:bg-zinc-800/70 backdrop-blur-md border border-pink-200/80 dark:border-pink-900/40 shadow-xs">
            <Heart className="w-3 h-3 text-primary fill-current" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/75">
              OFFICIAL MASCOT
            </span>
          </div>
        </div>

        {/* ── RIGHT: The Classic Purpose Container (Where she points) ── */}
        <div
          className={`flex-1 min-w-0 w-full transition-all duration-1000 delay-150 ease-out transform ${
            isRevealed ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-[0.97]'
          }`}
        >
          <div className="relative rounded-[32px] sm:rounded-[36px] bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border border-black/10 dark:border-white/10 shadow-[0_24px_65px_-15px_rgba(245,61,137,0.18)] p-6 sm:p-9 lg:p-11 flex flex-col justify-between overflow-hidden group">
            
            {/* Top vintage stamp & purpose badge */}
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-4 mb-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.22em] text-primary">
                  THE PURPOSE
                </span>
              </div>
              <span className="font-mono text-[9px] sm:text-[10px] font-bold text-foreground/45 uppercase tracking-widest">
                EST. 2026 · PHILIPPINES
              </span>
            </div>

            {/* Headline */}
            <h2
              id="purpose-heading"
              className="font-hero text-3xl sm:text-4xl lg:text-5xl text-foreground uppercase tracking-tight leading-[0.92] mb-4"
            >
              WHY WE BUILT <span className="text-primary cinematic-glow-pink">PINKSNAP.</span>
            </h2>

            {/* Pullquote */}
            <div className="relative pl-4 border-l-2 border-primary/60 my-2">
              <p className="font-sans font-bold text-sm sm:text-base text-foreground/90 italic leading-snug">
                "Because memories made with the people you love should never be locked behind expensive machines, subscriptions, or lost in a camera roll."
              </p>
            </div>

            {/* Authentic Narrative Body */}
            <div className="space-y-3.5 my-4 text-xs sm:text-[13.5px] font-medium text-foreground/75 leading-relaxed">
              <p>
                There's an irreplaceable magic when you step into a physical photobooth—the rush of the countdown, the spontaneous silly poses, the uncontrollable giggles, and holding that freshly dispensed warm strip of paper that freezes who you were in that exact second.
              </p>
              <p>
                In real life, traditional photobooths are often hard to find, cost hundreds of pesos per print, and keep memories on paper scraps that get faded or lost. We wanted to bring that exact tactile, nostalgic joy to everyone in the world, right in their pocket.
              </p>
              <p>
                PinkSnap was crafted with a simple promise: <strong className="font-black text-foreground">100% free</strong>, <strong className="font-black text-foreground">100% private</strong>, with zero subscriptions and zero ads. Your camera feed and photos never touch a remote server—everything renders natively on your device. Whether you're laughing with friends at 2 AM, keeping long-distance memories, or celebrating an ordinary Tuesday, PinkSnap is your personal keepsake maker.
              </p>
            </div>

            {/* Bottom Signature & Pillars */}
            <div className="pt-4 mt-2 border-t border-black/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-xs font-black text-primary uppercase tracking-wider">
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span>Crafted for memory keepers everywhere</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono font-bold text-foreground/50">
                <span className="px-2.5 py-1 rounded-lg bg-foreground/[0.04] border border-foreground/5">
                  ✓ 100% Client-Side
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-foreground/[0.04] border border-foreground/5">
                  ✓ Free Forever
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-foreground/[0.04] border border-foreground/5">
                  ✓ Private Memories
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
