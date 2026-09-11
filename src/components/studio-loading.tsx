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
    const timeout = window.setTimeout(() => setLocation('/setup'), 3100);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [setLocation]);

  const progress = ((step + 1) / messages.length) * 100;

  return (
    <div
      className="min-h-[100dvh] flex items-center justify-center px-6 py-12 overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0a0507 0%, #100810 50%, #0d060b 100%)' }}
    >
      {/* Ambient glow blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div style={{
          position: 'absolute', top: '15%', left: '10%',
          width: '340px', height: '340px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,61,137,.18) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '20%', right: '8%',
          width: '280px', height: '280px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(226,183,106,.10) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
      </div>

      {/* Film sprocket dots left */}
      <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-evenly items-center py-8 pointer-events-none"
        style={{ opacity: 0.18 }}>
        {Array.from({ length: 11 }).map((_, i) => (
          <div key={i} style={{ width: '13px', height: '18px', borderRadius: '3px', background: 'rgba(255,255,255,.7)' }} />
        ))}
      </div>
      {/* Film sprocket dots right */}
      <div className="absolute right-0 top-0 bottom-0 w-8 flex flex-col justify-evenly items-center py-8 pointer-events-none"
        style={{ opacity: 0.18 }}>
        {Array.from({ length: 11 }).map((_, i) => (
          <div key={i} style={{ width: '13px', height: '18px', borderRadius: '3px', background: 'rgba(255,255,255,.7)' }} />
        ))}
      </div>

      <main className="relative z-10 w-full max-w-sm text-center">

        {/* Logo icon */}
        <div
          className="reveal-pop relative mx-auto mb-7 w-24 h-24 flex items-center justify-center"
          style={{
            borderRadius: '22px',
            background: 'linear-gradient(145deg, #1e1118, #2a0f1c)',
            border: '1px solid rgba(245,61,137,.35)',
            boxShadow: '0 0 40px -8px rgba(245,61,137,.45), inset 0 1px 0 rgba(255,255,255,.07)',
          }}
        >
          <div
            className="absolute -inset-3 animate-spin"
            style={{
              borderRadius: '28px',
              border: '1px dashed rgba(245,61,137,.4)',
              borderTopColor: 'rgba(245,61,137,.85)',
              animationDuration: '2.8s',
            }}
          />
          <Camera className="w-11 h-11 text-white stroke-[2.2]" />
          <Sparkles className="absolute top-2.5 right-2.5 w-4 h-4" style={{ color: '#f53d89' }} />
        </div>

        {/* Wordmark */}
        <div className="reveal-pop flex items-center justify-center gap-1.5 font-black text-[30px] leading-none tracking-[-.04em] mb-2">
          <span style={{ color: '#fdf7fa' }}>PINK</span>
          <span style={{ color: '#f53d89' }}>SNAP</span>
        </div>
        <p className="reveal-pop text-[10px] font-black uppercase tracking-[.26em] mb-8"
          style={{ color: 'rgba(255,255,255,.35)' }}>
          warming up the booth...
        </p>

        {/* Step list card */}
        <div
          className="reveal-pop p-5 space-y-3"
          style={{
            borderRadius: '1.4rem',
            background: 'rgba(255,255,255,.04)',
            border: '1px solid rgba(255,255,255,.09)',
            boxShadow: '0 24px 48px -20px rgba(0,0,0,.7)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {messages.map(({ label, icon: Icon }, index) => (
            <div
              key={label}
              className="flex items-center gap-3 text-sm font-bold transition-all duration-300"
              style={{ color: index <= step ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.22)' }}
            >
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300"
                style={{
                  background: index < step
                    ? 'linear-gradient(135deg, #f53d89, #c42d6a)'
                    : index === step
                      ? 'rgba(245,61,137,.15)'
                      : 'rgba(255,255,255,.05)',
                  boxShadow: index < step ? '0 4px 12px rgba(245,61,137,.4)' : 'none',
                }}
              >
                {index < step
                  ? <Check className="w-4 h-4 text-white" />
                  : <Icon
                      className={`w-3.5 h-3.5 ${index === step ? 'loading-dot' : ''}`}
                      style={{ color: index === step ? '#f53d89' : 'rgba(255,255,255,.2)' }}
                    />}
              </span>

              <span className="flex-1 text-left">{label}</span>

              {index === step && (
                <span className="flex gap-1">
                  <i className="loading-bounce" style={{ background: '#f53d89' }} />
                  <i className="loading-bounce" style={{ background: '#f53d89', animationDelay: '120ms' }} />
                  <i className="loading-bounce" style={{ background: '#f53d89', animationDelay: '240ms' }} />
                </span>
              )}
            </div>
          ))}

          {/* Progress bar */}
          <div className="mt-5 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.07)' }}>
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #c42d6a, #f53d89, #ff8ab8)',
                boxShadow: '0 0 10px rgba(245,61,137,.55)',
              }}
            />
          </div>
        </div>

        
      </main>
    </div>
  );
}
