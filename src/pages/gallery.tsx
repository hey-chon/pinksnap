import { Link } from 'wouter';
import { TopNav, BottomNav } from '@/components/layout';
import { useAppContext } from '@/lib/store';
import { Trash2, Download, Image as ImageIcon, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast.tsx';
import { downloadImage } from '@/lib/image-utils';

export default function Gallery() {
  const { savedMemories, deleteMemory } = useAppContext();
  const { toast } = useToast();

  const handleDownload = async (url: string, date: number) => {
    try {
      await downloadImage(url, `pinksnap-gallery-${date}.jpg`);
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
      toast({
        title: 'Deleted',
        description: 'Memory has been removed from your gallery.',
      });
    }
  };

  return (
    <div className="flex flex-col h-[100dvh]">
      <TopNav backTo="/" title="GALLERY" />
      
      <main className="flex-1 overflow-y-auto flex flex-col items-center px-4 py-7 sm:px-6 sm:py-9">
        <div className="w-full max-w-6xl pb-14">
          <div className="text-center mb-8">
            <span className="booth-heading-kicker mb-3">Your print archive</span>
            <h1 className="font-display text-[2.6rem] leading-[.95] sm:text-6xl mt-4">THE <span className="text-primary">GALLERY.</span></h1>
          </div>
          
          {savedMemories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 bg-white/50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/60">
                <ImageIcon className="w-10 h-10 text-foreground/20" />
              </div>
               <h2 data-testid="gallery-empty-state" className="font-display text-[2.2rem] sm:text-5xl text-foreground/80 mb-3">NO PRINTS YET</h2>
              <p className="text-foreground/60 mb-10 max-w-md font-medium text-sm sm:text-base">
                Your gallery is empty. Head over to the studio to capture your first photo strip!
              </p>
              <Link 
                href="/setup"
                data-testid="link-start-session"
                className="px-8 py-4 bg-primary text-white font-black rounded-full shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-transform flex items-center gap-2"
              >
                START A SESSION <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {savedMemories.map(memory => (
                <div key={memory.id} className="ticket p-4 sm:p-5 flex flex-col">
                  
                  <div className="flex justify-between items-center mb-3 px-2">
                    <div className="text-xs font-black text-foreground/60 tracking-wider">
                      {new Date(memory.date).toLocaleDateString()}
                    </div>
                    <div className="text-[10px] font-black bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-widest text-primary">
                      {memory.frame}
                    </div>
                  </div>

                  <div className="w-full aspect-[3/4] bg-black/5 rounded-2xl overflow-hidden mb-4 relative flex items-center justify-center p-3 shadow-inner border border-black/5">
                    <img 
                      src={memory.url} 
                       data-testid={`gallery-memory-${memory.id}`}
                        alt={`PinkSnap photo strip from ${new Date(memory.date).toLocaleDateString()}`}
                      className="max-w-full max-h-full object-contain drop-shadow-md rounded-sm"
                    />
                  </div>
                  
                  <div className="flex justify-between items-center border-t border-black/5 pt-3 px-1">
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
