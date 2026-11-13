import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'wouter';
import { TopNav } from '@/components/layout';
import { ArrowRight, Camera, Download, LayoutGrid, MessageCircle, Sparkles, Wand2 } from 'lucide-react';
import Credits from '@/components/credits';
import { useAuth } from '@/hooks/use-auth';
import { ARTISAN_TEMPLATES, ArtisanTemplate } from '@/lib/customization';


const STEPS = [
  {
    num: 1,
    label: 'SIGN IN',
    img: '/ss-auth.jpg',
    imgAlt: 'PinkSnap sign-in page — create an account or log in',
    icon: <Camera className="w-5 h-5" />,
    desc: 'Create a free account or sign in, then allow camera access when your browser asks. Your photos are never uploaded — everything stays private on your device! 🔒',
    tags: [
      { text: '✓ 100% Private', cls: 'bg-green-50 text-green-700 border-green-100' },
      { text: 'Free Account', cls: 'bg-primary/8 text-primary border-primary/15' },
    ],
  },
  {
    num: 2,
    label: 'WARMING UP',
    img: '/ss-setup.jpg',
    imgAlt: 'PinkSnap loading screen — warming up the booth',
    icon: <LayoutGrid className="w-5 h-5" />,
    desc: 'PinkSnap warms up the booth and loads your chosen layout and frame theme. Pick from Classic Strip, Quad Grid, Wide Duo, and more — each with its own vibe!',
    tags: [
      { text: '6+ Layouts', cls: 'bg-purple-50 text-purple-700 border-purple-100' },
      { text: 'Themed Frames', cls: 'bg-primary/8 text-primary border-primary/15' },
      { text: 'Filters', cls: 'bg-amber-50 text-amber-700 border-amber-100' },
    ],
  },
  {
    num: 3,
    label: 'STRIKE A POSE',
    img: '/ss-studio.jpg',
    imgAlt: 'PinkSnap studio — live camera booth ready to snap',
    icon: <Wand2 className="w-5 h-5" />,
    desc: 'You\'re in the booth! Hit the button and watch the countdown. PinkSnap auto-captures 3–4 photos. Strike a pose, be silly, have fun! 📸',
    tags: [
      { text: '3s Countdown', cls: 'bg-blue-50 text-blue-700 border-blue-100' },
      { text: 'Auto Capture', cls: 'bg-primary/8 text-primary border-primary/15' },
    ],
  },
  {
    num: 4,
    label: 'SAVE & SHARE',
    img: '/ss-gallery.jpg',
    imgAlt: 'PinkSnap gallery — your photo strip archive',
    icon: <Download className="w-5 h-5" />,
    desc: 'Edit your strip, apply filters, adjust the frame — then download it to your device or save it to your PinkSnap gallery. Your memories, your way! 🎞️',
    tags: [
      { text: '↓ Download', cls: 'bg-green-50 text-green-700 border-green-100' },
      { text: 'Edit Strip', cls: 'bg-primary/8 text-primary border-primary/15' },
      { text: 'Gallery', cls: 'bg-pink-50 text-pink-700 border-pink-100' },
    ],
  },
];

function ArtisanShowcaseCard({
  template,
  onSelect,
}: {
  template: ArtisanTemplate;
  onSelect: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const rendered = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !rendered.current) {
          rendered.current = true;
          observer.disconnect();

          // Use requestIdleCallback (or setTimeout fallback) to stagger rendering
          // and avoid blocking the main thread on page load
          const scheduleRender = (typeof window !== 'undefined' && 'requestIdleCallback' in window)
            ? (cb: () => void) => (window as any).requestIdleCallback(cb, { timeout: 800 })
            : (cb: () => void) => setTimeout(cb, 60);

          scheduleRender(() => {
            // Render to an offscreen canvas, then convert to a static image
            const dpr = Math.min(2, window.devicePixelRatio || 2);
            const targetHeight = 320;
            const targetWidth = Math.round(template.nw * (targetHeight / template.nh));
            const renderScale = (targetHeight * dpr) / template.nh;
            const renderW = Math.round(targetWidth * dpr);
            const renderH = Math.round(targetHeight * dpr);

            const canvas = document.createElement('canvas');
            canvas.width = renderW;
            canvas.height = renderH;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            const now = Date.now();

            const render = async () => {
              if (template.paintBgAsync) {
                await template.paintBgAsync(ctx, renderW, renderH, renderScale, now);
              } else {
                template.paintBg(ctx, renderW, renderH, renderScale, now);
              }
              if (template.paintFgAsync) {
                await template.paintFgAsync(ctx, renderW, renderH, renderScale, now);
              } else {
                template.paintFg(ctx, renderW, renderH, renderScale, now);
              }
              // Convert canvas to static image to free up the canvas GPU context
              setImgSrc(canvas.toDataURL('image/png'));
            };
            render();
          });
        }
      },
      { rootMargin: '0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [template]);

  const photoCount = template.slots?.length ? `${template.slots.length} photos` : '4 photos';
  const aspectRatio = template.nw / template.nh;

  return (
    <button
      type="button"
      onClick={(e) => {
        if (typeof window !== 'undefined' && window.matchMedia('(hover: none), (pointer: coarse)').matches) {
          e.preventDefault();
          return;
        }
        onSelect();
      }}
      className="group relative flex flex-col items-center shrink-0 text-left focus:outline-none bg-transparent pointer-events-none select-none lg:pointer-events-auto lg:select-auto cursor-default lg:cursor-pointer"
      title={`Try ${template.label} Artisan theme`}
    >
      {/* Strip frame with natural aspect ratio and clear background */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl bg-transparent transition-all duration-300 group-hover:scale-[1.04] group-active:scale-95 drop-shadow-md group-hover:drop-shadow-xl"
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={template.label}
            className="block h-[260px] sm:h-[300px] md:h-[320px] w-auto rounded-xl select-none"
            draggable={false}
            style={{ aspectRatio }}
          />
        ) : (
          <div
            className="h-[260px] sm:h-[300px] md:h-[320px] rounded-xl bg-foreground/5 animate-pulse"
            style={{ aspectRatio }}
          />
        )}

        {/* White "USE THEME →" badge placed at bottom as before, with arrow beside text */}
        <div className="absolute inset-0 flex items-end justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none p-2 sm:p-2.5">
          <span className="whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-neutral-900 text-[10px] font-black uppercase tracking-wider shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <span>USE THEME</span>
            <span className="text-xs font-black">→</span>
          </span>
        </div>
      </div>

      <div className="text-center mt-2.5 max-w-[130px]">
        <p className="font-display text-xs sm:text-sm font-black text-foreground tracking-wide uppercase group-hover:text-primary transition-colors">
          {template.label}
        </p>
        <p className="text-[10px] font-bold text-foreground/45 uppercase tracking-widest mt-0.5">
          {photoCount}
        </p>
      </div>
    </button>
  );
}

export default function Home() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const mainRef = useRef<HTMLElement>(null);
  const floatingStripRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  // Lazy-mount the heavy artisan showcase only when user scrolls near it
  const artisanSentinelRef = useRef<HTMLDivElement>(null);
  const [showArtisan, setShowArtisan] = useState(false);

  useEffect(() => {
    const el = artisanSentinelRef.current;
    if (!el || showArtisan) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowArtisan(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [showArtisan]);

  // Prevent top overscroll stretch glitch when pulling down at scrollTop === 0
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;

    let startY = 0;
    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY;
      // If at or above the top and pulling down, block overscroll stretch
      if (el.scrollTop <= 0 && currentY > startY) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  const handleGetStarted = () => {
    sessionStorage.setItem('ps_has_entered_app', 'true');
    sessionStorage.setItem('ps_intent_start', 'true');
    if (isAuthenticated) navigate('/loading');
    else navigate('/auth');
  };

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    if (floatingStripRef.current) {
      const top = Math.max(0, e.currentTarget.scrollTop);
      const y = top * 0.7;
      floatingStripRef.current.style.transform = `translateY(${y}px) rotate(6deg)`;
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden desktop-zoom-95 overscroll-none">
      <TopNav />

      <main
        ref={mainRef}
        onScroll={handleScroll}
        style={{ WebkitOverflowScrolling: 'touch' }}
        className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-5 sm:p-8 relative overscroll-none"
      >
        {/* Background glows */}
        <div className="absolute top-1/4 left-10 md:left-32 w-64 h-64 bg-primary/20 rounded-full blur-3xl -z-10 mix-blend-multiply pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 md:right-32 w-80 h-80 bg-blue-300/20 rounded-full blur-3xl -z-10 mix-blend-multiply pointer-events-none" />

        {/* Floating strip decoration */}
        <div
          ref={floatingStripRef}
          className="hidden lg:block absolute right-[6%] md:right-[8%] top-[25%] z-0 pointer-events-none will-change-transform"
          style={{ transform: 'translateY(0px) rotate(6deg)' }}
          aria-hidden="true"
        >
          <div className="bg-white p-3 rounded-lg shadow-xl border border-pink-100/80 flex flex-col gap-2.5 w-28 md:w-32 opacity-85">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-full h-20 bg-pink-50/70 rounded flex items-center justify-center border border-pink-100/60">
                <Camera className="w-5 h-5 text-pink-300/80" />
              </div>
            ))}
            <div className="pt-1.5 flex flex-col items-center justify-center border-t border-pink-100/60 text-center">
              <span className="font-display text-[10px] tracking-widest text-primary/70">PINKSNAP</span>
            </div>
          </div>
        </div>
        {/* ── Hero ── */}
        <div className="text-center z-10 max-w-3xl lg:max-w-5xl mx-auto min-h-[calc(100svh-4rem)] flex flex-col items-center justify-center pt-9 sm:pt-14 pb-16">
          <div className="home-hero-item inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-white/60 border border-white/80 px-3 py-1.5 sm:px-4 sm:py-2 lg:px-5 lg:py-2.5 text-[9.5px] sm:text-[11px] lg:text-xs font-black tracking-[.16em] sm:tracking-[.18em] text-primary uppercase shadow-sm">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" /> Your pocket photo booth
          </div>

          <h1 className="home-hero-item font-hero text-[clamp(2.75rem,11.5vw,3.75rem)] sm:text-[clamp(2.5rem,9vw,4.5rem)] lg:text-[5.5rem] xl:text-[6.2rem] tracking-tight sm:tracking-normal text-foreground mt-4 sm:mt-5 lg:mt-7 mb-3 sm:mb-4 lg:mb-5 leading-[.9]">
            <span className="whitespace-nowrap">WELCOME TO</span> <br />
            <span className="text-primary cinematic-glow-pink whitespace-nowrap">PINKSNAP.</span>
          </h1>

          <p className="home-hero-item text-[10px] sm:text-sm lg:text-base font-black text-foreground/60 mb-8 lg:mb-10 tracking-[.22em] uppercase">
            YOUR VIRTUAL PHOTOBOOTH.
          </p>

          <style>{`
            .cinematic-glow-pink {
              text-shadow: 
                0 0 20px rgba(245, 61, 137, 0.45),
                0 0 45px rgba(245, 61, 137, 0.25),
                0 0 75px rgba(245, 61, 137, 0.12);
              animation: cinematicGlowPulse 4s ease-in-out infinite alternate;
            }

            @keyframes cinematicGlowPulse {
              0% {
                text-shadow: 
                  0 0 16px rgba(245, 61, 137, 0.4),
                  0 0 38px rgba(245, 61, 137, 0.2);
              }
              100% {
                text-shadow: 
                  0 0 26px rgba(245, 61, 137, 0.65),
                  0 0 55px rgba(245, 61, 137, 0.35),
                  0 0 85px rgba(245, 61, 137, 0.18);
              }
            }

            .btn-wave-ring {
              position: absolute;
              border-radius: 9999px;
              pointer-events: none;
              border: 1.5px solid rgba(245, 61, 137, 0.7);
            }

            .btn-wave-1 {
              animation: btnWaveRipple 2.6s cubic-bezier(0.15, 0.85, 0.25, 1) infinite;
            }

            .btn-wave-2 {
              animation: btnWaveRipple 2.6s cubic-bezier(0.15, 0.85, 0.25, 1) infinite 1.3s;
            }

            @keyframes btnWaveRipple {
              0% {
                inset: 0px;
                opacity: 0.9;
                box-shadow: 0 0 14px rgba(245, 61, 137, 0.75);
              }
              50% {
                opacity: 0.45;
              }
              100% {
                inset: -15px;
                opacity: 0;
                box-shadow: 0 0 28px rgba(245, 61, 137, 0);
              }
            }

            .btn-vibrant-glow {
              box-shadow: 
                inset 0 1px 0 rgba(255, 255, 255, 0.5),
                0 0 0 1.5px rgba(245, 61, 137, 0.55),
                0 0 20px rgba(245, 61, 137, 0.5),
                0 8px 30px rgba(245, 61, 137, 0.35);
              animation: btnGlowBreathing 2.6s ease-in-out infinite;
            }

            @keyframes btnGlowBreathing {
              0%, 100% {
                box-shadow: 
                  inset 0 1px 0 rgba(255, 255, 255, 0.5),
                  0 0 0 1.5px rgba(245, 61, 137, 0.5),
                  0 0 18px rgba(245, 61, 137, 0.45),
                  0 8px 28px rgba(245, 61, 137, 0.3);
              }
              50% {
                box-shadow: 
                  inset 0 1px 0 rgba(255, 255, 255, 0.7),
                  0 0 0 2.5px rgba(245, 61, 137, 0.85),
                  0 0 32px 2px rgba(245, 61, 137, 0.75),
                  0 10px 42px rgba(245, 61, 137, 0.45);
              }
            }

            .btn-vibrant-glow:hover {
              animation-play-state: paused;
              box-shadow: 
                inset 0 1px 0 rgba(255, 255, 255, 0.8),
                0 0 0 3px rgba(245, 61, 137, 1),
                0 0 45px 6px rgba(245, 61, 137, 0.92),
                0 14px 45px rgba(245, 61, 137, 0.55);
              transform: scale(1.05);
            }

            .btn-vibrant-glow:active {
              transform: scale(0.96);
            }

            .btn-light-sweep {
              position: absolute;
              inset: 0;
              background: linear-gradient(
                105deg,
                transparent 20%,
                rgba(255, 255, 255, 0.3) 50%,
                transparent 80%
              );
              transform: translateX(-150%);
              animation: lightSweepWave 3.6s ease-in-out infinite;
            }

            @keyframes lightSweepWave {
              0%, 30% {
                transform: translateX(-150%);
              }
              70%, 100% {
                transform: translateX(150%);
              }
            }
          `}</style>

          <div className="relative inline-block mt-4 mb-4 lg:mt-5 lg:mb-6">
            {/* Luminous idle wave rings expanding outward from padding */}
            <span className="btn-wave-ring btn-wave-1" />
            <span className="btn-wave-ring btn-wave-2" />

            <button
              type="button"
              onClick={handleGetStarted}
              data-testid="link-setup"
              className="home-hero-item btn-vibrant-glow group relative inline-flex items-center justify-center px-9 py-4 lg:px-12 lg:py-5 font-black text-white bg-primary rounded-full overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/50 focus-visible:ring-offset-2 z-10 cursor-pointer"
            >
              {/* Active waving sheen sweep */}
              <span className="btn-light-sweep pointer-events-none" />
              <span className="relative flex items-center gap-2 text-sm sm:text-base lg:text-lg font-black tracking-wider uppercase">
                GET STARTED
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('creator-section');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="home-hero-item scroll-cue mt-5 sm:mt-6 inline-flex flex-col items-center gap-1 text-center text-foreground/45 hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full px-2.5 py-1.5"
            aria-label="Scroll to learn more"
          >
            <span className="h-5 border-l-[1.5px] border-current opacity-40" />
            <span className="text-[8.5px] sm:text-[9.5px] font-black tracking-[.18em] uppercase">SCROLL TO EXPLORE</span>
          </button>
        </div>

        {/* ── HOW TO USE — Tutorial Section ── */}
        <section aria-labelledby="home-guide-title" className="relative z-10 max-w-5xl mx-auto pb-10">

          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div>
              <p className="text-[11px] font-black tracking-[.18em] text-primary uppercase mb-1">SIMPLE AS 1, 2, 3, 4</p>
              <h2 id="home-guide-title" className="font-display text-4xl sm:text-5xl">HOW TO USE</h2>
            </div>
            <Link href="/how-it-works" className="inline-flex items-center gap-1 text-xs font-black text-foreground/55 hover:text-primary uppercase tracking-wider">
              SEE THE DIAGRAM <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* ── Active step big preview ── */}
          <div className="ticket overflow-hidden mb-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
              {/* Screenshot pane */}
              <div className="relative bg-gradient-to-br from-pink-50 to-white min-h-[260px] sm:min-h-[340px] flex items-center justify-center overflow-hidden">
                <img
                  key={STEPS[activeStep].img}
                  src={STEPS[activeStep].img}
                  alt={STEPS[activeStep].imgAlt}
                  className="w-full h-full object-cover object-top transition-opacity duration-300"
                  style={{ maxHeight: 340 }}
                  loading="lazy"
                  draggable="false"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                {/* Step badge overlay */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm">
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center">{STEPS[activeStep].num}</span>
                  <span className="text-[11px] font-black text-foreground uppercase tracking-wide">{STEPS[activeStep].label}</span>
                </div>
              </div>

              {/* Info pane */}
              <div className="p-5 sm:p-6 flex flex-col justify-between gap-4">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                    {STEPS[activeStep].icon}
                  </div>
                  <h3 className="font-display text-2xl sm:text-3xl text-foreground mb-2">{STEPS[activeStep].label}</h3>
                  <p className="text-sm font-medium text-foreground/65 leading-relaxed">{STEPS[activeStep].desc}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {STEPS[activeStep].tags.map((t) => (
                    <span key={t.text} className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${t.cls}`}>{t.text}</span>
                  ))}
                </div>
                {/* Prev / next */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveStep((p) => Math.max(0, p - 1))}
                    disabled={activeStep === 0}
                    className="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide border border-black/10 bg-white/70 hover:bg-white disabled:opacity-30 transition-all"
                  >
                    ← Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStep((p) => Math.min(STEPS.length - 1, p + 1))}
                    disabled={activeStep === STEPS.length - 1}
                    className="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide bg-primary text-white shadow-md shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-30 transition-all"
                  >
                    Next →
                  </button>
                  <span className="ml-auto text-[10px] font-black text-foreground/35 uppercase tracking-wide">{activeStep + 1} / {STEPS.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Feedback CTA ── */}
          <div className="mt-4 sm:mt-6 mb-8 sm:mb-12 flex flex-col items-center justify-center text-center gap-1">
            <p className="text-foreground/70 font-medium text-[10px] sm:text-sm">
              Want to give some feedback? Join the community chat
            </p>
            <Link href="/chat" className="inline-flex items-center gap-1 text-[9px] sm:text-xs font-black text-primary hover:text-primary/80 uppercase tracking-wider transition-colors">
              OPEN COMMUNITY CHAT <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </Link>
          </div>

        </section>

        {/* ── ARTISAN STRIPS — Cinematic Showcase Loop ── */}
        <div ref={artisanSentinelRef} />
        {showArtisan && (
        <section aria-labelledby="artisan-showcase-title" className="relative z-10 w-full max-w-6xl mx-auto pt-10 sm:pt-16 pb-8 sm:pb-14 mt-4 sm:mt-8">
          {/* Cinematic Header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6 px-1">
            <div>
              <p className="text-[11px] font-black tracking-[.25em] text-primary uppercase mb-1.5">
                PINKSNAP THEMES
              </p>
              <h2
                id="artisan-showcase-title"
                className="font-hero text-5xl sm:text-7xl md:text-8xl tracking-tight text-foreground leading-[0.88] uppercase"
              >
                ARTISAN <span className="text-primary cinematic-glow-pink">STRIPS.</span>
              </h2>
            </div>

            <div className="flex flex-col sm:items-end gap-1">
              <p className="text-[11px] sm:text-xs font-bold text-foreground/50 tracking-wider uppercase">
                Curated layouts & Premium Prints
              </p>
              <button
                type="button"
                onClick={handleGetStarted}
                className="inline-flex items-center gap-1.5 text-xs font-black text-primary hover:text-primary/80 uppercase tracking-wider transition-all hover:translate-x-0.5 cursor-pointer"
              >
                TRY ARTISAN <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Horizontal Infinite Marquee Loop */}
          <div className="artisan-marquee-wrapper overflow-hidden py-3 -mx-5 sm:-mx-8 px-5 sm:px-8">
            <div className="artisan-marquee-track gap-4 sm:gap-6">
              {[...ARTISAN_TEMPLATES, ...ARTISAN_TEMPLATES].map((template, idx) => (
                <ArtisanShowcaseCard
                  key={`${template.id}-${idx}`}
                  template={template}
                  onSelect={() => {
                    sessionStorage.setItem('ps_edit_artisan', template.id);
                    handleGetStarted();
                  }}
                />
              ))}
            </div>
          </div>
        </section>
        )}

        <Credits />
      </main>
    </div>
  );
}
