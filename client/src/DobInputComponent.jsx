import React from "react"
import { FiCalendar } from "react-icons/fi"

function DobInputComponent({ value, onChange, error }) {
  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="flex flex-col gap-1.5 w-full text-left">
      <label htmlFor="dob-input" className="text-sm font-semibold tracking-wide text-white/80 select-none">
        Date of Birth
      </label>
      <div 
        className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-all duration-300 relative group bg-black/20 w-full 
          ${error 
            ? 'border-rose-500/50 bg-rose-500/5 focus-within:border-rose-400' 
            : 'border-white/8 focus-within:border-teal-500/60 focus-within:bg-teal-950/10 focus-within:shadow-[0_0_15px_rgba(20,184,166,0.1)]'
          }`}
      >
        <span className={`shrink-0 text-base transition-colors ${error ? 'text-rose-400' : 'text-teal-400/60 group-focus-within:text-teal-400'}`}>
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
          className="flex-1 bg-transparent focus:outline-none text-base text-white placeholder:text-white/40 font-medium appearance-none w-full cursor-pointer"
        />
      </div>
    </div>
  )
}

export default DobInputComponent
