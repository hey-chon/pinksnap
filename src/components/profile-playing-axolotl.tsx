import React, { useState, useEffect, useRef } from 'react';
import { AxolotlSideSvg } from '@/components/axolotl/axolotl-side-svg';
import { Sparkles, Heart } from 'lucide-react';

type JourneyState =
  | 'APPROACH_WALL'       // Walks from left pink floor toward container wall
  | 'ATTEMPT_JUMP'        // Tries to jump over the container, falls short!
  | 'DISCOVER_STAIRS'     // Spots the stairs attached to the wall, happy!
  | 'CLIMB_STAIRS'        // Climbs up the left stairs attached to container
  | 'CROSS_CONTAINER'     // Walks happily across top of profile container
  | 'DESCEND_STAIRS'      // Climbs down the right stairs attached to container
  | 'STROLL_RIGHT_FLOOR'  // Strolls on right pink floor
  | 'CELEBRATE_RIGHT'     // Celebrates on right floor
  | 'RETURN_APPROACH'     // Walks back to right stairs facing left (<--)
  | 'RETURN_CLIMB'        // Climbs up right stairs facing left
  | 'RETURN_CROSS'        // Walks across container from right to left
  | 'RETURN_DESCEND'      // Climbs down left stairs
  | 'RETURN_CELEBRATE';   // Back to left floor, loops!

export function ProfilePlayingAxolotl() {
  const [state, setState] = useState<JourneyState>('APPROACH_WALL');
  const [posX, setPosX] = useState(-140); // px relative to left edge of container (0 = container left wall)
  const [isPercentX, setIsPercentX] = useState(false);
  const [percentX, setPercentX] = useState(0); // for container crossing (0% to 100%)
  const [elevY, setElevY] = useState(0); // 0 = pink banner floor, 60 = top of container
  const [jumpOffset, setJumpOffset] = useState(0);
  const [facing, setFacing] = useState<'left' | 'right'>('right');
  const [action, setAction] = useState<'idle' | 'walking' | 'climbing' | 'surprised'>('walking');
  const [mood, setMood] = useState<'happy' | 'wink' | 'surprised' | 'love'>('happy');
  const [duration, setDuration] = useState(3.5);

  const [showQuestion, setShowQuestion] = useState(false);
  const [showSweat, setShowSweat] = useState(false);
  const [showHearts, setShowHearts] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    const run = () => {
      switch (state) {
        // ── 1. Approach the container wall from the left pink floor ──
        case 'APPROACH_WALL': {
          setFacing('right');
          setAction('walking');
          setMood('happy');
          setElevY(0);
          setJumpOffset(0);
          setIsPercentX(false);
          setShowQuestion(false);
          setShowSweat(false);
          setShowHearts(false);
          setDuration(3.6);
          setPosX(-40); // arrives right at the base of the left stairs/wall

          timerRef.current = setTimeout(() => {
            setState('ATTEMPT_JUMP');
          }, 3700);
          break;
        }

        // ── 2. Tries to jump over the container wall, but it's too high! ──
        case 'ATTEMPT_JUMP': {
          setAction('idle');
          setMood('surprised');

          // Crouch anticipation
          setJumpOffset(-4);
          setTimeout(() => {
            // Leap up!
            setJumpOffset(38);
            setTimeout(() => {
              // Bonk/fall back down!
              setJumpOffset(0);
              setShowSweat(true);
              setShowQuestion(true);

              timerRef.current = setTimeout(() => {
                setShowSweat(false);
                setShowQuestion(false);
                setState('DISCOVER_STAIRS');
              }, 1200);
            }, 360);
          }, 200);
          break;
        }

        // ── 3. Discovers the stairs attached directly to the container wall! ──
        case 'DISCOVER_STAIRS': {
          setShowHearts(true);
          setMood('love');

          timerRef.current = setTimeout(() => {
            setShowHearts(false);
            setState('CLIMB_STAIRS');
          }, 900);
          break;
        }

        // ── 4. Climbs up the left stairs attached directly to the container ──
        case 'CLIMB_STAIRS': {
          setFacing('right');
          setAction('climbing');
          setMood('happy');

          // Step 1
          setPosX(-36);
          setElevY(15);

          // Step 2
          setTimeout(() => {
            setPosX(-24);
            setElevY(30);
          }, 380);

          // Step 3
          setTimeout(() => {
            setPosX(-12);
            setElevY(45);
          }, 760);

          // Top landing onto container top rim (0px = container left wall!)
          setTimeout(() => {
            setPosX(6);
            setElevY(60);
            setAction('idle');

            timerRef.current = setTimeout(() => {
              setState('CROSS_CONTAINER');
            }, 350);
          }, 1140);
          break;
        }

        // ── 5. Walks happily across the top of the profile container ──
        case 'CROSS_CONTAINER': {
          setFacing('right');
          setAction('walking');
          setMood('happy');
          setElevY(60);
          setIsPercentX(true);
          setPercentX(2);
          setDuration(6.2);

          // Walk from 2% to 98% across the container top
          setTimeout(() => {
            setPercentX(98);
          }, 50);

          // Mid-walk little joyful hop
          setTimeout(() => {
            setJumpOffset(15);
            setMood('love');
            setTimeout(() => {
              setJumpOffset(0);
              setMood('happy');
            }, 350);
          }, 2800);

          timerRef.current = setTimeout(() => {
            setState('DESCEND_STAIRS');
          }, 6300);
          break;
        }

        // ── 6. Climbs down the right stairs attached directly to the container ──
        case 'DESCEND_STAIRS': {
          setIsPercentX(false);
          setFacing('right');
          setAction('climbing');
          setMood('happy');

          // Step 3 on right stairs
          setPosX(0); // relative to right wall container offset handled below
          setElevY(45);

          // Step 2
          setTimeout(() => {
            setElevY(30);
          }, 380);

          // Step 1
          setTimeout(() => {
            setElevY(15);
          }, 760);

          // Onto the right pink floor!
          setTimeout(() => {
            setElevY(0);
            setAction('idle');

            timerRef.current = setTimeout(() => {
              setState('STROLL_RIGHT_FLOOR');
            }, 350);
          }, 1140);
          break;
        }

        // ── 7. Stroll along the right pink floor ──
        case 'STROLL_RIGHT_FLOOR': {
          setFacing('right');
          setAction('walking');
          setMood('happy');
          setElevY(0);
          setDuration(3.2);
          setPosX(150); // walks out onto right floor

          timerRef.current = setTimeout(() => {
            setState('CELEBRATE_RIGHT');
          }, 3300);
          break;
        }

        // ── 8. Celebrate on the right floor ──
        case 'CELEBRATE_RIGHT': {
          setAction('idle');
          setMood('love');
          setShowHearts(true);

          setJumpOffset(16);
          setTimeout(() => {
            setJumpOffset(0);
            setTimeout(() => {
              setJumpOffset(16);
              setTimeout(() => {
                setJumpOffset(0);
              }, 200);
            }, 180);
          }, 200);

          timerRef.current = setTimeout(() => {
            setShowHearts(false);
            setState('RETURN_APPROACH');
          }, 2000);
          break;
        }

        // ── 9. Turn around facing left (<--) and return to right stairs ──
        case 'RETURN_APPROACH': {
          setFacing('left'); // Now faces left (<--)
          setAction('walking');
          setMood('happy');
          setElevY(0);
          setDuration(3.2);
          setPosX(40); // approaches right stairs

          timerRef.current = setTimeout(() => {
            setState('RETURN_CLIMB');
          }, 3300);
          break;
        }

        // ── 10. Climb up right stairs facing left ──
        case 'RETURN_CLIMB': {
          setFacing('left');
          setAction('climbing');
          setMood('happy');

          setElevY(15);
          setTimeout(() => setElevY(30), 380);
          setTimeout(() => setElevY(45), 760);
          setTimeout(() => {
            setElevY(60);
            setAction('idle');

            timerRef.current = setTimeout(() => {
              setState('RETURN_CROSS');
            }, 350);
          }, 1140);
          break;
        }

        // ── 11. Walk across container from right to left ──
        case 'RETURN_CROSS': {
          setFacing('left');
          setAction('walking');
          setMood('wink');
          setElevY(60);
          setIsPercentX(true);
          setPercentX(98);
          setDuration(6.2);

          setTimeout(() => {
            setPercentX(2);
          }, 50);

          setTimeout(() => {
            setJumpOffset(15);
            setMood('happy');
            setTimeout(() => setJumpOffset(0), 350);
          }, 2800);

          timerRef.current = setTimeout(() => {
            setState('RETURN_DESCEND');
          }, 6300);
          break;
        }

        // ── 12. Descend left stairs ──
        case 'RETURN_DESCEND': {
          setIsPercentX(false);
          setFacing('left');
          setAction('climbing');
          setMood('happy');

          setPosX(-12);
          setElevY(45);
          setTimeout(() => { setPosX(-24); setElevY(30); }, 380);
          setTimeout(() => { setPosX(-36); setElevY(15); }, 760);
          setTimeout(() => {
            setPosX(-48);
            setElevY(0);
            setAction('idle');

            timerRef.current = setTimeout(() => {
              setState('RETURN_CELEBRATE');
            }, 350);
          }, 1140);
          break;
        }

        // ── 13. Back on left floor, celebrate and loop! ──
        case 'RETURN_CELEBRATE': {
          setFacing('left');
          setAction('walking');
          setMood('love');
          setDuration(3.0);
          setPosX(-140);

          timerRef.current = setTimeout(() => {
            setAction('idle');
            setShowHearts(true);
            setTimeout(() => {
              setShowHearts(false);
              setState('APPROACH_WALL'); // Seamless loop back to start!
            }, 2000);
          }, 3100);
          break;
        }
      }
    };

    run();
  }, [state]);

  // Is she currently on the right side of the container?
  const isOnRightSide =
    state === 'DESCEND_STAIRS' ||
    state === 'STROLL_RIGHT_FLOOR' ||
    state === 'CELEBRATE_RIGHT' ||
    state === 'RETURN_APPROACH' ||
    state === 'RETURN_CLIMB';

  return (
    <div
      className="absolute inset-x-0 -top-14 sm:-top-16 pointer-events-none select-none z-30"
      aria-hidden="true"
    >
      <style>{`
        @keyframes sideWalkingBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes climbingStepBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        .walk-bobbing {
          animation: sideWalkingBob 0.44s ease-in-out infinite;
        }
        .climb-bobbing {
          animation: climbingStepBob 0.4s ease-in-out infinite;
        }
        @keyframes questionPopCue {
          0% { transform: translateY(0) scale(0.4); opacity: 0; }
          30% { transform: translateY(-10px) scale(1.15); opacity: 1; }
          80% { transform: translateY(-14px) scale(1); opacity: 1; }
          100% { transform: translateY(-18px) scale(0.6); opacity: 0; }
        }
        .cue-anim {
          animation: questionPopCue 1.2s ease-out forwards;
        }
        @keyframes heartPopFloat {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          30% { transform: translateY(-12px) scale(1.1); opacity: 1; }
          100% { transform: translateY(-26px) scale(0.6); opacity: 0; }
        }
        .heart-anim {
          animation: heartPopFloat 0.9s ease-out forwards;
        }
      `}</style>

      {/* 
        ── 1. LEFT STAIRS: ATTACHED DIRECTLY TO THE LEFT WALL OF THE CONTAINER (0px GAP!) ──
        Base rests on the pink banner floor; top step rests flush on container's top-left corner.
      */}
      <div
        className="hidden md:flex absolute top-0 -left-12 w-12 h-16 pointer-events-none select-none z-20"
        title="Stairs attached directly to container"
      >
        {/* Step 1 (Bottom floor) */}
        <div className="absolute bottom-0 left-0 w-12 h-4 rounded-l-xs bg-gradient-to-r from-pink-300 via-rose-200 to-pink-300 border-t border-l border-white/70 shadow-xs" />
        {/* Step 2 */}
        <div className="absolute bottom-4 left-3 w-9 h-4 rounded-l-xs bg-gradient-to-r from-pink-300 via-rose-200 to-pink-300 border-t border-l border-white/70 shadow-xs" />
        {/* Step 3 */}
        <div className="absolute bottom-8 left-6 w-6 h-4 rounded-l-xs bg-gradient-to-r from-pink-300 via-rose-200 to-pink-300 border-t border-l border-white/70 shadow-xs" />
        {/* Step 4 / Top landing (Flush against container left edge!) */}
        <div className="absolute bottom-12 left-9 w-3 h-4 bg-gradient-to-r from-pink-300 via-rose-200 to-pink-300 border-t border-white/70 shadow-xs" />
        <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-1.5 right-0 drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
      </div>

      {/* 
        ── 2. RIGHT STAIRS: ATTACHED DIRECTLY TO THE RIGHT WALL OF THE CONTAINER (0px GAP!) ──
        Base rests on the pink banner floor; top step rests flush on container's top-right corner.
      */}
      <div
        className="hidden md:flex absolute top-0 -right-12 w-12 h-16 pointer-events-none select-none z-20 scale-x-[-1]"
        title="Stairs attached directly to container"
      >
        {/* Step 1 (Bottom floor) */}
        <div className="absolute bottom-0 left-0 w-12 h-4 rounded-l-xs bg-gradient-to-r from-pink-300 via-rose-200 to-pink-300 border-t border-l border-white/70 shadow-xs" />
        {/* Step 2 */}
        <div className="absolute bottom-4 left-3 w-9 h-4 rounded-l-xs bg-gradient-to-r from-pink-300 via-rose-200 to-pink-300 border-t border-l border-white/70 shadow-xs" />
        {/* Step 3 */}
        <div className="absolute bottom-8 left-6 w-6 h-4 rounded-l-xs bg-gradient-to-r from-pink-300 via-rose-200 to-pink-300 border-t border-l border-white/70 shadow-xs" />
        {/* Step 4 / Top landing (Flush against container right edge!) */}
        <div className="absolute bottom-12 left-9 w-3 h-4 bg-gradient-to-r from-pink-300 via-rose-200 to-pink-300 border-t border-white/70 shadow-xs" />
        <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-1.5 right-0 drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
      </div>

      {/* 
        ── 3. THE PLAYING AXOLOTL (True Side View Profile) ──
        Walks along the floor, climbs stairs, and crosses the container.
      */}
      <div
        className="absolute will-change-transform pointer-events-none select-none z-40 transition-all ease-linear"
        style={{
          left: isPercentX
            ? `${percentX}%`
            : isOnRightSide
            ? `calc(100% + ${posX}px)`
            : `${posX}px`,
          top: `${-elevY + 48}px`, // 48px is level with pink floor, -12px is level with container top
          transitionProperty: action === 'walking' ? 'left, top' : 'left, top',
          transitionDuration: action === 'walking' ? `${duration}s` : '0.35s',
          transform: 'translateX(-50%)',
        }}
      >
        {/* Jump vertical arc */}
        <div
          className="transition-transform duration-200 ease-out"
          style={{
            transform: `translateY(-${jumpOffset}px)`,
          }}
        >
          {/* Motion container */}
          <div
            className={`relative ${
              action === 'walking' ? 'walk-bobbing' : action === 'climbing' ? 'climb-bobbing' : ''
            }`}
          >
            {/* Ground Contact Shadow */}
            <div
              className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 sm:w-12 h-1.5 rounded-full bg-pink-950/35 blur-[1.5px] ${
                jumpOffset > 10 ? 'scale-50 opacity-20' : 'scale-100 opacity-65'
              }`}
            />

            {/* Genuine Side-View SVG Asset */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 drop-shadow-[0_4px_8px_rgba(208,67,111,0.32)]">
              <AxolotlSideSvg
                action={action}
                mood={mood}
                facing={facing}
                className="w-full h-full block"
              />
            </div>

            {/* Question Mark Cue on failed jump */}
            {showQuestion && (
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 cue-anim pointer-events-none z-50 text-sky-500 font-hero text-2xl drop-shadow-[0_2px_4px_rgba(255,255,255,0.9)]">
                ?
              </div>
            )}

            {/* Sweat Drop on failed jump */}
            {showSweat && (
              <div className="absolute -top-3 right-0 pointer-events-none z-50 text-blue-400 font-black text-sm">
                💦
              </div>
            )}

            {/* Hearts on Discovery & Celebration */}
            {showHearts && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 heart-anim pointer-events-none z-50 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 fill-pink-400 text-pink-400 drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
                <Sparkles className="w-3 h-3 text-amber-300 drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
