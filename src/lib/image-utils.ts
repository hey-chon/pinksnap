const SAFE_IMAGE_DATA_URL = /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=\s]+$/;
const SAFE_SVG_DATA_URL = /^data:image\/svg\+xml(?:;charset=[^,]+)?,(?:%[0-9a-fA-F]{2}|[A-Za-z0-9._~!$&'()*+,;=:@/?-])*$/;
const MAX_IMAGE_DATA_URL_LENGTH = 48_000_000;

export function isSafeImageDataUrl(value: unknown): value is string {
  return typeof value === 'string'
    && value.length <= MAX_IMAGE_DATA_URL_LENGTH
    && (SAFE_IMAGE_DATA_URL.test(value) || SAFE_SVG_DATA_URL.test(value));
}

export async function createGalleryPreview(dataUrl: string): Promise<string> {
  if (!isSafeImageDataUrl(dataUrl)) return '';

  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      // Gallery copies are intentionally smaller than the exported download.
      // This keeps cloud storage efficient while preserving a sharp preview.
      const maxWidth = 560;
      const scale = Math.min(1, maxWidth / image.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d');
      if (!context) {
        resolve(dataUrl);
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.72));
    };
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, payload] = dataUrl.split(',', 2);
  if (!header || !payload || !header.startsWith('data:')) {
    throw new Error('Unsupported image data');
  }
  const mimeType = header.match(/^data:([^;]+)/)?.[1] ?? 'application/octet-stream';
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mimeType });
}

export function createMemoryId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  const randomPart = Math.random().toString(36).slice(2, 10);
  return `memory-${Date.now()}-${randomPart}`;
}

const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export async function downloadImage(dataUrl: string, filename: string) {
  if (!isSafeImageDataUrl(dataUrl)) {
    throw new Error('Unsupported image data');
  }

  const blob = dataUrlToBlob(dataUrl);
  const objectUrl = URL.createObjectURL(blob);

  // On iOS, the `<a download>` click is unreliable — Safari silently ignores
  // it or opens the image in the same tab.  Prefer the Web Share API which
  // surfaces the native share sheet (users can "Save Image" from there).
  if (IS_IOS) {
    try {
      const file = new File([blob], filename, { type: blob.type });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: filename });
        URL.revokeObjectURL(objectUrl);
        return;
      }
    } catch (err) {
      // If the user cancelled the share sheet (AbortError), still treat it as
      // handled — they can always tap "Save & Exit" again.
      if (err instanceof DOMException && err.name === 'AbortError') {
        URL.revokeObjectURL(objectUrl);
        return;
      }
      // For any other error fall through to the tab fallback below.
    }

    // Fallback: open in a new tab so the user can long-press → Save Image.
    const opened = window.open(objectUrl, '_blank');
    if (!opened) {
      window.location.href = objectUrl;
    }
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
    return;
  }

  // Non-iOS path — the standard <a download> approach works reliably.
  const link = document.createElement('a');
  const supportsDownload = 'download' in link;

  if (supportsDownload) {
    link.href = objectUrl;
    link.download = filename;
    link.rel = 'noopener';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
    return;
  }

  // Legacy fallback for very old browsers that lack the download attribute.
  try {
    const file = new File([blob], filename, { type: blob.type });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: filename });
      URL.revokeObjectURL(objectUrl);
      return;
    }
  } catch {
    // ignore and fall through to the tab fallback
  }

  const opened = window.open(objectUrl, '_blank');
  if (!opened) {
    window.location.href = objectUrl;
  }
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
}
