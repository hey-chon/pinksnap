import { Link, useLocation } from 'wouter';
import { Camera, ChevronLeft, HelpCircle, Images, MessageCircle, UserRound } from 'lucide-react';
import { UserMenu } from '@/components/auth/user-menu';

function Bulbs({ count = 10 }: { count?: number }) {
  return (
    <span className="bulb-row" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => <i key={i} />)}
    </span>
  );
}

export function TopNav({ backTo, title }: { backTo?: string, title?: string }) {
  return (
    <header className="booth-marquee w-full flex min-h-[68px] sm:min-h-[76px] items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3 md:px-6 shrink-0 relative z-50 pt-[calc(.75rem+env(safe-area-inset-top))]">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {backTo && (
          <Link
            href={backTo}
            data-testid="button-back"
            className="p-2 sm:p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-all border border-white/15 backdrop-blur-sm active:scale-95"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </Link>
        )}
        <Link href="/" data-testid="link-brand" aria-label="PinkSnap home" className="flex items-center gap-2 sm:gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
          <div className="bg-primary text-primary-foreground p-2 sm:p-2.5 rounded-[13px] group-hover:rotate-[-4deg] group-hover:scale-105 transition-transform shadow-[0_7px_20px_rgba(245,61,137,.5)]">
            <Camera className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
          </div>
          <div className="flex flex-col leading-[.78]">
            <span className="font-display text-[22px] sm:text-[26px] text-white">PINK</span>
            <span className="font-display text-[22px] sm:text-[26px] text-primary">SNAP</span>
          </div>
        </Link>
        <span className="hidden sm:block"><Bulbs count={5} /></span>
      </div>

      {title && (
        <div className="hidden md:block absolute left-1/2 -translate-x-1/2 pointer-events-none">
          <h2 className="font-display text-2xl text-white/80 tracking-[.14em] uppercase">{title}</h2>
        </div>
      )}

      <div className="flex items-center gap-2 sm:gap-3">
        <Link href="/chat" data-testid="link-chat-header" className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black uppercase tracking-wider text-white/70 hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-2 py-2">
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
    setLocation('/');
    window.setTimeout(scrollToCreator, 120);
  };

  return (
    <footer className="w-full shrink-0 z-50 booth-marquee booth-footer border-b-0 border-t-[3px] border-primary/50">
      <div className="flex items-center justify-between gap-2 py-2 px-4 sm:py-3 sm:px-6">
        <button type="button" onClick={openCreator} data-testid="button-creator" className="creator-nav-button inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black tracking-[.12em] text-white/65 transition-all hover:bg-white/10 hover:text-primary hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <UserRound className="w-4 h-4" />
          CREATOR
        </button>
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/how-it-works" data-testid="nav-how-it-works" className={`flex items-center gap-1.5 text-sm font-bold transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded ${location === '/how-it-works' ? 'text-primary' : 'text-white/70 hover:text-primary'}`}>
            <HelpCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">HOW TO</span>
          </Link>
          <Link href="/gallery" data-testid="nav-gallery" className={`flex items-center gap-1.5 text-sm font-bold transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded ${location === '/gallery' ? 'text-primary' : 'text-white/70 hover:text-primary'}`}>
            <Images className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">GALLERY</span>
          </Link>
          <Link href="/profile" data-testid="nav-profile" className={`flex items-center gap-1.5 text-sm font-bold transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded ${location === '/profile' || location === '/auth' ? 'text-primary' : 'text-white/70 hover:text-primary'}`}>
            <UserRound className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">ACCOUNT</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
