import React, { useState } from "react"
import { motion } from "framer-motion"
import { FiUser, FiArrowRight, FiArrowLeft } from "react-icons/fi"
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
      console.error('Student login error:', error)
      const errorMsg = error.response?.data?.message || error.message || 'Login failed. Please try again.'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col font-sans bg-[#0a1628] text-white">
      <div className="fixed inset-0 bg-[#0a1628] -z-10" />

      <header className="w-full flex items-center justify-between gap-3 px-4 py-4 border-b border-white/5 bg-[#0a1628]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img src={image} alt="GCES Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
          <div className="flex flex-col leading-tight">
            <span className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-teal-400/80 uppercase">Government College of Engineering</span>
            <span className="text-lg sm:text-xl font-black text-white tracking-widest">SRIRANGAM</span>
          </div>
        </div>
        <button
          onClick={() => window.location.href = '/'}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-teal-500/50 transition-all text-sm font-bold"
        >
          <FiArrowLeft size={16} /> Back
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-2xl border border-white/8 bg-[#0f1f38] shadow-soft overflow-hidden"
          >
            <div className="h-[2px] bg-gradient-to-r from-transparent via-teal-400/70 to-transparent" />
            <div className="p-8">
              <div className="mb-8">
                <p className="text-xs font-black tracking-[0.3em] text-teal-400/70 uppercase mb-2">Student Portal</p>
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">STUDENT LOGIN</h2>
                <p className="text-sm sm:text-base text-white/30 mt-2">Sign in with your student credentials</p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="flex flex-col gap-1.5 w-full text-left">
                  <label htmlFor="identifier-input" className="text-xs sm:text-sm font-bold tracking-wider text-white/70 select-none uppercase">
                    Register Number / Roll Number
                  </label>
                  <div className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-all bg-[#0a1628] w-full focus-within:border-teal-500/60 focus-within:bg-teal-950/20 focus-within:shadow-[0_0_15px_rgba(20,184,166,0.15)] ${error ? 'border-rose-500/50 bg-rose-500/5 focus-within:border-rose-400' : 'border-white/8'}`}>
                    <span className={`shrink-0 ${error ? 'text-rose-400' : 'text-teal-400/60 group-focus-within:text-teal-400'}`}><FiUser size={18} /></span>
                    <input
                      id="identifier-input"
                      type="text"
                      placeholder="Enter your Register Number or Roll Number"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                      className="flex-1 bg-transparent focus:outline-none text-base sm:text-lg text-white placeholder:text-white/30 font-medium appearance-none w-full"
                    />
                  </div>
                </div>

                <DobInputComponent
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  error={!!error}
                />

                {error && <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2 font-medium">{error}</p>}

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={loading}
                  className={`mt-4 flex items-center justify-center gap-3 w-full rounded-xl py-3 sm:py-4 text-base sm:text-lg font-black text-slate-900 bg-gradient-to-r from-teal-400 to-emerald-400 hover:brightness-110 shadow-soft transition-all tracking-widest ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                      AUTHENTICATING...
                    </>
                  ) : (
                    <>SIGN IN <FiArrowRight size={18} /></>
                  )}
                </motion.button>
              </form>

              <p className="text-center text-sm mt-6 text-white/30">
                New student?{" "}
                <button
                  onClick={() => window.location.href = '/register'}
                  className="text-teal-400 font-black hover:text-teal-300 underline underline-offset-4 transition-colors"
                >
                  Register here
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="pb-8 text-center">
        <p className="text-xs text-white/10 tracking-widest uppercase font-bold">© 2025 GCES · Student Portal</p>
      </footer>
    </div>
  )
}

export default StudentLogin
