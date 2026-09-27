import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';

/**
 * Printing page — shown while the strip is being saved.
 * Full-screen, non-dismissible. Auto-navigates to /receipt after a brief print animation.
 * Uses `replace: true` so the user cannot navigate back here.
 */
export default function Printing() {
  const [, setLocation] = useLocation();
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'warming' | 'printing' | 'finishing'>('warming');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Block browser back button during printing
  useEffect(() => {
    const blockBack = (e: PopStateEvent) => {
      window.history.pushState(null, '', window.location.href);
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', blockBack);
    return () => window.removeEventListener('popstate', blockBack);
  }, []);

  useEffect(() => {
    let elapsed = 0;
    const TOTAL = 4000; // 4 seconds total

    intervalRef.current = setInterval(() => {
      elapsed += 50;
      const pct = Math.min((elapsed / TOTAL) * 100, 100);
      setProgress(pct);

      if (pct < 25) {
        setPhase('warming');
      } else if (pct < 85) {
        setPhase('printing');
      } else {
        setPhase('finishing');
      }

      if (elapsed >= TOTAL) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        // Navigate to receipt — replace so user can't go back
        setLocation('/receipt', { replace: true });
      }
    }, 50);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [setLocation]);

  const phaseLabel =
    phase === 'warming'
      ? 'Warming up the printer...'
      : phase === 'printing'
        ? 'Printing your strip...'
        : 'Almost done...';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white select-none">
      <style>{`
        @keyframes printerFeed {
          0% { transform: translateY(-20px); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translateY(0px); opacity: 1; }
        }
        @keyframes printerLine {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes printerDot {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.7); }
          40% { opacity: 1; transform: scale(1); }
        }
        @keyframes printerShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-1px); }
          75% { transform: translateX(1px); }
        }
        .print-feed { animation: printerFeed 0.6s ease-out both; }
        .print-shake { animation: printerShake 0.15s ease-in-out infinite; }
        .print-dot-1 { animation: printerDot 1.4s ease-in-out infinite 0s; }
        .print-dot-2 { animation: printerDot 1.4s ease-in-out infinite 0.2s; }
        .print-dot-3 { animation: printerDot 1.4s ease-in-out infinite 0.4s; }
      `}</style>

      <div className="flex flex-col items-center text-center px-6 print-feed">
        {/* Printer icon */}
        <div className={`relative mb-8 ${phase === 'printing' ? 'print-shake' : ''}`}>
          {/* Printer body */}
          <div className="w-28 h-20 bg-[#2a2a2a] rounded-lg relative overflow-hidden shadow-xl">
            {/* Printer slot */}
            <div className="absolute top-0 left-3 right-3 h-[6px] bg-[#1a1a1a] rounded-b-sm" />
            {/* Paper coming out */}
            <div
              className="absolute -top-1 left-1/2 -translate-x-1/2 bg-white shadow-md border border-black/10 rounded-[2px] transition-all duration-300"
              style={{
                width: '56px',
                height: `${Math.min(progress * 0.6, 48)}px`,
                transform: `translateX(-50%) translateY(-${Math.min(progress * 0.5, 40)}px)`,
              }}
            >
              {/* Tiny strip lines on the paper */}
              {progress > 20 && (
                <div className="p-1 flex flex-col gap-[3px] mt-1">
                  <div className="w-full h-[4px] bg-black/10 rounded-[1px]" />
                  {progress > 40 && <div className="w-full h-[4px] bg-black/10 rounded-[1px]" />}
                  {progress > 55 && <div className="w-full h-[4px] bg-black/10 rounded-[1px]" />}
                  {progress > 70 && <div className="w-full h-[4px] bg-black/10 rounded-[1px]" />}
                </div>
              )}
            </div>
            {/* LED indicator */}
            <div className={`absolute bottom-3 right-3 w-2 h-2 rounded-full ${
              phase === 'printing' ? 'bg-green-400 shadow-[0_0_6px_#4ade80]' : 'bg-amber-400 shadow-[0_0_6px_#fbbf24]'
            }`} />
            {/* Brand */}
            <div className="absolute bottom-3 left-3">
              <span className="text-[6px] font-black text-white/30 tracking-widest">PINKSNAP</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-56 sm:w-64 h-[6px] bg-black/5 rounded-full overflow-hidden mb-5 border border-black/10">
          <div
            className="h-full bg-gradient-to-r from-[#f53d89] to-[#ff7eb3] rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Phase label */}
        <p className="text-xs font-bold text-black/50 tracking-wide uppercase mb-3">
          {phaseLabel}
        </p>

        {/* Loading dots */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#f53d89] print-dot-1" />
          <span className="w-2 h-2 rounded-full bg-[#f53d89] print-dot-2" />
          <span className="w-2 h-2 rounded-full bg-[#f53d89] print-dot-3" />
        </div>

        {/* Progress percentage */}
        <p className="mt-5 text-[11px] font-mono text-black/30 tracking-wider">
          {Math.round(progress)}%
        </p>
      </div>
    </div>
  );
}
