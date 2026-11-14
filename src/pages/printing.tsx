import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { useAppContext } from '@/lib/store';

/**
 * Photobooth IRL Dispenser — Printing Page
 *
 * Uses the authentic photobooth dispensing machine asset (`Photobooth Printer _ Motion Graphic Idea`):
 * - Authentic industrial metallic machine casing & brushed metal plaque from root
 * - Signature centered PINKSNAP branding (PINK in dark titanium, SNAP in signature hot pink #f53d89)
 * - Authentic engraved "PHOTOS DELIVERED HERE" signage with down arrow (NO "IN 4 MINUTES")
 * - Real extruded metallic pill dispenser bezel with dark mechanical interior mouth
 * - Hardware-accelerated smooth photo strip feed emerging from behind the top bezel lip and hanging down
 * - Quick & smooth physical feed (~2.3s total) auto-navigating to /receipt
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
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(75, ctx.currentTime + 0.08);
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
    const startTimer = setTimeout(() => {
      setPrintingStarted(true);
      triggerAudioTick();
      triggerHaptic();
    }, 120);

    const TOTAL_MS = 2200; // Quick and snappy mechanical feed
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

        // Settle then replace location with /receipt
        finishTimeoutRef.current = setTimeout(() => {
          setLocation('/receipt', { replace: true });
        }, 380);
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
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#18191b] select-none overflow-hidden p-0 sm:p-4">
      {/* Container framing the realistic photobooth machine (736 x 1308 aspect ratio) */}
      <div className="relative w-full h-[100dvh] sm:h-auto sm:max-h-[92vh] max-w-[460px] aspect-[736/1308] flex items-center justify-center overflow-hidden sm:rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.85)]">
        {/* Layer 1 (z-0): Authentic Photobooth Machine Base with clean plaque & empty slot */}
        <img
          src="/photobooth-machine-base.png"
          alt="Photobooth Machine"
          className="absolute inset-0 w-full h-full object-cover object-top select-none pointer-events-none z-0"
        />

        {/* Layer 2 (z-10): The Real Photo Strip emerging downwards from the slot slit */}
        {/* Slit origin: y = 418px / 1308px = 31.96% from the top */}
        <div
          onClick={handleInstantCollect}
          title="Tap to collect photo strip"
          className="absolute z-10 will-change-transform transform-gpu cursor-pointer group"
          style={{
            top: '31.96%',
            left: '50%',
            width: '50%', // 368px / 736px matching reference asset
            transform: printingStarted
              ? 'translate(-50%, 0%) translateZ(0)'
              : 'translate(-50%, -86%) translateZ(0)',
            transition: 'transform 2.1s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {/* Physical Photo Strip Card */}
          <div className="relative bg-white rounded-[2px] p-1.5 shadow-[0_20px_45px_rgba(0,0,0,0.7),0_6px_14px_rgba(0,0,0,0.4)] border border-black/10 overflow-hidden transition-transform duration-200 group-hover:scale-[1.01]">
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

          {/* Quick collect pill */}
          <div className="text-center mt-3">
            <span className="inline-block font-mono text-[9px] uppercase tracking-wider text-black/85 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-md font-bold">
              Tap to collect strip
            </span>
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

        {/* Status Overlay HUD at the Top */}
        <div className="absolute top-4 inset-x-4 z-30 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2 bg-black/45 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-lg">
            <span
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                isCompleted
                  ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                  : 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse'
              }`}
            />
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/95 font-bold">
              {isCompleted ? 'DISPENSED' : 'PRINTING IN REAL TIME'}
            </span>
          </div>

          <div className="font-mono text-xs text-white/90 tracking-widest font-black bg-black/45 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15">
            {Math.round(progress)}%
          </div>
        </div>

        {/* Bottom Progress Bar & Skip Control */}
        <div className="absolute bottom-4 inset-x-6 z-30 flex flex-col items-center">
          <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/15 mb-2.5 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-[#f53d89] via-[#ff7eb3] to-[#f53d89] rounded-full transition-all duration-75 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <button
            onClick={handleInstantCollect}
            className="text-white/85 hover:text-white font-mono text-[11px] uppercase tracking-widest font-bold transition-colors flex items-center gap-1.5 py-1 px-3 rounded-full bg-black/35 backdrop-blur-sm border border-white/10"
          >
            <span>{isCompleted ? 'View Receipt & Save' : 'Skip Animation'}</span>
            <span>&rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
}
