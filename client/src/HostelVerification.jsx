import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { FiHash, FiArrowRight, FiArrowLeft, FiShield } from "react-icons/fi"
import apiClient from "./api/apiClient"
import image from "./assets/1000088399.png"
import PasswordInput from "./PasswordInput"
import { getHostelVerificationEnabled } from "./services/authService"

function HostelVerification({ onNavigate }) {
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
      setError("Invalid Roll Number or Password.")
      return
    }

    setLoading(true)

    try {
      const response = await apiClient.post("/api/auth/verify-hostel", {
        rollNo: rollNo.trim(),
        password: password
      })

      if (response.status === 200 && response.data?.verified) {
        // Save temporary session flags
        sessionStorage.setItem("hostelVerified", "true")
        sessionStorage.setItem("verifiedStudentData", JSON.stringify(response.data))
        
        // Navigate to registration page
        navigate("/register")
      } else {
        setError("Invalid Roll Number or Password.")
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 400) {
        setError("Invalid Roll Number or Password.")
      } else {
        setError("Unable to verify your hostel account. Please try again later.")
      }
    } finally {
      setLoading(false)
    }
  }

  if (checkingFlag) {
    return null
  }

  return (
    <div className="min-h-screen w-full flex flex-col font-sans bg-[#0a1628] text-white selection:bg-teal-500/30 relative overflow-hidden" style={{ fontFamily: "'Inter', 'Poppins', 'Source Sans Pro', 'Segoe UI', sans-serif" }}>
      <div className="fixed inset-0 bg-[#0a1628] -z-20" />
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-teal-600/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

      {/* Header */}
      <header className="w-full flex items-center justify-between gap-4 px-4 sm:px-8 py-4 border-b border-white/5 bg-[#0a1628]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img src={image} alt="GCES Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
          <div className="flex flex-col leading-tight">
            <span className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-teal-400/80 uppercase">
              Government College of Engineering
            </span>
            <span className="text-xl sm:text-2xl font-bold text-white tracking-widest">
              SRIRANGAM
            </span>
          </div>
        </div>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold hover:bg-white/5 transition-all text-sm cursor-pointer border border-transparent hover:border-white/10"
        >
          <FiArrowLeft size={16} /> Back
        </button>
      </header>
      <div className="h-[2px] bg-gradient-to-r from-transparent via-teal-500/50 to-transparent shrink-0" />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 z-10">
        <div className="w-full max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-2xl overflow-hidden relative p-6 sm:p-10 group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="relative z-10">
              
              {/* Header Icon & Titles */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-teal-500/10 text-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-teal-500/20 shadow-inner">
                  <FiShield size={32} />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  College Hostel Verification
                </h1>
                <p className="text-sm sm:text-base text-white/60 mt-2 font-medium">
                  Verify your Hostel Account before creating a Mess Reduction account.
                </p>
              </div>

              <form onSubmit={handleVerify} className="flex flex-col gap-5">
                {/* Roll Number Field */}
                <div className="flex flex-col gap-2 w-full text-left">
                  <label htmlFor="hostel-rollNo" className="text-sm font-semibold tracking-wide text-white/80 select-none">
                    Roll Number
                  </label>
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 focus-within:border-teal-500/60 focus-within:bg-teal-950/10 transition-all duration-300">
                    <FiHash className="text-teal-400/60 text-lg shrink-0" />
                    <input
                      id="hostel-rollNo"
                      type="text"
                      placeholder="e.g. 22CSE01"
                      value={rollNo}
                      onChange={handleRollNoChange}
                      onKeyDown={handleAlphaNumKey}
                      required
                      className="flex-1 min-w-0 bg-transparent focus:outline-none text-base text-white placeholder:text-white/40 font-medium uppercase"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="flex flex-col gap-2 w-full text-left">
                  <label htmlFor="hostel-password" className="text-sm font-semibold tracking-wide text-white/80 select-none">
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
                    <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 font-semibold text-center shadow-sm">
                      {error}
                    </p>
                  </motion.div>
                )}

                {/* Submit Button */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`mt-4 flex items-center justify-center gap-3 w-full rounded-xl py-4 text-base font-bold text-slate-900 bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-400 bg-[length:200%_auto] hover:bg-right shadow-[0_0_20px_rgba(45,212,191,0.2)] hover:shadow-[0_0_30px_rgba(45,212,191,0.4)] transition-all duration-500 tracking-wide group cursor-pointer ${
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
              <div className="mt-8 pt-6 border-t border-white/10 text-center">
                <p className="text-sm text-white/50 font-medium">
                  Already registered?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/student-login")}
                    className="text-teal-400 font-bold hover:text-teal-300 transition-colors cursor-pointer ml-1"
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
        <p className="text-xs text-white/20 tracking-widest uppercase font-bold">© 2025 GCES · Hostel Verification</p>
      </footer>
    </div>
  )
}

export default HostelVerification
