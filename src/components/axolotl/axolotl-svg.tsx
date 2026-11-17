import React from 'react';

export type MascotMood = 'idle' | 'wink' | 'happy' | 'love' | 'surprised' | 'sleepy';

interface AxolotlSvgProps {
  mood?: MascotMood;
  isSquishing?: boolean;
  isWagging?: boolean;
  isTickling?: boolean;
  isStatic?: boolean;
  lookOffset?: { x: number; y: number };
  className?: string;
  style?: React.CSSProperties;
  onZoneClick?: (zone: string, event: React.MouseEvent<SVGSVGElement>) => void;
  onZonePointerDown?: (zone: string, event: React.PointerEvent<SVGSVGElement>) => void;
  onZonePointerMove?: (event: React.PointerEvent<SVGSVGElement>) => void;
  onZonePointerUp?: (event: React.PointerEvent<SVGSVGElement>) => void;
}

export function AxolotlSvg({
  mood = 'idle',
  isSquishing = false,
  isWagging = false,
  isTickling = false,
  isStatic = false,
  lookOffset = { x: 0, y: 0 },
  className = '',
  style,
  onZoneClick,
  onZonePointerDown,
  onZonePointerMove,
  onZonePointerUp,
}: AxolotlSvgProps) {
  const getZone = (e: React.SyntheticEvent): string => {
    const target = e.target as HTMLElement | SVGElement | null;
    const closest = target?.closest?.('[data-zone]');
    return closest?.getAttribute('data-zone') || '';
  };

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (onZoneClick) {
      onZoneClick(getZone(e), e);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (onZonePointerDown) {
      onZonePointerDown(getZone(e), e);
    }
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-8 0 456 510"
      role="img"
      aria-label="PinkSnap axolotl mascot"
      data-mood={mood}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={onZonePointerMove}
      onPointerUp={onZonePointerUp}
      style={style}
      className={`select-none ${className} ${isSquishing ? 'squish' : ''} ${isWagging ? 'wag' : ''} ${isTickling ? 'tickle' : ''} ${isStatic ? 'static' : ''}`}
    >
      <title>PinkSnap axolotl</title>

      <defs>
        <g id="pk-gs">
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

      <style>{`
        .v { display: none; }
        [data-mood=idle] .idle,
        [data-mood=wink] .wink,
        [data-mood=happy] .happy,
        [data-mood=love] .love,
        [data-mood=surprised] .surprised,
        [data-mood=sleepy] .sleepy { display: inline; }
        
        .gill { animation: pk-sw 3.2s ease-in-out infinite; }
        .gill.r { animation-name: pk-sw2; }
        .blink { animation: pk-bl 4.5s infinite; }
        .zz { animation: pk-fl 2.4s ease-in-out infinite; }
        .tw { animation: pk-tw 2.2s ease-in-out infinite; }
        @keyframes pk-tw { 0%, 100% { opacity: .15; } 50% { opacity: 1; } }
        .look { transition: transform .15s ease-out; }
        .arm { transition: transform .35s cubic-bezier(.3, 1.6, .5, 1); }
        .tail { animation: pk-tail 2.6s ease-in-out infinite; }
        .wag .tail { animation-duration: .3s !important; }
        .tickle .gill { animation-duration: .25s !important; }
        
        [data-mood=happy] .arm.l, [data-mood=love] .arm.l { transform: rotate(115deg); }
        [data-mood=happy] .arm.r, [data-mood=love] .arm.r { transform: rotate(-115deg); }
        [data-mood=surprised] .arm.l { transform: rotate(55deg); }
        [data-mood=surprised] .arm.r { transform: rotate(-55deg); }
        [data-mood=wink] .arm.r { animation: pk-wave .7s ease-in-out infinite; }
        
        @keyframes pk-sw { 0%, 100% { transform: rotate(-4deg); } 50% { transform: rotate(5deg); } }
        @keyframes pk-sw2 { 0%, 100% { transform: rotate(4deg); } 50% { transform: rotate(-5deg); } }
        @keyframes pk-bl { 0%, 94%, 100% { transform: scaleY(1); } 97% { transform: scaleY(.1); } }
        @keyframes pk-fl { 0%, 100% { transform: translateY(0); opacity: .5; } 50% { transform: translateY(-8px); opacity: 1; } }
        @keyframes pk-tail { 0%, 100% { transform: rotate(-5deg); } 50% { transform: rotate(8deg); } }
        @keyframes pk-wave { 0%, 100% { transform: rotate(-100deg); } 50% { transform: rotate(-130deg); } }
        
        .squish { animation: pk-squish .45s ease-out; }
        @keyframes pk-squish {
          0% { transform: scale(1); }
          30% { transform: scale(1.1, .88); }
          60% { transform: scale(.96, 1.06); }
          100% { transform: scale(1); }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .tw, .gill, .blink, .zz, .tail, .arm, .squish { animation: none !important; }
        }
        .static .tw, .static .gill, .static .blink, .static .zz, .static .tail, .static .arm, .static.squish {
          animation: none !important;
        }
        
        /* Interactive touch zones */
        [data-zone] {
          cursor: pointer;
        }
        [data-zone]:hover {
          filter: drop-shadow(0 0 6px rgba(245, 61, 137, 0.35));
        }
      `}</style>

      {/* Shadow */}
      <ellipse cx="220" cy="486" rx="120" ry="9" fill="#d0436f" opacity=".18" />

      {/* Body & Tail Group */}
      <g transform="translate(220 486) scale(.9) translate(-220 -486)">
        {/* Tail */}
        <g
          className="tail transition-transform"
          data-zone="tail"
          style={{ transformOrigin: '290px 395px' }}
          stroke="#d0436f"
          strokeWidth="5"
          strokeLinejoin="round"
        >
          <g fill="#ff9dbf">
            <ellipse cx="318" cy="376" rx="14" ry="17" transform="rotate(-25 318 376)" />
            <ellipse cx="346" cy="378" rx="14" ry="18" transform="rotate(-8 346 378)" />
            <ellipse cx="372" cy="392" rx="14" ry="18" transform="rotate(20 372 392)" />
            <ellipse cx="392" cy="414" rx="13" ry="17" transform="rotate(40 392 414)" />
            <ellipse cx="404" cy="440" rx="12" ry="15" transform="rotate(60 404 440)" />
          </g>
          <path d="M285 372C340 366 384 392 400 440C406 462 390 472 378 458C364 432 330 428 288 434Z" fill="#ffc2d4" />
          <path d="M300 424C336 420 362 432 378 458C384 466 392 470 398 462C396 474 380 474 372 462C356 440 330 436 296 440Z" fill="#ffa5c0" stroke="none" />
        </g>

        {/* Feet */}
        <path d="M184 416L158 450" stroke="#d0436f" strokeWidth="40" strokeLinecap="round" fill="none" />
        <ellipse cx="150" cy="460" rx="27" ry="15" transform="rotate(-10 150 460)" fill="#d0436f" stroke="#d0436f" strokeWidth="10" />
        <path d="M256 416L282 450" stroke="#d0436f" strokeWidth="40" strokeLinecap="round" fill="none" />
        <ellipse cx="290" cy="460" rx="27" ry="15" transform="rotate(10 290 460)" fill="#d0436f" stroke="#d0436f" strokeWidth="10" />
        <path d="M184 416L158 450" stroke="#ffc2d4" strokeWidth="30" strokeLinecap="round" fill="none" />
        <ellipse cx="150" cy="460" rx="27" ry="15" transform="rotate(-10 150 460)" fill="#ffc2d4" />
        <path d="M256 416L282 450" stroke="#ffc2d4" strokeWidth="30" strokeLinecap="round" fill="none" />
        <ellipse cx="290" cy="460" rx="27" ry="15" transform="rotate(10 290 460)" fill="#ffc2d4" />
        <path d="M130 457l6 8M139 453l6 9" stroke="#d0436f" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M310 457l-6 8M301 453l-6 9" stroke="#d0436f" strokeWidth="3.5" strokeLinecap="round" fill="none" />

        {/* Belly */}
        <g data-zone="belly" stroke="#d0436f" strokeWidth="5" strokeLinejoin="round">
          <path d="M152 268C140 310 130 360 136 400C142 436 180 446 220 446C260 446 298 436 304 400C310 360 300 310 288 268Z" fill="#ffc2d4" />
          <ellipse cx="220" cy="374" rx="44" ry="58" fill="#ffe6ee" stroke="none" />
          <path d="M274 300C294 346 292 406 258 436C298 428 314 366 288 300Z" fill="#ffa5c0" stroke="none" />
        </g>
      </g>

      {/* Head & Gills Group */}
      <g transform="translate(220 190) scale(1.12) translate(-220 -190)">
        {/* Gills */}
        <g id="gills" data-zone="gill">
          {/* Right Gills */}
          <g className="gill r" style={{ transformOrigin: '300px 135px' }}>
            <g transform="translate(300 135) rotate(-52)">
              <use href="#pk-gs" fill="#d0436f" stroke="#d0436f" strokeWidth="10" strokeLinejoin="round" />
              <use href="#pk-gs" fill="#ff7fa9" />
            </g>
          </g>
          <g className="gill r" style={{ transformOrigin: '325px 185px', animationDelay: '-.6s' }}>
            <g transform="translate(325 185) rotate(-14)">
              <use href="#pk-gs" fill="#d0436f" stroke="#d0436f" strokeWidth="10" strokeLinejoin="round" />
              <use href="#pk-gs" fill="#ff7fa9" />
            </g>
          </g>
          <g className="gill r" style={{ transformOrigin: '315px 238px', animationDelay: '-1.2s' }}>
            <g transform="translate(315 238) rotate(22)">
              <use href="#pk-gs" fill="#d0436f" stroke="#d0436f" strokeWidth="10" strokeLinejoin="round" />
              <use href="#pk-gs" fill="#ff7fa9" />
            </g>
          </g>

          {/* Left Gills */}
          <g className="gill" style={{ transformOrigin: '140px 135px' }}>
            <g transform="translate(140 135) scale(-1 1) rotate(-52)">
              <use href="#pk-gs" fill="#d0436f" stroke="#d0436f" strokeWidth="10" strokeLinejoin="round" />
              <use href="#pk-gs" fill="#ff7fa9" />
            </g>
          </g>
          <g className="gill" style={{ transformOrigin: '115px 185px', animationDelay: '-.6s' }}>
            <g transform="translate(115 185) scale(-1 1) rotate(-14)">
              <use href="#pk-gs" fill="#d0436f" stroke="#d0436f" strokeWidth="10" strokeLinejoin="round" />
              <use href="#pk-gs" fill="#ff7fa9" />
            </g>
          </g>
          <g className="gill" style={{ transformOrigin: '125px 238px', animationDelay: '-1.2s' }}>
            <g transform="translate(125 238) scale(-1 1) rotate(22)">
              <use href="#pk-gs" fill="#d0436f" stroke="#d0436f" strokeWidth="10" strokeLinejoin="round" />
              <use href="#pk-gs" fill="#ff7fa9" />
            </g>
          </g>
        </g>

        {/* Head */}
        <g data-zone="head">
          <path d="M108 200C108 120 160 92 220 92C280 92 332 120 332 200C332 262 285 285 220 285C155 285 108 262 108 200Z" fill="#ffc2d4" stroke="#d0436f" strokeWidth="5" strokeLinejoin="round" />
          <path d="M114 226C136 268 186 277 220 277C280 277 322 258 328 222C300 250 262 262 220 262C176 262 140 252 114 226Z" fill="#ffa5c0" />
          <path d="M136 146Q160 116 206 110" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" opacity=".7" />

          {/* Look Layer (Eyes, Cheeks, Mouth) */}
          <g
            className="look pointer-events-none"
            id="look"
            style={{
              transform: `translate(${lookOffset.x}px, ${lookOffset.y}px)`,
            }}
          >
            {/* Cheeks */}
            <ellipse cx="124" cy="226" rx="21" ry="13" fill="#ff6f9d" opacity=".7" />
            <ellipse cx="316" cy="226" rx="21" ry="13" fill="#ff6f9d" opacity=".7" />

            {/* Left Eye (idle, wink, blink) */}
            <g className="v idle wink blink" style={{ transformOrigin: '165px 198px' }}>
              <circle cx="165" cy="198" r="16" fill="#4a2018" />
              <circle cx="171" cy="191" r="5.5" fill="#fff" />
              <circle cx="159" cy="206" r="2.6" fill="#fff" />
            </g>

            {/* Right Eye (idle, blink) */}
            <g className="v idle blink" style={{ transformOrigin: '275px 198px' }}>
              <circle cx="275" cy="198" r="16" fill="#4a2018" />
              <circle cx="281" cy="191" r="5.5" fill="#fff" />
              <circle cx="269" cy="206" r="2.6" fill="#fff" />
            </g>

            {/* Wink Right Eye */}
            <path className="v wink" d="M256 184L289 196L256 208" fill="none" stroke="#4a2018" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />

            {/* Happy Eyes */}
            <g className="v happy" fill="none" stroke="#4a2018" strokeWidth="6" strokeLinecap="round">
              <path d="M150 202Q165 182 180 202" />
              <path d="M260 202Q275 182 290 202" />
            </g>

            {/* Love Eyes (Hearts) */}
            <g className="v love" fill="#ff3d7f" stroke="#d0436f" strokeWidth="2">
              <path transform="translate(165 196) scale(1.6)" d="M0 9C-15-3-13-16 0-8C13-16 15-3 0 9Z" />
              <path transform="translate(275 196) scale(1.6)" d="M0 9C-15-3-13-16 0-8C13-16 15-3 0 9Z" />
            </g>

            {/* Surprised Eyes */}
            <g className="v surprised">
              <circle cx="165" cy="198" r="19" fill="#4a2018" />
              <circle cx="173" cy="190" r="6.5" fill="#fff" />
              <circle cx="158" cy="207" r="3" fill="#fff" />
              <circle cx="275" cy="198" r="19" fill="#4a2018" />
              <circle cx="283" cy="190" r="6.5" fill="#fff" />
              <circle cx="268" cy="207" r="3" fill="#fff" />
            </g>

            {/* Sleepy Eyes */}
            <g className="v sleepy" fill="none" stroke="#4a2018" strokeWidth="6" strokeLinecap="round">
              <path d="M150 192Q165 205 180 192" />
              <path d="M260 192Q275 205 290 192" />
            </g>

            {/* Mouth: Idle, Wink, Sleepy */}
            <path className="v idle wink sleepy" d="M196 216Q208 232 220 218Q232 232 244 216" fill="none" stroke="#4a2018" strokeWidth="5.5" strokeLinecap="round" />

            {/* Mouth: Happy, Love */}
            <g className="v happy love">
              <path d="M196 214Q220 254 244 214Z" fill="#4a2018" stroke="#4a2018" strokeWidth="5" strokeLinejoin="round" />
              <ellipse cx="220" cy="235" rx="9" ry="5" fill="#ff6f9d" />
            </g>

            {/* Mouth: Surprised */}
            <ellipse className="v surprised" cx="220" cy="238" rx="8" ry="10" fill="#4a2018" />
          </g>
        </g>
      </g>

      {/* Arms */}
      <g transform="translate(220 486) scale(.9) translate(-220 -486)">
        {/* Left Arm */}
        <g className="arm l" data-zone="arm" style={{ transformOrigin: '158px 296px' }} stroke="#d0436f" strokeWidth="5" strokeLinejoin="round" fill="#ffc2d4">
          <ellipse cx="148" cy="324" rx="16" ry="34" transform="rotate(18 148 324)" />
          <circle cx="128" cy="362" r="6" />
          <circle cx="137" cy="368" r="6" />
          <circle cx="148" cy="369" r="6" />
          <circle cx="157" cy="365" r="6" />
          <ellipse cx="142" cy="355" rx="19" ry="13" stroke="none" />
        </g>

        {/* Right Arm */}
        <g className="arm r" data-zone="arm" style={{ transformOrigin: '282px 296px' }} stroke="#d0436f" strokeWidth="5" strokeLinejoin="round" fill="#ffc2d4">
          <ellipse cx="292" cy="324" rx="16" ry="34" transform="rotate(-18 292 324)" />
          <circle cx="312" cy="362" r="6" />
          <circle cx="303" cy="368" r="6" />
          <circle cx="292" cy="369" r="6" />
          <circle cx="283" cy="365" r="6" />
          <ellipse cx="298" cy="355" rx="19" ry="13" stroke="none" />
        </g>
      </g>

      {/* Sleep Zzz */}
      <g className="v sleepy pointer-events-none" fontFamily="sans-serif" fontWeight="700" fill="#f53d89">
        <text className="zz" x="214" y="66" fontSize="26">z</text>
        <text className="zz" x="238" y="44" fontSize="20" style={{ animationDelay: '-.8s' }}>z</text>
        <text className="zz" x="256" y="26" fontSize="15" style={{ animationDelay: '-1.6s' }}>z</text>
      </g>

      {/* Twinkles */}
      <g fill="#fff" stroke="#ff7fa9" strokeWidth="2" strokeLinejoin="round" className="pointer-events-none">
        <g className="tw" transform="translate(52 330) scale(1.6)">
          <path d="M0-10Q2-2 10 0Q2 2 0 10Q-2 2-10 0Q-2-2 0-10Z" />
        </g>
        <g className="tw" style={{ animationDelay: '-.7s' }} transform="translate(392 318) scale(1.2)">
          <path d="M0-10Q2-2 10 0Q2 2 0 10Q-2 2-10 0Q-2-2 0-10Z" />
        </g>
        <g className="tw" style={{ animationDelay: '-1.4s' }} transform="translate(410 250) scale(.8)">
          <path d="M0-10Q2-2 10 0Q2 2 0 10Q-2 2-10 0Q-2-2 0-10Z" />
        </g>
      </g>
    </svg>
  );
}
