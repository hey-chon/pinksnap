import { Link } from 'wouter';
import { TopNav, BottomNav } from '@/components/layout';
import { ArrowRight, Camera, Download, LayoutGrid, MessageCircle, Sparkles } from 'lucide-react';
import Credits from '@/components/credits';

export default function Home() {
  return (
    <div className="flex flex-col h-[100dvh]">
      <TopNav />
      
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-5 sm:p-8 relative">
        <div className="absolute top-1/4 left-10 md:left-32 w-64 h-64 bg-primary/20 rounded-full blur-3xl -z-10 mix-blend-multiply pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 md:right-32 w-80 h-80 bg-blue-300/20 rounded-full blur-3xl -z-10 mix-blend-multiply pointer-events-none" />
        
        <div className="text-center z-10 max-w-3xl mx-auto min-h-[min(740px,calc(100svh-4rem))] flex flex-col items-center justify-center pt-9 sm:pt-14 pb-16">
          <div className="home-hero-item inline-flex items-center gap-2 rounded-full bg-white/60 border border-white/80 px-4 py-2 text-[11px] font-black tracking-[.18em] text-primary uppercase shadow-sm">
            <Sparkles className="w-3.5 h-3.5" /> Your pocket photo booth
          </div>
          <h1 className="home-hero-item font-display text-[clamp(3.1rem,13vw,7rem)] text-foreground mt-5 mb-4 leading-[.86]">
            WELCOME TO <br/>
            <span className="text-primary drop-shadow-sm">PINKSNAP.</span>
          </h1>
          
          <p className="home-hero-item text-sm sm:text-lg font-bold text-foreground/70 mb-8 tracking-[.12em] uppercase">
           YOUR VIRTUAL PHOTOBOOTH.
          </p>
          
          <Link href="/loading" data-testid="link-setup" className="home-hero-item group relative inline-flex items-center justify-center px-8 py-4.5 font-black text-white bg-primary rounded-full overflow-hidden shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/50 focus-visible:ring-offset-2">
            <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-white rounded-full group-hover:w-56 group-hover:h-56 opacity-10"></span>
            <span className="relative flex items-center gap-2 text-lg">
              GET STARTED <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
          
          <button type="button" onClick={() => document.getElementById('home-guide-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="home-hero-item scroll-cue mt-8 inline-flex flex-col items-center gap-1 text-center text-foreground/45 hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full px-3 py-2" aria-label="Scroll to learn more">
            <span className="h-8 border-l-2 border-current" />
            <span className="text-[10px] font-black tracking-[.18em] uppercase">Scroll to explore</span>
          </button>
        </div>

         <div className="floating-strip hidden lg:block absolute right-[8%] top-[31%] rotate-12 drop-shadow-2xl opacity-90 animate-pulse pointer-events-none" aria-hidden="true">
          <div className="bg-white p-3 rounded-md shadow-xl border border-pink-100 flex flex-col gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-24 h-[72px] bg-pink-50 rounded-sm flex items-center justify-center border border-pink-100/50">
                <Camera className="w-6 h-6 text-pink-200" />
              </div>
            ))}
            <div className="pt-2 flex justify-center">
              <Camera className="w-5 h-5 text-primary/40" />
            </div>
          </div>
        </div>

        <section aria-labelledby="home-guide-title" className="relative z-10 max-w-5xl mx-auto pb-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
            <div>
              <p className="text-[11px] font-black tracking-[.18em] text-primary uppercase mb-1">Simple as 1, 2, 3</p>
              <h2 id="home-guide-title" className="font-display text-4xl sm:text-5xl">HOW TO USE</h2>
            </div>
             <Link href="/how-it-works" className="inline-flex items-center gap-1 text-xs font-black text-foreground/55 hover:text-primary uppercase tracking-wider">
               See full guide <ArrowRight className="w-3.5 h-3.5" />
             </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: <Camera />, title: 'Allow camera', copy: 'Give PinkSnap permission to see your camera.' },
              { icon: <LayoutGrid />, title: 'Pick a style', copy: 'Choose your layout, then capture your moments.' },
              { icon: <Download />, title: 'Save & share', copy: 'Customize your strip and save it to your phone.' },
            ].map((step) => (
              <div key={step.title} className="guide-card ticket p-4 flex items-start gap-3">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5">{step.icon}</div>
                <div>
                  <h3 className="font-display text-xl tracking-[.06em] mb-1">{step.title}</h3>
                  <p className="text-xs sm:text-sm font-medium text-foreground/60 leading-relaxed">{step.copy}</p>
                </div>
              </div>
            ))}
          </div>
           <div className="mt-5 flex justify-center">
             <Link href="/chat" className="inline-flex items-center gap-2 text-xs font-black text-primary hover:text-primary/75 uppercase tracking-wider transition-colors">
               <MessageCircle className="w-4 h-4" /> Join the community chat <ArrowRight className="w-3.5 h-3.5" />
             </Link>
           </div>
        </section>
        <Credits />
      </main>

      <BottomNav />
    </div>
  );
}
