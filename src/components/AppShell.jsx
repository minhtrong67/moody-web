import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Home, HomeFilled, HistoryIcon, HistoryFilled, BarChart3, BarChartFilled, Settings, SettingsFilled, Plus, ArrowUp,
  Menu
} from './icons'
import { ModalDrawer, PermanentDrawer, NavRail } from './Sidebar'
import { ThemeToggle, LangToggle } from './Toggles'
import { useI18n } from '../i18n'
import { useCheckIn } from '../context/CheckInContext'

// Navigation bar (điện thoại): tối đa 5 đích đến; icon đặc khi đang chọn.
const TABS = [
  { to: '/', key: 'nav.today', icon: Home, activeIcon: HomeFilled, end: true },
  { to: '/history', key: 'nav.history', icon: HistoryIcon, activeIcon: HistoryFilled },
  { to: '/stats', key: 'nav.stats', icon: BarChart3, activeIcon: BarChartFilled },
  { to: '/settings', key: 'nav.settings', icon: Settings, activeIcon: SettingsFilled }
]

export default function AppShell() {
  const { openCheckIn } = useCheckIn()
  const { pathname } = useLocation()
  const { t } = useI18n()
  // FAB "check-in mới" chỉ hiện ở các trang cần thêm nhanh (Hôm nay, Lịch sử);
  // các trang còn lại (Thống kê, Cài đặt, Quản lý…) không có hành động chính nên không hiện FAB.
  const showAddFab = pathname === '/' || pathname === '/history'
  const [scrolled, setScrolled] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Trang cuộn theo window (mượt hơn trên mobile — thanh địa chỉ tự thu gọn). Chỉ setState khi
  // trạng thái thật sự đổi để tránh render lại mỗi khung hình cuộn.
  useEffect(() => {
    let ticking = false
    const update = () => {
      ticking = false
      const y = window.scrollY
      setScrolled((v) => (v === y > 2 ? v : y > 2))
      setShowScrollTop((v) => (v === y > 400 ? v : y > 400))
    }
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-[100dvh] bg-surface text-on-surface md:flex">
      <ModalDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <NavRail />
      <PermanentDrawer />

      <div className="flex-1 min-w-0 flex flex-col min-h-[100dvh]">
        {/* Top bar — nền mờ, hiện viền mảnh phía dưới khi nội dung cuộn dưới nó */}
        <header
          className={`sticky top-0 z-10 flex items-center h-14 gap-1 px-1 md:px-4 border-b transition-[border-color] duration-200 ${scrolled ? 'card-filled border-outline-variant' : 'card-filled border-transparent'
            }`}
          style={{ top: 'var(--safe-top)' }}
        >
          <button onClick={() => setDrawerOpen(true)} aria-label={t('nav.openMenu')} className="icon-btn state text-on-surface md:hidden">
            <Menu size={24} />
          </button>
          <span className="t-title-large flex-1 ml-2 md:ml-4 lg:hidden tracking-tight">Moody</span>
          <span className="hidden lg:block flex-1" />
          <LangToggle />
          <ThemeToggle />
        </header>

        <main className="flex-1 relative pb-[calc(var(--safe-bottom)+6rem)] md:pb-12">
          <Outlet />
        </main>
      </div>

      {/* FAB lên đầu trang */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label={t('common.scrollTop')}
        className={`state fixed right-4 md:right-6 z-20 w-11 h-11 rounded-full bg-primary border border-outline-variant text-on-primary shadow-elev-3 flex items-center justify-center transition-[opacity,transform] duration-200 md:bottom-6 ${showAddFab ? 'bottom-[calc(var(--safe-bottom)+11rem)]' : 'bottom-[calc(var(--safe-bottom)+6.5rem)]'
          } ${showScrollTop ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
          }`}
      >
        <ArrowUp size={20} />
      </button>

      {/* FAB chính (điện thoại). Trên màn hình lớn FAB nằm trong rail / drawer. */}
      {showAddFab && <button
        onClick={() => openCheckIn()}
        aria-label={t('nav.newCheckin')}
        className="state pop-in md:hidden fixed right-4 z-30 w-14 h-14 rounded-xl bg-primary text-on-primary shadow-elev-3 hover:shadow-elev-4 flex items-center justify-center transition-shadow bottom-[calc(var(--safe-bottom)+6rem)]"
      >
        <Plus size={24} />
      </button>}

      {/* Navigation bar (điện thoại) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-20 card-filled border-t border-outline-variant grid grid-cols-4"
        style={{ paddingBottom: 'var(--safe-bottom)' }}
        aria-label={t('nav.label')}
      >
        {TABS.map((tab) => (
          <NavTab key={tab.to} to={tab.to} icon={tab.icon} activeIcon={tab.activeIcon} end={tab.end} label={t(tab.key)} />
        ))}
      </nav>
    </div>
  )
}

function NavTab({ to, label, icon: Icon, activeIcon: ActiveIcon, end }) {
  return (
    <NavLink to={to} end={end} className="flex flex-col items-center pt-2.5 pb-3 gap-1 group">
      {({ isActive }) => {
        const I = isActive ? ActiveIcon : Icon
        return (
          <>
            <span
              className={`relative flex items-center justify-center h-7 w-14 rounded-md transition-colors duration-200 ${isActive ? 'text-brand' : 'text-on-surface-variant'
                }`}
            >
              <I size={22} />
            </span>
            <span className={`t-label-small ${isActive ? 'text-brand' : 'text-on-surface-variant'}`}>{label}</span>
          </>
        )
      }}
    </NavLink>
  )
}
