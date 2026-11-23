import React from "react"
import { FiCalendar } from "react-icons/fi"

function DobInputComponent({ value, onChange, error }) {
  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="flex w-full flex-col gap-1.5 text-left">
      <label htmlFor="dob-input" className="field-label">
        Date of Birth
      </label>
      <div
        className="field-shell"
        style={error ? { borderColor: 'var(--color-danger-border)' } : undefined}
      >
        <span
          className="shrink-0"
          style={{ color: error ? 'var(--color-danger)' : 'var(--theme-text-faint)' }}
        >
          <FiCalendar size={16} />
        </span>
        <input
          id="dob-input"
          type="date"
          value={value}
          onChange={onChange}
          max={today}
          required
          className="w-full flex-1 bg-transparent font-medium focus:outline-none"
        />
      </div>
    </div>
  )
}

export default DobInputComponent
