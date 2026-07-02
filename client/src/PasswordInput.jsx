import React, { useState } from "react"
import { FiLock, FiEye, FiEyeOff } from "react-icons/fi"

function PasswordInput({ value, onChange, placeholder = "Password", required = true, error = false }) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 sm:py-4 transition-all w-full relative bg-[#0a1628] ${error ? 'border-rose-500/50 bg-rose-500/5 focus-within:border-rose-400' : 'border-white/10 input-focus'}`}>
      <span className={`shrink-0 ${error ? 'text-rose-400' : 'text-teal-400/60'}`}><FiLock size={18} /></span>
      <input
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="flex-1 bg-transparent focus:outline-none text-base sm:text-lg text-white placeholder:text-white/25 font-medium pr-10"
      />
      <button
        type="button"
        onClick={() => setShowPassword(prev => !prev)}
        className="absolute right-4 text-white/40 hover:text-white transition-colors focus:outline-none flex items-center justify-center"
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
      </button>
    </div>
  )
}

export default PasswordInput
