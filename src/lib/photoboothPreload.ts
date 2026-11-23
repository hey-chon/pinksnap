import { unlockAndPreloadAudio } from './photoboothAudio';

/**
 * Preload and hardware-decode an image into memory.
 */
export async function preloadAndDecodeImage(src: string): Promise<boolean> {
  if (!src) return false;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const handleSuccess = () => {
      if ('decode' in img && typeof img.decode === 'function') {
        img
          .decode()
          .then(() => resolve(true))
          .catch(() => resolve(true)); // decode error still means image is loaded
      } else {
        resolve(true);
      }
    };

    img.onload = handleSuccess;
    img.onerror = () => resolve(false);
    img.src = src;

    if (img.complete) {
      handleSuccess();
    }
  });
}

export interface PackageLoadProgress {
  percent: number;
  label: string;
}

/**
 * Real-time package loading system for the photobooth dispenser.
 * Loads all printer packages, backgrounds, strip textures, and unlocks audio during the user click.
 */
export async function preloadPhotoboothPackages(
  stripDataUrl: string,
  onProgress?: (info: PackageLoadProgress) => void
): Promise<{ durationMs: number }> {
  const startTime = performance.now();

  // Step 1: Initializing
  onProgress?.({ percent: 15, label: 'PRINTING • PACKAGING 15%' });

  // Unlock and synthesize audio context during gesture
  try {
    unlockAndPreloadAudio();
  } catch {
    // ignore
  }

  // Step 2: Strip decode + machine asset downloads
  onProgress?.({ percent: 35, label: 'PRINTING • PREPARING 35%' });

  const stripPromise = preloadAndDecodeImage(stripDataUrl);
  const baseMachinePromise = preloadAndDecodeImage('/photobooth-machine-base.png');
  const plaqueBgPromise = preloadAndDecodeImage('/photobooth-plaque-bg.jpg');

  onProgress?.({ percent: 65, label: 'PRINTING • CALIBRATING 65%' });

  // Await all package assets
  await Promise.all([stripPromise, baseMachinePromise, plaqueBgPromise]);

  onProgress?.({ percent: 100, label: 'PRINTING • READY 100%' });

  const totalDuration = Math.round(performance.now() - startTime);
  return { durationMs: totalDuration };
}

export const ARTISAN_TEMPLATE_IMAGES: string[] = [
  '/templates/image.jpg',
  '/templates/the-1975.jpg',
  '/templates/retro-tv.jpg',
  '/templates/love-stamp.jpg',
  '/templates/A9hsW.jpg?v=3',
  '/templates/r3PiC.jpg?v=4',
  '/templates/IMG_2605.JPG',
  '/templates/on-this-clean-black.jpg',
  '/templates/director-cut.jpg',
  '/templates/newspaper.jpg',
];

/**
 * Preload and hardware-decode all artisan template assets so selecting
 * strips in edit/customization mode is instantaneous with 0 lag.
 */
export function preloadAllArtisanTemplates(): void {
  if (typeof window === 'undefined') return;
  ARTISAN_TEMPLATE_IMAGES.forEach((src) => {
    preloadAndDecodeImage(src);
  });
}


