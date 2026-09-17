import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { createClient } from '@libsql/client';
import { loadProjectEnv } from '../server/loadEnv.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

await loadProjectEnv(projectRoot);

const DURIAN_DIR = path.join(projectRoot, 'Durian farm visit');
const COFFEE_DIR = path.join(projectRoot, 'coffe farm visit');
const OUTPUT_DIR = path.join(projectRoot, 'public', 'media', 'gallery');
const GALLERY_JSON_PATH = path.join(projectRoot, 'data', 'gallery.json');

await fs.mkdir(OUTPUT_DIR, { recursive: true });

const DURIAN_IMAGES = [
  {
    file: 'd3138001f754770a2e458.jpg',
    outName: 'durian-farm-visit-01-ancient-tree.webp',
    id: 'gallery-farm-durian-01',
    caption: 'Cây sầu riêng đại thụ trĩu quả với hệ thống gia cố cành chuyên nghiệp tại vườn liên kết FoodEra',
    alt: 'Vườn sầu riêng đại thụ trĩu quả khảo sát nông trại FoodEra',
    category: 'farm-visits',
    album: 'durian-farm-visit',
    albumTitle: 'Khảo sát Vùng trồng Sầu riêng Xuất khẩu',
    sortOrder: 19,
    isActive: true
  },
  {
    file: 'adb4aaa7ddf25dac04e39.jpg',
    outName: 'durian-farm-visit-02-fruit-clusters.webp',
    id: 'gallery-farm-durian-02',
    caption: 'Chùm sầu riêng Ri6 & Monthong đạt độ chín sinh lý tối ưu trên cành trước kỳ thu hoạch',
    alt: 'Chùm sầu riêng trĩu quả trên cành khảo sát chất lượng nông trại FoodEra',
    category: 'farm-visits',
    album: 'durian-farm-visit',
    albumTitle: 'Khảo sát Vùng trồng Sầu riêng Xuất khẩu',
    sortOrder: 20,
    isActive: true
  },
  {
    file: '94fe78ef0fba8fe4d6ab10.jpg',
    outName: 'durian-farm-visit-03-field-inspection.webp',
    id: 'gallery-farm-durian-03',
    caption: 'Đội ngũ chuyên gia FoodEra kiểm tra chất lượng và kích thước sầu riêng trực tiếp tại vườn',
    alt: 'Chuyên viên FoodEra kiểm tra chất lượng sầu riêng tại vườn trồng',
    category: 'farm-visits',
    album: 'durian-farm-visit',
    albumTitle: 'Khảo sát Vùng trồng Sầu riêng Xuất khẩu',
    sortOrder: 21,
    isActive: true
  },
  {
    file: '1e806e9d19c89996c0d97.jpg',
    outName: 'durian-farm-visit-04-harvest-path.webp',
    id: 'gallery-farm-durian-04',
    caption: 'Thu hoạch và phân loại sơ bộ sầu riêng tươi ngay tại lối đi nội bộ của nông trường',
    alt: 'Thu hoạch sầu riêng tập kết dọc đường vườn khảo sát FoodEra',
    category: 'farm-visits',
    album: 'durian-farm-visit',
    albumTitle: 'Khảo sát Vùng trồng Sầu riêng Xuất khẩu',
    sortOrder: 22,
    isActive: true
  },
  {
    file: 'b91abb06cc534c0d15426.jpg',
    outName: 'durian-farm-visit-05-grade-a-pile.webp',
    id: 'gallery-farm-durian-05',
    caption: 'Điểm tập kết sầu riêng tuyển chọn loại 1 chuẩn xuất khẩu cùng bảng nhận diện thương hiệu FoodEra',
    alt: 'Điểm tập kết sầu riêng loại 1 xuất khẩu nông trại liên kết FoodEra',
    category: 'farm-visits',
    album: 'durian-farm-visit',
    albumTitle: 'Khảo sát Vùng trồng Sầu riêng Xuất khẩu',
    sortOrder: 23,
    isActive: true
  }
];

const COFFEE_IMAGES = [
  {
    file: 'd9ce2d4e5a1bda45830a3.jpg',
    outName: 'coffee-farm-visit-01-robusta-tree.webp',
    id: 'gallery-farm-coffee-01',
    caption: 'Toàn cảnh cây cà phê Robusta sinh trưởng vượt trội với tỷ lệ đậu quả dày đặc tại vùng nguyên liệu FoodEra',
    alt: 'Cây cà phê Robusta sinh trưởng tốt sai trĩu quả tại nông trường FoodEra',
    category: 'farm-visits',
    album: 'coffee-farm-visit',
    albumTitle: 'Khảo sát Vùng nguyên liệu Cà phê Robusta',
    sortOrder: 24,
    isActive: true
  },
  {
    file: '706a58e82fbdafe3f6ac1.jpg',
    outName: 'coffee-farm-visit-02-cluster-density.webp',
    id: 'gallery-farm-coffee-02',
    caption: 'Đánh giá mật độ chùm quả và độ đồng đều của nhân cà phê trước thời điểm thu hoạch rộ',
    alt: 'Đánh giá độ đồng đều chùm quả cà phê tại vùng trồng FoodEra',
    category: 'farm-visits',
    album: 'coffee-farm-visit',
    albumTitle: 'Khảo sát Vùng nguyên liệu Cà phê Robusta',
    sortOrder: 25,
    isActive: true
  },
  {
    file: 'f35047d33086b0d8e9972.jpg',
    outName: 'coffee-farm-visit-03-cherry-nodes.webp',
    id: 'gallery-farm-coffee-03',
    caption: 'Kiểm tra cận cảnh các chuỗi đốt trái cà phê Robusta đạt chuẩn kích cỡ và hàm lượng chất lượng cao',
    alt: 'Kiểm tra đốt trái cà phê Robusta chất lượng cao',
    category: 'farm-visits',
    album: 'coffee-farm-visit',
    albumTitle: 'Khảo sát Vùng nguyên liệu Cà phê Robusta',
    sortOrder: 26,
    isActive: true
  },
  {
    file: '5da02c215b74db2a82654.jpg',
    outName: 'coffee-farm-visit-04-early-ripening.webp',
    id: 'gallery-farm-coffee-04',
    caption: 'Đại diện FoodEra tại vườn cà phê liên kết, ghi nhận những chùm quả đầu mùa bắt đầu chuyển sắc chín',
    alt: 'Đại diện FoodEra khảo sát vườn cà phê vùng nguyên liệu',
    category: 'farm-visits',
    album: 'coffee-farm-visit',
    albumTitle: 'Khảo sát Vùng nguyên liệu Cà phê Robusta',
    sortOrder: 27,
    isActive: true
  },
  {
    file: 'b7f1e2779522157c4c335.jpg',
    outName: 'coffee-farm-visit-05-field-team.webp',
    id: 'gallery-farm-coffee-05',
    caption: 'Đội ngũ FoodEra kết nối thực địa cùng nhà nông tại vùng nguyên liệu cà phê trọng điểm Tây Nguyên',
    alt: 'Đội ngũ FoodEra khảo sát thực địa nông trường cà phê Tây Nguyên',
    category: 'farm-visits',
    album: 'coffee-farm-visit',
    albumTitle: 'Khảo sát Vùng nguyên liệu Cà phê Robusta',
    sortOrder: 28,
    isActive: true
  }
];

async function main() {
  console.log('1. Converting Durian photos to WebP...');
  for (const item of DURIAN_IMAGES) {
    const srcPath = path.join(DURIAN_DIR, item.file);
    const destPath = path.join(OUTPUT_DIR, item.outName);
    console.log(`Processing: ${item.file} -> ${item.outName}`);
    await sharp(srcPath)
      .rotate()
      .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(destPath);
    console.log(`✓ Saved: ${destPath}`);
  }

  console.log('\n2. Converting Coffee photos to WebP...');
  for (const item of COFFEE_IMAGES) {
    const srcPath = path.join(COFFEE_DIR, item.file);
    const destPath = path.join(OUTPUT_DIR, item.outName);
    console.log(`Processing: ${item.file} -> ${item.outName}`);
    await sharp(srcPath)
      .rotate()
      .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(destPath);
    console.log(`✓ Saved: ${destPath}`);
  }

  // Build new items list
  const newDurianItems = DURIAN_IMAGES.map(it => ({
    id: it.id,
    src: `/media/gallery/${it.outName}`,
    alt: it.alt,
    caption: it.caption,
    category: it.category,
    album: it.album,
    albumTitle: it.albumTitle,
    sortOrder: it.sortOrder,
    isActive: true
  }));

  const newCoffeeItems = COFFEE_IMAGES.map(it => ({
    id: it.id,
    src: `/media/gallery/${it.outName}`,
    alt: it.alt,
    caption: it.caption,
    category: it.category,
    album: it.album,
    albumTitle: it.albumTitle,
    sortOrder: it.sortOrder,
    isActive: true
  }));

  // Update data/gallery.json
  console.log('\n3. Updating data/gallery.json...');
  const currentGallery = JSON.parse(await fs.readFile(GALLERY_JSON_PATH, 'utf8'));
  
  // Tag gallery-18 with album info if not tagged
  const updatedGallery = currentGallery.map(photo => {
    if (photo.id === 'gallery-18') {
      return {
        ...photo,
        album: 'slovakia-partner-visit',
        albumTitle: 'Hợp tác Quốc tế: Đoàn Đối tác Slovakia Khảo sát Nông trại'
      };
    }
    return photo;
  });

  for (const it of [...newDurianItems, ...newCoffeeItems]) {
    const idx = updatedGallery.findIndex(p => p.id === it.id);
    if (idx !== -1) {
      updatedGallery[idx] = it;
    } else {
      updatedGallery.push(it);
    }
  }

  await fs.writeFile(GALLERY_JSON_PATH, JSON.stringify(updatedGallery, null, 2), 'utf8');
  console.log(`✓ data/gallery.json now contains ${updatedGallery.length} photos!`);

  // Update Turso Cloud Database
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    console.log('\n4. Syncing to Turso Cloud Database...');
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN
    });

    // Ensure columns exist
    try {
      await client.execute('alter table gallery_photos add column album text');
      console.log('✓ Added column "album" to gallery_photos');
    } catch (e) {
      // already exists
    }

    try {
      await client.execute('alter table gallery_photos add column album_title text');
      console.log('✓ Added column "album_title" to gallery_photos');
    } catch (e) {
      // already exists
    }

    for (const photo of updatedGallery) {
      await client.execute({
        sql: `
          insert into gallery_photos (
            id, src, alt, caption, category, album, album_title, sort_order, is_active, updated_at
          ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          on conflict(id) do update set
            src = excluded.src,
            alt = excluded.alt,
            caption = excluded.caption,
            category = excluded.category,
            album = excluded.album,
            album_title = excluded.album_title,
            sort_order = excluded.sort_order,
            is_active = excluded.is_active,
            updated_at = CURRENT_TIMESTAMP
        `,
        args: [
          photo.id,
          photo.src,
          photo.alt || '',
          photo.caption || null,
          photo.category,
          photo.album || null,
          photo.albumTitle || null,
          Number(photo.sortOrder) || 0,
          photo.isActive !== false ? 1 : 0
        ]
      });
      console.log(`✓ Synced DB: [${photo.id}] ${photo.caption}`);
    }
    console.log('✓ Turso DB updated cleanly!');
  } else {
    console.log('⚠️ TURSO_DATABASE_URL not set, skipped remote DB sync.');
  }

  console.log('\nALL STEPS COMPLETED SUCCESSFULLY!');
}

main().catch(err => {
  console.error('Execution error:', err);
  process.exit(1);
});
