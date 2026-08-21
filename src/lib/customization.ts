export type FrameType =
  | 'classic'
  | 'filmstrip'
  | 'polaroid'
  | 'arcade'
  | 'vip'
  | 'kraft'
  | 'midnight'
  | 'sunset'
  | 'y2k'
  | 'mint'
  | 'ocean'
  | 'white'
  | 'strawberry'
  | 'bubblegum'
  | 'sakura'
  | 'checkered'
  | 'confetti'
  | 'lavender'
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

export type FrameCategory = 'booth' | 'glow' | 'cute';

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
  { id: 'booth', label: 'Booth' },
  { id: 'glow', label: 'Glow' },
  { id: 'cute', label: 'Cute' },
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

export const FRAME_OPTIONS: FrameOption[] = [
  {
    id: 'classic',
    label: 'Classic Booth',
    note: 'Mall curtain black',
    category: 'booth',
    className: 'frame-classic',
    dark: true,
    matte: 'rgba(255,255,255,.22)',
    paint: (ctx, w, h) => {
      fill(ctx, '#141017', w, h);
      const glow = ctx.createRadialGradient(w / 2, h * 0.12, 10, w / 2, h * 0.12, h * 0.55);
      glow.addColorStop(0, 'rgba(255,214,235,.20)');
      glow.addColorStop(1, 'rgba(20,16,23,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(255,255,255,.16)';
      ctx.lineWidth = 2;
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
    id: 'polaroid',
    label: 'Instant Print',
    note: 'Fresh out the slot',
    category: 'booth',
    className: 'frame-polaroid',
    dark: false,
    matte: 'rgba(31,29,43,.14)',
    paint: (ctx, w, h) => {
      fill(ctx, '#fbf9f4', w, h);
      const shade = ctx.createLinearGradient(0, 0, 0, h);
      shade.addColorStop(0, 'rgba(0,0,0,.05)');
      shade.addColorStop(0.35, 'rgba(0,0,0,0)');
      shade.addColorStop(1, 'rgba(0,0,0,.06)');
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, w, h);
      speckle(ctx, w, h, 'rgba(31,29,43,.035)', 26, 1.4);
    },
  },
  {
    id: 'arcade',
    label: 'Mall Arcade',
    note: 'Neon grid haze',
    category: 'booth',
    className: 'frame-arcade',
    dark: true,
    matte: 'rgba(120,242,255,.4)',
    paint: (ctx, w, h) => {
      verticalGradient(ctx, w, h, [
        [0, '#150c2c'],
        [0.55, '#221046'],
        [1, '#3a0f3d'],
      ]);
      ctx.strokeStyle = 'rgba(120,242,255,.16)';
      ctx.lineWidth = 1.5;
      for (let x = 0; x < w; x += 46) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 46) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      const glow = ctx.createRadialGradient(w / 2, h, 20, w / 2, h, h * 0.7);
      glow.addColorStop(0, 'rgba(255,64,160,.35)');
      glow.addColorStop(1, 'rgba(255,64,160,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
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
      ctx.strokeStyle = 'rgba(226,183,106,.55)';
      ctx.lineWidth = 3;
      ctx.strokeRect(18, 18, w - 36, h - 36);
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
    id: 'midnight',
    label: 'Midnight Neon',
    note: 'After hours glow',
    category: 'glow',
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
    category: 'glow',
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
    category: 'glow',
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
    category: 'glow',
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
    category: 'glow',
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
    category: 'cute',
    className: 'frame-white',
    dark: false,
    matte: 'rgba(31,29,43,.12)',
    paint: (ctx, w, h) => fill(ctx, '#ffffff', w, h),
  },
  {
    id: 'strawberry',
    label: 'Strawberry',
    note: 'Berry sweet dots',
    category: 'cute',
    className: 'frame-strawberry',
    dark: false,
    matte: 'rgba(246,111,150,.4)',
    paint: (ctx, w, h) => {
      fill(ctx, '#fff2f7', w, h);
      for (let y = 30; y < h; y += 74) {
        for (let x = 28; x < w; x += 74) {
          ctx.fillStyle = '#f66f96';
          ctx.beginPath();
          ctx.moveTo(x, y + 9);
          ctx.bezierCurveTo(x - 11, y - 2, x - 7, y - 12, x, y - 6);
          ctx.bezierCurveTo(x + 7, y - 12, x + 11, y - 2, x, y + 9);
          ctx.fill();
          ctx.strokeStyle = '#59ad71';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x - 6, y - 9);
          ctx.lineTo(x, y - 14);
          ctx.lineTo(x + 6, y - 9);
          ctx.stroke();
        }
      }
    },
  },
  {
    id: 'bubblegum',
    label: 'Bubblegum',
    note: 'Big soft bubbles',
    category: 'cute',
    className: 'frame-bubblegum',
    dark: false,
    matte: 'rgba(244,126,174,.45)',
    paint: (ctx, w, h) => {
      fill(ctx, '#ffe1ec', w, h);
      ctx.fillStyle = 'rgba(244,126,174,.55)';
      let n = 0;
      for (let y = 40; y < h; y += 84) {
        for (let x = 30 + (n % 2) * 30; x < w; x += 84) {
          ctx.beginPath();
          ctx.arc(x, y, 16 + (n % 3) * 5, 0, Math.PI * 2);
          ctx.fill();
          n += 1;
        }
      }
    },
  },
  {
    id: 'sakura',
    label: 'Sakura Drift',
    note: 'Falling petals',
    category: 'cute',
    className: 'frame-sakura',
    dark: false,
    matte: 'rgba(31,29,43,.12)',
    paint: (ctx, w, h) => {
      verticalGradient(ctx, w, h, [
        [0, '#fff6f8'],
        [1, '#ffe4ee'],
      ]);
      let n = 0;
      for (let y = 34; y < h; y += 66) {
        for (let x = 26; x < w; x += 70) {
          ctx.save();
          ctx.translate(x + ((n * 11) % 19), y);
          ctx.rotate(n * 0.7);
          ctx.fillStyle = n % 3 === 0 ? 'rgba(255,183,206,.9)' : 'rgba(255,205,222,.85)';
          for (let p = 0; p < 5; p += 1) {
            ctx.rotate((Math.PI * 2) / 5);
            ctx.beginPath();
            ctx.ellipse(0, -7, 3.4, 6.5, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
          n += 1;
        }
      }
    },
  },
  {
    id: 'checkered',
    label: 'Checkered',
    note: 'Diner tiles',
    category: 'cute',
    className: 'frame-checkered',
    dark: false,
    matte: 'rgba(31,29,43,.14)',
    paint: (ctx, w, h) => {
      fill(ctx, '#ffd2df', w, h);
      ctx.fillStyle = '#fff8fb';
      const size = 44;
      for (let y = 0; y < h; y += size) {
        for (let x = 0; x < w; x += size) {
          if ((x / size + y / size) % 2 === 0) ctx.fillRect(x, y, size, size);
        }
      }
    },
  },
  {
    id: 'confetti',
    label: 'Confetti Party',
    note: 'Toss it up',
    category: 'cute',
    className: 'frame-confetti',
    dark: false,
    matte: 'rgba(31,29,43,.12)',
    paint: (ctx, w, h) => {
      fill(ctx, '#fff5df', w, h);
      const colors = ['#f78fb3', '#82c9c0', '#f2bd63', '#a895db'];
      let n = 0;
      for (let y = 26; y < h; y += 58) {
        for (let x = 24; x < w; x += 56) {
          ctx.save();
          ctx.translate(x + ((n * 9) % 15), y);
          ctx.rotate(n % 2 ? 0.5 : -0.6);
          ctx.fillStyle = colors[n % colors.length];
          ctx.fillRect(-4, -10, 8, 20);
          ctx.restore();
          n += 1;
        }
      }
    },
  },
  {
    id: 'lavender',
    label: 'Lavender Haze',
    note: 'Dreamy rings',
    category: 'cute',
    className: 'frame-lavender',
    dark: false,
    matte: 'rgba(31,29,43,.12)',
    paint: (ctx, w, h) => {
      fill(ctx, '#eee7ff', w, h);
      ctx.strokeStyle = '#b59de7';
      ctx.lineWidth = 5;
      for (let y = 28; y < h; y += 74) {
        for (let x = 30; x < w; x += 76) {
          ctx.beginPath();
          ctx.arc(x, y, 10, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    },
  },
  {
    id: 'sky',
    label: 'Cloudy Sky',
    note: 'Soft daydream',
    category: 'cute',
    className: 'frame-sky',
    dark: false,
    matte: 'rgba(31,29,43,.12)',
    paint: (ctx, w, h) => {
      verticalGradient(ctx, w, h, [
        [0, '#e9fbff'],
        [1, '#cfeef7'],
      ]);
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      let n = 0;
      for (let y = 40; y < h; y += 96) {
        const x = 40 + (n % 2) * (w / 3);
        ctx.beginPath();
        ctx.arc(x, y, 18, 0, Math.PI * 2);
        ctx.arc(x + 22, y + 4, 14, 0, Math.PI * 2);
        ctx.arc(x - 20, y + 6, 12, 0, Math.PI * 2);
        ctx.fill();
        n += 1;
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

export const FILTER_OPTIONS: { id: FilterType; label: string; className: string }[] = [
  { id: 'color', label: 'Original', className: 'filter-color' },
  { id: 'bw', label: 'B&W', className: 'filter-bw' },
  { id: 'noir', label: 'Noir', className: 'filter-noir' },
  { id: 'vintage', label: 'Vintage', className: 'filter-vintage' },
  { id: 'film', label: 'Film', className: 'filter-film' },
  { id: 'faded', label: 'Faded', className: 'filter-faded' },
  { id: 'warm', label: 'Warm', className: 'filter-warm' },
  { id: 'cool', label: 'Cool', className: 'filter-cool' },
  { id: 'candy', label: 'Candy', className: 'filter-candy' },
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
  canvas.width = Math.max(1, img.naturalWidth || img.width);
  canvas.height = Math.max(1, img.naturalHeight || img.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  if (filter !== 'color') {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    ctx.putImageData(applyFilterPixels(imageData, filter), 0, 0);
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
