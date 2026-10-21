// Switch phẳng 44×24: nền xám khi tắt, teal (primary) khi bật.
export default function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className="switch"
    >
      <span className="thumb" />
    </button>
  )
}
