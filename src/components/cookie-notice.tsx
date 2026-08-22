import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Cookie, ShieldCheck, Settings, Check, X, Sparkles, ChevronRight, Sliders } from 'lucide-react';

export interface CookiePreferences {
  essential: boolean;
  preferences: boolean;
  analytics: boolean;
  timestamp: string;
}

const STORAGE_KEY = 'pinksnap_cookie_consent';
export const COOKIE_SETTINGS_EVENT = 'pinksnap:open-cookie-settings';

export function openCookieSettings() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(COOKIE_SETTINGS_EVENT));
  }
}

export function CookieNotice() {
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    preferences: true,
    analytics: false,
    timestamp: '',
  });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setPreferences(JSON.parse(saved));
      } else {
        // Delay showing banner slightly for smooth page entrance
        timer = setTimeout(() => setIsVisible(true), 800);
      }
    } catch {
      setIsVisible(true);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const handleOpenSettings = () => {
      setIsModalOpen(true);
      setIsVisible(true);
    };

    window.addEventListener(COOKIE_SETTINGS_EVENT, handleOpenSettings);
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, handleOpenSettings);
  }, []);

  const saveConsent = (prefs: Omit<CookiePreferences, 'timestamp'>) => {
    const data: CookiePreferences = {
      ...prefs,
      essential: true, // Essential is always true
      timestamp: new Date().toISOString(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore storage errors
    }
    setPreferences(data);
    setIsVisible(false);
    setIsModalOpen(false);
  };

  const handleAcceptAll = () => {
    saveConsent({
      essential: true,
      preferences: true,
      analytics: true,
    });
  };

  const handleAcceptEssential = () => {
    saveConsent({
      essential: true,
      preferences: false,
      analytics: false,
    });
  };

  const handleSaveCustom = () => {
    saveConsent({
      essential: true,
      preferences: preferences.preferences,
      analytics: preferences.analytics,
    });
  };

  if (!isVisible && !isModalOpen) return null;

  return (
    <>
      {/* Mini Banner at bottom */}
      {isVisible && !isModalOpen && (
        <aside
          role="region"
          aria-label="Cookie consent banner"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          <div className="bg-[#201b2c]/95 border-2 border-primary/40 text-white rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-pink-300 shrink-0 mt-0.5">
                <Cookie className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1">
                  <h3 className="font-display text-lg tracking-wide text-white">COOKIE & PRIVACY NOTICE</h3>
                </div>
                <p className="text-xs text-white/75 leading-relaxed">
                  We use cookies and local storage to save your photo booth sessions, remember your booth styling, and keep community chat running smoothly. No secret tracking.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
              <div className="flex items-center gap-3 text-[11px] text-white/60 font-medium">
                <Link href="/privacy" className="hover:text-pink-300 underline underline-offset-2 transition-colors">
                  Privacy Policy
                </Link>
                <span>•</span>
                <Link href="/terms" className="hover:text-pink-300 underline underline-offset-2 transition-colors">
                  Terms
                </Link>
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end mt-2 sm:mt-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1 cursor-pointer"
                  aria-label="Customize cookie settings"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Customize</span>
                </button>
                <button
                  type="button"
                  onClick={handleAcceptEssential}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  Essential Only
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-black bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Preferences Modal Dialog */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-modal-title"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="bg-[#201b2c] border-2 border-primary/40 text-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-pink-300">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h2 id="cookie-modal-title" className="font-display text-xl sm:text-2xl tracking-wide text-white">
                    COOKIE PREFERENCES
                  </h2>
                  <p className="text-xs text-white/60">Customize how PinkSnap uses storage on your device.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1 flex-1 py-1">
              {/* Category 1: Essential */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-bold text-white">Strictly Essential</span>
                  </div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Always On
                  </span>
                </div>
                <p className="text-xs text-white/70 leading-relaxed">
                  Required for the app to function properly. Includes local temporary photo capture memory, camera stream state, and authentication tokens via Supabase.
                </p>
              </div>

              {/* Category 2: Preferences */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-pink-300" />
                    <span className="text-sm font-bold text-white">Preferences & Booth State</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.preferences}
                      onChange={(e) => setPreferences({ ...preferences, preferences: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <p className="text-xs text-white/70 leading-relaxed">
                  Remembers your selected photobooth templates, frame colors, shutter audio toggles, and photo gallery drafts on your device.
                </p>
              </div>

              {/* Category 3: Analytics */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-blue-300" />
                    <span className="text-sm font-bold text-white">Anonymous Diagnostics</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <p className="text-xs text-white/70 leading-relaxed">
                  Helps us improve PinkSnap performance and camera compatibility through non-identifying crash and feature usage analytics.
                </p>
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <Link
                href="/privacy"
                onClick={() => setIsModalOpen(false)}
                className="text-xs text-white/60 hover:text-pink-300 underline underline-offset-2 transition-colors"
              >
                Read full Privacy Policy
              </Link>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleAcceptEssential}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  Reject Optional
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustom}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-black bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
