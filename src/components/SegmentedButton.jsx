// Segmented control dạng tabs: ô được chọn nổi lên trên nền xám nhạt.
export default function SegmentedButton({ options, value, onChange, className = '' }) {
  return (
    <div className={`segmented ${className}`} role="group">
      {options.map((o) => {
        const selected = value === o.key
        return (
          <button
            key={o.key}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(o.key)}
          >
            {o.icon ? <o.icon size={16} /> : null}
            <span className="truncate">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}
