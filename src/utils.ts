/**
 * SOKO High Performance Browser-side Image Compressor
 * Downsamples high-res mobile photos to under 100KB (max 800px width/height, quality 0.7)
 * to ensure blazing-fast Firebase synchronization and avoid Firestore document size limitations.
 */
export function compressBase64Image(base64Str: string, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    // If it's a simple emoji or already extremely short, don't waste time compressing
    if (!base64Str.startsWith('data:image/')) {
      resolve(base64Str);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Keep aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str); // Fallback to raw if canvas is unsupported
        return;
      }

      // Fill background as white to handle transparent PNGs nicely when saving to JPEG
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      ctx.drawImage(img, 0, 0, width, height);

      try {
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      } catch (err) {
        console.warn('Canvas export failed, falling back to original base64:', err);
        resolve(base64Str);
      }
    };

    img.onerror = (err) => {
      console.warn('Failed to load image for compression, falling back:', err);
      resolve(base64Str);
    };

    img.src = base64Str;
  });
}

/**
 * Web Audio API double-ding chime for real-time order alerts.
 * Works 100% offline without requiring external MP3 downloads.
 */
export function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // First Ding (High G-note)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.type = 'sine';
    osc1.frequency.value = 880; // A5 pitch
    gain1.gain.setValueAtTime(0, ctx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.4);

    // Second Ding (Higher C-note, slight offset)
    const delay = 0.12;
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'sine';
    osc2.frequency.value = 1046.5; // C6 pitch
    gain2.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain2.gain.linearRampToValueAtTime(0.35, ctx.currentTime + delay + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.5);
    osc2.start(ctx.currentTime + delay);
    osc2.stop(ctx.currentTime + delay + 0.6);
  } catch (err) {
    console.warn('Audio Context autoplay block or unsupported:', err);
  }
}

