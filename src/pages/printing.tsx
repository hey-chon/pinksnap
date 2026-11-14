import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { useAppContext } from '@/lib/store';

/**
 * Photobooth IRL Dispenser — Printing Page
 *
 * Minimal, authentic real-life photobooth machine:
 * - Pure printer only: zero extraneous UI, HUDs, buttons, or badges
 * - Background seamlessly matches the plaque's brushed metal silver tone
 * - Slender, elongated photo strip with real-time audio-synchronized motion:
 *   1. 0.08s: Startup click -> paper begins to feed
 *   2. 0.10s - 0.85s: Sneak peek motor whir & paper friction -> top of strip peeks out
 *   3. 0.85s - 1.38s: Motor pause & silence -> strip freezes in sneak peek hold
 *   4. 1.39s: Re-engage click -> continuous motorized feed downwards
 *   5. 1.40s - 3.30s: Full motor glide -> long strip dispenses into full view
 *   6. 3.32s: Final release click -> subtle physical settle bounce
 *   7. 3.90s: Seamless auto-advance to /receipt
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
  const triggerHaptic = () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([18, 30, 18]);
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

    // Small delay on mount to ensure browser paint and audio buffer are ready
    const startTimer = setTimeout(() => {
      setPrintingStarted(true);
      try {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // If autoplay is blocked by browser, user can tap screen
          });
        }
      } catch {
        // Audio unavailable
      }
      triggerHaptic();
    }, 60);

    // Sneak peek hold haptic (synchronized with the 0.85s audio click)
    const sneakPeekHaptic = setTimeout(() => {
      triggerHaptic();
    }, 60 + 850);

    // Feed completion haptic (synchronized with the 3.32s release click)
    const finishHaptic = setTimeout(() => {
      triggerHaptic();
    }, 60 + 3320);

    // Auto-advance to /receipt right after audio tail finishes
    finishTimeoutRef.current = setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setLocation('/receipt', { replace: true });
    }, 60 + 3850);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(sneakPeekHaptic);
      clearTimeout(finishHaptic);
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
         * Precise Real-Time Audio Synchronization for photobooth-print.wav (3.80s total)
         * 0.00s - 0.08s (0% - 2%): Startup relay click, stationary in slit
         * 0.08s - 0.85s (2% - 22.4%): Motor Feed 1 -> SNEAK PEEK slides down
         * 0.85s - 1.38s (22.4% - 36.3%): SNEAK PEEK PAUSE -> holds frozen during silence
         * 1.39s (36.6%): Motor clutch re-engage click
         * 1.40s - 3.30s (36.8% - 86.8%): Motor Feed 2 -> continuous smooth full strip dispense
         * 3.32s - 3.45s (87.4% - 90.8%): Roller release click -> gentle physical settle bounce
         * 3.45s - 3.80s (90.8% - 100%): Resting in full view
         */
        @keyframes photoboothAudioSyncFeed {
          0% {
            transform: translate(-50%, -92%) translateZ(0);
            animation-timing-function: cubic-bezier(0.2, 0.8, 0.4, 1);
          }
          2.1% {
            /* 0.08s: Startup click */
            transform: translate(-50%, -92%) translateZ(0);
            animation-timing-function: cubic-bezier(0.2, 0.8, 0.4, 1);
          }
          22.4% {
            /* 0.85s: Sneak peek peak reached */
            transform: translate(-50%, -68%) translateZ(0);
            animation-timing-function: step-end;
          }
          36.3% {
            /* 1.38s: Frozen hold during the motor pause */
            transform: translate(-50%, -68%) translateZ(0);
            animation-timing-function: cubic-bezier(0.18, 0.85, 0.3, 1);
          }
          36.8% {
            /* 1.40s: Motor resumes */
            transform: translate(-50%, -67.5%) translateZ(0);
            animation-timing-function: cubic-bezier(0.18, 0.85, 0.3, 1);
          }
          86.8% {
            /* 3.30s: Full strip emerges */
            transform: translate(-50%, 0%) translateZ(0);
            animation-timing-function: cubic-bezier(0.25, 1.4, 0.5, 1);
          }
          88.2% {
            /* 3.35s: Micro settle bounce matching 3.32s release click */
            transform: translate(-50%, 2.5px) translateZ(0);
            animation-timing-function: ease-out;
          }
          92.0% {
            /* 3.50s: Settled in place */
            transform: translate(-50%, 0%) translateZ(0);
          }
          100% {
            /* 3.80s: Audio ends */
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

        {/* Layer 2 (z-10): Photo Strip emerging downwards in lockstep with the audio waveform */}
        {/* Slit origin: y = 418px / 1308px = 31.96% from the top */}
        <div
          className="absolute z-10 will-change-transform transform-gpu pointer-events-none"
          style={{
            top: '31.96%',
            left: '50%',
            width: '42%',
            transform: 'translate(-50%, -92%) translateZ(0)',
            animation: printingStarted ? 'photoboothAudioSyncFeed 3.8s linear forwards' : 'none',
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
