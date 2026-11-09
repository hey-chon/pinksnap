import React, { useRef } from 'react';
import { RefreshCw, Zap, ZapOff, AlertCircle, Camera, Check } from 'lucide-react';

interface CanonCameraProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isCapturing: boolean;
  countdown: number | null;
  countdownRef: React.RefObject<HTMLSpanElement | null>;
  flashEnabled: boolean;
  setFlashEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  restartCamera: () => void;
  startSequence: () => void;
  cancelSequence: () => void;
  showDemoPrompt: boolean;
  demoMode: boolean;
  setDemoMode: (val: boolean) => void;
  error: string | null;
  shotsCount: number;
  maxShots: number;
}

// Lightweight realistic mechanical shutter click sound using Web Audio API
export function playMechanicalShutterSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // First click (shutter opening)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(140, now);
    osc1.frequency.exponentialRampToValueAtTime(35, now + 0.06);
    gain1.gain.setValueAtTime(0.28, now);
    gain1.gain.exponentialRampToValueAtTime(0.005, now + 0.06);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.06);

    // Second click (shutter closing / spring)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(190, now + 0.07);
    osc2.frequency.exponentialRampToValueAtTime(45, now + 0.14);
    gain2.gain.setValueAtTime(0.24, now + 0.07);
    gain2.gain.exponentialRampToValueAtTime(0.005, now + 0.14);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.07);
    osc2.stop(now + 0.14);
  } catch {
    // Audio context not allowed or failed silently
  }
}

export function CanonCamera({
  videoRef,
  isCapturing,
  countdown,
  countdownRef,
  flashEnabled,
  setFlashEnabled,
  restartCamera,
  startSequence,
  cancelSequence,
  showDemoPrompt,
  demoMode,
  setDemoMode,
  error,
  shotsCount,
  maxShots,
}: CanonCameraProps) {
  const isComplete = shotsCount >= maxShots;

  const handleShutterPress = () => {
    if (isCapturing || isComplete) return;
    playMechanicalShutterSound();
    startSequence();
  };

  return (
    <div className="relative w-full max-w-[560px] sm:max-w-[620px] md:max-w-[680px] select-none mx-auto">
      {/* ── Aspect container matching the Canon camera dimensions (704x504 = 1.3968) ── */}
      <div className="relative w-full aspect-[704/504]">
        
        {/* ── Screen layer: Live Webcam / OSD (positioned behind the camera frame) ── */}
        <div
          className="absolute z-0 overflow-hidden bg-black rounded-[4px] shadow-inner"
          style={{
            left: '8.8%',
            top: '31.6%',
            width: '45.0%',
            height: '46.6%',
          }}
        >
          {/* Fallback / Camera unavailable prompt */}
          {showDemoPrompt && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/92 text-white p-3 sm:p-4 text-center z-30 backdrop-blur-xs">
              <AlertCircle className="w-7 h-7 sm:w-9 sm:h-9 text-primary mb-2" />
              <p className="font-black text-xs sm:text-sm tracking-wider mb-1">CAMERA UNAVAILABLE</p>
              <p className="text-[10px] sm:text-xs text-white/70 font-medium mb-3 max-w-[220px] line-clamp-2">
                {error || "Could not access camera. Continue in demo mode."}
              </p>
              <button
                type="button"
                onClick={() => setDemoMode(true)}
                data-testid="button-demo-mode"
                className="bg-primary hover:bg-primary/90 text-white text-[11px] font-black px-4 py-2 rounded-full shadow-md transition-transform active:scale-95 cursor-pointer"
              >
                USE DEMO MODE
              </button>
            </div>
          )}

          {/* Live Video Feed */}
          <video
            ref={videoRef}
            data-testid="camera-preview"
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />

          {/* Vintage Digital Camera Viewfinder OSD Elements */}
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 sm:p-2.5 z-10 font-mono text-[9px] sm:text-[10px] text-white/90">
            {/* Top Bar OSD */}
            <div className="flex items-center justify-between drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              <div className="flex items-center gap-1.5">
                <span className={`inline-flex items-center gap-0.5 px-1 rounded text-[8px] sm:text-[9px] font-bold ${
                  flashEnabled ? 'bg-primary/80 text-white' : 'bg-black/50 text-white/60'
                }`}>
                  {flashEnabled ? '⚡ ON' : '⚡ OFF'}
                </span>
                <span className="font-bold text-white/70">ISO 100</span>
              </div>
              <div className="flex items-center gap-1 font-bold">
                <span className="text-pink-300">REC</span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              </div>
            </div>

            {/* Center Focus Reticle [ + ] */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 border border-white/30 rounded-lg">
                <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-primary" />
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-primary" />
                <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-primary" />
                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-primary" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-1 h-1 bg-primary/70 rounded-full" />
                </div>
              </div>
            </div>

            {/* Bottom Bar OSD */}
            <div className="flex items-center justify-between drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              <span className="tracking-widest font-black text-pink-400">PINKSNAP</span>
              <span className="text-[8px] sm:text-[9px] font-bold text-white/80">
                SHOT {Math.min(shotsCount + 1, maxShots)}/{maxShots}
              </span>
            </div>
          </div>

          {/* Countdown Overlay */}
          {countdown !== null && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/35 backdrop-blur-[1px] z-20">
              <span
                ref={countdownRef}
                className={`font-black text-white drop-shadow-[0_0_24px_rgba(245,61,137,0.95)] transition-transform duration-200 ${
                  countdown === 0 ? 'text-4xl sm:text-6xl text-pink-300 scale-110' : 'text-5xl sm:text-7xl scale-100'
                }`}
              >
                {countdown === 0 ? 'SMILE!' : countdown}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-white/80 uppercase tracking-widest mt-1">
                {countdown === 0 ? '★ FLASH ★' : 'HOLD STILL'}
              </span>
            </div>
          )}

          {/* Cancel button during capture sequence */}
          {isCapturing && (
            <button
              type="button"
              onClick={cancelSequence}
              data-testid="button-cancel-capture"
              className="absolute top-2 right-2 z-30 bg-black/70 hover:bg-black/90 text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20 transition-colors cursor-pointer"
            >
              CANCEL
            </button>
          )}
        </div>

        {/* ── Authentic Canon Camera Frame (Overlay on top of video) ── */}
        <img
          src="/canon_camera_frame.png"
          alt="Canon Digital Camera"
          className="relative z-10 w-full h-full object-contain pointer-events-none drop-shadow-[0_20px_45px_rgba(0,0,0,0.4)]"
          draggable={false}
        />

        {/* ── Interactive Physical Camera Controls ── */}

        {/* 1. Main Shutter Button on Circular Metallic Dial / FUNC SET */}
        <div
          className="absolute z-20 flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
          style={{ left: '78.41%', top: '40.28%', width: '21.5%', height: '30%' }}
        >
          <button
            type="button"
            onClick={handleShutterPress}
            disabled={isCapturing || isComplete}
            data-testid="button-capture"
            aria-label="Take Photo Shutter"
            title={isComplete ? "Session Complete" : isCapturing ? "Capturing..." : "Press Shutter to Shoot"}
            className={`group relative w-full h-full rounded-full flex items-center justify-center transition-all duration-150 focus:outline-none cursor-pointer ${
              isCapturing || isComplete
                ? 'opacity-60 cursor-not-allowed'
                : 'hover:scale-105 active:scale-95'
            }`}
          >
            {/* Shutter Pulse / Glow Ring */}
            {!isCapturing && !isComplete && (
              <span className="absolute inset-1 rounded-full border-2 border-primary/60 animate-ping opacity-30 pointer-events-none" />
            )}

            {/* Inner Metallic Shutter Core (Sits precisely over FUNC / SET) */}
            <div
              className={`w-[48%] h-[48%] rounded-full flex items-center justify-center transition-all shadow-md ${
                isCapturing
                  ? 'bg-zinc-700 text-white/40'
                  : isComplete
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-tr from-[#e03178] to-[#ff6da8] text-white hover:brightness-110 shadow-[0_2px_12px_rgba(245,61,137,0.7)] group-active:translate-y-0.5'
              }`}
            >
              {isComplete ? (
                <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
              ) : (
                <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
              )}
            </div>

            {/* Sleek Y2K Shutter Tooltip Pill */}
            {!isCapturing && !isComplete && (
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/90 text-pink-300 border border-pink-500/40 text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                SNAP SHUTTER
              </span>
            )}
          </button>
        </div>

        {/* 2. Interactive Flash Toggle Button (Over the Flash Icon at 3 o'clock on dial) */}
        <button
          type="button"
          onClick={() => setFlashEnabled(prev => !prev)}
          disabled={isCapturing}
          data-testid="button-toggle-flash"
          aria-label={flashEnabled ? "Disable Flash" : "Enable Flash"}
          title={flashEnabled ? "Flash ON (Click to disable)" : "Flash OFF (Click to enable)"}
          className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 w-[7.5%] h-[10.5%] rounded-full flex items-center justify-center transition-all focus:outline-none cursor-pointer ${
            flashEnabled
              ? 'bg-primary/90 text-white shadow-[0_0_10px_rgba(245,61,137,0.8)] scale-100 hover:scale-110 active:scale-90'
              : 'bg-black/60 hover:bg-black/80 text-white/70 hover:text-white scale-95 hover:scale-105 active:scale-90'
          }`}
          style={{ left: '87.5%', top: '40.28%' }}
        >
          {flashEnabled ? (
            <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
          ) : (
            <ZapOff className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          )}
        </button>

        {/* 3. Interactive Blue Button (Direct Print / Camera Flip & Restart at bottom-right) */}
        <button
          type="button"
          onClick={restartCamera}
          disabled={isCapturing}
          data-testid="button-restart-camera"
          aria-label="Restart Camera"
          title="Refresh / Flip Camera"
          className="group absolute z-20 -translate-x-1/2 -translate-y-1/2 w-[8%] h-[11%] rounded-full flex items-center justify-center bg-sky-500/0 hover:bg-sky-400/20 active:bg-sky-600/30 transition-all focus:outline-none cursor-pointer hover:scale-110 active:scale-90"
          style={{ left: '67.61%', top: '77.38%' }}
        >
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity bg-sky-500/80 shadow-md">
            <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          </div>
          <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/90 text-sky-300 border border-sky-500/40 text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            REFRESH
          </span>
        </button>

      </div>
    </div>
  );
}
