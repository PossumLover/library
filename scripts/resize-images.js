// Resize all downloaded article images to max 1200px wide.
// Keeps aspect ratio, overwrites in place. Run once.

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '..', 'content', 'sam-kriss', 'images');
const MAX_WIDTH = 1200;

async function resizeAll() {
  const slugDirs = fs.readdirSync(IMAGES_DIR);
  let total = 0, skipped = 0, failed = 0;

  for (const slug of slugDirs) {
    const slugPath = path.join(IMAGES_DIR, slug);
    if (!fs.statSync(slugPath).isDirectory()) continue;

    const files = fs.readdirSync(slugPath).filter(f =>
      /\.(jpe?g|png|webp|gif)$/i.test(f)
    );

    for (const file of files) {
      const filePath = path.join(slugPath, file);
      try {
        const img = sharp(filePath);
        const meta = await img.metadata();

        if (meta.width <= MAX_WIDTH) {
          skipped++;
          continue;
        }

        const tmpPath = filePath + '.tmp';
        await img
          .resize({ width: MAX_WIDTH, withoutEnlargement: true })
          .jpeg({ quality: 82, progressive: true })
          .toFile(tmpPath);

        fs.renameSync(tmpPath, filePath);
        total++;
        process.stdout.write(`\r  Resized ${total} files...`);
      } catch (e) {
        failed++;
        console.error(`\n  ✗ ${file}: ${e.message}`);
      }
    }
  }

  console.log(`\n\nDone: ${total} resized, ${skipped} already small, ${failed} failed.`);
}

resizeAll();
