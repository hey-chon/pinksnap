import { useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { ExternalLink, Facebook, Github, Instagram, Sparkles, Shield, FileText, Cookie } from 'lucide-react';
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
          if (entry.isIntersecting) {
            const cards = cardsRef.current?.children;
            if (cards && cards.length > 0) {
              gsap.fromTo(
                Array.from(cards),
                { opacity: 0, y: 40, scale: 0.97 },
                { opacity: 1, y: 0, scale: 1, duration: 0.85, stagger: 0.18, ease: 'power3.out' }
              );
            }
            observer.disconnect();
          }
        });
      },
      { threshold: 0.12 }
    );

    observer.observe(cardsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="creator-section" ref={sectionRef} aria-labelledby="credits-title" className="relative z-10 max-w-5xl mx-auto pb-14 pt-6 scroll-mt-6">
      {/* Title */}
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <p className="text-[11px] font-black tracking-[.18em] text-primary uppercase mb-1">the little credits corner</p>
          <h2 id="credits-title" className="text-2xl sm:text-3xl font-black tracking-tight">MADE WITH GOOD HELP.</h2>
        </div>
        <Sparkles className="w-7 h-7 text-primary/50 shrink-0" />
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
      <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-6">
        
        {/* Jimson */}
        <div className="md:col-span-7 rounded-3xl bg-[#141416] border border-white/10 text-white p-6 sm:p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden group hover:-translate-y-2 hover:border-pink-500/40 hover:shadow-[0_20px_45px_rgba(245,61,137,0.18)] transition-all duration-300 ease-out">
          <div>
            {/* Role Badge */}
            <div className="mb-4">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white text-[#201b2c] text-[11px] font-black uppercase tracking-wider shadow-sm">
                👑 Lead Creator & Developer
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
                <p className="text-[11px] font-black tracking-[.18em] text-pink-300 uppercase mb-1">IT’S PINK-SNAP.DEV</p>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight">HEY, I’M JIMSON.</h3>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-white/80 leading-relaxed space-y-3 font-medium">
              <p>
                Hi! I'm a student web developer from Cavite, Philippines, who loves building websites, learning by doing, and keeping things organized.
              </p>
              <p>
                I'm the developer behind PinkSnap — a virtual photobooth website that I planned, structured, and built with an AI-assisted workflow. While I originally created it for me and my girlfriend Jera, it's open for everyone to enjoy!
              </p>
              <p>
                I created PinkSnap to learn new things, explore new techniques, and grow as a student developer. Since this website is a work in progress, I appreciate your patience as I continue to improve it. Thank you for stopping by! :D
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-white/10">
            {jimsonSocials.map(({ label, href, icon: Icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white text-[#201b2c] px-3.5 py-1.5 text-xs font-black hover:bg-white/90 hover:scale-105 transition-all shadow-sm active:scale-95">
                <Icon className="w-3.5 h-3.5" /> {label}
              </a>
            ))}
            <a href="https://chon-vert.vercel.app/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white text-[#201b2c] px-3.5 py-1.5 text-xs font-black hover:bg-white/90 hover:scale-105 transition-all shadow-sm active:scale-95">
              Portfolio <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* rezn1r.tech */}
        <div className="md:col-span-5 rounded-3xl bg-[#141416] border border-white/10 text-white p-6 sm:p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden group hover:-translate-y-2 hover:border-pink-500/40 hover:shadow-[0_20px_45px_rgba(245,61,137,0.18)] transition-all duration-300 ease-out">
          <div>
            {/* Role Badge */}
            <div className="mb-4">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white text-[#201b2c] text-[11px] font-black uppercase tracking-wider shadow-sm">
                ⚡ Collaborator
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
                <p className="text-[11px] font-black tracking-[.18em] text-pink-300 uppercase mb-1">COMMUNITY CHAT & AUTH</p>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight">REZN1R</h3>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-white/80 leading-relaxed space-y-3 font-medium">
              <p>
                Hey! I'm rezn1r. I helped my friend Jimson integrate the community chat and simple auth into PinkSnap to make it more connected and fun for everyone.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-white/10">
            <a href="https://github.com/rezn1r" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white text-[#201b2c] px-3.5 py-1.5 text-xs font-black hover:bg-white/90 hover:scale-105 transition-all shadow-sm active:scale-95">
              <Github className="w-3.5 h-3.5" /> GitHub
            </a>
            <a href="https://rezn1r.tech" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white text-[#201b2c] px-3.5 py-1.5 text-xs font-black hover:bg-white/90 hover:scale-105 transition-all shadow-sm active:scale-95">
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