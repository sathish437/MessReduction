import React, { useState, useEffect } from "react"
import { useTheme } from './context/ThemeContext';
import { motion } from "framer-motion"
import { FiSun, FiMoon, FiHash, FiArrowRight, FiArrowLeft, FiShield } from "react-icons/fi"
import apiClient from "./api/apiClient"
import image from "./assets/1000088399.png"
import PasswordInput from "./PasswordInput"
import { getHostelVerificationEnabled } from "./services/authService"

function HostelVerification({ onNavigate }) {
  const { isDark, toggleTheme } = useTheme();
  const [rollNo, setRollNo] = useState("")
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

  const handleRollNoChange = (e) => {
    setRollNo(e.target.value.toUpperCase())
  }

  const handleAlphaNumKey = (e) => {
    if (!/[a-zA-Z0-9]/.test(e.key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) {
      e.preventDefault()
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setError("")

    if (!rollNo.trim() || !password) {
      setError("Invalid Roll Number or Password.\n\nPlease use your official College Hostel credentials.")
      return
    }

    setLoading(true)

    try {
      const response = await apiClient.post("/api/auth/verify-hostel", {
        rollNo: rollNo.trim(),
        password: password
      })

      console.log("Hostel API Response:", response.data);
      console.log("Type:", typeof response.data);
      const isVerifiedSuccess = response.data === true || response.data?.verified === true;
      console.log("Should Navigate:", isVerifiedSuccess);

      if (response.status === 200 && isVerifiedSuccess) {
        // Save temporary session flags
        sessionStorage.setItem("hostelVerified", "true")
        sessionStorage.setItem("verifiedStudentData", JSON.stringify(response.data))
        
        // Navigate ONLY when verification succeeded
        navigate("/register")
      } else {
        setError(response.data?.message || "Invalid Roll Number or Password.\n\nPlease use your official College Hostel credentials.")
      }
    } catch (err) {
      console.error("Hostel Verification Error:", err)
      const serverMsg = err.response?.data?.message
      if (err.response?.status === 401 || err.response?.status === 400) {
        setError(serverMsg || "Invalid Roll Number or Password.\n\nPlease use your official College Hostel credentials.")
      } else {
        setError(serverMsg || "Unable to connect to the College Hostel Verification Server.\n\nPlease try again later.")
      }
    } finally {
      setLoading(false)
    }
  }

  if (checkingFlag) {
    return null
  }

  return (
    <div className="min-h-screen w-full flex flex-col font-sans bg-[var(--color-primary-bg)] text-[var(--color-text-primary)] selection:bg-teal-500/30 relative overflow-hidden" style={{ fontFamily: "'Inter', 'Poppins', 'Source Sans Pro', 'Segoe UI', sans-serif" }}>
                  
      {/* Header */}
            <header className="w-full flex items-center justify-between px-4 sm:px-8 py-5 border-b border-[var(--color-border)] bg-[var(--color-header)] text-white sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-4">
          <img src={image} alt="GCES Logo" className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-md" />
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] sm:text-xs font-bold tracking-widest text-white/80 uppercase mb-0.5">Government College of Engineering</span>
            <span className="text-lg sm:text-2xl font-bold tracking-tight">SRIRANGAM</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="text-white/80 hover:text-white p-2.5 bg-white/10 hover:bg-white/20 rounded-[10px] border border-[var(--color-border)] shadow-sm transition-all cursor-pointer">
              {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
          </button>
          <button onClick={() => navigate('/')} className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-white/90 hover:text-white font-semibold bg-white/10 hover:bg-white/20 transition-all text-sm cursor-pointer border border-[var(--color-border)] shadow-sm"><FiArrowLeft size={16} /> Back</button>
        </div>
      </header>
      

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 z-10">
        <div className="w-full max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]  shadow-2xl overflow-hidden relative p-6 sm:p-10 group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="relative z-10">
              
              {/* Header Icon & Titles */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-[var(--color-btn-primary)]/10 text-[var(--color-btn-primary)] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-teal-500/20 shadow-inner">
                  <FiShield size={32} />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">
                  College Hostel Verification
                </h1>
                <p className="text-sm sm:text-base text-[var(--color-text-primary)]/60 mt-2 font-medium">
                  Verify your Hostel Account before creating a Mess Reduction account.
                </p>
              </div>

              <form onSubmit={handleVerify} className="flex flex-col gap-5">
                {/* Roll Number Field */}
                <div className="flex flex-col gap-2 w-full text-left">
                  <label htmlFor="hostel-rollNo" className="text-sm font-semibold tracking-wide text-[var(--color-text-primary)]/80 select-none">
                    Roll Number
                  </label>
                  <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-primary-bg)] px-4 py-3.5 focus-within:border-[var(--color-btn-primary)] focus-within:bg-[var(--color-btn-primary)]/5 transition-all duration-300">
                    <FiHash className="text-[var(--color-text-secondary)] text-lg shrink-0" />
                    <input
                      id="hostel-rollNo"
                      type="text"
                      placeholder="e.g. 22CSE01"
                      value={rollNo}
                      onChange={handleRollNoChange}
                      onKeyDown={handleAlphaNumKey}
                      required
                      className="flex-1 min-w-0 bg-transparent focus:outline-none text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] font-medium uppercase"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="flex flex-col gap-2 w-full text-left">
                  <label htmlFor="hostel-password" className="text-sm font-semibold tracking-wide text-[var(--color-text-primary)]/80 select-none">
                    Password
                  </label>
                  <PasswordInput
                    id="hostel-password"
                    placeholder="Enter your hostel account password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {/* Error Banner */}
                {error && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3.5 shadow-sm text-center">
                      {error.includes("Hostel App credentials") || error.includes("incorrect") ? (
                        <>
                          <div className="font-bold text-base text-rose-300 mb-1">Invalid Credentials</div>
                          <div className="font-medium text-xs text-rose-400/90 leading-relaxed">{error}</div>
                        </>
                      ) : (
                        <div className="font-semibold text-xs leading-relaxed">{error}</div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Submit Button */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`mt-4 flex items-center justify-center gap-3 w-full rounded-xl py-4 text-base font-bold text-white bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] hover:bg-right shadow-sm hover:shadow-md transition-all duration-500 tracking-wide group cursor-pointer ${
                      loading ? "opacity-50 cursor-not-allowed shadow-none" : ""
                    }`}
                  >
                    {loading ? "VERIFYING CREDENTIALS..." : (
                      <span className="flex items-center justify-center gap-2">
                        Verify & Continue
                        <FiArrowRight className="text-lg transition-transform duration-300 group-hover:translate-x-1" />
                      </span>
                    )}
                  </button>
                </motion.div>
              </form>

              {/* Login Link */}
              <div className="mt-8 pt-6 border-t border-[var(--color-border)] text-center">
                <p className="text-sm text-[var(--color-text-secondary)] font-medium">
                  Already registered?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/student-login")}
                    className="text-[var(--color-btn-primary)] font-bold hover:text-[var(--color-btn-primary-hover)] transition-colors cursor-pointer ml-1"
                  >
                    Sign in to your account
                  </button>
                </p>
              </div>

            </div>
          </motion.div>
        </div>
      </main>

      <footer className="pb-8 text-center mt-auto z-10">
        <p className="text-xs text-[var(--color-text-secondary)]/50 tracking-widest uppercase font-bold">© 2025 GCES · Hostel Verification</p>
      </footer>
    </div>
  )
}

export default HostelVerification
