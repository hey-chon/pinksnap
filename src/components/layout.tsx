import { useState, useEffect } from 'react';
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

function PremiumCameraBadge() {
  return (
    <div className="relative group/camera select-none">
      {/* Ambient pink pulse blur */}
      <div className="absolute -inset-1 rounded-[16px] bg-gradient-to-r from-primary via-[#ff5c9f] to-primary opacity-60 blur-md group-hover/camera:opacity-90 group-hover/camera:blur-lg transition-all duration-300" />

      {/* Luxury Metallic/Enamel Camera Housing - No blue or cyan */}
      <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-[14px] bg-gradient-to-br from-[#ff6ba9] via-[#f53d89] to-[#b31454] p-[1.5px] shadow-[0_8px_20px_rgba(245,61,137,0.55),0_2px_6px_rgba(0,0,0,0.4)] group-hover/camera:rotate-[-5deg] group-hover/camera:scale-110 active:scale-90 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
        {/* Chamfered inner body */}
        <div className="w-full h-full rounded-[12.5px] bg-gradient-to-b from-[#ff5a9c] via-[#f53d89] to-[#9e0f49] p-1 flex items-center justify-center relative overflow-hidden shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.7),inset_0_-2px_4px_rgba(0,0,0,0.45)]">
          {/* Specular 45deg lens sweep */}
          <div className="absolute -top-6 -left-6 w-16 h-16 bg-gradient-to-br from-white/40 via-transparent to-transparent rotate-45 pointer-events-none group-hover/camera:translate-x-3 group-hover/camera:translate-y-3 transition-transform duration-500" />

          {/* Camera hardware icon */}
          <div className="relative flex items-center justify-center">
            <Camera className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white stroke-[2.4] drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function PremiumHomeBadge() {
  return (
    <div className="relative group/home select-none">
      <div className="absolute -inset-1 rounded-[16px] bg-gradient-to-r from-primary via-[#ff5c9f] to-primary opacity-60 blur-md group-hover/home:opacity-90 group-hover/home:blur-lg transition-all duration-300" />
      <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-[14px] bg-gradient-to-br from-[#ff6ba9] via-[#f53d89] to-[#b31454] p-[1.5px] shadow-[0_8px_20px_rgba(245,61,137,0.55),0_2px_6px_rgba(0,0,0,0.4)] group-hover/home:rotate-[-5deg] group-hover/home:scale-110 active:scale-90 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
        <div className="w-full h-full rounded-[12.5px] bg-gradient-to-b from-[#ff5a9c] via-[#f53d89] to-[#9e0f49] p-1 flex items-center justify-center relative overflow-hidden shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.7),inset_0_-2px_4px_rgba(0,0,0,0.45)]">
          <div className="absolute -top-6 -left-6 w-16 h-16 bg-gradient-to-br from-white/40 via-transparent to-transparent rotate-45 pointer-events-none group-hover/home:translate-x-3 group-hover/home:translate-y-3 transition-transform duration-500" />
          <Home className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white stroke-[2.4] drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
        </div>
      </div>
    </div>
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
            className="p-2 sm:p-2.5 bg-[#251828] hover:bg-[#342038] rounded-full transition-all border border-[#3d2542] hover:border-pink-500/50 active:scale-95 cursor-pointer shadow-sm"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        )}
        
        {isHome ? (
          <div data-testid="link-brand" aria-label="PinkSnap home" className="flex items-center gap-2 sm:gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl cursor-default">
            <PremiumCameraBadge />
            <div className="flex flex-col leading-[.78]">
              <span className="font-display text-[22px] sm:text-[26px] text-white">PINK</span>
              <span className="font-display text-[22px] sm:text-[26px] text-primary">SNAP</span>
            </div>
          </div>
        ) : (
          <Link href="/" onClick={resetAppFlow} data-testid="link-brand" aria-label="PinkSnap home" className="flex items-center gap-2 sm:gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl cursor-pointer">
            <PremiumHomeBadge />
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
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black uppercase tracking-wider text-white/90 hover:text-white px-3.5 py-1.5 rounded-full bg-[#251828] hover:bg-[#342038] border border-[#3d2542] hover:border-pink-500/50 transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
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

  const navTabs = [
    { href: '/how-it-works', label: 'DIAGRAM', icon: HelpCircle, testId: 'nav-how-it-works' },
    { href: '/gallery', label: 'GALLERY', icon: Images, testId: 'nav-gallery' },
    { href: '/profile', label: 'ACCOUNT', icon: UserRound, testId: 'nav-profile' },
  ];

  const getIdxFromPath = (path: string) => {
    if (path === '/how-it-works') return 0;
    if (path === '/gallery') return 1;
    if (path === '/profile' || path === '/auth') return 2;
    return -1;
  };

  const activeIdx = getIdxFromPath(location);
  const [targetIdx, setTargetIdx] = useState<number | null>(activeIdx >= 0 ? activeIdx : null);

  useEffect(() => {
    setTargetIdx(activeIdx >= 0 ? activeIdx : null);
  }, [activeIdx]);

  return (
    <footer className="w-full shrink-0 z-50 booth-marquee booth-footer">
      <div className="flex items-center justify-between gap-2 py-2.5 px-3 sm:py-3 sm:px-6">
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <button
            type="button"
            onClick={openCreator}
            data-testid="button-creator"
            className="creator-nav-button inline-flex items-center gap-1.5 sm:gap-2 rounded-full px-2.5 sm:px-3 py-1.5 text-xs font-black tracking-[.12em] text-white/90 bg-[#251828] hover:bg-[#342038] border border-[#3d2542] hover:border-pink-500/50 hover:text-primary transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer shadow-sm"
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

        {/* iOS Fluid Segmented Dock */}
        <div className="relative flex items-center p-1 rounded-full bg-[#1b111e] border border-[#331c36] shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] min-w-[140px] sm:min-w-[280px]">
          {/* Always-mounted smooth sliding indicator - Clear/Translucent (not pink) */}
          <div
            className="absolute top-1 bottom-1 rounded-full bg-white/[0.12] border border-white/20 shadow-[0_2px_8px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] pointer-events-none"
            style={{
              left: '4px',
              width: 'calc((100% - 8px) / 3)',
              transform: targetIdx !== null ? `translate3d(${targetIdx * 100}%, 0, 0)` : 'translate3d(0, 0, 0) scale(0.9)',
              opacity: targetIdx !== null ? 1 : 0,
              transition: 'transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 150ms ease',
              willChange: 'transform, opacity',
            }}
          />

          {navTabs.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = targetIdx === idx;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => setTargetIdx(idx)}
                data-testid={tab.testId}
                className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-black transition-colors duration-150 active:scale-95 cursor-pointer select-none ${
                  isActive ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]' : 'text-white/60 hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-transform ${isActive ? 'text-white stroke-[2.5] scale-105' : 'text-white/60'}`} />
                <span className="hidden sm:inline">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </footer>
  );
}
