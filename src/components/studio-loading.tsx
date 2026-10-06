import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Camera, Sparkles } from 'lucide-react';

export default function StudioLoading() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    sessionStorage.removeItem('receipt_completed');
    const duration = 3100;
    const timeout = window.setTimeout(() => {
      sessionStorage.setItem('ps_has_loaded', 'true');
      setLocation('/setup', { replace: true });
    }, duration);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [setLocation]);

  return (
    <div
      className="min-h-[100dvh] flex items-center justify-center px-6 py-12 overflow-hidden relative"
      style={{ background: 'linear-gradient(160deg, #fff0f5 0%, #fff7fa 35%, #ffe8f0 70%, #fff0f5 100%)' }}
    >
      {/* Inline keyframes for loading-specific animations */}
      <style>{`
        @keyframes loading-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(3deg); }
        }
        @keyframes loading-pulse-ring {
          0% { transform: scale(1); opacity: .6; }
          50% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: .6; }
        }
        @keyframes loading-sparkle {
          0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
          50% { opacity: 1; transform: scale(1) rotate(180deg); }
        }
        @keyframes bounce-dots {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>

      {/* Ambient glow blobs — soft pink tones */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{
          position: 'absolute', top: '8%', left: '5%',
          width: '380px', height: '380px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,61,137,.12) 0%, transparent 65%)',
          filter: 'blur(70px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '5%',
          width: '320px', height: '320px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,182,210,.18) 0%, transparent 65%)',
          filter: 'blur(70px)',
        }} />
        <div style={{
          position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,200,220,.12) 0%, transparent 55%)',
          filter: 'blur(90px)',
        }} />
      </div>

      {/* Floating decorative sparkles */}
      {[
        { top: '18%', left: '15%', size: 10, delay: '0s', dur: '3s' },
        { top: '25%', right: '18%', size: 8, delay: '0.8s', dur: '2.6s' },
        { top: '72%', left: '20%', size: 6, delay: '1.4s', dur: '3.2s' },
        { top: '65%', right: '14%', size: 9, delay: '0.4s', dur: '2.8s' },
        { top: '40%', left: '8%', size: 7, delay: '1s', dur: '3.4s' },
        { top: '50%', right: '10%', size: 5, delay: '1.8s', dur: '2.4s' },
      ].map((s, i) => (
        <div
          key={i}
          className="absolute pointer-events-none"
          style={{
            top: s.top, left: (s as any).left, right: (s as any).right,
            width: s.size, height: s.size,
            animation: `loading-sparkle ${s.dur} ease-in-out ${s.delay} infinite`,
          }}
        >
          <Sparkles style={{ width: s.size, height: s.size, color: '#f53d89', opacity: 0.4 }} />
        </div>
      ))}

      <main className="relative z-10 w-full max-w-sm text-center flex flex-col items-center justify-center">

        {/* Logo icon with pulse ring */}
        <div
          className="reveal-pop relative mx-auto mb-8 w-[104px] h-[104px] flex items-center justify-center"
          style={{ animation: 'loading-float 3.5s ease-in-out infinite' }}
        >
          {/* Outer pulse ring */}
          <div
            className="absolute -inset-4"
            style={{
              borderRadius: '30px',
              border: '2px solid rgba(245,61,137,.15)',
              animation: 'loading-pulse-ring 2s ease-in-out infinite',
            }}
          />
          {/* Spinning dashed ring */}
          <div
            className="absolute -inset-3 animate-spin"
            style={{
              borderRadius: '28px',
              border: '1.5px dashed rgba(245,61,137,.2)',
              borderTopColor: 'rgba(245,61,137,.6)',
              animationDuration: '2.8s',
            }}
          />
          {/* Main icon card */}
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              borderRadius: '24px',
              background: 'linear-gradient(145deg, #ffffff, #fff0f5)',
              border: '1.5px solid rgba(245,61,137,.18)',
              boxShadow: '0 12px 40px -8px rgba(245,61,137,.18), 0 4px 12px rgba(0,0,0,.03), inset 0 1px 0 rgba(255,255,255,1)',
            }}
          >
            <Camera className="w-12 h-12 stroke-[1.8]" style={{ color: '#f53d89' }} />
          </div>
          <Sparkles className="absolute -top-1 -right-1 w-5 h-5" style={{ color: '#f53d89', filter: 'drop-shadow(0 0 4px rgba(245,61,137,.3))' }} />
        </div>

        {/* Wordmark */}
        <div className="reveal-pop flex items-center justify-center font-black text-[32px] leading-none tracking-[-.04em]">
          <span style={{ color: '#2a1520' }}>PINK</span>
          <span style={{ color: '#f53d89' }}>SNAP</span>
        </div>
        
        {/* Subtle loading indication to replace the bar */}
        <div className="mt-5 flex items-center justify-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" style={{ animation: 'bounce-dots 1s ease-in-out infinite 0s' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-primary/70" style={{ animation: 'bounce-dots 1s ease-in-out infinite 0.15s' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-primary/40" style={{ animation: 'bounce-dots 1s ease-in-out infinite 0.3s' }} />
        </div>

      </main>
    </div>
  );
}