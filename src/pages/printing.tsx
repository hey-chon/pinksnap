import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { useAppContext } from '@/lib/store';

/**
 * Safely parse and retrieve strip dataUrl.
 * Handles plain dataUrl, JSON-wrapped objects { url: "..." }, and fallbacks without ever throwing or producing broken URLs.
 */
function getSafeStripUrl(latestStrip: string | null, savedMemories: Array<{ url: string }>): string | null {
  if (latestStrip && typeof latestStrip === 'string') {
    if (latestStrip.startsWith('data:image') || latestStrip.startsWith('blob:') || latestStrip.startsWith('http')) {
      return latestStrip;
    }
    try {
      const parsed = JSON.parse(latestStrip);
      if (parsed?.url && typeof parsed.url === 'string' && (parsed.url.startsWith('data:image') || parsed.url.startsWith('blob:') || parsed.url.startsWith('http'))) {
        return parsed.url;
      }
    } catch {
      // not JSON
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const raw = sessionStorage.getItem('ps_latest_strip');
      if (raw) {
        if (raw.startsWith('data:image') || raw.startsWith('blob:') || raw.startsWith('http')) {
          return raw;
        }
        const parsed = JSON.parse(raw);
        if (parsed?.url && typeof parsed.url === 'string' && (parsed.url.startsWith('data:image') || parsed.url.startsWith('blob:') || parsed.url.startsWith('http'))) {
          return parsed.url;
        }
      }
    } catch {
      // ignore quota / private-mode
    }
  }

  if (savedMemories && savedMemories.length > 0) {
    const memoryUrl = savedMemories[0]?.url;
    if (memoryUrl && (memoryUrl.startsWith('data:image') || memoryUrl.startsWith('blob:') || memoryUrl.startsWith('http'))) {
      return memoryUrl;
    }
  }

  return null;
}

/**
 * Procedural Web Audio Photobooth SFX Generator (Zero Network Latency)
 * Synthesizes the exact 3-sneak-peek + full rollout audio in 2ms in memory.
 */
function createPhotoboothAudioBuffer(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = 5.6; // exact 5.6s
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, numSamples, sampleRate);
  const data = buffer.getChannelData(0);

  // Helper to add motor + paper noise into data channel
  const addFeedSegment = (startSec: number, endSec: number, amp = 0.8) => {
    const i0 = Math.floor(startSec * sampleRate);
    const i1 = Math.min(Math.floor(endSec * sampleRate), numSamples);
    const len = i1 - i0;
    const ramp = Math.min(Math.floor(0.04 * sampleRate), Math.floor(len / 4));

    for (let i = 0; i < len; i++) {
      let env = 1.0;
      if (i < ramp) env = i / ramp;
      else if (i > len - ramp) env = (len - i) / ramp;

      const t = (i0 + i) / sampleRate;
      // Motor tone: 230Hz base with micro flutter
      const motorPhase = 2 * Math.PI * 230.0 * t + 0.15 * Math.sin(2 * Math.PI * 28.0 * t);
      const motor = (Math.sin(motorPhase) * 0.5 + Math.sin(motorPhase * 2) * 0.25) * 0.28;

      // Filtered paper sliding friction noise
      const noise = (Math.random() * 2 - 1) * (0.8 + 0.2 * Math.sin(2 * Math.PI * 56.0 * t)) * 0.32;

      data[i0 + i] += (motor + noise) * env * amp;
    }
  };

  // Helper to add mechanical click
  const addClick = (atSec: number, amp = 0.5, freq = 1600) => {
    const i0 = Math.floor(atSec * sampleRate);
    const len = Math.floor(0.02 * sampleRate);
    for (let i = 0; i < len && i0 + i < numSamples; i++) {
      const tc = i / sampleRate;
      const decay = Math.exp(-tc / 0.003);
      const tone = Math.sin(2 * Math.PI * freq * tc) * decay;
      const snap = (Math.random() * 2 - 1) * Math.exp(-tc / 0.0015);
      data[i0 + i] += (tone * 0.6 + snap * 0.4) * amp;
    }
  };

  // Sneak Peek 1: 0.08s - 0.70s
  addClick(0.08, 0.55, 1400);
  addFeedSegment(0.10, 0.70, 0.75);
  addClick(0.70, 0.45, 1700);

  // Sneak Peek 2: 1.14s - 1.75s
  addClick(1.14, 0.50, 1500);
  addFeedSegment(1.15, 1.75, 0.78);
  addClick(1.75, 0.45, 1700);

  // Sneak Peek 3: 2.19s - 2.80s
  addClick(2.19, 0.52, 1500);
  addFeedSegment(2.20, 2.80, 0.82);
  addClick(2.80, 0.45, 1700);

  // Full Rollout: 3.24s - 5.20s
  addClick(3.24, 0.60, 1400);
  addFeedSegment(3.25, 5.20, 0.88);
  addClick(5.20, 0.70, 1100);
  addClick(5.22, 0.35, 2200);

  // Normalize
  let maxVal = 0;
  for (let i = 0; i < numSamples; i++) {
    const abs = Math.abs(data[i]);
    if (abs > maxVal) maxVal = abs;
  }
  if (maxVal > 0) {
    const scale = 0.82 / maxVal;
    for (let i = 0; i < numSamples; i++) {
      data[i] *= scale;
    }
  }

  return buffer;
}

/**
 * Photobooth IRL Dispenser — Printing Page
 */
export default function Printing() {
  const [, setLocation] = useLocation();
  const { latestStrip, savedMemories } = useAppContext();
  const [printingStarted, setPrintingStarted] = useState(false);
  const [stripLoaded, setStripLoaded] = useState(false);
  const finishTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Retrieve validated strip URL
  const stripUrl = getSafeStripUrl(latestStrip, savedMemories);

  // Block browser back button during printing
  useEffect(() => {
    const blockBack = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', blockBack);
    return () => window.removeEventListener('popstate', blockBack);
  }, []);

  // Preload and verify strip image before animation starts (prevents pop-in and layout shift)
  useEffect(() => {
    if (!stripUrl) {
      setStripLoaded(true);
      return;
    }
    const img = new Image();
    img.src = stripUrl;
    if (img.complete) {
      setStripLoaded(true);
    } else {
      img.onload = () => setStripLoaded(true);
      img.onerror = () => setStripLoaded(true); // gracefully continue to fallback if decode fails
    }
  }, [stripUrl]);

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

  // Zero-Latency Real-Time Audio & Animation Start
  useEffect(() => {
    if (!stripLoaded) return;

    let isCancelled = false;

    // Initialize Web Audio
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;
        if (ctx.state === 'suspended') {
          void ctx.resume();
        }

        const buffer = createPhotoboothAudioBuffer(ctx);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        audioSourceRef.current = source;
        source.start(0);
      }
    } catch {
      // Web Audio unavailable
    }

    // Start motion on the exact same frame as audio
    setPrintingStarted(true);
    triggerHaptic([20]);

    // Haptics locked to the 3 sneak peeks and final release
    const haptic1 = setTimeout(() => triggerHaptic([15, 20, 15]), 700);
    const haptic2 = setTimeout(() => triggerHaptic([15, 20, 15]), 1750);
    const haptic3 = setTimeout(() => triggerHaptic([15, 20, 15]), 2800);
    const hapticFinal = setTimeout(() => triggerHaptic([30, 40, 20]), 5220);

    // Auto-advance to /receipt at 5.7s total
    finishTimeoutRef.current = setTimeout(() => {
      if (isCancelled) return;
      stopAudio();
      setLocation('/receipt', { replace: true });
    }, 5700);

    return () => {
      isCancelled = true;
      clearTimeout(haptic1);
      clearTimeout(haptic2);
      clearTimeout(haptic3);
      clearTimeout(hapticFinal);
      if (finishTimeoutRef.current) {
        clearTimeout(finishTimeoutRef.current);
        finishTimeoutRef.current = null;
      }
      stopAudio();
    };
  }, [stripLoaded, setLocation]);

  const stopAudio = () => {
    try {
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current.disconnect();
        audioSourceRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        void audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    } catch {
      // ignore
    }
  };

  const handleInstantCollect = () => {
    stopAudio();
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
         * 3 Controlled Sneak Peeks + Full Rollout Animation (5.60s total)
         * Keeps the strip tucked inside during peeks so it NEVER appears outside prematurely!
         * 0.00s - 0.08s: Strip 100% inside slit (-100%)
         * 0.08s - 0.70s: Sneak Peek 1 (top 12% emerges to -88%)
         * 0.70s - 1.14s: Sneak Peek 1 hold / silence (holds at -88%)
         * 1.14s - 1.75s: Sneak Peek 2 (top 25% emerges to -75%)
         * 1.75s - 2.19s: Sneak Peek 2 hold / silence (holds at -75%)
         * 2.19s - 2.80s: Sneak Peek 3 (top 40% emerges to -60%)
         * 2.80s - 3.24s: Sneak Peek 3 hold / silence (holds at -60%)
         * 3.24s - 5.20s: Full Rollout (long strip dispenses continuously down to 0%)
         * 5.20s - 5.35s: Release click & subtle settle bounce
         * 5.35s - 5.60s: Fully settled
         */
        @keyframes photobooth3SneakPeeksFeed {
          0% {
            transform: translate(-50%, -100%) translateZ(0);
          }
          1.4% {
            /* 0.08s: Startup click */
            transform: translate(-50%, -100%) translateZ(0);
          }
          12.5% {
            /* 0.70s: Sneak Peek 1 reached (only 12% peeks out) */
            transform: translate(-50%, -88%) translateZ(0);
          }
          20.4% {
            /* 1.14s: Sneak Peek 1 pause / frozen hold */
            transform: translate(-50%, -88%) translateZ(0);
          }
          31.2% {
            /* 1.75s: Sneak Peek 2 reached (only 25% peeks out) */
            transform: translate(-50%, -75%) translateZ(0);
          }
          39.1% {
            /* 2.19s: Sneak Peek 2 pause / frozen hold */
            transform: translate(-50%, -75%) translateZ(0);
          }
          50.0% {
            /* 2.80s: Sneak Peek 3 reached (only 40% peeks out) */
            transform: translate(-50%, -60%) translateZ(0);
          }
          57.9% {
            /* 3.24s: Sneak Peek 3 pause / frozen hold */
            transform: translate(-50%, -60%) translateZ(0);
          }
          92.8% {
            /* 5.20s: Full strip fully emerged */
            transform: translate(-50%, 0%) translateZ(0);
          }
          94.0% {
            /* 5.26s: Physical settle bounce */
            transform: translate(-50%, 2.5px) translateZ(0);
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
      <div className="relative h-[100dvh] w-auto max-w-[100vw] aspect-[736/1308] flex items-center justify-center overflow-hidden sm:rounded-2xl sm:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
        {/* Layer 1 (z-0): Authentic Photobooth Machine Base with clean plaque & empty slot */}
        <img
          src="/photobooth-machine-base.png"
          alt="Photobooth Machine"
          className="absolute inset-0 w-full h-full object-cover object-top select-none pointer-events-none z-0"
        />

        {/* Layer 2 (z-10): Photo Strip emerging downwards with 3 teaser sneak peeks + full rollout */}
        {/* Slit origin: y = 418px / 1308px = 31.96% from the top */}
        <div
          className="absolute z-10 will-change-transform transform-gpu pointer-events-none"
          style={{
            top: '31.96%',
            left: '50%',
            width: '42%',
            transform: 'translate(-50%, -100%) translateZ(0)',
            animation: printingStarted ? 'photobooth3SneakPeeksFeed 5.6s ease-in-out forwards' : 'none',
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
              /* Fallback preview strip mockup if session strip is null (NEVER renders broken '?') */
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

        {/* Layer 3 (z-20): Top machine face overlay using EXACT SAME base image with clipPath */}
        {/* Perfectly identical scaling: 100% eliminates any visual tearing or splitting on mobile! */}
        <img
          src="/photobooth-machine-base.png"
          alt="Photobooth Machine Top"
          className="absolute inset-0 w-full h-full object-cover object-top select-none pointer-events-none z-20 block"
          style={{
            clipPath: 'inset(0 0 68.04% 0)',
          }}
        />
      </div>
    </div>
  );
}
