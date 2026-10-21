import { useEffect } from 'react'
import { createPortal } from 'react-dom'

// Bottom sheet: nền popover, viền mảnh, bo góc phía trên, có tay nắm.
export default function BottomSheet({ open, title, onClose, children }) {
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
    <div className="fixed inset-0 z-50 flex items-end justify-center scrim animate-[fadeIn_0.2s_ease_both]" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[88dvh] overflow-y-auto overscroll-contain bg-popover text-popover-foreground border-t border-x border-outline-variant rounded-t-xl px-6 pt-3 shadow-elev-4 animate-[sheetUp_0.4s_cubic-bezier(0.05,0.7,0.1,1)_both]"
        style={{ paddingBottom: 'calc(var(--safe-bottom) + 1.5rem)' }}
      >
        <div className="w-8 h-1 rounded-full bg-outline-variant mx-auto mb-5" />
        <p className="t-title-large mb-4">{title}</p>
        {children}
      </div>
    </div>
    , document.body)
}
