import {
  AVATAR_ALLOWED_MIME_TYPES,
  AVATAR_MAX_FILE_BYTES,
  AVATAR_MAX_PIXEL_AREA,
  AVATAR_MIN_DIMENSION_PX,
  AVATAR_TARGET_SIZE_PX,
} from '@/lib/avatar';

const MAX_MB_TEXT = `${Math.round(AVATAR_MAX_FILE_BYTES / (1024 * 1024))}MB`;

export function validateAvatarFile(file: File): { isValid: boolean; error?: string } {
  if (!(file instanceof File)) {
    return {
      isValid: false,
      error: 'Please choose a valid image file.',
    };
  }

  if (file.size <= 0) {
    return {
      isValid: false,
      error: 'The selected file is empty.',
    };
  }

  if (file.size > AVATAR_MAX_FILE_BYTES) {
    return {
      isValid: false,
      error: `Avatar must be ${MAX_MB_TEXT} or smaller.`,
    };
  }

  // Support iOS Safari Photo Library (which can have image/heic, image/heif, empty type, etc.)
  const isImageMime = file.type ? file.type.startsWith('image/') : false;
  const isImageExt = /\.(jpe?g|png|webp|heic|heif|bmp|gif|avif)$/i.test(file.name);

  if (!isImageMime && !isImageExt) {
    return {
      isValid: false,
      error: 'Please select an image from your photos (JPG, PNG, WEBP, or HEIC).',
    };
  }

  return { isValid: true };
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imageUrl = URL.createObjectURL(file);
    const image = new Image();
    image.decoding = 'async';

    image.onload = () => {
      URL.revokeObjectURL(imageUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error('Unable to decode the selected image. Please try another photo.'));
    };

    image.src = imageUrl;
  });
}

function canvasToAvatarBlob(canvas: HTMLCanvasElement): Promise<{ blob: Blob; ext: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    // 1. Try webp first
    canvas.toBlob((webpBlob) => {
      if (webpBlob && webpBlob.type === 'image/webp') {
        resolve({ blob: webpBlob, ext: 'webp', mimeType: 'image/webp' });
        return;
      }
      // 2. Safari / iOS fallback to jpeg
      canvas.toBlob((jpegBlob) => {
        if (jpegBlob && (jpegBlob.type === 'image/jpeg' || jpegBlob.type === 'image/jpg')) {
          resolve({ blob: jpegBlob, ext: 'jpg', mimeType: 'image/jpeg' });
          return;
        }
        // 3. Fallback to png
        canvas.toBlob((pngBlob) => {
          if (pngBlob) {
            resolve({ blob: pngBlob, ext: 'png', mimeType: 'image/png' });
            return;
          }
          reject(new Error('Failed to process image data on this browser.'));
        }, 'image/png');
      }, 'image/jpeg', 0.9);
    }, 'image/webp', 0.9);
  });
}

export async function sanitizeAvatarForUpload(file: File): Promise<File> {
  const validation = validateAvatarFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Invalid avatar file.');
  }

  const image = await loadImageFromFile(file);
  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;

  if (sourceWidth < AVATAR_MIN_DIMENSION_PX || sourceHeight < AVATAR_MIN_DIMENSION_PX) {
    throw new Error(`Avatar must be at least ${AVATAR_MIN_DIMENSION_PX}px on both sides.`);
  }

  if (sourceWidth * sourceHeight > AVATAR_MAX_PIXEL_AREA) {
    throw new Error('Image dimensions are too large to process safely.');
  }

  const cropSize = Math.min(sourceWidth, sourceHeight);
  const targetSize = Math.min(AVATAR_TARGET_SIZE_PX, cropSize);
  const sx = Math.floor((sourceWidth - cropSize) / 2);
  const sy = Math.floor((sourceHeight - cropSize) / 2);

  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to initialize secure image processing.');
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, sx, sy, cropSize, cropSize, 0, 0, targetSize, targetSize);

  const { blob: sanitizedBlob, ext, mimeType } = await canvasToAvatarBlob(canvas);

  if (sanitizedBlob.size <= 0 || sanitizedBlob.size > AVATAR_MAX_FILE_BYTES) {
    throw new Error(`Processed avatar must be ${MAX_MB_TEXT} or smaller.`);
  }

  return new File([sanitizedBlob], `avatar.${ext}`, { type: mimeType });
}
