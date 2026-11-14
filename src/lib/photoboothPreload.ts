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

  // Smooth intermediate progress tick
  await new Promise((r) => setTimeout(r, 120));
  onProgress?.({ percent: 65, label: 'PRINTING • CALIBRATING 65%' });

  // Await all package assets
  await Promise.all([stripPromise, baseMachinePromise, plaqueBgPromise]);

  onProgress?.({ percent: 88, label: 'PRINTING • FINALIZING 88%' });

  // Ensure minimum smooth display duration (at least 650ms) so user perceives the real-time package preparation
  const elapsed = performance.now() - startTime;
  if (elapsed < 650) {
    await new Promise((r) => setTimeout(r, 650 - elapsed));
  }

  onProgress?.({ percent: 100, label: 'PRINTING • READY 100%' });
  await new Promise((r) => setTimeout(r, 100));

  const totalDuration = Math.round(performance.now() - startTime);
  return { durationMs: totalDuration };
}

