import React, { useState } from "react"
import { motion } from "framer-motion"
import { FiUser, FiLock, FiArrowRight, FiShield, FiArrowLeft } from "react-icons/fi"
import apiClient from "./api/apiClient"
import { setStaffAuth, getStaffDashboardRoute } from "./services/authService"
import image from "./assets/1000088399.png"

const TITLE = "STAFF LOGIN"

const getInitial = () => {
  const sides = ['top', 'bottom', 'left', 'right']
  const side = sides[Math.floor(Math.random() * sides.length)]
  const d = 250, v = Math.floor(Math.random() * 60) - 30
  const r = Math.floor(Math.random() * 240) - 120
  const pos = { top: [v, -d], bottom: [v, d], left: [-d, v], right: [d, v] }[side]
  return { x: pos[0], y: pos[1], rotate: r, opacity: 0, scale: 0.5 }
}

function Field({ icon, ...props }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/4 px-4 py-3 focus-within:border-teal-500/60 focus-within:bg-teal-950/20 transition-colors duration-200">
      <span className="text-teal-400/60 shrink-0">{icon}</span>
      <input className="flex-1 bg-transparent focus:outline-none text-base sm:text-lg text-white placeholder:text-white/25 font-medium" {...props} />
    </div>
  )
}

function StaffLogin({ onNavigate }) {
  const [userName, setUserName] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

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
        console.log(`[StaffLogin] Login successful - storing token for ${data.username} with role ${data.role}`);
        setStaffAuth(data.token, data.username, data.role);
        console.log(`[StaffLogin] Token stored in cookie, navigating to dashboard...`);

        // Determine and navigate to correct dashboard
        const redirectRoute = getStaffDashboardRoute(data.role, data.username);
        console.log(`[StaffLogin] Redirect route determined: ${redirectRoute}`);

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
                        <span className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-teal-400/80 uppercase">Government College of Engineering</span>
                        <span className="text-lg sm:text-xl font-black text-white tracking-widest">SRIRANGAM</span>
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
                        className="w-full rounded-2xl border border-white/8 bg-[#0f1f38] shadow-2xl overflow-hidden"
                    >
                        <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
                        <div className="p-8">
                            <div className="mb-8">
                                <p className="text-xs font-black tracking-[0.3em] text-amber-400/70 uppercase mb-2">Restricted Access</p>
                                <h2 className="text-4xl font-black text-white tracking-tight">STAFF LOGIN</h2>
                                <p className="text-base text-white/30 mt-2">Sign in with your staff credentials</p>
                            </div>

                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/4 px-4 py-3.5 focus-within:border-amber-500/60 focus-within:bg-amber-950/20 transition-all">
                                    <span className="text-amber-400/60"><FiShield size={18} /></span>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        required
                                        className="flex-1 bg-transparent focus:outline-none text-base text-white appearance-none cursor-pointer"
                                    >
                                        <option value="" disabled className="bg-[#0f1f38]">Select Role</option>
                                        <option value="Warden" className="bg-[#0f1f38]">Warden</option>
                                        <option value="DeputyWarden" className="bg-[#0f1f38]">Deputy Warden</option>
                                        <option value="Office" className="bg-[#0f1f38]">Hostel Office</option>
                                    </select>
                                </div>

                                <Field icon={<FiUser size={18} />} type="text" placeholder="Username" value={userName} onChange={(e) => setUserName(e.target.value)} required />
                                <Field icon={<FiLock size={18} />} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />

                                {error && <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2 font-medium">{error}</p>}

                                <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    type="submit"
                                    disabled={loading}
                                    className={`mt-4 flex items-center justify-center gap-3 w-full rounded-xl py-4 text-lg font-black text-slate-900 bg-gradient-to-r from-amber-400 to-yellow-400 hover:brightness-110 shadow-lg shadow-amber-900/30 transition-all tracking-widest ${loading ? "opacity-50" : ""}`}
                                >
                                    {loading ? "AUTHENTICATING..." : "SIGN IN"} <FiArrowRight size={18} />
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
