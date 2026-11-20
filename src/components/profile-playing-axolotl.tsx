import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AxolotlSvg, MascotMood } from '@/components/axolotl/axolotl-svg';
import { Sparkles, Heart } from 'lucide-react';

type AxolotlAction = 'idle' | 'walking' | 'jumping' | 'curious' | 'celebrating';

interface Particle {
  id: number;
  x: number;
  icon: 'heart' | 'sparkle';
}

export function ProfilePlayingAxolotl() {
  // Horizontal position along the bottom surface (percentage 8% to 84%)
  const [posX, setPosX] = useState(20);
  const [facing, setFacing] = useState<'left' | 'right'>('right');
  const [action, setAction] = useState<AxolotlAction>('walking');
  const [mood, setMood] = useState<MascotMood>('happy');
  const [isWagging, setIsWagging] = useState(true);
  const [lookOffset, setLookOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [walkDuration, setWalkDuration] = useState(4.2);

  const moveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const midJumpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const curiousTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Small cute particles that float up during a joyful jump
  const spawnParticles = useCallback((count = 2) => {
    const newItems: Particle[] = Array.from({ length: count }).map((_, i) => ({
      id: Date.now() + Math.random() + i,
      x: (Math.random() - 0.5) * 26,
      icon: Math.random() > 0.4 ? 'heart' : 'sparkle',
    }));

    setParticles((prev) => [...prev.slice(-3), ...newItems]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newItems.some((n) => n.id === p.id)));
    }, 900);
  }, []);

  // Main autonomous walking schedule along the bottom surface
  const scheduleNextWalk = useCallback(() => {
    // Pick a new target along the bottom line (bounded safe zone: 8% to 84%)
    const minX = 8;
    const maxX = 84;
    const targetX = Math.round(minX + Math.random() * (maxX - minX));

    setPosX((currentX) => {
      const distance = Math.abs(targetX - currentX);

      // Facing logic:
      // In the original AxolotlSvg, the tail is on the right side.
      // Therefore, the natural default orientation (scaleX(1)) faces LEFT (<--).
      // When walking RIGHT (-->), we flip with scaleX(-1) so head faces right and tail trails behind!
      // When walking LEFT (<--), we use scaleX(1) so head faces left and tail trails behind!
      const newFacing = targetX >= currentX ? 'right' : 'left';
      setFacing(newFacing);

      // Pleasant, natural walking speed (not rushed or hurried)
      // Duration scales with distance: minimum 3.2s, up to 6.8s
      const duration = Math.max(3.2, Math.min(6.8, distance * 0.088));
      setWalkDuration(duration);

      // Start walking state
      setAction('walking');
      setMood('happy');
      setIsWagging(true);
      setLookOffset({ x: 0, y: 0 });

      // Action variety: 45% chance of doing a playful jump mid-walk!
      const shouldJumpMidWalk = Math.random() < 0.45 && distance > 18;
      if (shouldJumpMidWalk) {
        // Trigger jump roughly halfway through the walk
        const jumpDelayMs = (duration * 1000) * 0.42;
        if (midJumpTimerRef.current) clearTimeout(midJumpTimerRef.current);
        midJumpTimerRef.current = setTimeout(() => {
          setAction('jumping');
          setMood('surprised');
          spawnParticles(2);

          // After jump finishes (600ms), land back on feet and resume walking to destination
          setTimeout(() => {
            setAction('walking');
            setMood('happy');
          }, 600);
        }, jumpDelayMs);
      }

      // Arrival at destination
      if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
      moveTimerRef.current = setTimeout(() => {
        // Clear any leftover mid-jump timers
        if (midJumpTimerRef.current) clearTimeout(midJumpTimerRef.current);

        const arrivalRoll = Math.random();

        if (arrivalRoll < 0.40) {
          // ACTION A: Curious pause - stop on the surface and look around
          setAction('curious');
          setMood('idle');
          setIsWagging(false);

          // Glance in one direction, then the other
          setLookOffset({ x: newFacing === 'right' ? 14 : -14, y: 0 });
          curiousTimerRef.current = setTimeout(() => {
            setLookOffset({ x: newFacing === 'right' ? -12 : 12, y: 0 });
            setTimeout(() => {
              setLookOffset({ x: 0, y: 0 });
            }, 600);
          }, 750);

        } else if (arrivalRoll < 0.70) {
          // ACTION B: Happy jump celebration on arrival
          setAction('jumping');
          setMood('love');
          setIsWagging(true);
          spawnParticles(2);

          setTimeout(() => {
            setAction('idle');
            setMood('happy');
          }, 650);

        } else {
          // ACTION C: Relaxed idle on the surface with tail wag
          setAction('idle');
          setMood('wink');
          setIsWagging(true);
          setLookOffset({ x: 0, y: 0 });
        }

        // Rest on the surface for 2.2s to 4.2s before scheduling next walk
        const restDuration = 2200 + Math.random() * 2000;
        moveTimerRef.current = setTimeout(() => {
          scheduleNextWalk();
        }, restDuration);

      }, duration * 1000);

      return targetX;
    });
  }, [spawnParticles]);

  // Start walking routine on mount
  useEffect(() => {
    const initialTimer = setTimeout(() => {
      scheduleNextWalk();
    }, 600);

    return () => {
      clearTimeout(initialTimer);
      if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
      if (midJumpTimerRef.current) clearTimeout(midJumpTimerRef.current);
      if (curiousTimerRef.current) clearTimeout(curiousTimerRef.current);
    };
  }, [scheduleNextWalk]);

  return (
    <div
      className="absolute inset-x-0 bottom-0 top-0 pointer-events-none select-none z-10 overflow-hidden"
      aria-hidden="true"
    >
      <style>{`
        /* Realistic grounded walking cadence: feet actively step down on the surface */
        @keyframes axolotlWalkingGait {
          0% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-3.5px) rotate(-3deg); }
          50% { transform: translateY(0) rotate(0deg); }
          75% { transform: translateY(-3.5px) rotate(3deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }

        /* Parabolic grounded jump: leaps up from the surface and lands firmly back down */
        @keyframes axolotlGroundedLeap {
          0% { transform: translateY(0) scale(1.05, 0.95); }
          25% { transform: translateY(-16px) scale(0.96, 1.05) rotate(-3deg); }
          50% { transform: translateY(-30px) scale(0.92, 1.08) rotate(0deg); }
          75% { transform: translateY(-8px) scale(1.01, 0.99) rotate(2deg); }
          90% { transform: translateY(1px) scale(1.05, 0.95); }
          100% { transform: translateY(0) scale(1, 1); }
        }

        /* Idle resting breathing on the surface */
        @keyframes axolotlGroundedIdle {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-1.5px) scale(1.01, 0.99); }
        }

        /* Shadow pulses with footsteps: darker on foot contact, lighter on lift */
        @keyframes shadowFootstepPulse {
          0%, 50%, 100% { transform: scale(1); opacity: 0.7; }
          25%, 75% { transform: scale(0.85); opacity: 0.45; }
        }

        /* Shadow scales during airborne jump */
        @keyframes shadowLeapPulse {
          0% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(0.48); opacity: 0.22; }
          90% { transform: scale(1.08); opacity: 0.8; }
          100% { transform: scale(1); opacity: 0.7; }
        }

        /* Ambient jump particles */
        @keyframes particleBurstFloat {
          0% { opacity: 0; transform: translate(0, 0) scale(0.5); }
          25% { opacity: 1; transform: translate(var(--px), -14px) scale(1); }
          100% { opacity: 0; transform: translate(calc(var(--px) * 1.4), -32px) scale(0.5); }
        }

        .axolotl-walking-motion {
          animation: axolotlWalkingGait 0.44s ease-in-out infinite;
        }
        .axolotl-jumping-motion {
          animation: axolotlGroundedLeap 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        .axolotl-idle-motion {
          animation: axolotlGroundedIdle 2.8s ease-in-out infinite;
        }

        .shadow-walking-pulse {
          animation: shadowFootstepPulse 0.44s ease-in-out infinite;
        }
        .shadow-jumping-pulse {
          animation: shadowLeapPulse 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        .axolotl-float-particle {
          animation: particleBurstFloat 0.9s ease-out forwards;
        }
      `}</style>

      {/* 
        Subtle visible surface baseline along the bottom of the pink rectangle.
        Provides a clear, elegant physical floor for the Axolotl to walk on.
      */}
      <div className="absolute inset-x-0 bottom-1 sm:bottom-2 h-[2px] bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />

      {/* 
        Grounded Axolotl positioned directly along the bottom surface.
        `bottom-1 sm:bottom-2` places her feet firmly on the bottom baseline of the pink rectangle.
      */}
      <div
        className="absolute bottom-1 sm:bottom-2 will-change-transform pointer-events-none select-none"
        style={{
          left: `${posX}%`,
          transitionProperty: 'left',
          transitionDuration: action === 'walking' || action === 'jumping' ? `${walkDuration}s` : '0.4s',
          transitionTimingFunction: 'linear',
          transform: 'translateX(-50%)',
        }}
      >
        {/* 
          Facing Direction Wrapper:
          - Walking RIGHT (-->): scaleX(-1) so head points right and tail trails behind
          - Walking LEFT  (<--): scaleX(1)  so head points left and tail trails behind
        */}
        <div
          style={{
            transform: facing === 'right' ? 'scaleX(-1)' : 'scaleX(1)',
            transformOrigin: 'center bottom',
          }}
        >
          {/* Action Motion Container (Walking Gait / Leap / Idle) */}
          <div
            className={`relative ${
              action === 'walking'
                ? 'axolotl-walking-motion'
                : action === 'jumping'
                ? 'axolotl-jumping-motion'
                : 'axolotl-idle-motion'
            }`}
          >
            {/* Ground Contact Shadow (firmly anchored on the floor beneath her feet) */}
            <div
              className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-9 sm:w-11 md:w-12 h-1.5 rounded-full bg-pink-950/35 blur-[1.5px] ${
                action === 'walking'
                  ? 'shadow-walking-pulse'
                  : action === 'jumping'
                  ? 'shadow-jumping-pulse'
                  : ''
              }`}
            />

            {/* Genuine Axolotl Mascot SVG Asset (100% original design, strokes, and proportions) */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 drop-shadow-[0_3px_6px_rgba(208,67,111,0.32)]">
              <AxolotlSvg
                mood={mood}
                isWagging={isWagging}
                lookOffset={lookOffset}
                className="w-full h-full block"
              />
            </div>

            {/* Ambient Jump Particles */}
            {particles.map((p) => (
              <div
                key={p.id}
                className="absolute -top-1 left-1/2 axolotl-float-particle pointer-events-none z-20"
                style={
                  {
                    '--px': `${p.x}px`,
                  } as React.CSSProperties
                }
              >
                {p.icon === 'heart' ? (
                  <Heart className="w-3 h-3 fill-pink-300 text-pink-300 drop-shadow-[0_0_4px_rgba(255,255,255,0.7)]" />
                ) : (
                  <Sparkles className="w-3 h-3 text-amber-200 drop-shadow-[0_0_4px_rgba(255,255,255,0.7)]" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
