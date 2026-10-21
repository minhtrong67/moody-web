/** @type {import('tailwindcss').Config} */
// Màu của app đến từ src/styles/theme.css (teal-zinc, oklch). Các "vai trò" --c-* trong src/index.css
// được suy ra từ token đó; ở đây chỉ ánh xạ chúng thành class Tailwind (bg-surface, text-on-surface, bg-primary/10…).
// `color-mix` cho phép dùng được cả modifier độ trong suốt của Tailwind với màu oklch.
const role = (name) => `color-mix(in oklab, var(--c-${name}) calc(<alpha-value> * 100%), transparent)`

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"Inter Variable"', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif']
      },
      colors: {
        primary: role('primary'),
        'on-primary': role('on-primary'),
        brand: role('brand'),
        popover: role('popover'),
        'popover-foreground': role('popover-foreground'),
        'primary-container': role('primary-container'),
        'on-primary-container': role('on-primary-container'),
        secondary: role('secondary'),
        'on-secondary': role('on-secondary'),
        tertiary: role('tertiary'),
        'on-tertiary': role('on-tertiary'),
        'secondary-container': role('secondary-container'),
        'on-secondary-container': role('on-secondary-container'),
        'tertiary-container': role('tertiary-container'),
        'on-tertiary-container': role('on-tertiary-container'),
        error: role('error'),
        'on-error': role('on-error'),
        'error-container': role('error-container'),
        'on-error-container': role('on-error-container'),
        background: role('surface'),
        surface: role('surface'),
        'surface-dim': role('surface-dim'),
        'surface-container-lowest': role('surface-container-lowest'),
        'surface-container-low': role('surface-container-low'),
        'surface-container': role('surface-container'),
        'surface-container-high': role('surface-container-high'),
        'surface-container-highest': role('surface-container-highest'),
        'on-surface': role('on-surface'),
        'on-surface-variant': role('on-surface-variant'),
        outline: role('outline'),
        'outline-variant': role('outline-variant'),
        'inverse-surface': role('inverse-surface'),
        'inverse-on-surface': role('inverse-on-surface'),
        'inverse-primary': role('inverse-primary'),
        mood: {
          great: '#F0A34E',
          good: '#8FBF7F',
          okay: '#9FB8C8',
          sad: '#7D8CB0',
          angry: '#C4676B'
        }
      },
      // Bo góc suy ra từ --radius của theme.css (0.625rem): xs 4 · sm 6 · md 8 · lg 10 · xl 14
      borderRadius: {
        xs: 'calc(var(--radius) - 6px)',
        sm: 'calc(var(--radius) - 4px)',
        md: 'calc(var(--radius) - 2px)',
        lg: 'var(--radius)',
        xl: 'calc(var(--radius) + 4px)'
      },
      // Đổ bóng rất nhẹ — phân tầng chủ yếu bằng viền
      boxShadow: {
        'elev-1': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'elev-2': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'elev-3': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'elev-4': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
      },
      transitionTimingFunction: {
        emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
        'emphasized-decel': 'cubic-bezier(0.05, 0.7, 0.1, 1)',
        'emphasized-accel': 'cubic-bezier(0.3, 0, 0.8, 0.15)'
      }
    }
  },
  plugins: []
}
