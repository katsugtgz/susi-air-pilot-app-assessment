/**
 * Generate PWA icons from public/susi-air-logo.png.
 *
 * The source logo is 240×60 (4:1 wordmark, not square). This script composites
 * it onto white square canvases for the three sizes Lighthouse needs:
 *   - pwa-192.png          (192×192, "any" purpose)
 *   - pwa-512.png          (512×512, "any" purpose)
 *   - pwa-maskable-512.png (512×512, "maskable" purpose — logo at 60% to
 *                            survive OS-icon cropping on Android)
 *
 * Run once via `npm run generate-pwa-icons`. Re-run if the source logo changes.
 */
import sharp from 'sharp'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const sourcePath = path.join(root, 'public', 'susi-air-logo.png')

const WHITE_BG = { r: 255, g: 255, b: 255, alpha: 1 }

async function generateIcon({ size, logoWidthRatio, outName }) {
  const logoBuffer = await readFile(sourcePath)
  const logoWidth = Math.round(size * logoWidthRatio)
  const logo = await sharp(logoBuffer).resize({ width: logoWidth, fit: 'inside' }).toBuffer()
  const metadata = await sharp(logo).metadata()
  const logoHeight = metadata.height ?? Math.round(logoWidth / 4)

  // Center the logo vertically + horizontally on a white canvas.
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: WHITE_BG,
    },
  })
    .composite([
      {
        input: logo,
        top: Math.round((size - logoHeight) / 2),
        left: Math.round((size - logoWidth) / 2),
      },
    ])
    .png()
    .toFile(path.join(root, 'public', outName))

  console.log(`  ✓ public/${outName}  (${size}×${size}, logo width ${logoWidth}px)`)
}

console.log(`Generating PWA icons from ${path.relative(root, sourcePath)}:`)
await generateIcon({ size: 192, logoWidthRatio: 0.7, outName: 'pwa-192.png' })
await generateIcon({ size: 512, logoWidthRatio: 0.7, outName: 'pwa-512.png' })
// Maskable: scale logo down further so OS cropping leaves a safe zone around it.
await generateIcon({ size: 512, logoWidthRatio: 0.5, outName: 'pwa-maskable-512.png' })
console.log('Done.')
