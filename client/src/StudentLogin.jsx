import React, { useState } from "react"
import { motion } from "framer-motion"
import { FiMail, FiCalendar, FiArrowRight, FiArrowLeft } from "react-icons/fi"
import apiClient from "./api/apiClient"
import image from "./assets/1000088399.png"
import DobInputComponent from "./DobInputComponent"

const TITLE = "STUDENT LOGIN"

function StudentLogin({ onNavigate }) {
  const [email, setEmail] = useState("")
  const [dob, setDob] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!email || !dob) {
      setError("Please fill both email and date of birth")
      setLoading(false)
      return
    }

    try {
      const requestBody = {
        emailId: email,
        dob: dob
      }

      const response = await apiClient.post('/api/auth/login', requestBody)
      const data = response.data

      if (data.token) {
        sessionStorage.setItem('token', data.token)
        const userData = {
          name: data.name,
          studentId: data.studentId,
          email: email,
          token: data.token
        }
        sessionStorage.setItem('currentUser', JSON.stringify(userData))
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
            className="w-full rounded-2xl border border-white/8 bg-[#0f1f38] shadow-2xl overflow-hidden"
          >
            <div className="h-[2px] bg-gradient-to-r from-transparent via-teal-400/70 to-transparent" />
            <div className="p-8">
              <div className="mb-8">
                <p className="text-xs font-black tracking-[0.3em] text-teal-400/70 uppercase mb-2">Student Portal</p>
                <h2 className="text-4xl font-black text-white tracking-tight">STUDENT LOGIN</h2>
                <p className="text-base text-white/30 mt-2">Sign in with your student credentials</p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/4 px-4 py-3.5 focus-within:border-teal-500/60 focus-within:bg-teal-950/20 transition-all">
                  <span className="text-teal-400/60"><FiMail size={18} /></span>
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 bg-transparent focus:outline-none text-base text-white placeholder:text-white/25"
                  />
                </div>

                <DobInputComponent
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />

                {error && <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2 font-medium">{error}</p>}

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={loading}
                  className={`mt-4 flex items-center justify-center gap-3 w-full rounded-xl py-4 text-lg font-black text-slate-900 bg-gradient-to-r from-teal-400 to-emerald-400 hover:brightness-110 shadow-lg shadow-teal-900/30 transition-all tracking-widest ${loading ? "opacity-50" : ""}`}
                >
                  {loading ? "AUTHENTICATING..." : "SIGN IN"} <FiArrowRight size={18} />
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
