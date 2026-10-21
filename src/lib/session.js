// Chế độ khách (không đăng nhập): ghi nhớ trên thiết bị để lần sau mở app vào thẳng ứng dụng,
// không phải qua trang giới thiệu / đăng nhập nữa. Đăng xuất hoặc "Đăng nhập" sẽ xóa cờ này.
const KEY = 'guest-mode'

export function isGuest() {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

function set(on) {
  try {
    if (on) localStorage.setItem(KEY, '1')
    else localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent('guest-mode', { detail: on }))
}

export const enterGuest = () => set(true)
export const leaveGuest = () => set(false)
