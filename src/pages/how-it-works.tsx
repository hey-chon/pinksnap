import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { TopNav, BottomNav } from '@/components/layout';
import { Camera, LayoutGrid, Wand2, Download, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { AuthGateModal } from '@/components/auth/auth-gate-modal';

export default function HowItWorks() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [showAuthGate, setShowAuthGate] = useState(false);

  const handleStartSnapping = () => {
    if (isAuthenticated) {
      navigate('/setup');
    } else {
      setShowAuthGate(true);
    }
  };

  const steps = [
    {
      icon: <Camera className="w-8 h-8 text-primary" />,
      title: "1. ALLOW CAMERA",
      desc: "PinkSnap needs camera access to work! Don't worry, nothing is saved to any server, pink-snap only used client sdk 'supabase' for auth and community chat I pinky promise. Maintained by me (Jimson) and Vien"
    },
    {
      icon: <LayoutGrid className="w-8 h-8 text-primary" />,
      title: "2. CHOOSE STYLE",
      desc: "Pick your preferred layout (classic strip, quad grid, etc.) and decide what photobooth strip design you want."
    },
    {
      icon: <Wand2 className="w-8 h-8 text-primary" />,
      title: "3. STRIKE A POSE",
      desc: "Watch the countdown and get ready! You'll take 3 to 4 snaps depending on your chosen layout."
    },
    {
      icon: <Download className="w-8 h-8 text-primary" />,
      title: "4. EDIT & SAVE",
      desc: "Apply filters, adjust frame opacity, and download or share your photo strip  instantly! (NOTE: sharing is under development)"
    }
  ];

  return (
    <div className="flex flex-col h-[100dvh]">
      {showAuthGate && (
        <AuthGateModal
          onClose={() => setShowAuthGate(false)}
          onSuccess={() => { setShowAuthGate(false); navigate('/setup'); }}
        />
      )}
      <TopNav backTo="/" title="HOW TO USE" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 flex flex-col items-center">
        <div className="max-w-2xl w-full py-6 sm:py-8">
          <div className="text-center mb-10">
            <span className="booth-heading-kicker mb-3">The booth guide</span>
            <h1 className="font-display text-[2.6rem] leading-[.95] sm:text-6xl mt-4">
              HOW IT <span className="text-primary">WORKS</span>
            </h1>
          </div>
          
          <div className="grid gap-4 sm:gap-6">
            {steps.map((step, i) => (
              <div key={i} className="ticket p-5 sm:p-6 flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                <div className="bg-primary/10 p-4 rounded-2xl shrink-0">
                  {step.icon}
                </div>
                <div>
                  <h3 className="font-display text-xl sm:text-2xl text-foreground mb-2 tracking-[.06em]">{step.title}</h3>
                  <p className="text-sm sm:text-base text-foreground/70 font-medium leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 sm:mt-12 flex justify-center">
             <button
               type="button"
               onClick={handleStartSnapping}
               data-testid="link-setup-bottom"
               className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-4 sm:px-8 sm:py-5 rounded-full font-black text-base sm:text-lg shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
             >
               START SNAPPING <ArrowRight className="w-6 h-6" />
             </button>
          </div>

           <div className="mt-14 sm:mt-20 pt-10 sm:pt-12 border-t-2 border-dashed border-primary/20 pb-16 text-center">
             <p className="text-sm font-semibold text-foreground/55">Want to give some feedback? Join the community chat</p>
             <Link href="/chat" className="mt-3 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary hover:text-primary/75">
               Open community chat <ArrowRight className="w-3.5 h-3.5" />
             </Link>
           </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
