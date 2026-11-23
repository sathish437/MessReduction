import React, { useState } from "react"
import { motion } from "framer-motion"
import { FiUser, FiArrowRight, FiAlertCircle } from "react-icons/fi"
import apiClient from "./api/apiClient"
import DobInputComponent from "./DobInputComponent"
import { setStudentAuth } from "./services/authService"
import AuthShell, { AuthCardHeader } from "./components/AuthShell"

function StudentLogin({ onNavigate }) {
  const [identifier, setIdentifier] = useState("")
  const [dob, setDob] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!identifier || !dob) {
      setError("Please fill both Register Number / Roll Number and Date of Birth")
      setLoading(false)
      return
    }

    try {
      const requestBody = {
        identifier: identifier,
        dob: dob
      }

      const response = await apiClient.post('/api/auth/login', requestBody)
      const data = response.data

      if (data.token) {
        const userData = {
          name: data.name,
          studentId: data.studentId,
          registerNo: data.registerNo,
          rollNo: data.rollNo,
          token: data.token
        }
        setStudentAuth(data.token, userData)
        if (onNavigate) {
          onNavigate('/student-dashboard')
        }
      } else {
        setError('Login failed. Please check your credentials.')
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Login failed. Please try again.'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell onNavigate={onNavigate} backTo="/" backLabel="Portal home" maxWidth="430px" footerNote="Student Sign In">
      <div className="panel p-6 sm:p-7">
        <AuthCardHeader
          eyebrow="Student Portal"
          title="Sign in to your account"
          subtitle="Use your register number or roll number along with your date of birth."
          icon={<FiUser size={18} />}
        />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex w-full flex-col gap-1.5 text-left">
            <label htmlFor="identifier-input" className="field-label">
              Register Number / Roll Number
            </label>
            <div
              className="field-shell"
              style={error ? { borderColor: 'var(--color-danger-border)' } : undefined}
            >
              <span
                className="shrink-0"
                style={{ color: error ? 'var(--color-danger)' : 'var(--theme-text-faint)' }}
              >
                <FiUser size={16} />
              </span>
              <input
                id="identifier-input"
                type="text"
                placeholder="e.g. 812321104001"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value.toUpperCase())}
                autoComplete="username"
                required
                className="w-full flex-1 bg-transparent font-medium tracking-wide focus:outline-none"
              />
            </div>
          </div>

          <DobInputComponent
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            error={!!error}
          />

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-[var(--radius-md)] px-3 py-2.5 text-xs font-medium"
              style={{
                background: 'var(--color-danger-soft)',
                border: '1px solid var(--color-danger-border)',
                color: 'var(--color-danger)'
              }}
            >
              <FiAlertCircle className="mt-[1px] shrink-0" size={14} />
              <span>{error}</span>
            </div>
          )}

          <motion.button
            whileTap={loading ? {} : { scale: 0.995 }}
            type="submit"
            disabled={loading}
            className="btn btn-primary mt-1 w-full"
          >
            {loading ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Signing in…
              </>
            ) : (
              <>
                Sign in
                <FiArrowRight size={15} />
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-5 border-t pt-4 text-center" style={{ borderColor: 'var(--theme-border)' }}>
          <p className="text-xs text-[var(--theme-text-secondary)]">
            New student?{' '}
            <button
              type="button"
              onClick={() => (onNavigate ? onNavigate('/hostel-verification') : (window.location.href = '/hostel-verification'))}
              className="font-semibold text-[var(--color-accent)] underline-offset-2 hover:underline"
            >
              Create an account
            </button>
          </p>
        </div>
      </div>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-[var(--theme-text-faint)]">
        Having trouble signing in? Contact the hostel office with your register number.
      </p>
    </AuthShell>
  )
}

export default StudentLogin
