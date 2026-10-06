import { Link } from 'wouter';
import { TopNav, BottomNav } from '@/components/layout';
import { ArrowRight, LayoutGrid, Rows3, Ticket } from 'lucide-react';
import { useAppContext, LayoutType } from '@/lib/store';

export default function Setup() {
  const { layout, setLayout, clearShots } = useAppContext();

  const layouts: { id: LayoutType; icon: React.ReactNode; label: string; shots: string; note: string }[] = [
    { 
      id: 'vertical-4', 
      icon: (
        /* Classic vertical strip — realistic photobooth proportions */
        <div className="-rotate-2 group-hover:rotate-0 group-hover:scale-105 transition-all duration-300 drop-shadow-[0_6px_18px_rgba(0,0,0,0.18)]">
          {/* Strip outer shell */}
          <div className="relative w-[52px] bg-white rounded-[4px] border border-black/10 overflow-hidden flex flex-col" style={{height: '118px'}}>
            {/* Top pink brand bar */}
            <div className="w-full bg-gradient-to-r from-pink-400 to-rose-400 flex items-center justify-center shrink-0" style={{height: '12px'}}>
              <span className="text-white font-black leading-none tracking-wider" style={{fontSize:'4px'}}>PINKSNAP</span>
            </div>
            {/* Film strip body */}
            <div className="flex flex-1 min-h-0">
              {/* Left perforations */}
              <div className="flex flex-col justify-around py-[3px] px-[2px] bg-[#f0f0f0] shrink-0 gap-[4px]" style={{width:'6px'}}>
                {[0,1,2,3,4,5].map(i=><div key={i} className="w-[3px] h-[3px] rounded-full bg-black/20 mx-auto"/>)}
              </div>
              {/* Photos */}
              <div className="flex flex-col flex-1 gap-[2px] py-[3px] px-[2px]">
                {[0,1,2,3].map(i=>(
                  <div key={i} className="flex-1 rounded-[2px] overflow-hidden relative" style={{background:'linear-gradient(135deg,#fce4ec 0%,#e3f2fd 100%)'}}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-[8px] h-[8px] rounded-full bg-black/10"/>
                    </div>
                  </div>
                ))}
              </div>
              {/* Right perforations */}
              <div className="flex flex-col justify-around py-[3px] px-[2px] bg-[#f0f0f0] shrink-0 gap-[4px]" style={{width:'6px'}}>
                {[0,1,2,3,4,5].map(i=><div key={i} className="w-[3px] h-[3px] rounded-full bg-black/20 mx-auto"/>)}
              </div>
            </div>
            {/* Bottom brand footer */}
            <div className="w-full bg-gradient-to-r from-pink-400 to-rose-400 flex items-center justify-center shrink-0" style={{height:'10px'}}>
              <span className="text-white/80 font-bold leading-none tracking-widest" style={{fontSize:'3px'}}>♥ 4 PHOTOS ♥</span>
            </div>
          </div>
        </div>
      ), 
      label: 'Classic Strip', 
      shots: '4 shots', 
      note: 'The tall booth strip' 
    },
    { 
      id: 'quad-4', 
      icon: (
        /* Quad grid — square card with 2×2 photo grid */
        <div className="rotate-2 group-hover:rotate-0 group-hover:scale-105 transition-all duration-300 drop-shadow-[0_6px_18px_rgba(0,0,0,0.18)]">
          <div className="relative bg-white rounded-[4px] border border-black/10 overflow-hidden flex flex-col" style={{width:'90px', height:'100px'}}>
            {/* Top pink brand bar */}
            <div className="w-full bg-gradient-to-r from-pink-400 to-rose-400 flex items-center justify-center shrink-0" style={{height:'12px'}}>
              <span className="text-white font-black leading-none tracking-wider" style={{fontSize:'4px'}}>PINKSNAP</span>
            </div>
            {/* 2×2 photo grid */}
            <div className="flex-1 grid grid-cols-2 gap-[3px] p-[4px]">
              {[0,1,2,3].map(i=>(
                <div key={i} className="rounded-[2px] overflow-hidden relative" style={{background:'linear-gradient(135deg,#fce4ec 0%,#e3f2fd 100%)'}}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-[8px] h-[8px] rounded-full bg-black/10"/>
                  </div>
                </div>
              ))}
            </div>
            {/* Bottom brand footer */}
            <div className="w-full bg-gradient-to-r from-pink-400 to-rose-400 flex items-center justify-center shrink-0" style={{height:'10px'}}>
              <span className="text-white/80 font-bold leading-none tracking-widest" style={{fontSize:'3px'}}>♥ 4 PHOTOS ♥</span>
            </div>
          </div>
        </div>
      ), 
      label: 'Quad Grid', 
      shots: '4 shots', 
      note: 'Square photo card' 
    },
    { 
      id: 'horizontal-3', 
      icon: (
        /* Wide horizontal strip — landscape 3-photo banner */
        <div className="-rotate-1 group-hover:rotate-0 group-hover:scale-105 transition-all duration-300 drop-shadow-[0_6px_18px_rgba(0,0,0,0.18)]">
          <div className="relative bg-white rounded-[4px] border border-black/10 overflow-hidden flex flex-col" style={{width:'108px', height:'72px'}}>
            {/* Top pink brand bar */}
            <div className="w-full bg-gradient-to-r from-pink-400 to-rose-400 flex items-center justify-center shrink-0" style={{height:'11px'}}>
              <span className="text-white font-black leading-none tracking-wider" style={{fontSize:'4px'}}>PINKSNAP</span>
            </div>
            {/* 3 horizontal photos */}
            <div className="flex flex-1 gap-[3px] px-[4px] py-[3px]">
              {[0,1,2].map(i=>(
                <div key={i} className="flex-1 rounded-[2px] overflow-hidden relative" style={{background:'linear-gradient(135deg,#fce4ec 0%,#e3f2fd 100%)'}}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-[8px] h-[8px] rounded-full bg-black/10"/>
                  </div>
                </div>
              ))}
            </div>
            {/* Bottom brand footer */}
            <div className="w-full bg-gradient-to-r from-pink-400 to-rose-400 flex items-center justify-center shrink-0" style={{height:'9px'}}>
              <span className="text-white/80 font-bold leading-none tracking-widest" style={{fontSize:'3px'}}>♥ 3 PHOTOS ♥</span>
            </div>
          </div>
        </div>
      ), 
      label: 'Wide Three', 
      shots: '3 shots', 
      note: 'Horizontal strip card' 
    },
  ];

  return (
    <div className="flex flex-col h-[100dvh]">
      <TopNav backTo="/" />

      <main className="flex-1 overflow-y-auto flex flex-col items-center px-4 py-8 sm:px-6 sm:py-10">
        <div className="text-center mb-8 sm:mb-10 w-full max-w-2xl">
          <span className="booth-heading-kicker mb-4">Step 1 of 3 · Booth layout</span>
          <h1 className="font-hero text-[2rem] leading-[1] sm:text-4xl md:text-5xl text-foreground mt-4 mb-3">
            CHOOSE YOUR <span className="text-primary">LAYOUT.</span>
          </h1>
          <p className="text-[11px] sm:text-sm font-bold text-foreground/55 tracking-[.16em] sm:tracking-[.2em] leading-relaxed">
            Every layout prints a different keepsake.
          </p>
        </div>

        <div className="w-full max-w-3xl booth-plate p-4 sm:p-7">
          <div className="flex items-center justify-between gap-3 mb-5">
            <h2 className="flex items-center gap-2 text-[11px] sm:text-xs font-black uppercase tracking-[.16em] sm:tracking-[.2em] text-foreground/70">
              <Ticket className="w-4 h-4 text-primary" /> FORMATS
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {layouts.map(l => (
              <button
                key={l.id}
                onClick={() => setLayout(l.id)}
                data-testid={`button-layout-${l.id}`}
                aria-pressed={layout === l.id}
                className={`ticket group p-4 sm:p-5 text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 ${layout === l.id ? 'ticket-active' : ''}`}
              >
                <div className="mb-6 h-[132px] flex items-end justify-center transition-colors">
                  {l.icon}
                </div>
                <span className="font-display text-xl sm:text-2xl block text-foreground">{l.label}</span>
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[.14em] text-foreground/45 block mb-3">{l.note}</span>
                <span className="ticket-stub block pt-3 text-[11px] font-black uppercase tracking-[.18em] text-primary">{l.shots}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 sm:mt-10 pb-14 w-full max-w-sm flex justify-center">
          <Link href="/studio" onClick={() => clearShots()} data-testid="link-continue" className="w-full inline-flex items-center justify-center px-6 py-4 sm:px-8 sm:py-5 font-black text-primary-foreground bg-primary rounded-full shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all active:scale-[0.98] text-base sm:text-lg gap-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/50 focus-visible:ring-offset-2">
            ENTER THE BOOTH <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </Link>
        </div>

      </main>

      <BottomNav />
    </div>
  );
}
