import React from "react"
import { FiCalendar } from "react-icons/fi"

function DobInputComponent({ value, onChange }) {
  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/4 px-4 py-3.5 focus-within:border-teal-500/60 focus-within:bg-teal-950/20 transition-all w-full">
      <span className="text-teal-400/60 shrink-0"><FiCalendar size={18} /></span>
      <input
        type="date"
        placeholder="Date of birth"
        value={value}
        onChange={onChange}
        max={today}
        required
        className="flex-1 bg-transparent focus:outline-none text-base text-white placeholder:text-white/25 font-medium appearance-none w-full"
      />
    </div>
  )
}

export default DobInputComponent
