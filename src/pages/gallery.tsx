import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { TopNav, BottomNav } from '@/components/layout';
import { useAppContext } from '@/lib/store';
import { Trash2, Download, Image as ImageIcon, ArrowRight, X, ZoomIn, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast.tsx';
import { downloadImage } from '@/lib/image-utils';
import { useAuth } from '@/hooks/use-auth';
import { ARTISAN_TEMPLATES, FRAME_OPTIONS, getArtisanTemplate, getFrameOption } from '@/lib/customization';

const getFrameLabel = (id: string) => {
  if (ARTISAN_TEMPLATES.some(t => t.id === id)) return 'ARTISAN';
  if (FRAME_OPTIONS.some(f => f.id === id)) return getFrameOption(id as any).label;
  return id;
};

/**
 * Download an image from a URL (cloud or data-URL).
 * For cloud URLs, fetch the blob first. For data-URLs, use the existing helper.
 */
async function downloadCloudImage(url: string, filename: string) {
  if (url.startsWith('data:')) {
    return downloadImage(url, filename);
  }

  // Cloud URL — fetch and download as blob
  const response = await fetch(url);
  if (!response.ok) throw new Error('Download failed');
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  const link = document.createElement('a');
  if ('download' in link) {
    link.href = objectUrl;
    link.download = filename;
    link.rel = 'noopener';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
    return;
  }

  // Fallback: try Web Share API
  try {
    const file = new File([blob], filename, { type: blob.type });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: filename });
      URL.revokeObjectURL(objectUrl);
      return;
    }
  } catch {
    // ignore
  }

  const opened = window.open(objectUrl, '_blank');
  if (!opened) window.location.href = objectUrl;
  setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
}

export default function Gallery() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [selectedMemory, setSelectedMemory] = useState<{ id: string; url: string; date: number; frame: string } | null>(null);
  const { savedMemories, deleteMemory, isLoadingMemories } = useAppContext();
  const { toast } = useToast();

  const handleStartSession = () => {
    if (isAuthenticated) {
      navigate('/loading');
    } else {
      navigate('/auth');
    }
  };

  const handleDownload = async (url: string, date: number) => {
    try {
      await downloadCloudImage(url, `pinksnap-gallery-${date}.png`);
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

      {/* ── Lightbox Full-Screen Modal ────────────────────────────────────── */}
      {selectedMemory && (
        <div 
          className="fixed inset-0 z-50 bg-black/92 backdrop-blur-xl flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setSelectedMemory(null)}
        >
          <button
            onClick={() => setSelectedMemory(null)}
            className="hidden sm:flex absolute sm:top-8 sm:right-8 z-[60] w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 items-center justify-center text-white transition-colors focus:outline-none ring-1 ring-white/30 backdrop-blur-md"
            aria-label="Close preview"
          >
            <X className="w-6 h-6" />
          </button>

          <div 
            className="flex-1 flex flex-col items-center justify-center py-4 w-full overflow-hidden"
          >
            <div className="relative flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
              <img
                src={selectedMemory.url}
                alt="Full size photostrip"
                onContextMenu={(e) => e.preventDefault()}
                draggable={false}
                className="max-h-[55vh] sm:max-h-[65vh] w-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-xl select-none"
              />
              <div className="mt-6 flex flex-col items-center text-center">
                <div className="font-black text-2xl tracking-tight leading-none mb-1.5">
                  <span className="text-white">PINK</span>
                  <span className="text-primary">SNAP</span>
                </div>
                <div className="text-[10px] sm:text-xs font-bold text-white/60 tracking-[0.2em] uppercase">
                  {getFrameLabel(selectedMemory.frame)} · {new Date(selectedMemory.date).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <TopNav backTo="/" title="GALLERY" />
      
      <main className="flex-1 overflow-y-auto flex flex-col items-center px-4 py-7 sm:px-6 sm:py-9">
        <div className="w-full max-w-6xl pb-14">
          <div className="text-center mb-8">
            <span className="booth-heading-kicker mb-3">print archive</span>
            <h1 className="font-display text-[2.6rem] leading-[.95] sm:text-6xl mt-4 text-white">THE <span className="text-primary">GALLERY.</span></h1>
          </div>
          
          {isLoadingMemories ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/20">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
              <h2 className="font-display text-[2rem] sm:text-4xl text-white/90 mb-3">LOADING MEMORIES</h2>
              <p className="text-white/50 text-sm max-w-xs">Fetching your photo strips from the cloud...</p>
            </div>
          ) : savedMemories.length === 0 ? (
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
                GET STARTED <ArrowRight className="w-5 h-5" />
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
                      {getFrameLabel(memory.frame)}
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
                      onContextMenu={(e) => e.preventDefault()}
                      draggable={false}
                      className="max-w-full max-h-full object-contain drop-shadow-md rounded-sm group-hover:scale-[1.02] transition-transform select-none"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-black text-xs tracking-wider rounded-2xl pointer-events-none">
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
