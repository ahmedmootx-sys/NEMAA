import fs from 'fs';

import sharp from 'sharp';

async function generateIcons() {
  const sourcePath = 'public/brand/logo-wordmark.png';
  if (!fs.existsSync(sourcePath)) {
    console.error('Source logo-wordmark.png not found');
    process.exit(1);
  }

  // Load source metadata
  const metadata = await sharp(sourcePath).metadata();
  console.log(`Source image dimensions: ${metadata.width}x${metadata.height}`);

  // Create a 512x512 canvas with transparent or subtle circular background
  // For PWA icons, a white or cream circular card or transparent background with padded wordmark
  // Let's create high quality 512x512 and 192x192
  
  // 1. Icon 512
  await sharp(sourcePath)
    .resize(400, 400, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: 56,
      bottom: 56,
      left: 56,
      right: 56,
      background: { r: 253, g: 251, b: 247, alpha: 1 } // App cream background
    })
    .png()
    .toFile('public/brand/icon-512.png');
  
  fs.copyFileSync('public/brand/icon-512.png', 'brand/icon-512.png');
  console.log('✅ Generated public/brand/icon-512.png');

  // 2. Icon 192
  await sharp('public/brand/icon-512.png')
    .resize(192, 192)
    .png()
    .toFile('public/brand/icon-192.png');

  fs.copyFileSync('public/brand/icon-192.png', 'brand/icon-192.png');
  console.log('✅ Generated public/brand/icon-192.png');

  // 3. Maskable Icon 512 (with 20% safe zone padding)
  await sharp(sourcePath)
    .resize(320, 320, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: 96,
      bottom: 96,
      left: 96,
      right: 96,
      background: { r: 253, g: 251, b: 247, alpha: 1 }
    })
    .png()
    .toFile('public/brand/icon-maskable-512.png');

  fs.copyFileSync('public/brand/icon-maskable-512.png', 'brand/icon-maskable-512.png');
  console.log('✅ Generated public/brand/icon-maskable-512.png');

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
