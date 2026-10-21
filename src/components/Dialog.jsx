import { useEffect } from 'react'
import { createPortal } from 'react-dom'

// Dialog phẳng: nền card, viền mảnh, bo góc theo --radius, tiêu đề đậm vừa.
// Nút hành động đặt trong `children` (dùng <DialogActions>).
export default function Dialog({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6 scrim animate-[fadeIn_0.2s_ease_both]"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-popover text-popover-foreground border border-outline-variant rounded-xl p-6 pop-in shadow-elev-4"
      >
        <p className="t-headline-small mb-4">{title}</p>
        {children}
      </div>
    </div>
    , document.body)
}

export function DialogActions({ children }) {
  return <div className="flex justify-end gap-2 mt-6">{children}</div>
}
