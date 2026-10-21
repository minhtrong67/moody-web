import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  NotebookPen, CalendarDays, BarChart3, FileDown, Moon, ShieldCheck, ChevronDown, Menu, X, ArrowRight,
  Smartphone, Check, Flame
} from 'lucide-react'
import { useI18n } from '../i18n'
import { useAuth } from '../context/AuthContext'
import { ThemeToggle, LangToggle } from '../components/Toggles'
import { enterGuest, isGuest } from '../lib/session'
import { MOODS } from '../lib/moodConfig'

const FEATURES = [
  { icon: NotebookPen, key: 'f1' },
  { icon: CalendarDays, key: 'f2' },
  { icon: BarChart3, key: 'f3' },
  { icon: FileDown, key: 'f4' },
  { icon: Moon, key: 'f5' },
  { icon: ShieldCheck, key: 'f6' }
]
const STEPS = ['1', '2', '3']
const FAQ = ['1', '2', '3', '4']
const REPO_URL = 'https://github.com/minhtrong67/Moody-MoodTracker'

// Hiện dần các phần tử `.reveal` khi cuộn tới (IntersectionObserver), chỉ chạy một lần mỗi phần tử.
function useReveal(rootRef) {
  useEffect(() => {
    const els = rootRef.current?.querySelectorAll('.reveal') || []
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [rootRef])
}

const scrollToId = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

function GitHubMark({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.69 5.4-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Hình minh họa ứng dụng trong hero — dựng bằng HTML/CSS (không dùng ảnh) nên luôn nét và theo theme.
// ---------------------------------------------------------------------------
function HeroMockup() {
  const { t } = useI18n()
  const [active, setActive] = useState(1)
  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % MOODS.length), 3200)
    return () => clearInterval(id)
  }, [])
  const bars = [46, 68, 38, 82, 58, 74, 90]
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  return (
    <div className="relative mx-auto w-full max-w-[19rem] sm:max-w-[21rem]" aria-hidden="true">
      <span className="blob absolute -inset-10 rounded-full bg-primary/15 blur-3xl" />

      {/* Thẻ nổi: chuỗi ngày */}
      <div className="float absolute -left-4 sm:-left-12 -top-5 z-10 hidden sm:flex items-center gap-2 rounded-xl bg-surface border border-outline-variant shadow-elev-3 px-3 py-2" style={{ '--r': '-3deg' }}>
        <span className="w-8 h-8 rounded-full bg-[#F0A34E]/20 text-[#F0A34E] flex items-center justify-center"><Flame size={16} /></span>
        <span className="t-label-large">{t('landing.mock.streak')}</span>
      </div>

      <div className="relative rounded-[2.4rem] border border-outline-variant bg-surface shadow-elev-4 p-3">
        <div className="rounded-[1.9rem] bg-surface-container-low border border-outline-variant/70 overflow-hidden px-4 pt-5 pb-5">
          <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-outline-variant" />
          <p className="t-label-medium text-on-surface-variant">Moody</p>
          <p className="t-title-large mb-4">{t('landing.mock.title')}</p>

          <div className="flex justify-between mb-5">
            {MOODS.map((m, i) => (
              <span
                key={m.key}
                className="w-11 h-11 rounded-full flex items-center justify-center text-xl transition-all duration-500"
                style={{
                  background: m.color + (i === active ? '66' : '2e'),
                  transform: i === active ? 'translateY(-4px) scale(1.1)' : 'none',
                  boxShadow: i === active ? `0 0 0 2px ${m.color}` : 'none'
                }}
              >
                {m.emoji}
              </span>
            ))}
          </div>

          <div className="rounded-lg bg-surface border border-outline-variant p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="t-label-medium text-on-surface-variant">{t('landing.mock.week')}</p>
              <p className="t-label-small text-brand">4.1 / 5</p>
            </div>
            <div className="flex items-end justify-between gap-1.5 h-20">
              {bars.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 justify-end h-full">
                  <span className="grow-bar w-full rounded-sm bg-primary" style={{ height: `${h}%`, '--gd': `${0.3 + i * 0.08}s` }} />
                  <span className="t-label-small text-on-surface-variant leading-none">{days[i]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="chip-cycle flex items-center gap-2 rounded-lg bg-primary-container text-brand px-3 py-2">
            <Check size={16} strokeWidth={2.5} />
            <span className="t-label-medium">{t('landing.mock.saved')}</span>
          </div>
        </div>
      </div>

      {/* Emoji nổi */}
      <span className="float absolute -right-3 sm:-right-10 top-10 text-3xl" style={{ '--fd': '0.6s', '--r': '8deg' }}>😄</span>
      <span className="float absolute -right-2 sm:-right-8 bottom-24 text-2xl" style={{ '--fd': '1.4s', '--r': '-6deg' }}>🙂</span>
      <span className="float absolute -left-2 sm:-left-8 bottom-10 text-3xl" style={{ '--fd': '2.1s', '--r': '6deg' }}>😌</span>
    </div>
  )
}

function Eyebrow({ children }) {
  return <p className="reveal t-label-large text-brand mb-3 tracking-wide uppercase">{children}</p>
}

function ThemedImage({ name, alt, width, height, className = '' }) {
  return (
    <>
      <img src={`/landing/${name}-light.webp`} alt={alt} width={width} height={height} loading="lazy" decoding="async" className={`dark:hidden ${className}`} />
      <img src={`/landing/${name}-dark.webp`} alt="" aria-hidden="true" width={width} height={height} loading="lazy" decoding="async" className={`hidden dark:block ${className}`} />
    </>
  )
}

export default function Landing() {
  const { t } = useI18n()
  const { user } = useAuth()
  const navigate = useNavigate()
  const rootRef = useRef(null)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const authed = !!user || isGuest()
  useReveal(rootRef)

  useEffect(() => {
    window.scrollTo(0, 0)
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function start() {
    if (!authed) enterGuest()
    navigate('/')
  }
  const goLogin = () => navigate('/login')
  function jump(id) {
    setMenuOpen(false)
    setTimeout(() => scrollToId(id), 0)
  }

  const navLinks = [
    { id: 'features', label: t('landing.nav.features') },
    { id: 'how', label: t('landing.nav.how') },
    { id: 'faq', label: t('landing.nav.faq') }
  ]

  return (
    <div ref={rootRef} className="min-h-[100dvh] bg-surface text-on-surface overflow-x-clip" style={{ paddingBottom: 'var(--safe-bottom)' }}>
      {/* ===== Thanh điều hướng ===== */}
      <header
        className={`fixed top-0 inset-x-0 z-40 backdrop-blur-md border-b transition-colors duration-300 ${
          scrolled || menuOpen ? 'bg-surface/85 border-outline-variant' : 'bg-transparent border-transparent'
        }`}
        style={{ paddingTop: 'var(--safe-top)' }}
      >
        <div className="mx-auto max-w-6xl h-16 px-4 sm:px-6 flex items-center gap-2">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2.5 mr-2" aria-label="Moody">
            <img src="/icons/icon-192.png" alt="" width="32" height="32" className="w-8 h-8 rounded-md" />
            <span className="t-title-large">Moody</span>
          </button>
          <nav className="hidden md:flex items-center gap-1 ml-4" aria-label="Sections">
            {navLinks.map((l) => (
              <button key={l.id} onClick={() => jump(l.id)} className="state h-9 px-3 rounded-md t-label-large text-on-surface-variant hover:text-on-surface">
                {l.label}
              </button>
            ))}
          </nav>
          <span className="flex-1" />
          <LangToggle />
          <ThemeToggle />
          {!authed && (
            <button onClick={goLogin} className="btn btn-text state hidden sm:inline-flex">{t('landing.nav.login')}</button>
          )}
          <button onClick={start} className="btn btn-filled state hidden sm:inline-flex">
            {authed ? t('landing.nav.open') : t('landing.nav.start')}
          </button>
          <button onClick={() => setMenuOpen((v) => !v)} aria-label={t('landing.nav.menu')} aria-expanded={menuOpen} className="icon-btn state text-on-surface md:hidden">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-outline-variant px-4 pb-4 pt-2 pop-in">
            {navLinks.map((l) => (
              <button key={l.id} onClick={() => jump(l.id)} className="state w-full h-11 px-3 rounded-md text-left t-label-large text-on-surface-variant">{l.label}</button>
            ))}
            <div className="flex gap-2 mt-3">
              {!authed && <button onClick={goLogin} className="btn btn-outlined state flex-1">{t('landing.nav.login')}</button>}
              <button onClick={start} className="btn btn-filled state flex-1">{authed ? t('landing.nav.open') : t('landing.nav.start')}</button>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* ===== Hero ===== */}
        <section className="relative pt-28 sm:pt-32 lg:pt-36 pb-16 sm:pb-24 overflow-hidden">
          <span aria-hidden="true" className="absolute inset-0 dot-grid opacity-70 [mask-image:radial-gradient(ellipse_at_top,black_25%,transparent_70%)]" />
          <span aria-hidden="true" className="blob absolute -top-40 left-1/2 -translate-x-1/2 w-[46rem] h-[30rem] rounded-full bg-primary/10 blur-3xl" />
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-14 lg:gap-8 items-center">
            <div className="text-center lg:text-left">
              <p className="reveal inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-low px-3.5 py-1.5 t-label-medium text-on-surface-variant mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" /> {t('landing.badge')}
              </p>
              <h1 className="reveal text-[2.25rem] sm:text-5xl lg:text-[3.4rem] xl:text-[3.75rem] leading-[1.08] font-semibold tracking-[-0.035em] text-balance" style={{ '--d': '0.08s' }}>
                {t('landing.hero.title1')}
                <br />
                <span className="text-gradient">{t('landing.hero.title2')}</span>
              </h1>
              <p className="reveal t-body-large sm:text-lg text-on-surface-variant mt-6 max-w-xl mx-auto lg:mx-0" style={{ '--d': '0.16s' }}>
                {t('landing.hero.text')}
              </p>
              <div className="reveal mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start" style={{ '--d': '0.24s' }}>
                <button onClick={start} className="btn btn-filled btn-lg state group">
                  {authed ? t('landing.cta.open') : t('landing.cta.start')}
                  <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>
                {!authed && <button onClick={goLogin} className="btn btn-outlined btn-lg state">{t('landing.cta.login')}</button>}
              </div>
              <p className="reveal mt-5 t-body-small text-on-surface-variant flex items-center gap-1.5 justify-center lg:justify-start" style={{ '--d': '0.32s' }}>
                <Check size={14} className="text-brand" /> {t('landing.hero.note')}
              </p>
            </div>
            <div className="reveal reveal-scale" style={{ '--d': '0.2s' }}>
              <HeroMockup />
            </div>
          </div>
        </section>

        {/* ===== Con số nổi bật ===== */}
        <section className="border-y border-outline-variant bg-surface-container-low">
          <dl className="mx-auto max-w-6xl px-4 sm:px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
            {['1', '2', '3', '4'].map((n, i) => (
              <div key={n} className="reveal text-center" style={{ '--d': `${i * 0.07}s` }}>
                <dt className="text-3xl sm:text-4xl font-semibold tracking-tight text-balance">{t(`landing.stats.${n}.value`)}</dt>
                <dd className="t-body-small sm:t-body-medium text-on-surface-variant mt-1">{t(`landing.stats.${n}.label`)}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ===== Tính năng ===== */}
        <section id="features" className="scroll-mt-20 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl mx-auto text-center mb-12 sm:mb-16">
              <Eyebrow>{t('landing.features.eyebrow')}</Eyebrow>
              <h2 className="reveal text-3xl sm:text-4xl font-semibold tracking-tight text-balance" style={{ '--d': '0.06s' }}>{t('landing.features.title')}</h2>
              <p className="reveal t-body-large text-on-surface-variant mt-4" style={{ '--d': '0.12s' }}>{t('landing.features.text')}</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {FEATURES.map(({ icon: Icon, key }, i) => (
                <article
                  key={key}
                  className="reveal group rounded-xl border border-outline-variant bg-surface p-6 transition-[border-color,box-shadow,transform] duration-300 hover:border-brand/40 hover:shadow-elev-3 hover:-translate-y-0.5"
                  style={{ '--d': `${(i % 3) * 0.08}s` }}
                >
                  <span className="w-11 h-11 rounded-lg bg-primary-container text-brand flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
                    <Icon size={22} />
                  </span>
                  <h3 className="t-title-medium mb-2">{t(`landing.${key}.title`)}</h3>
                  <p className="t-body-medium text-on-surface-variant">{t(`landing.${key}.text`)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Cách dùng ===== */}
        <section id="how" className="scroll-mt-20 py-20 sm:py-28 bg-surface-container-low border-y border-outline-variant">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl mx-auto text-center mb-14">
              <Eyebrow>{t('landing.how.eyebrow')}</Eyebrow>
              <h2 className="reveal text-3xl sm:text-4xl font-semibold tracking-tight text-balance" style={{ '--d': '0.06s' }}>{t('landing.how.title')}</h2>
            </div>
            <ol className="relative grid md:grid-cols-3 gap-10 md:gap-8">
              <span aria-hidden="true" className="hidden md:block absolute top-6 left-[16.6%] right-[16.6%] h-px bg-gradient-to-r from-transparent via-outline-variant to-transparent" />
              {STEPS.map((n, i) => (
                <li key={n} className="reveal relative text-center" style={{ '--d': `${i * 0.12}s` }}>
                  <span className="relative mx-auto mb-5 w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center t-title-medium shadow-elev-2 ring-8 ring-surface-container-low">{n}</span>
                  <h3 className="t-title-medium mb-2">{t(`landing.how.${n}.title`)}</h3>
                  <p className="t-body-medium text-on-surface-variant max-w-xs mx-auto">{t(`landing.how.${n}.text`)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ===== Giao diện (ảnh thật, tự đổi theo theme) ===== */}
        <section className="py-20 sm:py-28 overflow-hidden">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl mx-auto text-center mb-12 sm:mb-16">
              <Eyebrow>{t('landing.show.eyebrow')}</Eyebrow>
              <h2 className="reveal text-3xl sm:text-4xl font-semibold tracking-tight text-balance" style={{ '--d': '0.06s' }}>{t('landing.show.title')}</h2>
              <p className="reveal t-body-large text-on-surface-variant mt-4" style={{ '--d': '0.12s' }}>{t('landing.show.text')}</p>
            </div>

            <div className="relative">
              <span aria-hidden="true" className="blob absolute inset-x-10 top-10 bottom-0 rounded-full bg-primary/10 blur-3xl" />
              <div className="reveal reveal-scale relative rounded-xl border border-outline-variant bg-surface shadow-elev-4 overflow-hidden">
                <div className="flex items-center gap-1.5 h-9 px-4 border-b border-outline-variant bg-surface-container-low" aria-hidden="true">
                  <span className="w-2.5 h-2.5 rounded-full bg-outline-variant" /><span className="w-2.5 h-2.5 rounded-full bg-outline-variant" /><span className="w-2.5 h-2.5 rounded-full bg-outline-variant" />
                </div>
                <ThemedImage name="desktop-stats" alt={t('landing.show.alt.desktop')} width="1440" height="900" className="w-full h-auto" />
              </div>

              <div className="reveal reveal-scale float absolute -bottom-10 -right-1 sm:right-6 w-[34%] max-w-[13rem] rounded-[1.4rem] border border-outline-variant bg-surface shadow-elev-4 p-1.5" style={{ '--d': '0.2s', '--r': '2deg' }}>
                <ThemedImage name="mobile-dashboard" alt={t('landing.show.alt.mobile')} width="390" height="844" className="w-full h-auto rounded-[1.1rem]" />
              </div>
              <div className="reveal reveal-scale float hidden sm:block absolute -bottom-6 left-4 w-[22%] max-w-[10rem] rounded-[1.2rem] border border-outline-variant bg-surface shadow-elev-4 p-1.5" style={{ '--d': '0.3s', '--fd': '1.2s', '--r': '-2deg' }}>
                <ThemedImage name="mobile-history" alt="" width="390" height="844" className="w-full h-auto rounded-[0.95rem]" />
              </div>
            </div>
          </div>
        </section>

        {/* ===== PWA ===== */}
        <section className="pb-20 sm:pb-28">
          <div className="reveal mx-auto max-w-5xl px-4 sm:px-6">
            <div className="rounded-xl border border-outline-variant bg-surface-container-low p-6 sm:p-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
              <span className="w-16 h-16 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-elev-2"><Smartphone size={30} /></span>
              <div className="text-center sm:text-left">
                <h3 className="t-headline-small mb-2">{t('landing.pwa.title')}</h3>
                <p className="t-body-large text-on-surface-variant">{t('landing.pwa.text')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Hỏi đáp ===== */}
        <section id="faq" className="scroll-mt-20 pb-20 sm:pb-28">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="text-center mb-10">
              <Eyebrow>{t('landing.faq.eyebrow')}</Eyebrow>
              <h2 className="reveal text-3xl sm:text-4xl font-semibold tracking-tight text-balance" style={{ '--d': '0.06s' }}>{t('landing.faq.title')}</h2>
            </div>
            <div className="space-y-3">
              {FAQ.map((n, i) => (
                <details key={n} className="reveal faq group rounded-lg border border-outline-variant bg-surface open:bg-surface-container-low transition-colors" style={{ '--d': `${i * 0.05}s` }}>
                  <summary className="flex items-center gap-4 px-5 h-14 t-title-small">
                    <span className="flex-1">{t(`landing.faq.${n}.q`)}</span>
                    <ChevronDown size={18} className="faq-chevron text-on-surface-variant transition-transform duration-300" />
                  </summary>
                  <p className="faq-body px-5 pb-5 t-body-medium text-on-surface-variant">{t(`landing.faq.${n}.a`)}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ===== CTA cuối ===== */}
        <section className="pb-20 sm:pb-28">
          <div className="reveal reveal-scale mx-auto max-w-5xl px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-2xl bg-primary text-on-primary px-6 py-14 sm:py-20 text-center">
              <span aria-hidden="true" className="absolute inset-0 opacity-25 [background-image:radial-gradient(oklch(1_0_0/0.5)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]" />
              <span aria-hidden="true" className="blob absolute -top-24 -right-16 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
              <div className="relative">
                <div className="flex justify-center gap-2 mb-6" aria-hidden="true">
                  {MOODS.map((m, i) => (
                    <span key={m.key} className="float w-11 h-11 rounded-full bg-white/90 flex items-center justify-center text-xl" style={{ '--fd': `${i * 0.35}s` }}>{m.emoji}</span>
                  ))}
                </div>
                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight max-w-xl mx-auto">{t('landing.final.title')}</h2>
                <p className="mt-3 opacity-85 t-body-large">{t('landing.final.text')}</p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                  <button onClick={start} className="btn btn-lg state bg-white text-[oklch(0.35_0.07_188)] hover:shadow-elev-3">
                    {authed ? t('landing.cta.open') : t('landing.cta.start')} <ArrowRight size={18} />
                  </button>
                  {!authed && (
                    <button onClick={goLogin} className="btn btn-lg state text-on-primary shadow-[inset_0_0_0_1px_oklch(1_0_0/0.45)]">{t('landing.cta.login')}</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ===== Chân trang ===== */}
      <footer className="border-t border-outline-variant">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center gap-5 sm:gap-8 text-center sm:text-left">
          <div className="flex items-center gap-2.5">
            <img src="/icons/icon-192.png" alt="" width="28" height="28" className="w-7 h-7 rounded-md" />
            <div>
              <p className="t-title-small">Moody</p>
              <p className="t-body-small text-on-surface-variant">{t('landing.footer.tagline')}</p>
            </div>
          </div>
          <span className="flex-1" />
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="btn btn-text state gap-2">
            <GitHubMark /> {t('landing.footer.source')}
          </a>
          <p className="t-body-small text-on-surface-variant">{t('landing.footer.rights')}</p>
        </div>
      </footer>
    </div>
  )
}
