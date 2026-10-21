import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Check, AlertTriangle, Info, X } from '../components/icons'

const ToastContext = createContext(null)

const VARIANTS = {
  default: { icon: null, tone: '' },
  info: { icon: Info, tone: 'text-brand bg-primary-container' },
  success: { icon: Check, tone: 'text-brand bg-primary-container' },
  error: { icon: AlertTriangle, tone: 'text-error bg-error-container' }
}

// Toast theo theme: nền popover + viền mảnh nên tự đổi đúng ở giao diện sáng và tối.
// showToast(message, { type: 'default' | 'info' | 'success' | 'error', duration })
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timerRef = useRef(null)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const dismiss = useCallback(() => {
    clearTimeout(timerRef.current)
    setToast(null)
  }, [])

  const showToast = useCallback((message, options = {}) => {
    clearTimeout(timerRef.current)
    setToast({ message, type: options.type || 'default', id: Date.now() })
    timerRef.current = setTimeout(() => setToast(null), options.duration || 3000)
  }, [])

  const variant = VARIANTS[toast?.type] || VARIANTS.default
  const Icon = variant.icon

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed left-4 right-4 z-[90] flex justify-center pointer-events-none bottom-[calc(var(--safe-bottom)+6rem)] md:bottom-6"
        role="status"
        aria-live="polite"
      >
        {toast && (
          <div
            key={toast.id}
            className="toast-enter pointer-events-auto flex items-center gap-3 w-full max-w-md min-h-12 pl-3 pr-2 py-2 rounded-lg bg-popover text-popover-foreground border border-outline-variant shadow-elev-4 backdrop-blur"
          >
            {Icon && (
              <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${variant.tone}`}>
                <Icon size={16} strokeWidth={2.25} />
              </span>
            )}
            <p className={`flex-1 t-body-medium ${Icon ? '' : 'pl-1'}`}>{toast.message}</p>
            <button onClick={dismiss} aria-label="Close" className="icon-btn icon-btn-sm state shrink-0">
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
