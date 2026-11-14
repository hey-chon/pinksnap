/**
 * Photobooth Web Audio Manager
 * Provides zero-latency, gesture-blessed audio playback across all desktop and mobile devices (iOS Safari, Android Chrome).
 */

let globalAudioCtx: AudioContext | null = null;
let globalAudioBuffer: AudioBuffer | null = null;

export function getOrCreatePhotoboothAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!globalAudioCtx || globalAudioCtx.state === 'closed') {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      try {
        globalAudioCtx = new AudioCtx();
      } catch {
        globalAudioCtx = null;
      }
    }
  }
  return globalAudioCtx;
}

export function createPhotoboothAudioBuffer(ctx: AudioContext): AudioBuffer {
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
 * Prime and unlock audio inside a user gesture (e.g. click/tap).
 * This bypasses iOS and Android autoplay policy restrictions.
 */
export function unlockAndPreloadAudio(): { ctx: AudioContext | null; buffer: AudioBuffer | null } {
  const ctx = getOrCreatePhotoboothAudioContext();
  if (ctx) {
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
    if (!globalAudioBuffer) {
      try {
        globalAudioBuffer = createPhotoboothAudioBuffer(ctx);
      } catch {
        globalAudioBuffer = null;
      }
    }
  }
  return { ctx, buffer: globalAudioBuffer };
}

/**
 * Play photobooth dispenser audio with absolute zero latency.
 */
export function playDispenserAudio(): { source: AudioBufferSourceNode | null; stop: () => void } {
  const ctx = getOrCreatePhotoboothAudioContext();
  if (!ctx) return { source: null, stop: () => {} };

  if (ctx.state === 'suspended') {
    void ctx.resume();
  }

  if (!globalAudioBuffer) {
    try {
      globalAudioBuffer = createPhotoboothAudioBuffer(ctx);
    } catch {
      return { source: null, stop: () => {} };
    }
  }

  try {
    const source = ctx.createBufferSource();
    source.buffer = globalAudioBuffer;
    source.connect(ctx.destination);
    source.start(0);

    const stop = () => {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // ignore
      }
    };

    return { source, stop };
  } catch {
    return { source: null, stop: () => {} };
  }
}

