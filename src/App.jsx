import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { I18nProvider } from './i18n'
import { ToastProvider } from './context/ToastContext'
import { MoodEntriesProvider } from './context/MoodEntriesContext'
import { ActivitiesProvider } from './context/ActivitiesContext'
import { CheckInProvider } from './context/CheckInContext'
import { MoodsProvider } from './context/MoodsContext'
import AppShell from './components/AppShell'
import { isGuest } from './lib/session'
import PageSkeleton from './components/PageSkeleton'
import { getStartPage } from './lib/startPage'

const loaders = {
  Dashboard: () => import('./pages/Dashboard'),
  History: () => import('./pages/History'),
  Statistics: () => import('./pages/Statistics'),
  Settings: () => import('./pages/Settings'),
  ManageActivities: () => import('./pages/ManageActivities'),
  ManageMoods: () => import('./pages/ManageMoods')
}

const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(loaders.Dashboard)
import CheckIn from './pages/CheckIn'
const History = lazy(loaders.History)
const Statistics = lazy(loaders.Statistics)
const Settings = lazy(loaders.Settings)
const ManageActivities = lazy(loaders.ManageActivities)
const ManageMoods = lazy(loaders.ManageMoods)

// Tải sẵn các trang khi trình duyệt rảnh để chuyển trang gần như tức thì.
function prefetchPages() {
  const run = () => Object.values(loaders).forEach((load) => load())
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 3000 })
  else setTimeout(run, 1500)
}

// Giữ giống hệt màn hình khởi động tĩnh trong index.html (chỉ logo app) để chuyển tiếp liền mạch.
function LoadingScreen() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-surface">
      <img src="/icons/icon-192.png" alt="" width="64" height="64" className="w-16 h-16 rounded-xl" />
    </div>
  )
}

// Mỗi route có Suspense riêng: khi trang đang tải chỉ vùng nội dung hiện skeleton,
// header + bottom bar (AppShell) vẫn giữ nguyên.
function page(Component, variant) {
  return (
    <Suspense fallback={<PageSkeleton variant={variant} />}>
      <Component />
    </Suspense>
  )
}

// Điều hướng theo trạng thái đăng nhập:
//  • Chưa đăng nhập → trang giới thiệu (/welcome); từ đó bấm "Đăng nhập" → /login.
//  • Đã đăng nhập (hoặc đã chọn chế độ khách) → vào thẳng ứng dụng, không qua trang giới thiệu nữa.
//    Trang giới thiệu vẫn xem lại được ở /welcome (nút "Giới thiệu" trong Cài đặt).
function Gate() {
  const { user, loading } = useAuth()
  const [guest, setGuest] = useState(isGuest)
  const navigate = useNavigate()
  const location = useLocation()
  const startHandled = useRef(false)
  const authed = !!user || guest
  const ready = !loading && authed

  useEffect(() => {
    const sync = () => setGuest(isGuest())
    window.addEventListener('guest-mode', sync)
    return () => window.removeEventListener('guest-mode', sync)
  }, [])

  // Mở app → chuyển tới trang mặc định người dùng đã chọn (chỉ một lần mỗi lần mở app,
  // và chỉ khi đang ở trang chủ để không đè lên liên kết sâu).
  useLayoutEffect(() => {
    if (!ready || startHandled.current) return
    startHandled.current = true
    const target = getStartPage()
    if (target !== '/' && location.pathname === '/') navigate(target, { replace: true })
  }, [ready, location.pathname, navigate])

  useEffect(() => {
    if (ready) prefetchPages()
  }, [ready])

  if (loading) return <LoadingScreen />

  return (
    <>
      <Routes>
        <Route path="/welcome" element={<Suspense fallback={<LoadingScreen />}><Landing /></Suspense>} />
        <Route
          path="/login"
          element={authed ? <Navigate to="/" replace /> : <Suspense fallback={<LoadingScreen />}><Login /></Suspense>}
        />
        {authed ? (
          <>
            <Route element={<AppShell />}>
              <Route path="/" element={page(Dashboard, 'dashboard')} />
              <Route path="/history" element={page(History, 'history')} />
              <Route path="/stats" element={page(Statistics, 'stats')} />
              <Route path="/settings" element={page(Settings, 'settings')} />
              <Route path="/manage/activities" element={page(ManageActivities, 'manage')} />
              <Route path="/manage/moods" element={page(ManageMoods, 'manage')} />
              <Route path="/checkin" element={<CheckIn />} />
              <Route path="/checkin/:id" element={<CheckIn />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/welcome" replace />} />
        )}
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <MoodEntriesProvider>
          <ActivitiesProvider>
            <MoodsProvider>
              <ToastProvider>
                <HashRouter>
                  <CheckInProvider>
                    <Gate />
                  </CheckInProvider>
                </HashRouter>
              </ToastProvider>
            </MoodsProvider>
          </ActivitiesProvider>
        </MoodEntriesProvider>
      </AuthProvider>
    </I18nProvider>
  )
}
