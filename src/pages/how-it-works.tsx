import { Link, useLocation } from 'wouter';
import { TopNav, BottomNav } from '@/components/layout';
import { ArrowRight, Sparkles, Image as ImageIcon, Aperture } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function HowItWorks() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  const handleStartSnapping = () => {
    if (isAuthenticated) {
      navigate('/loading');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="flex flex-col h-[100dvh]">
      <TopNav backTo="/" title="DIAGRAM" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center">
        <div className="max-w-4xl w-full py-2 sm:py-4">
          <div className="text-center mb-6">
            <span className="booth-heading-kicker mb-2">Visual Guide</span>
            <h1 className="font-display text-[2.6rem] leading-[.95] sm:text-5xl mt-2 uppercase">
              How It <span className="text-primary">Works</span>
            </h1>
          </div>
          
          {/* CUTEEEE PINK CONTAINER */}
          <div className="relative ticket p-4 sm:p-6 bg-gradient-to-br from-pink-100 via-pink-50 to-white flex flex-col items-center justify-center border-4 border-white shadow-[0_10px_40px_-10px_rgba(245,61,137,0.3)]">
            
            {/* Cute floating decorative icons (no emojis) */}
            <div className="absolute top-4 left-4 text-primary/30 animate-pulse">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="absolute bottom-4 right-4 text-primary/30 animate-bounce">
              <ImageIcon className="w-6 h-6" />
            </div>

            <div className="w-full relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/60 bg-white p-2 sm:p-3 transform hover:scale-[1.01] transition-transform duration-500">
              <img 
                src="/tutorial-diagram.jpg" 
                alt="Tutorial Diagram" 
                className="w-full h-auto rounded-2xl"
              />
            </div>
            
            <div className="mt-8 text-center max-w-lg z-10 flex flex-col items-center">
              <p className="text-foreground/75 font-bold mb-5 text-sm sm:text-base leading-relaxed">
                Follow this simple visual diagram to understand how PinkSnap brings the magic of the photobooth right to your device.
              </p>
              <button
                type="button"
                onClick={handleStartSnapping}
                className="group relative flex items-center justify-center w-20 h-20 bg-primary text-white rounded-full shadow-[0_8px_20px_rgba(245,61,137,0.4)] hover:shadow-[0_12px_25px_rgba(245,61,137,0.5)] hover:scale-105 active:scale-95 transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/50"
                aria-label="Start Snapping"
              >
                <div className="absolute inset-2 border-2 border-white/30 rounded-full" />
                <Aperture className="w-10 h-10 group-hover:rotate-90 transition-transform duration-500" />
              </button>
            </div>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
