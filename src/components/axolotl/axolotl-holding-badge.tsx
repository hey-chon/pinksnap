import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface AxolotlHoldingBadgeProps {
  className?: string;
}

export function AxolotlHoldingBadge({ className = '' }: AxolotlHoldingBadgeProps) {
  const [isWinking, setIsWinking] = useState(false);

  const handleMascotClick = () => {
    setIsWinking(true);
    setTimeout(() => setIsWinking(false), 1400);
  };

  return (
    <div
      className={`home-hero-item relative inline-flex items-center justify-center select-none pt-9 sm:pt-11 ${className}`}
      onClick={handleMascotClick}
      title="Axolotl: Your pocket photo booth!"
    >
      <style>{`
        .pk-badge-gill {
          animation: pk-sw 3.2s ease-in-out infinite;
        }
        .pk-badge-gill-r {
          animation: pk-sw2 3.2s ease-in-out infinite;
        }
        .pk-badge-blink {
          animation: pk-bl 4.5s infinite;
        }
        .pk-badge-twinkle {
          animation: pk-tw 2.2s ease-in-out infinite;
        }
        .pk-badge-bob {
          animation: pk-badge-bobbing 3.4s ease-in-out infinite;
        }
        @keyframes pk-badge-bobbing {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes pk-sw {
          0%, 100% { transform: rotate(-4deg); }
          50% { transform: rotate(5deg); }
        }
        @keyframes pk-sw2 {
          0%, 100% { transform: rotate(4deg); }
          50% { transform: rotate(-5deg); }
        }
        @keyframes pk-bl {
          0%, 94%, 100% { transform: scaleY(1); }
          97% { transform: scaleY(0.1); }
        }
        @keyframes pk-tw {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pk-badge-gill, .pk-badge-gill-r, .pk-badge-blink, .pk-badge-twinkle, .pk-badge-bob {
            animation: none !important;
          }
        }
      `}</style>

      {/* ── 1. AXOLOTL PEEKING FROM THE BACK (z-0) ── */}
      {/* Sits right behind the top rim of the padding */}
      <div
        className="absolute -top-[30px] sm:-top-[38px] lg:-top-[42px] left-1/2 -translate-x-1/2 w-[124px] sm:w-[144px] lg:w-[160px] pointer-events-none z-0 pk-badge-bob"
      >
        <svg
          viewBox="40 70 360 215"
          className="w-full h-auto overflow-visible drop-shadow-[0_4px_12px_rgba(208,67,111,0.22)]"
        >
          <defs>
            <g id="pk-gs-badge">
              <path d="M0-8Q42-10 86-3L86 3Q42 10 0 8Z" />
              <ellipse cx="24" cy="-15" rx="20" ry="7" transform="rotate(-30 24 -15)" />
              <ellipse cx="24" cy="15" rx="20" ry="7" transform="rotate(30 24 15)" />
              <ellipse cx="46" cy="-13" rx="18" ry="6.5" transform="rotate(-24 46 -13)" />
              <ellipse cx="46" cy="13" rx="18" ry="6.5" transform="rotate(24 46 13)" />
              <ellipse cx="66" cy="-9" rx="14" ry="5.5" transform="rotate(-18 66 -9)" />
              <ellipse cx="66" cy="9" rx="14" ry="5.5" transform="rotate(18 66 9)" />
              <ellipse cx="86" cy="0" rx="11" ry="7" />
            </g>
          </defs>

          {/* Gills Layer */}
          <g id="badge-gills">
            {/* Right 3 Gills */}
            <g className="pk-badge-gill-r" style={{ transformOrigin: '300px 135px' }}>
              <g transform="translate(300 135) rotate(-52)">
                <use href="#pk-gs-badge" fill="#d0436f" stroke="#d0436f" strokeWidth="10" strokeLinejoin="round" />
                <use href="#pk-gs-badge" fill="#ff7fa9" />
              </g>
            </g>
            <g className="pk-badge-gill-r" style={{ transformOrigin: '325px 185px', animationDelay: '-.6s' }}>
              <g transform="translate(325 185) rotate(-14)">
                <use href="#pk-gs-badge" fill="#d0436f" stroke="#d0436f" strokeWidth="10" strokeLinejoin="round" />
                <use href="#pk-gs-badge" fill="#ff7fa9" />
              </g>
            </g>
            <g className="pk-badge-gill-r" style={{ transformOrigin: '315px 238px', animationDelay: '-1.2s' }}>
              <g transform="translate(315 238) rotate(22)">
                <use href="#pk-gs-badge" fill="#d0436f" stroke="#d0436f" strokeWidth="10" strokeLinejoin="round" />
                <use href="#pk-gs-badge" fill="#ff7fa9" />
              </g>
            </g>

            {/* Left 3 Gills */}
            <g className="pk-badge-gill" style={{ transformOrigin: '140px 135px' }}>
              <g transform="translate(140 135) scale(-1 1) rotate(-52)">
                <use href="#pk-gs-badge" fill="#d0436f" stroke="#d0436f" strokeWidth="10" strokeLinejoin="round" />
                <use href="#pk-gs-badge" fill="#ff7fa9" />
              </g>
            </g>
            <g className="pk-badge-gill" style={{ transformOrigin: '115px 185px', animationDelay: '-.6s' }}>
              <g transform="translate(115 185) scale(-1 1) rotate(-14)">
                <use href="#pk-gs-badge" fill="#d0436f" stroke="#d0436f" strokeWidth="10" strokeLinejoin="round" />
                <use href="#pk-gs-badge" fill="#ff7fa9" />
              </g>
            </g>
            <g className="pk-badge-gill" style={{ transformOrigin: '125px 238px', animationDelay: '-1.2s' }}>
              <g transform="translate(125 238) scale(-1 1) rotate(22)">
                <use href="#pk-gs-badge" fill="#d0436f" stroke="#d0436f" strokeWidth="10" strokeLinejoin="round" />
                <use href="#pk-gs-badge" fill="#ff7fa9" />
              </g>
            </g>
          </g>

          {/* Head Shape */}
          <g id="badge-head">
            <path
              d="M108 200C108 120 160 92 220 92C280 92 332 120 332 200C332 262 285 285 220 285C155 285 108 262 108 200Z"
              fill="#ffc2d4"
              stroke="#d0436f"
              strokeWidth="5"
              strokeLinejoin="round"
            />
            {/* Chin shadow/depth */}
            <path
              d="M114 226C136 268 186 277 220 277C280 277 322 258 328 222C300 250 262 262 220 262C176 262 140 252 114 226Z"
              fill="#ffa5c0"
            />
            {/* Forehead light highlight */}
            <path
              d="M136 146Q160 116 206 110"
              fill="none"
              stroke="#fff"
              strokeWidth="9"
              strokeLinecap="round"
              opacity=".7"
            />

            {/* Blush cheeks */}
            <ellipse cx="124" cy="226" rx="21" ry="13" fill="#ff6f9d" opacity=".7" />
            <ellipse cx="316" cy="226" rx="21" ry="13" fill="#ff6f9d" opacity=".7" />

            {/* Left Eye */}
            <g className="pk-badge-blink" style={{ transformOrigin: '165px 198px' }}>
              <circle cx="165" cy="198" r="16" fill="#4a2018" />
              <circle cx="171" cy="191" r="5.5" fill="#fff" />
              <circle cx="159" cy="206" r="2.6" fill="#fff" />
            </g>

            {/* Right Eye (winking or normal blinking) */}
            {isWinking ? (
              <path
                d="M256 184L289 196L256 208"
                fill="none"
                stroke="#4a2018"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <g className="pk-badge-blink" style={{ transformOrigin: '275px 198px' }}>
                <circle cx="275" cy="198" r="16" fill="#4a2018" />
                <circle cx="281" cy="191" r="5.5" fill="#fff" />
                <circle cx="269" cy="206" r="2.6" fill="#fff" />
              </g>
            )}

            {/* Cute Cat / W Mouth */}
            <path
              d="M196 216Q208 232 220 218Q232 232 244 216"
              fill="none"
              stroke="#4a2018"
              strokeWidth="5.5"
              strokeLinecap="round"
            />
          </g>

          {/* Floating Sparkles around head */}
          <g fill="#fff" stroke="#ff7fa9" strokeWidth="2" strokeLinejoin="round">
            <g className="pk-badge-twinkle" transform="translate(74 150) scale(1.1)">
              <path d="M0-10Q2-2 10 0Q2 2 0 10Q-2 2-10 0Q-2-2 0-10Z" />
            </g>
            <g className="pk-badge-twinkle" style={{ animationDelay: '-1.1s' }} transform="translate(366 142) scale(0.95)">
              <path d="M0-10Q2-2 10 0Q2 2 0 10Q-2 2-10 0Q-2-2 0-10Z" />
            </g>
          </g>
        </svg>
      </div>

      {/* ── 2. THE BADGE / PADDING ITSELF (z-10) ── */}
      <div className="relative z-10 inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-white/75 dark:bg-zinc-900/75 backdrop-blur-md border border-white/90 dark:border-white/15 px-4 py-1.5 sm:px-5 sm:py-2 lg:px-6 lg:py-2.5 text-[9.5px] sm:text-[11px] lg:text-xs font-black tracking-[.16em] sm:tracking-[.18em] text-primary uppercase shadow-[0_4px_18px_rgba(245,61,137,0.18)] transition-transform duration-200 hover:scale-[1.02]">
        <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 text-primary" />
        <span>Your pocket photo booth</span>
      </div>

      {/* ── 3. LEFT HAND CLUTCHING LEFT END (z-20) ── */}
      <div
        className="absolute left-[-5px] sm:left-[-7px] top-1/2 -translate-y-1/2 z-20 pointer-events-none w-[20px] sm:w-[24px] lg:w-[26px]"
        aria-hidden="true"
      >
        <svg viewBox="0 0 32 36" className="w-full h-auto drop-shadow-[0_2px_4px_rgba(208,67,111,0.35)]">
          {/* Left paw clutching around edge from back to front */}
          <g stroke="#d0436f" strokeWidth="2.5" strokeLinejoin="round" fill="#ffc2d4">
            {/* Palm curving from behind */}
            <path d="M4 8 C4 18 8 28 18 30 C24 31 28 26 26 18 C25 10 18 6 10 6 Z" />
            {/* 4 Little Clutched Axolotl Finger Nubs gripping the front */}
            <circle cx="16" cy="10" r="4.2" />
            <circle cx="21" cy="14" r="4.2" />
            <circle cx="22" cy="20" r="4.2" />
            <circle cx="18" cy="25" r="4.2" />
            {/* Finger highlights */}
            <circle cx="16" cy="9" r="1.5" fill="#fff" stroke="none" opacity=".7" />
            <circle cx="21" cy="13" r="1.5" fill="#fff" stroke="none" opacity=".7" />
            <circle cx="22" cy="19" r="1.5" fill="#fff" stroke="none" opacity=".7" />
            <circle cx="18" cy="24" r="1.5" fill="#fff" stroke="none" opacity=".7" />
          </g>
        </svg>
      </div>

      {/* ── 4. RIGHT HAND CLUTCHING RIGHT END (z-20) ── */}
      <div
        className="absolute right-[-5px] sm:right-[-7px] top-1/2 -translate-y-1/2 z-20 pointer-events-none w-[20px] sm:w-[24px] lg:w-[26px]"
        aria-hidden="true"
      >
        <svg viewBox="0 0 32 36" className="w-full h-auto drop-shadow-[0_2px_4px_rgba(208,67,111,0.35)]">
          {/* Right paw clutching around edge from back to front */}
          <g
            transform="translate(16 18) scale(-1 1) translate(-16 -18)"
            stroke="#d0436f"
            strokeWidth="2.5"
            strokeLinejoin="round"
            fill="#ffc2d4"
          >
            {/* Palm curving from behind */}
            <path d="M4 8 C4 18 8 28 18 30 C24 31 28 26 26 18 C25 10 18 6 10 6 Z" />
            {/* 4 Little Clutched Axolotl Finger Nubs gripping the front */}
            <circle cx="16" cy="10" r="4.2" />
            <circle cx="21" cy="14" r="4.2" />
            <circle cx="22" cy="20" r="4.2" />
            <circle cx="18" cy="25" r="4.2" />
            {/* Finger highlights */}
            <circle cx="16" cy="9" r="1.5" fill="#fff" stroke="none" opacity=".7" />
            <circle cx="21" cy="13" r="1.5" fill="#fff" stroke="none" opacity=".7" />
            <circle cx="22" cy="19" r="1.5" fill="#fff" stroke="none" opacity=".7" />
            <circle cx="18" cy="24" r="1.5" fill="#fff" stroke="none" opacity=".7" />
          </g>
        </svg>
      </div>
    </div>
  );
}
