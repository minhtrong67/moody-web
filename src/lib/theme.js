// Quản lý giao diện: chế độ sáng/tối/hệ thống và cỡ chữ.
// Bảng màu nằm trong src/styles/theme.css (teal-zinc); chế độ tối bật bằng class `.dark` trên <html>.
const THEME_KEY = 'theme'
const FONT_KEY = 'fontScale'

// Màu nền dùng cho thanh trạng thái / splash của PWA. PHẢI khớp --background trong theme.css:
//   sáng  oklch(1 0 0)                    → #ffffff
//   tối   oklch(0.141 0.005 285.823)      → #09090b
// (index.html có bản sao của hai giá trị này để chạy trước khi tải JS.)
export const PWA_COLORS = { light: '#ffffff', dark: '#09090b' }
// Màu nhấn dùng cho báo cáo PDF/PNG (nền trắng): --primary của theme sáng, oklch(0.511 0.096 186.391).
export const REPORT_ACCENT = '#00786f'

const VALID_THEMES = ['light', 'dark', 'system']

function read(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
function write(key, value) {
  try {
    if (value == null || value === '') localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* localStorage bị chặn — bỏ qua */
  }
}

// Chỉ chấp nhận giá trị hợp lệ — localStorage có thể chứa giá trị lạ (app khác cùng origin ghi đè,
// dữ liệu cũ…), khi đó quay về mặc định thay vì làm vỡ giao diện.
export function getStoredTheme() {
  const v = read(THEME_KEY)
  return VALID_THEMES.includes(v) ? v : 'system'
}

export function getStoredFontScale() {
  const v = read(FONT_KEY)
  return ['0.9', '1', '1.15'].includes(v) ? v : '1'
}

export function isDarkNow() {
  return document.documentElement.classList.contains('dark')
}

// Đọc một "vai trò màu" đang áp dụng (vd 'primary', 'on-surface') thành #hex — dùng cho biểu đồ SVG.
// Màu trong theme là oklch/color-mix nên cho trình duyệt tự quy đổi qua canvas thay vì tự tính.
let probe
let ctx
export function readRole(name) {
  try {
    if (!probe) {
      probe = document.createElement('span')
      probe.style.display = 'none'
      document.body.appendChild(probe)
      ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
    }
    probe.style.color = `var(--c-${name})`
    const resolved = getComputedStyle(probe).color
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = '#000'
    ctx.fillStyle = resolved
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
    return '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')
  } catch {
    return '#000000'
  }
}

// Đồng bộ phần "vỏ" của PWA với theme đang dùng:
//  • <meta theme-color>   → thanh trạng thái / thanh tiêu đề
//  • <link rel=manifest>  → manifest sáng hoặc tối; Android lấy background_color của manifest làm màu
//    splash lúc mở app. Manifest chỉ nhận một màu nên ta đổi cả file manifest theo theme (xem public/).
export function syncPwaChrome(dark = isDarkNow()) {
  const color = dark ? PWA_COLORS.dark : PWA_COLORS.light
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.removeAttribute('media')
    meta.setAttribute('content', color)
  }
  const link = document.querySelector('link[rel="manifest"]')
  const href = dark ? '/manifest-dark.webmanifest' : '/manifest.webmanifest'
  if (link && link.getAttribute('href') !== href) link.setAttribute('href', href)
}

export function applyTheme(theme) {
  const isDark =
    theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', isDark)
  syncPwaChrome(isDark)
}

export function setTheme(theme) {
  write(THEME_KEY, theme)
  applyTheme(theme)
  window.dispatchEvent(new CustomEvent('themechange'))
}

export function applyFontScale(scale) {
  document.documentElement.style.setProperty('--font-scale', scale)
}

export function setFontScale(scale) {
  write(FONT_KEY, scale)
  applyFontScale(scale)
}

export function getReportAccent() {
  return REPORT_ACCENT
}

export function initTheme() {
  // Bản cũ cho chọn "màu chủ đề" và lưu CSS sinh ra; theme giờ cố định theo theme.css nên dọn dữ liệu cũ.
  write('themeSeed', '')
  write('themeCss', '')
  document.getElementById('md-theme-override')?.remove()

  applyTheme(getStoredTheme())
  applyFontScale(getStoredFontScale())
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener('change', () => {
    if (getStoredTheme() === 'system') {
      applyTheme('system')
      window.dispatchEvent(new CustomEvent('themechange'))
    }
  })
}
