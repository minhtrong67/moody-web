import { forwardRef, useId } from 'react'
import { ChevronDown } from './icons'

// Ô nhập liệu phẳng: nhãn nằm phía trên, viền mảnh, vòng focus theo --ring của theme.
// - as="input" (mặc định) | "textarea" | "select"
// - leading: icon đứng đầu
// (alwaysFloat / fieldBg còn được nhận để tương thích với nơi gọi cũ nhưng không còn tác dụng.)
const TextField = forwardRef(function TextField(
  // eslint-disable-next-line no-unused-vars
  { label, as = 'input', alwaysFloat, leading, className = '', fieldBg, children, placeholder, id, ...props },
  ref
) {
  const Tag = as
  const autoId = useId()
  const fieldId = id || autoId
  return (
    <div className={`field ${className}`}>
      <label htmlFor={fieldId}>{label}</label>
      <div className="field-control">
        {leading && <span className="field-icon" style={{ left: 12 }}>{leading}</span>}
        <Tag
          ref={ref}
          id={fieldId}
          placeholder={placeholder}
          className={`field-input ${leading ? 'has-leading' : ''}`}
          {...props}
        >
          {children}
        </Tag>
        {as === 'select' && <ChevronDown size={18} className="field-icon" style={{ right: 12 }} />}
      </div>
    </div>
  )
})

export default TextField
