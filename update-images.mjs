import { createClient } from '@libsql/client';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const client = createClient({
  url: 'libsql://foodera-hanacogroupvn-gh.aws-ap-northeast-1.turso.io',
  authToken: process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzcwMDQ4NzUsImlkIjoiMDE5ZGJkMWQtYjIwMS03YjAwLTk4YWYtYTcxYmQzNmRlYTlkIiwicmlkIjoiNjJhNjhmMTgtMjkyNS00ZDdhLTg0MmQtMzQxNTFlMjU1YzdhIn0.WG8m8OAssByfEXdcbP8qymz_xJ1yFJSMR2DiCLaQPKZ9CPblhg-J6ijdL6smU_ssmYoYIXG1j7GG4ECkKTctAQ'
});

const sourceDir = path.resolve('Hình sản phẩm');
const destDir = path.resolve('public/media/products');

const normalize = (s) => s.toLowerCase().replace(/[\s\-\–\—\_]/g, '');

async function run() {
  await fs.mkdir(destDir, { recursive: true });
  
  const rs = await client.execute('SELECT id, name, image FROM products');
  const products = rs.rows;
  
  const files = [];
  
  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === '.venv') continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (/\.(png|jpg|jpeg|webp)$/i.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }
  
  await walk(sourceDir);
  
  let matchCount = 0;
  
  for (const file of files) {
    const ext = path.extname(file);
    const basename = path.basename(file, ext);
    const filename = path.basename(file);
    
    let matchedProduct = null;
    
    // 1. By exact name match
    matchedProduct = products.find(p => normalize(p.name) === normalize(basename));
    
    // 2. By ID
    if (!matchedProduct) {
      matchedProduct = products.find(p => normalize(p.id) === normalize(basename));
    }
    
    // 3. By Cashew specific naming (e.g. SW240 -> CASHEW-SW240)
    if (!matchedProduct && file.includes('CASHEW')) {
       const parsedId = `CASHEW-${basename.toUpperCase().replace(/[\s_]+/g, '-')}`;
       matchedProduct = products.find(p => p.id === parsedId);
       
       if (!matchedProduct && basename.includes('(')) {
          // Handle 'SW320 (SW3)' -> CASHEW-SW320
          const cleanBase = basename.split('(')[0].trim();
          matchedProduct = products.find(p => p.id === `CASHEW-${cleanBase.toUpperCase()}`);
       }
    }
    
    // 4. By existing image filename
    if (!matchedProduct) {
      matchedProduct = products.find(p => p.image && normalize(path.basename(p.image)) === normalize(filename));
    }
    if (!matchedProduct) {
      matchedProduct = products.find(p => p.image && normalize(path.basename(p.image, path.extname(p.image))) === normalize(basename));
    }
    
    if (matchedProduct) {
       console.log(`[MATCH] ${filename} -> ${matchedProduct.name} (${matchedProduct.id})`);
       
       const newFileName = `${matchedProduct.id.toLowerCase()}-optimized.webp`;
       const newFilePath = path.join(destDir, newFileName);
       
       try {
         await sharp(file)
           .resize({ width: 1200, withoutEnlargement: true })
           .webp({ quality: 80 })
           .toFile(newFilePath);
           
         const newUrl = `/media/products/${newFileName}`;
         
         await client.execute({
           sql: 'UPDATE products SET image = ? WHERE id = ?',
           args: [newUrl, matchedProduct.id]
         });
         matchCount++;
       } catch (err) {
         console.error(`Error processing ${file}:`, err);
       }
    } else {
       console.log(`[UNMATCHED] ${file}`);
    }
  }
  
  console.log(`Successfully mapped and updated ${matchCount} products.`);
}

run().catch(console.error);
