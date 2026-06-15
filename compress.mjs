import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

/**
 * Compress & convert images to WebP across all public/media directories.
 *
 * Usage:
 *   node compress.mjs              — process all directories
 *   node compress.mjs --dry-run    — preview changes without writing
 *
 * Behavior:
 *   - Converts PNG/JPG/JPEG → WebP (same filename, .webp extension)
 *   - Resizes to max width (configurable per directory)
 *   - Keeps original files as backup with .original extension (unless --no-backup)
 *   - Skips files that already have a .webp counterpart
 */

const MEDIA_ROOT = path.join(process.cwd(), 'public/media');

// Directories to process with their max width settings
const TARGETS = [
  { dir: 'about', maxWidth: 1600, quality: 80 },
  { dir: 'pepper', maxWidth: 1200, quality: 80 },
  { dir: 'careers', maxWidth: 1600, quality: 80 },
  { dir: 'migrated/products', maxWidth: 1200, quality: 80 },
];

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg']);
const isDryRun = process.argv.includes('--dry-run');
const noBackup = process.argv.includes('--no-backup');

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function processDirectory({ dir, maxWidth, quality }) {
  const fullDir = path.join(MEDIA_ROOT, dir);

  let files;
  try {
    files = await fs.readdir(fullDir);
  } catch {
    console.log(`⏭️  Skipping ${dir}/ — directory not found`);
    return { processed: 0, savedBytes: 0 };
  }

  const imageFiles = files.filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return IMAGE_EXTENSIONS.has(ext) && !file.endsWith('.original');
  });

  if (imageFiles.length === 0) {
    console.log(`⏭️  Skipping ${dir}/ — no images to process`);
    return { processed: 0, savedBytes: 0 };
  }

  console.log(`\n📁 Processing ${dir}/ — ${imageFiles.length} images`);

  let processed = 0;
  let savedBytes = 0;

  for (const file of imageFiles) {
    const filePath = path.join(fullDir, file);
    const baseName = path.basename(file, path.extname(file));
    const webpPath = path.join(fullDir, `${baseName}.webp`);

    // Skip if WebP version already exists
    try {
      await fs.access(webpPath);
      console.log(`  ⏭️  ${file} — WebP already exists, skipping`);
      continue;
    } catch {
      // WebP doesn't exist, proceed
    }

    const stats = await fs.stat(filePath);
    const originalSize = stats.size;

    if (isDryRun) {
      console.log(`  🔍 ${file} (${formatSize(originalSize)}) → would convert to WebP`);
      processed++;
      continue;
    }

    try {
      await sharp(filePath)
        .resize({ width: maxWidth, withoutEnlargement: true })
        .webp({ quality, effort: 6 })
        .toFile(webpPath);

      const newStats = await fs.stat(webpPath);
      const saved = originalSize - newStats.size;
      savedBytes += saved;

      console.log(
        `  ✅ ${file} (${formatSize(originalSize)}) → ${baseName}.webp (${formatSize(newStats.size)}) — saved ${formatSize(saved)}`
      );

      // Backup original (rename to .original)
      if (!noBackup) {
        await fs.rename(filePath, `${filePath}.original`);
      }

      processed++;
    } catch (error) {
      console.error(`  ❌ ${file} — ${error.message}`);
    }
  }

  return { processed, savedBytes };
}

async function main() {
  console.log('🖼️  Foodera Image Optimizer');
  console.log(`   Mode: ${isDryRun ? 'DRY RUN (no changes)' : 'LIVE'}`);
  console.log(`   Backup: ${noBackup ? 'disabled' : 'enabled (originals renamed to .original)'}`);
  console.log(`   Output: WebP format\n`);

  let totalProcessed = 0;
  let totalSaved = 0;

  for (const target of TARGETS) {
    const { processed, savedBytes } = await processDirectory(target);
    totalProcessed += processed;
    totalSaved += savedBytes;
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`📊 Summary: ${totalProcessed} images processed, ${formatSize(totalSaved)} saved`);

  if (isDryRun) {
    console.log('\n💡 Run without --dry-run to apply changes.');
  }
}

main();
