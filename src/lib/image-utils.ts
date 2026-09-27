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

function triggerAnchorDownload(objectUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function blobFromSource(source: string): Promise<Blob> {
  if (source.startsWith('data:')) {
    if (!isSafeImageDataUrl(source)) {
      throw new Error('Unsupported image data');
    }
    return dataUrlToBlob(source);
  }
  const response = await fetch(source);
  if (!response.ok) throw new Error('Failed to fetch image');
  return response.blob();
}

export async function downloadImage(
  source: string,
  filename: string,
  options?: { silent?: boolean },
) {
  const silent = options?.silent === true;
  const blob = await blobFromSource(source);
  const objectUrl = URL.createObjectURL(blob);

  // Silent auto-downloads skip the iOS share sheet so printing/receipt
  // navigation is not interrupted. Anchor download still works on Android
  // and desktop; iOS may ignore it, in which case Share remains available.
  if (!silent && IS_IOS) {
    try {
      const file = new File([blob], filename, { type: blob.type || 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: filename });
        URL.revokeObjectURL(objectUrl);
        return;
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        URL.revokeObjectURL(objectUrl);
        return;
      }
    }
  }

  if ('download' in document.createElement('a')) {
    triggerAnchorDownload(objectUrl, filename);
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
    return;
  }

  if (!silent) {
    try {
      const file = new File([blob], filename, { type: blob.type || 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: filename });
        URL.revokeObjectURL(objectUrl);
        return;
      }
    } catch {
      // fall through
    }

    const opened = window.open(objectUrl, '_blank');
    if (!opened && !silent) {
      window.location.href = objectUrl;
    }
  }

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
}
