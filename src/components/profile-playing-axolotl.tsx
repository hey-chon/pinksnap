import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AxolotlSvg, MascotMood } from '@/components/axolotl/axolotl-svg';
import { Sparkles, Heart } from 'lucide-react';

type AxolotlAction = 'idle' | 'running' | 'jumping' | 'curious' | 'celebrating';

interface Particle {
  id: number;
  x: number;
  icon: 'heart' | 'sparkle';
}

export function ProfilePlayingAxolotl() {
  // Horizontal position along the bottom line (percentage of banner width)
  const [posX, setPosX] = useState(18);
  const [facing, setFacing] = useState<'left' | 'right'>('right');
  const [action, setAction] = useState<AxolotlAction>('idle');
  const [mood, setMood] = useState<MascotMood>('happy');
  const [isWagging, setIsWagging] = useState(true);
  const [lookOffset, setLookOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [transitionDuration, setTransitionDuration] = useState(2.4);

  const nextMoveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lookStepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Spawn small cute ambient particles when she hops or celebrates
  const spawnParticles = useCallback((count = 2) => {
    const newItems: Particle[] = Array.from({ length: count }).map((_, i) => ({
      id: Date.now() + Math.random() + i,
      x: (Math.random() - 0.5) * 30,
      icon: Math.random() > 0.5 ? 'heart' : 'sparkle',
    }));

    setParticles((prev) => [...prev.slice(-4), ...newItems]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newItems.some((n) => n.id === p.id)));
    }, 950);
  }, []);

  // Main autonomous patrol/exploration along the bottom line
  const scheduleNextAction = useCallback(() => {
    // Pick a new horizontal position along the bottom line (bounded safe zone: 8% to 84%)
    const minX = 8;
    const maxX = 84;
    const targetX = Math.round(minX + Math.random() * (maxX - minX));

    setPosX((currentX) => {
      const distance = Math.abs(targetX - currentX);

      // Face direction of movement
      const newFacing = targetX < currentX ? 'left' : 'right';
      setFacing(newFacing);

      // Calculate natural walking/running speed based on distance (1.6s to 3.6s)
      const duration = Math.max(1.6, Math.min(3.6, distance * 0.055));
      setTransitionDuration(duration);

      // Random action choice for this movement leg
      const roll = Math.random();

      if (roll < 0.35) {
        // ACTION 1: Running with a playful mid-run leap
        setAction('running');
        setMood('happy');
        setIsWagging(true);

        const jumpDelay = (duration * 1000) * 0.45;
        setTimeout(() => {
          setAction('jumping');
          setMood('surprised');
          spawnParticles(2);

          setTimeout(() => {
            setAction('running');
            setMood('happy');
          }, 580);
        }, jumpDelay);

      } else if (roll < 0.70) {
        // ACTION 2: Energetic scamper along the floor
        setAction('running');
        setMood('happy');
        setIsWagging(true);

      } else {
        // ACTION 3: Gentle curious stroll
        setAction('running');
        setMood('wink');
        setIsWagging(false);
      }

      // When she arrives at her destination along the bottom line:
      if (nextMoveTimerRef.current) clearTimeout(nextMoveTimerRef.current);
      nextMoveTimerRef.current = setTimeout(() => {
        const arrivalRoll = Math.random();

        if (arrivalRoll < 0.45) {
          // Look around curiously (glance left then right)
          setAction('curious');
          setMood('idle');
          setIsWagging(false);

          setLookOffset({ x: -14, y: 0 });
          lookStepTimerRef.current = setTimeout(() => {
            setLookOffset({ x: 14, y: 0 });
            setTimeout(() => {
              setLookOffset({ x: 0, y: 0 });
            }, 650);
          }, 700);

        } else if (arrivalRoll < 0.75) {
          // Cute standing hop on the spot
          setAction('jumping');
          setMood('love');
          setIsWagging(true);
          spawnParticles(2);

          setTimeout(() => {
            setAction('idle');
            setMood('happy');
          }, 600);

        } else {
          // Happy idle resting on the ground
          setAction('idle');
          setMood('happy');
          setIsWagging(true);
          setLookOffset({ x: 0, y: 0 });
        }

        // Rest for a while (1.8s to 3.8s) before exploring to the next spot
        const restDuration = 1800 + Math.random() * 2000;
        nextMoveTimerRef.current = setTimeout(() => {
          scheduleNextAction();
        }, restDuration);

      }, duration * 1000);

      return targetX;
    });
  }, [spawnParticles]);

  // Start autonomous exploration on mount
  useEffect(() => {
    const startTimer = setTimeout(() => {
      scheduleNextAction();
    }, 800);

    return () => {
      clearTimeout(startTimer);
      if (nextMoveTimerRef.current) clearTimeout(nextMoveTimerRef.current);
      if (lookStepTimerRef.current) clearTimeout(lookStepTimerRef.current);
    };
  }, [scheduleNextAction]);

  return (
    <div
      className="absolute inset-x-0 bottom-0 top-0 pointer-events-none select-none z-10 overflow-hidden"
      aria-hidden="true"
    >
      <style>{`
        /* Realistic grounded animations: feet firmly anchored to the bottom line */
        @keyframes axolotlFloorScamper {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-2px) rotate(2deg); }
          50% { transform: translateY(0) rotate(0deg); }
          75% { transform: translateY(-2px) rotate(-2deg); }
        }
        @keyframes axolotlFloorLeap {
          0% { transform: translateY(0) scale(1.05, 0.95); }
          35% { transform: translateY(-24px) scale(0.95, 1.06) rotate(-3deg); }
          70% { transform: translateY(-3px) scale(1.03, 0.97); }
          100% { transform: translateY(0) scale(1, 1); }
        }
        @keyframes axolotlFloorIdle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1.5px); }
        }
        @keyframes particleBurstFly {
          0% { opacity: 0; transform: translate(0, 0) scale(0.5); }
          30% { opacity: 1; transform: translate(var(--px), -14px) scale(1); }
          100% { opacity: 0; transform: translate(calc(var(--px) * 1.4), -32px) scale(0.6); }
        }
        .axolotl-floor-running {
          animation: axolotlFloorScamper 0.36s ease-in-out infinite;
        }
        .axolotl-floor-jumping {
          animation: axolotlFloorLeap 0.58s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        .axolotl-floor-idle {
          animation: axolotlFloorIdle 2.6s ease-in-out infinite;
        }
        .axolotl-ambient-particle {
          animation: particleBurstFly 0.9s ease-out forwards;
        }
      `}</style>

      {/* 
        Grounded Axolotl along the bottom line of the pink rectangle.
        `bottom-14 sm:bottom-16` firmly aligns her feet right on the bottom baseline 
        where the pink banner meets the profile card.
      */}
      <div
        className="absolute bottom-14 sm:bottom-16 will-change-transform transition-all ease-in-out pointer-events-none select-none"
        style={{
          left: `${posX}%`,
          transitionDuration: action === 'running' ? `${transitionDuration}s` : '0.35s',
          transitionProperty: 'left',
          transform: 'translateX(-50%)',
        }}
      >
        {/* Facing Flip Wrapper (flips horizontally without affecting coordinates) */}
        <div
          className={`relative ${
            action === 'running'
              ? 'axolotl-floor-running'
              : action === 'jumping'
              ? 'axolotl-floor-jumping'
              : 'axolotl-floor-idle'
          }`}
          style={{
            transform: facing === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
          }}
        >
          {/* Ground Contact Shadow (anchored directly under feet on the floor) */}
          <div
            className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-9 sm:w-11 md:w-12 h-1.5 rounded-full bg-pink-950/30 blur-[2px] transition-all duration-300 ${
              action === 'jumping' ? 'scale-50 opacity-20' : 'scale-100 opacity-65'
            }`}
          />

          {/* Genuine Axolotl Mascot SVG Asset (100% original design & proportions) */}
          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 drop-shadow-[0_4px_8px_rgba(208,67,111,0.3)]">
            <AxolotlSvg
              mood={mood}
              isWagging={isWagging}
              lookOffset={lookOffset}
              className="w-full h-full block"
            />
          </div>

          {/* Ambient Particles on Hopping */}
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute -top-1 left-1/2 axolotl-ambient-particle pointer-events-none z-20"
              style={
                {
                  '--px': `${p.x}px`,
                } as React.CSSProperties
              }
            >
              {p.icon === 'heart' ? (
                <Heart className="w-3 h-3 fill-pink-400 text-pink-400 drop-shadow-[0_0_4px_rgba(255,255,255,0.7)]" />
              ) : (
                <Sparkles className="w-3 h-3 text-amber-200 drop-shadow-[0_0_4px_rgba(255,255,255,0.7)]" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
