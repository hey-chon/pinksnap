import { useCallback, useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { useLocation } from 'wouter';
import { useAppContext, LayoutType } from '@/lib/store';
import { getFrameOption, getFilterOption, FrameType, ARTISAN_TEMPLATES } from '@/lib/customization';
import { resetAppFlow } from '@/App';
import { Download, Share2, Image as ImageIcon, Home, Printer } from 'lucide-react';
import { downloadImage, dataUrlToBlob } from '@/lib/image-utils';
import { useToast } from '@/hooks/use-toast.tsx';

const AUTO_DOWNLOAD_KEY = 'ps_strip_autodownloaded';

const formatDate = (ts: number) => {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).toUpperCase();
};

const formatTime = (ts: number) => {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).toUpperCase();
};

const layoutLabel = (l: LayoutType) => {
  switch (l) {
    case 'vertical-4': return 'CLASSIC STRIP';
    case 'quad-4': return 'QUAD GRID';
    case 'horizontal-3': return 'WIDE THREE';
    default: return 'STRIP';
  }
};

const getFrameLabel = (frame: string) => {
  const artisan = ARTISAN_TEMPLATES.find(t => t.id === frame);
  if (artisan) return artisan.label.toUpperCase();
  try {
    return getFrameOption(frame as FrameType).label.toUpperCase();
  } catch {
    return frame.toUpperCase();
  }
};

export default function Receipt() {
  const [, setLocation] = useLocation();
  const { savedMemories, layout, frame, filter } = useAppContext();
  const { toast } = useToast();
  const [revealed, setRevealed] = useState(false);
  const [askPrint, setAskPrint] = useState(false);
  const autoDownloadStarted = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [printTarget, setPrintTarget] = useState<'receipt' | 'strip'>('receipt');

  // Scale the side-by-side layout to fit narrow viewports
  const computeScale = useCallback(() => {
    const CONTENT_WIDTH = 640; // receipt (~384) + gap (16) + panel (~240)
    const vw = window.innerWidth;
    const padding = 32; // 16px on each side
    const available = vw - padding;
    setScale(available < CONTENT_WIDTH ? available / CONTENT_WIDTH : 1);
  }, []);

  useEffect(() => {
    computeScale();
    window.addEventListener('resize', computeScale);
    return () => window.removeEventListener('resize', computeScale);
  }, [computeScale]);

  const latestMemory = savedMemories.length > 0 ? savedMemories[0] : null;
  const sessionDate = latestMemory?.date ?? Date.now();
  const orderNumber = latestMemory
    ? latestMemory.id.slice(-8).toUpperCase()
    : Math.random().toString(36).slice(2, 10).toUpperCase();

  useEffect(() => {
    if (sessionStorage.getItem('receipt_completed') === 'true') {
      setLocation('/', { replace: true });
      return;
    }

    window.history.pushState(null, '', window.location.href);
    const blockBack = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', blockBack);
    return () => window.removeEventListener('popstate', blockBack);
  }, [setLocation]);

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 200);
    const printTimer = setTimeout(() => setAskPrint(true), 900);
    return () => {
      clearTimeout(timer);
      clearTimeout(printTimer);
    };
  }, []);

  // Auto-download the strip once the receipt is shown. Silent mode skips
  // the iOS share sheet so the user is not forced to tap anything.
  useEffect(() => {
    if (!latestMemory || autoDownloadStarted.current) return;
    autoDownloadStarted.current = true;

    let already = '';
    try {
      already = sessionStorage.getItem(AUTO_DOWNLOAD_KEY) || '';
    } catch {
      already = '';
    }
    if (already === latestMemory.id || already === 'started' || already === 'done') return;

    const timer = window.setTimeout(async () => {
      try {
        await downloadImage(latestMemory.url, `pinksnap-${sessionDate}.png`, { silent: true });
        try {
          sessionStorage.setItem(AUTO_DOWNLOAD_KEY, latestMemory.id);
        } catch {
          // ignore quota / private-mode failures
        }
      } catch {
        // SAVE remains available if the browser blocks programmatic downloads
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [latestMemory, sessionDate]);

  const handleDownload = async () => {
    if (!receiptRef.current) return;
    try {
      toast({ title: 'Saving receipt...', description: 'Please wait.' });
      const dataUrl = await toPng(receiptRef.current, { cacheBust: true, pixelRatio: 2 });
      await downloadImage(dataUrl, `pinksnap-receipt-${sessionDate}.png`, { silent: false });
    } catch {
      toast({ title: 'Download failed', description: 'Please try again.', variant: 'destructive' });
    }
  };

  const handleShare = async () => {
    if (!latestMemory) return;
    try {
      let blob: Blob;
      if (latestMemory.url.startsWith('data:')) {
        blob = dataUrlToBlob(latestMemory.url);
      } else {
        const response = await fetch(latestMemory.url);
        blob = await response.blob();
      }
      const file = new File([blob], `pinksnap-${sessionDate}.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'My PinkSnap',
          text: 'Check out my photobooth strip from PinkSnap!',
          files: [file],
        });
        return;
      }
      toast({ title: 'Share unavailable', description: 'Use the download button instead.' });
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      toast({ title: 'Share failed', description: 'Please try again.', variant: 'destructive' });
    }
  };

  const handlePrintReceipt = () => {
    setPrintTarget('receipt');
    setAskPrint(false);
    window.setTimeout(() => window.print(), 100);
  };

  const handlePrintStrip = () => {
    setPrintTarget('strip');
    setAskPrint(false);
    window.setTimeout(() => window.print(), 100);
  };

  const filterLabel = (() => {
    try { return getFilterOption(filter).label.toUpperCase(); }
    catch { return 'COLOR'; }
  })();

  const actionBtn =
    'flex items-center justify-center gap-2 min-h-[44px] px-4 py-3.5 bg-white border border-black/10 text-black/70 font-black text-xs tracking-wider rounded-xl shadow-sm hover:bg-black/5 active:scale-[0.97] transition-all';

  return (
    <div className={`min-h-[100dvh] flex flex-col items-center justify-center px-4 py-8 sm:py-12 bg-[#f5f0eb] pb-[max(2rem,env(safe-area-inset-bottom))] overflow-x-hidden ${printTarget === 'strip' ? 'is-printing-strip' : 'is-printing-receipt'}`}>
      <style>{`
        @keyframes receiptSlideDown {
          from { opacity: 0; transform: translateY(-40px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes receiptFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .receipt-enter { animation: receiptSlideDown 0.7s cubic-bezier(.34,1.56,.64,1) both; }
        .receipt-fade { animation: receiptFadeIn 0.5s ease both 0.8s; }
        .receipt-fade-late { animation: receiptFadeIn 0.5s ease both 1.2s; }
        @media print {
          @page { margin: 0; }
          html, body { background: white !important; margin: 0; padding: 0; }
          
          /* Override any dynamic scaling from JS during print */
          .receipt-container {
            transform: none !important;
            width: 100% !important;
            display: block !important;
          }

          /* Hide UI elements */
          .print\\:hidden, .actions-panel, .print-modal { display: none !important; }
          
          /* Toggle visibility based on what we are printing */
          .is-printing-strip .receipt-card { display: none !important; }
          .is-printing-receipt .strip-print { display: none !important; }

          /* Center the content */
          .receipt-card, .strip-print {
            position: absolute !important;
            left: 50% !important;
            top: 12mm !important;
            transform: translateX(-50%) !important;
            margin: 0 !important;
            box-shadow: none !important;
          }

          /* Standard photobooth strip size for printing */
          .strip-print {
            width: 2in !important;
            max-width: 100% !important;
            height: auto !important;
          }
        }
      `}</style>
      
      {/* Hidden strip image, only visible when printing strip */}
      {latestMemory && (
        <img src={latestMemory.url} alt="Strip" className="strip-print hidden print:block" />
      )}

      <div
        ref={contentRef}
        className="receipt-container flex flex-row items-center justify-center gap-6 md:gap-8"
        style={{
          transform: scale < 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'top center',
          width: scale < 1 ? '640px' : undefined,
        }}
      >
        {/* Receipt card — original full ticket */}
        <div
          ref={receiptRef}
          className="receipt-enter receipt-card w-full max-w-[320px] shrink-0 bg-white relative shadow-[0_8px_40px_rgba(0,0,0,0.12)]"
          style={{ borderRadius: '4px 4px 0 0' }}
        >
          <div className="absolute -top-[6px] left-0 right-0 h-[6px] overflow-hidden print:hidden">
            <svg width="100%" height="6" preserveAspectRatio="none" viewBox="0 0 400 6">
              <path
                d="M0,6 Q5,0 10,6 Q15,0 20,6 Q25,0 30,6 Q35,0 40,6 Q45,0 50,6 Q55,0 60,6 Q65,0 70,6 Q75,0 80,6 Q85,0 90,6 Q95,0 100,6 Q105,0 110,6 Q115,0 120,6 Q125,0 130,6 Q135,0 140,6 Q145,0 150,6 Q155,0 160,6 Q165,0 170,6 Q175,0 180,6 Q185,0 190,6 Q195,0 200,6 Q205,0 210,6 Q215,0 220,6 Q225,0 230,6 Q235,0 240,6 Q245,0 250,6 Q255,0 260,6 Q265,0 270,6 Q275,0 280,6 Q285,0 290,6 Q295,0 300,6 Q305,0 310,6 Q315,0 320,6 Q325,0 330,6 Q335,0 340,6 Q345,0 350,6 Q355,0 360,6 Q365,0 370,6 Q375,0 380,6 Q385,0 390,6 Q395,0 400,6"
                fill="white"
              />
            </svg>
          </div>

          <div className="px-6 sm:px-8 pt-8 pb-6">
            <div className="text-center mb-6 pb-5 border-b border-dashed border-black/15">
              <h1 className="font-mono text-2xl sm:text-3xl font-black text-black tracking-tight leading-none mb-1">
                PINKSNAP
              </h1>
              <p className="font-mono text-[9px] text-black/40 tracking-[0.3em] uppercase">
                Virtual Photo Booth
              </p>
            </div>

            <div className="font-mono text-[10px] text-black/60 tracking-wider mb-5 space-y-1">
              <div className="flex justify-between">
                <span>ORDER #</span>
                <span className="font-bold text-black/80">{orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>DATE</span>
                <span>{formatDate(sessionDate)}</span>
              </div>
              <div className="flex justify-between">
                <span>TIME</span>
                <span>{formatTime(sessionDate)}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-black/15 my-4" />

            {latestMemory && (
              <div className="flex flex-col items-center my-5">
                <div
                  className="bg-black/5 border border-black/10 rounded-sm p-2 shadow-inner"
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <img
                    src={latestMemory.url}
                    alt="Your photo strip"
                    draggable={false}
                    className="max-h-[220px] w-auto max-w-full object-contain select-none"
                    onContextMenu={(e) => e.preventDefault()}
                  />
                </div>
                <p className="font-mono text-[8px] text-black/30 tracking-[0.2em] mt-2 uppercase">
                  -- your photo strip --
                </p>
              </div>
            )}

            <div className="border-t border-dashed border-black/15 my-4" />

            <div className="font-mono text-[10px] text-black/60 tracking-wider space-y-1.5 mb-4">
              <div className="flex justify-between">
                <span>LAYOUT</span>
                <span className="text-right font-bold text-black/80">{layoutLabel(layout)}</span>
              </div>
              <div className="flex justify-between">
                <span>THEME</span>
                <span className="text-right font-bold text-black/80">{getFrameLabel(latestMemory?.frame ?? frame as string)}</span>
              </div>
              <div className="flex justify-between">
                <span>FILM</span>
                <span className="text-right font-bold text-black/80">{filterLabel}</span>
              </div>
              <div className="flex justify-between">
                <span>PHOTOS</span>
                <span className="text-right font-bold text-black/80">{layout === 'horizontal-3' ? '3' : '4'}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-black/15 my-4" />

            <div className="font-mono text-center mb-5">
              <div className="flex justify-between items-end mb-3">
                <span className="text-[10px] text-black/50 tracking-wider">STATUS</span>
                <span className="text-sm font-black text-black tracking-tight">PRINTED</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] text-black/50 tracking-wider">SAVED TO</span>
                <span className="text-[10px] font-bold text-black/70 tracking-wider">GALLERY</span>
              </div>
            </div>

            <div className="border-t border-dashed border-black/15 my-4" />

            <div className="flex flex-col items-center my-4">
              <div className="flex gap-[1px] items-end h-[32px]">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-black"
                    style={{
                      width: i % 3 === 0 ? '2px' : '1px',
                      height: `${18 + (((i * 7 + 13) % 14))}px`,
                    }}
                  />
                ))}
              </div>
              <p className="font-mono text-[8px] text-black/30 mt-1.5 tracking-[0.35em]">
                {orderNumber}
              </p>
            </div>

            <div className="text-center mt-5 pt-4 border-t border-dashed border-black/15">
              <p className="font-mono text-[9px] text-black/40 leading-relaxed tracking-wide">
                THANK YOU FOR USING PINKSNAP
              </p>
              <p className="font-mono text-[8px] text-black/25 mt-1 tracking-wider">
                KEEP THIS RECEIPT FOR YOUR RECORDS
              </p>
            </div>
          </div>

          <div className="absolute -bottom-[6px] left-0 right-0 h-[6px] overflow-hidden rotate-180 print:hidden">
            <svg width="100%" height="6" preserveAspectRatio="none" viewBox="0 0 400 6">
              <path
                d="M0,6 Q5,0 10,6 Q15,0 20,6 Q25,0 30,6 Q35,0 40,6 Q45,0 50,6 Q55,0 60,6 Q65,0 70,6 Q75,0 80,6 Q85,0 90,6 Q95,0 100,6 Q105,0 110,6 Q115,0 120,6 Q125,0 130,6 Q135,0 140,6 Q145,0 150,6 Q155,0 160,6 Q165,0 170,6 Q175,0 180,6 Q185,0 190,6 Q195,0 200,6 Q205,0 210,6 Q215,0 220,6 Q225,0 230,6 Q235,0 240,6 Q245,0 250,6 Q255,0 260,6 Q265,0 270,6 Q275,0 280,6 Q285,0 290,6 Q295,0 300,6 Q305,0 310,6 Q315,0 320,6 Q325,0 330,6 Q335,0 340,6 Q345,0 350,6 Q355,0 360,6 Q365,0 370,6 Q375,0 380,6 Q385,0 390,6 Q395,0 400,6"
                fill="white"
              />
            </svg>
          </div>
        </div>

        {/* Actions: under the ticket on phones, to the right on tablets/desktops */}
        <div className={`actions-panel w-[240px] shrink-0 flex flex-col justify-center gap-3 print:hidden ${revealed ? 'receipt-fade' : 'opacity-0'}`} style={{ maxWidth: '240px' }}>
          <button type="button" onClick={handleDownload} className={actionBtn}>
            <Download className="w-4 h-4" /> SAVE
          </button>
          <button type="button" onClick={handleShare} className={actionBtn}>
            <Share2 className="w-4 h-4" /> SHARE
          </button>
          <button type="button" onClick={handlePrintStrip} className={actionBtn}>
            <Printer className="w-4 h-4" /> PRINT STRIP
          </button>
          <button type="button" onClick={handlePrintReceipt} className={actionBtn}>
            <Printer className="w-4 h-4" /> PRINT RECEIPT
          </button>
          <button
            type="button"
            onClick={() => setLocation('/gallery', { replace: true })}
            className={actionBtn}
          >
            <ImageIcon className="w-4 h-4" /> VIEW GALLERY
          </button>
          <button
            type="button"
            onClick={() => {
              sessionStorage.setItem('receipt_completed', 'true');
              resetAppFlow();
              setLocation('/', { replace: true });
            }}
            className="flex items-center justify-center gap-2 min-h-[48px] px-4 py-4 bg-[#f53d89] text-white font-black text-sm tracking-wider rounded-xl shadow-lg shadow-[#f53d89]/25 hover:shadow-xl hover:shadow-[#f53d89]/30 active:scale-[0.97] transition-all"
          >
            <Home className="w-4 h-4" /> BACK TO HOME
          </button>

          {/* Note */}
          <div className={`mt-3 bg-white/70 backdrop-blur-sm border border-black/8 rounded-xl p-4 ${revealed ? 'receipt-fade-late' : 'opacity-0'}`}>
            <div className="flex items-center gap-1.5 mb-2.5">
              <div className="w-1 h-1 rounded-full bg-[#f53d89]" />
              <span className="font-mono text-[9px] font-black text-black/50 tracking-[0.25em] uppercase">Note</span>
            </div>
            <p className="font-mono text-[10px] text-black/55 leading-[1.7] tracking-wide">
              This is your <span className="font-bold text-black/70">receipt</span> only. Your photo strip has already been saved to your phone — check your <span className="font-bold text-black/70">Downloads</span> or <span className="font-bold text-black/70">Gallery</span>.
            </p>
            <p className="font-mono text-[10px] text-black/55 leading-[1.7] tracking-wide mt-2">
              PinkSnap also lets you save this receipt using the <span className="font-bold text-black/70">SAVE</span> button above.
            </p>
            <div className="border-t border-dashed border-black/10 my-3" />
            <div className="flex items-center gap-1.5 mb-2">
              <Printer className="w-3 h-3 text-black/40" />
              <span className="font-mono text-[9px] font-black text-black/50 tracking-[0.25em] uppercase">Printing</span>
            </div>
            <p className="font-mono text-[10px] text-black/55 leading-[1.7] tracking-wide">
              If you have a printer (<span className="font-bold text-black/70">Epson</span>, <span className="font-bold text-black/70">Canon</span>, <span className="font-bold text-black/70">HP</span>, or other brands), you can print this receipt directly. You can also print your photo strip from your gallery or downloads with printer.
            </p>
          </div>
        </div>
      </div>

      <p className={`mt-6 font-mono text-[9px] text-black/20 tracking-[0.3em] print:hidden ${revealed ? 'receipt-fade-late' : 'opacity-0'}`}>
        PINKSNAP.PICS
      </p>
    </div>
  );
}
