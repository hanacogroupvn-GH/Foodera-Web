/**
 * remove-bg.mjs
 * Removes white/near-white background from a PNG using sharp.
 * Usage: node scripts/remove-bg.mjs <input> <output> [threshold]
 */

import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';

const [,, inputPath, outputPath, thresholdArg] = process.argv;
const threshold = parseInt(thresholdArg ?? '20', 10); // tolerance 0-255

if (!inputPath || !outputPath) {
  console.error('Usage: node scripts/remove-bg.mjs <input.png> <output.png> [threshold]');
  process.exit(1);
}

const image = sharp(inputPath).ensureAlpha();
const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

const { width, height, channels } = info; // channels = 4 (RGBA)
const pixels = new Uint8ClampedArray(data);

for (let i = 0; i < pixels.length; i += channels) {
  const r = pixels[i];
  const g = pixels[i + 1];
  const b = pixels[i + 2];
  // If pixel is white or near-white → make transparent
  if (r >= 255 - threshold && g >= 255 - threshold && b >= 255 - threshold) {
    pixels[i + 3] = 0; // alpha = 0
  }
}

await sharp(Buffer.from(pixels), {
  raw: { width, height, channels }
})
  .png()
  .toFile(outputPath);

console.log(`✅ Done: ${outputPath} (${width}×${height}px, threshold=${threshold})`);
