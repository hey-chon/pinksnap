import React from 'react';
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
    osc1.frequency.setValueAtTime(150, now);
    osc1.frequency.exponentialRampToValueAtTime(35, now + 0.05);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.005, now + 0.05);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.05);

    // Second click (shutter closing)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(200, now + 0.06);
    osc2.frequency.exponentialRampToValueAtTime(45, now + 0.12);
    gain2.gain.setValueAtTime(0.25, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.005, now + 0.12);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.06);
    osc2.stop(now + 0.12);
  } catch {
    // Audio context failed or not allowed
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
    <div className="relative w-full max-w-[580px] lg:max-w-[680px] xl:max-w-[740px] mx-auto select-none flex items-center justify-center">
      {/* ── Main Aspect Ratio Frame (Canon 704 x 504 = 1.3968:1) ── */}
      <div className="relative w-full aspect-[704/504] max-h-[calc(100dvh-175px)] flex items-center justify-center">
        
        {/* ── Live Webcam Screen (positioned precisely behind the LCD cutout) ── */}
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
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/92 text-white p-4 text-center z-30 backdrop-blur-xs">
              <AlertCircle className="w-8 h-8 text-primary mb-2" />
              <p className="font-black text-xs sm:text-sm tracking-wider mb-1">CAMERA UNAVAILABLE</p>
              <p className="text-[10px] sm:text-xs text-white/70 font-medium mb-3 max-w-[240px] line-clamp-2">
                {error || "Could not access camera. Continue in demo mode."}
              </p>
              <button
                type="button"
                onClick={() => setDemoMode(true)}
                data-testid="button-demo-mode"
                className="bg-primary hover:bg-primary/90 text-white text-xs font-black px-4 py-2 rounded-full shadow-md transition-transform active:scale-95 cursor-pointer"
              >
                USE DEMO MODE
              </button>
            </div>
          )}

          {/* Mirrored Live Video Stream */}
          <video
            ref={videoRef}
            data-testid="camera-preview"
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />

          {/* Minimal Viewfinder Corner Brackets */}
          <div className="absolute inset-2 sm:inset-3 pointer-events-none border border-white/15 rounded-md">
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white/60 -translate-x-0.5 -translate-y-0.5" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white/60 translate-x-0.5 -translate-y-0.5" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white/60 -translate-x-0.5 translate-y-0.5" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white/60 translate-x-0.5 translate-y-0.5" />
          </div>

          {/* Clean Screen Controls (Top Corners - Non-intrusive) */}
          {!isCapturing && (
            <div className="absolute top-2 inset-x-2 flex items-center justify-between z-20 pointer-events-auto">
              {/* Flash Toggle */}
              <button
                type="button"
                onClick={() => setFlashEnabled(prev => !prev)}
                data-testid="button-toggle-flash"
                aria-label={flashEnabled ? "Disable Flash" : "Enable Flash"}
                title={flashEnabled ? "Flash ON" : "Flash OFF"}
                className={`p-1.5 rounded-full backdrop-blur-md transition-all cursor-pointer focus:outline-none ${
                  flashEnabled
                    ? 'bg-primary/80 hover:bg-primary text-white shadow-md'
                    : 'bg-black/50 hover:bg-black/70 text-white/70 hover:text-white'
                }`}
              >
                {flashEnabled ? <Zap className="w-3.5 h-3.5 fill-current" /> : <ZapOff className="w-3.5 h-3.5" />}
              </button>

              {/* Flip / Refresh Camera */}
              <button
                type="button"
                onClick={restartCamera}
                data-testid="button-restart-camera"
                aria-label="Restart Camera"
                title="Restart Camera"
                className="p-1.5 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white/70 hover:text-white transition-all cursor-pointer focus:outline-none"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Countdown Overlay */}
          {countdown !== null && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 backdrop-blur-[1px] z-20 pointer-events-none">
              <span
                ref={countdownRef}
                className={`font-black text-white drop-shadow-[0_0_24px_rgba(245,61,137,0.95)] transition-transform duration-200 ${
                  countdown === 0 ? 'text-4xl sm:text-6xl text-pink-300 scale-110' : 'text-5xl sm:text-7xl scale-100'
                }`}
              >
                {countdown === 0 ? 'SMILE!' : countdown}
              </span>
            </div>
          )}

          {/* Cancel Button during capture */}
          {isCapturing && (
            <button
              type="button"
              onClick={cancelSequence}
              data-testid="button-cancel-capture"
              className="absolute top-2 right-2 z-30 bg-black/75 hover:bg-black/95 text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/20 transition-colors cursor-pointer"
            >
              CANCEL
            </button>
          )}
        </div>

        {/* ── Authentic Canon Camera Frame (Overlay) ── */}
        <img
          src="/canon_camera_frame.png"
          alt="Canon Digital Camera"
          className="relative z-10 w-full h-full object-contain pointer-events-none drop-shadow-[0_16px_36px_rgba(0,0,0,0.38)]"
          draggable={false}
        />

        {/* ── Camera Shutter Button Centered on Canon's Round Dial / FUNC SET ── */}
        <button
          type="button"
          onClick={handleShutterPress}
          disabled={isCapturing || isComplete}
          data-testid="button-capture"
          aria-label="Take Photo Shutter"
          title={isComplete ? "Session Complete" : isCapturing ? "Capturing..." : "Press Shutter"}
          style={{
            left: '78.27%',
            top: '61.90%',
            width: '10.5%',
            aspectRatio: '1 / 1',
          }}
          className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center pointer-events-auto cursor-pointer focus:outline-none ${
            isCapturing || isComplete
              ? 'opacity-65 cursor-not-allowed'
              : 'hover:brightness-105 active:brightness-95'
          }`}
        >
          {/* Authentic Clean Shutter Face (No animations) */}
          <div
            className={`w-full h-full rounded-full flex items-center justify-center ${
              isComplete
                ? 'bg-emerald-600 text-white'
                : 'bg-[radial-gradient(circle_at_35%_30%,#ffffff_0%,#f0f0f4_45%,#d0d0d8_80%,#aaaaaa_100%)] text-[#2d2d35] border border-white/90 shadow-[0_2px_6px_rgba(0,0,0,0.45),inset_0_1px_2px_rgba(255,255,255,0.9),inset_0_-2px_3px_rgba(0,0,0,0.3)]'
            }`}
          >
            {isComplete ? (
              <Check className="w-4 h-4 stroke-[3]" />
            ) : (
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-[#2d2d35] drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]" />
            )}
          </div>
        </button>

      </div>
    </div>
  );
}
