import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { useAppContext } from '@/lib/store';

/**
 * Photobooth IRL Dispenser — Printing Page
 *
 * Minimal, authentic real-life photobooth machine:
 * - Pure printer only: zero extraneous UI, HUDs, buttons, or badges
 * - Background seamlessly matches the plaque's brushed metal silver tone
 * - Fast, realistic motion graphic feed matching the reference file (~1.4s total)
 * - Auto-navigates to /receipt once printed
 * - Non-dismissible back navigation preserved
 */
export default function Printing() {
  const [, setLocation] = useLocation();
  const { latestStrip, savedMemories } = useAppContext();
  const [printingStarted, setPrintingStarted] = useState(false);
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

  // Short, fast, smooth print animation matching the motion graphic (~1.4s total)
  useEffect(() => {
    const startTimer = setTimeout(() => {
      setPrintingStarted(true);
      triggerAudioTick();
      triggerHaptic();
    }, 80);

    // Fast print duration: 1150ms feed + 250ms settle = ~1400ms total
    finishTimeoutRef.current = setTimeout(() => {
      triggerHaptic();
      setLocation('/receipt', { replace: true });
    }, 1400);

    return () => {
      clearTimeout(startTimer);
      if (finishTimeoutRef.current) {
        clearTimeout(finishTimeoutRef.current);
        finishTimeoutRef.current = null;
      }
    };
  }, [setLocation]);

  const handleInstantCollect = () => {
    if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
    setLocation('/receipt', { replace: true });
  };

  return (
    <div
      onClick={handleInstantCollect}
      className="fixed inset-0 z-[9999] flex items-center justify-center select-none overflow-hidden cursor-pointer"
      style={{
        background: `
          radial-gradient(ellipse 100% 100% at 48% 38%, #d8d4d3 0%, #c5c0bf 45%, #aba6a5 85%, #9c9796 100%)
        `,
      }}
    >
      {/* Printer Only — framing the realistic photobooth machine (736 x 1308 aspect ratio) */}
      <div className="relative w-full h-[100dvh] sm:h-auto sm:max-h-[92vh] max-w-[460px] aspect-[736/1308] flex items-center justify-center overflow-hidden sm:rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
        {/* Layer 1 (z-0): Authentic Photobooth Machine Base with clean plaque & empty slot */}
        <img
          src="/photobooth-machine-base.png"
          alt="Photobooth Machine"
          className="absolute inset-0 w-full h-full object-cover object-top select-none pointer-events-none z-0"
        />

        {/* Layer 2 (z-10): The Real Photo Strip emerging downwards from the slot slit */}
        {/* Slit origin: y = 418px / 1308px = 31.96% from the top */}
        <div
          className="absolute z-10 will-change-transform transform-gpu pointer-events-none"
          style={{
            top: '31.96%',
            left: '50%',
            width: '50%', // 368px / 736px matching reference asset
            transform: printingStarted
              ? 'translate(-50%, 0%) translateZ(0)'
              : 'translate(-50%, -86%) translateZ(0)',
            transition: 'transform 1.15s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {/* Physical Photo Strip Card */}
          <div className="relative bg-white rounded-[2px] p-1.5 shadow-[0_20px_45px_rgba(0,0,0,0.7),0_6px_14px_rgba(0,0,0,0.4)] border border-black/10 overflow-hidden">
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
