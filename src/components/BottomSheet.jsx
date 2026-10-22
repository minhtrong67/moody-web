import { createPortal } from 'react-dom'
import { X } from './icons'
import { useMountTransition, useBodyScrollLock, useEscape } from '../hooks/useOverlay'
import { useI18n } from '../i18n'

// Bottom sheet.
//  • Mặc định: sheet thấp, bo góc phía trên, có tay nắm.
//  • fullScreen: phủ kín màn hình trên điện thoại (form dài); từ md trở lên là sheet cao ~92% màn hình.
//  • footer: vùng nút thao tác dính đáy sheet (nên dùng .btn có icon + label + nền màu).
//  • dismissOnBackdrop=false: chạm nền tối không đóng (tránh mất dữ liệu đang nhập).
// Animation chỉ dùng transform/opacity và có cả chiều đóng.
export default function BottomSheet({
  open, title, onClose, children, footer, fullScreen = false, dismissOnBackdrop = true
}) {
  const { t } = useI18n()
  const { mounted, visible } = useMountTransition(open, 300)
  useBodyScrollLock(mounted)
  useEscape(open, onClose)

  if (!mounted) return null

  const panelSize = fullScreen
    ? 'h-[100dvh] md:h-[92dvh] md:max-w-3xl md:rounded-t-xl md:border-t md:border-x bg-surface'
    : 'max-h-[88dvh] max-w-lg rounded-t-xl border-t border-x bg-popover'

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="presentation">
      <div
        className={`absolute inset-0 scrim transition-opacity duration-300 ease-out ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={dismissOnBackdrop ? onClose : undefined}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative flex flex-col w-full text-popover-foreground border-outline-variant shadow-elev-4 overflow-hidden transition-transform duration-300 ease-emphasized-decel ${panelSize} ${visible ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ willChange: visible ? 'auto' : 'transform' }}
      >
        {fullScreen ? (
          <header
            className="shrink-0 flex items-center h-14 gap-1 px-1 md:px-3 border-b border-outline-variant"
            style={{ paddingTop: 'var(--safe-top)', height: 'calc(3.5rem + var(--safe-top))' }}
          >
            <button onClick={onClose} aria-label={t('common.close')} className="icon-btn state text-on-surface">
              <X size={24} />
            </button>
            <h2 className="t-title-large ml-1 truncate">{title}</h2>
          </header>
        ) : (
          <div className="shrink-0 px-6 pt-3">
            <div className="w-8 h-1 rounded-full bg-outline-variant mx-auto mb-5" />
            <h2 className="t-title-large mb-4">{title}</h2>
          </div>
        )}

        <div
          className={`flex-1 min-h-0 overflow-y-auto overscroll-contain ${fullScreen ? 'px-4 md:px-8 pt-5 pb-6' : 'px-6'} ${footer ? '' : 'pb-[calc(var(--safe-bottom)+1.5rem)]'}`}
        >
          {children}
        </div>

        {footer && (
          <footer
            className="shrink-0 flex items-center gap-3 px-4 md:px-8 pt-3 border-t border-outline-variant bg-inherit"
            style={{ paddingBottom: 'calc(var(--safe-bottom) + 0.75rem)' }}
          >
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body
  )
}
