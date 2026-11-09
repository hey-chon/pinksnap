import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import { TopNav } from '@/components/layout';
import { Camera, X } from 'lucide-react';
import { useAppContext } from '@/lib/store';
import { useCamera } from '@/hooks/use-camera';
import { getFrameOption } from '@/lib/customization';
import { CanonCamera, playMechanicalShutterSound } from '@/components/canon-camera';

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
  const { layout, frame, shots, addShot, removeShot, clearShots } = useAppContext();
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

  // Detect if we're in retake mode (came from /edit retake flow)
  const [isRetaking] = useState(() => sessionStorage.getItem('ps_retaking') === '1');

  useEffect(() => {
    // If shots are already completed, redirect to /edit
    if (shots.length >= maxShots) {
      sessionStorage.removeItem('ps_retaking');
      setLocation('/edit', { replace: true });
    }
  }, [shots.length, maxShots, setLocation]);

  // Start camera only once on mount — NOT on every shots.length change
  useEffect(() => {
    startCamera();
  }, [startCamera]);

  const cancelSequence = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (sequenceRef.current) {
      clearTimeout(sequenceRef.current);
      sequenceRef.current = null;
    }
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
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
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
          playMechanicalShutterSound();
          
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
    <div ref={studioRef} className="flex flex-col h-[100dvh] overflow-hidden bg-background">
      <div id="camera-flash" className="fixed inset-0 bg-white z-[100] opacity-0 pointer-events-none transition-opacity duration-150 ease-out" />
      
      <TopNav backTo={isRetaking ? undefined : '/setup'} onBack={isRetaking ? () => window.location.reload() : undefined} />
      
      <main className="flex-1 overflow-y-auto lg:overflow-hidden flex flex-col items-center justify-between px-3 py-2 sm:px-6 sm:py-4">
        {/* Studio Heading */}
        <div className="studio-heading text-center mb-1 sm:mb-4 w-full max-w-2xl shrink-0">
          <span className="booth-heading-kicker mb-1 sm:mb-2">Step 2 of 3 · STUDIO</span>
          <h1 className="font-hero text-2xl sm:text-3xl md:text-4xl text-foreground mt-1 mb-1">
            PINKSNAP <span className="text-primary">STUDIO</span>
          </h1>
          <p className="text-[11px] sm:text-xs font-bold text-primary uppercase tracking-[.18em] h-5">
            {countdown === null ? 'READY WHEN YOU ARE' : countdown === 0 ? 'SMILE!' : 'GET READY...'}
          </p>
        </div>

        {/* Central Stage: Canon Y2K Camera + Strip Preview */}
        <div className="flex flex-col lg:flex-row gap-5 lg:gap-8 xl:gap-12 w-full max-w-5xl items-center justify-center flex-1 min-h-0 my-auto pb-4">

          {/* Authentic Y2K Canon Digital Camera View */}
          <div className="studio-panel w-full max-w-xl lg:max-w-2xl flex flex-col items-center justify-center">
            <CanonCamera
              videoRef={videoRef}
              isCapturing={isCapturing}
              countdown={countdown}
              countdownRef={countdownRef}
              flashEnabled={flashEnabled}
              setFlashEnabled={setFlashEnabled}
              restartCamera={restartCamera}
              startSequence={startSequence}
              cancelSequence={cancelSequence}
              showDemoPrompt={showDemoPrompt}
              demoMode={demoMode}
              setDemoMode={setDemoMode}
              error={error}
              shotsCount={shots.length}
              maxShots={maxShots}
            />
          </div>

          {/* Strip Preview Sidebar */}
          <div className="studio-panel strip-sidebar w-full lg:w-48 xl:w-52 shrink-0 flex flex-col gap-1.5 sm:gap-2 p-2.5 sm:p-3.5 bg-white shadow-xl border border-white/60 rounded-xl sm:rounded-2xl rotate-0 lg:rotate-2 h-auto min-h-[96px] sm:min-h-[120px] lg:h-auto lg:min-h-0 lg:flex-none">
            <div className="flex justify-between items-center mb-1 shrink-0 px-0.5">
              <span className="font-display text-sm sm:text-lg text-foreground/75 tracking-[.12em]">YOUR STRIP</span>
              <div className="booth-led scale-75 origin-right shrink-0">
                SHOT <b>{Math.min(shots.length + 1, maxShots)}</b> / {maxShots}
              </div>
            </div>
            
            <div className={`w-full flex lg:flex-col items-center lg:items-stretch gap-2 p-1.5 sm:p-2 rounded-xl overflow-x-auto overflow-y-hidden lg:overflow-y-auto snap-x custom-scrollbar ${stripBgClass} flex-1 min-h-[64px]`}>
              {Array.from({ length: maxShots }).map((_, i) => (
                <div key={i} data-testid={`studio-shot-${i + 1}`} className="studio-shot-card aspect-[4/3] bg-black/5 rounded-lg overflow-hidden border border-black/10 shrink-0 h-[56px] sm:h-[68px] lg:h-auto w-auto lg:w-full snap-center shadow-inner relative group">
                  {shots[i] ? (
                    <>
                      <img src={shots[i]} alt={`Shot ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeShot(i)}
                        className="absolute top-1.5 right-1.5 bg-black/50 hover:bg-red-500 text-white rounded-full p-1 transition-colors z-10 cursor-pointer"
                        title="Retake this shot"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div className="absolute bottom-1 right-1 bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 rounded pointer-events-none">
                        {i + 1}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-black/10">
                      <Camera className="w-5 h-5 lg:w-7 lg:h-7" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
