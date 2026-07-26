import React from "react"
import { FiCalendar } from "react-icons/fi"

function DobInputComponent({ value, onChange, error }) {
  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="flex flex-col gap-1.5 w-full text-left">
      <label htmlFor="dob-input" className="text-sm font-semibold tracking-wide text-[var(--color-text-primary)] select-none">
        Date of Birth
      </label>
      <div 
        className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-all duration-300 relative group bg-[var(--color-primary-bg)] w-full 
          ${error 
            ? 'border-rose-500/50 bg-rose-500/5 focus-within:border-rose-400' 
            : 'border-[var(--color-border)] focus-within:border-[var(--color-btn-primary)] focus-within:bg-[var(--color-btn-primary)]/5 focus-within:ring-2 focus-within:ring-[var(--color-btn-primary)]/20'
          }`}
      >
        <span className={`shrink-0 text-base transition-colors ${error ? 'text-rose-400' : 'text-[var(--color-text-secondary)] group-focus-within:text-[var(--color-btn-primary)]'}`}>
          <FiCalendar />
        </span>
        <input
          id="dob-input"
          type="date"
          placeholder="Date of birth"
          value={value}
          onChange={onChange}
          max={today}
          required
          className="flex-1 bg-transparent focus:outline-none text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] font-medium appearance-none w-full cursor-pointer"
        />
      </div>
    </div>
  )
}

export default DobInputComponent
