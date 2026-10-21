// Danh sách kích thước màn hình iOS dùng cho ảnh splash (apple-touch-startup-image).
// [chiều rộng CSS, chiều cao CSS, device-pixel-ratio] — chiều dọc (portrait).
// Dùng chung cho scripts/generate-splash.mjs (tạo ảnh) và vite.config.js (chèn thẻ <link> vào index.html).
export const DEVICES = [
  // iPhone
  [440, 956, 3], // 16 Pro Max
  [402, 874, 3], // 16 Pro
  [430, 932, 3], // 16 Plus · 15 Plus / Pro Max · 14 Pro Max
  [393, 852, 3], // 16 · 15 · 15 Pro · 14 Pro
  [428, 926, 3], // 14 Plus · 13 Pro Max · 12 Pro Max
  [390, 844, 3], // 14 · 13 · 13 Pro · 12 · 12 Pro
  [375, 812, 3], // 13 mini · 12 mini · 11 Pro · XS · X
  [414, 896, 3], // 11 Pro Max · XS Max
  [414, 896, 2], // 11 · XR
  [414, 736, 3], // 8 Plus · 7 Plus · 6s Plus
  [375, 667, 2], // 8 · 7 · SE (2nd/3rd gen)
  [320, 568, 2], // SE (1st gen)
  // iPad
  [1024, 1366, 2], // 12.9"
  [834, 1194, 2], // 11" · Air 11"
  [834, 1112, 2], // 10.5"
  [820, 1180, 2], // 10.9" · Air
  [810, 1080, 2], // 10.2"
  [768, 1024, 2], // 9.7" · mini 5
  [744, 1133, 2] // mini 6
]

export const SPLASH_COLORS = {
  light: '#ffffff', // = --background (theme sáng) oklch(1 0 0)
  dark: '#09090b' //   = --background (theme tối)  oklch(0.141 0.005 285.823)
}

export const splashFile = (theme, w, h, dpr) => `splash/${theme}-${w * dpr}x${h * dpr}.png`
