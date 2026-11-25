import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FiUser, FiArrowRight, FiAlertCircle, FiPhone, FiCalendar, FiCheckCircle, FiInfo } from "react-icons/fi"
import apiClient from "./api/apiClient"
import PasswordInput from "./PasswordInput"
import DobInputComponent from "./DobInputComponent"
import { setStudentAuth } from "./services/authService"
import AuthShell, { AuthCardHeader } from "./components/AuthShell"

function StudentLogin({ onNavigate }) {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // First-Time Setup Modal State
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [modalDob, setModalDob] = useState("")
  const [modalPhone, setModalPhone] = useState("")
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!identifier.trim() || !password) {
      setError("Please fill both Register Number / Roll Number and Hostel App Password.")
      return
    }

    setLoading(true)

    try {
      const requestBody = {
        identifier: identifier.trim(),
        password: password
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

        if (data.onboardingRequired) {
          setShowSetupModal(true)
        } else {
          if (onNavigate) {
            onNavigate('/student-dashboard')
          } else {
            window.location.href = '/student-dashboard'
          }
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

  const handleCompleteProfile = async (e) => {
    e.preventDefault()
    setModalError("")

    // Validate DOB
    if (!modalDob) {
      setModalError("Please select your Date of Birth.")
      return
    }

    // Validate phone number: exactly 10 digits
    const cleanPhone = modalPhone.trim()
    if (!/^\d{10}$/.test(cleanPhone)) {
      setModalError("Please enter a valid 10-digit mobile phone number.")
      return
    }

    setModalLoading(true)

    try {
      await apiClient.post('/api/student/complete-profile', {
        dob: modalDob,
        phoneNo: cleanPhone
      })

      setShowSetupModal(false)
      if (onNavigate) {
        onNavigate('/student-dashboard')
      } else {
        window.location.href = '/student-dashboard'
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to complete profile setup. Please try again.'
      setModalError(msg)
    } finally {
      setModalLoading(false)
    }
  }

  return (
    <AuthShell onNavigate={onNavigate} backTo="/" backLabel="Portal home" maxWidth="430px" footerNote="Student Sign In">
      <div className="panel p-6 sm:p-7">
        <AuthCardHeader
          eyebrow="Student Portal"
          title="Sign in with Hostel Credentials"
          subtitle="Use your official GCES Hostel App Register Number and Password to access your mess reduction dashboard."
          icon={<FiUser size={18} />}
        />

        <div
          className="mb-5 flex items-start gap-2.5 rounded-[var(--radius-md)] p-3 text-xs leading-relaxed"
          style={{
            background: 'var(--color-accent-soft)',
            border: '1px solid var(--color-accent-border, rgba(59, 130, 246, 0.25))',
            color: 'var(--theme-text-primary)'
          }}
        >
          <FiInfo className="mt-0.5 shrink-0 text-[var(--color-accent)]" size={15} />
          <span>
            No registration needed. Sign in directly with your official hostel login credentials.
          </span>
        </div>

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
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                required
                className="w-full flex-1 bg-transparent font-medium tracking-wide focus:outline-none"
              />
            </div>
          </div>

          <div className="flex w-full flex-col gap-1.5 text-left">
            <label htmlFor="password-input" className="field-label">
              Hostel App Password
            </label>
            <PasswordInput
              id="password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your hostel password"
              error={!!error}
              required
            />
          </div>

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
            Use the same account credentials assigned by the GCES Hostel Management App.
          </p>
        </div>
      </div>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-[var(--theme-text-faint)]">
        Forgot password or having trouble signing in? Please contact the Hostel Office.
      </p>

      {/* First-Time Setup Modal */}
      <AnimatePresence>
        {showSetupModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="panel w-full max-w-md overflow-hidden p-6 sm:p-7 shadow-2xl"
              style={{ background: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
            >
              <div className="mb-5">
                <div
                  className="mb-3 flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)]"
                  style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}
                >
                  <FiCheckCircle size={20} />
                </div>
                <h3 className="text-lg font-semibold tracking-tight text-[var(--theme-text-primary)]">
                  Complete First-Time Setup
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[var(--theme-text-secondary)]">
                  Welcome to the Mess Reduction Portal! Please provide your Date of Birth and 10-digit Phone Number to complete your profile before proceeding to your dashboard.
                </p>
              </div>

              <form onSubmit={handleCompleteProfile} className="flex flex-col gap-4">
                <DobInputComponent
                  value={modalDob}
                  onChange={(e) => setModalDob(e.target.value)}
                  error={!!modalError && !modalDob}
                />

                <div className="flex w-full flex-col gap-1.5 text-left">
                  <label htmlFor="modal-phone-input" className="field-label">
                    Mobile Phone Number (10 digits)
                  </label>
                  <div
                    className="field-shell"
                    style={modalError && !/^\d{10}$/.test(modalPhone.trim()) ? { borderColor: 'var(--color-danger-border)' } : undefined}
                  >
                    <span
                      className="shrink-0"
                      style={{ color: modalError ? 'var(--color-danger)' : 'var(--theme-text-faint)' }}
                    >
                      <FiPhone size={16} />
                    </span>
                    <input
                      id="modal-phone-input"
                      type="tel"
                      maxLength={10}
                      placeholder="e.g. 9876543210"
                      value={modalPhone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '')
                        setModalPhone(val)
                      }}
                      required
                      className="w-full flex-1 bg-transparent font-medium tracking-wide focus:outline-none"
                    />
                  </div>
                  <span className="text-[11px] text-[var(--theme-text-faint)]">
                    Used for essential mess reduction updates and notifications.
                  </span>
                </div>

                {modalError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-[var(--radius-md)] px-3 py-2 text-xs font-medium"
                    style={{
                      background: 'var(--color-danger-soft)',
                      border: '1px solid var(--color-danger-border)',
                      color: 'var(--color-danger)'
                    }}
                  >
                    <FiAlertCircle className="mt-[1px] shrink-0" size={14} />
                    <span>{modalError}</span>
                  </div>
                )}

                <motion.button
                  whileTap={modalLoading ? {} : { scale: 0.995 }}
                  type="submit"
                  disabled={modalLoading}
                  className="btn btn-primary mt-2 w-full"
                >
                  {modalLoading ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Saving Profile…
                    </>
                  ) : (
                    <>
                      Complete Setup & Continue
                      <FiArrowRight size={15} />
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AuthShell>
  )
}

export default StudentLogin
