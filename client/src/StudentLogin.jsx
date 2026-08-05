import React, { useState } from "react"
import { useTheme } from './context/ThemeContext';
import { motion } from "framer-motion"
import { FiSun, FiMoon, FiUser, FiArrowRight } from "react-icons/fi"
import apiClient from "./api/apiClient"
import image from "./assets/1000088399.png"
import DobInputComponent from "./DobInputComponent"
import { setStudentAuth } from "./services/authService"

const TITLE = "STUDENT LOGIN"

function StudentLogin({ onNavigate }) {
  const { isDark, toggleTheme } = useTheme();
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
    <div className="min-h-screen w-full flex flex-col font-sans bg-[var(--color-primary-bg)] text-[var(--color-text-primary)] selection:bg-teal-500/30 relative overflow-hidden">
                        
      <header className="w-full flex items-center justify-between px-3.5 sm:px-8 py-3.5 sm:py-5 border-b border-[var(--color-border)] bg-[var(--color-header)] text-[var(--color-text-primary)] sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-3 sm:gap-4">
          <img src={image} alt="GCES Logo" className="w-10 h-10 sm:w-16 sm:h-16 object-contain drop-shadow-md" />
          <div className="flex flex-col leading-tight">
            <span className="text-[9px] sm:text-xs font-bold tracking-widest text-[var(--color-text-primary)] uppercase mb-0.5">Government College of Engineering</span>
            <span className="text-base sm:text-2xl font-bold tracking-tight">SRIRANGAM</span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={toggleTheme} className="text-[var(--color-text-primary)] hover:text-[var(--color-text-primary)] p-2 sm:p-2.5 bg-white/10 hover:bg-white/20 rounded-[10px] border border-[var(--color-border)] shadow-sm transition-all cursor-pointer">
              {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
          </button>
        </div>
      </header>
      

      <main className="flex-1 flex flex-col items-center justify-center px-3 sm:px-4 py-6 sm:py-12 z-10">
        <div className="w-full max-w-[420px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-2xl sm:rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-8 shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="relative z-10">
              <div className="mb-5 sm:mb-8">
                <p className="text-[10px] sm:text-xs font-semibold tracking-[0.2em] text-[var(--color-btn-primary)] uppercase mb-1 sm:mb-2">Mess Reduction Request Form</p>
                <h2 className="text-xl sm:text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">{TITLE}</h2>
                <p className="text-xs sm:text-[15px] text-[var(--color-text-secondary)] mt-1 sm:mt-2 font-medium">Sign in with your student credentials</p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-6">
                <div className="flex flex-col gap-1 sm:gap-1.5 w-full text-left">
                  <label htmlFor="identifier-input" className="text-xs sm:text-sm font-semibold tracking-wide text-[var(--color-text-primary)] select-none">
                    Register Number / Roll Number
                  </label>
                  <div className={`flex items-center gap-2.5 sm:gap-3 rounded-xl border px-3 sm:px-4 py-2.5 sm:py-3.5 transition-all duration-300 relative group bg-[var(--color-surface)] ${error ? 'border-rose-500/50 bg-rose-500/5 focus-within:border-rose-400' : 'border-[var(--color-border)] focus-within:border-[var(--color-btn-primary)]'}`}>
                    <span className={`shrink-0 text-sm sm:text-base transition-colors ${error ? 'text-rose-400' : 'text-[var(--color-text-secondary)] group-focus-within:text-[var(--color-btn-primary)]'}`}><FiUser size={16} /></span>
                    <input
                      id="identifier-input"
                      type="text"
                      placeholder="Enter your Register Number or Roll Number"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value.toUpperCase())}
                      required
                      className="flex-1 bg-transparent focus:outline-none text-sm sm:text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] font-medium w-full appearance-none"
                    />
                  </div>
                </div>

                <DobInputComponent
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  error={!!error}
                />

                {error && <p className="text-xs sm:text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 font-semibold">{error}</p>}

                <motion.button
                  whileHover={loading ? {} : { scale: 1.01, y: -1 }}
                  whileTap={loading ? {} : { scale: 0.99 }}
                  type="submit"
                  disabled={loading}
                  className={`mt-2 sm:mt-4 flex-1 flex items-center justify-center gap-2 sm:gap-3 w-full rounded-xl py-3 sm:py-4 text-sm sm:text-base font-semibold text-[var(--color-text-primary)] bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] hover:bg-right shadow-sm hover:shadow-md transition-all duration-500 tracking-wide ${loading ? "opacity-50 cursor-not-allowed shadow-none hover:shadow-none hover:bg-left" : ""}`}
                >
                  {loading ? "AUTHENTICATING..." : (
                    <>SIGN IN <FiArrowRight size={16} /></>
                  )}
                </motion.button>
              </form>

              <p className="text-center text-xs sm:text-sm mt-4 sm:mt-6 text-[var(--color-text-secondary)] font-medium relative z-10">
                New student?{" "}
                <button
                  onClick={() => onNavigate ? onNavigate('/hostel-verification') : window.location.href = '/hostel-verification'}
                  className="text-[var(--color-btn-primary)] font-bold hover:text-[var(--color-btn-primary-hover)] transition-colors"
                  type="button"
                >
                  Register here
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="pb-6 sm:pb-8 text-center mt-auto z-10">
        <p className="text-[10px] sm:text-xs text-[var(--color-text-secondary)]/40 tracking-widest uppercase font-bold">© 2025 GCES · Mess Reduction Request Form</p>
      </footer>
    </div>
  )
}

export default StudentLogin
