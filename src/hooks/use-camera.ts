import { useState, useRef, useCallback } from 'react';

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    if (!window.isSecureContext) {
      setError('Camera access requires HTTPS or localhost. You can continue in demo mode.');
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera access is not available in this browser. You can continue in demo mode.');
      return;
    }

    try {
      setError(null);
      streamRef.current?.getTracks().forEach(track => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'user' },
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      streamRef.current = stream;
      setError(null);
    } catch (err) {
      const name = err instanceof DOMException ? err.name : '';
      setError(
        name === 'NotAllowedError'
          ? 'Camera permission was blocked. Allow camera access in Safari Settings, or continue in demo mode.'
          : 'Could not start the camera on this device. You can continue in demo mode.'
      );
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return null;

    const sourceWidth = video.videoWidth;
    const sourceHeight = video.videoHeight;
    if (!sourceWidth || !sourceHeight) return null;

    // Crop to the strip card ratio.
    const outputWidth = 1200;
    const outputHeight = 900;
    const sourceRatio = sourceWidth / sourceHeight;
    const targetRatio = outputWidth / outputHeight;
    let cropWidth = sourceWidth;
    let cropHeight = sourceHeight;
    let cropX = 0;
    let cropY = 0;

    if (sourceRatio > targetRatio) {
      cropWidth = sourceHeight * targetRatio;
      cropX = (sourceWidth - cropWidth) / 2;
    } else if (sourceRatio < targetRatio) {
      cropHeight = sourceWidth / targetRatio;
      cropY = (sourceHeight - cropHeight) / 2;
    }

    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Match the mirrored preview.
      ctx.translate(outputWidth, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(
        video,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        outputWidth,
        outputHeight
      );
      return canvas.toDataURL('image/jpeg', 0.9);
    }
    return null;
  }, []);

  return { videoRef, startCamera, stopCamera, captureFrame, error };
}
