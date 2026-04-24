import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const directoryPath = path.join(process.cwd(), 'public/media/migrated/products');

async function optimizeImages() {
  try {
    const files = await fs.readdir(directoryPath);
    const imageFiles = files.filter(file => file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg'));

    console.log(`Found ${imageFiles.length} images to optimize.`);

    for (const file of imageFiles) {
      const filePath = path.join(directoryPath, file);
      const stats = await fs.stat(filePath);
      
      // Only process files larger than 1MB
      if (stats.size > 1024 * 1024) {
        console.log(`Optimizing ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)...`);
        const tmpPath = `${filePath}.tmp.png`;
        
        await sharp(filePath)
          .resize({ width: 1200, withoutEnlargement: true })
          .png({ palette: true, quality: 80, compressionLevel: 9 })
          .toFile(tmpPath);
          
        const newStats = await fs.stat(tmpPath);
        console.log(`  -> New size: ${(newStats.size / 1024 / 1024).toFixed(2)} MB`);
        
        // Replace original with optimized version
        await fs.rename(tmpPath, filePath);
      }
    }
    console.log('Finished optimizing images.');
  } catch (error) {
    console.error('Error optimizing images:', error);
  }
}

optimizeImages();
