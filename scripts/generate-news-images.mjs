/**
 * Generate self-hosted WebP news card images from local JPEGs.
 *
 * The /home dashboard's Latest News carousel hotlinks picsum.photos, which is
 * the remaining LCP bottleneck now that everything else is same-origin. This
 * script replaces those with optimized local WebP at two DPRs:
 *   - news-{1..4}.webp      (600×360, 1x, fit cover)
 *   - news-{1..4}@2x.webp   (1200×720, 2x, fit cover)
 *
 * Sources default to /tmp/news-src/news-{1..4}.jpg; override with the
 * NEWS_SRC_DIR env var. Output lands in public/news/. Re-run after swapping
 * source JPEGs.
 *
 * Run via `npm run generate-news-images`.
 */
import sharp from 'sharp'
import { mkdir, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const SRC_DIR = process.env.NEWS_SRC_DIR ?? '/tmp/news-src'
const OUT_DIR = path.join(root, 'public', 'news')

const IMAGES = [1, 2, 3, 4]

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes}B`
  return `${(bytes / 1024).toFixed(1)}KB`
}

async function generateVariant({ srcPath, outName, width, height, quality }) {
  const outPath = path.join(OUT_DIR, outName)
  const info = await sharp(srcPath)
    .resize({ width, height, fit: 'cover' })
    .webp({ quality })
    .toFile(outPath)
  console.log(
    `  ✓ public/news/${outName}  (${info.width}×${info.height}, ${formatBytes(info.size)})`,
  )
}

await mkdir(OUT_DIR, { recursive: true })

console.log(`Generating news images from ${SRC_DIR}:`)
for (const id of IMAGES) {
  const srcPath = path.join(SRC_DIR, `news-${id}.jpg`)
  await stat(srcPath) // throws clearly if a source JPEG is missing
  await generateVariant({ srcPath, outName: `news-${id}.webp`, width: 600, height: 360, quality: 78 })
  await generateVariant({
    srcPath,
    outName: `news-${id}@2x.webp`,
    width: 1200,
    height: 720,
    quality: 72,
  })
}
console.log('Done.')
