import { useRef } from 'react';
import { ExternalLink, Facebook, Github, Instagram, Sparkles } from 'lucide-react';
import { SiGooglegemini, SiLucide, SiReact, SiReplit, SiTailwindcss, SiTypescript, SiVite } from 'react-icons/si';

const loopTools = [
  { name: 'Gemini', tone: 'tool-gemini' },
  { name: 'Grok', tone: 'tool-grok' },
  { name: 'Replit', tone: 'tool-replit' },
  { name: 'React', tone: 'tool-react' },
  { name: 'Vite', tone: 'tool-vite' },
  { name: 'Tailwind', tone: 'tool-tailwind' },
  { name: 'Lucide', tone: 'tool-lucide' },
  { name: 'TypeScript', tone: 'tool-typescript' },
  { name: 'Wouter', tone: 'tool-wouter' },
];

function ToolLogo({ name }: { name: string }) {
  const common = { className: 'credit-tool-icon', width: 24, height: 24, viewBox: '0 0 32 32', 'aria-hidden': true };

  if (name === 'Gemini') return <SiGooglegemini className="credit-tool-icon" aria-hidden />;
  if (name === 'Grok') return <svg {...common}><path fill="currentColor" d="m8 6 18 20h-5L3 6h5Zm16.6 0-7 7.8 2.9 3.2L29 6h-4.4ZM11.2 18.3 3 26h5.3l5.8-5.4-2.9-2.3Z" /></svg>;
  if (name === 'Replit') return <SiReplit className="credit-tool-icon" aria-hidden />;
  if (name === 'React') return <SiReact className="credit-tool-icon" aria-hidden />;
  if (name === 'Vite') return <SiVite className="credit-tool-icon" aria-hidden />;
  if (name === 'Tailwind') return <SiTailwindcss className="credit-tool-icon" aria-hidden />;
  if (name === 'Lucide') return <SiLucide className="credit-tool-icon" aria-hidden />;
  if (name === 'TypeScript') return <SiTypescript className="credit-tool-icon" aria-hidden />;
  if (name === 'Wouter') return <svg {...common} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8v16l5-5 6 5 6-8 5 4" /><path d="M22 8h5v5" /></svg>;
  return <svg {...common} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 13a8 8 0 0 1 16 0v2c0 2 1 3 2 4H6c1-1 2-2 2-4v-2Z" /><path d="M13 23h6" /></svg>;
}

const socialLinks = [
  { label: 'GitHub', href: 'https://github.com/hey-chon', icon: Github },
  { label: 'Facebook', href: 'https://www.facebook.com/share/1BxyPxqSBg/?mibextid=wwXIfr', icon: Facebook },
  { label: 'Instagram', href: 'https://www.instagram.com/hey.chon?igsh=aWc4djRjcXRtb25z&utm_source=qr', icon: Instagram },
];

export default function Credits() {
  const sectionRef = useRef<HTMLElement>(null);
  return (
    <section id="creator-section" ref={sectionRef} aria-labelledby="credits-title" className="relative z-10 max-w-5xl mx-auto pb-14 pt-6 scroll-mt-6">
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <p className="text-[11px] font-black tracking-[.18em] text-primary uppercase mb-1">the little credits corner</p>
          <h2 id="credits-title" className="text-2xl sm:text-3xl font-black tracking-tight">MADE WITH GOOD HELP.</h2>
        </div>
        <Sparkles className="w-7 h-7 text-primary/50 shrink-0" />
      </div>

      <div className="credit-card overflow-hidden rounded-3xl border border-white/80 bg-white/55 shadow-sm backdrop-blur-md mb-4">
        <div className="marquee-track flex w-max gap-3 py-4 px-4">
          {[...loopTools, ...loopTools].map((tool, index) => (
            <div key={`${tool.name}-${index}`} className={`credit-tool ${tool.tone}`} aria-label={tool.name}>
              <span className="credit-tool-mark"><ToolLogo name={tool.name} /></span>
              <strong>{tool.name}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="credit-card creator-card grid md:grid-cols-[1fr_auto] gap-6 items-center rounded-3xl bg-[#201b2c] text-white p-6 sm:p-8 shadow-xl">
        <div>
          <p className="text-[11px] font-black tracking-[.18em] text-pink-300 uppercase mb-2">IT’S PINK-SNAP.DEV</p>
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">HEY, I’M JIMSON.</h3>
          <p className="text-sm sm:text-base text-white/70 leading-relaxed max-w-xl">
            I am a student web developer from Cavite, Philippines, who enjoys making websites, learning as I go, and keeping things organized. I am the creator behind PinkSnap, a virtual photobooth website that I created, planned and structured with an ai-assisted workflow. I built this website for me and my girlfriend "Jera" but this is open for everyone publicly ofcourse. The purpose of this project? I want to enhance my skills, learn new things, and make more projects as a student web developer. This website is a work in progress, so please bear with me as I continue to improve PinkSnap. Thank you for visiting my website!</p>
          <div className="flex flex-wrap gap-2 mt-5">
            {socialLinks.map(({ label, href, icon: Icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-white/85 hover:bg-white/20 transition-colors">
                <Icon className="w-4 h-4" /> {label}
              </a>
            ))}
            <a href="https://chon.is-a.dev" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primary/90 transition-colors">
              Portfolio <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
        <div className="hidden md:flex w-24 h-24 rounded-[28px] bg-primary/20 border border-white/10 items-center justify-center text-4xl font-black text-pink-200">
          JIM
        </div>
      </div>
    </section>
  );
}