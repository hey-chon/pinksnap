import { useEffect, useRef, useState } from 'react';
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
  const pageRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
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

  return (
    <div ref={pageRef} className="min-h-[100dvh] flex items-center justify-center px-6 py-12 bg-[#f8f7ff] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_30%,rgba(174,231,247,.62),transparent_32%),radial-gradient(circle_at_82%_68%,rgba(239,204,255,.72),transparent_36%),linear-gradient(120deg,#eaf8f6_0%,#edf3ff_49%,#f8eafe_100%)]" />

      <main className="relative z-10 w-full max-w-sm text-center">
        <div ref={logoRef} className="loading-item reveal-pop relative mx-auto mb-8 w-28 h-28 rounded-[30px] bg-primary text-white flex items-center justify-center shadow-[0_18px_45px_rgba(245,61,137,.3)]">
          <div ref={ringRef} className="absolute -inset-3 rounded-[36px] border border-primary/35 border-t-primary/80 border-dashed animate-spin" />
          <Camera className="w-12 h-12 stroke-[2.4]" />
          <Sparkles className="absolute top-3 right-3 w-5 h-5" />
        </div>

        <div className="loading-item flex items-center justify-center gap-1.5 font-black text-[28px] leading-none tracking-[-.05em] mb-3">
          <span className="text-[#1f1d2b]">PINK</span>
          <span className="text-primary">SNAP</span>
        </div>
        <p className="loading-item text-xs font-black uppercase tracking-[.2em] text-foreground/55 mb-8">
          give us a sec...
        </p>

        <div className="loading-item rounded-3xl bg-white/65 border border-white/80 backdrop-blur-md p-5 shadow-xl">
          <div className="space-y-3 text-left">
            {messages.map(({ label, icon: Icon }, index) => (
              <div key={label} className={`flex items-center gap-3 text-sm font-bold transition-all duration-300 ${index <= step ? 'text-foreground' : 'text-foreground/30'}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${index < step ? 'bg-primary text-white' : index === step ? 'bg-primary/15 text-primary' : 'bg-foreground/5 text-foreground/20'}`}>
                  {index < step ? <Check className="w-4 h-4" /> : <Icon className={`w-3.5 h-3.5 ${index === step ? 'loading-dot' : ''}`} />}
                </span>
                <span>{label}</span>
                {index === step && <span className="ml-auto flex gap-1"><i className="loading-bounce" /><i className="loading-bounce [animation-delay:120ms]" /><i className="loading-bounce [animation-delay:240ms]" /></span>}
              </div>
            ))}
          </div>
          <div className="mt-5 h-2 rounded-full bg-foreground/5 overflow-hidden">
            <div className={`loading-progress loading-progress-${step + 1} h-full rounded-full bg-primary transition-all duration-500 ease-out`} />
          </div>
        </div>
      </main>
    </div>
  );
}