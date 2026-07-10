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
    <div className="text-center mb-8 flex flex-col items-center">
      <p className="text-xs sm:text-sm font-bold tracking-[0.3em] text-[#00e699] uppercase mb-3">
        Student Portal
      </p>
      <motion.h2
        className="font-bold text-2xl sm:text-3xl lg:text-4xl text-white tracking-wider flex flex-wrap justify-center gap-x-1 sm:gap-x-2 gap-y-1 select-none"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.04, delayChildren: 0.03 } } }}
      >
        {TITLE.split("").map((char, i) => {
          if (char === " ") {
            return (
              <span key={i} className="inline-block w-2 sm:w-3" />
            )
          }
          return (
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
              whileHover={{ scale: 1.15, color: "#00e699" }}
            >
              {char}
            </motion.span>
          )
        })}
      </motion.h2>
      <p className="text-sm sm:text-base text-white/60 mt-3 font-medium tracking-wide">
        Create your mess account
      </p>
      <div className="mt-4 w-24 h-0.5 bg-gradient-to-r from-transparent via-[#00e699]/50 to-transparent" />
    </div>
  )
}

function Field({ label, icon, error, className = "", children, id, isSelect = false }) {
  return (
    <div className={`flex flex-col gap-2 w-full text-left ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-semibold tracking-wide text-white/80 select-none">
          {label}
        </label>
      )}
      <div 
        className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-300 bg-[#112240] w-full relative group 
          ${error 
            ? 'border-rose-500/50 bg-rose-500/5 focus-within:border-rose-400 focus-within:shadow-[0_0_15px_rgba(244,63,94,0.25)]' 
            : 'border-[rgba(255,255,255,0.15)] focus-within:border-[#00e699] focus-within:shadow-[0_0_15px_rgba(0,230,153,0.25)] focus-within:bg-[#112240]/80'
          }`}
      >
        {icon && (
          <span className={`shrink-0 text-lg transition-colors ${error ? 'text-rose-400' : 'text-[#00e699]'}`}>
            {icon}
          </span>
        )}
        {children}
        {isSelect && (
          <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
            <svg className="w-4 h-4 text-white/40 group-focus-within:text-[#00e699] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}

const inp = "flex-1 min-w-0 bg-transparent focus:outline-none text-base text-white placeholder:text-white/40 font-medium w-full"

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
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0a192f] text-white px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#0a192f] -z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#00e699]/5 rounded-full blur-[100px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-[#112240]/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-w-md w-full relative z-10"
        >
          <div className="w-20 h-20 bg-[#00e699]/15 text-[#00e699] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#00e699]/30 shadow-[0_0_20px_rgba(0,230,153,0.2)]">
            <FiArrowRight size={36} className="-rotate-45" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Registration Successful!</h3>
          <p className="text-base text-white/60">Redirecting to login...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col font-sans bg-[#0a192f] text-white">
      {/* Premium Atmospheric Background */}
      <div className="fixed inset-0 bg-[#0a192f] -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00e699]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />
      </div>

      {/* Header */}
      <header className="w-full flex items-center justify-between gap-3 px-6 py-4 border-b border-white/5 bg-[#0a192f]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img src={image} alt="GCES Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
          <div className="flex flex-col leading-tight">
            <span className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-[#00e699]/90 uppercase">Government College of Engineering</span>
            <span className="text-lg sm:text-xl font-bold text-white tracking-widest">SRIRANGAM</span>
          </div>
        </div>
        <button
          onClick={() => onNavigate ? onNavigate('/') : window.location.href = '/'}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-white/70 hover:text-white hover:border-[#00e699]/50 hover:bg-[#00e699]/5 transition-all text-sm font-bold cursor-pointer"
        >
          <FiArrowLeft size={16} /> Back
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-3xl border border-white/10 bg-[#112240]/40 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative"
          >
            {/* Top accent line */}
            <div className="h-0.5 bg-gradient-to-r from-transparent via-[#00e699]/60 to-transparent" />
            
            <div className="p-6 sm:p-10 md:p-12">
              <AnimatedTitle />

              <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                {/* 2-Column Responsive Form Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                  <Field label="Full Name" icon={<FiUser />} error={!!error} id="name-input">
                    <input
                      id="name-input"
                      type="text" placeholder="Full name" name="name"
                      className={inp} value={formData.name} onChange={handleChange} required
                    />
                  </Field>

                  <Field label="Register / Roll No" icon={<FiCreditCard />} error={!!error} id="regNo-input">
                    <input
                      id="regNo-input"
                      type="text" placeholder="Register No / Roll No" name="regNo"
                      className={inp} value={formData.regNo} onChange={handleChange} required
                    />
                  </Field>

                  <Field label="Roll Number" icon={<FiHash />} error={!!error} id="rollNo-input">
                    <input
                      id="rollNo-input"
                      type="text" placeholder="Roll number" name="rollNo"
                      className={inp} onKeyDown={handleAlphaNumKey} value={formData.rollNo} onChange={handleChange} required
                    />
                  </Field>

                  <DobInputComponent
                    value={formData.dob}
                    onChange={(e) => handleChange({ target: { name: "dob", value: e.target.value } })}
                    error={!!error}
                  />

                  <Field label="Department" icon={<FiBookOpen />} error={!!error} id="dept-select" isSelect>
                    <select
                      id="dept-select"
                      name="dept" value={formData.dept} onChange={handleChange} required
                      className={`${inp} appearance-none cursor-pointer pr-8`}
                    >
                      <option value="" className="bg-[#112240] text-white/40">Select Department</option>
                      {["CSE", "ECE", "EEE", "CIVIL", "MECH", "MECHATRONICS"].map(d => (
                        <option key={d} value={d} className="bg-[#112240] text-white">{d}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Gender" icon={<FiUser />} error={!!error} id="gender-select" isSelect>
                    <select
                      id="gender-select"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      required
                      className={`${inp} appearance-none cursor-pointer pr-8`}
                    >
                      <option value="" className="bg-[#112240] text-white/40">Select Gender</option>
                      <option value="MALE" className="bg-[#112240] text-white">Male</option>
                      <option value="FEMALE" className="bg-[#112240] text-white">Female</option>
                    </select>
                  </Field>

                  <Field label="Email Address" icon={<FiMail />} error={!!error} id="email-input">
                    <input
                      id="email-input"
                      type="email" placeholder="Email address" name="email"
                      className={inp} value={formData.email} onChange={handleChange} required
                    />
                  </Field>

                  <Field label="Phone Number" icon={<FiPhone />} error={!!error} id="phone-input">
                    <input
                      id="phone-input"
                      type="tel" inputMode="numeric" placeholder="Phone number" name="phone"
                      className={inp} onKeyDown={handleNumKey} value={formData.phone} onChange={handleChange} required
                    />
                  </Field>
                </div>

                {error && (
                  <p className="text-sm text-rose-400 bg-rose-950/30 border border-rose-500/20 rounded-xl px-4 py-3 font-medium">
                    {error}
                  </p>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                  className={`mt-4 flex items-center justify-center gap-2.5 w-full rounded-xl py-3.5 sm:py-4 text-base font-bold text-[#0a192f] bg-[#00e699] hover:bg-[#1affb2] hover:shadow-[0_0_25px_rgba(0,230,153,0.4)] transition-all duration-300 tracking-widest group cursor-pointer ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  {loading ? (
                    <span className="flex items-center gap-2 justify-center">
                      <div className="w-5 h-5 border-2 border-[#0a192f] border-t-transparent rounded-full animate-spin" />
                      CREATING ACCOUNT...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      CREATE ACCOUNT 
                      <FiArrowRight className="text-lg transition-transform duration-200 group-hover:translate-x-1" />
                    </span>
                  )}
                </motion.button>
              </form>

              <p className="text-center text-sm mt-6 text-white/60 tracking-wide">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={goToLogin}
                  className="text-[#00e699] font-semibold hover:text-[#1affb2] hover:underline underline-offset-4 transition-colors duration-200 cursor-pointer"
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
        <p className="text-xs text-white/20 tracking-widest uppercase font-bold">© 2025 GCES · Student Portal</p>
      </footer>
    </div>
  )
}

export default Register