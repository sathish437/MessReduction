import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { FiHash, FiArrowRight, FiShield, FiAlertCircle } from "react-icons/fi"
import apiClient from "./api/apiClient"
import PasswordInput from "./PasswordInput"
import { getHostelVerificationEnabled } from "./services/authService"
import AuthShell, { AuthCardHeader } from "./components/AuthShell"

function HostelVerification({ onNavigate }) {
  const [regNo, setRegNo] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [checkingFlag, setCheckingFlag] = useState(true)

  const navigate = (path) => {
    if (onNavigate) {
      onNavigate(path)
    } else {
      window.location.href = path
    }
  }

  useEffect(() => {
    getHostelVerificationEnabled().then(enabled => {
      if (!enabled) {
        navigate("/register")
      } else {
        setCheckingFlag(false)
      }
    })
  }, [])

  const handleRegNoChange = (e) => {
    setRegNo(e.target.value.toUpperCase())
  }

  const handleAlphaNumKey = (e) => {
    if (!/[a-zA-Z0-9]/.test(e.key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Enter"].includes(e.key)) {
      e.preventDefault()
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setError("")

    if (!regNo.trim() || !password) {
      setError("Invalid Register Number or Password.\n\nPlease use your official College Hostel credentials.")
      return
    }

    setLoading(true)

    try {
      const response = await apiClient.post("/api/auth/verify-hostel", {
        registerNo: regNo.trim(),
        password: password
      })

      const isVerifiedSuccess = response.data === true || response.data?.verified === true;

      if (response.status === 200 && isVerifiedSuccess) {
        // Save temporary session flags
        sessionStorage.setItem("hostelVerified", "true")
        sessionStorage.setItem("verifiedStudentData", JSON.stringify(response.data))

        // Navigate ONLY when verification succeeded
        navigate("/register")
      } else {
        setError(response.data?.message || "Invalid Register Number or Password.\n\nPlease use your official College Hostel credentials.")
      }
    } catch (err) {
      const serverMsg = err.response?.data?.message
      if (err.response?.status === 401 || err.response?.status === 400) {
        setError(serverMsg || "Invalid Register Number or Password.\n\nPlease use your official College Hostel credentials.")
      } else {
        setError(serverMsg || "Unable to connect to the College Hostel Verification Server.\n\nPlease try again later.")
      }
    } finally {
      setLoading(false)
    }
  }

  if (checkingFlag) {
    return (
      <AuthShell onNavigate={onNavigate} backTo="/" backLabel="Portal home" maxWidth="420px" footerNote="Hostel verification">
        <div className="panel p-6">
          <div className="skeleton h-9 w-9 rounded-[var(--radius-md)]" />
          <div className="skeleton mt-4 h-4 w-40" />
          <div className="skeleton mt-2 h-3 w-56" />
          <div className="skeleton mt-6 h-11 w-full" />
          <div className="skeleton mt-3 h-11 w-full" />
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      onNavigate={onNavigate}
      backTo="/"
      backLabel="Portal home"
      maxWidth="420px"
      footerNote="Hostel verification"
    >
      <div className="panel overflow-hidden">
        <div className="p-6 sm:p-7">
          <AuthCardHeader
            eyebrow="Step 1 of 2"
            title="Hostel verification"
            subtitle="Verify your hostel account before creating a mess reduction account."
            icon={<FiShield size={18} />}
          />

          <form onSubmit={handleVerify} className="space-y-4">
            {/* Register Number Field */}
            <div>
              <label htmlFor="hostel-regNo" className="field-label select-none">
                Register number
              </label>
              <div className="field-shell w-full">
                <FiHash size={15} className="shrink-0" style={{ color: 'var(--theme-text-faint)' }} />
                <input
                  id="hostel-regNo"
                  type="text"
                  placeholder="e.g. 830122104001"
                  value={regNo}
                  onChange={handleRegNoChange}
                  onKeyDown={handleAlphaNumKey}
                  required
                  autoComplete="username"
                  className="h-8 w-full min-w-0 flex-1 bg-transparent text-[13px] font-medium text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-faint)] focus:outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="hostel-password" className="field-label select-none">
                Password
              </label>
              <PasswordInput
                id="hostel-password"
                placeholder="Hostel account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Error Banner */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                role="alert"
                className="flex items-start gap-2.5 rounded-[var(--radius-md)] px-3 py-2.5"
                style={{
                  background: 'var(--color-danger-soft)',
                  border: '1px solid var(--color-danger-border)'
                }}
              >
                <FiAlertCircle size={15} className="mt-0.5 shrink-0" style={{ color: 'var(--color-danger)' }} />
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold" style={{ color: 'var(--color-danger)' }}>
                    Verification failed
                  </p>
                  <p className="mt-0.5 whitespace-pre-line text-[11.5px] leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
                    {error}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Submit Button */}
            <button type="submit" disabled={loading} className="btn btn-primary h-10 w-full text-[13px]">
              {loading ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Verifying…
                </>
              ) : (
                <>
                  Verify and continue
                  <FiArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div
            className="mt-5 pt-4 text-center"
            style={{ borderTop: '1px solid var(--theme-border)' }}
          >
            <p className="text-[12.5px] text-[var(--theme-text-secondary)]">
              Already registered?{' '}
              <button
                type="button"
                onClick={() => navigate("/student-login")}
                className="font-semibold transition-colors hover:underline"
                style={{ color: 'var(--color-accent)' }}
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </AuthShell>
  )
}

export default HostelVerification
