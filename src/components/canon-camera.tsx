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
    startSequence();
  };

  return (
    <div className="relative w-full max-w-[440px] sm:max-w-[620px] lg:max-w-[700px] xl:max-w-[760px] mx-auto select-none flex items-center justify-center">
      {/* ── Main Aspect Ratio Frame (Canon 704 x 504 = 1.3968:1) ── */}
      <div className="relative w-full aspect-[704/504] max-h-none sm:max-h-[calc(100dvh-170px)] flex items-center justify-center">
        
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
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/92 text-white p-3 sm:p-4 text-center z-30 backdrop-blur-xs">
              <AlertCircle className="w-7 h-7 sm:w-8 sm:h-8 text-primary mb-1.5" />
              <p className="font-black text-[11px] sm:text-xs tracking-wider mb-1">CAMERA UNAVAILABLE</p>
              <p className="text-[9px] sm:text-[11px] text-white/70 font-medium mb-2.5 max-w-[220px] line-clamp-2">
                {error || "Could not access camera. Continue in demo mode."}
              </p>
              <button
                type="button"
                onClick={() => setDemoMode(true)}
                data-testid="button-demo-mode"
                className="bg-primary hover:bg-primary/90 text-white text-[11px] font-black px-3.5 py-1.5 rounded-full shadow-md transition-transform active:scale-95 cursor-pointer"
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
            <div className="absolute top-0 left-0 w-2.5 h-2.5 sm:w-3 sm:h-3 border-t-2 border-l-2 border-white/60 -translate-x-0.5 -translate-y-0.5" />
            <div className="absolute top-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 border-t-2 border-r-2 border-white/60 translate-x-0.5 -translate-y-0.5" />
            <div className="absolute bottom-0 left-0 w-2.5 h-2.5 sm:w-3 sm:h-3 border-b-2 border-l-2 border-white/60 -translate-x-0.5 translate-y-0.5" />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 border-b-2 border-r-2 border-white/60 translate-x-0.5 translate-y-0.5" />
          </div>

          {/* Clean Screen Controls (Top Corners - Non-intrusive) */}
          {!isCapturing && (
            <div className="absolute top-1.5 sm:top-2 inset-x-1.5 sm:inset-x-2 flex items-center justify-between z-20 pointer-events-auto">
              {/* Flash Toggle */}
              <button
                type="button"
                onClick={() => setFlashEnabled(prev => !prev)}
                data-testid="button-toggle-flash"
                aria-label={flashEnabled ? "Disable Flash" : "Enable Flash"}
                title={flashEnabled ? "Flash ON" : "Flash OFF"}
                className={`p-1.5 rounded-full backdrop-blur-md cursor-pointer focus:outline-none ${
                  flashEnabled
                    ? 'bg-primary/80 hover:bg-primary text-white shadow-md'
                    : 'bg-black/50 hover:bg-black/70 text-white/70 hover:text-white'
                }`}
              >
                {flashEnabled ? <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" /> : <ZapOff className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
              </button>

              {/* Flip / Refresh Camera */}
              <button
                type="button"
                onClick={restartCamera}
                data-testid="button-restart-camera"
                aria-label="Restart Camera"
                title="Restart Camera"
                className="p-1.5 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white/70 hover:text-white cursor-pointer focus:outline-none"
              >
                <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>
          )}

          {/* Countdown Overlay */}
          {countdown !== null && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 backdrop-blur-[1px] z-20 pointer-events-none">
              <span
                ref={countdownRef}
                className={`font-black text-white drop-shadow-[0_0_24px_rgba(245,61,137,0.95)] ${
                  countdown === 0 ? 'text-3xl sm:text-6xl text-pink-300' : 'text-4xl sm:text-7xl'
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
              className="absolute top-2 right-2 z-30 bg-black/75 hover:bg-black/95 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20 cursor-pointer"
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

        {/* ── Shutter Button matching Grok reference adjusted to top-left ── */}
        <button
          type="button"
          onClick={handleShutterPress}
          disabled={isCapturing || isComplete}
          data-testid="button-capture"
          aria-label="Take Photo Shutter"
          title={isComplete ? "Session Complete" : isCapturing ? "Capturing..." : "Press Shutter"}
          style={{
            left: '76.4%',
            top: '57.5%',
            width: '21.0%',
            aspectRatio: '1 / 1',
          }}
          className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center pointer-events-auto cursor-pointer focus:outline-none ${
            isCapturing || isComplete
              ? 'opacity-65 cursor-not-allowed'
              : 'hover:brightness-105 active:brightness-95'
          }`}
        >
          {/* Pure white circular button face matching Grok design */}
          <div
            className={`w-full h-full rounded-full flex items-center justify-center border-2 transition-all ${
              isComplete
                ? 'bg-emerald-600 border-white text-white shadow-md'
                : 'bg-white border-[#d8d8e0] text-[#1c1c24] shadow-[0_2px_8px_rgba(0,0,0,0.35),inset_0_1px_2px_rgba(255,255,255,1),inset_0_-1px_2px_rgba(0,0,0,0.12)]'
            }`}
          >
            {isComplete ? (
              <Check className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
            ) : (
              <Camera className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-[#1c1c24] stroke-[2.2]" />
            )}
          </div>
        </button>

      </div>
    </div>
  );
}
