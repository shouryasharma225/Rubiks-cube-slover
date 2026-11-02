/**
 * Computer Vision Color Detector for Rubik's Cube Faces
 * Processes image, video, or canvas data to detect the 9 stickers
 * on a photographed Rubik's cube face and classifies them into standard colors.
 */

// Official Rubik's cube color keys
export const DETECTED_COLORS = {
  WHITE: 'white',
  YELLOW: 'yellow',
  RED: 'red',
  ORANGE: 'orange',
  BLUE: 'blue',
  GREEN: 'green'
};

/**
 * Converts RGB (0-255) to HSV (H: 0-360, S: 0-1, V: 0-1)
 */
export function rgbToHsv(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
      default:
        break;
    }
    h *= 60;
  }

  return { h, s, v };
}

/**
 * Classifies an RGB color into one of the 6 Rubik's Cube colors
 * using lighting-invariant HSV & chromaticity thresholds.
 */
export function classifyColor(r, g, b) {
  const { h, s, v } = rgbToHsv(r, g, b);

  // 1. White detection: Low saturation with moderate to high brightness
  // Or high RGB values where all channels are well-balanced
  const isNeutral = s < 0.22 && v > 0.38;
  const isHighWhite = r > 180 && g > 180 && b > 180 && Math.abs(r - g) < 28 && Math.abs(g - b) < 28;
  if (isNeutral || isHighWhite) {
    return 'white';
  }

  // 2. Yellow vs Orange vs Red:
  // Yellow has high Red & Green, low Blue, Hue between 42° and 72°
  if (h >= 42 && h <= 72 && v > 0.45 && s > 0.35) {
    // If green channel is significantly strong
    if (g > 130 && r > 130) {
      return 'yellow';
    }
  }

  // Orange: Hue typically between 14° and 42°, Red > Green > Blue
  if (h >= 14 && h < 42 && s > 0.45) {
    if (g > b + 25) {
      return 'orange';
    }
  }

  // Red: Hue wrap-around (340° - 360° or 0° - 14°), dominant Red channel
  if ((h >= 340 || h < 14) && s > 0.4) {
    return 'red';
  }

  // Green: Hue between 72° and 168°, dominant Green channel
  if (h >= 72 && h <= 168 && s > 0.25) {
    return 'green';
  }

  // Blue: Hue between 170° and 265°, dominant Blue channel
  if (h >= 170 && h <= 265 && s > 0.28) {
    return 'blue';
  }

  // Fallback distance-based classifier if hue falls on boundary
  const referencePalette = [
    { key: 'white', r: 245, g: 245, b: 245 },
    { key: 'yellow', r: 240, g: 210, b: 20 },
    { key: 'red', r: 210, g: 25, b: 35 },
    { key: 'orange', r: 245, g: 110, b: 15 },
    { key: 'blue', r: 25, g: 85, b: 220 },
    { key: 'green', r: 20, g: 160, b: 65 }
  ];

  let minDistance = Infinity;
  let bestKey = 'white';

  for (const ref of referencePalette) {
    // Weighted Euclidean color distance (approximating human eye perception)
    const dr = r - ref.r;
    const dg = g - ref.g;
    const db = b - ref.b;
    const dist = 0.3 * dr * dr + 0.59 * dg * dg + 0.11 * db * db;
    if (dist < minDistance) {
      minDistance = dist;
      bestKey = ref.key;
    }
  }

  return bestKey;
}

/**
 * Extracts 9 sticker colors from an HTMLCanvasElement containing a photographed face.
 * Divides the central square of the canvas into a 3x3 grid and samples the center 45% of each cell.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {object} [options] - Custom crop region { x, y, width, height }
 * @returns {Array<{ index: number, color: string, rgb: { r: number, g: number, b: number }, hex: string }>}
 */
export function extractFaceStickersFromCanvas(canvas, options = {}) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Determine bounding square area
  const size = options.width || Math.min(width, height) * 0.82;
  const startX = options.x !== undefined ? options.x : (width - size) / 2;
  const startY = options.y !== undefined ? options.y : (height - size) / 2;

  const cellSize = size / 3;
  const sampleRadius = cellSize * 0.22; // Sample center ~45% diameter

  const stickers = [];

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const index = row * 3 + col;
      const centerX = Math.round(startX + col * cellSize + cellSize / 2);
      const centerY = Math.round(startY + row * cellSize + cellSize / 2);

      // Extract pixel block around center
      const sampleSize = Math.max(4, Math.round(sampleRadius * 2));
      const sampleLeft = Math.max(0, Math.round(centerX - sampleRadius));
      const sampleTop = Math.max(0, Math.round(centerY - sampleRadius));

      const imgData = ctx.getImageData(sampleLeft, sampleTop, sampleSize, sampleSize);
      const data = imgData.data;

      let sumR = 0, sumG = 0, sumB = 0, count = 0;

      for (let p = 0; p < data.length; p += 4) {
        // Ignore transparent pixels or extreme specular glare if any
        sumR += data[p];
        sumG += data[p + 1];
        sumB += data[p + 2];
        count++;
      }

      const avgR = count > 0 ? Math.round(sumR / count) : 128;
      const avgG = count > 0 ? Math.round(sumG / count) : 128;
      const avgB = count > 0 ? Math.round(sumB / count) : 128;

      const detectedColor = classifyColor(avgR, avgG, avgB);
      const hex = `#${((1 << 24) + (avgR << 16) + (avgG << 8) + avgB).toString(16).slice(1)}`;

      stickers.push({
        index,
        color: detectedColor,
        rgb: { r: avgR, g: avgG, b: avgB },
        hex,
        coords: { x: centerX, y: centerY }
      });
    }
  }

  return stickers;
}

/**
 * Loads an image file or DataURL into an HTMLImageElement asynchronously
 */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Convenience helper to process an image source and return the 9 detected colors
 */
export async function scanFaceImage(imageSrc) {
  const img = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  const maxDim = 640;
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);

  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return extractFaceStickersFromCanvas(canvas);
}
