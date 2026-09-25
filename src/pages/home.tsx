import { useState, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { TopNav, BottomNav } from '@/components/layout';
import { ArrowRight, Camera, Download, LayoutGrid, MessageCircle, Sparkles, Wand2 } from 'lucide-react';
import Credits from '@/components/credits';
import { useAuth } from '@/hooks/use-auth';

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

export default function Home() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const mainRef = useRef<HTMLElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  const handleGetStarted = () => {
    if (isAuthenticated) navigate('/loading');
    else navigate('/auth');
  };

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    setScrollY(e.currentTarget.scrollTop);
  };

  return (
    <div className="flex flex-col h-[100dvh]">
      <TopNav />

      <main
        ref={mainRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden p-5 sm:p-8 relative scroll-smooth"
      >
        {/* Background glows */}
        <div className="absolute top-1/4 left-10 md:left-32 w-64 h-64 bg-primary/20 rounded-full blur-3xl -z-10 mix-blend-multiply pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 md:right-32 w-80 h-80 bg-blue-300/20 rounded-full blur-3xl -z-10 mix-blend-multiply pointer-events-none" />

        {/* Floating strip decoration */}
        <div
          className="hidden lg:block absolute right-[6%] md:right-[8%] top-[25%] z-0 pointer-events-none transition-transform duration-100 ease-out will-change-transform"
          style={{ transform: `translateY(${scrollY * 0.7}px) rotate(6deg)` }}
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
        <div className="text-center z-10 max-w-3xl mx-auto min-h-[calc(100svh-4rem)] flex flex-col items-center justify-center pt-9 sm:pt-14 pb-16">
          <div className="home-hero-item inline-flex items-center gap-2 rounded-full bg-white/60 border border-white/80 px-4 py-2 text-[11px] font-black tracking-[.18em] text-primary uppercase shadow-sm">
            <Sparkles className="w-3.5 h-3.5" /> Your pocket photo booth
          </div>

          <h1 className="home-hero-item font-display text-[clamp(3.1rem,13vw,7rem)] text-foreground mt-5 mb-4 leading-[.86]">
            WELCOME TO <br />
            <span className="text-primary drop-shadow-sm">PINKSNAP.</span>
          </h1>

          <p className="home-hero-item text-xs sm:text-sm font-black text-foreground/60 mb-8 tracking-[.22em] uppercase">
            YOUR VIRTUAL PHOTOBOOTH.
          </p>

          <div className="relative inline-block mt-4 mb-4">
            <button
              type="button"
              onClick={handleGetStarted}
              data-testid="link-setup"
              className="home-hero-item group relative inline-flex items-center justify-center px-9 py-4 font-black text-white bg-primary rounded-full overflow-hidden shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/50 focus-visible:ring-offset-2 z-10"
            >
              <span className="relative flex items-center gap-2 text-sm sm:text-base font-black tracking-wider uppercase">
                GET STARTED
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => document.getElementById('home-guide-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="home-hero-item scroll-cue mt-8 inline-flex flex-col items-center gap-1.5 text-center text-foreground/45 hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full px-3 py-2"
            aria-label="Scroll to learn more"
          >
            <span className="h-7 border-l-2 border-current opacity-45" />
            <span className="text-[10px] font-black tracking-[.2em] uppercase">SCROLL TO EXPLORE</span>
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

          {/* ── Step pill nav ── */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1 snap-x">
            {STEPS.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveStep(i)}
                className={`snap-start shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full text-[11px] font-black uppercase tracking-wide border transition-all ${
                  activeStep === i
                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/25'
                    : 'bg-white/70 text-foreground/60 border-black/10 hover:border-primary/30 hover:text-primary'
                }`}
              >
                <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${activeStep === i ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>{s.num}</span>
                {s.label}
              </button>
            ))}
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
          <div className="mt-6 mb-8 flex flex-col items-center justify-center text-center gap-1.5">
            <p className="text-foreground/70 font-medium text-xs sm:text-sm">
              Want to give some feedback? Join the community chat
            </p>
            <Link href="/chat" className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-black text-primary hover:text-primary/80 uppercase tracking-wider transition-colors">
              OPEN COMMUNITY CHAT <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </section>



        <Credits />
      </main>

      <BottomNav />
    </div>
  );
}
