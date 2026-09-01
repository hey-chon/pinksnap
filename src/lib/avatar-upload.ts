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

  if (!AVATAR_ALLOWED_MIME_TYPES.includes(file.type as typeof AVATAR_ALLOWED_MIME_TYPES[number])) {
    return {
      isValid: false,
      error: 'Only JPG, PNG, or WEBP images are allowed.',
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
      reject(new Error('Unable to decode the selected image.'));
    };

    image.src = imageUrl;
  });
}

function canvasToWebpBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to process image data.'));
        return;
      }
      if (blob.type !== 'image/webp') {
        reject(new Error('Your browser could not encode a secure avatar format.'));
        return;
      }
      resolve(blob);
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

  const sanitizedBlob = await canvasToWebpBlob(canvas);

  if (sanitizedBlob.size <= 0 || sanitizedBlob.size > AVATAR_MAX_FILE_BYTES) {
    throw new Error(`Processed avatar must be ${MAX_MB_TEXT} or smaller.`);
  }

  return new File([sanitizedBlob], 'avatar.webp', { type: 'image/webp' });
}
