/**
 * Client-side image compression utility.
 *
 * Compresses and optionally resizes images using the browser's Canvas API
 * before uploading to Cloudinary or local server.
 * No external dependencies — uses only native browser APIs.
 */

/** Configuration for image compression */
export interface CompressOptions {
  /** Max width in pixels. Height scales proportionally. Default: 1920 */
  maxWidth?: number;
  /** Max height in pixels. Width scales proportionally. Default: 1920 */
  maxHeight?: number;
  /** Output quality 0–1 (only for lossy formats). Default: 0.82 */
  quality?: number;
  /** Output MIME type. Default: 'image/webp' */
  outputType?: 'image/webp' | 'image/jpeg' | 'image/png';
  /** Skip compression if file is already smaller than this (bytes). Default: 200KB */
  skipBelowBytes?: number;
}

const DEFAULT_OPTIONS: Required<CompressOptions> = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.82,
  outputType: 'image/webp',
  skipBelowBytes: 200 * 1024, // 200 KB
};

/**
 * Load an image file into an HTMLImageElement.
 */
const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image for compression.'));
    };
    img.src = URL.createObjectURL(file);
  });

/**
 * Calculate new dimensions maintaining aspect ratio.
 */
const calculateDimensions = (
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }

  const ratio = Math.min(maxWidth / width, maxHeight / height);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
};

/**
 * Convert a canvas to a File object.
 */
const canvasToFile = (
  canvas: HTMLCanvasElement,
  fileName: string,
  mimeType: string,
  quality: number
): Promise<File> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas compression produced an empty result.'));
          return;
        }

        // Build output filename with correct extension
        const ext = mimeType === 'image/webp' ? '.webp' : mimeType === 'image/jpeg' ? '.jpg' : '.png';
        const baseName = fileName.replace(/\.[^.]+$/, '');
        const outputName = `${baseName}${ext}`;

        resolve(new File([blob], outputName, { type: mimeType }));
      },
      mimeType,
      quality
    );
  });

/**
 * Compress an image file before upload.
 *
 * - Resizes to fit within maxWidth × maxHeight (maintains aspect ratio)
 * - Converts to WebP (or specified format) for smaller file size
 * - Skips compression for SVGs and already-small files
 * - Returns the original file if compression makes it larger
 *
 * @example
 * ```ts
 * const compressed = await compressImage(file, { maxWidth: 1200, quality: 0.8 });
 * await uploadToCloudinary(compressed, ['products']);
 * ```
 */
export const compressImage = async (
  file: File,
  options?: CompressOptions
): Promise<File> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Skip non-compressible formats (SVG, GIF with potential animation)
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }

  // Skip already-small files
  if (file.size <= opts.skipBelowBytes) {
    return file;
  }

  // Load image onto canvas
  const img = await loadImage(file);
  const { width, height } = calculateDimensions(
    img.naturalWidth,
    img.naturalHeight,
    opts.maxWidth,
    opts.maxHeight
  );

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    // Canvas not available (e.g. SSR) — return original
    return file;
  }

  ctx.drawImage(img, 0, 0, width, height);

  // Compress
  const compressed = await canvasToFile(canvas, file.name, opts.outputType, opts.quality);

  // Only use compressed version if it's actually smaller
  if (compressed.size >= file.size) {
    return file;
  }

  const savedKB = ((file.size - compressed.size) / 1024).toFixed(1);
  console.log(
    `[Image Compress] ${file.name}: ${(file.size / 1024).toFixed(0)}KB → ${(compressed.size / 1024).toFixed(0)}KB (saved ${savedKB}KB)`
  );

  return compressed;
};
