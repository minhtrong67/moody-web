import { useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useCheckIn } from '../context/CheckInContext'

// Giữ tương thích cho liên kết cũ (/checkin, /checkin/:id, /checkin?date=…) và "trang bắt đầu = check-in":
// mở sheet check-in rồi trả về trang chủ, không còn trang check-in riêng.
export default function CheckInRoute() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { openCheckIn } = useCheckIn()

  useEffect(() => {
    openCheckIn({ id, date: params.get('date') })
    navigate('/', { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
