import React from "react"
import { FiCalendar } from "react-icons/fi"

function DobInputComponent({ value, onChange, error }) {
  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="flex flex-col gap-2 w-full text-left">
      <label htmlFor="dob-input" className="text-sm font-semibold tracking-wide text-white/80 select-none">
        Date of Birth
      </label>
      <div 
        className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-300 bg-[#112240] w-full relative group 
          ${error 
            ? 'border-rose-500/50 bg-rose-500/5 focus-within:border-rose-400 focus-within:shadow-[0_0_15px_rgba(244,63,94,0.25)]' 
            : 'border-[rgba(255,255,255,0.15)] focus-within:border-[#00e699] focus-within:shadow-[0_0_15px_rgba(0,230,153,0.25)]'
          }`}
      >
        <span className={`shrink-0 text-lg transition-colors ${error ? 'text-rose-400' : 'text-[#00e699]'}`}>
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
          className="flex-1 bg-transparent focus:outline-none text-base text-white placeholder:text-white/40 font-medium appearance-none w-full cursor-pointer scheme-dark"
        />
      </div>
    </div>
  )
}

export default DobInputComponent
