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
        <div className="w-[38px] h-[90px] bg-white rounded-[3px] p-1 flex flex-col gap-[3px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-black/5 -rotate-2 group-hover:rotate-0 group-hover:scale-105 transition-all">
          <div className="w-full flex-1 bg-black/15 rounded-[1px]" />
          <div className="w-full flex-1 bg-black/15 rounded-[1px]" />
          <div className="w-full flex-1 bg-black/15 rounded-[1px]" />
          <div className="w-full flex-1 bg-black/15 rounded-[1px]" />
          <div className="w-full h-[8px]" />
        </div>
      ), 
      label: 'Classic Strip', 
      shots: '4 shots', 
      note: 'The tall booth strip' 
    },
    { 
      id: 'quad-4', 
      icon: (
        <div className="w-[70px] h-[84px] bg-white rounded-[3px] p-[5px] flex flex-col shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-black/5 rotate-2 group-hover:rotate-0 group-hover:scale-105 transition-all">
          <div className="grid grid-cols-2 gap-[4px] flex-1">
            <div className="w-full h-full bg-black/15 rounded-[2px]" />
            <div className="w-full h-full bg-black/15 rounded-[2px]" />
            <div className="w-full h-full bg-black/15 rounded-[2px]" />
            <div className="w-full h-full bg-black/15 rounded-[2px]" />
          </div>
          <div className="w-full h-[12px]" />
        </div>
      ), 
      label: 'Quad Grid', 
      shots: '4 shots', 
      note: 'Square photo card' 
    },
    { 
      id: 'horizontal-3', 
      icon: (
        <div className="w-[96px] h-[44px] bg-white rounded-[3px] p-[4px] flex gap-[4px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-black/5 -rotate-1 group-hover:rotate-0 group-hover:scale-105 transition-all">
          <div className="w-full h-full bg-black/15 rounded-[2px]" />
          <div className="w-full h-full bg-black/15 rounded-[2px]" />
          <div className="w-full h-full bg-black/15 rounded-[2px]" />
          <div className="w-[12px] h-full shrink-0" />
        </div>
      ), 
      label: 'Wide Three', 
      shots: '3 shots', 
      note: 'Landscape banner' 
    },
  ];

  return (
    <div className="flex flex-col h-[100dvh]">
      <TopNav backTo="/" />

      <main className="flex-1 overflow-y-auto flex flex-col items-center px-4 py-8 sm:px-6 sm:py-10">
        <div className="text-center mb-8 sm:mb-10 w-full max-w-2xl">
          <span className="booth-heading-kicker mb-4">Step 1 of 3 · Booth layout</span>
          <h1 className="font-display text-[2.6rem] leading-[.95] sm:text-6xl md:text-7xl text-foreground mt-4 mb-3">
            CHOOSE YOUR <span className="text-primary">LAYOUT.</span>
          </h1>
          <p className="text-[11px] sm:text-sm font-bold text-foreground/55 uppercase tracking-[.16em] sm:tracking-[.2em] leading-relaxed">
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
                <div className="mb-6 h-[96px] flex items-end transition-colors">
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
