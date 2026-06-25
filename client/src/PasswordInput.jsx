import React, { useState } from "react"
import { FiLock, FiEye, FiEyeOff } from "react-icons/fi"

function PasswordInput({ value, onChange, placeholder = "Password", required = true }) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/4 px-4 py-2.5 focus-within:border-teal-500/40 focus-within:bg-teal-500/5 transition-colors duration-200 w-full relative">
      <span className="text-teal-400/60 shrink-0"><FiLock size={18} /></span>
      <input
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="flex-1 bg-transparent focus:outline-none text-sm text-white placeholder:text-white/25 font-medium pr-10"
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
