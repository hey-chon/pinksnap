import { useEffect, useMemo, useRef, useState } from 'react';
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
  FrameType,
  FrameOption,
  ARTISAN_TEMPLATES,
  ArtisanTemplate,
  ArtisanTemplateId,
  getArtisanTemplate,
  renderArtisanStrip,
} from '@/lib/customization';
import { RefreshCw, Download, Share2, Check, Sparkles, ImageIcon } from 'lucide-react';
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

type TabMode = FrameCategory | 'artisan';

function ArtisanThumbnailCard({
  template,
  isSelected,
  onClick,
}: {
  template: ArtisanTemplate;
  isSelected: boolean;
  onClick: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const targetHeight = 150;
    const scale = targetHeight / template.nh;
    const targetWidth = Math.round(template.nw * scale);
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const now = Date.now();
    // Paint template background with empty slots & decorations (no user photos)
    template.paintBg(ctx, targetWidth, targetHeight, scale, now);
    template.paintFg(ctx, targetWidth, targetHeight, scale, now);
  }, [template]);

  return (
    <button
      onClick={onClick}
      data-testid={`button-artisan-${template.id}`}
      aria-pressed={isSelected}
      className={`group relative flex flex-col items-center justify-between p-2 rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:scale-95 ${
        isSelected
          ? 'bg-primary/10 ring-2 ring-primary shadow-md shadow-primary/25 scale-[1.02]'
          : 'bg-foreground/[0.03] hover:bg-foreground/[0.06] ring-1 ring-foreground/10 hover:ring-primary/40'
      }`}
    >
      <div className="w-full flex items-center justify-center py-1.5 min-h-[145px]">
        <div className="rounded-[4px] overflow-hidden shadow-md bg-black/5 flex items-center justify-center border border-black/10">
          <canvas ref={canvasRef} className="block pointer-events-none w-auto max-h-[145px] object-contain" />
        </div>
      </div>
      <div className="mt-1.5 text-center w-full px-0.5">
        <span className={`block text-[10.5px] font-black truncate leading-tight ${isSelected ? 'text-primary' : 'text-foreground/85'}`}>
          {template.label}
        </span>
        <span className="block text-[8.5px] text-foreground/45 truncate leading-tight mt-0.5">
          {template.slots.length} photos
        </span>
      </div>
      {isSelected && (
        <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center shadow-md ring-2 ring-white z-20">
          <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
        </div>
      )}
    </button>
  );
}

function FrameThumbnailCard({
  option,
  layout,
  isSelected,
  onClick,
}: {
  option: FrameOption;
  layout: 'vertical-4' | 'quad-4' | 'horizontal-3';
  isSelected: boolean;
  onClick: () => void;
}) {
  const matteBorder = option.dark
    ? 'border border-white/35 bg-white/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]'
    : 'border border-black/20 bg-black/8 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]';

  const inkClass = option.dark ? 'strip-ink-light' : 'strip-ink-dark';

  const slotCount = layout === 'horizontal-3' ? 3 : 4;

  const miniGridClass = layout === 'vertical-4'
    ? 'grid-cols-1 w-full max-w-[62px]'
    : layout === 'quad-4'
      ? 'grid-cols-2 w-full max-w-[84px]'
      : 'grid-cols-3 w-full max-w-[102px]';

  const miniShellClass = layout === 'vertical-4'
    ? 'max-w-[80px]'
    : layout === 'quad-4'
      ? 'max-w-[102px]'
      : 'max-w-[120px]';

  return (
    <button
      onClick={onClick}
      data-testid={`button-frame-${option.id}`}
      aria-pressed={isSelected}
      className={`group relative flex flex-col items-center justify-between p-2 rounded-xl transition-all duration-200 focus:outline-none active:scale-95 ${
        isSelected
          ? 'bg-primary/10 ring-2 ring-primary shadow-md shadow-primary/25 scale-[1.02]'
          : 'bg-foreground/[0.03] hover:bg-foreground/[0.06] ring-1 ring-foreground/10 hover:ring-primary/40'
      }`}
    >
      <div className="w-full flex items-center justify-center py-1.5 min-h-[145px]">
        <div className={`relative overflow-hidden w-full p-2 rounded-[6px] ${miniShellClass} shadow-md border border-black/10`}>
          {/* Theme Background */}
          <div className={`absolute inset-0 z-0 ${option.className}`} />

          {/* Empty Photo Slots with subtle rounded corners and generous spacing */}
          <div className={`relative z-10 grid gap-1.5 sm:gap-2 mx-auto ${miniGridClass}`}>
            {Array.from({ length: slotCount }).map((_, i) => (
              <div
                key={i}
                className={`w-full aspect-[4/3] rounded-[3px] ${matteBorder}`}
              />
            ))}
          </div>

          {/* Strip Footer */}
          <div className={`relative z-10 pt-2 pb-0.5 text-center font-black ${inkClass}`}>
            <span className="block text-[7px] leading-tight font-black tracking-tight">PINK</span>
            <span className="block text-[7px] leading-tight strip-brand-accent font-black tracking-tight">SNAP</span>
          </div>
        </div>
      </div>

      <div className="mt-1.5 text-center w-full px-0.5">
        <span className={`block text-[10.5px] font-black truncate leading-tight ${isSelected ? 'text-primary' : 'text-foreground/85'}`}>
          {option.label}
        </span>
        <span className="block text-[8.5px] text-foreground/45 truncate leading-tight mt-0.5">
          {option.note}
        </span>
      </div>

      {isSelected && (
        <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center shadow-md ring-2 ring-white z-20">
          <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
        </div>
      )}
    </button>
  );
}

export default function Edit() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const {
    shots, addShot, layout, frame, setFrame, filter, setFilter,
    saveMemory, clearShots,
  } = useAppContext();


  const [isSaving, setIsSaving] = useState(false);
  const [category, setCategory] = useState<TabMode>('booth');
  const [artisanId, setArtisanId] = useState<ArtisanTemplateId>('theater-show');
  const artisanCanvasRef = useRef<HTMLCanvasElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const sessionDate = useMemo(() => Date.now(), []);

  const isArtisan = category === 'artisan';
  const activeFrame = getFrameOption(frame);
  const activeArtisan = getArtisanTemplate(artisanId);
  const stripFilterClass = getFilterOption(filter).className;
  const visibleFrames = isArtisan ? [] : FRAME_OPTIONS.filter((o) => o.category === (category as FrameCategory));

  useEffect(() => {
    if (!isArtisan || shots.length === 0) return;
    let isCancelled = false;

    const canvas = artisanCanvasRef.current;
    if (!canvas) return;

    const template = getArtisanTemplate(artisanId);
    const targetHeight = Math.min(460, Math.round(window.innerHeight * 0.52));
    const scale = targetHeight / template.nh;
    const targetWidth = Math.round(template.nw * scale);

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Instant background + placeholder render
    template.paintBg(ctx, targetWidth, targetHeight, scale, sessionDate);
    template.paintFg(ctx, targetWidth, targetHeight, scale, sessionDate);

    // 2. Load and composite photos
    const loadPhoto = (src: string): Promise<HTMLImageElement | null> =>
      new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const done = () => resolve(img);
        img.onload = done;
        img.onerror = () => resolve(null);
        img.src = src;
        if (img.complete && img.naturalWidth > 0) done();
      });

    Promise.all(
      template.slots.map((_, i) => loadPhoto(shots[i] ?? shots[shots.length - 1]))
    ).then((images) => {
      if (isCancelled || !artisanCanvasRef.current) return;
      const c = artisanCanvasRef.current;
      const cctx = c.getContext('2d');
      if (!cctx) return;

      // Redraw background
      template.paintBg(cctx, targetWidth, targetHeight, scale, sessionDate);

      // Draw each photo in slot
      template.slots.forEach((slot, i) => {
        const rawImg = images[i];
        if (!rawImg) return;
        const photo = filterImageForCanvas(rawImg, filter);

        const sx = slot.x * scale, sy = slot.y * scale;
        const sw = slot.w * scale, sh = slot.h * scale;
        const r = Math.min(slot.r * scale, sw / 2, sh / 2);

        cctx.save();
        roundedRect(cctx, sx, sy, sw, sh, r);
        cctx.clip();

        const ir = photo.width / photo.height, sr2 = sw / sh;
        let srcX = 0, srcY = 0, srcW = photo.width, srcH = photo.height;
        if (ir > sr2) { srcW = photo.height * sr2; srcX = (photo.width - srcW) / 2; }
        else { srcH = photo.width / sr2; srcY = (photo.height - srcH) / 2; }
        cctx.drawImage(photo, srcX, srcY, srcW, srcH, sx, sy, sw, sh);
        cctx.restore();
      });

      // Foreground overlays
      template.paintFg(cctx, targetWidth, targetHeight, scale, sessionDate);
    });

    return () => {
      isCancelled = true;
    };
  }, [isArtisan, artisanId, shots, filter, sessionDate]);

  const handleRetake = () => {
    clearShots();
    setLocation('/studio');
  };

  // ── Standard strip canvas renderer ────────────────────────────────────────
  const generateStripImage = async (): Promise<string> => {
    if (shots.length === 0) return '';

    const geometry = getStripGeometry(layout);
    const canvas = document.createElement('canvas');
    canvas.width = geometry.width;
    canvas.height = geometry.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    drawFrameBackground(ctx, frame, geometry.width, geometry.height, 100);

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
      ctx.strokeStyle = activeFrame.dark ? 'rgba(255,255,255,.32)' : 'rgba(31,29,43,.20)';
      ctx.lineWidth = 3.5;
      roundedRect(ctx, position.x, position.y, geometry.shotWidth, geometry.shotHeight, geometry.radius);
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

  // ── Artisan strip canvas renderer ──────────────────────────────────────────
  const generateArtisanImage = async (): Promise<string> => {
    if (shots.length === 0) return '';
    const template = getArtisanTemplate(artisanId);

    const photos = await Promise.all(
      template.slots.map((_, i) => {
        const src = shots[i] ?? shots[shots.length - 1];
        return new Promise<HTMLCanvasElement | null>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(filterImageForCanvas(img, filter));
          img.onerror = () => resolve(null);
          img.src = src;
        });
      })
    );

    return renderArtisanStrip(template, photos, sessionDate);
  };

  const getOutputImage = () => isArtisan ? generateArtisanImage() : generateStripImage();

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
      const dataUrl = await getOutputImage();
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
      const dataUrl = await getOutputImage();

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
        const dataUrl = await getOutputImage();
        if (dataUrl) await executeDownload(dataUrl, true);
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (shots.length === 0) {
    return (
      <div className="flex flex-col h-dvh">
        <TopNav backTo="/setup" />
        <main className="flex-1 flex flex-col items-center justify-center p-6">
          <p className="text-xl font-bold mb-6 text-foreground/60 tracking-wide uppercase">No shots captured yet.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => setLocation('/studio')}
              className="px-8 py-4 bg-primary text-white font-black rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform"
            >
              GO TO STUDIO
            </button>
            <button
              onClick={() => {
                const sampleColors = [
                  ['#ffd5e6', '#cceaff'],
                  ['#d7f5f0', '#ead6ff'],
                  ['#ffe0c7', '#ffd2ed'],
                  ['#d6e4ff', '#f9d7e8'],
                ];
                [0, 1, 2, 3].forEach((i) => {
                  const [start, end] = sampleColors[i % sampleColors.length];
                  addShot(`data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
                      <defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${start}"/><stop offset="1" stop-color="${end}"/></linearGradient></defs>
                      <rect width="1200" height="900" fill="url(#g)"/>
                      <circle cx="600" cy="380" r="140" fill="#fff" fill-opacity=".6"/>
                      <circle cx="600" cy="380" r="70" fill="${start}"/>
                      <text x="600" y="620" text-anchor="middle" font-family="sans-serif" font-size="52" font-weight="900" fill="#333">SAMPLE PHOTO ${i + 1}</text>
                    </svg>
                  `)}`);
                });
              }}
              className="px-6 py-4 bg-foreground/10 text-foreground font-black rounded-full hover:bg-foreground/15 active:scale-95 transition-all text-sm"
            >
              USE SAMPLE SHOTS
            </button>
          </div>
        </main>
      </div>
    );
  }

  const gridClass = layout === 'vertical-4'
    ? 'grid-cols-1 w-full max-w-[105px] sm:max-w-[135px] xl:max-w-[155px]'
    : layout === 'quad-4'
      ? 'grid-cols-2 w-full max-w-[155px] sm:max-w-[200px] xl:max-w-[230px]'
      : 'grid-cols-3 w-full max-w-[195px] sm:max-w-[250px] xl:max-w-[290px]';

  const shellClass = layout === 'vertical-4'
    ? 'max-w-[130px] sm:max-w-[165px] xl:max-w-[185px]'
    : layout === 'quad-4'
      ? 'max-w-[180px] sm:max-w-[230px] xl:max-w-[260px]'
      : 'max-w-[220px] sm:max-w-[280px] xl:max-w-[320px]';

  const matteClass = activeFrame.dark ? 'strip-matte-light' : 'strip-matte-dark';
  const inkClass = activeFrame.dark ? 'strip-ink-light' : 'strip-ink-dark';

  return (
    <div className="flex flex-col h-dvh">
      <TopNav backTo="/studio" />

      <main className="flex-1 overflow-y-auto flex flex-col items-center px-4 py-6 sm:px-6 sm:py-8">
        <div className="edit-heading text-center mb-6 sm:mb-8 w-full max-w-4xl">
          <span className="booth-heading-kicker mb-3">Step 3 of 3 · Print</span>
          <h1 className="font-display text-[2.35rem] leading-[.95] sm:text-5xl md:text-6xl mt-4 mb-3">
            <span className="text-foreground">CHOOSE YOUR </span><span className="text-primary">STRIP.</span>
          </h1>
          <p className="text-[11px] sm:text-xs font-bold text-primary uppercase tracking-[.18em] sm:tracking-[.24em] leading-relaxed">
            Pick a booth theme, set the mood, keep the print.
          </p>
        </div>

        <div className="flex flex-col xl:flex-row gap-6 sm:gap-8 xl:gap-10 w-full max-w-7xl items-center xl:items-start justify-center pb-14">

          {/* ── LEFT: Preview ───────────────────────────────────────────── */}
          <div className="edit-card w-full flex justify-center shrink-0 xl:w-auto xl:sticky xl:top-6">

            {isArtisan ? (
              <div className="flex flex-col items-center justify-center p-1">
                <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/60 bg-black/5">
                  <canvas ref={artisanCanvasRef} className="block pointer-events-none" />
                </div>
              </div>
            ) : (
              <div ref={stripRef} className={`strip-shell relative overflow-hidden w-full xl:max-w-none p-3 sm:p-4 ${shellClass}`}>
                <div className={`absolute inset-0 z-0 ${activeFrame.className}`} />

                <div className={`relative z-10 grid gap-2.5 sm:gap-3 mx-auto ${gridClass}`}>
                  {shots.map((shot, i) => (
                    <div key={i} className={`strip-photo ${matteClass}`}>
                      <img src={shot} alt={`Shot ${i + 1}`} className={stripFilterClass} />
                    </div>
                  ))}
                </div>

                <div className={`strip-footer relative z-10 pt-4 pb-2 text-center font-black ${inkClass}`}>
                  <span className="block text-[15px] sm:text-[17px] leading-[0.95]">PINK</span>
                  <span className="block text-[15px] sm:text-[17px] leading-[0.95] strip-brand-accent">SNAP</span>
                  <span className="strip-caption block pt-1.5 text-[7.5px] sm:text-[8.5px] font-extrabold tracking-[0.24em] uppercase opacity-75">
                    {formatStripDate(sessionDate)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Controls ─────────────────────────────────────────── */}
          <div className="edit-card flex-1 w-full booth-plate p-4 sm:p-6">

            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-primary flex-none" />
              <h2 className="font-display text-lg text-foreground/80 tracking-[.08em]">Themes</h2>
            </div>

            {/* Segment-style tabs */}
            <div className="ctrl-seg mb-5">
              <button
                type="button"
                onClick={() => setCategory('booth')}
                aria-pressed={category === 'booth'}
                data-testid="button-category-booth"
                className={`ctrl-seg-btn ${category === 'booth' ? 'ctrl-seg-active' : ''}`}
              >
                PINKSNAP
              </button>
              <button
                type="button"
                onClick={() => setCategory('artisan')}
                aria-pressed={category === 'artisan'}
                data-testid="button-category-artisan"
                className={`ctrl-seg-btn flex items-center gap-1 ${category === 'artisan' ? 'ctrl-seg-active' : ''}`}
              >
                <ImageIcon className="w-3 h-3" /> Artisan
              </button>
            </div>

            {isArtisan ? (
              /* ── Artisan template picker ── */
              <div className="mb-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 mb-5">
                  {ARTISAN_TEMPLATES.map((tpl) => (
                    <ArtisanThumbnailCard
                      key={tpl.id}
                      template={tpl}
                      isSelected={artisanId === tpl.id}
                      onClick={() => setArtisanId(tpl.id)}
                    />
                  ))}
                </div>

                {/* Film look */}
                <div className="panel-block">
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="ctrl-label">Film look</h3>
                    <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                      {getFilterOption(filter).label}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 sm:grid-cols-9 gap-1.5">
                    {FILTER_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setFilter(option.id as FilterType)}
                        data-testid={`button-filter-${option.id}`}
                        aria-pressed={filter === option.id}
                        className={`group relative flex flex-col items-center gap-1 p-1 rounded-xl transition-all duration-150 focus:outline-none active:scale-95 ${
                          filter === option.id
                            ? 'bg-primary/10 ring-2 ring-primary shadow-sm scale-[1.03]'
                            : 'hover:bg-foreground/[0.04] opacity-75 hover:opacity-100'
                        }`}
                      >
                        <span
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full shadow-inner border border-black/10 flex items-center justify-center transition-transform group-hover:scale-105"
                          style={{ background: option.shadeGradient }}
                        >
                          {filter === option.id && (
                            <Check className="w-3.5 h-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] stroke-[3]" />
                          )}
                        </span>
                        <span className={`text-[8.5px] sm:text-[9px] font-black truncate max-w-full tracking-tight ${filter === option.id ? 'text-primary' : 'text-foreground/75'}`}>
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* ── Standard theme picker ── */
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 mb-5">
                  {visibleFrames.map((option) => (
                    <FrameThumbnailCard
                      key={option.id}
                      option={option}
                      layout={layout}
                      isSelected={frame === option.id}
                      onClick={() => setFrame(option.id)}
                    />
                  ))}
                </div>

                {/* Film look */}
                <div className="panel-block mb-4">
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="ctrl-label">Film look</h3>
                    <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                      {getFilterOption(filter).label}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 sm:grid-cols-9 gap-1.5">
                    {FILTER_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setFilter(option.id as FilterType)}
                        data-testid={`button-filter-${option.id}`}
                        aria-pressed={filter === option.id}
                        className={`group relative flex flex-col items-center gap-1 p-1 rounded-xl transition-all duration-150 focus:outline-none active:scale-95 ${
                          filter === option.id
                            ? 'bg-primary/10 ring-2 ring-primary shadow-sm scale-[1.03]'
                            : 'hover:bg-foreground/[0.04] opacity-75 hover:opacity-100'
                        }`}
                      >
                        <span
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full shadow-inner border border-black/10 flex items-center justify-center transition-transform group-hover:scale-105"
                          style={{ background: option.shadeGradient }}
                        >
                          {filter === option.id && (
                            <Check className="w-3.5 h-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] stroke-[3]" />
                          )}
                        </span>
                        <span className={`text-[8.5px] sm:text-[9px] font-black truncate max-w-full tracking-tight ${filter === option.id ? 'text-primary' : 'text-foreground/75'}`}>
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

              </>
            )}

            {/* Action buttons — same for both modes */}
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
