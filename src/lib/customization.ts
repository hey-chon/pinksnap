export type FrameType =
  | 'classic'
  | 'vip'
  | 'rubynoir'
  | 'crimson'
  | 'vampire'
  | 'velvet'
  | 'rosegold'
  | 'emerald'
  | 'onyx'
  | 'filmstrip'
  | 'sepia'
  | 'kraft'
  | 'linen'
  | 'arcade'
  | 'midnight'
  | 'sunset'
  | 'y2k'
  | 'mint'
  | 'ocean'
  | 'white'
  | 'sky';

export type FilterType =
  | 'color'
  | 'bw'
  | 'noir'
  | 'vintage'
  | 'film'
  | 'faded'
  | 'warm'
  | 'cool'
  | 'candy';

export type FrameCategory = 'booth';

export type FrameOption = {
  id: FrameType;
  label: string;
  note: string;
  category: FrameCategory;
  className: string;
  dark: boolean;
  matte: string;
  paint: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
};

export const FRAME_CATEGORIES: { id: FrameCategory; label: string }[] = [
  { id: 'booth', label: 'PINKSNAP' },
];

function fill(ctx: CanvasRenderingContext2D, color: string, w: number, h: number) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
}

function verticalGradient(ctx: CanvasRenderingContext2D, w: number, h: number, stops: [number, string][]) {
  const gradient = ctx.createLinearGradient(0, 0, w * 0.35, h);
  stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}

function speckle(ctx: CanvasRenderingContext2D, w: number, h: number, color: string, step: number, radius: number) {
  ctx.fillStyle = color;
  for (let y = step / 2; y < h; y += step) {
    for (let x = step / 2; x < w; x += step) {
      const wobble = ((x * 7 + y * 13) % 17) - 8;
      ctx.beginPath();
      ctx.arc(x + wobble, y + wobble * 0.6, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function sprockets(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#f4f1ea';
  const holeW = 20;
  const holeH = 30;
  for (let y = 34; y < h - holeH; y += 62) {
    roundedRect(ctx, 14, y, holeW, holeH, 6);
    ctx.fill();
    roundedRect(ctx, w - 14 - holeW, y, holeW, holeH, 6);
    ctx.fill();
  }
}

export function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawCssTiledLinearGradient(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  tileW: number,
  tileH: number,
  angleDeg: number,
  color: string,
) {
  const tileCanvas = document.createElement('canvas');
  tileCanvas.width = tileW;
  tileCanvas.height = tileH;
  const tctx = tileCanvas.getContext('2d');
  if (!tctx) return;

  const rad = (angleDeg * Math.PI) / 180;
  const vx = Math.sin(rad);
  const vy = -Math.cos(rad);
  const D = 0.5 * (Math.abs(tileW * vx) + Math.abs(tileH * vy));

  const x0 = tileW / 2 - D * vx;
  const y0 = tileH / 2 - D * vy;
  const x1 = tileW / 2 + D * vx;
  const y1 = tileH / 2 + D * vy;

  const grad = tctx.createLinearGradient(x0, y0, x1, y1);
  grad.addColorStop(0, 'transparent');
  grad.addColorStop(0.42, 'transparent');
  grad.addColorStop(0.43, color);
  grad.addColorStop(0.57, color);
  grad.addColorStop(0.58, 'transparent');
  grad.addColorStop(1, 'transparent');

  tctx.fillStyle = grad;
  tctx.fillRect(0, 0, tileW, tileH);

  const pattern = ctx.createPattern(tileCanvas, 'repeat');
  if (pattern) {
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, w, h);
  }
}

export const FRAME_OPTIONS: FrameOption[] = [
  {
    id: 'classic',
    label: 'Classic',
    note: 'Pure black strip',
    category: 'booth',
    className: 'frame-classic',
    dark: true,
    matte: 'rgba(255,255,255,.22)',
    paint: (ctx, w, h) => {
      fill(ctx, '#000000', w, h);
    },
  },
  {
    id: 'vip',
    label: 'VIP Lounge',
    note: 'Black and gold',
    category: 'booth',
    className: 'frame-vip',
    dark: true,
    matte: 'rgba(226,183,106,.55)',
    paint: (ctx, w, h) => {
      fill(ctx, '#12100e', w, h);
      speckle(ctx, w, h, 'rgba(226,183,106,.32)', 54, 2.6);
      ctx.strokeStyle = 'rgba(226,183,106,.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(18, 18, w - 36, h - 36);
    },
  },
  {
    id: 'onyx',
    label: 'Midnight Onyx',
    note: 'Jet black & silver',
    category: 'booth',
    className: 'frame-onyx',
    dark: true,
    matte: 'rgba(220,225,235,.45)',
    paint: (ctx, w, h) => {
      verticalGradient(ctx, w, h, [
        [0, '#0a0a0c'],
        [0.5, '#141419'],
        [1, '#050507'],
      ]);
      speckle(ctx, w, h, 'rgba(220,225,235,.30)', 50, 2.2);
      ctx.strokeStyle = 'rgba(220,225,235,.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(16, 16, w - 32, h - 32);
    },
  },
  {
    id: 'filmstrip',
    label: '35mm Film',
    note: 'Sprocket edges',
    category: 'booth',
    className: 'frame-filmstrip',
    dark: true,
    matte: 'rgba(244,241,234,.35)',
    paint: (ctx, w, h) => {
      fill(ctx, '#1b1a18', w, h);
      ctx.fillStyle = 'rgba(255,255,255,.04)';
      for (let y = 0; y < h; y += 6) ctx.fillRect(0, y, w, 2);
      sprockets(ctx, w, h);
    },
  },
  {
    id: 'rubynoir',
    label: 'Hot Pink',
    note: 'Vibrant neon pink',
    category: 'booth',
    className: 'frame-rubynoir',
    dark: true,
    matte: 'rgba(255,255,255,.3)',
    paint: (ctx, w, h) => {
      // Fully opaque hot pink base
      fill(ctx, '#e91e8c', w, h);
      // Gradient overlay for depth
      verticalGradient(ctx, w, h, [
        [0, '#ff2d9b'],
        [0.5, '#d4187a'],
        [1, '#a80f60'],
      ]);
      speckle(ctx, w, h, 'rgba(255,255,255,.12)', 36, 1.6);
      ctx.strokeStyle = 'rgba(255,255,255,.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(14, 14, w - 28, h - 28);
    },
  },
  {
    id: 'crimson',
    label: 'Coral Blush',
    note: 'Warm coral pink',
    category: 'booth',
    className: 'frame-crimson',
    dark: true,
    matte: 'rgba(255,255,255,.25)',
    paint: (ctx, w, h) => {
      // Fully opaque warm coral base
      fill(ctx, '#e8636b', w, h);
      verticalGradient(ctx, w, h, [
        [0, '#f07178'],
        [0.4, '#d94f57'],
        [1, '#c0333d'],
      ]);
      speckle(ctx, w, h, 'rgba(255,200,200,.14)', 40, 1.6);
      ctx.strokeStyle = 'rgba(255,180,180,.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(18, 18, w - 36, h - 36);
    },
  },
  {
    id: 'vampire',
    label: 'Royal Purple',
    note: 'Deep regal purple',
    category: 'booth',
    className: 'frame-vampire',
    dark: true,
    matte: 'rgba(255,255,255,.25)',
    paint: (ctx, w, h) => {
      // Fully opaque deep purple base
      fill(ctx, '#4a1a6b', w, h);
      verticalGradient(ctx, w, h, [
        [0, '#5c2d91'],
        [0.5, '#3d1a6e'],
        [1, '#2a0e4a'],
      ]);
      const vignette = ctx.createRadialGradient(w/2, h*0.3, 0, w/2, h*0.3, w*0.6);
      vignette.addColorStop(0, 'rgba(160,100,220,.2)');
      vignette.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);
      speckle(ctx, w, h, 'rgba(180,140,220,.15)', 48, 2);
      ctx.strokeStyle = 'rgba(180,140,220,.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(14, 14, w - 28, h - 28);
    },
  },
  {
    id: 'velvet',
    label: 'Plum Wine',
    note: 'Rich plum burgundy',
    category: 'booth',
    className: 'frame-velvet',
    dark: true,
    matte: 'rgba(255,255,255,.25)',
    paint: (ctx, w, h) => {
      // Fully opaque plum base
      fill(ctx, '#6b1848', w, h);
      verticalGradient(ctx, w, h, [
        [0, '#7d1f55'],
        [0.5, '#581542'],
        [1, '#3e0e2e'],
      ]);
      const velvetSheen = ctx.createLinearGradient(0, 0, w * 0.6, h);
      velvetSheen.addColorStop(0, 'rgba(255,180,210,.10)');
      velvetSheen.addColorStop(0.5, 'rgba(255,255,255,.04)');
      velvetSheen.addColorStop(1, 'rgba(0,0,0,.12)');
      ctx.fillStyle = velvetSheen;
      ctx.fillRect(0, 0, w, h);
      speckle(ctx, w, h, 'rgba(255,140,180,.10)', 44, 1.8);
      ctx.strokeStyle = 'rgba(255,160,200,.25)';
      ctx.lineWidth = 1;
      ctx.strokeRect(18, 18, w - 36, h - 36);
    },
  },
  {
    id: 'rosegold',
    label: 'Rose Gold Luxe',
    note: 'Satin rose gold',
    category: 'booth',
    className: 'frame-rosegold',
    dark: true,
    matte: 'rgba(240,175,190,.5)',
    paint: (ctx, w, h) => {
      verticalGradient(ctx, w, h, [
        [0, '#3d212b'],
        [0.5, '#4a2835'],
        [1, '#29141d'],
      ]);
      speckle(ctx, w, h, 'rgba(255,200,215,.25)', 52, 2.2);
      ctx.strokeStyle = 'rgba(240,175,190,.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(18, 18, w - 36, h - 36);
    },
  },
  {
    id: 'emerald',
    label: 'Imperial Emerald',
    note: 'Emerald & gold',
    category: 'booth',
    className: 'frame-emerald',
    dark: true,
    matte: 'rgba(212,175,55,.5)',
    paint: (ctx, w, h) => {
      verticalGradient(ctx, w, h, [
        [0, '#0b2e1f'],
        [0.45, '#11422d'],
        [1, '#071f14'],
      ]);
      speckle(ctx, w, h, 'rgba(212,175,55,.28)', 48, 2.2);
      ctx.strokeStyle = 'rgba(212,175,55,.45)';
      ctx.lineWidth = 1;
      ctx.strokeRect(16, 16, w - 32, h - 32);
    },
  },
  {
    id: 'sepia',
    label: 'Warm Sepia',
    note: 'Espresso sepia',
    category: 'booth',
    className: 'frame-sepia',
    dark: true,
    matte: 'rgba(217,140,70,.35)',
    paint: (ctx, w, h) => {
      verticalGradient(ctx, w, h, [
        [0, '#2b1b13'],
        [0.5, '#20140e'],
        [1, '#150d09'],
      ]);
      speckle(ctx, w, h, 'rgba(217,140,70,.18)', 40, 1.8);
      ctx.strokeStyle = 'rgba(217,140,70,.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(16, 16, w - 32, h - 32);
    },
  },
  {
    id: 'kraft',
    label: 'Kraft Paper',
    note: 'Scrapbook tan',
    category: 'booth',
    className: 'frame-kraft',
    dark: false,
    matte: 'rgba(94,68,45,.25)',
    paint: (ctx, w, h) => {
      fill(ctx, '#e5d1b4', w, h);
      speckle(ctx, w, h, 'rgba(120,88,55,.16)', 18, 1.5);
      const shade = ctx.createLinearGradient(0, 0, w, h);
      shade.addColorStop(0, 'rgba(255,255,255,.25)');
      shade.addColorStop(1, 'rgba(120,88,55,.12)');
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, w, h);
    },
  },
  {
    id: 'linen',
    label: 'Vintage Linen',
    note: 'Oat parchment',
    category: 'booth',
    className: 'frame-linen',
    dark: false,
    matte: 'rgba(110,85,60,.28)',
    paint: (ctx, w, h) => {
      fill(ctx, '#ded3c2', w, h);
      speckle(ctx, w, h, 'rgba(110,85,60,.14)', 20, 1.3);
      ctx.strokeStyle = 'rgba(110,85,60,.28)';
      ctx.lineWidth = 1;
      ctx.strokeRect(14, 14, w - 28, h - 28);
    },
  },
  {
    id: 'midnight',
    label: 'Midnight Neon',
    note: 'After hours glow',
    category: 'booth',
    className: 'frame-midnight',
    dark: true,
    matte: 'rgba(255,140,205,.42)',
    paint: (ctx, w, h) => {
      verticalGradient(ctx, w, h, [
        [0, '#0d1030'],
        [0.5, '#2b1358'],
        [1, '#5a1250'],
      ]);
      const glow = ctx.createRadialGradient(w * 0.2, h * 0.2, 10, w * 0.2, h * 0.2, w);
      glow.addColorStop(0, 'rgba(96,214,255,.28)');
      glow.addColorStop(1, 'rgba(96,214,255,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
      speckle(ctx, w, h, 'rgba(255,255,255,.22)', 70, 1.8);
    },
  },
  {
    id: 'sunset',
    label: 'Sunset Strip',
    note: 'Golden hour fade',
    category: 'booth',
    className: 'frame-sunset',
    dark: true,
    matte: 'rgba(255,244,230,.5)',
    paint: (ctx, w, h) => {
      verticalGradient(ctx, w, h, [
        [0, '#ffb46b'],
        [0.45, '#ff7d8f'],
        [1, '#a2439c'],
      ]);
      ctx.fillStyle = 'rgba(255,255,255,.14)';
      for (let y = h * 0.1; y < h; y += 58) ctx.fillRect(0, y, w, 8);
    },
  },
  {
    id: 'y2k',
    label: 'Y2K Chrome',
    note: 'Glitter bubblegum',
    category: 'booth',
    className: 'frame-y2k',
    dark: false,
    matte: 'rgba(255,255,255,.7)',
    paint: (ctx, w, h) => {
      verticalGradient(ctx, w, h, [
        [0, '#d8f1ff'],
        [0.4, '#ffd1e3'],
        [1, '#ff78ad'],
      ]);
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      for (let y = 30; y < h; y += 96) {
        for (let x = 26; x < w; x += 88) {
          star(ctx, x, y, 9);
        }
      }
    },
  },
  {
    id: 'mint',
    label: 'Mint Terrazzo',
    note: 'Studio tile floor',
    category: 'booth',
    className: 'frame-mint',
    dark: false,
    matte: 'rgba(31,29,43,.12)',
    paint: (ctx, w, h) => {
      fill(ctx, '#dff5ec', w, h);
      const colors = ['#f7a8c0', '#9ad6c6', '#f5d287', '#8fb4e8'];
      let n = 0;
      for (let y = 24; y < h; y += 40) {
        for (let x = 22; x < w; x += 44) {
          ctx.save();
          ctx.translate(x + ((n * 13) % 17), y + ((n * 7) % 15));
          ctx.rotate(n * 0.8);
          ctx.fillStyle = colors[n % colors.length];
          ctx.fillRect(-6, -3, 12, 6);
          ctx.restore();
          n += 1;
        }
      }
    },
  },
  {
    id: 'ocean',
    label: 'Ocean Drive',
    note: 'Cool wave stripes',
    category: 'booth',
    className: 'frame-ocean',
    dark: false,
    matte: 'rgba(255,255,255,.7)',
    paint: (ctx, w, h) => {
      verticalGradient(ctx, w, h, [
        [0, '#cdf3ff'],
        [0.5, '#a5d8f5'],
        [1, '#7fb7ea'],
      ]);
      ctx.strokeStyle = 'rgba(255,255,255,.55)';
      ctx.lineWidth = 5;
      for (let y = 40; y < h; y += 54) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 12) {
          const wy = y + Math.sin(x / 26) * 6;
          if (x === 0) ctx.moveTo(x, wy);
          else ctx.lineTo(x, wy);
        }
        ctx.stroke();
      }
    },
  },
  {
    id: 'white',
    label: 'Pure White',
    note: 'Clean and simple',
    category: 'booth',
    className: 'frame-white',
    dark: false,
    matte: 'rgba(31,29,43,.12)',
    paint: (ctx, w, h) => fill(ctx, '#ffffff', w, h),
  },
  {
    id: 'sky',
    label: 'Cloudy Sky',
    note: 'Soft daydream',
    category: 'booth',
    className: 'frame-sky',
    dark: false,
    matte: 'rgba(31,29,43,.12)',
    paint: (ctx, w, h) => {
      // Match CSS: two cloud-blob layers on 120×96 tile
      // Cloud 1: circle at (30,40) r=16 rgba(255,255,255,.9)
      // Cloud 2: circle at (52,46) r=12 rgba(255,255,255,.8)
      verticalGradient(ctx, w, h, [
        [0, '#e9fbff'],
        [1, '#cfeef7'],
      ]);
      const tW = 120, tH = 96;
      for (let ty = 0; ty < h + tH; ty += tH) {
        for (let tx = 0; tx < w + tW; tx += tW) {
          ctx.beginPath();
          ctx.arc(tx + 30, ty + 40, 16, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,.9)';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(tx + 52, ty + 46, 12, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,.8)';
          ctx.fill();
        }
      }
    },
  },
];

function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.quadraticCurveTo(cx + size * 0.18, cy - size * 0.18, cx + size, cy);
  ctx.quadraticCurveTo(cx + size * 0.18, cy + size * 0.18, cx, cy + size);
  ctx.quadraticCurveTo(cx - size * 0.18, cy + size * 0.18, cx - size, cy);
  ctx.quadraticCurveTo(cx - size * 0.18, cy - size * 0.18, cx, cy - size);
  ctx.fill();
}

export const FILTER_OPTIONS: { id: FilterType; label: string; className: string; shadeGradient: string }[] = [
  { id: 'color', label: 'Original', className: 'filter-color', shadeGradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #a1c4fd 100%)' },
  { id: 'bw', label: 'B&W', className: 'filter-bw', shadeGradient: 'linear-gradient(135deg, #1a1a1a 0%, #737373 50%, #f5f5f5 100%)' },
  { id: 'noir', label: 'Noir', className: 'filter-noir', shadeGradient: 'linear-gradient(135deg, #000000 0%, #262626 60%, #ffffff 100%)' },
  { id: 'vintage', label: 'Vintage', className: 'filter-vintage', shadeGradient: 'linear-gradient(135deg, #5c381e 0%, #b88656 50%, #f2e3c6 100%)' },
  { id: 'film', label: 'Film', className: 'filter-film', shadeGradient: 'linear-gradient(135deg, #2c3e50 0%, #8d6e63 50%, #e0d4c3 100%)' },
  { id: 'faded', label: 'Faded', className: 'filter-faded', shadeGradient: 'linear-gradient(135deg, #4a4054 0%, #8e8299 50%, #e2dce6 100%)' },
  { id: 'warm', label: 'Warm', className: 'filter-warm', shadeGradient: 'linear-gradient(135deg, #b84a1e 0%, #e8864a 50%, #ffe4cc 100%)' },
  { id: 'cool', label: 'Cool', className: 'filter-cool', shadeGradient: 'linear-gradient(135deg, #1b3a6b 0%, #3a7bd5 50%, #c2e9fb 100%)' },
  { id: 'candy', label: 'Candy', className: 'filter-candy', shadeGradient: 'linear-gradient(135deg, #f53d89 0%, #9b51e0 50%, #56ccf2 100%)' },
];

export const isFrameType = (value: unknown): value is FrameType =>
  FRAME_OPTIONS.some((option) => option.id === value);

export const isFilterType = (value: unknown): value is FilterType =>
  FILTER_OPTIONS.some((option) => option.id === value);

export const getFrameOption = (frame: FrameType) =>
  FRAME_OPTIONS.find((option) => option.id === frame) ?? FRAME_OPTIONS[0];

export const getFilterOption = (filter: FilterType) =>
  FILTER_OPTIONS.find((option) => option.id === filter) ?? FILTER_OPTIONS[0];

export type StripGeometry = {
  width: number;
  height: number;
  shotWidth: number;
  shotHeight: number;
  padding: number;
  gap: number;
  footer: number;
  radius: number;
  positions: Array<{ x: number; y: number }>;
};

export function getStripGeometry(layout: 'vertical-4' | 'quad-4' | 'horizontal-3'): StripGeometry {
  // 4:3 shot aspect ratio, original proportions for natural spacious strip look
  const shotWidth = 640;
  const shotHeight = 480;
  const padding = 58;
  const gap = 30;
  const footer = 168;
  const radius = 18;
  const count = layout === 'horizontal-3' ? 3 : 4;
  const columns = layout === 'vertical-4' ? 1 : layout === 'quad-4' ? 2 : 3;
  const rows = Math.ceil(count / columns);

  const width = shotWidth * columns + gap * (columns - 1) + padding * 2;
  const height = shotHeight * rows + gap * (rows - 1) + padding * 2 + footer;

  const positions = Array.from({ length: count }, (_, i) => ({
    x: padding + (i % columns) * (shotWidth + gap),
    y: padding + Math.floor(i / columns) * (shotHeight + gap),
  }));

  return { width, height, shotWidth, shotHeight, padding, gap, footer, radius, positions };
}

function clampChannel(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

export function applyFilterPixels(data: ImageData, filter: FilterType): ImageData {
  const pixels = data.data;
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const gray = r * 0.299 + g * 0.587 + b * 0.114;

    if (filter === 'bw') {
      const value = clampChannel(gray);
      pixels[i] = value; pixels[i + 1] = value; pixels[i + 2] = value;
    } else if (filter === 'noir') {
      const value = clampChannel((gray - 128) * 1.45 + 118);
      pixels[i] = value; pixels[i + 1] = value; pixels[i + 2] = value;
    } else if (filter === 'vintage') {
      pixels[i] = clampChannel(gray * 1.08 + 22);
      pixels[i + 1] = clampChannel(gray * 0.92 + 8);
      pixels[i + 2] = clampChannel(gray * 0.72);
    } else if (filter === 'film') {
      pixels[i] = clampChannel((r - 128) * 1.12 + 126);
      pixels[i + 1] = clampChannel((g - 128) * 1.12 + 126);
      pixels[i + 2] = clampChannel((b - 128) * 1.14 + 130);
    } else if (filter === 'faded') {
      pixels[i] = clampChannel(r * 0.82 + 44);
      pixels[i + 1] = clampChannel(g * 0.82 + 44);
      pixels[i + 2] = clampChannel(b * 0.84 + 48);
    } else if (filter === 'warm') {
      pixels[i] = clampChannel(r * 1.1 + 8);
      pixels[i + 1] = clampChannel(g * 1.02);
      pixels[i + 2] = clampChannel(b * 0.9);
    } else if (filter === 'cool') {
      pixels[i] = clampChannel(r * 0.92);
      pixels[i + 1] = clampChannel(g * 1.02 + 3);
      pixels[i + 2] = clampChannel(b * 1.1 + 5);
    } else if (filter === 'candy') {
      pixels[i] = clampChannel(gray + (r - gray) * 1.45 + 10);
      pixels[i + 1] = clampChannel(gray + (g - gray) * 1.2);
      pixels[i + 2] = clampChannel(gray + (b - gray) * 1.35 + 6);
    }
  }
  return data;
}

export function filterImageForCanvas(img: HTMLImageElement, filter: FilterType): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const w = Math.max(1, img.naturalWidth || img.width || 300);
  const h = Math.max(1, img.naturalHeight || img.height || 300);
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  try {
    ctx.drawImage(img, 0, 0, w, h);
    if (filter !== 'color') {
      const imageData = ctx.getImageData(0, 0, w, h);
      ctx.putImageData(applyFilterPixels(imageData, filter), 0, 0);
    }
  } catch {
    // If pixel manipulation fails (e.g. cross-origin/SVG security), image is still drawn
  }
  return canvas;
}

export function drawFrameBackground(
  ctx: CanvasRenderingContext2D,
  frame: FrameType,
  width: number,
  height: number,
  opacity: number,
) {
  const option = getFrameOption(frame);
  ctx.save();
  ctx.fillStyle = option.dark ? '#0f0d13' : '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = Math.max(0.2, Math.min(1, opacity / 100));
  option.paint(ctx, width, height);
  ctx.restore();
}

// ─── Artisan Template System (Programmatic Canvas) ────────────────────────

export type ArtisanTemplateId =
  | 'theater-show'
  | 'every-moment-up'
  | 'retro-tv'
  | 'the-1975'
  | 'director-cut'
  | 'love-stamp'
  | 'newspaper';

export interface ArtisanSlot {
  /** Absolute pixel position at 1× scale */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Border radius at 1× scale */
  r: number;
}

export interface ArtisanTemplate {
  id: ArtisanTemplateId;
  label: string;
  note: string;
  /** Canvas natural size at 1× */
  nw: number;
  nh: number;
  /** Photo slot positions at 1× */
  slots: ArtisanSlot[];
  /**
   * Paint everything BEFORE photos (background, decorations, slot placeholders).
   * s = scale factor (so 0.35 for preview, 2 for export).
   */
  paintBg(ctx: CanvasRenderingContext2D, w: number, h: number, s: number, date: number): void;
  /**
   * Paint everything AFTER photos (borders, text overlays on top of photos).
   */
  paintFg(ctx: CanvasRenderingContext2D, w: number, h: number, s: number, date: number): void;
  /** Optional async background painter (for image-based templates). Overrides paintBg. */
  paintBgAsync?: (ctx: CanvasRenderingContext2D, w: number, h: number, s: number, date: number) => Promise<void>;
  /** Optional async foreground painter (for image-based templates). Overrides paintFg. */
  paintFgAsync?: (ctx: CanvasRenderingContext2D, w: number, h: number, s: number, date: number) => Promise<void>;
}

// ── Drawing utilities ──────────────────────────────────────────────────────

function aBox(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
  fill?: string, stroke?: string, lw = 1,
) {
  if (fill) { ctx.fillStyle = fill; roundedRect(ctx, x, y, w, h, r); ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; roundedRect(ctx, x, y, w, h, r); ctx.stroke(); }
}

function aTxt(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number,
  font: string, color: string,
  align: CanvasTextAlign = 'center',
) {
  ctx.save();
  ctx.textAlign = align;
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function aLine(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  color: string, lw: number,
) {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = lw;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.restore();
}

function aBarcode(
  ctx: CanvasRenderingContext2D,
  cx: number, y: number, bw: number, bh: number, color: string,
) {
  ctx.fillStyle = color;
  const bars = [3, 1, 2, 1, 3, 2, 1, 3, 1, 2, 1, 2, 3, 1, 2, 1, 3, 1];
  const total = bars.reduce((a, b) => a + b, 0);
  const uw = bw / total;
  let x = cx - bw / 2;
  bars.forEach((u, i) => {
    if (i % 2 === 0) ctx.fillRect(x, y, u * uw - 0.5, bh);
    x += u * uw;
  });
}

// ── Image cache helper for image-based templates ──────────────────────────

const _imgCache = new Map<string, Promise<HTMLImageElement>>();
function loadImg(src: string): Promise<HTMLImageElement> {
  if (_imgCache.has(src)) return _imgCache.get(src)!;
  const p = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
  _imgCache.set(src, p);
  return p;
}

// Inline rounded rect path that does NOT call beginPath (safe to chain paths)
function addRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function makeImageTemplate(
  src: string,
  templateSlots: ArtisanSlot[],
  tolerance: number = 45
): Pick<ArtisanTemplate, 'paintBg' | 'paintFg' | 'paintBgAsync' | 'paintFgAsync'> {
  return {
    paintBg(ctx, w, h) { ctx.fillStyle = '#e0e0e0'; ctx.fillRect(0, 0, w, h); },
    paintFg() { /* no-op */ },

    // Background pass draws the base image so it's visible behind photos
    async paintBgAsync(ctx, w, h) {
      try {
        const img = await loadImg(src);
        ctx.drawImage(img, 0, 0, w, h);
      } catch {
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(0, 0, w, h);
      }
    },

    // Foreground pass uses chroma-keying to make the placeholder screens transparent.
    // This perfectly wraps the photo in the natural curved bezel of the TV/frames,
    // and keeps all text/decorations visible since we draw the whole image on top.
    async paintFgAsync(ctx, w, h, s) {
      try {
        const img = await loadImg(src);
        const cw = Math.round(w), ch = Math.round(h);
        
        const off = document.createElement('canvas');
        off.width = cw; off.height = ch;
        const offCtx = off.getContext('2d', { willReadFrequently: true });
        if (!offCtx) return;
        
        offCtx.drawImage(img, 0, 0, cw, ch);
        const imgData = offCtx.getImageData(0, 0, cw, ch);
        const data = imgData.data;

        templateSlots.forEach(slot => {
          // Scale slot coordinates
          const sx = Math.round(slot.x * s);
          const sy = Math.round(slot.y * s);
          const sw = Math.round(slot.w * s);
          const sh = Math.round(slot.h * s);
          
          // Sample the placeholder color from the dead center of the slot
          const cx = Math.floor(sx + sw / 2);
          const cy = Math.floor(sy + sh / 2);
          const cIndex = (cy * cw + cx) * 4;
          const tr = data[cIndex], tg = data[cIndex + 1], tb = data[cIndex + 2];

          // Use the configurable tolerance. 
          // If tolerance < 0, use an advanced edge-detecting FloodFill algorithm (e.g., for heavy CRT gradients).
          // If tolerance > 0, use Euclidean chroma-keying (for flat placeholders).
          if (tolerance < 0) {
            const threshold = Math.abs(tolerance);
            const stack = [[cx, cy]];
            const visited = new Uint8Array(cw * ch);
            visited[cy * cw + cx] = 1;

            while (stack.length > 0) {
              const [px, py] = stack.pop()!;
              const i = (py * cw + px) * 4;
              const r = data[i], g = data[i+1], b = data[i+2];
              
              // Flood fill until we hit a dark bezel
              if (r + g + b > threshold) {
                data[i + 3] = 0; // erase
                
                // neighbors bounded by the slightly expanded slot rect to prevent runaway
                const ex = Math.round(15 * s);
                const minX = Math.max(0, sx - ex), maxX = Math.min(cw - 1, sx + sw + ex);
                const minY = Math.max(0, sy - ex), maxY = Math.min(ch - 1, sy + sh + ex);

                if (px > minX && !visited[py * cw + px - 1]) { visited[py * cw + px - 1] = 1; stack.push([px - 1, py]); }
                if (px < maxX && !visited[py * cw + px + 1]) { visited[py * cw + px + 1] = 1; stack.push([px + 1, py]); }
                if (py > minY && !visited[(py - 1) * cw + px]) { visited[(py - 1) * cw + px] = 1; stack.push([px, py - 1]); }
                if (py < maxY && !visited[(py + 1) * cw + px]) { visited[(py + 1) * cw + px] = 1; stack.push([px, py + 1]); }
              }
            }
          } else {
            const tolSq = tolerance * tolerance;
            const expand = Math.round(15 * s);
            const startX = Math.max(0, sx - expand), endX = Math.min(cw, sx + sw + expand);
            const startY = Math.max(0, sy - expand), endY = Math.min(ch, sy + sh + expand);

            for (let y = startY; y < endY; y++) {
              for (let x = startX; x < endX; x++) {
                const i = (y * cw + x) * 4;
                const r = data[i], g = data[i+1], b = data[i+2];
                const distSq = (r-tr)*(r-tr) + (g-tg)*(g-tg) + (b-tb)*(b-tb);
                if (distSq <= tolSq * 3) {
                  data[i + 3] = 0; 
                }
              }
            }
          }
        });

        offCtx.putImageData(imgData, 0, 0);
        ctx.drawImage(off, 0, 0);
      } catch (err) {
        console.error('paintFgAsync error:', err);
      }
    },
  };
}

// ══════════════════════════════════════════════════════════════════════════
// THEATER SHOW — Vintage ticket strip · cream & maroon · 4 landscape shots
// ══════════════════════════════════════════════════════════════════════════

const THEATER_SLOTS: ArtisanSlot[] = [
  { x: 40, y: 226, w: 520, h: 306, r: 2 },
  { x: 40, y: 558, w: 520, h: 306, r: 2 },
  { x: 40, y: 890, w: 520, h: 306, r: 2 },
  { x: 40, y: 1222, w: 520, h: 306, r: 2 },
];

function theaterBg(ctx: CanvasRenderingContext2D, w: number, h: number, s: number, date: number) {
  const cream = '#f5eed8', maroon = '#78141e';

  ctx.fillStyle = cream; ctx.fillRect(0, 0, w, h);

  // Thick outer maroon border
  const bW = Math.round(20 * s);
  ctx.fillStyle = maroon;
  ctx.fillRect(0, 0, w, bW); ctx.fillRect(0, h - bW, w, bW);
  ctx.fillRect(0, 0, bW, h); ctx.fillRect(w - bW, 0, bW, h);

  // Scalloped bites — cream semicircles eating into the border
  ctx.fillStyle = cream;
  const sr = Math.max(1, Math.round(11 * s));
  const ss = Math.max(6, Math.round(22 * s));
  for (let x = ss; x < w; x += ss) {
    ctx.beginPath(); ctx.arc(x, 0, sr, 0, Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(x, h, sr, Math.PI, 0); ctx.fill();
  }
  for (let y2 = ss; y2 < h; y2 += ss) {
    ctx.beginPath(); ctx.arc(0, y2, sr, -Math.PI / 2, Math.PI / 2); ctx.fill();
    ctx.beginPath(); ctx.arc(w, y2, sr, Math.PI / 2, -Math.PI / 2); ctx.fill();
  }

  // Inner thin border
  const ins = Math.round(34 * s);
  ctx.strokeStyle = maroon; ctx.lineWidth = Math.round(1.5 * s);
  ctx.strokeRect(ins, ins, w - ins * 2, h - ins * 2);

  // ── Header ──
  aTxt(ctx, '★  ★', w / 2, Math.round(66 * s), `bold ${Math.round(18 * s)}px serif`, maroon);
  aTxt(ctx, 'PinkSnap', w / 2, Math.round(106 * s),
    `italic bold ${Math.round(40 * s)}px Georgia, "Times New Roman", serif`, maroon);
  aTxt(ctx, 'PHOTO BOOTH', w / 2, Math.round(132 * s),
    `bold ${Math.round(14 * s)}px "Inter", sans-serif`, maroon);

  aLine(ctx, ins + Math.round(8 * s), Math.round(144 * s), w - ins - Math.round(8 * s), Math.round(144 * s), maroon, Math.round(s));

  // Info row
  const boxY = Math.round(150 * s), boxH = Math.round(46 * s);
  const x0 = ins + Math.round(8 * s);
  const dateStr = new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: '2-digit' });

  // ROW box
  aBox(ctx, x0, boxY, Math.round(60 * s), boxH, 0, undefined, maroon, Math.round(s));
  aTxt(ctx, 'Row', x0 + Math.round(30 * s), boxY + Math.round(16 * s), `${Math.round(11 * s)}px "Inter", sans-serif`, maroon);
  aTxt(ctx, 'P1', x0 + Math.round(30 * s), boxY + Math.round(38 * s), `bold ${Math.round(22 * s)}px "Inter", sans-serif`, maroon);

  // SHOW box
  const x1 = x0 + Math.round(68 * s);
  aBox(ctx, x1, boxY, Math.round(60 * s), boxH, 0, undefined, maroon, Math.round(s));
  aTxt(ctx, 'Show', x1 + Math.round(30 * s), boxY + Math.round(16 * s), `${Math.round(11 * s)}px "Inter", sans-serif`, maroon);
  aTxt(ctx, '01', x1 + Math.round(30 * s), boxY + Math.round(38 * s), `bold ${Math.round(22 * s)}px "Inter", sans-serif`, maroon);

  // DATE box
  const x2 = x1 + Math.round(68 * s);
  const x2w = w - ins - Math.round(8 * s) - x2;
  aBox(ctx, x2, boxY, x2w, boxH, 0, undefined, maroon, Math.round(s));
  aTxt(ctx, dateStr.toUpperCase(), x2 + x2w / 2, boxY + Math.round(28 * s),
    `bold ${Math.round(11 * s)}px "Inter", sans-serif`, maroon);

  aLine(ctx, ins + Math.round(8 * s), Math.round(206 * s), w - ins - Math.round(8 * s), Math.round(206 * s), maroon, Math.round(s));

  // Dark slot placeholders (photos composite here)
  THEATER_SLOTS.forEach(sl => aBox(ctx, sl.x * s, sl.y * s, sl.w * s, sl.h * s, sl.r * s, 'rgba(120, 20, 30, 0.1)'));

  // Footer text
  aTxt(ctx, 'SAVE THE BEST MOMENT  ★  SAVE THE BEST MOMENT', w / 2, Math.round(1570 * s),
    `${Math.round(11 * s)}px "Inter", sans-serif`, maroon);
}

function theaterFg(ctx: CanvasRenderingContext2D, w: number, h: number, s: number, _date: number) {
  const maroon = '#78141e';
  // Slot outlines over photos
  THEATER_SLOTS.forEach(sl => aBox(ctx, sl.x * s, sl.y * s, sl.w * s, sl.h * s, sl.r * s, undefined, maroon, Math.round(1.5 * s)));
  // Brand at bottom in italic script style
  aTxt(ctx, 'pinksnap.', w / 2, Math.round(1650 * s),
    `italic bold ${Math.round(46 * s)}px Georgia, "Times New Roman", serif`, maroon);
}

// ══════════════════════════════════════════════════════════════════════════
// MORA — Dark editorial strip · near-black · 4 landscape shots
// ══════════════════════════════════════════════════════════════════════════

const MORA_SLOTS: ArtisanSlot[] = [
  { x: 158, y: 112, w: 372, h: 208, r: 0 },
  { x: 158, y: 336, w: 372, h: 208, r: 0 },
  { x: 158, y: 560, w: 372, h: 208, r: 0 },
  { x: 158, y: 784, w: 372, h: 208, r: 0 },
];

function moraBg(ctx: CanvasRenderingContext2D, w: number, h: number, s: number, _date: number) {
  const bg = '#100707', wh = '#ffffff', red = '#c41818';

  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  aBox(ctx, Math.round(8 * s), Math.round(8 * s), w - Math.round(16 * s), h - Math.round(16 * s), 0,
    undefined, 'rgba(255,255,255,0.08)', Math.round(s));

  // Top label bar
  const lbW = Math.round(280 * s);
  aBox(ctx, (w - lbW) / 2, Math.round(28 * s), lbW, Math.round(34 * s), Math.round(2 * s), undefined, wh, Math.round(s));
  aTxt(ctx, 'SHAWN PHOTO STUDIO', w / 2, Math.round(50 * s), `bold ${Math.round(11 * s)}px "Inter", sans-serif`, wh);

  // Photo slots: dark box + white border + red left accent
  MORA_SLOTS.forEach((sl, i) => {
    aBox(ctx, sl.x * s, sl.y * s, sl.w * s, sl.h * s, 0, '#060202');
    ctx.save();
    ctx.strokeStyle = wh; ctx.lineWidth = Math.round(2 * s);
    ctx.strokeRect(sl.x * s, sl.y * s, sl.w * s, sl.h * s);
    ctx.restore();
    aBox(ctx, sl.x * s - Math.round(4 * s), sl.y * s, Math.round(4 * s), sl.h * s, 0, red);

    // Side label rotated text
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = `${Math.round(9 * s)}px "Inter", sans-serif`;
    ctx.translate(sl.x * s - Math.round(14 * s), sl.y * s + sl.h * s / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(i % 2 === 0 ? '#picturememories' : 'pictee', 0, 0);
    ctx.restore();
  });
}

function moraFg(ctx: CanvasRenderingContext2D, w: number, h: number, s: number, date: number) {
  const wh = '#ffffff';
  aTxt(ctx, 'MORA', w / 2, Math.round(1085 * s),
    `italic bold ${Math.round(76 * s)}px Georgia, "Times New Roman", serif`, wh);
  aTxt(ctx, 'YOU AND MEE AGAINST', w / 2, Math.round(1160 * s),
    `bold ${Math.round(20 * s)}px "Inter", sans-serif`, wh);
  aTxt(ctx, 'EVERYTHING', w / 2, Math.round(1190 * s),
    `bold ${Math.round(20 * s)}px "Inter", sans-serif`, wh);

  const lbW = Math.round(260 * s);
  aBox(ctx, (w - lbW) / 2, Math.round(1220 * s), lbW, Math.round(34 * s), Math.round(2 * s), undefined, wh, Math.round(s));
  aTxt(ctx, 'PINKSNAP STUDIO', w / 2, Math.round(1242 * s), `bold ${Math.round(11 * s)}px "Inter", sans-serif`, wh);

  const dStr = new Date(date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase();
  aTxt(ctx, dStr, w / 2, Math.round(1282 * s), `bold ${Math.round(11 * s)}px "Inter", sans-serif`, 'rgba(255,255,255,0.45)');
}

// ══════════════════════════════════════════════════════════════════════════
// EVERY MOMENT — Bold blue gradient · 3 square shots · UP and DOWN variants
// ══════════════════════════════════════════════════════════════════════════

const EVERY_UP_SLOTS: ArtisanSlot[] = [
  { x: 36, y: 468, w: 448, h: 282, r: 22 },
  { x: 36, y: 762, w: 448, h: 282, r: 22 },
  { x: 36, y: 1056, w: 448, h: 282, r: 22 },
];

const EVERY_DOWN_SLOTS: ArtisanSlot[] = [
  { x: 36, y: 30, w: 448, h: 282, r: 22 },
  { x: 36, y: 324, w: 448, h: 282, r: 22 },
  { x: 36, y: 618, w: 448, h: 282, r: 22 },
];

function everyBg(
  ctx: CanvasRenderingContext2D,
  w: number, h: number, s: number, date: number,
  variant: 'up' | 'down',
) {
  const isUp = variant === 'up';
  const slots = isUp ? EVERY_UP_SLOTS : EVERY_DOWN_SLOTS;

  // Blue gradient — light at header side, dark at photo side
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  if (isUp) {
    grad.addColorStop(0, '#b8d0f0'); grad.addColorStop(0.42, '#1b52da'); grad.addColorStop(1, '#0e34a8');
  } else {
    grad.addColorStop(0, '#0e34a8'); grad.addColorStop(0.58, '#1b52da'); grad.addColorStop(1, '#b8d0f0');
  }
  ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);

  // Scanline texture
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  const scanStep = Math.max(3, Math.round(4 * s));
  const scanH = Math.max(1, Math.round(s));
  for (let y2 = 0; y2 < h; y2 += scanStep) ctx.fillRect(0, y2, w, scanH);

  // Slot backgrounds with pressed-in look
  slots.forEach(sl => {
    aBox(ctx, sl.x * s, sl.y * s, sl.w * s, sl.h * s, Math.round(sl.r * s), '#0c2d8a');
    // Inner shadow gradient
    ctx.save();
    const ig = ctx.createRadialGradient(
      (sl.x + sl.w * 0.5) * s, (sl.y + sl.h * 0.5) * s, Math.round(20 * s),
      (sl.x + sl.w * 0.5) * s, (sl.y + sl.h * 0.5) * s, Math.round(Math.max(sl.w, sl.h) * 0.7 * s),
    );
    ig.addColorStop(0, 'rgba(0,0,0,0)');
    ig.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = ig;
    roundedRect(ctx, sl.x * s, sl.y * s, sl.w * s, sl.h * s, Math.round(sl.r * s));
    ctx.fill();
    ctx.restore();
  });

  const wh = '#ffffff';
  const hdrColor = isUp ? wh : '#0e34a8';

  if (isUp) {
    // Top ornament
    aTxt(ctx, '✱', Math.round(42 * s), Math.round(52 * s), `bold ${Math.round(20 * s)}px "Inter", sans-serif`, wh, 'left');
    aLine(ctx, Math.round(66 * s), Math.round(44 * s), w - Math.round(80 * s), Math.round(44 * s), wh, Math.round(1.5 * s));
    aTxt(ctx, '1.0', w - Math.round(38 * s), Math.round(52 * s), `bold ${Math.round(18 * s)}px "Inter", sans-serif`, wh, 'right');
    // Bold header text
    aTxt(ctx, 'EVERY', w / 2, Math.round(148 * s), `900 ${Math.round(90 * s)}px "Inter", system-ui, sans-serif`, wh);
    aTxt(ctx, 'MOMENT', w / 2, Math.round(248 * s), `900 ${Math.round(90 * s)}px "Inter", system-ui, sans-serif`, wh);
    aTxt(ctx, 'matters.', w / 2, Math.round(322 * s), `italic bold ${Math.round(52 * s)}px Georgia, serif`, wh);
    aBarcode(ctx, w / 2, Math.round(368 * s), Math.round(200 * s), Math.round(28 * s), wh);
    // PINKSNAP at bottom
    aTxt(ctx, 'PINK', w / 2, Math.round(1368 * s), `900 ${Math.round(19 * s)}px "Inter", sans-serif`, 'rgba(255,255,255,0.9)');
    aTxt(ctx, 'SNAP', w / 2, Math.round(1390 * s), `900 ${Math.round(19 * s)}px "Inter", sans-serif`, '#f53d89');
    const dStr = new Date(date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase();
    aTxt(ctx, dStr, w / 2, Math.round(1412 * s), `bold ${Math.round(9 * s)}px "Inter", sans-serif`, 'rgba(255,255,255,0.6)');
  } else {
    // Photos at top, footer text at bottom
    const fy = 920;
    aTxt(ctx, 'EVERY', w / 2, Math.round((fy + 76) * s), `900 ${Math.round(90 * s)}px "Inter", system-ui, sans-serif`, hdrColor);
    aTxt(ctx, 'MOMENT', w / 2, Math.round((fy + 176) * s), `900 ${Math.round(90 * s)}px "Inter", system-ui, sans-serif`, hdrColor);
    aTxt(ctx, 'matters.', w / 2, Math.round((fy + 250) * s), `italic bold ${Math.round(52 * s)}px Georgia, serif`, hdrColor);
    aBarcode(ctx, w / 2, Math.round((fy + 296) * s), Math.round(200 * s), Math.round(28 * s), hdrColor);
    aTxt(ctx, '✱', Math.round(42 * s), Math.round((fy + 336) * s), `bold ${Math.round(20 * s)}px "Inter", sans-serif`, hdrColor, 'left');
    aLine(ctx, Math.round(66 * s), Math.round((fy + 328) * s), w - Math.round(80 * s), Math.round((fy + 328) * s), hdrColor, Math.round(1.5 * s));
    aTxt(ctx, '1.0', w - Math.round(38 * s), Math.round((fy + 336) * s), `bold ${Math.round(18 * s)}px "Inter", sans-serif`, hdrColor, 'right');
    // PINKSNAP at top (small, above first photo slot)
    const dStr = new Date(date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase();
    aTxt(ctx, `PINKSNAP  ·  ${dStr}`, w / 2, Math.round(18 * s), `900 ${Math.round(11 * s)}px "Inter", sans-serif`, 'rgba(255,255,255,0.85)');
  }
}

function everyFg(
  ctx: CanvasRenderingContext2D,
  w: number, h: number, s: number, _date: number,
  variant: 'up' | 'down',
) {
  const slots = variant === 'up' ? EVERY_UP_SLOTS : EVERY_DOWN_SLOTS;
  slots.forEach(sl => aBox(ctx, sl.x * s, sl.y * s, sl.w * s, sl.h * s,
    Math.round(sl.r * s), undefined, 'rgba(255,255,255,0.15)', Math.round(1.5 * s)));
}

// ── Template registry ──────────────────────────────────────────────────────

export const ARTISAN_TEMPLATES: ArtisanTemplate[] = [
  // LINE 1
  {
    id: 'the-1975',
    label: 'The 1975',
    note: 'Magazine cut-out · 4 shots',
    nw: 352, nh: 1133,
    slots: [
      { x: 35, y: 63,  w: 281, h: 183, r: 2 },
      { x: 35, y: 290, w: 282, h: 191, r: 2 },
      { x: 35, y: 524, w: 283, h: 189, r: 2 },
      { x: 35, y: 757, w: 280, h: 201, r: 2 },
    ],
    ...makeImageTemplate('/templates/the-1975.jpg', [
      { x: 35, y: 63,  w: 281, h: 183, r: 2 },
      { x: 35, y: 290, w: 282, h: 191, r: 2 },
      { x: 35, y: 524, w: 283, h: 189, r: 2 },
      { x: 35, y: 757, w: 280, h: 201, r: 2 },
    ], 18),
  },
  {
    id: 'theater-show',
    label: 'Theater Show',
    note: 'Vintage ticket · 4 shots',
    nw: 600, nh: 1700,
    slots: THEATER_SLOTS,
    paintBg: theaterBg,
    paintFg: theaterFg,
  },
  {
    id: 'retro-tv',
    label: 'Retro TV',
    note: 'Vintage television · 4 shots',
    nw: 463, nh: 1346,
    slots: [
      { x: 43, y: 85,  w: 296, h: 232, r: 22 },
      { x: 40, y: 405, w: 297, h: 232, r: 22 },
      { x: 41, y: 731, w: 297, h: 230, r: 22 },
      { x: 43, y: 1055, w: 294, h: 227, r: 22 },
    ],
    ...(function() {
      const base = makeImageTemplate('/templates/retro-tv.jpg', [
        { x: 43, y: 85,  w: 296, h: 232, r: 22 },
        { x: 40, y: 405, w: 297, h: 232, r: 22 },
        { x: 41, y: 731, w: 297, h: 230, r: 22 },
        { x: 43, y: 1055, w: 294, h: 227, r: 22 },
      ], -100);
      const orig = base.paintFgAsync;
      base.paintFgAsync = async (ctx, w, h, s, date) => {
        if (orig) await orig(ctx, w, h, s, date);
        // Draw PINKSNAP badge over OURBOX
        // Made much wider (240) and taller (65) starting higher (y=8) to fully cover "OURBOX"
        aBox(ctx, (w - Math.round(240 * s)) / 2, Math.round(8 * s), Math.round(240 * s), Math.round(65 * s), Math.round(18 * s), '#111');
        aTxt(ctx, 'PINKSNAP', w / 2, Math.round(48 * s), `900 ${Math.round(22 * s)}px "Inter", sans-serif`, '#ff69b4');
      };
      return base;
    })(),
  },
  {
    id: 'love-stamp',
    label: 'Love Stamp',
    note: 'Romantic stamp · 4 shots',
    nw: 576, nh: 1776,
    slots: [
      { x: 75, y: 141,  w: 427, h: 335, r: 10 },
      { x: 75, y: 530,  w: 427, h: 334, r: 10 },
      { x: 75, y: 917,  w: 427, h: 334, r: 10 },
      { x: 75, y: 1305, w: 427, h: 330, r: 10 },
    ],
    ...makeImageTemplate('/templates/love-stamp.jpg', [
      { x: 75, y: 141,  w: 427, h: 335, r: 10 },
      { x: 75, y: 530,  w: 427, h: 334, r: 10 },
      { x: 75, y: 917,  w: 427, h: 334, r: 10 },
      { x: 75, y: 1305, w: 427, h: 330, r: 10 },
    ], 20),
  },
  // LINE 2
  {
    id: 'director-cut',
    label: "Director's Cut",
    note: 'Film strip · 3 shots',
    nw: 305, nh: 929,
    slots: [
      { x: 25, y: 27,  w: 255, h: 221, r: 0 },
      { x: 25, y: 268, w: 255, h: 218, r: 0 },
      { x: 25, y: 506, w: 255, h: 217, r: 0 },
    ],
    ...makeImageTemplate('/templates/director-cut.jpg', [
      { x: 25, y: 27,  w: 255, h: 221, r: 0 },
      { x: 25, y: 268, w: 255, h: 218, r: 0 },
      { x: 25, y: 506, w: 255, h: 217, r: 0 },
    ], 20),
  },
  {
    id: 'every-moment-up',
    label: 'Every Moment Matters',
    note: 'Bold blue · header top · 3 shots',
    nw: 520, nh: 1430,
    slots: EVERY_UP_SLOTS,
    paintBg: (ctx, w, h, s, date) => everyBg(ctx, w, h, s, date, 'up'),
    paintFg: (ctx, w, h, s, date) => everyFg(ctx, w, h, s, date, 'up'),
  },
  {
    id: 'newspaper',
    label: 'Newspaper',
    note: 'Momenkú editorial · 3 shots',
    nw: 405, nh: 1189,
    slots: [
      { x: 24, y: 219, w: 358, h: 226, r: 8 },
      { x: 24, y: 460, w: 358, h: 227, r: 8 },
      { x: 24, y: 762, w: 358, h: 225, r: 8 },
    ],
    ...makeImageTemplate('/templates/newspaper.jpg', [
      { x: 24, y: 219, w: 358, h: 226, r: 8 },
      { x: 24, y: 460, w: 358, h: 227, r: 8 },
      { x: 24, y: 762, w: 358, h: 225, r: 8 },
    ], 15),
  },
];





export function getArtisanTemplate(id: ArtisanTemplateId): ArtisanTemplate {
  return ARTISAN_TEMPLATES.find((t) => t.id === id) ?? ARTISAN_TEMPLATES[0];
}

/**
 * Render an artisan strip to a canvas data-URL.
 * @param template  ArtisanTemplate definition
 * @param photos    Filtered HTMLCanvasElement per slot (null = skip)
 * @param date      Session timestamp
 * @param scale     Output scale (2 = hi-dpi export, 0.35 = preview)
 */
export async function renderArtisanStrip(
  template: ArtisanTemplate,
  photos: (HTMLCanvasElement | null)[],
  date: number,
  scale = 2,
): Promise<string> {
  const W = Math.round(template.nw * scale);
  const H = Math.round(template.nh * scale);
  const s = scale;

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 1. Background (async if available)
  if (template.paintBgAsync) {
    await template.paintBgAsync(ctx, W, H, s, date);
  } else {
    template.paintBg(ctx, W, H, s, date);
  }

  // 2. Composite user photos into slots
  template.slots.forEach((slot, i) => {
    const photo = photos[i];
    if (!photo) return;

    const sx = slot.x * s, sy = slot.y * s;
    const sw = slot.w * s, sh = slot.h * s;
    const r = Math.min(slot.r * s, sw / 2, sh / 2);

    ctx.save();
    roundedRect(ctx, sx, sy, sw, sh, r);
    ctx.clip();

    // Cover-fit the photo
    const ir = photo.width / photo.height, sr2 = sw / sh;
    let srcX = 0, srcY = 0, srcW = photo.width, srcH = photo.height;
    if (ir > sr2) { srcW = photo.height * sr2; srcX = (photo.width - srcW) / 2; }
    else { srcH = photo.width / sr2; srcY = (photo.height - srcH) / 2; }
    ctx.drawImage(photo, srcX, srcY, srcW, srcH, sx, sy, sw, sh);
    ctx.restore();
  });

  // 3. Foreground — borders and overlays on top of photos (async if available)
  if (template.paintFgAsync) {
    await template.paintFgAsync(ctx, W, H, s, date);
  } else {
    template.paintFg(ctx, W, H, s, date);
  }

  return canvas.toDataURL('image/png', 1.0);
}
