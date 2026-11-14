import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { useAppContext } from '@/lib/store';

/**
 * Photobooth IRL Dispenser — Printing Page
 *
 * Minimal, authentic real-life photobooth machine:
 * - Pure printer only: zero extraneous UI, HUDs, buttons, or badges
 * - Background seamlessly matches the plaque's brushed metal silver tone
 * - Slender, elongated photo strip with 3 teaser "sneak peeks" before full print:
 *   1. 0.08s - 0.70s: Sneak Peek 1 (top edge peeks out) -> pause & hold at 0.70s - 1.15s
 *   2. 1.15s - 1.75s: Sneak Peek 2 (first photo emerges) -> pause & hold at 1.75s - 2.20s
 *   3. 2.20s - 2.80s: Sneak Peek 3 (second photo emerges) -> pause & hold at 2.80s - 3.25s
 *   4. 3.25s - 5.20s: Full Rollout (long strip dispenses continuously all the way down)
 *   5. 5.22s - 5.60s: Roller release click & physical settle
 *   6. 5.70s: Seamless auto-advance to /receipt
 * - Real-time photobooth mechanical sound effect locked to each movement
 * - Tapping anywhere immediately collects the strip and navigates
 * - Non-dismissible back navigation preserved
 */
export default function Printing() {
  const [, setLocation] = useLocation();
  const { latestStrip, savedMemories } = useAppContext();
  const [printingStarted, setPrintingStarted] = useState(false);
  const finishTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Retrieve actual strip from store or fallback
  const stripUrl =
    latestStrip ||
    (typeof window !== 'undefined' ? sessionStorage.getItem('ps_latest_strip') : null) ||
    savedMemories[0]?.url ||
    null;

  // Block browser back button during printing
  useEffect(() => {
    const blockBack = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', blockBack);
    return () => window.removeEventListener('popstate', blockBack);
  }, []);

  // Safe haptic vibration
  const triggerHaptic = (pattern: number[] = [18, 30, 18]) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {
      // Haptics not available
    }
  };

  // Preload and start synchronized audio with zero latency
  useEffect(() => {
    const audio = new Audio('/photobooth-print.wav');
    audio.preload = 'auto';
    audio.volume = 0.9;
    audioRef.current = audio;

    const startTimer = setTimeout(() => {
      setPrintingStarted(true);
      try {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Autoplay delayed until interaction
          });
        }
      } catch {
        // Audio unavailable
      }
      triggerHaptic([20]);
    }, 60);

    // Haptics synchronized with the 3 sneak peeks and final release
    const haptic1 = setTimeout(() => triggerHaptic([15, 20, 15]), 60 + 700);
    const haptic2 = setTimeout(() => triggerHaptic([15, 20, 15]), 60 + 1750);
    const haptic3 = setTimeout(() => triggerHaptic([15, 20, 15]), 60 + 2800);
    const hapticFinal = setTimeout(() => triggerHaptic([30, 40, 20]), 60 + 5220);

    // Auto-advance to /receipt right after audio finishes (5.7s total)
    finishTimeoutRef.current = setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setLocation('/receipt', { replace: true });
    }, 60 + 5650);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(haptic1);
      clearTimeout(haptic2);
      clearTimeout(haptic3);
      clearTimeout(hapticFinal);
      if (finishTimeoutRef.current) {
        clearTimeout(finishTimeoutRef.current);
        finishTimeoutRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [setLocation]);

  const handleInstantCollect = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
    setLocation('/receipt', { replace: true });
  };

  return (
    <div
      onClick={handleInstantCollect}
      className="fixed inset-0 z-[9999] flex items-center justify-center select-none overflow-hidden cursor-pointer bg-cover bg-center"
      style={{
        backgroundImage: 'url(/photobooth-plaque-bg.jpg)',
        backgroundColor: '#d8d4d3',
      }}
    >
      <style>{`
        /*
         * 3 Sneak Peeks + Full Rollout Animation (5.60s total, synchronized with photobooth-print.wav)
         * 0.08s - 0.70s: Sneak Peek 1 (top edge peeks out)
         * 0.70s - 1.14s: Sneak Peek 1 hold / silence
         * 1.14s - 1.75s: Sneak Peek 2 (photo 1 emerges)
         * 1.75s - 2.19s: Sneak Peek 2 hold / silence
         * 2.19s - 2.80s: Sneak Peek 3 (photo 2 emerges)
         * 2.80s - 3.24s: Sneak Peek 3 hold / silence
         * 3.24s - 5.20s: Full Rollout (long strip rolls down into full view)
         * 5.20s - 5.35s: Release click & settle bounce
         * 5.35s - 5.60s: Fully settled
         */
        @keyframes photobooth3SneakPeeksFeed {
          0% {
            transform: translate(-50%, -92%) translateZ(0);
            animation-timing-function: cubic-bezier(0.2, 0.8, 0.4, 1);
          }
          1.4% {
            /* 0.08s: Startup click */
            transform: translate(-50%, -92%) translateZ(0);
            animation-timing-function: cubic-bezier(0.2, 0.8, 0.4, 1);
          }
          12.5% {
            /* 0.70s: Sneak Peek 1 reached */
            transform: translate(-50%, -78%) translateZ(0);
            animation-timing-function: step-end;
          }
          20.4% {
            /* 1.14s: Sneak Peek 1 pause / frozen hold */
            transform: translate(-50%, -78%) translateZ(0);
            animation-timing-function: cubic-bezier(0.2, 0.8, 0.4, 1);
          }
          31.2% {
            /* 1.75s: Sneak Peek 2 reached */
            transform: translate(-50%, -58%) translateZ(0);
            animation-timing-function: step-end;
          }
          39.1% {
            /* 2.19s: Sneak Peek 2 pause / frozen hold */
            transform: translate(-50%, -58%) translateZ(0);
            animation-timing-function: cubic-bezier(0.2, 0.8, 0.4, 1);
          }
          50.0% {
            /* 2.80s: Sneak Peek 3 reached */
            transform: translate(-50%, -36%) translateZ(0);
            animation-timing-function: step-end;
          }
          57.9% {
            /* 3.24s: Sneak Peek 3 pause / frozen hold */
            transform: translate(-50%, -36%) translateZ(0);
            animation-timing-function: cubic-bezier(0.18, 0.85, 0.3, 1);
          }
          92.8% {
            /* 5.20s: Full strip fully emerged */
            transform: translate(-50%, 0%) translateZ(0);
            animation-timing-function: cubic-bezier(0.25, 1.4, 0.5, 1);
          }
          94.0% {
            /* 5.26s: Physical settle bounce matching release click */
            transform: translate(-50%, 2.5px) translateZ(0);
            animation-timing-function: ease-out;
          }
          96.5% {
            /* 5.40s: Settled in place */
            transform: translate(-50%, 0%) translateZ(0);
          }
          100% {
            /* 5.60s: Fully settled */
            transform: translate(-50%, 0%) translateZ(0);
          }
        }
      `}</style>

      {/* Printer Only — fills mobile viewport, contained on desktop */}
      <div className="relative w-full h-[100dvh] sm:h-[92vh] sm:max-w-[520px] sm:aspect-[736/1308] flex items-center justify-center overflow-hidden sm:rounded-2xl sm:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
        {/* Layer 1 (z-0): Authentic Photobooth Machine Base with clean plaque & empty slot */}
        <img
          src="/photobooth-machine-base.png"
          alt="Photobooth Machine"
          className="absolute inset-0 w-full h-full object-cover object-top select-none pointer-events-none z-0"
        />

        {/* Layer 2 (z-10): Photo Strip emerging downwards with 3 sneak peeks + full dispense */}
        {/* Slit origin: y = 418px / 1308px = 31.96% from the top */}
        <div
          className="absolute z-10 will-change-transform transform-gpu pointer-events-none"
          style={{
            top: '31.96%',
            left: '50%',
            width: '42%',
            transform: 'translate(-50%, -92%) translateZ(0)',
            animation: printingStarted ? 'photobooth3SneakPeeksFeed 5.6s linear forwards' : 'none',
          }}
        >
          {/* Physical Photo Strip Card */}
          <div className="relative bg-white rounded-[2px] p-1.5 sm:p-2 shadow-[0_22px_48px_rgba(0,0,0,0.7),0_6px_14px_rgba(0,0,0,0.4)] border border-black/10 overflow-hidden">
            {/* Top cavern shadow: simulates strip emerging from dark interior cavity */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black/85 via-black/35 to-transparent z-20" />

            {/* Glossy photographic paper sheen */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent z-15" />

            {stripUrl ? (
              <img
                src={stripUrl}
                alt="Your printed photo strip"
                draggable={false}
                className="w-full h-auto object-contain select-none block"
              />
            ) : (
              /* Fallback preview strip mockup if loaded directly */
              <div className="flex flex-col gap-1.5 py-1">
                <div className="w-full aspect-[4/3] bg-gradient-to-br from-pink-100 to-rose-200 rounded-[1px]" />
                <div className="w-full aspect-[4/3] bg-gradient-to-br from-purple-100 to-pink-200 rounded-[1px]" />
                <div className="w-full aspect-[4/3] bg-gradient-to-br from-amber-100 to-rose-200 rounded-[1px]" />
                <div className="w-full aspect-[4/3] bg-gradient-to-br from-sky-100 to-pink-200 rounded-[1px]" />
                <div className="pt-2 text-center">
                  <span className="font-hero text-xs text-[#1c1e22]">PINK</span>
                  <span className="font-hero text-xs text-[#f53d89] ml-1">SNAP</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Layer 3 (z-20): Top machine face overlay (covers y = 0 to 418px) */}
        {/* Ensures the unprinted paper section remains hidden inside the machine behind the top bezel lip */}
        <div
          className="absolute top-0 left-0 w-full pointer-events-none select-none z-20 overflow-hidden"
          style={{ height: '31.96%' }}
        >
          <img
            src="/photobooth-machine-top.png"
            alt="Photobooth Bezel Top"
            className="w-full h-full object-cover object-top select-none pointer-events-none block"
          />
        </div>
      </div>
    </div>
  );
}
