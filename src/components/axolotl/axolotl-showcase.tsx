import React, { useState } from 'react';
import { AxolotlMascot } from './axolotl-mascot';
import { AxolotlSvg, MascotMood } from './axolotl-svg';
import { Sparkles, Camera, Heart, Hand, Zap, Moon, Smile } from 'lucide-react';

const MOODS: { id: MascotMood; label: string; icon: React.ReactNode }[] = [
  { id: 'idle', label: 'Idle', icon: <Smile className="w-3.5 h-3.5" /> },
  { id: 'wink', label: 'Wink', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: 'happy', label: 'Happy', icon: <Smile className="w-3.5 h-3.5" /> },
  { id: 'love', label: 'Love', icon: <Heart className="w-3.5 h-3.5" /> },
  { id: 'surprised', label: 'Surprised', icon: <Zap className="w-3.5 h-3.5" /> },
  { id: 'sleepy', label: 'Sleepy', icon: <Moon className="w-3.5 h-3.5" /> },
];

export function AxolotlShowcase() {
  const [selectedMood, setSelectedMood] = useState<MascotMood>('idle');
  const [flash, setFlash] = useState(false);
  const [snapping, setSnapping] = useState(false);
  const [speech, setSpeech] = useState<string | undefined>(undefined);

  const handleSnap = () => {
    if (snapping) return;
    setSnapping(true);
    setSpeech('3...');

    setTimeout(() => {
      setSpeech('2...');
    }, 800);

    setTimeout(() => {
      setSelectedMood('wink');
      setSpeech('1... Say cheese!');
    }, 1600);

    setTimeout(() => {
      setSelectedMood('happy');
      setSpeech('Snap! So cute! 📸✨');
      setFlash(true);
      setTimeout(() => setFlash(false), 400);
      setSnapping(false);
    }, 2400);
  };

  return (
    <section className="relative w-full max-w-4xl mx-auto my-12 px-4 select-none">
      {/* Screen flash effect */}
      {flash && (
        <div
          className="fixed inset-0 bg-white z-[9999] pointer-events-none"
          style={{ animation: 'pk-flash 0.35s ease-out forwards' }}
        />
      )}

      {/* Main Showcase Easel Card */}
      <div className="relative overflow-hidden rounded-[36px] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border-2 border-pink-200/90 dark:border-pink-900/40 p-6 sm:p-10 shadow-[0_20px_50px_rgba(245,61,137,0.14)] text-center flex flex-col items-center">
        {/* Overhead badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-100/90 dark:bg-pink-950/60 border border-pink-300 dark:border-pink-800 text-primary text-[11px] font-black uppercase tracking-[0.2em] mb-4">
          <Sparkles className="w-3.5 h-3.5 text-primary" /> Meet Your Photobooth Star
        </div>

        <h2 className="font-hero text-3xl sm:text-5xl text-foreground mb-2 leading-none">
          PINKSNAP <span className="text-primary cinematic-glow-pink">AXOLOTL.</span>
        </h2>
        <p className="text-xs sm:text-sm font-bold text-foreground/60 max-w-lg mb-6 leading-relaxed">
          Poke her belly to tickle her, touch her gills, high-five her hand, rub her head to pet her, or press Snap! She even falls asleep if left alone.
        </p>

        {/* Mascot Interactive Stage */}
        <div className="my-2 flex flex-col items-center">
          <AxolotlMascot
            mood={selectedMood}
            speech={speech}
            showSpeech={true}
            interactive={true}
            soundEnabled={true}
            trackPointer={true}
            size="md"
            onMoodChange={(m) => setSelectedMood(m)}
            onZoneInteract={(_zone, m) => setSelectedMood(m)}
          />
        </div>

        {/* Mood Selector Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mt-6 mb-8 max-w-lg">
          {MOODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setSpeech(undefined);
                setSelectedMood(m.id);
              }}
              data-testid={`button-mascot-mood-${m.id}`}
              aria-pressed={selectedMood === m.id}
              className={`px-3.5 py-2 rounded-full text-xs font-black tracking-wide transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                selectedMood === m.id
                  ? 'bg-primary text-white shadow-md shadow-primary/30 scale-105'
                  : 'bg-foreground/[0.04] text-foreground/70 hover:bg-foreground/[0.08] hover:text-foreground'
              }`}
            >
              {m.icon} {m.label}
            </button>
          ))}

          {/* Snap action button */}
          <button
            type="button"
            onClick={handleSnap}
            disabled={snapping}
            data-testid="button-mascot-snap"
            className="px-4 py-2 rounded-full text-xs font-black tracking-wider uppercase text-white bg-gradient-to-r from-pink-500 to-rose-500 shadow-md shadow-pink-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            <Camera className="w-3.5 h-3.5" /> Snap!
          </button>
        </div>

        {/* Expression Sheet Deck */}
        <div className="w-full pt-6 border-t border-dashed border-pink-200 dark:border-pink-900/40">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground/50 mb-4">
            Expression Sheet
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
            {MOODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setSpeech(undefined);
                  setSelectedMood(m.id);
                }}
                className={`p-2.5 rounded-2xl border transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                  selectedMood === m.id
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-black/5 dark:border-white/5 bg-white/40 dark:bg-zinc-800/40 hover:border-primary/40'
                }`}
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
                  <AxolotlSvg mood={m.id} isStatic={true} className="w-full h-auto" />
                </div>
                <span className="text-[10px] font-black text-foreground/70 uppercase tracking-wider">
                  {m.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
