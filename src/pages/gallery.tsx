import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { TopNav, BottomNav } from '@/components/layout';
import { useAppContext } from '@/lib/store';
import { Trash2, Download, Image as ImageIcon, ArrowRight, X, ZoomIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast.tsx';
import { downloadImage } from '@/lib/image-utils';
import { useAuth } from '@/hooks/use-auth';
import { AuthGateModal } from '@/components/auth/auth-gate-modal';

export default function Gallery() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<{ id: string; url: string; date: number; frame: string } | null>(null);
  const { savedMemories, deleteMemory } = useAppContext();
  const { toast } = useToast();

  const handleStartSession = () => {
    if (isAuthenticated) {
      navigate('/loading');
    } else {
      setShowAuthGate(true);
    }
  };

  const handleDownload = async (url: string, date: number) => {
    try {
      await downloadImage(url, `pinksnap-gallery-${date}.png`);
      toast({
        title: 'Downloading...',
        description: 'Your memory is downloading.',
      });
    } catch {
      toast({ title: 'Download unavailable', description: 'Please try again on this device.', variant: 'destructive' });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this memory?')) {
      deleteMemory(id);
      if (selectedMemory?.id === id) setSelectedMemory(null);
      toast({
        title: 'Deleted',
        description: 'Memory has been removed from your gallery.',
      });
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0c0b10] text-white dark-page-bg">
      {showAuthGate && (
        <AuthGateModal
          onClose={() => setShowAuthGate(false)}
          onSuccess={() => { setShowAuthGate(false); navigate('/loading'); }}
        />
      )}

      {/* ── Lightbox Full-Screen Modal ────────────────────────────────────── */}
      {selectedMemory && (
        <div 
          className="fixed inset-0 z-50 bg-black/92 backdrop-blur-xl flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setSelectedMemory(null)}
        >
          <div className="w-full flex justify-between items-center max-w-4xl pt-2">
            <div className="text-sm font-black tracking-wider text-white/80 uppercase">
              {selectedMemory.frame} · {new Date(selectedMemory.date).toLocaleDateString()}
            </div>
            <button
              onClick={() => setSelectedMemory(null)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors focus:outline-none ring-1 ring-white/20"
              aria-label="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div 
            className="flex-1 flex items-center justify-center py-4 w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedMemory.url}
              alt="Full size photostrip"
              className="max-h-[78vh] w-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-xl"
            />
          </div>

          <div 
            className="flex items-center gap-4 pb-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => handleDownload(selectedMemory.url, selectedMemory.date)}
              className="px-6 py-3 bg-primary text-white font-black rounded-full shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-transform flex items-center gap-2 text-sm tracking-wider"
            >
              <Download className="w-4 h-4" /> SAVE STRIP
            </button>
            <button
              onClick={() => handleDelete(selectedMemory.id)}
              className="px-5 py-3 bg-white/10 hover:bg-destructive/20 hover:text-destructive text-white/80 font-black rounded-full transition-colors flex items-center gap-2 text-sm tracking-wider ring-1 ring-white/15"
            >
              <Trash2 className="w-4 h-4" /> DELETE
            </button>
          </div>
        </div>
      )}

      <TopNav backTo="/" title="GALLERY" />
      
      <main className="flex-1 overflow-y-auto flex flex-col items-center px-4 py-7 sm:px-6 sm:py-9">
        <div className="w-full max-w-6xl pb-14">
          <div className="text-center mb-8">
            <span className="booth-heading-kicker mb-3">Your print archive</span>
            <h1 className="font-display text-[2.6rem] leading-[.95] sm:text-6xl mt-4 text-white">THE <span className="text-primary">GALLERY.</span></h1>
          </div>
          
          {savedMemories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/20">
                <ImageIcon className="w-10 h-10 text-white/60" />
              </div>
              <h2 data-testid="gallery-empty-state" className="font-display text-[2.2rem] sm:text-5xl text-white/90 mb-3">NO PRINTS YET</h2>
              <button
                type="button"
                onClick={handleStartSession}
                data-testid="link-start-session"
                className="px-4 py-4 bg-primary text-white font-black rounded-full shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-transform flex items-center gap-2"
              >
                START A SESSION <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {savedMemories.map(memory => (
                <div key={memory.id} className="ticket p-4 sm:p-5 flex flex-col">
                  
                  <div className="flex justify-between items-center mb-3 px-2">
                    <div className="text-xs font-black text-foreground/75 tracking-wider">
                      {new Date(memory.date).toLocaleDateString()}
                    </div>
                    <div className="text-[10px] font-black bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-widest text-primary">
                      {memory.frame}
                    </div>
                  </div>

                  <div 
                    onClick={() => setSelectedMemory({ id: memory.id, url: memory.url, date: memory.date, frame: memory.frame })}
                    className="w-full aspect-[3/4] bg-black/10 rounded-2xl overflow-hidden mb-4 relative flex items-center justify-center p-3 shadow-inner border border-black/10 cursor-pointer group hover:bg-black/15 transition-all"
                  >
                    <img 
                      src={memory.url} 
                      data-testid={`gallery-memory-${memory.id}`}
                      alt={`PinkSnap photo strip from ${new Date(memory.date).toLocaleDateString()}`}
                      className="max-w-full max-h-full object-contain drop-shadow-md rounded-sm group-hover:scale-[1.02] transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-black text-xs tracking-wider rounded-2xl">
                      <ZoomIn className="w-4 h-4" /> VIEW FULL STRIP
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center border-t border-black/10 pt-3 px-1">
                    <button 
                      onClick={() => handleDownload(memory.url, memory.date)}
                      data-testid={`button-download-${memory.id}`}
                      className="flex items-center gap-2 px-3 py-2 text-primary hover:bg-primary/10 rounded-xl font-black text-[10px] sm:text-xs transition-colors tracking-wider focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <Download className="w-4 h-4" /> SAVE
                    </button>
                    <button 
                      onClick={() => handleDelete(memory.id)}
                      data-testid={`button-delete-${memory.id}`}
                      className="flex items-center gap-2 px-3 py-2 text-destructive hover:bg-destructive/10 rounded-xl font-black text-[10px] sm:text-xs transition-colors tracking-wider focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                    >
                      <Trash2 className="w-4 h-4" /> DELETE
                    </button>
                  </div>
                  
                </div>
              ))}
            </div>
          )}
          
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
