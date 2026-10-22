// Quản lý giao diện: chế độ sáng/tối/hệ thống và cỡ chữ.
// Bảng màu nằm trong src/styles/theme.css (teal-500 + nền stone); chế độ tối bật bằng class `.dark` trên <html>.
const THEME_KEY = 'theme'
const FONT_KEY = 'fontScale'

// Màu nhấn dùng cho báo cáo PDF/PNG (nền trắng): teal-600 — đậm hơn --primary (teal-500) một bậc
// để tiêu đề/chữ nhỏ trên nền trắng vẫn đủ tương phản.
export const REPORT_ACCENT = '#009689'

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

export function applyTheme(theme) {
  const isDark =
    theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', isDark)
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
