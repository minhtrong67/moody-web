import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from './icons'
import { getStoredTheme, setTheme } from '../lib/theme'
import { useI18n } from '../i18n'

const THEME_CYCLE = ['light', 'dark', 'system']
const THEME_META = {
  light: { icon: Sun, key: 'theme.light' },
  dark: { icon: Moon, key: 'theme.dark' },
  system: { icon: Monitor, key: 'theme.system' }
}

// Nút đổi giao diện: sáng → tối → theo hệ thống.
export function ThemeToggle() {
  const { t } = useI18n()
  const [theme, setThemeState] = useState(getStoredTheme())

  useEffect(() => {
    const sync = () => setThemeState(getStoredTheme())
    window.addEventListener('themechange', sync)
    return () => window.removeEventListener('themechange', sync)
  }, [])

  function cycle() {
    const next = THEME_CYCLE[(THEME_CYCLE.indexOf(theme) + 1) % THEME_CYCLE.length]
    setThemeState(next)
    setTheme(next)
  }

  const { icon: Icon, key } = THEME_META[theme]
  return (
    <button onClick={cycle} aria-label={t(key)} title={t(key)} className="icon-btn state text-on-surface-variant">
      <Icon key={theme} size={20} className="pop-in" />
    </button>
  )
}

// Nút đổi ngôn ngữ Việt ⇄ Anh.
export function LangToggle() {
  const { lang, setLang, t } = useI18n()
  const next = lang === 'vi' ? 'en' : 'vi'
  return (
    <button
      onClick={() => setLang(next)}
      aria-label={t('settings.language')}
      title={t('settings.language')}
      className="state h-10 min-w-10 px-2.5 rounded-md t-label-large text-on-surface-variant"
    >
      {lang.toUpperCase()}
    </button>
  )
}
