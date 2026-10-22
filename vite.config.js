import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

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
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'icons/*.png'],
      // Manifest do plugin sinh ra và tự chèn <link rel="manifest">. Đây là nơi DUY NHẤT đặt màu mặc định cho PWA:
      // khi mở app từ màn hình chính, hệ điều hành chỉ hiện logo (icon manifest) trên background_color —
      // không có ảnh splash riêng và không kiểm tra giao diện sáng/tối.
      manifest: {
        id: '/',
        name: 'Moody — Nhật ký tâm trạng',
        short_name: 'Moody',
        description: 'Theo dõi tâm trạng mỗi ngày, xem xu hướng và xuất báo cáo',
        lang: 'vi',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#00bba7', // Tailwind teal-500 (thanh trạng thái / thanh tiêu đề)
        background_color: '#00bba7',
        categories: ['health', 'lifestyle', 'productivity'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ]
})
