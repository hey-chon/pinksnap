import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'wouter';
import { TopNav } from '@/components/layout';
import { ArrowRight, Camera, MessageCircle, Sparkles } from 'lucide-react';
import Credits from '@/components/credits';
import { useAuth } from '@/hooks/use-auth';
import { ARTISAN_TEMPLATES, ArtisanTemplate } from '@/lib/customization';
import { AxolotlHoldingBadge } from '@/components/axolotl/axolotl-holding-badge';
import { HomePurposeSection } from '@/components/home-purpose-section';

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
      {/* Strip frame with realistic photobooth paper card and suspended shadow */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl bg-[#1a0a12]/70 p-1 sm:p-1.5 transition-all duration-300 group-hover:scale-[1.05] group-hover:-translate-y-1.5 group-active:scale-95 shadow-[0_18px_38px_rgba(0,0,0,0.7),0_4px_12px_rgba(0,0,0,0.5)] group-hover:shadow-[0_24px_50px_rgba(245,61,137,0.35),0_6px_16px_rgba(0,0,0,0.6)] ring-1 ring-white/10 group-hover:ring-pink-500/40"
      >
        {/* Subtle realistic photo sheen glare across strip */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15 pointer-events-none z-10 rounded-lg" />

        {imgSrc ? (
          <img
            src={imgSrc}
            alt={template.label}
            className="block h-[260px] sm:h-[300px] md:h-[320px] w-auto rounded-lg select-none"
            draggable={false}
            style={{ aspectRatio }}
          />
        ) : (
          <div
            className="h-[260px] sm:h-[300px] md:h-[320px] rounded-lg bg-white/10 animate-pulse"
            style={{ aspectRatio }}
          />
        )}

        {/* White "USE THEME →" badge placed at bottom with arrow */}
        <div className="absolute inset-0 flex items-end justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none p-2 sm:p-2.5 z-20">
          <span className="whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-neutral-900 text-[10px] font-black uppercase tracking-wider shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <span>USE THEME</span>
            <span className="text-xs font-black">→</span>
          </span>
        </div>
      </div>

      <div className="text-center mt-3 max-w-[130px]">
        <p className="font-display text-xs sm:text-sm font-black text-white/95 tracking-wide uppercase group-hover:text-pink-400 transition-colors drop-shadow-sm">
          {template.label}
        </p>
        <p className="text-[10px] font-bold text-pink-200/60 uppercase tracking-widest mt-0.5">
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
      // Fade out cleanly as user leaves the hero section so it never overlaps other sections
      const opacity = Math.max(0, 0.85 - top / 320);
      const y = top * 0.35;
      floatingStripRef.current.style.transform = `translateY(${y}px) rotate(6deg)`;
      floatingStripRef.current.style.opacity = `${opacity}`;
      floatingStripRef.current.style.display = opacity <= 0.01 ? 'none' : 'block';
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden desktop-zoom-95 overscroll-none">
      <TopNav />

      <main
        ref={mainRef}
        onScroll={handleScroll}
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        className="flex-1 overflow-y-auto overflow-x-hidden relative overscroll-none scrollbar-hide"
      >
        {/* Background glows */}
        <div className="absolute top-1/4 left-10 md:left-32 w-64 h-64 bg-primary/20 rounded-full blur-3xl -z-10 mix-blend-multiply pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 md:right-32 w-80 h-80 bg-blue-300/20 rounded-full blur-3xl -z-10 mix-blend-multiply pointer-events-none" />

        {/* Floating strip decoration (Strictly stays in Hero) */}
        <div
          ref={floatingStripRef}
          className="hidden lg:block absolute right-[6%] md:right-[8%] top-[25%] z-0 pointer-events-none will-change-transform transition-opacity duration-150"
          style={{ transform: 'translateY(0px) rotate(6deg)' }}
          aria-hidden="true"
        >
          <div className="bg-white p-3 rounded-lg shadow-xl border border-pink-100/80 flex flex-col gap-2.5 w-28 md:w-32 opacity-85">
            {[1, 2, 3, 4].map((i) => (
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
        <div className="text-center z-10 max-w-3xl lg:max-w-5xl mx-auto min-h-[calc(100svh-4rem)] flex flex-col items-center justify-center pt-9 sm:pt-14 pb-16 px-4 sm:px-6">
          <AxolotlHoldingBadge />

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

          <div
            className="home-hero-item scroll-cue mt-5 sm:mt-6 inline-flex flex-col items-center gap-1 text-center text-foreground/45 select-none pointer-events-none px-2.5 py-1.5"
            aria-hidden="true"
          >
            <span className="h-5 border-l-[1.5px] border-current opacity-40" />
            <span className="text-[8.5px] sm:text-[9.5px] font-black tracking-[.18em] uppercase">SCROLL TO EXPLORE</span>
          </div>
        </div>

        {/* ── PINKSNAP AXOLOTL — The Purpose Section ── */}
        <HomePurposeSection />

        {/* ── ARTISAN STRIPS — Real Photobooth Curtain Showcase ── */}
        <section
          id="artisan-showcase-section"
          aria-labelledby="artisan-showcase-title"
          className="relative z-10 w-full my-0 flex flex-col justify-center overflow-hidden border-y border-red-950/60 shadow-[0_35px_80px_-15px_rgba(80,8,24,0.5),0_20px_45px_rgba(0,0,0,0.6)]"
          style={{
            backgroundColor: '#120409',
            minHeight: '100vh',
            paddingTop: '3.5rem',
            paddingBottom: '6rem',
          }}
        >
          {/* Layer 1: Red Velvet Curtain Backdrop Image (Spans Full Width End-to-End) */}
          <div
            className="absolute inset-0 pointer-events-none select-none z-0 bg-cover bg-center transform scale-105"
            style={{
              backgroundImage: "url('/background.jfif'), url('/background.jpg')",
              filter: 'contrast(1.18) saturate(1.25) brightness(0.68)',
              opacity: 0.72,
            }}
          />

          {/* Layer 2: Atmospheric Velvet Light & Shadow Vignette (No flat picture feel) */}
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              background: `
                radial-gradient(ellipse at 50% 35%, rgba(245, 61, 137, 0.22) 0%, rgba(140, 16, 50, 0.38) 45%, rgba(10, 3, 6, 0.94) 85%),
                linear-gradient(180deg, rgba(12, 3, 7, 0.95) 0%, rgba(18, 4, 10, 0.2) 20%, rgba(18, 4, 10, 0.2) 75%, rgba(10, 2, 5, 0.98) 100%)
              `,
            }}
          />

          {/* Layer 3: Top Valance / Curtain Rod Rim with Neon Glow (End-to-End) */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-pink-500/70 to-transparent shadow-[0_0_20px_rgba(245,61,137,0.85)] pointer-events-none z-10" />

          {/* Layer 4: Overhead Stage Spotlight focused on the suspended photo strips */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-64 bg-gradient-to-b from-pink-500/18 via-rose-500/8 to-transparent blur-3xl pointer-events-none z-0" />

          {/* Bottom Valance Accent Rim */}
          <div className="absolute bottom-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-red-900/40 to-transparent pointer-events-none z-10" />

          {/* Section Inner Content — Centered inside full viewport height */}
          <div className="relative z-10 w-full py-12 sm:py-16 md:py-20 flex flex-col justify-center flex-1">
            {/* Cinematic Photobooth Header */}
            <div className="max-w-6xl mx-auto px-5 sm:px-8 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black tracking-[.28em] text-pink-400 uppercase mb-1.5 drop-shadow-sm">
                    PINKSNAP THEMES
                  </p>
                  <h2
                    id="artisan-showcase-title"
                    className="font-hero text-5xl sm:text-7xl md:text-8xl tracking-tight text-white leading-[0.88] uppercase drop-shadow-md"
                  >
                    ARTISAN <span className="text-primary cinematic-glow-pink">STRIPS.</span>
                  </h2>
                </div>

                <div className="flex flex-col sm:items-end gap-2">
                  <p className="text-[11px] sm:text-xs font-bold text-pink-100/70 tracking-wider uppercase">
                    Curated layouts & Premium Prints
                  </p>
                  <button
                    type="button"
                    onClick={handleGetStarted}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-pink-400/40 text-xs font-black text-white hover:text-pink-300 uppercase tracking-wider backdrop-blur-md shadow-[0_4px_16px_rgba(245,61,137,0.3)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <span>TRY ARTISAN</span>
                    <ArrowRight className="w-3.5 h-3.5 text-pink-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Horizontal Infinite Marquee Loop spanning full width from left edge to right edge */}
            <div className="artisan-marquee-wrapper overflow-hidden py-4 w-full">
              <div className="artisan-marquee-track gap-5 sm:gap-7 px-4 sm:px-8">
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
          </div>
        </section>

        <Credits />
      </main>
    </div>
  );
}
