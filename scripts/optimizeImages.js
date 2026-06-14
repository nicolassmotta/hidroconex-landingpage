/**
 * Image optimizer for the Hidroconex landing page.
 *
 * Why: product photos ship as ~2000px RGBA PNGs (1–4.5 MB each) but are never
 * displayed larger than ~256px. This converts them to right-sized WebP, which
 * cuts each file by ~95% and dramatically improves mobile load time.
 *
 * What it does:
 *   1. Product PNGs  ->  sibling .webp (resized, compressed); original PNG removed
 *   2. AI/hero-industrial.jpg -> recompressed in place (kept as JPG)
 *
 * Re-runnable: if there are no PNGs left it simply reports nothing to do.
 * After running, regenerate the catalog:  node scripts/generateCatalog.js
 *
 * Usage:
 *   node scripts/optimizeImages.js            # convert + replace
 *   node scripts/optimizeImages.js --keep     # keep the original PNGs
 */
import fs from 'fs-extra';
import path from 'path';
import { globSync } from 'glob';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const KEEP_ORIGINALS = process.argv.includes('--keep');

// Product images are displayed at most ~256px; cap at 1000px so 2x/retina
// screens stay crisp while files stay tiny.
const PRODUCT_MAX = 1000;
const PRODUCT_QUALITY = 80;

// Hero is a full-bleed background; 1920 wide is plenty for desktop.
const HERO_MAX_WIDTH = 1920;
const HERO_QUALITY = 78;

const fmtKB = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;

async function optimizeProducts() {
  const pngs = globSync(`${ROOT}/src/assets/Products/**/*.png`);

  if (pngs.length === 0) {
    console.log('No product PNGs found — nothing to convert.');
    return { count: 0, before: 0, after: 0 };
  }

  let before = 0;
  let after = 0;

  console.log(`Converting ${pngs.length} product image(s) to WebP...\n`);

  for (const png of pngs) {
    const webp = png.replace(/\.png$/i, '.webp');
    const originalSize = fs.statSync(png).size;
    before += originalSize;

    await sharp(png)
      .resize({
        width: PRODUCT_MAX,
        height: PRODUCT_MAX,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: PRODUCT_QUALITY, effort: 6 })
      .toFile(webp);

    const newSize = fs.statSync(webp).size;
    after += newSize;

    if (!KEEP_ORIGINALS) fs.removeSync(png);

    const saved = (100 * (1 - newSize / originalSize)).toFixed(0);
    console.log(
      `  ${path.basename(png)}  ${fmtKB(originalSize)} -> ${fmtKB(newSize)}  (-${saved}%)`
    );
  }

  return { count: pngs.length, before, after };
}

async function optimizeHero() {
  const hero = path.join(ROOT, 'src/assets/AI/hero-industrial.jpg');
  if (!fs.existsSync(hero)) return;

  const before = fs.statSync(hero).size;
  const tmp = hero + '.tmp';

  await sharp(hero)
    .resize({ width: HERO_MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: HERO_QUALITY, mozjpeg: true })
    .toFile(tmp);

  // Only replace if we actually made it smaller.
  if (fs.statSync(tmp).size < before) {
    fs.moveSync(tmp, hero, { overwrite: true });
    const after = fs.statSync(hero).size;
    console.log(`\nHero image: ${fmtKB(before)} -> ${fmtKB(after)}`);
  } else {
    fs.removeSync(tmp);
    console.log('\nHero image already optimal — left untouched.');
  }
}

async function main() {
  const products = await optimizeProducts();
  await optimizeHero();

  if (products.count > 0) {
    const savedMB = ((products.before - products.after) / 1024 / 1024).toFixed(1);
    console.log(
      `\n✓ Optimized ${products.count} product images: ` +
        `${(products.before / 1024 / 1024).toFixed(1)} MB -> ${(products.after / 1024 / 1024).toFixed(1)} MB ` +
        `(saved ${savedMB} MB)`
    );
    if (!KEEP_ORIGINALS) {
      console.log('Next step: run  node scripts/generateCatalog.js  to refresh image paths.');
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
