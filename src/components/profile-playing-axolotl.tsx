import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AxolotlSvg, MascotMood } from '@/components/axolotl/axolotl-svg';
import { Sparkles, Heart } from 'lucide-react';

type AxolotlAction = 'idle' | 'running' | 'jumping' | 'curious' | 'celebrating';

interface Particle {
  id: number;
  x: number;
  y: number;
  icon: 'heart' | 'sparkle';
  color: string;
}

export function ProfilePlayingAxolotl() {
  // Coordinates in percentage of parent banner
  const [pos, setPos] = useState({ x: 20, y: 38 });
  const [facing, setFacing] = useState<'left' | 'right'>('right');
  const [action, setAction] = useState<AxolotlAction>('running');
  const [mood, setMood] = useState<MascotMood>('happy');
  const [isWagging, setIsWagging] = useState(true);
  const [isSquishing, setIsSquishing] = useState(false);
  const [lookOffset, setLookOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [transitionDuration, setTransitionDuration] = useState(2.2);

  const containerRef = useRef<HTMLDivElement>(null);
  const nextMoveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const curiousStepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInteractingRef = useRef(false);

  // Spawn cute particle bursts on jump or tap
  const spawnParticles = useCallback((count = 2) => {
    const newItems: Particle[] = Array.from({ length: count }).map((_, i) => ({
      id: Date.now() + Math.random() + i,
      x: (Math.random() - 0.5) * 36,
      y: -15 - Math.random() * 25,
      icon: Math.random() > 0.4 ? 'heart' : 'sparkle',
      color: Math.random() > 0.5 ? '#f43f5e' : '#ec4899',
    }));

    setParticles((prev) => [...prev.slice(-6), ...newItems]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newItems.some((n) => n.id === p.id)));
    }, 1100);
  }, []);

  // Main autonomous exploration loop
  const scheduleNextAction = useCallback(() => {
    if (isInteractingRef.current) return;

    // Pick a random target position inside the banner safe bounds
    // x: 6% to 84% (responsive across mobile to desktop)
    // y: 15% to 54% (above the bottom card overlap, playing around the glowing text)
    const newX = Math.round(6 + Math.random() * 78);
    const newY = Math.round(18 + Math.random() * 36);

    // Compute distance to set natural travel duration
    setPos((current) => {
      const dx = newX - current.x;
      const dy = newY - current.y;
      const dist = Math.hypot(dx, dy);

      // Axolotl faces the direction she is heading
      const newFacing = dx < 0 ? 'left' : 'right';
      setFacing(newFacing);

      // Duration: scale with distance (1.2s to 2.8s)
      const duration = Math.max(1.2, Math.min(2.8, dist * 0.045));
      setTransitionDuration(duration);

      // Decide what action she performs during this move
      const roll = Math.random();

      if (roll < 0.35) {
        // ACTION 1: Playful Jump Scamper (runs, then leaps in the air)
        setAction('running');
        setMood('happy');
        setIsWagging(true);

        const midPointDelay = (duration * 1000) * 0.45;
        setTimeout(() => {
          if (!isInteractingRef.current) {
            setAction('jumping');
            setMood('surprised');
            spawnParticles(2);
            setTimeout(() => {
              setAction('running');
              setMood('happy');
            }, 600);
          }
        }, midPointDelay);

      } else if (roll < 0.65) {
        // ACTION 2: Fast Scamper (eager running with tail wagging)
        setAction('running');
        setMood('happy');
        setIsWagging(true);

      } else if (roll < 0.85) {
        // ACTION 3: Curious Exploring (walks, stops, looks left and right)
        setAction('running');
        setMood('wink');
        setIsWagging(false);

      } else {
        // ACTION 4: Happy celebration hop
        setAction('celebrating');
        setMood('love');
        setIsWagging(true);
        spawnParticles(3);
      }

      // After arrival at destination, pause & perform idle/curious behaviors
      if (nextMoveTimerRef.current) clearTimeout(nextMoveTimerRef.current);
      nextMoveTimerRef.current = setTimeout(() => {
        if (isInteractingRef.current) return;

        // Arrived at destination: stop and look around
        const idleRoll = Math.random();
        if (idleRoll < 0.5) {
          // Curious look around
          setAction('curious');
          setMood('idle');
          setIsWagging(false);

          // Eyes glance left
          setLookOffset({ x: -14, y: 2 });
          curiousStepTimerRef.current = setTimeout(() => {
            // Eyes glance right
            setLookOffset({ x: 14, y: 2 });
            setTimeout(() => {
              setLookOffset({ x: 0, y: 0 });
            }, 700);
          }, 800);

        } else if (idleRoll < 0.8) {
          // Happy idle bobbing
          setAction('idle');
          setMood('happy');
          setIsWagging(true);
          setLookOffset({ x: 0, y: 0 });
        } else {
          // Cute wink
          setAction('idle');
          setMood('wink');
          setIsWagging(false);
          setLookOffset({ x: 0, y: 0 });
        }

        // Rest for a moment (1.5s to 3.5s) before exploring again
        const pauseTime = 1600 + Math.random() * 2200;
        nextMoveTimerRef.current = setTimeout(() => {
          scheduleNextAction();
        }, pauseTime);

      }, duration * 1000);

      return { x: newX, y: newY };
    });
  }, [spawnParticles]);

  // Start autonomous loop on mount
  useEffect(() => {
    // Initial start after gentle initial delay
    const initialTimer = setTimeout(() => {
      scheduleNextAction();
    }, 1200);

    return () => {
      clearTimeout(initialTimer);
      if (nextMoveTimerRef.current) clearTimeout(nextMoveTimerRef.current);
      if (curiousStepTimerRef.current) clearTimeout(curiousStepTimerRef.current);
    };
  }, [scheduleNextAction]);

  // Interactive tap / click: playful reaction!
  const handleAxolotlClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    isInteractingRef.current = true;
    if (nextMoveTimerRef.current) clearTimeout(nextMoveTimerRef.current);
    if (curiousStepTimerRef.current) clearTimeout(curiousStepTimerRef.current);

    // High playful jump & squish!
    setAction('jumping');
    setMood('love');
    setIsSquishing(true);
    setIsWagging(true);
    spawnParticles(4);

    setTimeout(() => {
      setIsSquishing(false);
      setAction('celebrating');
      setTimeout(() => {
        isInteractingRef.current = false;
        scheduleNextAction();
      }, 700);
    }, 600);
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none select-none z-10 overflow-hidden"
      aria-label="Playing PinkSnap Axolotl Mascot"
    >
      <style>{`
        /* Smooth, lively play animations for Axolotl */
        @keyframes axolotlScamperBob {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-3px) rotate(2.5deg); }
          50% { transform: translateY(0) rotate(0deg); }
          75% { transform: translateY(-3px) rotate(-2.5deg); }
        }
        @keyframes axolotlLeapArc {
          0% { transform: translateY(0) scale(1.05, 0.95); }
          35% { transform: translateY(-28px) scale(0.94, 1.08) rotate(-4deg); }
          70% { transform: translateY(-8px) scale(1.02, 0.98); }
          100% { transform: translateY(0) scale(1, 1); }
        }
        @keyframes axolotlCelebrateHop {
          0%, 100% { transform: translateY(0) scale(1); }
          30% { transform: translateY(-16px) scale(1.06, 0.95); }
          60% { transform: translateY(-6px) scale(0.98, 1.02); }
        }
        @keyframes particleFlyUp {
          0% { opacity: 0; transform: translate(0, 0) scale(0.4); }
          30% { opacity: 1; transform: translate(var(--px), -16px) scale(1.1); }
          100% { opacity: 0; transform: translate(calc(var(--px) * 1.5), -38px) scale(0.6); }
        }
        .axolotl-action-running {
          animation: axolotlScamperBob 0.38s ease-in-out infinite;
        }
        .axolotl-action-jumping {
          animation: axolotlLeapArc 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        .axolotl-action-celebrating {
          animation: axolotlCelebrateHop 0.5s ease-in-out infinite alternate;
        }
        .axolotl-action-curious {
          animation: axolotlScamperBob 2.2s ease-in-out infinite;
        }
        .axolotl-particle {
          animation: particleFlyUp 1s ease-out forwards;
        }
      `}</style>

      {/* Floating Animated Axolotl Entity */}
      <div
        className="absolute will-change-transform pointer-events-auto cursor-pointer transition-all ease-out"
        style={{
          left: `${pos.x}%`,
          top: `${pos.y}%`,
          transitionDuration: action === 'running' ? `${transitionDuration}s` : '0.4s',
          transitionProperty: 'left, top',
          transform: 'translate(-50%, -50%)',
        }}
        onClick={handleAxolotlClick}
        title="PinkSnap Axolotl playing! Tap to play with her ✨"
      >
        {/* Direction Flip & Action Wrapper */}
        <div
          className={`relative transition-transform duration-300 ease-out ${
            action === 'running'
              ? 'axolotl-action-running'
              : action === 'jumping'
              ? 'axolotl-action-jumping'
              : action === 'celebrating'
              ? 'axolotl-action-celebrating'
              : action === 'curious'
              ? 'axolotl-action-curious'
              : ''
          }`}
          style={{
            transform: facing === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
          }}
        >
          {/* Subtle Pink Ground Shadow that scales with jump */}
          <div
            className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 sm:w-12 h-2 rounded-full bg-pink-950/25 blur-[3px] transition-all duration-300 ${
              action === 'jumping' ? 'scale-50 opacity-20' : 'scale-100 opacity-60'
            }`}
          />

          {/* Genuine Axolotl Mascot SVG Asset (Exact proportions and authentic look preserved) */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 drop-shadow-[0_4px_10px_rgba(208,67,111,0.35)]">
            <AxolotlSvg
              mood={mood}
              isWagging={isWagging}
              isSquishing={isSquishing}
              lookOffset={lookOffset}
              className="w-full h-full block pointer-events-none"
            />
          </div>

          {/* Burst Particles (Hearts / Sparkles) */}
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute top-0 left-1/2 axolotl-particle pointer-events-none z-30"
              style={
                {
                  '--px': `${p.x}px`,
                } as React.CSSProperties
              }
            >
              {p.icon === 'heart' ? (
                <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500 drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-300 drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
              )}
            </div>
          ))}

          {/* Playful tiny badge hint on hover */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-xs text-[9px] font-black text-pink-200 px-1.5 py-0.5 rounded-full pointer-events-none whitespace-nowrap">
            PLAYING ✨
          </div>
        </div>
      </div>
    </div>
  );
}
