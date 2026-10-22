import { useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, HelpCircle, Check, Trash2, X, Loader2 } from './icons'
import { useMountTransition, useBodyScrollLock, useEscape } from '../hooks/useOverlay'
import { useI18n } from '../i18n'

// Dialog xác nhận: icon + tiêu đề canh giữa; hai nút bằng nhau đều có icon + label + nền màu:
//  • Hủy  → tonal (X)
//  • Đồng ý → đỏ (danger) hoặc màu chính; icon mặc định Trash2 (danger) / Check, đổi bằng `confirmIcon`.
export default function ConfirmDialog({
  open, title, description, confirmLabel, confirmIcon, danger, onConfirm, onCancel
}) {
  const { t } = useI18n()
  const [submitting, setSubmitting] = useState(false)
  const { mounted, visible } = useMountTransition(open, 200)
  useBodyScrollLock(mounted)
  useEscape(open, () => { if (!submitting) onCancel() })

  if (!mounted) return null

  async function handleConfirm() {
    if (submitting) return
    setSubmitting(true)
    try {
      await onConfirm()
    } finally {
      setSubmitting(false)
    }
  }

  function handleCancel() {
    if (submitting) return
    onCancel()
  }

  const Icon = danger ? AlertTriangle : HelpCircle
  const ConfirmIcon = confirmIcon || (danger ? Trash2 : Check)

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-6" role="presentation">
      <div
        className={`absolute inset-0 scrim transition-opacity duration-200 ease-out ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleCancel}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full max-w-sm bg-popover text-popover-foreground border border-outline-variant rounded-xl p-6 shadow-elev-4 transition-[opacity,transform] duration-200 ease-emphasized-decel ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        <Icon size={28} className={`mx-auto mb-4 ${danger ? 'text-error' : 'text-brand'}`} />
        <p className="t-headline-small text-center mb-4">{title}</p>
        {description && <p className="t-body-medium text-on-surface-variant mb-6">{description}</p>}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleCancel} disabled={submitting} className="btn btn-tonal state">
            <X size={18} />
            {t('common.cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className={`btn state ${danger ? 'btn-error' : 'btn-filled'}`}
          >
            {submitting ? <Loader2 size={18} /> : <ConfirmIcon size={18} />}
            {confirmLabel || t('common.confirm')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
