/**
 * Replace the old QR code in header.png with the new qr.png
 * Preserves the bottom gradient border
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const headerPath = path.join(root, 'header.png');
const qrPath = path.join(root, 'qr.png');
const outputPath = path.join(root, 'pdf-header.png');

async function main() {
  const headerMeta = await sharp(headerPath).metadata();
  console.log(`Header: ${headerMeta.width}x${headerMeta.height}`);

  const headerWidth = headerMeta.width;
  const headerHeight = headerMeta.height;

  // QR area coordinates (from pixel analysis)
  // Old QR green pixels: x=(1822..2150), y=(81..282)
  // White cover should NOT cover the bottom border (gradient at ~y=370+)
  
  const qrAreaLeft = 1870;
  const qrAreaTop = 30;       // Top of QR zone
  const qrAreaRight = 2165;
  const qrAreaBottom = 350;    // Stop before the bottom gradient border (~last 27px)
  
  const qrAreaWidth = qrAreaRight - qrAreaLeft;
  const qrAreaHeight = qrAreaBottom - qrAreaTop;
  
  // Make QR code square, fitted to the area
  const qrSize = Math.min(qrAreaWidth, qrAreaHeight);
  
  // Center the QR in the area
  const qrLeft = qrAreaLeft + Math.round((qrAreaWidth - qrSize) / 2);
  const qrTop = qrAreaTop + Math.round((qrAreaHeight - qrSize) / 2);

  console.log(`QR area: ${qrAreaWidth}x${qrAreaHeight}`);
  console.log(`QR size: ${qrSize}x${qrSize} at (${qrLeft}, ${qrTop})`);

  // Resize the new QR code
  const resizedQr = await sharp(qrPath)
    .resize(qrSize, qrSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer();

  // Create white cover that only covers the QR zone (not the bottom gradient)
  const coverWidth = headerWidth - qrAreaLeft + 10;
  const coverHeight = qrAreaBottom - qrAreaTop;
  const whiteCover = await sharp({
    create: {
      width: coverWidth,
      height: coverHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  }).png().toBuffer();

  // Composite
  const result = await sharp(headerPath)
    .composite([
      {
        input: whiteCover,
        left: qrAreaLeft,
        top: qrAreaTop,
      },
      {
        input: resizedQr,
        left: qrLeft,
        top: qrTop,
      }
    ])
    .png()
    .toFile(outputPath);

  console.log(`✅ Saved pdf-header.png (${result.width}x${result.height}, ${result.size} bytes)`);
}

main().catch(err => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
