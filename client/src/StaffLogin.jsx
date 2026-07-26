import React, { useState } from "react"
import { useTheme } from './context/ThemeContext';
import { motion } from "framer-motion"
import { FiSun, FiMoon, FiUser, FiArrowRight, FiShield, FiArrowLeft } from "react-icons/fi"
import apiClient from "./api/apiClient"
import { setStaffAuth, getStaffDashboardRoute } from "./services/authService"
import image from "./assets/1000088399.png"
import PasswordInput from "./PasswordInput"
import CustomSelect from "./CustomSelect"

const TITLE = "STAFF LOGIN"

function Field({ icon, error, label, id, ...props }) {
  return (
    <div className="flex flex-col gap-1.5 sm:gap-2 w-full text-left">
      {label && (
        <label htmlFor={id} className="text-xs sm:text-sm font-semibold tracking-wide text-[var(--color-text-primary)]/80 select-none">
          {label}
        </label>
      )}
      <div className={`flex items-center gap-2.5 sm:gap-3 rounded-xl border px-3 sm:px-4 py-2.5 sm:py-3.5 transition-all duration-300 relative group bg-[var(--color-primary-bg)] w-full ${error ? 'border-rose-500/50 bg-rose-500/5 focus-within:border-rose-400' : 'border-[var(--color-border)] focus-within:border-[var(--color-btn-primary)] focus-within:bg-[var(--color-btn-primary)]/5 focus-within:ring-2 focus-within:ring-[var(--color-btn-primary)]/20'}`}>
        <span className={`shrink-0 text-sm sm:text-base transition-colors ${error ? 'text-rose-400' : 'text-[var(--color-text-secondary)] group-focus-within:text-[var(--color-btn-primary)]'}`}>{icon}</span>
        <input id={id} className="flex-1 bg-transparent focus:outline-none text-sm sm:text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] font-medium w-full appearance-none" {...props} />
      </div>
    </div>
  )
}

function StaffLogin({ onNavigate }) {
  const { isDark, toggleTheme } = useTheme();
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
      setError("Please select a staff role");
      setLoading(false);
      return;
    }

    try {
      const requestBody = {
        userName: userName,
        password: password,
        role: role
      };

      const response = await apiClient.post('/api/staff/login', requestBody);
      const data = response.data;

      if (data.token) {
        setStaffAuth(data.token, data.username, data.role);
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
      const errorMsg = error.response?.data?.message || error.message || 'Login failed. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col font-sans bg-[var(--color-primary-bg)] text-[var(--color-text-primary)] selection:bg-teal-500/30 relative overflow-hidden" style={{ fontFamily: "'Inter', 'Poppins', 'Source Sans Pro', 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <header className="w-full flex items-center justify-between px-3.5 sm:px-8 py-2.5 sm:py-3.5 border-b border-[var(--color-border)] bg-[var(--color-header)] text-white sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-3 sm:gap-4">
          <img src={image} alt="GCES Logo" className="w-9 h-9 sm:w-12 sm:h-12 object-contain drop-shadow-md" />
          <div className="flex flex-col leading-tight">
            <span className="text-[9px] sm:text-[11px] font-bold tracking-widest text-white/80 uppercase mb-0.5">Government College of Engineering</span>
            <span className="text-base sm:text-xl font-bold tracking-tight">SRIRANGAM</span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={toggleTheme} className="text-white/80 hover:text-white p-2 bg-white/10 hover:bg-white/20 rounded-[10px] border border-[var(--color-border)] shadow-sm transition-all cursor-pointer">
            {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
          </button>
          <button onClick={() => window.location.href = '/'} className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-white/90 hover:text-white font-semibold bg-white/10 hover:bg-white/20 transition-all text-xs sm:text-sm cursor-pointer border border-[var(--color-border)] shadow-sm">
            <FiArrowLeft size={15} /> Back
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-3 sm:px-4 py-4 sm:py-6 lg:py-8 z-10">
        <div className="w-full max-w-[400px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-2xl sm:rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="relative z-10">
              <div className="mb-4 sm:mb-5">
                <p className="text-[10px] sm:text-xs font-semibold tracking-[0.2em] text-[var(--color-btn-primary)] uppercase mb-1">Staff Portal</p>
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">{TITLE}</h2>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1 font-medium">Sign in with your staff credentials</p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 sm:gap-4">
                <CustomSelect
                  label="Staff Role"
                  icon={<FiShield size={16} />}
                  name="role"
                  id="staff-role-select"
                  value={role}
                  onChange={(e) => { setRole(e.target.value); setUserName(""); }}
                  required
                  placeholder="Select Staff Role"
                  options={[
                    { value: "Warden", label: "Warden" },
                    { value: "DeputyWarden", label: "Deputy Warden" },
                    { value: "Office", label: "Hostel Office" }
                  ]}
                  error={error && !role ? error : null}
                />

                <Field
                  label="Username"
                  id="username-input"
                  icon={<FiUser size={16} />}
                  type="text"
                  placeholder={!role ? "Select Role First" : "Enter Username"}
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                  disabled={!role}
                  error={error && !userName}
                />

                <div className="flex flex-col gap-1.5 sm:gap-2 w-full text-left">
                  <label htmlFor="staff-password" className="text-xs sm:text-sm font-semibold tracking-wide text-[var(--color-text-primary)]/80 select-none">
                    Password
                  </label>
                  <PasswordInput 
                    id="staff-password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    error={!!error} 
                  />
                </div>

                {error && <p className="text-xs sm:text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 font-semibold text-center">{error}</p>}

                <motion.button
                  whileHover={loading ? {} : { scale: 1.01, y: -1 }}
                  whileTap={loading ? {} : { scale: 0.99 }}
                  type="submit"
                  disabled={loading}
                  className={`mt-1 sm:mt-2 flex-1 flex items-center justify-center gap-2 sm:gap-3 w-full rounded-xl py-2.5 sm:py-3 text-sm sm:text-base font-bold text-white bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] shadow-sm hover:shadow-md transition-all duration-500 tracking-wide cursor-pointer ${loading ? "opacity-50 cursor-not-allowed shadow-none" : ""}`}
                >
                  {loading ? "AUTHENTICATING..." : (
                    <>SIGN IN <FiArrowRight size={16} /></>
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="pb-4 sm:pb-6 text-center mt-auto z-10">
        <p className="text-[10px] sm:text-xs text-[var(--color-text-secondary)]/40 tracking-widest uppercase font-bold">© 2025 GCES · Staff Portal · Authorized Only</p>
      </footer>
    </div>
  )
}

export default StaffLogin
