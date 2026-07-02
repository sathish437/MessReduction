import React, { useState } from "react"
import { motion } from "framer-motion"
import { FiUser, FiLock, FiArrowRight, FiShield, FiArrowLeft } from "react-icons/fi"
import apiClient from "./api/apiClient"
import { setStaffAuth, getStaffDashboardRoute } from "./services/authService"
import image from "./assets/1000088399.png"
import PasswordInput from "./PasswordInput"

const TITLE = "STAFF LOGIN"

const getInitial = () => {
  const sides = ['top', 'bottom', 'left', 'right']
  const side = sides[Math.floor(Math.random() * sides.length)]
  const d = 250, v = Math.floor(Math.random() * 60) - 30
  const r = Math.floor(Math.random() * 240) - 120
  const pos = { top: [v, -d], bottom: [v, d], left: [-d, v], right: [d, v] }[side]
  return { x: pos[0], y: pos[1], rotate: r, opacity: 0, scale: 0.5 }
}

function Field({ icon, error, ...props }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 sm:py-4 transition-all bg-[#0a1628] w-full ${error ? 'border-rose-500/50 bg-rose-500/5 focus-within:border-rose-400' : 'border-white/10 input-focus'}`}>
      <span className={`shrink-0 ${error ? 'text-rose-400' : 'text-amber-400/60'}`}>{icon}</span>
      <input className="flex-1 bg-transparent focus:outline-none text-base sm:text-lg text-white placeholder:text-white/25 font-medium w-full" {...props} />
    </div>
  )
}

function StaffLogin({ onNavigate }) {
  const [userName, setUserName] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const getUsernameOptions = () => {
    if (role === "Office") return ["office"];
    if (role === "Warden") return ["warden", "warden1", "warden2", "warden3", "warden4"];
    if (role === "DeputyWarden") return Array.from({ length: 8 }, (_, i) => `deputyWarden${i + 1}`);
    return [];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!role) {
      setError("Please select a role");
      setLoading(false);
      return;
    }

    try {
      // Call staff login API
      const requestBody = {
        userName: userName,
        password: password,
        role: role
      };

      const response = await apiClient.post('/api/staff/login', requestBody);
      const data = response.data;

      // Store auth data
      if (data.token) {
        // Save auth to cookies
        setStaffAuth(data.token, data.username, data.role);

        // Determine and navigate to correct dashboard
        const redirectRoute = getStaffDashboardRoute(data.role, data.username);

        if (redirectRoute && onNavigate) {
          onNavigate(redirectRoute);
        } else {
          setError(`Unknown role/username combination. Please contact administrator.`);
          setLoading(false);
        }
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Staff login error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Login failed. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
        <div className="min-h-screen w-full flex flex-col font-sans bg-[#0a1628] text-white">
            <div className="fixed inset-0 bg-[#0a1628] -z-10" />

            <header className="w-full flex items-center justify-between gap-3 px-4 py-4 border-b border-white/5 bg-[#0a1628]/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <img src={image} alt="GCES Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
                    <div className="flex flex-col leading-tight">
                        <span className="text-xs font-medium tracking-wider text-teal-400/80 uppercase">Government College of Engineering</span>
                        <span className="text-base sm:text-lg font-bold text-white tracking-wide">Srirangam</span>
                    </div>
                </div>
                <button
                    onClick={() => window.location.href = '/'}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-amber-500/50 transition-all text-sm font-bold"
                >
                    <FiArrowLeft size={16} /> Back
                </button>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
                <div className="w-full max-w-[420px]">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full rounded-2xl border border-white/10 bg-[#0f1f38] shadow-soft overflow-hidden"
                    >
                        <div className="h-[1px] bg-amber-500/30" />
                        <div className="p-8">
                            <div className="mb-6 sm:mb-8">
                                <p className="text-xs font-semibold tracking-wider text-amber-400/80 uppercase mb-1.5">Restricted Access</p>
                                <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Staff Login</h2>
                                <p className="text-sm sm:text-base text-white/40 mt-1">Sign in with your staff credentials</p>
                            </div>

                            <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5">
                                <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 sm:py-4 transition-all bg-[#0a1628] w-full ${error && !role ? 'border-rose-500/50 bg-rose-500/5 focus-within:border-rose-400' : 'border-white/10 input-focus'}`}>
                                    <span className={error && !role ? "text-rose-400" : "text-amber-400/60"}><FiShield size={18} /></span>
                                    <select
                                        value={role}
                                        onChange={(e) => { setRole(e.target.value); setUserName(""); }}
                                        required
                                        className="flex-1 bg-transparent focus:outline-none text-base sm:text-lg text-white appearance-none cursor-pointer w-full"
                                    >
                                        <option value="" disabled className="bg-[#0f1f38]">Select Role</option>
                                        <option value="Warden" className="bg-[#0f1f38]">Warden</option>
                                        <option value="DeputyWarden" className="bg-[#0f1f38]">Deputy Warden</option>
                                        <option value="Office" className="bg-[#0f1f38]">Hostel Office</option>
                                    </select>
                                </div>

                                <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 sm:py-4 transition-all bg-[#0a1628] w-full ${error && !userName ? 'border-rose-500/50 bg-rose-500/5 focus-within:border-rose-400' : 'border-white/10 input-focus'}`}>
                                    <span className={error && !userName ? "text-rose-400" : "text-amber-400/60"}><FiUser size={18} /></span>
                                    <select
                                        value={userName}
                                        onChange={(e) => setUserName(e.target.value)}
                                        required
                                        disabled={!role}
                                        className="flex-1 bg-transparent focus:outline-none text-base sm:text-lg text-white appearance-none cursor-pointer w-full disabled:opacity-50"
                                    >
                                        <option value="" disabled className="bg-[#0f1f38]">
                                            {!role ? "Select Role First" : "Select Username"}
                                        </option>
                                        {getUsernameOptions().map((opt) => (
                                            <option key={opt} value={opt} className="bg-[#0f1f38]">
                                                {opt}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} required error={!!error} />

                                {error && <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2 font-medium">{error}</p>}

                                <motion.button
                                    whileHover={{ scale: 1.005 }}
                                    whileTap={{ scale: 0.995 }}
                                    type="submit"
                                    disabled={loading}
                                    className={`mt-4 flex items-center justify-center gap-3 w-full rounded-xl py-3 sm:py-4 text-base sm:text-lg font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 transition-colors shadow-soft tracking-wider ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
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
                        </div>
                    </motion.div>
                </div>
            </main>

            <footer className="pb-8 text-center">
                <p className="text-xs text-white/10 tracking-widest uppercase font-bold">© 2025 GCES · Staff Portal · Authorized Only</p>
            </footer>
        </div>
    )
}

export default StaffLogin
