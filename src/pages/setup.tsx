import { Link } from 'wouter';
import { TopNav, BottomNav } from '@/components/layout';
import { ArrowRight, LayoutGrid, Rows3, Ticket } from 'lucide-react';
import { useAppContext, LayoutType } from '@/lib/store';

export default function Setup() {
  const { layout, setLayout, clearShots } = useAppContext();

  const layouts: { id: LayoutType; icon: React.ReactNode; label: string; shots: string; note: string }[] = [
    { id: 'vertical-4', icon: <Rows3 className="w-9 h-9 rotate-90" />, label: 'Classic Strip', shots: '4 shots', note: 'The tall booth strip' },
    { id: 'quad-4', icon: <LayoutGrid className="w-9 h-9" />, label: 'Quad Grid', shots: '4 shots', note: 'Square photo card' },
    { id: 'horizontal-3', icon: <Rows3 className="w-9 h-9" />, label: 'Wide Three', shots: '3 shots', note: 'Landscape banner' },
  ];

  return (
    <div className="flex flex-col h-[100dvh]">
      <TopNav backTo="/" />

      <main className="flex-1 overflow-y-auto flex flex-col items-center px-4 py-8 sm:px-6 sm:py-10">
        <div className="text-center mb-8 sm:mb-10 w-full max-w-2xl">
          <span className="booth-heading-kicker mb-4">Step 1 of 3 · Booth ticket</span>
          <h1 className="font-display text-[2.6rem] leading-[.95] sm:text-6xl md:text-7xl text-foreground mt-4 mb-3">
            PICK YOUR <span className="text-primary">STRIP.</span>
          </h1>
          <p className="text-[11px] sm:text-sm font-bold text-foreground/55 uppercase tracking-[.16em] sm:tracking-[.2em] leading-relaxed">
            Every layout prints a different keepsake.
          </p>
        </div>

        <div className="w-full max-w-3xl booth-plate p-4 sm:p-7">
          <div className="flex items-center justify-between gap-3 mb-5">
            <h2 className="flex items-center gap-2 text-[11px] sm:text-xs font-black uppercase tracking-[.16em] sm:tracking-[.2em] text-foreground/70">
              <Ticket className="w-4 h-4 text-primary" /> Choose a layout
            </h2>
            <span className="text-[10px] font-black uppercase tracking-[.18em] text-foreground/40 shrink-0">3 formats</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {layouts.map(l => (
              <button
                key={l.id}
                onClick={() => setLayout(l.id)}
                data-testid={`button-layout-${l.id}`}
                aria-pressed={layout === l.id}
                className={`ticket p-4 sm:p-5 text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 ${layout === l.id ? 'ticket-active' : ''}`}
              >
                <div className={`mb-3 sm:mb-4 transition-colors ${layout === l.id ? 'text-primary' : 'text-foreground/40'}`}>
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
