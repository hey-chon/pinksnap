import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { useAppContext } from '@/lib/store';

/**
 * Photobooth IRL Dispenser — Printing Page
 *
 * Recreates the physical photobooth dispensing experience inspired by the industrial
 * metallic dispenser slot reference:
 * - Brushed aluminum plaque with signature centered PINKSNAP (PINK in titanium charcoal, SNAP in hot pink)
 * - Authentic engraved "PHOTOS DELIVERED HERE" signage with down arrow (NO "IN 4 MINUTES")
 * - 3D extruded metallic pill-shaped dispenser bezel with deep dark mechanical cavity
 * - Hardware-accelerated smooth photo strip feed animation emerging directly from the slot
 * - Fast, optimized, IRL feel (~2.5s total) auto-navigating to /receipt
 * - Non-dismissible back-navigation lock preserved
 */
export default function Printing() {
  const [, setLocation] = useLocation();
  const { latestStrip, savedMemories } = useAppContext();
  const [printingStarted, setPrintingStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Safe subtle stepper motor sound effect
  const triggerAudioTick = () => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {
      // AudioContext blocked or not supported — ignore safely
    }
  };

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

  // Quick, smooth, optimized print animation loop (~2.4s total)
  useEffect(() => {
    // Small initial delay before feed starts for authentic mechanical startup
    const startTimer = setTimeout(() => {
      setPrintingStarted(true);
      triggerAudioTick();
      triggerHaptic();
    }, 150);

    const TOTAL_MS = 2200; // Fast and snappy print feed
    const STEP_MS = 35;
    let elapsed = 0;

    progressTimerRef.current = setInterval(() => {
      elapsed += STEP_MS;
      const pct = Math.min((elapsed / TOTAL_MS) * 100, 100);
      setProgress(pct);

      if (elapsed >= TOTAL_MS) {
        if (progressTimerRef.current) {
          clearInterval(progressTimerRef.current);
          progressTimerRef.current = null;
        }
        setIsCompleted(true);
        triggerHaptic();

        // Brief settle time then replace location with /receipt
        finishTimeoutRef.current = setTimeout(() => {
          setLocation('/receipt', { replace: true });
        }, 350);
      }
    }, STEP_MS);

    return () => {
      clearTimeout(startTimer);
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      if (finishTimeoutRef.current) {
        clearTimeout(finishTimeoutRef.current);
        finishTimeoutRef.current = null;
      }
    };
  }, [setLocation]);

  const handleInstantCollect = () => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
    setLocation('/receipt', { replace: true });
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-between select-none overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse 120% 90% at 30% 10%, rgba(255, 255, 255, 0.22) 0%, transparent 60%),
          radial-gradient(ellipse 90% 90% at 75% 85%, rgba(0, 0, 0, 0.28) 0%, transparent 65%),
          linear-gradient(145deg, #a4aab1 0%, #8b9198 35%, #767c83 70%, #666c72 100%)
        `,
      }}
    >
      {/* Subtle fine metal grain overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 3px),
                            repeating-linear-gradient(0deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 1px, transparent 1px, transparent 4px)`,
        }}
      />

      {/* Top Header / Status bar */}
      <div className="relative z-20 w-full max-w-md px-6 pt-5 sm:pt-8 flex items-center justify-between">
        {/* Machine Status Pill */}
        <div className="flex items-center gap-2 bg-black/35 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 shadow-inner">
          <span
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              isCompleted
                ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                : 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse'
            }`}
          />
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/90 font-semibold">
            {isCompleted ? 'DISPENSED' : 'PRINTING IN PROGRESS'}
          </span>
        </div>

        {/* Progress indicator */}
        <div className="font-mono text-[11px] text-white/70 tracking-widest font-bold">
          {Math.round(progress)}%
        </div>
      </div>

      {/* Main Dispenser Kiosk Face */}
      <div className="relative z-10 w-full max-w-lg flex flex-col items-center justify-start flex-1 px-4 pt-4 sm:pt-8 pb-4">
        {/* 1. Metal Brushed Plaque (Mar & Ma replacement with centered PINKSNAP) */}
        <div
          className="relative w-52 sm:w-60 rounded-md p-4 sm:p-5 flex flex-col items-center justify-center text-center shadow-[0_8px_20px_rgba(0,0,0,0.4),0_1px_0_rgba(255,255,255,0.8)_inset]"
          style={{
            background: `
              linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.12) 100%),
              linear-gradient(170deg, #d8dce1 0%, #c4c9cf 45%, #b1b7be 75%, #c8cdd3 100%)
            `,
            border: '1px solid rgba(255, 255, 255, 0.75)',
            outline: '1px solid rgba(0, 0, 0, 0.25)',
          }}
        >
          {/* 4 Corner Screws */}
          <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-gradient-to-br from-[#ffffff] via-[#c2c7ce] to-[#697078] shadow-[0_1px_1px_rgba(0,0,0,0.4)] flex items-center justify-center">
            <div className="w-1 h-[0.5px] bg-[#424850] rotate-45" />
          </div>
          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-gradient-to-br from-[#ffffff] via-[#c2c7ce] to-[#697078] shadow-[0_1px_1px_rgba(0,0,0,0.4)] flex items-center justify-center">
            <div className="w-1 h-[0.5px] bg-[#424850] -rotate-45" />
          </div>
          <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-gradient-to-br from-[#ffffff] via-[#c2c7ce] to-[#697078] shadow-[0_1px_1px_rgba(0,0,0,0.4)] flex items-center justify-center">
            <div className="w-1 h-[0.5px] bg-[#424850] -rotate-45" />
          </div>
          <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-gradient-to-br from-[#ffffff] via-[#c2c7ce] to-[#697078] shadow-[0_1px_1px_rgba(0,0,0,0.4)] flex items-center justify-center">
            <div className="w-1 h-[0.5px] bg-[#424850] rotate-45" />
          </div>

          {/* Signature Centered PINKSNAP Branding */}
          <div className="flex items-center justify-center select-none pt-0.5">
            <span className="font-hero text-2xl sm:text-[28px] text-[#1c1e22] tracking-wider leading-none drop-shadow-[0_1px_0_rgba(255,255,255,0.7)]">
              PINK
            </span>
            <span className="font-hero text-2xl sm:text-[28px] text-[#f53d89] tracking-wider leading-none ml-1.5 drop-shadow-[0_1px_0_rgba(255,255,255,0.7)]">
              SNAP
            </span>
          </div>

          {/* Authentic Engraved Photobooth Signage (Strictly NO 'in 4 minutes') */}
          <div className="mt-2.5 sm:mt-3 text-center select-none">
            <p className="font-sans font-black text-[10px] sm:text-[11px] text-[#2c3036] tracking-[0.24em] uppercase leading-snug drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
              PHOTOS
            </p>
            <p className="font-sans font-black text-[10px] sm:text-[11px] text-[#2c3036] tracking-[0.24em] uppercase leading-snug drop-shadow-[0_1px_0_rgba(255,255,255,0.6)] mt-0.5">
              DELIVERED HERE
            </p>
          </div>

          {/* Photobooth Industrial Arrow */}
          <div className="mt-2 flex justify-center">
            <svg
              className="w-4 h-5 sm:w-5 sm:h-6 text-[#1c1e22] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]"
              viewBox="0 0 24 28"
              fill="currentColor"
            >
              <path d="M10 0 H14 V15 H19 L12 25 L5 15 H10 Z" />
            </svg>
          </div>
        </div>

        {/* 2. Dispenser Slot & Animated Real-Life Photo Strip */}
        <div className="relative w-full max-w-[340px] sm:max-w-[420px] mt-6 sm:mt-8 flex flex-col items-center">
          {/* Outer Extruded Metallic Bezel (Pill shape from the reference) */}
          <div
            className="relative w-full h-[74px] sm:h-[84px] rounded-full p-2.5 sm:p-3 shadow-[0_18px_36px_rgba(0,0,0,0.5),0_1px_0_rgba(255,255,255,0.8)_inset,0_-1px_0_rgba(0,0,0,0.6)_inset]"
            style={{
              background: `
                linear-gradient(180deg, #f1f3f6 0%, #b8bec6 35%, #88909a 70%, #5d646d 100%)
              `,
              border: '1px solid rgba(255,255,255,0.7)',
            }}
          >
            {/* Inner Dark Cavity (The Mouth) */}
            <div
              className="relative w-full h-full rounded-full bg-[#0b0c0e] shadow-[inset_0_12px_20px_rgba(0,0,0,0.98),inset_0_2px_4px_rgba(0,0,0,0.9)] overflow-visible flex justify-center"
            >
              {/* Internal Slit Paper Shadow (casts depth onto the emerging strip) */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-black/90 to-transparent z-30 rounded-t-full" />

              {/* Photo Strip emerging downwards from the slot */}
              <div
                onClick={handleInstantCollect}
                title="Tap to collect photo strip"
                className="absolute top-2 w-[150px] sm:w-[175px] cursor-pointer will-change-transform transform-gpu z-20 group"
                style={{
                  // The strip starts rolled up in the slit (-82%) and smoothly feeds down into view
                  transform: printingStarted
                    ? 'translateY(12px) translateZ(0)'
                    : 'translateY(-86%) translateZ(0)',
                  transition: 'transform 2.1s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                {/* Physical Photo Strip Container with real photo paper styling */}
                <div className="relative rounded-[3px] bg-white p-2 shadow-[0_24px_45px_rgba(0,0,0,0.65),0_8px_16px_rgba(0,0,0,0.4)] border border-black/10 overflow-hidden transition-transform duration-200 group-hover:scale-[1.01]">
                  {/* Glossy paper reflection sheen */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent z-10" />

                  {/* Top internal shadow simulating paper coming out of the roller cavern */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-black/60 via-black/20 to-transparent z-20" />

                  {stripUrl ? (
                    <img
                      src={stripUrl}
                      alt="Your printed photo strip"
                      draggable={false}
                      className="w-full h-auto object-contain select-none block"
                    />
                  ) : (
                    /* Elegant fallback mockup if strip is loaded directly without photo session */
                    <div className="flex flex-col gap-1.5 py-1">
                      <div className="w-full aspect-[4/3] bg-gradient-to-br from-pink-100 to-rose-200 rounded-[2px]" />
                      <div className="w-full aspect-[4/3] bg-gradient-to-br from-purple-100 to-pink-200 rounded-[2px]" />
                      <div className="w-full aspect-[4/3] bg-gradient-to-br from-amber-100 to-rose-200 rounded-[2px]" />
                      <div className="w-full aspect-[4/3] bg-gradient-to-br from-sky-100 to-pink-200 rounded-[2px]" />
                      <div className="pt-2 text-center">
                        <span className="font-hero text-xs text-[#1c1e22]">PINK</span>
                        <span className="font-hero text-xs text-[#f53d89] ml-1">SNAP</span>
                      </div>
                    </div>
                  )}

                  {/* Bottom glossy edge highlight */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-white/70" />
                </div>

                {/* Subtle paper feed helper pill */}
                <div className="text-center mt-3">
                  <span className="inline-block font-mono text-[9px] uppercase tracking-wider text-black/80 bg-white/80 backdrop-blur-sm px-2.5 py-0.5 rounded-full shadow-sm font-semibold">
                    Tap to grab strip
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Control / Skip button */}
      <div className="relative z-20 w-full max-w-md px-6 pb-6 sm:pb-8 flex flex-col items-center">
        {/* Progress bar line */}
        <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden border border-white/10 mb-3 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-[#f53d89] via-[#ff7eb3] to-[#f53d89] rounded-full transition-all duration-75 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <button
          onClick={handleInstantCollect}
          className="text-white/80 hover:text-white font-mono text-xs uppercase tracking-widest font-semibold transition-colors flex items-center gap-1.5 py-1"
        >
          <span>{isCompleted ? 'View Receipt & Save' : 'Skip Animation'}</span>
          <span>&rarr;</span>
        </button>
      </div>
    </div>
  );
}
