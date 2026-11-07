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
import { RefreshCw, Download, Share2, Check, X, Film, Sparkles } from 'lucide-react';
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
    const dpr = Math.max(3, typeof window !== 'undefined' ? (window.devicePixelRatio || 2) * 1.5 : 3);
    const targetHeight = 150;
    const renderScale = (targetHeight * dpr) / template.nh;
    const targetWidth = Math.round(template.nw * (targetHeight / template.nh));
    const renderW = Math.round(targetWidth * dpr);
    const renderH = Math.round(targetHeight * dpr);

    canvas.width = renderW;
    canvas.height = renderH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    const now = Date.now();

    let cancelled = false;
    const render = async () => {
      // Background
      if (template.paintBgAsync) {
        await template.paintBgAsync(ctx, renderW, renderH, renderScale, now);
      } else {
        template.paintBg(ctx, renderW, renderH, renderScale, now);
      }
      if (cancelled) return;
      // Foreground
      if (template.paintFgAsync) {
        await template.paintFgAsync(ctx, renderW, renderH, renderScale, now);
      } else {
        template.paintFg(ctx, renderW, renderH, renderScale, now);
      }
    };
    render();
    return () => { cancelled = true; };
  }, [template]);

  return (
    <button
      onClick={onClick}
      data-testid={`button-artisan-${template.id}`}
      aria-pressed={isSelected}
      className={`group relative flex flex-col items-center justify-between p-2.5 rounded-2xl transition-colors duration-150 focus:outline-none cursor-pointer ${
        isSelected
          ? 'bg-primary/[0.08] border-2 border-primary ring-2 ring-primary/20 shadow-sm'
          : 'bg-white dark:bg-zinc-800/90 hover:bg-foreground/[0.02] border-2 border-black/10 dark:border-white/10 hover:border-foreground/30 shadow-xs'
      }`}
    >
      <div className="w-full flex items-center justify-center py-2 min-h-[148px]">
        <div className="rounded-[4px] overflow-hidden shadow-sm bg-black/[0.04] p-1 border border-black/10 flex items-center justify-center">
          <canvas ref={canvasRef} className="block pointer-events-none w-auto max-h-[140px] object-contain rounded-[2px]" />
        </div>
      </div>
      <div className="mt-1 text-center w-full px-1 pb-1">
        <span className={`block text-[11.5px] font-black tracking-tight truncate leading-tight ${isSelected ? 'text-primary' : 'text-foreground'}`}>
          {template.label}
        </span>
        <span className="inline-block text-[9px] font-bold text-foreground/50 tracking-wider uppercase leading-tight mt-1 px-1.5 py-0.5 rounded-md bg-foreground/[0.04]">
          {template.slots.length} Photos
        </span>
      </div>
      {isSelected && (
        <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-md ring-2 ring-white dark:ring-zinc-900 z-20">
          <Check className="w-3 h-3 text-white stroke-[3]" />
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
    ? 'border border-white/35 bg-white/15 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]'
    : 'border border-black/20 bg-black/10 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]';

  const inkClass = option.dark ? 'strip-ink-light' : 'strip-ink-dark';

  const slotCount = layout === 'horizontal-3' ? 3 : 4;

  const miniGridClass = layout === 'vertical-4'
    ? 'grid-cols-1 w-full max-w-[58px]'
    : layout === 'quad-4'
      ? 'grid-cols-2 w-full max-w-[80px]'
      : 'grid-cols-3 w-full max-w-[98px]';

  const miniShellClass = layout === 'vertical-4'
    ? 'max-w-[76px]'
    : layout === 'quad-4'
      ? 'max-w-[98px]'
      : 'max-w-[116px]';

  return (
    <button
      onClick={onClick}
      data-testid={`button-frame-${option.id}`}
      aria-pressed={isSelected}
      className={`group relative flex flex-col items-center justify-between p-2.5 rounded-2xl transition-colors duration-150 focus:outline-none cursor-pointer ${
        isSelected
          ? 'bg-primary/[0.08] border-2 border-primary ring-2 ring-primary/20 shadow-sm'
          : 'bg-white dark:bg-zinc-800/90 hover:bg-foreground/[0.02] border-2 border-black/10 dark:border-white/10 hover:border-foreground/30 shadow-xs'
      }`}
    >
      <div className="w-full flex items-center justify-center py-2 min-h-[148px]">
        <div className={`relative overflow-hidden w-full p-2 rounded-[6px] ${miniShellClass} shadow-md border border-black/10`}>
          {/* Theme Background */}
          <div className={`absolute inset-0 z-0 ${option.className}`} />

          {/* Empty Photo Slots */}
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

      <div className="mt-1 text-center w-full px-1 pb-1">
        <span className={`block text-[11.5px] font-black tracking-tight truncate leading-tight ${isSelected ? 'text-primary' : 'text-foreground'}`}>
          {option.label}
        </span>
        <span className="inline-block text-[9px] font-bold text-foreground/50 tracking-wider uppercase leading-tight mt-1 px-1.5 py-0.5 rounded-md bg-foreground/[0.04]">
          {option.note}
        </span>
      </div>

      {isSelected && (
        <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-md ring-2 ring-white dark:ring-zinc-900 z-20">
          <Check className="w-3 h-3 text-white stroke-[3]" />
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
    saveMemory, clearShots, removeShots, setLatestStrip,
  } = useAppContext();


  const [isSaving, setIsSaving] = useState(false);
  const [category, setCategory] = useState<TabMode>(() => (sessionStorage.getItem('ps_edit_category') as TabMode) || 'booth');
  const [artisanId, setArtisanId] = useState<ArtisanTemplateId>(() => (sessionStorage.getItem('ps_edit_artisan') as ArtisanTemplateId) || 'port-archive');
  const [showArtisanWarning, setShowArtisanWarning] = useState(false);
  const [showRetakeModal, setShowRetakeModal] = useState(false);
  const [selectedRetakeIndexes, setSelectedRetakeIndexes] = useState<number[]>([]);
  const [excludedShotIndex, setExcludedShotIndex] = useState<number>(() => {
    const s = sessionStorage.getItem('ps_edit_excluded');
    return s ? parseInt(s, 10) : 3;
  });
  const [hasPickedExclusion, setHasPickedExclusion] = useState(() => sessionStorage.getItem('ps_edit_picked') === 'true');

  useEffect(() => sessionStorage.setItem('ps_edit_category', category), [category]);
  useEffect(() => sessionStorage.setItem('ps_edit_artisan', artisanId), [artisanId]);
  useEffect(() => sessionStorage.setItem('ps_edit_excluded', excludedShotIndex.toString()), [excludedShotIndex]);
  useEffect(() => sessionStorage.setItem('ps_edit_picked', hasPickedExclusion.toString()), [hasPickedExclusion]);

  useEffect(() => {
    // Prevent accidental back navigation from escaping /edit to /studio
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
      window.location.reload();
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const artisanCanvasRef = useRef<HTMLCanvasElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const sessionDate = useMemo(() => Date.now(), []);

  const activeArtisan = getArtisanTemplate(artisanId);
  const isArtisan = category === 'artisan';

  const activeShots = useMemo(() => {
    if (shots.length === 4 && isArtisan && activeArtisan?.slots.length === 3) {
      return shots.filter((_, i) => i !== excludedShotIndex);
    }
    return shots;
  }, [shots, isArtisan, activeArtisan, excludedShotIndex]);

  const activeFrame = getFrameOption(frame);
  const stripFilterClass = getFilterOption(filter).className;
  const visibleFrames = isArtisan ? [] : FRAME_OPTIONS.filter((o) => o.category === (category as FrameCategory));

  useEffect(() => {
    if (!isArtisan || activeShots.length === 0) return;
    let isCancelled = false;

    const canvas = artisanCanvasRef.current;
    if (!canvas) return;

    const template = getArtisanTemplate(artisanId);
    const dpr = Math.max(2, typeof window !== 'undefined' ? window.devicePixelRatio || 2 : 2);
    const baseHeight = 1200;
    const scale = (baseHeight * dpr) / template.nh;
    const targetWidth = Math.round(template.nw * scale);
    const targetHeight = Math.round(template.nh * scale);

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const render = async () => {
      // 1. Instant background + placeholder render
      if (template.paintBgAsync) {
        await template.paintBgAsync(ctx, targetWidth, targetHeight, scale, sessionDate);
      } else {
        template.paintBg(ctx, targetWidth, targetHeight, scale, sessionDate);
      }
      if (isCancelled) return;
      if (template.paintFgAsync) {
        await template.paintFgAsync(ctx, targetWidth, targetHeight, scale, sessionDate);
      } else {
        template.paintFg(ctx, targetWidth, targetHeight, scale, sessionDate);
      }
      if (isCancelled) return;

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

      const images = await Promise.all(
        template.slots.map((_, i) => loadPhoto(activeShots[i] ?? activeShots[activeShots.length - 1]))
      );

      if (isCancelled || !artisanCanvasRef.current) return;
      const c = artisanCanvasRef.current;
      const cctx = c.getContext('2d');
      if (!cctx) return;
      cctx.imageSmoothingEnabled = true;
      cctx.imageSmoothingQuality = 'high';

      // Redraw background
      if (template.paintBgAsync) {
        await template.paintBgAsync(cctx, targetWidth, targetHeight, scale, sessionDate);
      } else {
        template.paintBg(cctx, targetWidth, targetHeight, scale, sessionDate);
      }

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
      if (template.paintFgAsync) {
        await template.paintFgAsync(cctx, targetWidth, targetHeight, scale, sessionDate);
      } else {
        template.paintFg(cctx, targetWidth, targetHeight, scale, sessionDate);
      }
    };

    render();

    return () => {
      isCancelled = true;
    };
  }, [isArtisan, artisanId, activeShots, filter, sessionDate]);

  const handleOpenRetakeModal = () => {
    setSelectedRetakeIndexes([]);
    setShowRetakeModal(true);
  };

  const toggleRetakeIndex = (index: number) => {
    setSelectedRetakeIndexes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleConfirmRetakeSelected = () => {
    if (selectedRetakeIndexes.length === 0) return;
    if (selectedRetakeIndexes.length === shots.length) {
      clearShots();
    } else {
      removeShots(selectedRetakeIndexes);
    }
    setShowRetakeModal(false);
    sessionStorage.setItem('ps_retaking', '1');
    setLocation('/studio');
  };

  const handleRetakeAll = () => {
    clearShots();
    setShowRetakeModal(false);
    sessionStorage.setItem('ps_retaking', '1');
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
    if (activeShots.length === 0) return '';
    const template = getArtisanTemplate(artisanId);

    const photos = await Promise.all(
      template.slots.map((_, i) => {
        const src = activeShots[i] ?? activeShots[activeShots.length - 1];
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
      const saved = await saveMemory({
        id: createMemoryId(),
        url: galleryUrl,
        date: Date.now(),
        layout,
        frame: isArtisan ? artisanId : frame,
        mimeType: 'image/jpeg',
      });
      return saved;
    } catch {
      return false;
    }
  };

  const executeDownload = async (dataUrl: string) => {
    await downloadImage(dataUrl, `pinksnap-${Date.now()}.png`, { silent: true });
  };

  const handleSave = async (skipDownload = false) => {
    if (shots.length === 0) return;
    setIsSaving(true);

    try {
      const dataUrl = await getOutputImage();
      if (!dataUrl) throw new Error('empty strip');

      setLatestStrip(dataUrl);

      // Save to the in-app gallery FIRST, before triggering any download or
      // navigation.  This prevents the race condition where the 'Save & Exit'
      // navigates away before the async gallery-preview generation finishes
      // (especially on slower iOS devices).
      const stored = await saveToGallery(dataUrl);

      if (!skipDownload) {
        try {
          sessionStorage.setItem('ps_strip_autodownloaded', 'started');
        } catch {
          // ignore quota / private-mode failures
        }
        void executeDownload(dataUrl)
          .then(() => {
            try { sessionStorage.setItem('ps_strip_autodownloaded', 'done'); } catch { /* ignore */ }
          })
          .catch(() => {
            try { sessionStorage.removeItem('ps_strip_autodownloaded'); } catch { /* ignore */ }
          });
      }

      toast({
        title: 'Strip saved!',
        description: stored
          ? 'Your photo strip is downloading and was added to your gallery.'
          : 'The strip is downloading, but this device could not keep a gallery copy.',
      });

      // Navigate to printing loading screen - user can't go back
      setLocation('/printing', { replace: true });
    } catch (err) {
      // If the user dismissed the iOS share sheet, don't treat it as an error.
      if (err instanceof DOMException && err.name === 'AbortError') {
        // silently allow them to retry
      } else {
        toast({
          title: 'Download failed',
          description: 'We could not save the strip. Try again in a moment.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    if (shots.length === 0) return;
    setIsSaving(true);

    try {
      const dataUrl = await getOutputImage();

      // Always save to gallery first
      await saveToGallery(dataUrl);

      if (navigator.share && navigator.canShare) {
        const blob = dataUrlToBlob(dataUrl);
        const file = new File([blob], `pinksnap-${Date.now()}.png`, { type: 'image/png' });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'My PinkSnap',
            text: 'Check out my photobooth strip from PinkSnap!',
            files: [file],
          });
          return;
        }
      }

      toast({
        title: 'Sharing unavailable',
        description: 'Image will be saved to your device instead.',
      });
      await executeDownload(dataUrl);
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
        if (dataUrl) await executeDownload(dataUrl);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // If shots are lost (e.g., page refresh), seamlessly send them back to the studio
  useEffect(() => {
    if (shots.length === 0) {
      setLocation('/studio', { replace: true });
    }
  }, [shots.length, setLocation]);

  if (shots.length === 0) {
    return null;
  }

  const gridClass = layout === 'vertical-4'
    ? 'grid-cols-1 w-full max-w-[100px] sm:max-w-[130px] xl:max-w-[148px]'
    : layout === 'quad-4'
      ? 'grid-cols-2 w-full max-w-[148px] sm:max-w-[190px] xl:max-w-[218px]'
      : 'grid-cols-3 w-full max-w-[180px] sm:max-w-[235px] xl:max-w-[272px]';

  let shellClass = layout === 'vertical-4'
    ? 'max-w-[125px] sm:max-w-[158px] xl:max-w-[175px]'
    : layout === 'quad-4'
      ? 'max-w-[170px] sm:max-w-[218px] xl:max-w-[248px]'
      : 'max-w-[208px] sm:max-w-[265px] xl:max-w-[302px]';

  if (isArtisan && activeArtisan) {
    const aspect = activeArtisan.nw / activeArtisan.nh;
    if (aspect < 0.6) {
      shellClass = 'max-w-[124px] sm:max-w-[162px] xl:max-w-[180px]';
    } else if (aspect < 1.0) {
      shellClass = 'max-w-[170px] sm:max-w-[218px] xl:max-w-[248px]';
    } else {
      shellClass = 'max-w-[208px] sm:max-w-[265px] xl:max-w-[302px]';
    }
  }

  const matteClass = activeFrame.dark ? 'strip-matte-light' : 'strip-matte-dark';
  const inkClass = activeFrame.dark ? 'strip-ink-light' : 'strip-ink-dark';

  return (
    <div className="relative flex flex-col h-dvh overflow-hidden bg-[#faf7f9] dark:bg-[#121013]">
      {/* Ambient photobooth studio overhead spotlight glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[520px] bg-gradient-to-b from-primary/15 via-primary/5 to-transparent rounded-full blur-[140px] -z-0" />

      <TopNav onBack={() => window.location.reload()} />

      <main className="relative z-10 flex-1 overflow-y-auto flex flex-col items-center px-4 py-6 sm:px-6 sm:py-8">
        {/* Booth Header */}
        <div className="text-center mb-6 sm:mb-8 w-full max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-black text-[10px] tracking-[0.2em] uppercase mb-3 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span>Step 3 of 3 · Finishing Atelier</span>
          </div>
          <h1 className="font-hero text-[2.2rem] leading-[0.96] sm:text-4xl md:text-5xl mt-2 mb-2 text-foreground">
            CURATE YOUR <span className="text-primary">KEEPSAKE.</span>
          </h1>
          <p className="text-[11.5px] sm:text-xs font-semibold text-foreground/50 uppercase tracking-[0.2em] leading-relaxed">
            Inspect your strip, calibrate analog film tone & select custom frame
          </p>
        </div>

        <div className="flex flex-col xl:flex-row gap-6 sm:gap-8 xl:gap-10 w-full max-w-7xl items-center xl:items-start justify-center pb-14">

          {/* ── LEFT: Preview (Clean photobooth strip display) ── */}
          <div 
            className="edit-card w-full flex justify-center shrink-0 xl:w-auto xl:sticky xl:top-6"
            onContextMenu={(e) => e.preventDefault()}
          >
            {isArtisan ? (
              <div className={`strip-shell relative overflow-hidden w-full ${shellClass}`}>
                <canvas ref={artisanCanvasRef} className="block pointer-events-none w-full h-auto" />
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

          {/* ── RIGHT: Physical Photobooth Console ── */}
          <div className="flex-1 w-full bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl rounded-[32px] border border-black/10 dark:border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)] p-6 sm:p-8 flex flex-col">

            {/* Atelier Studio HUD Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-6 border-b border-foreground/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-[#d81b60] flex items-center justify-center text-white shadow-md shadow-primary/25">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-[0.16em] text-foreground">
                    FINISHING ATELIER
                  </h2>
                  <p className="text-[10.5px] font-medium text-foreground/50 tracking-wider uppercase">
                    Curate your custom keepsake
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl bg-foreground/[0.04] border border-foreground/10 text-foreground/75">
                  {shots.length} SHOTS CAPTURED
                </span>
              </div>
            </div>

            {/* Collection Tabs: Classic vs Artisan */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2.5 px-1">
                <span className="text-[10.5px] font-black uppercase tracking-[0.2em] text-foreground/60">
                  FRAME COLLECTION
                </span>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-primary">
                  {category === 'artisan' ? 'Artisan Originals (4)' : 'Classic Booth Editions (8)'}
                </span>
              </div>
              <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-foreground/[0.05] border border-foreground/8 gap-1.5">
                <button
                  type="button"
                  onClick={() => setCategory('booth')}
                  aria-pressed={category === 'booth'}
                  data-testid="button-category-booth"
                  className={`py-3 px-4 rounded-xl text-xs font-black tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                    category === 'booth'
                      ? 'bg-white dark:bg-zinc-800 text-primary shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-black/5 dark:border-white/10'
                      : 'text-foreground/60 hover:text-foreground hover:bg-foreground/[0.03]'
                  }`}
                >
                  PINKSNAP CLASSIC
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('artisan')}
                  aria-pressed={category === 'artisan'}
                  data-testid="button-category-artisan"
                  className={`py-3 px-4 rounded-xl text-xs font-black tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                    category === 'artisan'
                      ? 'bg-white dark:bg-zinc-800 text-primary shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-black/5 dark:border-white/10'
                      : 'text-foreground/60 hover:text-foreground hover:bg-foreground/[0.03]'
                  }`}
                >
                  ARTISAN ARCHIVE
                </button>
              </div>
            </div>

            {/* Theme Swatch Deck */}
            {isArtisan ? (
              <div className="mb-7">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-3.5 mb-6" onContextMenu={(e) => e.preventDefault()}>
                  {ARTISAN_TEMPLATES.map((tpl) => (
                    <ArtisanThumbnailCard
                      key={tpl.id}
                      template={tpl}
                      isSelected={artisanId === tpl.id}
                      onClick={() => {
                        if (layout !== 'horizontal-3' && tpl.slots.length === 3 && !hasPickedExclusion) {
                          setShowArtisanWarning(true);
                        }
                        setArtisanId(tpl.id);
                      }}
                    />
                  ))}
                </div>

                {/* Analog Film Look Palette */}
                <div className="p-4 sm:p-5 rounded-2xl bg-foreground/[0.03] border border-foreground/8 shadow-inner">
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2">
                      <Film className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[11px] font-black uppercase tracking-[0.18em] text-foreground/80">
                        ANALOG FILM EMULSION
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary px-2.5 py-0.5 rounded-lg bg-primary/10 border border-primary/20">
                      {getFilterOption(filter).label}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 sm:grid-cols-9 gap-2">
                    {FILTER_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setFilter(option.id as FilterType)}
                        data-testid={`button-filter-${option.id}`}
                        aria-pressed={filter === option.id}
                        className={`group relative flex flex-col items-center gap-1.5 p-1.5 rounded-xl transition-colors duration-150 focus:outline-none cursor-pointer ${
                          filter === option.id
                            ? 'bg-primary/10 ring-2 ring-primary shadow-xs'
                            : 'hover:bg-foreground/[0.04] opacity-75 hover:opacity-100'
                        }`}
                      >
                        <span
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full shadow-inner border flex items-center justify-center ${
                            filter === option.id ? 'border-primary ring-2 ring-primary/40' : 'border-black/15'
                          }`}
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
              <div className="mb-7">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-3.5 mb-6" onContextMenu={(e) => e.preventDefault()}>
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

                {/* Analog Film Look Palette */}
                <div className="p-4 sm:p-5 rounded-2xl bg-foreground/[0.03] border border-foreground/8 shadow-inner">
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2">
                      <Film className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[11px] font-black uppercase tracking-[0.18em] text-foreground/80">
                        ANALOG FILM EMULSION
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary px-2.5 py-0.5 rounded-lg bg-primary/10 border border-primary/20">
                      {getFilterOption(filter).label}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 sm:grid-cols-9 gap-2">
                    {FILTER_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setFilter(option.id as FilterType)}
                        data-testid={`button-filter-${option.id}`}
                        aria-pressed={filter === option.id}
                        className={`group relative flex flex-col items-center gap-1.5 p-1.5 rounded-xl transition-colors duration-150 focus:outline-none cursor-pointer ${
                          filter === option.id
                            ? 'bg-primary/10 ring-2 ring-primary shadow-xs'
                            : 'hover:bg-foreground/[0.04] opacity-75 hover:opacity-100'
                        }`}
                      >
                        <span
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full shadow-inner border flex items-center justify-center ${
                            filter === option.id ? 'border-primary ring-2 ring-primary/40' : 'border-black/15'
                          }`}
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
            )}

            {/* Atelier Action Suite */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-auto pt-2">
              <button
                onClick={handleOpenRetakeModal}
                data-testid="button-retake"
                className="col-span-1 sm:col-span-2 py-3.5 px-4 bg-foreground/[0.03] hover:bg-foreground/[0.07] text-foreground/80 hover:text-foreground font-black text-xs sm:text-sm tracking-wider uppercase rounded-2xl flex items-center justify-center gap-2.5 transition-all active:scale-[0.99] border border-foreground/10 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-primary" /> RETAKE A SHOT
              </button>

              <button
                onClick={handleShare}
                disabled={isSaving}
                data-testid="button-share"
                className="py-4 px-5 bg-white dark:bg-zinc-800 hover:bg-foreground/[0.03] text-foreground font-black text-xs sm:text-sm tracking-wider uppercase rounded-2xl flex items-center justify-center gap-2 border border-foreground/15 hover:border-foreground/30 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-primary" /> SHARE STRIP
              </button>

              <button
                onClick={() => handleSave(false)}
                disabled={isSaving}
                data-testid="button-save"
                className="py-4 px-5 bg-gradient-to-r from-[#f53d89] via-[#ff4d94] to-[#f53d89] text-white font-black text-xs sm:text-sm tracking-wider uppercase rounded-2xl flex items-center justify-center gap-2.5 shadow-[0_14px_30px_-8px_rgba(245,61,137,0.5)] hover:shadow-[0_18px_36px_-8px_rgba(245,61,137,0.65)] hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer border border-white/20"
              >
                <Download className="w-4 h-4" /> {isSaving ? 'PREPARING PRINT...' : 'PRINT & SAVE STRIP'}
              </button>
            </div>

          </div>
        </div>
      </main>

      <BottomNav />
      {showArtisanWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
            onClick={() => setShowArtisanWarning(false)}
          />

          {/* Modal Card */}
          <div className="relative bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 text-center border border-black/10 dark:border-white/10 z-10">

            {/* Top decorative pill */}
            <div className="w-12 h-1 rounded-full bg-foreground/15 mx-auto mb-4" />

            {/* Title */}
            <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-foreground mb-1">
              3-SHOT STRIP SELECTION
            </h3>
            <p className="text-xs text-foreground/60 mb-5 leading-relaxed max-w-[300px] mx-auto">
              This layout displays 3 photos. Select the one you would like to <span className="font-bold text-red-500">skip</span>.
            </p>

            {/* Photo grid — 2×2 */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {shots.map((shot, i) => {
                const isExcluded = excludedShotIndex === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setExcludedShotIndex(i)}
                    className={`relative aspect-[4/3] rounded-2xl overflow-hidden focus:outline-none transition-all duration-150 cursor-pointer ${
                      isExcluded
                        ? 'opacity-60 ring-2 ring-red-400/50 shadow-inner'
                        : 'ring-2 ring-primary shadow-md hover:ring-primary/80'
                    }`}
                  >
                    <img
                      src={shot}
                      alt={`Shot ${i + 1}`}
                      className={`w-full h-full object-cover transition-all ${isExcluded ? 'grayscale' : ''}`}
                      draggable={false}
                      onContextMenu={(e) => e.preventDefault()}
                    />

                    {/* Excluded overlay */}
                    {isExcluded && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="bg-red-500 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-md">
                          SKIPPED
                        </span>
                      </div>
                    )}

                    {/* Kept indicator */}
                    {!isExcluded && (
                      <>
                        <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-md border border-white">
                          <Check className="w-3 h-3 text-white stroke-[3]" />
                        </div>
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent pt-4 pb-1.5 px-2">
                          <span className="text-white font-black text-[10px] tracking-wider">
                            SHOT {i + 1}
                          </span>
                        </div>
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Confirm button */}
            <button
              onClick={() => {
                setHasPickedExclusion(true);
                setShowArtisanWarning(false);
              }}
              className="w-full py-3.5 px-5 text-white font-black text-xs sm:text-sm tracking-wider uppercase rounded-2xl bg-primary hover:bg-[#e02d77] shadow-lg shadow-primary/30 hover:shadow-xl active:scale-[0.98] transition-all cursor-pointer"
            >
              CONFIRM SELECTION
            </button>

            {/* Note */}
            <p className="mt-3.5 text-[10.5px] text-foreground/45 leading-relaxed">
              You can change which photo to skip anytime by switching templates.
            </p>
          </div>
        </div>
      )}

      {/* ── Retake Selection Modal ─────────────────────────────────────── */}
      {showRetakeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
            onClick={() => setShowRetakeModal(false)}
          />

          <div className="relative bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md p-6 sm:p-7 border border-black/10 dark:border-white/10 shadow-2xl z-10 flex flex-col">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-foreground">
                  RETAKE SELECTION
                </h3>
                <p className="text-xs text-foreground/60 mt-1 leading-relaxed">
                  Tap the shot(s) you would like to retake. All other shots are kept.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRetakeModal(false)}
                className="p-1.5 -mr-1 text-foreground/40 hover:text-foreground rounded-lg transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 my-4">
              {shots.map((shot, i) => {
                const isSelectedForRetake = selectedRetakeIndexes.includes(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleRetakeIndex(i)}
                    className={`relative aspect-[4/3] rounded-2xl overflow-hidden text-left cursor-pointer transition-all duration-150 ${
                      isSelectedForRetake
                        ? 'ring-2 ring-red-500 shadow-md'
                        : 'border border-foreground/15 hover:border-foreground/30 shadow-sm'
                    }`}
                  >
                    <img
                      src={shot}
                      alt={`Shot ${i + 1}`}
                      className={`w-full h-full object-cover transition-all ${
                        isSelectedForRetake ? 'opacity-50 grayscale' : 'opacity-100'
                      }`}
                    />

                    {isSelectedForRetake ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/25">
                        <span className="bg-red-500 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md shadow-md">
                          RETAKE
                        </span>
                      </div>
                    ) : (
                      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[9.5px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm">
                        SHOT {i + 1}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-2.5 mt-1">
              <button
                type="button"
                onClick={handleConfirmRetakeSelected}
                disabled={selectedRetakeIndexes.length === 0}
                className={`w-full py-3.5 px-4 font-black text-xs sm:text-sm tracking-wider uppercase rounded-2xl transition-all ${
                  selectedRetakeIndexes.length > 0
                    ? 'bg-primary hover:bg-[#e02d77] text-white cursor-pointer shadow-lg shadow-primary/30 active:scale-[0.98]'
                    : 'bg-foreground/[0.05] text-foreground/35 border border-foreground/10 cursor-not-allowed'
                }`}
              >
                {selectedRetakeIndexes.length === 0
                  ? 'Select a shot to retake'
                  : `Retake ${selectedRetakeIndexes.length} selected ${selectedRetakeIndexes.length === 1 ? 'shot' : 'shots'}`}
              </button>

              <div className="flex items-center justify-between text-xs pt-1 px-1">
                <button
                  type="button"
                  onClick={handleRetakeAll}
                  className="text-foreground/50 hover:text-foreground font-semibold py-1 cursor-pointer transition-colors"
                >
                  Retake all shots
                </button>
                <button
                  type="button"
                  onClick={() => setShowRetakeModal(false)}
                  className="text-foreground/50 hover:text-foreground font-semibold py-1 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
