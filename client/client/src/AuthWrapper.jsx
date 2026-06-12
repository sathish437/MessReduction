import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Login from "./Login"
import Register from "./Register"
import image from "./assets/1000088399.png"

function AuthWrapper({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="min-h-[100dvh] w-full flex flex-col font-sans selection:bg-teal-500/30 relative">

      {/* Full-page background */}
      <div className="fixed inset-0 bg-[#0a1628] -z-10" />

      {/* ── Header ── */}
      
      <header className="w-full flex items-center justify-center gap-4 px-4 sm:px-6 py-4 sm:py-6 border-b border-white/5 bg-[#0a1628]/80 backdrop-blur-md shrink-0">
        <img src={image} alt="GCES Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
        <div className="flex flex-col leading-tight">
          <span className="text-xs sm:text-sm font-semibold tracking-[0.25em] text-teal-400/80 uppercase">
            Government College of Engineering
          </span>
          <span className="text-xl sm:text-2xl font-black text-white tracking-widest">
            SRIRANGAM
          </span>
        </div>
      </header>

      {/* ── Static accent line ── */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-teal-500/50 to-transparent shrink-0" />

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col items-center justify-start sm:justify-center px-4 py-4 sm:py-8">
        <div style={{ perspective: "1200px" }} className="w-full max-w-[400px] md:max-w-[480px] lg:max-w-[520px] my-auto sm:my-0">
          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, rotateY: -70, scale: 0.95 }}
                animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                exit={{ opacity: 0, rotateY: 70, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                style={{ transformStyle: "preserve-3d" }}
                className="w-full"
              >
                <div className="w-full rounded-2xl border border-white/8 bg-[#0f1f38] shadow-xl overflow-hidden">
                  <div className="h-[2px] bg-gradient-to-r from-transparent via-teal-400/70 to-transparent" />
                  <div className="p-6 sm:p-8">
                    <Login 
                      goToRegister={() => setIsLogin(false)} 
                      onLoginSuccess={onLoginSuccess}
                    />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="register"
                initial={{ opacity: 0, rotateY: 70, scale: 0.95 }}
                animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                exit={{ opacity: 0, rotateY: -70, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                style={{ transformStyle: "preserve-3d" }}
                className="w-full"
              >
                <div className="w-full rounded-2xl border border-white/8 bg-[#0f1f38] shadow-xl overflow-hidden">
                  <div className="h-[1px] bg-gradient-to-r from-transparent via-teal-400/70 to-transparent" />
                  <div className="p-5 sm:p-7">
                    <Register goToLogin={() => setIsLogin(true)} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="shrink-0 pb-6 text-center">
        <p className="text-xs text-white/20 tracking-widest uppercase font-black">
          © 2025 GCES · Mess Reduction Portal
        </p>
      </footer>
    </div>
  )
}

export default AuthWrapper