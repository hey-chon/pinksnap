import { Link, useLocation } from 'wouter';
import { TopNav, BottomNav } from '@/components/layout';
import { ArrowRight, Sparkles, Image as ImageIcon, Aperture } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function HowItWorks() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  const handleStartSnapping = () => {
    sessionStorage.setItem('ps_intent_start', 'true');
    if (isAuthenticated) {
      navigate('/loading');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="flex flex-col h-[100dvh]">
      <TopNav backTo="/" title="DIAGRAM" />
      <main className="flex-1 overflow-hidden p-3 sm:p-4 flex flex-col items-center">
        <div className="max-w-3xl w-full flex flex-col flex-1 min-h-0 pt-4 sm:pt-6 pb-2 sm:pb-4">
          <div className="text-center mb-4 sm:mb-6 shrink-0">
            <span className="booth-heading-kicker mb-1">Visual Guide</span>
            <h1 className="font-hero text-3xl sm:text-4xl mt-2 uppercase">
              How It <span className="text-primary">Works</span>
            </h1>
          </div>
          
          {/* CUTEEEE PINK CONTAINER */}
          <div className="relative ticket flex-1 min-h-0 p-3 sm:p-5 bg-gradient-to-br from-pink-100 via-pink-50 to-white flex flex-col items-center border-4 border-white shadow-[0_10px_40px_-10px_rgba(245,61,137,0.3)] overflow-hidden">
            
            {/* Cute floating decorative icons (no emojis) */}
            <div className="absolute top-2 left-2 text-primary/30 animate-pulse hidden sm:block">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="absolute bottom-2 right-2 text-primary/30 animate-bounce hidden sm:block">
              <ImageIcon className="w-5 h-5" />
            </div>

            <div className="w-full flex-1 min-h-0 relative rounded-2xl overflow-hidden shadow-lg border-2 border-white/60 bg-white p-1.5 sm:p-2 transform hover:scale-[1.01] transition-transform duration-500 flex justify-center items-center">
              <img 
                src="/tutorial-diagram.jpg" 
                alt="Tutorial Diagram" 
                className="w-full h-full object-contain rounded-xl max-h-full"
              />
            </div>
            
            <div className="mt-2 sm:mt-3 text-center max-w-lg z-10 flex flex-col items-center shrink-0">
              <p className="text-foreground/75 font-bold mb-2 text-[11px] sm:text-sm leading-snug">
                Follow this simple visual diagram to understand how PinkSnap brings the magic of the photobooth right to your device.
              </p>
              <button
                type="button"
                onClick={handleStartSnapping}
                className="group relative flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-primary text-white rounded-full shadow-[0_8px_20px_rgba(245,61,137,0.4)] hover:shadow-[0_12px_25px_rgba(245,61,137,0.5)] hover:scale-105 active:scale-95 transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/50"
                aria-label="Start Snapping"
              >
                <div className="absolute inset-1 border-2 border-white/30 rounded-full" />
                <Aperture className="w-5 h-5 sm:w-8 sm:h-8 group-hover:rotate-90 transition-transform duration-500" />
              </button>
            </div>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
