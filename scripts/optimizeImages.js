import fs from "fs-extra";
import path from "node:path";
import sharp from "sharp";
import { globSync } from "glob";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const SOURCE_DIR = path.join(ROOT_DIR, "src/assets/Products");
const OUTPUT_DIR = path.join(ROOT_DIR, "src/assets/ProductsOptimized");
const MAX_SIZE = 900;
const WEBP_QUALITY = 82;

function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

function outputPathFor(sourceFile) {
  const relative = path.relative(SOURCE_DIR, sourceFile);
  const parsed = path.parse(relative);
  return path.join(OUTPUT_DIR, parsed.dir, `${parsed.name}.webp`);
}

async function optimizeImage(sourceFile) {
  const outputFile = outputPathFor(sourceFile);
  await fs.ensureDir(path.dirname(outputFile));

  const sourceStat = await fs.stat(sourceFile);
  const outputExists = await fs.pathExists(outputFile);
  if (outputExists) {
    const outputStat = await fs.stat(outputFile);
    if (outputStat.mtimeMs >= sourceStat.mtimeMs) {
      return { skipped: true, sourceFile, outputFile };
    }
  }

  await sharp(sourceFile)
    .rotate()
    .resize({
      width: MAX_SIZE,
      height: MAX_SIZE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY, effort: 5 })
    .toFile(outputFile);

  return { skipped: false, sourceFile, outputFile };
}

async function main() {
  const files = globSync(`${toPosixPath(SOURCE_DIR)}/**/*.png`, {
    nodir: true,
    windowsPathsNoEscape: true,
  }).map((file) => path.resolve(file));

  let optimized = 0;
  let skipped = 0;
  let originalBytes = 0;
  let optimizedBytes = 0;

  for (const file of files) {
    const result = await optimizeImage(file);
    if (result.skipped) {
      skipped += 1;
    } else {
      optimized += 1;
    }

    const sourceStat = await fs.stat(result.sourceFile);
    const outputStat = await fs.stat(result.outputFile);
    originalBytes += sourceStat.size;
    optimizedBytes += outputStat.size;
  }

  const savedBytes = Math.max(0, originalBytes - optimizedBytes);
  const savedPercent = originalBytes ? Math.round((savedBytes / originalBytes) * 100) : 0;

  console.log(
    `Optimized ${optimized} image(s), skipped ${skipped}. ` +
      `WebP total ${(optimizedBytes / 1024 / 1024).toFixed(2)} MB, ` +
      `saved ${savedPercent}%.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
