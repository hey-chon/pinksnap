import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'wouter';
import { ChevronLeft, MessageCircle, Menu, X } from 'lucide-react';
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
  const [location, setLocation] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isHome = location === '/';

  const openSidebar = useCallback(() => {
    setIsSidebarOpen(true);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  // Close sidebar on ESC key
  useEffect(() => {
    if (!isSidebarOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSidebar();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isSidebarOpen, closeSidebar]);

  // Close sidebar on location change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  const scrollToTop = () => {
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <header
        style={{ touchAction: 'none' }}
        className="booth-marquee w-full flex min-h-[64px] sm:min-h-[72px] items-center justify-between gap-3 px-3 py-2 sm:px-5 sm:py-2.5 md:px-7 shrink-0 relative z-50 pt-[calc(.6rem+env(safe-area-inset-top))]"
      >
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
              className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl cursor-pointer select-none text-left"
            >
              <div className="flex items-center gap-2 sm:gap-2.5 leading-none">
                <img
                  src="/pinksnap-axolotl-icon.png"
                  alt="PinkSnap Axolotl"
                  className="h-11 w-11 sm:h-12 sm:w-12 md:h-13 md:w-13 object-contain shrink-0 drop-shadow-[0_2px_10px_rgba(245,61,137,0.5)] group-hover:scale-105 group-hover:rotate-[-3deg] -translate-y-[1px] sm:-translate-y-[1.5px] transition-all duration-200 select-none pointer-events-none"
                  draggable={false}
                />
                <div className="flex flex-col justify-center font-hero uppercase tracking-[0.16em] font-black leading-none select-none">
                  <span className="text-white text-[17px] sm:text-[20px] md:text-[22px]">PINK</span>
                  <span className="text-primary cinematic-glow-pink text-[17px] sm:text-[20px] md:text-[22px] -mt-[1px] sm:-mt-[2px]">SNAP</span>
                </div>
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
              className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl cursor-pointer select-none text-left"
            >
              <div className="flex items-center gap-2 sm:gap-2.5 leading-none">
                <img
                  src="/pinksnap-axolotl-icon.png"
                  alt="PinkSnap Axolotl"
                  className="h-11 w-11 sm:h-12 sm:w-12 md:h-13 md:w-13 object-contain shrink-0 drop-shadow-[0_2px_10px_rgba(245,61,137,0.5)] group-hover:scale-105 group-hover:rotate-[-3deg] -translate-y-[1px] sm:-translate-y-[1.5px] transition-all duration-200 select-none pointer-events-none"
                  draggable={false}
                />
                <div className="flex flex-col justify-center font-hero uppercase tracking-[0.16em] font-black leading-none select-none">
                  <span className="text-white text-[17px] sm:text-[20px] md:text-[22px]">PINK</span>
                  <span className="text-primary cinematic-glow-pink text-[17px] sm:text-[20px] md:text-[22px] -mt-[1px] sm:-mt-[2px]">SNAP</span>
                </div>
              </div>
            </Link>
          )}

          <span className="hidden sm:block"><Bulbs count={7} /></span>
        </div>

        {/* ── Right Action Controls ── */}
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden sm:block"><Bulbs count={7} /></span>

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

          {/* Hamburger Menu Toggle Button */}
          <button
            type="button"
            onClick={openSidebar}
            data-testid="button-hamburger-menu"
            style={{ touchAction: 'manipulation' }}
            className="p-2 sm:p-2.5 bg-[#251828] hover:bg-[#342038] text-white/90 hover:text-white rounded-full transition-all border border-[#3d2542] hover:border-white/25 active:scale-95 cursor-pointer shadow-sm touch-manipulation"
            aria-label="Open Navigation Menu"
            aria-expanded={isSidebarOpen}
            title="Menu"
          >
            <Menu className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
        </div>
      </header>

      {/* ── Slide-Out Sidebar Drawer with Instant 60/120fps GPU Transitions (Zero Lag) ── */}
      <div
        className={`fixed inset-0 z-[100] transition-[visibility] duration-200 ${
          isSidebarOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none delay-200'
        }`}
        aria-hidden={!isSidebarOpen}
      >
        {/* Backdrop Dimmer — Pure opacity on GPU layer, no laggy backdrop-blur */}
        <div
          className={`fixed inset-0 bg-black/70 transition-opacity duration-200 ease-out cursor-pointer ${
            isSidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ touchAction: 'manipulation' }}
          onClick={closeSidebar}
        />

        {/* Drawer Panel — Hardware-accelerated transform */}
        <aside
          aria-label="Sidebar Navigation"
          className={`fixed inset-y-0 right-0 z-10 w-72 sm:w-80 bg-[#140e19] border-l border-white/10 shadow-[-12px_0_30px_rgba(0,0,0,0.5)] flex flex-col justify-between p-6 sm:p-8 transform-gpu will-change-transform transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between pb-6 border-b border-white/10">
            <div className="flex items-center gap-2.5 leading-none">
              <img
                src="/pinksnap-axolotl-icon.png"
                alt="PinkSnap Axolotl"
                className="h-11 w-11 sm:h-12 sm:w-12 object-contain shrink-0 drop-shadow-[0_2px_8px_rgba(245,61,137,0.45)] -translate-y-[1px] sm:-translate-y-[1.5px] select-none pointer-events-none"
                draggable={false}
              />
              <div className="flex flex-col justify-center font-hero uppercase tracking-[0.16em] font-black leading-none select-none">
                <span className="text-white text-[17px] sm:text-[20px]">PINK</span>
                <span className="text-primary cinematic-glow-pink text-[17px] sm:text-[20px] -mt-[1px] sm:-mt-[2px]">SNAP</span>
              </div>
            </div>
            <button
              type="button"
              onClick={closeSidebar}
              data-testid="button-sidebar-close"
              style={{ touchAction: 'manipulation' }}
              className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-all active:scale-90 cursor-pointer touch-manipulation"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 py-6 flex flex-col gap-2">
            <Link
              href="/"
              onClick={closeSidebar}
              className={`text-sm font-black uppercase tracking-[0.16em] px-3 py-2 rounded-xl transition-all active:scale-[0.98] ${
                location === '/'
                  ? 'text-primary bg-primary/10'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              Home
            </Link>
            <Link
              href="/gallery"
              onClick={closeSidebar}
              className={`text-sm font-black uppercase tracking-[0.16em] px-3 py-2 rounded-xl transition-all active:scale-[0.98] ${
                location === '/gallery'
                  ? 'text-primary bg-primary/10'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              Gallery
            </Link>
            <Link
              href="/how-it-works"
              onClick={closeSidebar}
              className={`text-sm font-black uppercase tracking-[0.16em] px-3 py-2 rounded-xl transition-all active:scale-[0.98] ${
                location === '/how-it-works'
                  ? 'text-primary bg-primary/10'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              Diagram
            </Link>
            <Link
              href="/chat"
              onClick={closeSidebar}
              className={`text-sm font-black uppercase tracking-[0.16em] px-3 py-2 rounded-xl transition-all active:scale-[0.98] ${
                location === '/chat'
                  ? 'text-primary bg-primary/10'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              Community Chat
            </Link>
            <Link
              href="/profile"
              onClick={closeSidebar}
              className={`text-sm font-black uppercase tracking-[0.16em] px-3 py-2 rounded-xl transition-all active:scale-[0.98] ${
                location === '/profile'
                  ? 'text-primary bg-primary/10'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              My Profile
            </Link>
          </nav>

          {/* Sidebar Footer — Minimal Legal Links */}
          <div className="pt-6 border-t border-white/10 flex items-center justify-between text-[11px] font-bold text-white/40 tracking-wider uppercase">

          </div>
        </aside>
      </div>
    </>
  );
}


export function BottomNav() {
  return null;
}
