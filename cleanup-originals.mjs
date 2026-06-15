import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Clean up original PNG/JPG files that already have WebP counterparts.
 * Only removes files that have a corresponding .webp version.
 * 
 * Usage:
 *   node cleanup-originals.mjs              — delete originals
 *   node cleanup-originals.mjs --dry-run    — preview only
 */

const MEDIA_ROOT = path.join(process.cwd(), 'public/media');
const TARGETS = ['about', 'pepper', 'careers', 'migrated/products'];
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg']);
const isDryRun = process.argv.includes('--dry-run');

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function cleanDirectory(dir) {
  const fullDir = path.join(MEDIA_ROOT, dir);
  let files;
  try { files = await fs.readdir(fullDir); } catch { return { deleted: 0, freedBytes: 0 }; }

  let deleted = 0, freedBytes = 0;

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!IMAGE_EXTENSIONS.has(ext)) continue;

    const baseName = path.basename(file, ext);
    const webpPath = path.join(fullDir, `${baseName}.webp`);

    try {
      await fs.access(webpPath);
    } catch {
      // No WebP counterpart — keep the original
      continue;
    }

    const filePath = path.join(fullDir, file);
    const stats = await fs.stat(filePath);

    if (isDryRun) {
      console.log(`  🔍 Would delete: ${file} (${formatSize(stats.size)})`);
    } else {
      await fs.unlink(filePath);
      console.log(`  🗑️  Deleted: ${file} (${formatSize(stats.size)})`);
    }
    deleted++;
    freedBytes += stats.size;
  }

  return { deleted, freedBytes };
}

async function main() {
  console.log(`🧹 Cleanup Original Images (${isDryRun ? 'DRY RUN' : 'LIVE'})\n`);

  let totalDeleted = 0, totalFreed = 0;

  for (const dir of TARGETS) {
    console.log(`📁 ${dir}/`);
    const { deleted, freedBytes } = await cleanDirectory(dir);
    totalDeleted += deleted;
    totalFreed += freedBytes;
    if (deleted === 0) console.log('  (no originals to remove)');
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`📊 ${totalDeleted} files ${isDryRun ? 'would be ' : ''}removed, ${formatSize(totalFreed)} freed`);
}

main();
