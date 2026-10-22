import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import CheckInSheet from '../components/CheckInSheet'

const CheckInContext = createContext(null)

// Mở sheet check-in từ bất kỳ đâu: openCheckIn() · openCheckIn({ id }) để sửa · openCheckIn({ date: 'YYYY-MM-DD' }).
// Phải đặt bên trong Router + Toast + các provider dữ liệu.
export function CheckInProvider({ children }) {
  const [open, setOpen] = useState(false)
  const [request, setRequest] = useState({ id: null, date: null, nonce: 0 })

  const openCheckIn = useCallback((opts = {}) => {
    setRequest((r) => ({ id: opts.id ?? null, date: opts.date ?? null, nonce: r.nonce + 1 }))
    setOpen(true)
  }, [])
  const closeCheckIn = useCallback(() => setOpen(false), [])

  const value = useMemo(() => ({ openCheckIn, closeCheckIn }), [openCheckIn, closeCheckIn])

  return (
    <CheckInContext.Provider value={value}>
      {children}
      <CheckInSheet open={open} request={request} onClose={closeCheckIn} />
    </CheckInContext.Provider>
  )
}

export function useCheckIn() {
  const ctx = useContext(CheckInContext)
  if (!ctx) throw new Error('useCheckIn must be used within CheckInProvider')
  return ctx
}
