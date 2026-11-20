import React, { useState, useEffect, useRef } from 'react';
import { AxolotlSvg, MascotMood } from '@/components/axolotl/axolotl-svg';
import { Sparkles, Heart } from 'lucide-react';

type StoryState =
  | 'WALK_LEFT_GROUND'      // Walking along left pink banner surface toward the card
  | 'INSPECT_WALL'          // Stopped at card wall, looking up
  | 'ATTEMPT_JUMP_FAIL'     // Tries to jump onto the card, falls short!
  | 'DISCOVER_STAIRS'       // Spots the staircase, gets happy
  | 'CLIMB_STAIRS'          // Hopping up the stairs step-by-step
  | 'WALK_ACROSS_CARD'      // Walking across the top of the profile card
  | 'DESCEND_STAIRS'        // Hopping down the right stairs
  | 'WALK_RIGHT_GROUND'     // Walking along right pink banner surface
  | 'CELEBRATE_RIGHT'       // Happy celebration hops on the right
  | 'RETURN_WALK_RIGHT'     // Walking back to the right stairs facing left
  | 'RETURN_CLIMB_STAIRS'   // Climbing up the right stairs facing left
  | 'RETURN_WALK_CARD'      // Walking across the card from right to left
  | 'RETURN_DESCEND_STAIRS' // Descending the left stairs
  | 'RETURN_CELEBRATE_LEFT';// Back to starting point, celebration hops

export function ProfilePlayingAxolotl() {
  const [storyState, setStoryState] = useState<StoryState>('WALK_LEFT_GROUND');
  const [posX, setPosX] = useState(6);
  const [bottomY, setBottomY] = useState(0); // 0 = pink banner floor, 64px = top of card
  const [facing, setFacing] = useState<'left' | 'right'>('right');
  const [isWalking, setIsWalking] = useState(true);
  const [mood, setMood] = useState<MascotMood>('happy');
  const [isWagging, setIsWagging] = useState(true);
  const [lookOffset, setLookOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [jumpOffset, setJumpOffset] = useState(0);
  const [showSweatDrop, setShowSweatDrop] = useState(false);
  const [showHearts, setShowHearts] = useState(false);
  const [walkDuration, setWalkDuration] = useState(4.5);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Story state machine loop
  useEffect(() => {
    const runState = () => {
      switch (storyState) {
        // ── 1. Walk from far left on the pink banner floor toward the card wall ──
        case 'WALK_LEFT_GROUND': {
          setFacing('right');
          setIsWalking(true);
          setMood('happy');
          setBottomY(0);
          setJumpOffset(0);
          setShowSweatDrop(false);
          setShowHearts(false);
          setLookOffset({ x: 8, y: 0 });
          setWalkDuration(4.2);
          setPosX(20); // approaches the left wall of the card

          timerRef.current = setTimeout(() => {
            setStoryState('INSPECT_WALL');
          }, 4300);
          break;
        }

        // ── 2. Stop and inspect the tall card wall ──
        case 'INSPECT_WALL': {
          setIsWalking(false);
          setMood('surprised');
          setLookOffset({ x: 14, y: -18 }); // looks way up at the tall container
          setIsWagging(false);

          timerRef.current = setTimeout(() => {
            setStoryState('ATTEMPT_JUMP_FAIL');
          }, 1400);
          break;
        }

        // ── 3. Try to jump onto the container, but it's too high! ──
        case 'ATTEMPT_JUMP_FAIL': {
          // Wind up crouch
          setJumpOffset(-4);
          setMood('surprised');

          setTimeout(() => {
            // LEAP UP!
            setJumpOffset(44); // leaps up 44px
            setTimeout(() => {
              // Bonk / drop back down to floor!
              setJumpOffset(0);
              setShowSweatDrop(true);
              setLookOffset({ x: 0, y: 8 });

              timerRef.current = setTimeout(() => {
                setStoryState('DISCOVER_STAIRS');
              }, 1200);
            }, 420);
          }, 250);
          break;
        }

        // ── 4. Notice the staircase! ──
        case 'DISCOVER_STAIRS': {
          setShowSweatDrop(false);
          setShowHearts(true);
          setMood('love');
          setIsWagging(true);
          setLookOffset({ x: 10, y: 0 });

          timerRef.current = setTimeout(() => {
            setShowHearts(false);
            setStoryState('CLIMB_STAIRS');
          }, 1100);
          break;
        }

        // ── 5. Hop up the staircase step-by-step ──
        case 'CLIMB_STAIRS': {
          setFacing('right');
          setIsWalking(false);
          setMood('happy');

          // Step 1
          setPosX(22.5);
          setBottomY(16);
          setJumpOffset(8);
          setTimeout(() => setJumpOffset(0), 180);

          // Step 2
          setTimeout(() => {
            setPosX(24);
            setBottomY(32);
            setJumpOffset(8);
            setTimeout(() => setJumpOffset(0), 180);
          }, 400);

          // Step 3
          setTimeout(() => {
            setPosX(25.5);
            setBottomY(48);
            setJumpOffset(8);
            setTimeout(() => setJumpOffset(0), 180);
          }, 800);

          // Step 4: Onto the top landing of the card!
          setTimeout(() => {
            setPosX(27);
            setBottomY(62);
            setJumpOffset(8);
            setTimeout(() => setJumpOffset(0), 180);

            timerRef.current = setTimeout(() => {
              setStoryState('WALK_ACROSS_CARD');
            }, 350);
          }, 1200);
          break;
        }

        // ── 6. Walk across the top of the profile card ──
        case 'WALK_ACROSS_CARD': {
          setFacing('right');
          setIsWalking(true);
          setMood('happy');
          setBottomY(62);
          setLookOffset({ x: 0, y: 0 });
          setWalkDuration(5.5);
          setPosX(73); // walks to the right edge of the card

          // Mid-walk little joyful hop
          setTimeout(() => {
            setJumpOffset(16);
            setMood('love');
            setTimeout(() => {
              setJumpOffset(0);
              setMood('happy');
            }, 380);
          }, 2400);

          timerRef.current = setTimeout(() => {
            setStoryState('DESCEND_STAIRS');
          }, 5600);
          break;
        }

        // ── 7. Hop down the right staircase ──
        case 'DESCEND_STAIRS': {
          setFacing('right');
          setIsWalking(false);
          setMood('happy');

          // Step 3
          setPosX(74.5);
          setBottomY(48);
          setJumpOffset(4);
          setTimeout(() => setJumpOffset(0), 180);

          // Step 2
          setTimeout(() => {
            setPosX(76);
            setBottomY(32);
            setJumpOffset(4);
            setTimeout(() => setJumpOffset(0), 180);
          }, 400);

          // Step 1
          setTimeout(() => {
            setPosX(77.5);
            setBottomY(16);
            setJumpOffset(4);
            setTimeout(() => setJumpOffset(0), 180);
          }, 800);

          // Lands on the right pink banner floor!
          setTimeout(() => {
            setPosX(79);
            setBottomY(0);
            setJumpOffset(4);
            setTimeout(() => setJumpOffset(0), 180);

            timerRef.current = setTimeout(() => {
              setStoryState('WALK_RIGHT_GROUND');
            }, 350);
          }, 1200);
          break;
        }

        // ── 8. Walk along the right pink banner floor ──
        case 'WALK_RIGHT_GROUND': {
          setFacing('right');
          setIsWalking(true);
          setMood('happy');
          setBottomY(0);
          setWalkDuration(3.2);
          setPosX(92); // walks to far right

          timerRef.current = setTimeout(() => {
            setStoryState('CELEBRATE_RIGHT');
          }, 3300);
          break;
        }

        // ── 9. Happy celebration on the right ──
        case 'CELEBRATE_RIGHT': {
          setIsWalking(false);
          setMood('love');
          setShowHearts(true);

          // Double happy hop
          setJumpOffset(18);
          setTimeout(() => {
            setJumpOffset(0);
            setTimeout(() => {
              setJumpOffset(18);
              setTimeout(() => {
                setJumpOffset(0);
              }, 250);
            }, 180);
          }, 250);

          timerRef.current = setTimeout(() => {
            setShowHearts(false);
            setStoryState('RETURN_WALK_RIGHT');
          }, 2000);
          break;
        }

        // ── 10. Turn around and walk back toward the right stairs facing LEFT ──
        case 'RETURN_WALK_RIGHT': {
          setFacing('left'); // Now facing left (<--)
          setIsWalking(true);
          setMood('happy');
          setBottomY(0);
          setWalkDuration(3.2);
          setPosX(79); // approaches right stairs

          timerRef.current = setTimeout(() => {
            setStoryState('RETURN_CLIMB_STAIRS');
          }, 3300);
          break;
        }

        // ── 11. Climb up the right stairs facing left ──
        case 'RETURN_CLIMB_STAIRS': {
          setFacing('left');
          setIsWalking(false);
          setMood('happy');

          setPosX(77.5);
          setBottomY(16);
          setJumpOffset(8);
          setTimeout(() => setJumpOffset(0), 180);

          setTimeout(() => {
            setPosX(76);
            setBottomY(32);
            setJumpOffset(8);
            setTimeout(() => setJumpOffset(0), 180);
          }, 400);

          setTimeout(() => {
            setPosX(74.5);
            setBottomY(48);
            setJumpOffset(8);
            setTimeout(() => setJumpOffset(0), 180);
          }, 800);

          setTimeout(() => {
            setPosX(73);
            setBottomY(62);
            setJumpOffset(8);
            setTimeout(() => setJumpOffset(0), 180);

            timerRef.current = setTimeout(() => {
              setStoryState('RETURN_WALK_CARD');
            }, 350);
          }, 1200);
          break;
        }

        // ── 12. Walk across the card from right to left ──
        case 'RETURN_WALK_CARD': {
          setFacing('left');
          setIsWalking(true);
          setMood('wink');
          setBottomY(62);
          setWalkDuration(5.5);
          setPosX(27); // walks back to left stairs

          // Mid-walk little hop
          setTimeout(() => {
            setJumpOffset(16);
            setMood('happy');
            setTimeout(() => {
              setJumpOffset(0);
            }, 380);
          }, 2400);

          timerRef.current = setTimeout(() => {
            setStoryState('RETURN_DESCEND_STAIRS');
          }, 5600);
          break;
        }

        // ── 13. Descend the left stairs ──
        case 'RETURN_DESCEND_STAIRS': {
          setFacing('left');
          setIsWalking(false);
          setMood('happy');

          setPosX(25.5);
          setBottomY(48);
          setJumpOffset(4);
          setTimeout(() => setJumpOffset(0), 180);

          setTimeout(() => {
            setPosX(24);
            setBottomY(32);
            setJumpOffset(4);
            setTimeout(() => setJumpOffset(0), 180);
          }, 400);

          setTimeout(() => {
            setPosX(22.5);
            setBottomY(16);
            setJumpOffset(4);
            setTimeout(() => setJumpOffset(0), 180);
          }, 800);

          setTimeout(() => {
            setPosX(20);
            setBottomY(0);
            setJumpOffset(4);
            setTimeout(() => setJumpOffset(0), 180);

            timerRef.current = setTimeout(() => {
              setStoryState('RETURN_CELEBRATE_LEFT');
            }, 350);
          }, 1200);
          break;
        }

        // ── 14. Walk to starting point on left and celebrate! ──
        case 'RETURN_CELEBRATE_LEFT': {
          setFacing('left');
          setIsWalking(true);
          setMood('love');
          setBottomY(0);
          setWalkDuration(3.2);
          setPosX(6); // walks to far left starting point

          timerRef.current = setTimeout(() => {
            setIsWalking(false);
            setShowHearts(true);
            setTimeout(() => {
              setShowHearts(false);
              setStoryState('WALK_LEFT_GROUND'); // Loops back to start!
            }, 2200);
          }, 3300);
          break;
        }
      }
    };

    runState();
  }, [storyState]);

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none z-20"
      aria-hidden="true"
    >
      <style>{`
        /* Side-view body walking bob (cadence on the ground) */
        @keyframes axolotlSideWalkBob {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-3px) rotate(-2.5deg); }
          50% { transform: translateY(0) rotate(0deg); }
          75% { transform: translateY(-3px) rotate(2.5deg); }
        }

        /* Step shadow pulse */
        @keyframes stepShadowPulsing {
          0%, 50%, 100% { transform: scale(1); opacity: 0.7; }
          25%, 75% { transform: scale(0.85); opacity: 0.45; }
        }

        .axolotl-walk-bob {
          animation: axolotlSideWalkBob 0.5s ease-in-out infinite;
        }
        .axolotl-shadow-pulse {
          animation: stepShadowPulsing 0.5s ease-in-out infinite;
        }

        /* Cute sweat-drop pop */
        @keyframes sweatPop {
          0% { transform: translateY(0) scale(0.4); opacity: 0; }
          30% { transform: translateY(-8px) scale(1.1); opacity: 1; }
          70% { transform: translateY(-12px) scale(1); opacity: 1; }
          100% { transform: translateY(-18px) scale(0.6); opacity: 0; }
        }
        .sweat-drop-anim {
          animation: sweatPop 0.9s ease-out forwards;
        }

        /* Cute heart floats */
        @keyframes heartFloatUp {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          25% { transform: translateY(-10px) scale(1); opacity: 1; }
          100% { transform: translateY(-26px) scale(0.6); opacity: 0; }
        }
        .heart-float-anim {
          animation: heartFloatUp 0.9s ease-out forwards;
        }
      `}</style>

      {/* 
        ── 1. LEFT STAIRCASE ──
        Anchored on the pink banner's bottom surface, right against the left wall of the profile card.
        4 cute pastel steps bridging the height up to the top of the container!
      */}
      <div
        className="hidden md:flex absolute bottom-0 left-[21.5%] w-16 h-16 pointer-events-none select-none z-10"
        title="Axolotl's Little Stairs"
      >
        {/* Step 1 */}
        <div className="absolute bottom-0 left-0 w-16 h-4 rounded-xs bg-gradient-to-r from-pink-300 via-rose-200 to-pink-300 border-t border-white/70 shadow-xs" />
        {/* Step 2 */}
        <div className="absolute bottom-4 left-4 w-12 h-4 rounded-xs bg-gradient-to-r from-pink-300 via-rose-200 to-pink-300 border-t border-white/70 shadow-xs" />
        {/* Step 3 */}
        <div className="absolute bottom-8 left-8 w-8 h-4 rounded-xs bg-gradient-to-r from-pink-300 via-rose-200 to-pink-300 border-t border-white/70 shadow-xs" />
        {/* Step 4 / Top landing */}
        <div className="absolute bottom-12 left-12 w-4 h-4 rounded-xs bg-gradient-to-r from-pink-300 via-rose-200 to-pink-300 border-t border-white/70 shadow-xs" />
        {/* Little decorative star sticker */}
        <Sparkles className="w-3 h-3 text-amber-200 absolute -top-1 right-0 drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
      </div>

      {/* 
        ── 2. RIGHT STAIRCASE ──
        Anchored on the pink banner's bottom surface, right against the right wall of the profile card.
      */}
      <div
        className="hidden md:flex absolute bottom-0 right-[21.5%] w-16 h-16 pointer-events-none select-none z-10 scale-x-[-1]"
        title="Axolotl's Little Stairs"
      >
        {/* Step 1 */}
        <div className="absolute bottom-0 left-0 w-16 h-4 rounded-xs bg-gradient-to-r from-pink-300 via-rose-200 to-pink-300 border-t border-white/70 shadow-xs" />
        {/* Step 2 */}
        <div className="absolute bottom-4 left-4 w-12 h-4 rounded-xs bg-gradient-to-r from-pink-300 via-rose-200 to-pink-300 border-t border-white/70 shadow-xs" />
        {/* Step 3 */}
        <div className="absolute bottom-8 left-8 w-8 h-4 rounded-xs bg-gradient-to-r from-pink-300 via-rose-200 to-pink-300 border-t border-white/70 shadow-xs" />
        {/* Step 4 / Top landing */}
        <div className="absolute bottom-12 left-12 w-4 h-4 rounded-xs bg-gradient-to-r from-pink-300 via-rose-200 to-pink-300 border-t border-white/70 shadow-xs" />
        <Sparkles className="w-3 h-3 text-amber-200 absolute -top-1 right-0 drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
      </div>

      {/* 
        ── 3. THE PLAYING AXOLOTL (Side-View Walking & Climbing) ──
        Positioned along the bottom line (bottomY: 0 on pink floor, 62 on card).
        Moves with natural horizontal speed.
      */}
      <div
        className="absolute will-change-transform pointer-events-none select-none z-30 transition-all ease-linear"
        style={{
          left: `${posX}%`,
          bottom: `${bottomY}px`,
          transitionProperty: isWalking ? 'left, bottom' : 'bottom',
          transitionDuration: isWalking ? `${walkDuration}s` : '0.2s',
          transform: 'translateX(-50%)',
        }}
      >
        {/* Jump vertical arc offset */}
        <div
          className="transition-transform duration-200 ease-out"
          style={{
            transform: `translateY(-${jumpOffset}px)`,
          }}
        >
          {/* 
            Facing Direction Wrapper:
            - Walking RIGHT (-->): scaleX(-1) so head leads right, tail trails on left
            - Walking LEFT  (<--): scaleX(1)  so head leads left, tail trails on right
          */}
          <div
            style={{
              transform: facing === 'right' ? 'scaleX(-1)' : 'scaleX(1)',
              transformOrigin: 'center bottom',
            }}
          >
            {/* Action Motion Container */}
            <div className={`relative ${isWalking ? 'axolotl-walk-bob' : ''}`}>
              
              {/* Ground Contact Shadow */}
              <div
                className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-9 sm:w-11 md:w-12 h-1.5 rounded-full bg-pink-950/35 blur-[1.5px] ${
                  isWalking ? 'axolotl-shadow-pulse' : ''
                } ${jumpOffset > 10 ? 'scale-50 opacity-20' : 'scale-100 opacity-65'}`}
              />

              {/* Genuine Axolotl Mascot SVG Asset with Active Walk Cycle */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 drop-shadow-[0_4px_8px_rgba(208,67,111,0.32)]">
                <AxolotlSvg
                  mood={mood}
                  isWagging={isWagging}
                  walkCycle={isWalking}
                  lookOffset={lookOffset}
                  className="w-full h-full block"
                />
              </div>

              {/* Cute Failed Jump Sweat-drop */}
              {showSweatDrop && (
                <div className="absolute -top-3 right-0 sweat-drop-anim pointer-events-none z-40 text-blue-400 font-black text-sm">
                  💦
                </div>
              )}

              {/* Cute Hearts Burst on Discovery or Celebration */}
              {showHearts && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 heart-float-anim pointer-events-none z-40 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 fill-pink-400 text-pink-400 drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
                  <Sparkles className="w-3 h-3 text-amber-200 drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
