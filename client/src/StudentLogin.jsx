import React, { useState } from "react"
import { motion } from "framer-motion"
import { FiUser, FiArrowRight } from "react-icons/fi"
import apiClient from "./api/apiClient"
import image from "./assets/1000088399.png"
import DobInputComponent from "./DobInputComponent"
import { setStudentAuth } from "./services/authService"

const TITLE = "STUDENT LOGIN"

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
    <div className="min-h-screen w-full flex flex-col font-sans bg-[#0a1628] text-white selection:bg-teal-500/30 relative overflow-hidden">
      <div className="fixed inset-0 bg-[#0a1628] -z-20" />
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-teal-600/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      
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
      </header>
      <div className="h-[2px] bg-gradient-to-r from-transparent via-teal-500/50 to-transparent shrink-0" />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 z-10">
        <div className="w-full max-w-[420px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-8 shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="relative z-10">
              <div className="mb-8">
                <p className="text-xs font-semibold tracking-[0.2em] text-teal-400/80 uppercase mb-2">Student Portal</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{TITLE}</h2>
                <p className="text-sm sm:text-[15px] text-white/50 mt-2 font-medium">Sign in with your student credentials</p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="flex flex-col gap-1.5 w-full text-left">
                  <label htmlFor="identifier-input" className="text-sm font-semibold tracking-wide text-white/80 select-none">
                    Register Number / Roll Number
                  </label>
                  <div className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-all duration-300 relative group bg-black/20 ${error ? 'border-rose-500/50 bg-rose-500/5 focus-within:border-rose-400' : 'border-white/8 focus-within:border-teal-500/60 focus-within:bg-teal-950/10 focus-within:shadow-[0_0_15px_rgba(20,184,166,0.1)]'}`}>
                    <span className={`shrink-0 text-base transition-colors ${error ? 'text-rose-400' : 'text-teal-400/60 group-focus-within:text-teal-400'}`}><FiUser size={18} /></span>
                    <input
                      id="identifier-input"
                      type="text"
                      placeholder="Enter your Register Number or Roll Number"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value.toUpperCase())}
                      required
                      className="flex-1 bg-transparent focus:outline-none text-base text-white placeholder:text-white/40 font-medium w-full appearance-none"
                    />
                  </div>
                </div>

                <DobInputComponent
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  error={!!error}
                />

                {error && <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 font-semibold">{error}</p>}

                <motion.button
                  whileHover={loading ? {} : { scale: 1.01, y: -1 }}
                  whileTap={loading ? {} : { scale: 0.99 }}
                  type="submit"
                  disabled={loading}
                  className={`mt-4 flex-1 flex items-center justify-center gap-3 w-full rounded-xl py-4 text-base font-semibold text-slate-900 bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-400 bg-[length:200%_auto] hover:bg-right shadow-[0_0_20px_rgba(45,212,191,0.2)] hover:shadow-[0_0_30px_rgba(45,212,191,0.4)] transition-all duration-500 tracking-wide ${loading ? "opacity-50 cursor-not-allowed shadow-none hover:shadow-none hover:bg-left" : ""}`}
                >
                  {loading ? "AUTHENTICATING..." : (
                    <>SIGN IN <FiArrowRight size={18} /></>
                  )}
                </motion.button>
              </form>

              <p className="text-center text-sm mt-6 text-white/50 font-medium relative z-10">
                New student?{" "}
                <button
                  onClick={() => window.location.href = '/register'}
                  className="text-teal-400 font-bold hover:text-teal-300 transition-colors"
                  type="button"
                >
                  Register here
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="pb-8 text-center mt-auto z-10">
        <p className="text-xs text-white/15 tracking-widest uppercase font-bold">© 2025 GCES · Student Portal</p>
      </footer>
    </div>
  )
}

export default StudentLogin
