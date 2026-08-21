import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import { TopNav, BottomNav } from '@/components/layout';
import { Camera, Zap, ZapOff, RefreshCw, AlertCircle, Trash2 } from 'lucide-react';
import { useAppContext } from '@/lib/store';
import { useCamera } from '@/hooks/use-camera';
import { getFrameOption } from '@/lib/customization';

function createDemoShot(index: number) {
  const colors = [
    ['#ffd5e6', '#cceaff'],
    ['#d7f5f0', '#ead6ff'],
    ['#ffe0c7', '#ffd2ed'],
    ['#d6e4ff', '#f9d7e8'],
  ];
  const [start, end] = colors[index % colors.length];
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
      <defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${start}"/><stop offset="1" stop-color="${end}"/></linearGradient></defs>
      <rect width="1200" height="900" fill="url(#g)"/>
      <circle cx="600" cy="350" r="145" fill="#fff" fill-opacity=".55"/>
      <rect x="520" y="342" width="160" height="120" rx="24" fill="#fff" fill-opacity=".8"/>
      <circle cx="600" cy="402" r="35" fill="${start}"/>
      <circle cx="650" cy="365" r="10" fill="${end}"/>
      <text x="600" y="610" text-anchor="middle" font-family="Inter, sans-serif" font-size="42" font-weight="800" fill="#4d3c5b">DEMO SHOT ${index + 1}</text>
      <text x="600" y="665" text-anchor="middle" font-family="Inter, sans-serif" font-size="24" fill="#4d3c5b" opacity=".7">Camera preview fallback</text>
    </svg>
  `)}`;
}

export default function Studio() {
  const [, setLocation] = useLocation();
  const { layout, frame, shots, addShot, clearShots } = useAppContext();
  const { videoRef, startCamera, stopCamera, captureFrame, error } = useCamera();
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(true);
  
  const timerRef = useRef<ReturnType<typeof window.setInterval> | null>(null);
  const sequenceRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const studioRef = useRef<HTMLDivElement>(null);
  const captureButtonRef = useRef<HTMLButtonElement>(null);
  const countdownRef = useRef<HTMLSpanElement>(null);
  
  const maxShots = layout === 'horizontal-3' ? 3 : 4;

  useEffect(() => {
    clearShots();
    startCamera();
  }, []);

  const cancelSequence = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (sequenceRef.current) clearTimeout(sequenceRef.current);
    setIsCapturing(false);
    setCountdown(null);
  }, []);

  useEffect(() => {
    return () => {
      cancelSequence();
      stopCamera();
    };
  }, [cancelSequence, stopCamera]);

  const startSequence = useCallback(() => {
    if (isCapturing || shots.length >= maxShots) return;
    
    setIsCapturing(true);
    let currentShot = shots.length;

    const takeNextShot = () => {
      if (currentShot >= maxShots) {
        setIsCapturing(false);
        sequenceRef.current = setTimeout(() => setLocation('/edit'), 1000);
        return;
      }

      let count = 3;
      setCountdown(count);
      
      timerRef.current = setInterval(() => {
        count--;
        if (count > 0) {
          setCountdown(count);
        } else if (count === 0) {
          setCountdown(0);
        } else {
          if (timerRef.current) clearInterval(timerRef.current);
          setCountdown(null);
          
          if (flashEnabled) {
            const flash = document.getElementById('camera-flash');
            if (flash) {
              flash.classList.remove('opacity-0');
              flash.classList.add('opacity-100');
              setTimeout(() => {
                flash.classList.remove('opacity-100');
                flash.classList.add('opacity-0');
              }, 150);
            }
          }
          
          // Keep the sequence moving if a camera frame is not ready at the
          // exact countdown moment, especially on iPhone Safari.
          const capturedDataUrl = demoMode
            ? createDemoShot(currentShot)
            : captureFrame() || createDemoShot(currentShot);
          if (capturedDataUrl) {
            addShot(capturedDataUrl);
            currentShot++;
          }
          
          sequenceRef.current = setTimeout(takeNextShot, 1500);
        }
      }, 1000);
    };

    takeNextShot();
  }, [isCapturing, shots.length, maxShots, captureFrame, addShot, setLocation, flashEnabled, demoMode]);

  const restartCamera = async () => {
    cancelSequence();
    stopCamera();
    await new Promise(resolve => setTimeout(resolve, 100));
    await startCamera();
  };

  const handleClearSession = () => {
    cancelSequence();
    clearShots();
  };

  const showDemoPrompt = Boolean(error) && !demoMode;
  const stripBgClass = getFrameOption(frame).className;

  return (
    <div ref={studioRef} className="flex flex-col h-[100dvh]">
      <div id="camera-flash" className="fixed inset-0 bg-white z-[100] opacity-0 pointer-events-none transition-opacity duration-150 ease-out" />
      
      <TopNav backTo="/setup" />
      
      <main className="flex-1 overflow-y-auto flex flex-col items-center px-4 py-7 sm:px-6 sm:py-9">
        <div className="studio-heading text-center mb-7 w-full max-w-[34rem]">
          <span className="booth-heading-kicker mb-3">Step 2 of 3 · Live booth</span>
          <h1 className="font-display text-[2.6rem] leading-[.95] sm:text-5xl md:text-6xl text-foreground mt-4 mb-2">
            STEP INSIDE.
          </h1>
          <p className="text-[11px] sm:text-xs font-black text-primary uppercase tracking-[.2em] h-5">
            {countdown === null ? 'READY WHEN YOU ARE' : countdown === 0 ? 'SMILE!' : 'GET READY...'}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 w-full max-w-5xl items-center lg:items-start justify-center pb-12">

          {/* Main Camera View */}
          <div className="studio-panel w-full max-w-3xl flex flex-col items-center gap-4">
            <div className="booth-cabinet w-full">
              <div className="flex items-center justify-between gap-2 px-1 sm:px-2 pb-3">
                <span className="bulb-row" aria-hidden="true">{Array.from({ length: 4 }).map((_, i) => <i key={i} />)}</span>
                <span className="font-display text-base sm:text-xl text-white/85 tracking-[.14em] sm:tracking-[.2em] whitespace-nowrap">PINKSNAP BOOTH</span>
                <span className="bulb-row" aria-hidden="true">{Array.from({ length: 4 }).map((_, i) => <i key={i} />)}</span>
              </div>
              <div className="booth-screen relative w-full aspect-[4/3] bg-black overflow-hidden shrink-0">


              
              {showDemoPrompt && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/90 text-white p-6 text-center z-20 backdrop-blur-sm">
                  <AlertCircle className="w-12 h-12 text-primary mb-4" />
                  <p className="font-black text-xl tracking-wider mb-2">CAMERA UNAVAILABLE</p>
                  <p className="text-sm text-white/70 font-medium mb-8 max-w-sm">
                    {error || "Could not access camera. You can still test the flow using demo frames."}
                  </p>
                  <button 
                    onClick={() => setDemoMode(true)}
                    data-testid="button-demo-mode"
                    className="bg-primary text-white px-8 py-4 rounded-full font-black shadow-lg shadow-primary/40 hover:scale-105 active:scale-95 transition-transform"
                  >
                    CONTINUE IN DEMO MODE
                  </button>
                  <div className="w-full h-full absolute inset-0 bg-gradient-to-br from-pink-500/10 to-purple-500/10 -z-10 blur-xl" />
                </div>
              )}
              
              <video 
                ref={videoRef}
                data-testid="camera-preview"
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover scale-x-[-1]"
              />
              
              {/* Target guidelines */}
              <div className="absolute inset-6 md:inset-10 border-2 border-white/20 pointer-events-none rounded-xl">
                <div className="absolute top-0 left-0 w-6 h-6 md:w-8 md:h-8 border-t-4 border-l-4 border-white/70 -translate-x-1 -translate-y-1" />
                <div className="absolute top-0 right-0 w-6 h-6 md:w-8 md:h-8 border-t-4 border-r-4 border-white/70 translate-x-1 -translate-y-1" />
                <div className="absolute bottom-0 left-0 w-6 h-6 md:w-8 md:h-8 border-b-4 border-l-4 border-white/70 -translate-x-1 translate-y-1" />
                <div className="absolute bottom-0 right-0 w-6 h-6 md:w-8 md:h-8 border-b-4 border-r-4 border-white/70 translate-x-1 translate-y-1" />
              </div>

              {/* Countdown overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] z-10">
                  <span ref={countdownRef} className={`font-black text-white drop-shadow-[0_0_20px_rgba(255,107,129,0.8)] transition-all ${countdown === 0 ? 'text-7xl md:text-9xl scale-110' : 'text-8xl md:text-[10rem]'}`}>
                    {countdown === 0 ? 'SMILE!' : countdown}
                  </span>
                </div>
              )}

              {/* Cancel button when capturing */}
              {isCapturing && (
                <button 
                  onClick={cancelSequence}
                  data-testid="button-cancel-capture"
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 backdrop-blur-md text-white px-4 py-2 rounded-full font-bold text-xs tracking-wider transition-colors z-20"
                >
                  CANCEL
                </button>
              )}
              </div>
              <div className="curtain-band mt-3 mx-2" aria-hidden="true" />
            </div>

            {/* Camera Controls */}
            <div className="booth-plate w-full flex justify-between items-center gap-2 p-3 sm:p-4">

                <button 
                onClick={restartCamera}
                  data-testid="button-restart-camera"
                className="p-2.5 sm:p-3 bg-white/50 hover:bg-white text-foreground/70 hover:text-foreground rounded-2xl transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Restart Camera"
              >
                <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              
              <div className="flex flex-col items-center">
                <button
                  ref={captureButtonRef}
                  onClick={startSequence}
                   disabled={isCapturing || shots.length >= maxShots}
                  data-testid="button-capture"
                  className={`relative w-[4.25rem] h-[4.25rem] sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full border-4 border-primary/30 flex items-center justify-center transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/50 ${
                    (isCapturing || shots.length >= maxShots)
                      ? 'opacity-50 scale-95' 
                      : 'hover:scale-105 active:scale-95 cursor-pointer hover:border-primary/50'
                  }`}
                  aria-label="Capture Sequence"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-primary rounded-full shadow-[0_0_20px_rgba(255,107,129,0.5)] flex items-center justify-center text-white">
                    <Camera className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10" />
                  </div>
                </button>
                <div className="booth-led mt-3">
                  SHOT <b>{Math.min(shots.length + 1, maxShots)}</b> / {maxShots}
                </div>

              </div>
              
              <button 
                 onClick={() => setFlashEnabled(prev => !prev)}
                 data-testid="button-toggle-flash"
                className={`p-2.5 sm:p-3 rounded-2xl transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${flashEnabled ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-white/50 text-foreground/40 hover:text-foreground hover:bg-white border border-transparent'}`}
                aria-label={flashEnabled ? "Disable Flash" : "Enable Flash"}
              >
                {flashEnabled ? <Zap className="w-5 h-5 sm:w-6 sm:h-6" /> : <ZapOff className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>
            </div>
          </div>

          {/* Strip Preview Sidebar */}
          <div className="studio-panel w-full lg:w-56 shrink-0 flex flex-col gap-2 p-3 sm:p-4 bg-white shadow-xl border border-white/60 rounded-2xl rotate-0 lg:rotate-2">
            <div className="flex justify-between items-center mb-1">
              <span className="font-display text-xl text-foreground/75 tracking-[.12em]">YOUR STRIP</span>

              {shots.length > 0 && (
                <button 
                  onClick={handleClearSession}
                  data-testid="button-clear-session"
                  className="text-[10px] font-bold text-destructive flex items-center gap-1 hover:underline focus:outline-none rounded px-1"
                >
                  <Trash2 className="w-3 h-3" /> CLEAR
                </button>
              )}
            </div>
            
            <div className={`w-full flex lg:flex-col gap-2 p-2 rounded-xl overflow-x-auto snap-x custom-scrollbar ${stripBgClass}`}>
              {Array.from({ length: maxShots }).map((_, i) => (
                <div key={i} data-testid={`studio-shot-${i + 1}`} className="studio-shot-card aspect-[4/3] bg-black/5 rounded-lg overflow-hidden border border-black/10 shrink-0 w-[128px] sm:w-[160px] lg:w-full snap-center shadow-inner relative">
                  {shots[i] ? (
                    <img src={shots[i]} alt={`Shot ${i + 1}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-black/10">
                      <Camera className="w-8 h-8" />
                    </div>
                  )}
                  {shots[i] && (
                    <div className="absolute bottom-1 right-1 bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 rounded">
                      {i + 1}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
