import { Link, useLocation } from 'wouter';
import { Camera, ChevronLeft, HelpCircle, Images, MessageCircle, UserRound, Home } from 'lucide-react';
import { UserMenu } from '@/components/auth/user-menu';
import { resetAppFlow } from '@/App';

function Bulbs({ count = 10 }: { count?: number }) {
  return (
    <span className="bulb-row" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => <i key={i} />)}
    </span>
  );
}

export function TopNav({
  backTo,
  onBack,
  title,
}: {
  backTo?: string;
  onBack?: () => void;
  title?: string;
}) {
  const [location] = useLocation();
  const isHome = location === '/';

  return (
    <header className="booth-marquee w-full flex min-h-[68px] sm:min-h-[76px] items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3 md:px-6 shrink-0 relative z-50 pt-[calc(.75rem+env(safe-area-inset-top))]">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {(backTo || onBack) && (
          <button
            type="button"
            onClick={() => {
              if (onBack) {
                onBack();
              } else {
                window.history.back();
              }
            }}
            data-testid="button-back"
            className="p-2 sm:p-2.5 bg-white/[0.08] hover:bg-white/[0.18] rounded-full transition-all border border-white/20 hover:border-white/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] backdrop-blur-md active:scale-95 cursor-pointer"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        )}
        
        {isHome ? (
          <div data-testid="link-brand" aria-label="PinkSnap home" className="flex items-center gap-2 sm:gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl cursor-default">
            <div className="bg-primary text-primary-foreground p-2 sm:p-2.5 rounded-[13px] group-hover:rotate-[-4deg] group-hover:scale-105 transition-transform shadow-[0_7px_20px_rgba(245,61,137,.5)]">
              <Camera className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </div>
            <div className="flex flex-col leading-[.78]">
              <span className="font-display text-[22px] sm:text-[26px] text-white">PINK</span>
              <span className="font-display text-[22px] sm:text-[26px] text-primary">SNAP</span>
            </div>
          </div>
        ) : (
          <Link href="/" onClick={resetAppFlow} data-testid="link-brand" aria-label="PinkSnap home" className="flex items-center gap-2 sm:gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl cursor-pointer">
            <div className="bg-primary text-primary-foreground p-2 sm:p-2.5 rounded-[13px] group-hover:rotate-[-4deg] group-hover:scale-105 transition-transform shadow-[0_7px_20px_rgba(245,61,137,.5)]">
              <Home className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </div>
            <div className="flex flex-col leading-[.78]">
              <span className="font-display text-[22px] sm:text-[26px] text-white">PINK</span>
              <span className="font-display text-[22px] sm:text-[26px] text-primary">SNAP</span>
            </div>
          </Link>
        )}
        <span className="hidden sm:block"><Bulbs count={5} /></span>
      </div>

      {title && (
        <div className="hidden md:block absolute left-1/2 -translate-x-1/2 pointer-events-none">
          <h2 className="font-display text-2xl text-white/80 tracking-[.14em] uppercase">{title}</h2>
        </div>
      )}

      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/chat"
          data-testid="link-chat-header"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black uppercase tracking-wider text-white/85 hover:text-white px-3 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/[0.14] border border-white/15 hover:border-white/35 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.18)] transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Chat</span>
        </Link>
        <UserMenu />
      </div>
    </header>
  );
}

export function BottomNav() {
  const [location, setLocation] = useLocation();

  const openCreator = () => {
    const scrollToCreator = () => document.getElementById('creator-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (location === '/') {
      scrollToCreator();
      return;
    }
    resetAppFlow();
    setLocation('/');
    window.setTimeout(scrollToCreator, 120);
  };

  return (
    <footer className="w-full shrink-0 z-50 booth-marquee booth-footer">
      <div className="flex items-center justify-between gap-2 py-2.5 px-3 sm:py-3 sm:px-6">
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <button
            type="button"
            onClick={openCreator}
            data-testid="button-creator"
            className="creator-nav-button inline-flex items-center gap-1.5 sm:gap-2 rounded-full px-2.5 sm:px-3 py-1.5 text-xs font-black tracking-[.12em] text-white/85 bg-white/[0.07] hover:bg-white/[0.14] border border-white/15 hover:border-pink-500/50 hover:text-primary hover:shadow-[0_0_14px_rgba(245,61,137,0.35)] backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.18)] transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
          >
            <UserRound className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            <span>DEVELOPER</span>
          </button>
          <span className="w-px h-3 bg-white/15 mx-0.5" aria-hidden="true" />
          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-bold text-white/50 tracking-wider uppercase">
            <Link
              href="/privacy"
              data-testid="footer-privacy-link"
              className={`hover:text-primary transition-colors ${location === '/privacy' ? 'text-primary font-black' : ''}`}
            >
              Privacy
            </Link>
            <span className="text-white/25">&</span>
            <Link
              href="/terms"
              data-testid="footer-terms-link"
              className={`hover:text-primary transition-colors ${location === '/terms' ? 'text-primary' : ''}`}
            >
              Terms
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold">
          <Link
            href="/how-it-works"
            data-testid="nav-how-it-works"
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full transition-all group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              location === '/how-it-works'
                ? 'text-primary bg-primary/15 border border-primary/35 shadow-[0_0_12px_rgba(245,61,137,0.25),inset_0_1px_1px_rgba(255,255,255,0.2)] font-black'
                : 'text-white/75 hover:text-white hover:bg-white/[0.08] border border-transparent hover:border-white/15'
            }`}
          >
            <HelpCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">DIAGRAM</span>
          </Link>
          <Link
            href="/gallery"
            data-testid="nav-gallery"
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full transition-all group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              location === '/gallery'
                ? 'text-primary bg-primary/15 border border-primary/35 shadow-[0_0_12px_rgba(245,61,137,0.25),inset_0_1px_1px_rgba(255,255,255,0.2)] font-black'
                : 'text-white/75 hover:text-white hover:bg-white/[0.08] border border-transparent hover:border-white/15'
            }`}
          >
            <Images className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">GALLERY</span>
          </Link>
          <Link
            href="/profile"
            data-testid="nav-profile"
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full transition-all group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              location === '/profile' || location === '/auth'
                ? 'text-primary bg-primary/15 border border-primary/35 shadow-[0_0_12px_rgba(245,61,137,0.25),inset_0_1px_1px_rgba(255,255,255,0.2)] font-black'
                : 'text-white/75 hover:text-white hover:bg-white/[0.08] border border-transparent hover:border-white/15'
            }`}
          >
            <UserRound className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">ACCOUNT</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
