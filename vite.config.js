import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { DEVICES, splashFile } from './scripts/splash-devices.mjs'

// Chèn <link rel="apple-touch-startup-image"> (sáng + tối) cho từng kích thước iPhone/iPad.
// iOS tự chọn ảnh theo kích thước màn hình và prefers-color-scheme → splash khớp theme của máy.
function iosSplashLinks() {
  const tags = DEVICES.flatMap(([w, h, dpr]) =>
    ['light', 'dark'].map((theme) => ({
      tag: 'link',
      injectTo: 'head',
      attrs: {
        rel: 'apple-touch-startup-image',
        href: `/${splashFile(theme, w, h, dpr)}`,
        media:
          `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${dpr})` +
          ` and (orientation: portrait) and (prefers-color-scheme: ${theme})`
      }
    }))
  )
  return { name: 'moody-ios-splash-links', transformIndexHtml: () => tags }
}

export default defineConfig({
  build: {
    // Tách thư viện lớn thành chunk riêng để cache lâu dài và tải song song.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return 'react'
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) return 'firebase'
          if (/node_modules\/(recharts|d3-|victory-vendor|recharts-scale)/.test(id)) return 'charts'
        }
      }
    },
    chunkSizeWarningLimit: 600
  },
  plugins: [
    react(),
    iosSplashLinks(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'icons/*.png'],
      // Manifest tự viết, có HAI bản (public/manifest.webmanifest + manifest-dark.webmanifest).
      // Splash của Android do hệ điều hành vẽ từ background_color của manifest và chỉ nhận MỘT màu,
      // nên app đổi <link rel="manifest"> theo theme đang dùng (xem syncPwaChrome trong src/lib/theme.js).
      manifest: false
    })
  ]
})
