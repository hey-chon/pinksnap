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



        
      </main>
    </div>
  );
}
