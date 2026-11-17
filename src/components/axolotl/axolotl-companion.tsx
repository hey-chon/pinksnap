import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { AxolotlMascot } from './axolotl-mascot';
import { MascotMood } from './axolotl-svg';
import { Volume2, VolumeX, Sparkles, X, ChevronDown, Camera } from 'lucide-react';

const PAGE_MESSAGES: Record<string, { mood: MascotMood; message: string }> = {
  '/': { mood: 'idle', message: 'Hi! Ready to snap some cute photos?' },
  '/setup': { mood: 'happy', message: 'Pick your favorite layout! Classic is super retro~' },
  '/studio': { mood: 'wink', message: 'Say cheese! Strike your cutest poses! 📸' },
  '/edit': { mood: 'love', message: 'Looking fabulous! Customize with frames & film looks!' },
  '/printing': { mood: 'surprised', message: 'Printing magic! Your strips are dispensing! ✨' },
  '/receipt': { mood: 'happy', message: 'Aww, your keepsake strip came out so aesthetic!' },
  '/gallery': { mood: 'love', message: 'Look at all your beautiful memories! ♥' },
  '/profile': { mood: 'happy', message: 'Your profile wall looks amazing today!' },
  '/chat': { mood: 'wink', message: 'Say hi and share the photobooth love!' },
};

export function AxolotlCompanion() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('ps_mascot_minimized') === 'true';
    }
    return false;
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [flashScreen, setFlashScreen] = useState(false);

  // Pick page message
  const pageConfig = PAGE_MESSAGES[location] || { mood: 'idle', message: 'Enjoy your PinkSnap photobooth!' };

  // Sync minimize preference
  const toggleMinimize = (minimized: boolean) => {
    setIsMinimized(minimized);
    try {
      sessionStorage.setItem('ps_mascot_minimized', String(minimized));
    } catch {}
  };

  // Hide on certain fullscreen flows if needed (e.g. active camera flash)
  const isPrintingPage = location === '/printing';

  return (
    <>
      {/* Fullscreen flash for Axolotl Snap action */}
      {flashScreen && (
        <div
          className="fixed inset-0 bg-white z-[9999] pointer-events-none transition-opacity duration-300"
          style={{ animation: 'pk-flash 0.4s ease-out forwards' }}
        />
      )}

      {/* Floating Mascot Widget */}
      <div
        className={`fixed z-40 transition-all duration-300 select-none ${
          isPrintingPage ? 'opacity-30 hover:opacity-100' : 'opacity-100'
        } bottom-4 right-4 sm:bottom-6 sm:right-6`}
      >
        {isMinimized ? (
          /* Minimized Peeking Pill */
          <button
            type="button"
            onClick={() => toggleMinimize(false)}
            data-testid="button-mascot-restore"
            aria-label="Open Axolotl Mascot"
            className="group relative flex items-center gap-2 pl-2 pr-3.5 py-1.5 rounded-full bg-white/95 dark:bg-zinc-800/95 backdrop-blur-xl border-2 border-pink-300 dark:border-pink-800/60 shadow-[0_8px_25px_rgba(245,61,137,0.3)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center overflow-hidden border border-pink-300">
              <div className="w-7 h-7 transform -translate-y-0.5">
                <AxolotlMascot
                  mood={pageConfig.mood}
                  showSpeech={false}
                  interactive={false}
                  trackPointer={false}
                  size={28}
                />
              </div>
            </div>
            <span className="text-[11px] font-black text-primary tracking-wide flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-pink-400" /> Axolotl
            </span>
          </button>
        ) : (
          /* Floating Companion Card */
          <div className="relative flex flex-col items-end">
            {/* Action Bar (Sound, Snap, Minimize) */}
            <div className="flex items-center gap-1 mb-1.5 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md px-2 py-1 rounded-full border border-pink-200/80 dark:border-pink-900/50 shadow-sm">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                aria-label={soundEnabled ? 'Mute mascot' : 'Unmute mascot'}
                className="p-1 rounded-full text-foreground/60 hover:text-primary hover:bg-pink-50 dark:hover:bg-zinc-700 transition-colors"
                title={soundEnabled ? 'Mute sound' : 'Enable sound'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setFlashScreen(true);
                  setTimeout(() => setFlashScreen(false), 450);
                }}
                aria-label="Snap photo pose"
                className="p-1 rounded-full text-foreground/60 hover:text-primary hover:bg-pink-50 dark:hover:bg-zinc-700 transition-colors"
                title="Axolotl photo pose!"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => toggleMinimize(true)}
                aria-label="Minimize mascot"
                className="p-1 rounded-full text-foreground/60 hover:text-primary hover:bg-pink-50 dark:hover:bg-zinc-700 transition-colors"
                title="Minimize mascot"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mascot Container */}
            <div className="relative p-2 rounded-3xl bg-white/40 dark:bg-zinc-900/40 backdrop-blur-sm border border-white/40 dark:border-white/10 shadow-[0_12px_35px_rgba(245,61,137,0.18)]">
              <AxolotlMascot
                defaultMood={pageConfig.mood}
                speech={pageConfig.message}
                showSpeech={true}
                interactive={true}
                soundEnabled={soundEnabled}
                trackPointer={true}
                autoSleep={true}
                size="sm"
                onSnap={() => {
                  setFlashScreen(true);
                  setTimeout(() => setFlashScreen(false), 450);
                }}
              />
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pk-flash {
          0% { opacity: 0.85; }
          100% { opacity: 0; }
        }
      `}</style>
    </>
  );
}
