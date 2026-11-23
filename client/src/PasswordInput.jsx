import React, { useState } from "react"
import { FiLock, FiEye, FiEyeOff } from "react-icons/fi"

function PasswordInput({ id, value, onChange, placeholder = "Password", required = true, error = false }) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div
      className="field-shell relative w-full"
      style={error ? { borderColor: 'var(--color-danger-border)' } : undefined}
    >
      <span
        className="shrink-0"
        style={{ color: error ? 'var(--color-danger)' : 'var(--theme-text-faint)' }}
      >
        <FiLock size={16} />
      </span>
      <input
        id={id}
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full flex-1 bg-transparent pr-8 font-medium focus:outline-none"
      />
      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        className="absolute right-3 flex items-center justify-center transition-colors"
        style={{ color: 'var(--theme-text-faint)' }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--theme-text-primary)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--theme-text-faint)'; }}
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
      </button>
    </div>
  )
}

export default PasswordInput
