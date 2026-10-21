// Tạo ảnh splash iOS (sáng + tối) cho mọi kích thước trong splash-devices.mjs.
// Chạy: npm run generate:splash   (cần devDependency `sharp`)
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEVICES, SPLASH_COLORS, splashFile } from './splash-devices.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const icon = resolve(root, 'public/icons/icon-512.png')
await mkdir(resolve(root, 'public/splash'), { recursive: true })

let count = 0
for (const [cw, ch, dpr] of DEVICES) {
  const w = cw * dpr
  const h = ch * dpr
  // Biểu tượng chiếm ~22% cạnh ngắn, đặt hơi cao hơn chính giữa cho cân với vùng an toàn phía dưới.
  const size = Math.round(Math.min(w, h) * 0.22)
  const iconBuf = await sharp(icon).resize(size, size).toBuffer()
  for (const theme of ['light', 'dark']) {
    await sharp({ create: { width: w, height: h, channels: 3, background: SPLASH_COLORS[theme] } })
      .composite([{ input: iconBuf, left: Math.round((w - size) / 2), top: Math.round((h - size) / 2 - h * 0.02) }])
      .png({ compressionLevel: 9, palette: true })
      .toFile(resolve(root, 'public', splashFile(theme, cw, ch, dpr)))
    count++
  }
}
console.log(`Đã tạo ${count} ảnh splash trong public/splash/`)
