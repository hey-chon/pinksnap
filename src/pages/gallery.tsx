import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { TopNav, BottomNav } from '@/components/layout';
import { useAppContext } from '@/lib/store';
import { Trash2, Download, Image as ImageIcon, ArrowRight, X, ZoomIn, Loader2, Eraser, Shield, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast.tsx';
import { downloadImage } from '@/lib/image-utils';
import { useAuth } from '@/hooks/use-auth';
import { ARTISAN_TEMPLATES, FRAME_OPTIONS, getArtisanTemplate, getFrameOption } from '@/lib/customization';

const getFrameLabel = (id: string) => {
  if (ARTISAN_TEMPLATES.some(t => t.id === id)) return 'ARTISAN';
  if (FRAME_OPTIONS.some(f => f.id === id)) return getFrameOption(id as any).label;
  return id;
};

async function downloadCloudImage(url: string, filename: string) {
  return downloadImage(url, filename);
}

export default function Gallery() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [selectedMemory, setSelectedMemory] = useState<{ id: string; url: string; date: number; frame: string } | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const { savedMemories, deleteMemory, clearAllMemories, isLoadingMemories } = useAppContext();
  const { toast } = useToast();

  // Escape to close view mode & anti-save keyboard interception
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape closes lightbox
      if (e.key === 'Escape') {
        setSelectedMemory(null);
        return;
      }
      // Block save shortcuts
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        toast({
          title: 'Protected Gallery \uD83D\uDD12',
          description: 'Your encrypted photo strips are protected. Use the SAVE button to download your own strips.',
          variant: 'destructive',
        });
      }
      // Warn on PrintScreen
      if (e.key === 'PrintScreen') {
        toast({
          title: 'Screenshot Detected \uD83D\uDEE1\uFE0F',
          description: 'Gallery strips are AES-256-GCM encrypted. Screenshots may capture the decrypted view.',
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toast]);

  const handleStartSession = () => {
    sessionStorage.setItem('ps_has_entered_app', 'true');
    sessionStorage.setItem('ps_intent_start', 'true');
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

  const handleDeleteAll = async () => {
    if (savedMemories.length === 0) return;
    if (!confirm(`Are you sure you want to delete ALL ${savedMemories.length} photo strips? This cannot be undone.`)) return;
    setIsDeletingAll(true);
    const count = savedMemories.length;
    await clearAllMemories();
    setSelectedMemory(null);
    setIsDeletingAll(false);
    toast({
      title: 'Gallery Cleared',
      description: `All ${count} photo strips have been deleted.`,
    });
  };

  return (
    <div className="flex flex-col h-[100dvh]">

      {/* ── Lightbox Full-Screen Modal ────────────────────────────────────── */}
      {selectedMemory && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in duration-200 cursor-pointer"
          onClick={() => setSelectedMemory(null)}
          onContextMenu={(e) => { e.preventDefault(); return false; }}
        >
          {/* Top Bar */}
          <div 
            className="w-full max-w-4xl flex items-center justify-between text-white z-10 pt-2 sm:pt-4 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <span className="font-hero text-lg sm:text-xl tracking-wider text-primary">PINKSNAP</span>
              <span className="text-white/40 text-xs">·</span>
              <span className="text-[10px] font-black bg-white/10 px-2.5 py-1 rounded-full uppercase tracking-widest text-primary border border-primary/20">
                {getFrameLabel(selectedMemory.frame)}
              </span>
              <span className="text-white/40 text-xs">·</span>
              <span className="text-xs text-white/70 font-mono">
                {new Date(selectedMemory.date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownload(selectedMemory.url, selectedMemory.date)}
                className="p-2 sm:px-3 sm:py-2 bg-white/10 hover:bg-white/20 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors border border-white/20"
                aria-label="Download strip"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Save</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedMemory(null)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors border border-white/20"
                aria-label="Close preview"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Photo Strip Center Area — tapping the background exits view mode */}
          <div 
            className="flex-1 flex flex-col items-center justify-center py-4 w-full overflow-hidden cursor-pointer"
            onClick={() => setSelectedMemory(null)}
            onContextMenu={(e) => { e.preventDefault(); return false; }}
          >
            <div 
              className="relative flex flex-col items-center select-none cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedMemory.url}
                alt="Full size photostrip"
                onContextMenu={(e) => { e.preventDefault(); return false; }}
                draggable={false}
                decoding="async"
                className="max-h-[70dvh] sm:max-h-[78dvh] w-auto object-contain drop-shadow-[0_25px_60px_rgba(245,61,137,0.35)] rounded-2xl select-none animate-in zoom-in-95 duration-200 pointer-events-none"
              />
              {/* Details & DRM Guard Badge */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 select-none pointer-events-none">
                <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-black text-white/80 uppercase tracking-widest flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-primary" />
                  <span>{getFrameLabel(selectedMemory.frame)}</span>
                </div>
                <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-black text-white/80 uppercase tracking-widest flex items-center gap-1.5">
                  <span>{new Date(selectedMemory.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
                </div>
                <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-emerald-500/20 text-[10px] font-bold text-white flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  <span>AES-256-GCM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <TopNav backTo="/" title="GALLERY" />
      
      <main className="flex-1 overflow-y-auto flex flex-col items-center px-4 py-7 sm:px-6 sm:py-9 relative scroll-smooth">
        {/* Background glows */}
        <div className="absolute top-1/4 left-10 md:left-32 w-64 h-64 bg-primary/20 rounded-full blur-3xl -z-10 mix-blend-multiply pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 md:right-32 w-80 h-80 bg-blue-300/20 rounded-full blur-3xl -z-10 mix-blend-multiply pointer-events-none" />

        <div className="w-full max-w-6xl pb-14 z-10">
          <div className="text-center mb-8">
            <span className="booth-heading-kicker mb-3">print archive</span>
            <h1 className="font-hero text-[2rem] leading-[1] sm:text-4xl md:text-5xl mt-4 text-foreground">THE <span className="text-primary">GALLERY.</span></h1>

            {savedMemories.length > 0 && !isLoadingMemories && (
              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  onClick={handleDeleteAll}
                  disabled={isDeletingAll}
                  data-testid="button-delete-all"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-destructive/10 hover:bg-destructive/20 border border-destructive/30 text-destructive font-black text-xs uppercase tracking-widest rounded-full transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                >
                  {isDeletingAll ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Eraser className="w-3.5 h-3.5" />
                  )}
                  Delete All ({savedMemories.length})
                </button>
              </div>
            )}
          </div>
          
          {isLoadingMemories ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/20">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
              <h2 className="font-display text-[2rem] sm:text-4xl text-foreground mb-3">LOADING MEMORIES</h2>
              <p className="text-foreground/50 text-sm max-w-xs">Fetching your photo strips from the cloud...</p>
            </div>
          ) : savedMemories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-32 h-32 mb-6 drop-shadow-lg">
                <img src="/meme_cat_transparent.jpg" alt="No prints yet cat" className="w-full h-full object-contain" />
              </div>
              <h2 data-testid="gallery-empty-state" className="font-display text-[2.2rem] sm:text-5xl text-foreground mb-3">NO PRINTS YET</h2>
              <button
                type="button"
                onClick={handleStartSession}
                data-testid="link-start-session"
                className="px-4 py-4 bg-primary text-white font-black rounded-full shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-transform flex items-center gap-2"
              >
                START SNAPPING <ArrowRight className="w-5 h-5" />
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
                    onContextMenu={(e) => { e.preventDefault(); return false; }}
                    className="w-full aspect-[3/4] bg-black/10 rounded-2xl overflow-hidden mb-4 relative flex items-center justify-center p-3 shadow-inner border border-black/10 cursor-pointer group hover:bg-black/15 transition-all"
                  >
                    <img 
                      src={memory.url} 
                      data-testid={`gallery-memory-${memory.id}`}
                      alt={`PinkSnap photo strip from ${new Date(memory.date).toLocaleDateString()}`}
                      onContextMenu={(e) => { e.preventDefault(); return false; }}
                      draggable={false}
                      loading="lazy"
                      decoding="async"
                      className="max-w-full max-h-full object-contain drop-shadow-md rounded-sm group-hover:scale-[1.02] transition-transform select-none pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-black text-xs tracking-wider rounded-2xl pointer-events-none">
                      <ZoomIn className="w-4 h-4" /> VIEW FULL STRIP
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center border-t border-black/10 pt-3 px-1">
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => handleDownload(memory.url, memory.date)}
                        data-testid={`button-download-${memory.id}`}
                        className="flex items-center gap-2 px-3 py-2 text-primary hover:bg-primary/10 rounded-xl font-black text-[10px] sm:text-xs transition-colors tracking-wider focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <Download className="w-4 h-4" /> SAVE
                      </button>
                      <span className="hidden sm:flex items-center gap-1 text-[8px] font-bold text-emerald-600/70 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/15 select-none">
                        <Shield className="w-2.5 h-2.5" /> AES-256
                      </span>
                    </div>
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
