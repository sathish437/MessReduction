import React from "react"
import { FiCalendar } from "react-icons/fi"

function DobInputComponent({ value, onChange, error }) {
  const today = new Date().toISOString().split("T")[0]

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 sm:py-4 transition-all w-full bg-[#0a1628] ${error ? 'border-rose-500/50 bg-rose-500/5 focus-within:border-rose-400' : 'border-white/10 input-focus'}`}>
      <span className={`shrink-0 ${error ? 'text-rose-400' : 'text-teal-400/60'}`}><FiCalendar size={18} /></span>
      <input
        type="date"
        placeholder="Date of birth"
        value={value}
        onChange={onChange}
        max={today}
        required
        className="flex-1 bg-transparent focus:outline-none text-base sm:text-lg text-white placeholder:text-white/25 font-medium appearance-none w-full"
      />
    </div>
  )
}

export default DobInputComponent
