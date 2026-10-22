import { useEffect, useState } from 'react'

// Giữ phần tử được mount thêm một nhịp để chạy animation đóng (exit), thay vì biến mất ngay.
//  • mounted: có nên render hay không (true từ lúc mở cho tới khi animation đóng kết thúc)
//  • visible: trạng thái "đã mở" dùng để bật/tắt class transition (opacity / transform)
// Chỉ animate opacity + transform nên chạy hoàn toàn trên GPU, không gây reflow.
export function useMountTransition(open, duration = 260) {
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) {
      setMounted(true)
      // Hai khung hình: đảm bảo trình duyệt đã vẽ trạng thái đóng trước khi chuyển sang trạng thái mở.
      let raf2
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setVisible(true))
      })
      return () => {
        cancelAnimationFrame(raf1)
        cancelAnimationFrame(raf2)
      }
    }
    setVisible(false)
    const id = setTimeout(() => setMounted(false), duration)
    return () => clearTimeout(id)
  }, [open, duration])

  return { mounted, visible }
}

// Khóa cuộn nền khi có overlay. Dùng bộ đếm để nhiều overlay chồng nhau (sheet + confirm) không mở khóa sớm.
let lockCount = 0
let prevOverflow = ''
export function useBodyScrollLock(active) {
  useEffect(() => {
    if (!active) return
    if (lockCount === 0) {
      prevOverflow = document.documentElement.style.overflow
      document.documentElement.style.overflow = 'hidden'
    }
    lockCount++
    return () => {
      lockCount--
      if (lockCount === 0) document.documentElement.style.overflow = prevOverflow
    }
  }, [active])
}

// Đóng bằng phím Escape — chỉ overlay trên cùng (mount sau cùng) xử lý.
const escStack = []
export function useEscape(active, onClose) {
  useEffect(() => {
    if (!active) return
    const entry = { onClose }
    escStack.push(entry)
    function onKey(e) {
      if (e.key === 'Escape' && escStack[escStack.length - 1] === entry) entry.onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      const i = escStack.indexOf(entry)
      if (i >= 0) escStack.splice(i, 1)
    }
  }, [active, onClose])
}
