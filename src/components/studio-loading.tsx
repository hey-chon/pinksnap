import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Camera, Check, Frame, Settings2, Sparkles, SunMedium } from 'lucide-react';

const messages = [
  { label: 'Setting up your camera', icon: Camera },
  { label: 'Checking your lighting', icon: SunMedium },
  { label: 'Preparing your photo strip', icon: Frame },
  { label: 'Opening your photo booth', icon: Settings2 },
];

export default function StudioLoading() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setStep((current) => Math.min(current + 1, messages.length - 1));
    }, 650);
    const timeout = window.setTimeout(() => setLocation('/setup', { replace: true }), 3100);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [setLocation]);

  const progress = ((step + 1) / messages.length) * 100;

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
        @keyframes loading-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
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
        @keyframes loading-progress-pulse {
          0%, 100% { opacity: .85; }
          50% { opacity: 1; }
        }
        @keyframes loading-dot-bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-4px); }
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

      <main className="relative z-10 w-full max-w-sm text-center flex flex-col items-center">

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
        <div className="reveal-pop flex items-center justify-center gap-1.5 font-black text-[32px] leading-none tracking-[-.04em] mb-1.5">
          <span style={{ color: '#2a1520' }}>PINK</span>
          <span style={{ color: '#f53d89' }}>SNAP</span>
        </div>
        <p
          className="reveal-pop text-[10px] font-black uppercase tracking-[.28em] mb-8"
          style={{ color: 'rgba(80,30,50,.35)' }}
        >
          warming up the booth
          {/* Animated dots */}
          {[0, 1, 2].map(i => (
            <span
              key={i}
              style={{
                display: 'inline-block',
                animation: `loading-dot-bounce 1.2s ease-in-out ${i * 0.15}s infinite`,
              }}
            >.</span>
          ))}
        </p>

        {/* Step checklist card */}
        <div
          className="reveal-pop w-full rounded-2xl overflow-hidden mb-6"
          style={{
            background: 'rgba(255,255,255,.75)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(245,61,137,.12)',
            boxShadow: '0 8px 32px -4px rgba(245,61,137,.08), 0 2px 8px rgba(0,0,0,.02)',
          }}
        >
          <div className="p-4 flex flex-col gap-1">
            {messages.map((msg, i) => {
              const Icon = msg.icon;
              const isDone = i < step;
              const isActive = i === step;

              return (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300"
                  style={{
                    background: isActive ? 'rgba(245,61,137,.06)' : 'transparent',
                    opacity: i > step ? 0.35 : 1,
                  }}
                >
                  {/* Step indicator */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300"
                    style={{
                      background: isDone
                        ? 'linear-gradient(135deg, #f53d89, #ff6ba8)'
                        : isActive
                          ? 'rgba(245,61,137,.12)'
                          : 'rgba(0,0,0,.04)',
                      boxShadow: isDone ? '0 3px 10px -2px rgba(245,61,137,.35)' : 'none',
                    }}
                  >
                    {isDone ? (
                      <Check className="w-4 h-4 text-white stroke-[2.5]" />
                    ) : (
                      <Icon
                        className="w-4 h-4 transition-colors duration-300"
                        style={{ color: isActive ? '#f53d89' : 'rgba(0,0,0,.25)' }}
                      />
                    )}
                  </div>

                  {/* Label */}
                  <span
                    className="text-[12px] font-bold tracking-wide text-left transition-colors duration-300"
                    style={{
                      color: isDone
                        ? '#f53d89'
                        : isActive
                          ? '#2a1520'
                          : 'rgba(0,0,0,.3)',
                    }}
                  >
                    {msg.label}
                  </span>

                  {/* Active dot indicator */}
                  {isActive && (
                    <div className="ml-auto w-2 h-2 rounded-full shrink-0" style={{
                      background: '#f53d89',
                      animation: 'loading-progress-pulse 1s ease-in-out infinite',
                      boxShadow: '0 0 6px rgba(245,61,137,.4)',
                    }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div style={{ height: 3, background: 'rgba(245,61,137,.06)' }}>
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #f53d89, #ff6ba8)',
                borderRadius: '0 4px 4px 0',
                transition: 'width 0.5s cubic-bezier(.22, 1, .36, 1)',
                boxShadow: '0 0 8px rgba(245,61,137,.3)',
              }}
            />
          </div>
        </div>

        {/* Step counter */}
        <p className="reveal-pop text-[10px] font-black uppercase tracking-[.2em]" style={{ color: 'rgba(80,30,50,.3)' }}>
          Step {step + 1} of {messages.length}
        </p>

      </main>
    </div>
  );
}
