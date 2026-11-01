import { useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { ExternalLink, Facebook, Github, Instagram, Sparkles, Shield, FileText, Cookie, Crown, Zap } from 'lucide-react';
import { SiGooglegemini, SiLucide, SiReact, SiReplit, SiTailwindcss, SiTypescript, SiVite, SiSupabase } from 'react-icons/si';
import { openCookieSettings } from '@/components/cookie-notice';
import gsap from 'gsap';

const loopTools = [
  { name: 'Gemini', icon: SiGooglegemini },
  { name: 'Supabase', icon: SiSupabase },
  { name: 'Grok', icon: (p: { className?: string }) => <svg className={p.className} viewBox="0 0 32 32" fill="currentColor"><path d="m8 6 18 20h-5L3 6h5Zm16.6 0-7 7.8 2.9 3.2L29 6h-4.4ZM11.2 18.3 3 26h5.3l5.8-5.4-2.9-2.3Z" /></svg> },
  { name: 'Replit', icon: SiReplit },
  { name: 'React', icon: SiReact },
  { name: 'Vite', icon: SiVite },
  { name: 'Tailwind', icon: SiTailwindcss },
  { name: 'Lucide', icon: SiLucide },
  { name: 'TypeScript', icon: SiTypescript },
  { name: 'Wouter', icon: (p: { className?: string }) => <svg className={p.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8v16l5-5 6 5 6-8 5 4" /><path d="M22 8h5v5" /></svg> },
];

const jimsonSocials = [
  { label: 'GitHub', href: 'https://github.com/hey-chon', icon: Github },
  { label: 'Facebook', href: 'https://www.facebook.com/share/1BxyPxqSBg/?mibextid=wwXIfr', icon: Facebook },
  { label: 'Instagram', href: 'https://www.instagram.com/hey.chon?igsh=aWc4djRjcXRtb25z&utm_source=qr', icon: Instagram },
];

export default function Credits() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardsRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const cards = cardsRef.current?.children;
          if (!cards || cards.length === 0) return;

          if (entry.isIntersecting) {
            gsap.fromTo(
              Array.from(cards),
              { opacity: 0, y: 45, scale: 0.96 },
              { opacity: 1, y: 0, scale: 1, duration: 0.85, stagger: 0.18, ease: 'power3.out' }
            );
          } else {
            gsap.set(Array.from(cards), { opacity: 0, y: 45, scale: 0.96 });
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(cardsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="creator-section" ref={sectionRef} aria-labelledby="credits-title" className="relative z-10 max-w-6xl mx-auto pb-14 sm:pb-20 pt-10 sm:pt-16 mt-4 sm:mt-8 scroll-mt-6">
      {/* Cinematic Header matching Artisan Showcase */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6 px-1">
        <div className="min-w-0">
          <p className="text-[11px] font-black tracking-[.25em] text-primary uppercase mb-1.5">
            THE LITTLE CREDITS CORNER
          </p>
          <h2
            id="credits-title"
            className="font-hero text-[clamp(1.45rem,5.5vw,4.25rem)] tracking-tight text-foreground leading-[0.92] uppercase whitespace-nowrap"
          >
            MADE WITH <span className="text-primary">GOOD HELP.</span>
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col sm:items-center md:items-end gap-1 shrink-0 pb-1">
          <p className="text-[11px] sm:text-xs font-bold text-foreground/50 tracking-wider uppercase">
            Behind the virtual photobooth
          </p>
          <span className="inline-flex items-center gap-1.5 text-xs font-black text-primary uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> CREATORS &amp; FRIENDS
          </span>
        </div>
      </div>

      {/* Tech Stack Looping Marquee */}
      <div className="creator-marquee-wrapper overflow-hidden rounded-2xl border border-white/80 bg-white/55 shadow-sm backdrop-blur-md mb-6 p-1">
        <div className="creator-marquee-track flex gap-3 py-3 px-4">
          {[...loopTools, ...loopTools].map((tool, index) => {
            const Icon = tool.icon;
            return (
              <div key={`${tool.name}-${index}`} className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-pink-100 px-3.5 py-1.5 text-xs font-bold text-foreground/80 shrink-0 shadow-xs hover:border-primary/40 transition-colors">
                <Icon className="w-4 h-4 text-primary" />
                <span>{tool.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Creators Cards Grid with GSAP Scroll Reveal & Hover Effects */}
      <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 items-stretch">
        
        {/* Jimson */}
        <div className="w-full h-full rounded-3xl bg-[#121118] border border-white/[0.12] text-white p-6 sm:p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden group hover:-translate-y-2 hover:border-pink-500/50 hover:shadow-[0_24px_50px_rgba(245,61,137,0.2)] transition-all duration-300 ease-out">
          {/* Subtle ambient glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/20 transition-colors duration-500" />

          <div className="relative z-10">
            {/* Top row: Role Badge + Index */}
            <div className="flex items-center justify-between gap-3 mb-5">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/15 text-white text-[11px] font-black uppercase tracking-wider shadow-sm">
                <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400 stroke-none" aria-hidden="true" />
                <span>Lead Creator &amp; Developer</span>
              </span>
              <span className="font-mono text-[10px] text-white/35 font-bold tracking-widest uppercase">
                01 / DEV
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-5">
              {/* Photo Frame */}
              <div className="relative shrink-0">
                <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-2xl overflow-hidden creator-polaroid-frame border-2 border-white/20 bg-neutral-900 group-hover:scale-105 transition-transform duration-300 shadow-md">
                  <img 
                    src="/creator/jimson.jpeg" 
                    alt="Jimson" 
                    className="w-full h-full object-cover object-center"
                  />
                </div>
                {/* Washi tape sticker */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-3 creator-polaroid-tape rounded-xs rotate-[-6deg] pointer-events-none opacity-80" />
              </div>

              <div>
                <p className="font-mono text-[10px] sm:text-[11px] font-bold tracking-[.22em] text-pink-300 uppercase mb-1">IT’S PINK-SNAP.DEV</p>
                <h3 className="font-hero text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white uppercase leading-[0.9]">HEY, I’M JIMSON.</h3>
              </div>
            </div>

            <div className="text-xs sm:text-[13px] text-white/75 leading-relaxed space-y-3 font-normal">
              <p>
                Hi! I'm a student web developer from Cavite, Philippines, who loves building websites, learning by doing, and keeping things organized.
              </p>
              <p>
                I'm the developer behind PinkSnap — a virtual photobooth website that I planned, structured, and built with an AI-assisted workflow. While I originally built PinkSnap for me and my girlfriend Jera, it's now open for everyone to use and enjoy!
              </p>
              <p>
                I built PinkSnap to learn new things, explore new techniques, and grow as a student developer. Since this website is a work in progress, I appreciate your patience as I continue to improve it. Thank you for stopping by! :D
              </p>
            </div>
          </div>

          <div className="relative z-10 flex flex-wrap gap-2 mt-6 pt-4 border-t border-white/10">
            {jimsonSocials.map(({ label, href, icon: Icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white text-[#201b2c] px-3.5 py-1.5 text-xs font-black hover:bg-primary hover:text-white hover:scale-105 transition-all shadow-sm active:scale-95">
                <Icon className="w-3.5 h-3.5" /> {label}
              </a>
            ))}
            <a href="https://chon-dev.vercel.app/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white text-[#201b2c] px-3.5 py-1.5 text-xs font-black hover:bg-primary hover:text-white hover:scale-105 transition-all shadow-sm active:scale-95">
              chon.dev <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* rezn1r.tech */}
        <div className="w-full h-full rounded-3xl bg-[#121118] border border-white/[0.12] text-white p-6 sm:p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden group hover:-translate-y-2 hover:border-pink-500/50 hover:shadow-[0_24px_50px_rgba(245,61,137,0.2)] transition-all duration-300 ease-out">
          {/* Subtle ambient glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/20 transition-colors duration-500" />

          <div className="relative z-10">
            {/* Top row: Role Badge + Index */}
            <div className="flex items-center justify-between gap-3 mb-5">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/15 text-white text-[11px] font-black uppercase tracking-wider shadow-sm">
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 stroke-none" aria-hidden="true" />
                <span>Contributor</span>
              </span>
              <span className="font-mono text-[10px] text-white/35 font-bold tracking-widest uppercase">
                02 / DEV
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-5">
              {/* Avatar Frame */}
              <div className="relative shrink-0">
                <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-2xl overflow-hidden creator-polaroid-frame border-2 border-white/20 bg-neutral-900 group-hover:scale-105 transition-transform duration-300 shadow-md">
                  <img 
                    src="/creator/rezn1r.png" 
                    alt="rezn1r" 
                    className="w-full h-full object-contain"
                  />
                </div>
                {/* Washi tape sticker */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-3 creator-polaroid-tape rounded-xs rotate-[6deg] pointer-events-none opacity-80" />
              </div>

              <div>
                <p className="font-mono text-[10px] sm:text-[11px] font-bold tracking-[.22em] text-pink-300 uppercase mb-1">COMMUNITY CHAT &amp; AUTH</p>
                <h3 className="font-hero text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white uppercase leading-[0.9]">REZN1R</h3>
              </div>
            </div>

            <div className="text-xs sm:text-[13px] text-white/75 leading-relaxed space-y-3 font-normal">
              <p>
                Hey! I'm rezn1r. I helped my friend Jimson integrate the community chat and simple auth into PinkSnap to make it more connected and fun for everyone. Enjoy and happy snapping!
              </p>
            </div>
          </div>

          <div className="relative z-10 flex flex-wrap gap-2 mt-6 pt-4 border-t border-white/10">
            <a href="https://github.com/rezn1r" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white text-[#201b2c] px-3.5 py-1.5 text-xs font-black hover:bg-primary hover:text-white hover:scale-105 transition-all shadow-sm active:scale-95">
              <Github className="w-3.5 h-3.5" /> GitHub
            </a>
            <a href="https://rezn1r.tech" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white text-[#201b2c] px-3.5 py-1.5 text-xs font-black hover:bg-primary hover:text-white hover:scale-105 transition-all shadow-sm active:scale-95">
              rezn1r.tech <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

      </div>

      {/* Policy links */}
      <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-bold text-foreground/60 pt-2">
        <Link href="/privacy" className="inline-flex items-center gap-1.5 hover:text-primary transition-colors">
          <Shield className="w-3.5 h-3.5 text-primary" /> Privacy Policy
        </Link>
        <span>•</span>
        <Link href="/terms" className="inline-flex items-center gap-1.5 hover:text-primary transition-colors">
          <FileText className="w-3.5 h-3.5 text-primary" /> Terms
        </Link>
        <span>•</span>
        <button
          type="button"
          onClick={openCookieSettings}
          className="inline-flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer"
        >
          <Cookie className="w-3.5 h-3.5 text-primary" /> Cookies
        </button>
      </div>
    </section>
  );
}