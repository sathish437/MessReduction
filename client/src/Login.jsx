import React, { useState } from "react"
import { motion } from "framer-motion"
import { FiUser, FiCalendar, FiArrowRight } from "react-icons/fi"
import apiClient from "./api/apiClient"

const TITLE = "LOGIN"

const getInitial = () => {
  const sides = ['top', 'bottom', 'left', 'right']
  const side = sides[Math.floor(Math.random() * sides.length)]
  const d = 250, v = Math.floor(Math.random() * 60) - 30
  const r = Math.floor(Math.random() * 240) - 120
  const pos = { top: [v, -d], bottom: [v, d], left: [-d, v], right: [d, v] }[side]
  return { x: pos[0], y: pos[1], rotate: r, opacity: 0, scale: 0.5 }
}

function AnimatedTitle() {
  return (
    <div className="mb-6">
      <p className="text-sm font-bold tracking-[0.3em] text-teal-400/80 uppercase mb-2">
        Student Portal
      </p>
      <motion.h2
        className="font-black text-4xl text-white tracking-tight flex gap-[1px]"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } }}
      >
        {TITLE.split("").map((char, i) => (
          <motion.span
            key={i}
            className="inline-block cursor-default"
            variants={{
              hidden: getInitial(),
              visible: {
                opacity: 1, scale: 1, x: 0, y: 0, rotate: 0,
                transition: { type: "spring", stiffness: 200, damping: 22 }
              },
            }}
            whileHover={{ scale: 1.15, color: "#2dd4bf" }}
          >
            {char}
          </motion.span>
        ))}
      </motion.h2>
      <p className="text-base text-white/40 mt-1.5 font-medium">Sign in to your mess account</p>
      <div className="mt-4 h-px bg-gradient-to-r from-teal-500/40 to-transparent" />
    </div>
  )
}

function Field({ icon, error, ...props }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 sm:py-4 transition-all bg-[#0a1628] w-full ${error ? 'border-rose-500/50 bg-rose-500/5 focus-within:border-rose-400' : 'border-white/10 input-focus'}`}>
      <span className={`shrink-0 ${error ? 'text-rose-400' : 'text-teal-400/60 text-base'}`}>{icon}</span>
      <input className="flex-1 bg-transparent focus:outline-none text-base sm:text-lg text-white placeholder:text-white/25 font-medium w-full" {...props} />
    </div>
  )
}

function Login({ goToRegister, onLoginSuccess }) {
  const [identifier, setIdentifier] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simple validation
    if (!identifier || !dob) {
      setError('Please fill both Register Number / Roll Number and Date of Birth');
      setLoading(false);
      return;
    }

    try {
      // Call student login API
      const requestBody = {
        identifier: identifier,
        dob: dob
      };

      const response = await apiClient.post('/api/auth/login', requestBody);
      const data = response.data;

      // Store token and user data
      if (data.token) {
        sessionStorage.setItem('token', data.token);
        const userData = {
          name: data.name,
          studentId: data.studentId,
          registerNo: data.registerNo,
          rollNo: data.rollNo,
          token: data.token
        };
        sessionStorage.setItem('currentUser', JSON.stringify(userData));

        if (onLoginSuccess) onLoginSuccess(userData);
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Login failed. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5">
      <AnimatedTitle />

      <Field
        icon={<FiUser size={15} />} error={!!error}
        type="text" placeholder="Enter your Register Number or Roll Number"
        value={identifier} onChange={(e) => setIdentifier(e.target.value)} required
      />
      <Field
        icon={<FiCalendar size={15} />} error={!!error}
        type="text" placeholder="Date of birth"
        value={dob} onChange={(e) => setDob(e.target.value)} required
        onFocus={(e) => (e.target.type = "date")}
        onBlur={(e) => { if (!e.target.value) e.target.type = "text" }}
      />
      
      {error && <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2 font-medium">{error}</p>}

      <motion.button
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.985 }}
        type="submit"
        disabled={loading}
        className={`mt-2 flex items-center justify-center gap-3 w-full rounded-xl py-3 sm:py-4 text-base sm:text-lg font-black text-slate-900 bg-gradient-to-r from-teal-400 to-emerald-400 hover:brightness-110 shadow-soft transition-all duration-200 tracking-widest ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
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

      <p className="text-center text-base mt-2 text-white/30">
        New student?{" "}
        <button type="button" onClick={goToRegister} className="text-teal-400 font-black hover:text-teal-300 underline underline-offset-4 transition-colors">
          Create account
        </button>
      </p>

      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-center text-sm text-white/40 mb-2">Staff Member?</p>
        <button
          type="button"
          onClick={() => window.location.href = '/staff-login'}
          className="w-full py-3 rounded-xl border border-teal-500/30 text-teal-400 font-black text-sm uppercase tracking-widest hover:bg-teal-500/10 hover:border-teal-500/50 transition-all flex items-center justify-center gap-2"
        >
          Staff Login
        </button>
      </div>
    </form>
  )
}

export default Login