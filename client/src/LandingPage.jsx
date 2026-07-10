import React from "react"
import { motion } from "framer-motion"
import { FiUser, FiShield, FiArrowRight } from "react-icons/fi"
import image from "./assets/1000088399.png"

function LandingPage({ onNavigate }) {
  const navigate = (path) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.href = path;
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col font-sans bg-[#0a1628] text-white">
      <div className="fixed inset-0 bg-[#0a1628] -z-10" />

      <header className="w-full flex items-center justify-center gap-3 px-4 py-6 border-b border-white/5 bg-[#0a1628]/80 backdrop-blur-sm">
        <img src={image} alt="GCES Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
        <div className="flex flex-col leading-tight">
          <span className="text-xs sm:text-sm font-semibold tracking-[0.25em] text-teal-400/80 uppercase">Government College of Engineering</span>
          <span className="text-xl sm:text-2xl font-bold text-white tracking-widest">SRIRANGAM</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight mb-4">
            Mess Reduction Portal
          </h1>
          <p className="text-lg sm:text-xl text-white/40 max-w-2xl mx-auto">
            Hostel mess billing system for Government College of Engineering, Srirangam
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          {/* Student Login Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="rounded-3xl border border-white/8 bg-[#0f1f38] shadow-soft overflow-hidden hover:shadow-glow transition-shadow duration-300"
          >
            <div className="h-[2px] bg-gradient-to-r from-transparent via-teal-400/70 to-transparent" />
            <div className="p-8 sm:p-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-teal-500/10 flex items-center justify-center">
                  <FiUser size={28} className="text-teal-400" />
                </div>
                <div>
                  <p className="text-xs font-black tracking-[0.2em] text-teal-400/70 uppercase">Students</p>
                  <h2 className="text-2xl font-black text-white">Student Login</h2>
                </div>
              </div>

              <p className="text-white/40 mb-8">
                Login with your Register Number or Roll Number and Date of Birth to access your mess reduction dashboard.
              </p>

              <button
                onClick={() => navigate('/student-login')}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-xl text-lg font-black text-slate-900 bg-gradient-to-r from-teal-400 to-emerald-400 hover:brightness-110 shadow-lg shadow-teal-900/30 transition-all tracking-widest"
              >
                Student Login <FiArrowRight size={20} />
              </button>

              <p className="text-center text-sm mt-4 text-white/30">
                New here?{" "}
                <button
                  onClick={() => navigate('/register')}
                  className="text-teal-400 font-bold hover:text-teal-300 transition-colors"
                >
                  Create Account
                </button>
              </p>
            </div>
          </motion.div>

          {/* Staff Login Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="rounded-3xl border border-white/8 bg-[#0f1f38] shadow-soft overflow-hidden hover:shadow-glow transition-shadow duration-300"
          >
            <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
            <div className="p-8 sm:p-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                  <FiShield size={28} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-black tracking-[0.2em] text-amber-400/70 uppercase">Authorized Access</p>
                  <h2 className="text-2xl font-black text-white">Staff Login</h2>
                </div>
              </div>

              <p className="text-white/40 mb-8">
                For Hostel Wardens, Deputy Wardens, and Office staff. Login with your staff credentials.
              </p>

              <button
                onClick={() => navigate('/staff-login')}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-xl text-lg font-black text-slate-900 bg-gradient-to-r from-amber-400 to-yellow-400 hover:brightness-110 shadow-lg shadow-amber-900/30 transition-all tracking-widest"
              >
                Staff Login <FiArrowRight size={20} />
              </button>

              <p className="text-center text-sm mt-4 text-white/30">
                Restricted to authorized personnel only
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="py-8 text-center border-t border-white/5">
        <p className="text-xs text-white/20 tracking-widest uppercase font-bold">
          © 2025 GCES · Mess Reduction Portal · Government College of Engineering, Srirangam
        </p>
      </footer>
    </div>
  )
}

export default LandingPage
