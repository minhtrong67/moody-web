// Bộ icon nét mảnh (lucide-react) cho phong cách minimalist.
// Các icon "đặc" (…Filled) dùng cho tab đang chọn: cùng hình nhưng nét dày hơn.
import { forwardRef } from 'react'
import {
  Home as LHome, ListChecks as LListChecks, History as LHistory, BarChart3 as LBarChart3, Settings as LSettings,
  Plus, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Menu, Sun, Moon, Monitor, X, Check, TriangleAlert as AlertTriangle,
  CircleHelp as HelpCircle, Languages, Palette, Calendar, CalendarCheck2, ChevronDown, ChevronLeft, ChevronRight,
  Clock3, Download, Upload, FileDown, Image, Flame, Heart, List, ListPlus, LogOut, NotebookPen, Pencil, RotateCcw,
  Search, Send, Settings2, Bell, BellOff, Info, Sparkles, SlidersHorizontal, Smartphone, Smile, Trash2, TrendingUp, GripVertical
} from 'lucide-react'

const DEFAULT_STROKE = 1.75

function withStroke(Icon, strokeWidth = DEFAULT_STROKE) {
  const Wrapped = forwardRef(function Icon_(props, ref) {
    return <Icon ref={ref} strokeWidth={strokeWidth} aria-hidden="true" {...props} />
  })
  return Wrapped
}

export const Home = withStroke(LHome)
export const HomeFilled = withStroke(LHome, 2.4)
export const ListChecks = withStroke(LListChecks)
export const HistoryIcon = withStroke(LHistory)
export const HistoryFilled = withStroke(LHistory, 2.4)
export const BarChart3 = withStroke(LBarChart3)
export const BarChartFilled = withStroke(LBarChart3, 2.4)
export const Settings = withStroke(LSettings)
export const SettingsFilled = withStroke(LSettings, 2.4)

export {
  Plus, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Menu, Sun, Moon, Monitor, X, Check, AlertTriangle, HelpCircle,
  Languages, Palette, Calendar, CalendarCheck2, ChevronDown, ChevronLeft, ChevronRight, Clock3, Download, Upload,
  FileDown, Image, Flame, Heart, List, ListPlus, LogOut, NotebookPen, Pencil, RotateCcw, Search, Send, Settings2,
  SlidersHorizontal, Smartphone, Smile, Trash2, TrendingUp, GripVertical, Bell, BellOff, Info, Sparkles
}

// Vòng tròn tiến trình (indeterminate).
export function Loader2({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={`spinner ${className}`} aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}
