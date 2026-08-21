import { useMemo, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { TopNav, BottomNav } from '@/components/layout';
import { useAppContext } from '@/lib/store';
import {
  drawFrameBackground,
  FILTER_OPTIONS,
  FRAME_CATEGORIES,
  FRAME_OPTIONS,
  getFilterOption,
  getFrameOption,
  getStripGeometry,
  filterImageForCanvas,
  roundedRect,
  FrameCategory,
  FilterType,
} from '@/lib/customization';
import { RefreshCw, Download, Share2, Check, Sparkles, SlidersHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast.tsx';
import { createGalleryPreview, createMemoryId, dataUrlToBlob, downloadImage } from '@/lib/image-utils';

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | HTMLCanvasElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const imgRatio = img.width / img.height;
  const targetRatio = w / h;
  let sWidth = img.width;
  let sHeight = img.height;
  let sx = 0;
  let sy = 0;

  if (imgRatio > targetRatio) {
    sWidth = img.height * targetRatio;
    sx = (img.width - sWidth) / 2;
  } else {
    sHeight = img.width / targetRatio;
    sy = (img.height - sHeight) / 2;
  }

  ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h);
}

const formatStripDate = (value: number) =>
  new Date(value).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase();

export default function Edit() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const {
    shots, layout, frame, setFrame, filter, setFilter,
    frameOpacity, setFrameOpacity, saveMemory, clearShots,
  } = useAppContext();

  const [isSaving, setIsSaving] = useState(false);
  const [category, setCategory] = useState<FrameCategory>('booth');
  const stripRef = useRef<HTMLDivElement>(null);
  const sessionDate = useMemo(() => Date.now(), []);

  const activeFrame = getFrameOption(frame);
  const stripFilterClass = getFilterOption(filter).className;
  const visibleFrames = FRAME_OPTIONS.filter((option) => option.category === category);

  const handleRetake = () => {
    clearShots();
    setLocation('/studio');
  };

  const generateStripImage = async (): Promise<string> => {
    if (shots.length === 0) return '';

    const geometry = getStripGeometry(layout);
    const canvas = document.createElement('canvas');
    canvas.width = geometry.width;
    canvas.height = geometry.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    drawFrameBackground(ctx, frame, geometry.width, geometry.height, frameOpacity);

    const images = await Promise.all(shots.map((shot) => new Promise<HTMLCanvasElement | null>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(filterImageForCanvas(img, filter));
      img.onerror = () => resolve(null);
      img.src = shot;
    })));

    images.forEach((image, index) => {
      if (!image) return;
      const position = geometry.positions[index];
      if (!position) return;
      ctx.save();
      roundedRect(ctx, position.x, position.y, geometry.shotWidth, geometry.shotHeight, geometry.radius);
      ctx.clip();
      drawImageCover(ctx, image, position.x, position.y, geometry.shotWidth, geometry.shotHeight);
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = activeFrame.matte;
      ctx.lineWidth = 6;
      roundedRect(ctx, position.x - 3, position.y - 3, geometry.shotWidth + 6, geometry.shotHeight + 6, geometry.radius + 3);
      ctx.stroke();
      ctx.restore();
    });

    const baseline = geometry.height - geometry.padding;
    ctx.textAlign = 'center';
    ctx.font = '900 46px "Inter", ui-sans-serif, system-ui, sans-serif';
    ctx.fillStyle = activeFrame.dark ? '#fdf7fa' : '#1f1d2b';
    ctx.fillText('PINK', geometry.width / 2, baseline - 52);
    ctx.fillStyle = activeFrame.dark ? '#ff5fa2' : '#f53d89';
    ctx.fillText('SNAP', geometry.width / 2, baseline - 6);

    ctx.font = '800 18px "Inter", ui-sans-serif, system-ui, sans-serif';
    ctx.fillStyle = activeFrame.dark ? 'rgba(253,247,250,.7)' : 'rgba(31,29,43,.5)';
    ctx.fillText(`${activeFrame.label.toUpperCase()}  ·  ${formatStripDate(sessionDate)}`, geometry.width / 2, baseline + 34);

    return canvas.toDataURL('image/png', 1.0);
  };

  const saveToGallery = async (dataUrl: string) => {
    try {
      const galleryUrl = await createGalleryPreview(dataUrl);
      if (!galleryUrl) return false;
      saveMemory({
        id: createMemoryId(),
        url: galleryUrl,
        date: Date.now(),
        layout,
        frame,
        mimeType: 'image/jpeg',
      });
      return true;
    } catch {
      return false;
    }
  };

  const executeDownload = async (dataUrl: string, addToGallery = false) => {
    await downloadImage(dataUrl, `pinksnap-${Date.now()}.png`);
    if (addToGallery) {
      await saveToGallery(dataUrl);
    }
    toast({
      title: 'Strip saved!',
      description: 'Your photo strip has been downloaded and added to your gallery.',
    });
    setTimeout(() => {
      setLocation('/gallery');
    }, 1000);
  };

  const handleSave = async (skipDownload = false) => {
    if (shots.length === 0) return;
    setIsSaving(true);

    try {
      const dataUrl = await generateStripImage();
      if (!dataUrl) throw new Error('empty strip');

      if (!skipDownload) {
        await executeDownload(dataUrl);
      }

      const stored = await saveToGallery(dataUrl);

      if (!stored) {
        toast({
          title: 'Downloaded successfully',
          description: 'The strip was downloaded, but this device could not keep a gallery copy.',
        });
      }
    } catch {
      toast({
        title: 'Download failed',
        description: 'We could not save the strip. Try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    if (shots.length === 0) return;
    setIsSaving(true);

    try {
      const dataUrl = await generateStripImage();

      if (navigator.share && navigator.canShare) {
        const blob = dataUrlToBlob(dataUrl);
        const file = new File([blob], `pinksnap-${Date.now()}.png`, { type: 'image/png' });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'My PinkSnap',
            text: 'Check out my photobooth strip from PinkSnap!',
            files: [file],
          });
          await saveToGallery(dataUrl);
          return;
        }
      }

      toast({
        title: 'Sharing unavailable',
        description: 'Image will be saved to your device instead.',
      });
      await executeDownload(dataUrl, true);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        toast({
          title: 'Share cancelled',
          description: 'Your strip is still ready to download whenever you are.',
        });
      } else {
        toast({
          title: 'Share unavailable',
          description: 'Your strip will be downloaded instead.',
        });
        const dataUrl = await generateStripImage();
        if (dataUrl) await executeDownload(dataUrl, true);
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (shots.length === 0) {
    return (
      <div className="flex flex-col h-[100dvh]">
        <TopNav backTo="/setup" />
        <main className="flex-1 flex flex-col items-center justify-center p-6">
          <p className="text-xl font-bold mb-6 text-foreground/60 tracking-wide uppercase">No shots captured yet.</p>
          <button
            onClick={() => setLocation('/studio')}
            className="px-8 py-4 bg-primary text-white font-black rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform"
          >
            GO TO STUDIO
          </button>
        </main>
      </div>
    );
  }

  const gridClass = layout === 'vertical-4'
    ? 'grid-cols-1 w-full max-w-[168px] sm:max-w-[240px] xl:max-w-[276px]'
    : layout === 'quad-4'
      ? 'grid-cols-2 w-full max-w-[248px] sm:max-w-[320px] xl:max-w-[380px]'
      : 'grid-cols-3 w-full max-w-[280px] sm:max-w-[420px] xl:max-w-[540px]';

  const shellClass = layout === 'vertical-4'
    ? 'max-w-[200px] sm:max-w-[280px]'
    : layout === 'quad-4'
      ? 'max-w-[280px] sm:max-w-[360px]'
      : 'max-w-[312px] sm:max-w-[460px]';


  const matteClass = activeFrame.dark ? 'strip-matte-light' : 'strip-matte-dark';
  const inkClass = activeFrame.dark ? 'strip-ink-light' : 'strip-ink-dark';

  return (
    <div className="flex flex-col h-[100dvh]">
      <TopNav backTo="/studio" />

      <main className="flex-1 overflow-y-auto flex flex-col items-center px-4 py-7 sm:px-6 sm:py-9">
        <div className="edit-heading text-center mb-7 sm:mb-9 w-full max-w-[36rem]">
          <span className="booth-heading-kicker mb-3">Step 3 of 3 · Print lab</span>
          <h1 className="font-display text-[2.35rem] leading-[.95] sm:text-5xl md:text-6xl text-foreground mt-4 mb-3">
            DEVELOP YOUR STRIP.
          </h1>
          <p className="text-[11px] sm:text-xs font-bold text-primary uppercase tracking-[.18em] sm:tracking-[.24em] leading-relaxed">
            Pick a booth theme, set the mood, keep the print.
          </p>
        </div>


        <div className="flex flex-col xl:flex-row gap-7 sm:gap-9 xl:gap-12 w-full max-w-6xl items-center xl:items-start justify-center pb-14">

          <div className="edit-card w-full flex justify-center shrink-0 xl:w-auto xl:sticky xl:top-6">
            <div ref={stripRef} className={`strip-shell relative overflow-hidden w-full xl:max-w-none p-3 sm:p-5 ${shellClass}`}>
              <div className={`absolute inset-0 z-0 ${activeFrame.className} frame-opacity-${Math.round(frameOpacity / 10) * 10}`} />

              <div className={`relative z-10 grid gap-3 sm:gap-3.5 mx-auto ${gridClass}`}>
                {shots.map((shot, i) => (
                  <div key={i} className={`strip-photo ${matteClass}`}>
                    <img src={shot} alt={`Shot ${i + 1}`} className={stripFilterClass} />
                  </div>
                ))}
              </div>

              <div className={`strip-footer relative z-10 pt-5 pb-1 text-center font-black ${inkClass}`}>
                <span className="block text-[19px] sm:text-[22px]">PINK</span>
                <span className="block text-[19px] sm:text-[22px] strip-brand-accent">SNAP</span>
                <span className="strip-caption block pt-2">{formatStripDate(sessionDate)}</span>
              </div>
            </div>
          </div>

          <div className="edit-card flex-1 w-full max-w-xl booth-plate p-4 sm:p-7">

            <div className="flex items-center justify-between gap-3 mb-5">
              <h2 className="font-display text-2xl text-foreground/85 tracking-[.08em] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> Booth themes
              </h2>
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">
                {FRAME_OPTIONS.length} looks
              </span>
            </div>


            <div className="flex flex-wrap gap-2 mb-4">
              {FRAME_CATEGORIES.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCategory(tab.id)}
                  aria-pressed={category === tab.id}
                  data-testid={`button-category-${tab.id}`}
                  className={`tab-chip ${category === tab.id ? 'tab-chip-active' : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-7">
              {visibleFrames.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setFrame(option.id)}
                  data-testid={`button-frame-${option.id}`}
                  aria-pressed={frame === option.id}
                  className={`theme-card ${frame === option.id ? 'theme-card-active' : ''}`}
                >
                  <span className={`theme-preview ${option.className} ${option.dark ? 'theme-preview-dark' : ''}`}>
                    <span />
                    <span />
                    <span />
                  </span>
                  {frame === option.id && (
                    <Check className="theme-check p-0.5" aria-hidden="true" />
                  )}
                  <span className="px-0.5">
                    <span className="theme-name block">{option.label}</span>
                    <span className="theme-note block">{option.note}</span>
                  </span>
                </button>
              ))}
            </div>

            <div className="panel-block mb-4">
              <h3 className="text-xs font-black text-foreground/70 uppercase tracking-widest mb-3">Film look</h3>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {FILTER_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setFilter(option.id as FilterType)}
                    data-testid={`button-filter-${option.id}`}
                    aria-pressed={filter === option.id}
                    className={`filter-choice ${filter === option.id ? 'filter-choice-active' : ''}`}
                  >
                    <span className="filter-thumb">
                      <img src={shots[0]} alt="" className={option.className} />
                    </span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="panel-block mb-6">
              <label className="flex justify-between text-xs font-black text-foreground/70 uppercase tracking-widest mb-3">
                <span className="flex items-center gap-2"><SlidersHorizontal className="w-4 h-4 text-primary" /> Theme strength</span>
                <span>{frameOpacity}%</span>
              </label>
              <input
                type="range"
                min="20"
                max="100"
                value={frameOpacity}
                onChange={(e) => setFrameOpacity(Number(e.target.value))}
                className="range-pink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Theme strength"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleRetake}
                data-testid="button-retake"
                className="col-span-1 sm:col-span-2 py-4 bg-foreground/5 hover:bg-foreground/10 text-foreground font-black rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] border border-foreground/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
              >
                <RefreshCw className="w-5 h-5" /> RETAKE SESSION
              </button>

              <button
                onClick={handleShare}
                disabled={isSaving}
                data-testid="button-share"
                className="py-4 bg-white hover:bg-primary/5 text-primary border-2 border-primary/20 hover:border-primary font-black rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
              >
                <Share2 className="w-5 h-5" /> SHARE
              </button>

              <button
                onClick={() => handleSave(false)}
                disabled={isSaving}
                data-testid="button-save"
                className="py-4 bg-primary text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/50"
              >
                <Download className="w-5 h-5" /> {isSaving ? 'SAVING...' : 'SAVE & EXIT'}
              </button>
            </div>

          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
