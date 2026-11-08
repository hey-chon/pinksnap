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
      {/* Luxury Metallic/Enamel Camera Housing - No glow blur */}
      <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-[14px] bg-gradient-to-br from-[#ff6ba9] via-[#f53d89] to-[#b31454] p-[1.5px] shadow-[0_4px_12px_rgba(0,0,0,0.4)] group-hover/camera:rotate-[-5deg] group-hover/camera:scale-105 active:scale-95 transition-all duration-200">
        {/* Chamfered inner body */}
        <div className="w-full h-full rounded-[12.5px] bg-gradient-to-b from-[#ff5a9c] via-[#f53d89] to-[#9e0f49] p-1 flex items-center justify-center relative overflow-hidden shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.6),inset_0_-2px_4px_rgba(0,0,0,0.4)]">
          {/* Specular 45deg lens sweep */}
          <div className="absolute -top-6 -left-6 w-16 h-16 bg-gradient-to-br from-white/30 via-transparent to-transparent rotate-45 pointer-events-none" />

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
      <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-[14px] bg-gradient-to-br from-[#ff6ba9] via-[#f53d89] to-[#b31454] p-[1.5px] shadow-[0_4px_12px_rgba(0,0,0,0.4)] group-hover/home:rotate-[-5deg] group-hover/home:scale-105 active:scale-95 transition-all duration-200">
        <div className="w-full h-full rounded-[12.5px] bg-gradient-to-b from-[#ff5a9c] via-[#f53d89] to-[#9e0f49] p-1 flex items-center justify-center relative overflow-hidden shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.6),inset_0_-2px_4px_rgba(0,0,0,0.4)]">
          <div className="absolute -top-6 -left-6 w-16 h-16 bg-gradient-to-br from-white/30 via-transparent to-transparent rotate-45 pointer-events-none" />
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
  const [location, setLocation] = useLocation();
  const isHome = location === '/';

  const scrollToTop = () => {
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openCreator = () => {
    const scrollToCreator = () =>
      document.getElementById('creator-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (location === '/') {
      scrollToCreator();
      return;
    }
    resetAppFlow();
    setLocation('/');
    window.setTimeout(scrollToCreator, 120);
  };

  const navTabs = [
    { href: '/gallery', label: 'GALLERY', icon: Images, testId: 'nav-gallery' },
    { href: '/how-it-works', label: 'DIAGRAM', icon: HelpCircle, testId: 'nav-how-it-works' },
  ];

  return (
    <header className="booth-marquee w-full flex min-h-[64px] sm:min-h-[72px] items-center justify-between gap-3 px-3 py-2 sm:px-5 sm:py-2.5 md:px-7 shrink-0 relative z-50 pt-[calc(.6rem+env(safe-area-inset-top))]">
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
            className="p-2 sm:p-2.5 bg-[#251828] hover:bg-[#342038] rounded-full transition-all border border-[#3d2542] hover:border-white/25 active:scale-95 cursor-pointer shadow-sm"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        )}
        
        {isHome ? (
          <button
            type="button"
            onClick={scrollToTop}
            data-testid="link-brand"
            aria-label="Back to top"
            className="flex items-center gap-2 sm:gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl cursor-pointer select-none text-left"
          >
            <PremiumCameraBadge />
            <div className="flex flex-col leading-[.78]">
              <span className="font-display text-[22px] sm:text-[26px] text-white">PINK</span>
              <span className="font-display text-[22px] sm:text-[26px] text-primary">SNAP</span>
            </div>
          </button>
        ) : (
          <Link
            href="/"
            onClick={() => {
              resetAppFlow();
              scrollToTop();
            }}
            data-testid="link-brand"
            aria-label="PinkSnap home"
            className="flex items-center gap-2 sm:gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl cursor-pointer select-none text-left"
          >
            <PremiumHomeBadge />
            <div className="flex flex-col leading-[.78]">
              <span className="font-display text-[22px] sm:text-[26px] text-white">PINK</span>
              <span className="font-display text-[22px] sm:text-[26px] text-primary">SNAP</span>
            </div>
          </Link>
        )}
        <span className="hidden sm:block"><Bulbs count={5} /></span>
      </div>

      {/* ── Central Premium Desktop / Laptop Navigation Dock ── */}
      <div className="hidden lg:flex items-center gap-2">
        <nav
          aria-label="Main Navigation"
          className="flex items-center p-1 rounded-full bg-[#180f1c]/90 border border-white/15 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] backdrop-blur-md"
        >
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                data-testid={tab.testId}
                className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95 select-none ${
                  isActive
                    ? 'bg-gradient-to-b from-white/22 to-white/[0.08] border border-white/30 text-white shadow-[0_2px_10px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.4)]'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                    isActive ? 'text-primary stroke-[2.5] scale-105' : 'text-white/60'
                  }`}
                />
                <span>{tab.label}</span>
              </Link>
            );
          })}

          {/* Developer Section Link */}
          <button
            type="button"
            onClick={openCreator}
            data-testid="button-creator-top"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider text-white/60 hover:text-white hover:bg-white/[0.04] border border-transparent transition-all duration-200 active:scale-95 cursor-pointer select-none"
          >
            <UserRound className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>DEVELOPER</span>
          </button>
        </nav>

        {title && (
          <span className="hidden xl:inline text-xs font-black tracking-widest text-white/40 uppercase ml-2 select-none">
            / {title}
          </span>
        )}
      </div>

      {/* ── Right Action Controls ── */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Subtle Privacy & Terms on wide screens */}
        <div className="hidden xl:flex items-center gap-2 text-[10px] font-bold text-white/40 tracking-wider uppercase mr-1">
          <Link
            href="/privacy"
            className={`hover:text-primary transition-colors ${location === '/privacy' ? 'text-primary font-black' : ''}`}
          >
            Privacy
          </Link>
          <span className="text-white/20">·</span>
          <Link
            href="/terms"
            className={`hover:text-primary transition-colors ${location === '/terms' ? 'text-primary font-black' : ''}`}
          >
            Terms
          </Link>
        </div>

        <Link
          href="/chat"
          data-testid="link-chat-header"
          className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm ${
            location === '/chat'
              ? 'bg-primary text-white border border-primary/50 shadow-md shadow-primary/25'
              : 'text-white/90 hover:text-white bg-[#251828] hover:bg-[#342038] border border-[#3d2542] hover:border-white/25'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Chat</span>
        </Link>
        <UserMenu />
      </div>
    </header>
  );
}

// BottomNav is permanently retired to maximize screen real estate and eliminate cramped layouts
export function BottomNav() {
  return null;
}
