import React, { useState } from "react"
import { motion } from "framer-motion"
import { FiUser, FiCreditCard, FiHash, FiCalendar, FiBookOpen, FiMail, FiPhone, FiArrowRight, FiArrowLeft } from "react-icons/fi"
import apiClient from "./api/apiClient"
import image from "./assets/1000088399.png"
import DobInputComponent from "./DobInputComponent"

const TITLE = "STUDENT REGISTRATION"

const getInitial = () => {
  const sides = ['top', 'bottom', 'left', 'right']
  const side = sides[Math.floor(Math.random() * sides.length)]
  const d = 220, v = Math.floor(Math.random() * 60) - 30
  const r = Math.floor(Math.random() * 200) - 100
  const pos = { top: [v, -d], bottom: [v, d], left: [-d, v], right: [d, v] }[side]
  return { x: pos[0], y: pos[1], rotate: r, opacity: 0, scale: 0.5 }
}

function AnimatedTitle() {
  return (
    <div className="mb-4">
      <p className="text-sm font-bold tracking-[0.3em] text-teal-400/80 uppercase mb-2">
        Student Portal
      </p>
      <motion.h2
        className="font-black text-3xl sm:text-4xl text-white tracking-tight flex gap-[1px]"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.04, delayChildren: 0.03 } } }}
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
      <p className="text-base text-white/40 mt-1.5 font-medium">Create your mess account</p>
      <div className="mt-2 h-px bg-gradient-to-r from-teal-500/40 to-transparent" />
    </div>
  )
}

function Field({ icon, error, className = "", children }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 sm:py-4 transition-all bg-[#0a1628] w-full ${error ? 'border-rose-500/50 bg-rose-500/5 focus-within:border-rose-400' : 'border-white/10 input-focus'} ${className}`}>
      <span className={`shrink-0 text-base ${error ? 'text-rose-400' : 'text-teal-400/60'}`}>{icon}</span>
      {children}
    </div>
  )
}

const inp = "flex-1 min-w-0 bg-transparent focus:outline-none text-base sm:text-lg text-white placeholder:text-white/25 font-medium w-full"

function Register({ onNavigate }) {
  const [formData, setFormData] = useState({
    name: "",
    regNo: "",
    rollNo: "",
    dob: "",
    dept: "",
    gender: "",
    email: "",
    phone: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const goToLogin = () => {
    if (onNavigate) {
      onNavigate('/student-login');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumKey = (e) => {
    if (!/[0-9]/.test(e.key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key))
      e.preventDefault();
  };

  const handleAlphaNumKey = (e) => {
    if (!/[a-zA-Z0-9]/.test(e.key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key))
      e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const submissionData = {
      name: formData.name,
      registerNo: formData.regNo,
      rollNo: formData.rollNo,
      dob: formData.dob,
      department: formData.dept,
      gender: formData.gender,
      emailId: formData.email,
      phoneNo: formData.phone
    };

    try {
      const response = await apiClient.post("/api/student/reg", submissionData);

      if (response.status === 200 || response.status === 201) {
        setSuccess(true);
        setTimeout(() => goToLogin(), 1500);
      } else {
        setError("Registration failed. Please try again.");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.response?.data?.message || "Registration failed. Ensure all fields are unique.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0a1628] text-white px-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiArrowRight size={40} className="-rotate-45" />
          </div>
          <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Registration Successful!</h3>
          <p className="text-base text-white/40">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col font-sans bg-[#0a1628] text-white">
      <div className="fixed inset-0 bg-[#0a1628] -z-10" />

      {/* Header */}
      <header className="w-full flex items-center justify-between gap-3 px-4 py-4 border-b border-white/5 bg-[#0a1628]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img src={image} alt="GCES Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
          <div className="flex flex-col leading-tight">
            <span className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-teal-400/80 uppercase">Government College of Engineering</span>
            <span className="text-lg sm:text-xl font-black text-white tracking-widest">SRIRANGAM</span>
          </div>
        </div>
        <button
          onClick={() => onNavigate ? onNavigate('/') : window.location.href = '/'}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-teal-500/50 transition-all text-sm font-bold"
        >
          <FiArrowLeft size={16} /> Back
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-[480px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-2xl border border-white/10 bg-[#0f1f38] shadow-soft overflow-hidden"
          >
            <div className="h-px bg-gradient-to-r from-transparent via-teal-400/70 to-transparent" />
            <div className="p-6 sm:p-8">
              <AnimatedTitle />

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field icon={<FiUser />} error={!!error}>
                    <input
                      type="text" placeholder="Full name" name="name"
                      className={inp} value={formData.name} onChange={handleChange} required
                    />
                  </Field>

                  <Field icon={<FiCreditCard />} error={!!error}>
                    <input
                      type="text" inputMode="numeric" placeholder="Register No" name="regNo"
                      className={inp} onKeyDown={handleNumKey} value={formData.regNo} onChange={handleChange} required
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field icon={<FiHash />} error={!!error}>
                    <input
                      type="text" placeholder="Roll number" name="rollNo"
                      className={inp} onKeyDown={handleAlphaNumKey} value={formData.rollNo} onChange={handleChange} required
                    />
                  </Field>

                  <DobInputComponent
                    value={formData.dob}
                    onChange={(e) => handleChange({ target: { name: "dob", value: e.target.value } })}
                    error={!!error}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field icon={<FiBookOpen />} error={!!error}>
                    <select
                      name="dept" value={formData.dept} onChange={handleChange} required
                      className={`${inp} appearance-none cursor-pointer`}
                    >
                      <option value="" className="bg-[#0f1f38] text-white/40">Select Department</option>
                      {["CSE", "ECE", "EEE", "CIVIL", "MECH", "MECHATRONICS"].map(d => (
                        <option key={d} value={d} className="bg-[#0f1f38] text-white">{d}</option>
                      ))}
                    </select>
                  </Field>

                  <Field icon={<FiUser />} error={!!error}>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      required
                      className={`${inp} appearance-none cursor-pointer`}
                    >
                      <option value="" className="bg-[#0f1f38] text-white/40">Select Gender</option>
                      <option value="MALE" className="bg-[#0f1f38] text-white">Male</option>
                      <option value="FEMALE" className="bg-[#0f1f38] text-white">Female</option>
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field icon={<FiMail />} error={!!error}>
                    <input
                      type="email" placeholder="Email address" name="email"
                      className={inp} value={formData.email} onChange={handleChange} required
                    />
                  </Field>

                  <Field icon={<FiPhone />} error={!!error}>
                    <input
                      type="tel" inputMode="numeric" placeholder="Phone number" name="phone"
                      className={inp} onKeyDown={handleNumKey} value={formData.phone} onChange={handleChange} required
                    />
                  </Field>
                </div>
                
                {error && <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2 font-medium">{error}</p>}

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  disabled={loading}
                  className={`mt-4 flex items-center justify-center gap-3 w-full rounded-xl py-3 sm:py-4 text-base sm:text-lg font-black text-slate-900 bg-gradient-to-r from-teal-400 to-emerald-400 hover:brightness-110 shadow-soft transition-all duration-200 tracking-widest ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                      CREATING...
                    </>
                  ) : (
                    <>CREATE ACCOUNT <FiArrowRight size={18} /></>
                  )}
                </motion.button>
              </form>

              <p className="text-center text-sm mt-4 text-white/30">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={goToLogin}
                  className="text-teal-400 font-black hover:text-teal-300 underline underline-offset-4 transition-colors"
                >
                  Sign in
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="pb-6 text-center">
        <p className="text-xs text-white/10 tracking-widest uppercase font-bold">© 2025 GCES · Student Portal</p>
      </footer>
    </div>
  )
}

export default Register