import React from "react"
import { useTheme } from './context/ThemeContext';
import { motion } from "framer-motion"
import { FiSun, FiMoon, FiUser, FiShield, FiArrowRight } from "react-icons/fi"
import image from "./assets/1000088399.png"

function LandingPage({ onNavigate }) {
  const { isDark, toggleTheme } = useTheme();
  const navigate = (path) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.href = path;
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col font-sans bg-[var(--color-primary-bg)] text-[var(--color-text-primary)]">
      
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
          
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-[var(--color-text-primary)] tracking-tight mb-4">
            Mess Reduction Portal
          </h1>
          <p className="text-lg sm:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            Hostel mess billing system for Government College of Engineering, Srirangam
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          {/* Student Login Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-soft overflow-hidden hover:shadow-glow transition-shadow duration-300"
          >
            <div className="h-[2px] bg-gradient-to-r from-transparent via-teal-400/70 to-transparent" />
            <div className="p-8 sm:p-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-[var(--color-btn-primary)]/10 flex items-center justify-center">
                  <FiUser size={28} className="text-[var(--color-btn-primary)]" />
                </div>
                <div>
                  <p className="text-xs font-black tracking-[0.2em] text-[var(--color-text-secondary)] uppercase">Students</p>
                  <h2 className="text-2xl font-black text-[var(--color-text-primary)]">Student Login</h2>
                </div>
              </div>

              <p className="text-[var(--color-text-secondary)] mb-8">
                Login with your Register Number or Roll Number and Date of Birth to access your mess reduction dashboard.
              </p>

              <button
                onClick={() => navigate('/student-login')}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-xl text-lg font-black text-white bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] shadow-sm hover:shadow-md transition-all tracking-widest"
              >
                Student Login <FiArrowRight size={20} />
              </button>

              <p className="text-center text-sm mt-4 text-[var(--color-text-secondary)]">
                New here?{" "}
                <button
                  onClick={() => navigate('/hostel-verification')}
                  className="text-[var(--color-btn-primary)] font-bold hover:text-[var(--color-btn-primary-hover)] transition-colors"
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
            className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-soft overflow-hidden hover:shadow-glow transition-shadow duration-300"
          >
            <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
            <div className="p-8 sm:p-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-[var(--color-warning)]/10 flex items-center justify-center">
                  <FiShield size={28} className="text-[var(--color-warning)]" />
                </div>
                <div>
                  <p className="text-xs font-black tracking-[0.2em] text-[var(--color-text-secondary)] uppercase">Authorized Access</p>
                  <h2 className="text-2xl font-black text-[var(--color-text-primary)]">Staff Login</h2>
                </div>
              </div>

              <p className="text-[var(--color-text-secondary)] mb-8">
                For Hostel Wardens, Deputy Wardens, and Office staff. Login with your staff credentials.
              </p>

              <button
                onClick={() => navigate('/staff-login')}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-xl text-lg font-black text-white bg-[var(--color-warning)] hover:brightness-95 hover:brightness-110 shadow-sm hover:shadow-md text-[var(--color-text-primary)] transition-all tracking-widest"
              >
                Staff Login <FiArrowRight size={20} />
              </button>

              <p className="text-center text-sm mt-4 text-[var(--color-text-secondary)]">
                Restricted to authorized personnel only
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="py-8 text-center border-t border-[var(--color-border)]">
        <p className="text-xs text-[var(--color-text-secondary)]/50 tracking-widest uppercase font-bold">
          © 2025 GCES · Mess Reduction Portal · Government College of Engineering, Srirangam
        </p>
      </footer>
    </div>
  )
}

export default LandingPage
