import React, { useState } from "react"
import { motion } from "framer-motion"
import { FiUser, FiCreditCard, FiHash, FiCalendar, FiBookOpen, FiMail, FiPhone, FiArrowRight, FiArrowLeft, FiCheckCircle } from "react-icons/fi"
import apiClient from "./api/apiClient"
import image from "./assets/1000088399.png"

const TITLE = "STUDENT REGISTRATION"

function Field({ label, icon, error, className = "", children, id, isSelect = false }) {
  return (
    <div className={`flex flex-col gap-2 w-full text-left ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-semibold tracking-wide text-white/80 select-none">
          {label}
        </label>
      )}
      <div 
        className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-all duration-300 relative group bg-black/20 w-full 
          ${error 
            ? 'border-rose-500/50 bg-rose-500/5 focus-within:border-rose-400' 
            : 'border-white/8 focus-within:border-teal-500/60 focus-within:bg-teal-950/10 focus-within:shadow-[0_0_15px_rgba(20,184,166,0.1)]'
          }`}
      >
        {icon && (
          <span className={`shrink-0 text-base transition-colors ${error ? 'text-rose-400' : 'text-teal-400/60 group-focus-within:text-teal-400'}`}>
            {icon}
          </span>
        )}
        {children}
        {isSelect && (
          <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
            <svg className="w-5 h-5 text-white/40 group-focus-within:text-teal-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}

function FormSection({ title, icon, delay, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 mb-8 shadow-sm backdrop-blur-sm"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/20">
          {icon}
        </div>
        <h3 className="text-lg font-bold text-white tracking-wide">{title}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
        {children}
      </div>
    </motion.div>
  )
}

const inp = "flex-1 min-w-0 bg-transparent focus:outline-none text-base text-white placeholder:text-white/40 font-medium w-full h-full"

function Register({ onNavigate }) {
  const [formData, setFormData] = useState({
    name: "", regNo: "8301", rollNo: "", dob: "", dept: "", gender: "", email: "", phone: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const goToLogin = () => {
    if (onNavigate) onNavigate('/student-login');
  };

  const handleChange = (e) => {
    let { name, value } = e.target;
    
    if (name === "regNo") {
      if (!value.startsWith("8301")) {
        if (value.length < 4) value = "8301";
        else value = "8301" + value.replace(/.*?8301/, ""); // Try to fix weird pastes
      }
      if (!value.startsWith("8301")) value = "8301"; // Fallback
    }
    
    if (name === "rollNo") {
      value = value.toUpperCase();
    }
    
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
      name: formData.name, registerNo: formData.regNo, rollNo: formData.rollNo,
      dob: formData.dob, department: formData.dept, gender: formData.gender,
      emailId: formData.email, phoneNo: formData.phone
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
      setError(err.response?.data?.message || "Registration failed. Ensure all fields are unique.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0a1628] text-white px-4 relative overflow-hidden" style={{ fontFamily: "'Inter', 'Poppins', 'Source Sans Pro', 'Segoe UI', sans-serif" }}>
        <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-teal-600/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
        <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white/[0.02] border border-white/10 backdrop-blur-xl rounded-3xl p-10 sm:p-12 shadow-2xl max-w-md w-full relative z-10"
        >
          <div className="w-24 h-24 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-emerald-500/20">
            <FiCheckCircle size={44} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Registration Successful!</h3>
          <p className="text-base text-white/60">Redirecting to login...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col font-sans bg-[#0a1628] text-white selection:bg-teal-500/30 relative overflow-hidden" style={{ fontFamily: "'Inter', 'Poppins', 'Source Sans Pro', 'Segoe UI', sans-serif" }}>
      <div className="fixed inset-0 bg-[#0a1628] -z-20" />
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-teal-600/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

      {/* Header */}
      <header className="w-full flex items-center justify-between gap-4 px-4 sm:px-8 py-4 border-b border-white/5 bg-[#0a1628]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img src={image} alt="GCES Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
          <div className="flex flex-col leading-tight">
            <span className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-teal-400/80 uppercase">
                Government College of Engineering
            </span>
            <span className="text-xl sm:text-2xl font-bold text-white tracking-widest">
                SRIRANGAM
            </span>
          </div>
        </div>
        <button
          onClick={() => onNavigate ? onNavigate('/') : window.location.href = '/'}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold hover:bg-white/5 transition-all text-sm cursor-pointer border border-transparent hover:border-white/10"
        >
          <FiArrowLeft size={16} /> Back
        </button>
      </header>
      <div className="h-[2px] bg-gradient-to-r from-transparent via-teal-500/50 to-transparent shrink-0" />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 z-10">
        <div className="w-full max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-2xl overflow-hidden relative p-6 sm:p-12 group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="relative z-10">
            {/* Header section inside card */}
            <div className="text-center mb-10">
              <div className="flex justify-center mb-5"><img src={image} className="w-20 h-20 object-contain" alt="Logo"/></div>
              <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">Government College of Engineering, Srirangam</h1>
              <h2 className="text-sm sm:text-lg text-teal-400/80 font-semibold mt-1 uppercase tracking-wider">Hostel Mess Reduction System</h2>
              
              <div className="w-full h-px bg-white/10 my-8"></div>
              
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{TITLE}</h3>
              <p className="text-base text-white/50 mt-2 font-medium">Create your mess account</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-0">
              {/* Section 1: Personal */}
              <FormSection delay={0.1} title="PERSONAL INFORMATION" icon={<FiUser size={20} />}>
                <div className="col-span-1 sm:col-span-2">
                  <Field label="Full Name" icon={<FiUser />} error={!!error} id="name-input">
                    <input id="name-input" type="text" placeholder="Enter your full name" name="name" className={inp} value={formData.name} onChange={handleChange} required />
                  </Field>
                </div>
                <Field label="Register Number" icon={<FiCreditCard />} error={!!error} id="regNo-input">
                  <input id="regNo-input" type="text" placeholder="Register number" name="regNo" className={inp} value={formData.regNo} onChange={handleChange} required />
                </Field>
                <Field label="Roll Number" icon={<FiHash />} error={!!error} id="rollNo-input">
                  <input id="rollNo-input" type="text" placeholder="Roll number" name="rollNo" className={inp} onKeyDown={handleAlphaNumKey} value={formData.rollNo} onChange={handleChange} required />
                </Field>
                <Field label="Date of Birth" icon={<FiCalendar />} error={!!error} id="dob-input">
                   <input id="dob-input" type="date" value={formData.dob} max={today} onChange={(e) => handleChange({ target: { name: "dob", value: e.target.value } })} required className={`${inp} cursor-pointer`} />
                </Field>
                <Field label="Gender" icon={<FiUser />} error={!!error} id="gender-select" isSelect>
                  <select id="gender-select" name="gender" value={formData.gender} onChange={handleChange} required className={`${inp} appearance-none cursor-pointer pr-8`}>
                    <option value="" className="text-white/40 bg-[#0f1f38]">Select Gender</option>
                    <option value="MALE" className="text-white bg-[#0f1f38]">Male</option>
                    <option value="FEMALE" className="text-white bg-[#0f1f38]">Female</option>
                  </select>
                </Field>
              </FormSection>

              {/* Section 2: Academic */}
              <FormSection delay={0.2} title="ACADEMIC INFORMATION" icon={<FiBookOpen size={20} />}>
                <div className="col-span-1 sm:col-span-2">
                  <Field label="Department" icon={<FiBookOpen />} error={!!error} id="dept-select" isSelect>
                    <select id="dept-select" name="dept" value={formData.dept} onChange={handleChange} required className={`${inp} appearance-none cursor-pointer pr-8`}>
                      <option value="" className="text-white/40 bg-[#0f1f38]">Select Department</option>
                      {["CSE", "ECE", "EEE", "CIVIL", "MECH", "MECHATRONICS"].map(d => <option key={d} value={d} className="text-white bg-[#0f1f38]">{d}</option>)}
                    </select>
                  </Field>
                </div>
              </FormSection>

              {/* Section 3: Contact */}
              <FormSection delay={0.3} title="CONTACT INFORMATION" icon={<FiMail size={20} />}>
                <Field label="Email Address" icon={<FiMail />} error={!!error} id="email-input">
                  <input id="email-input" type="email" placeholder="Email address" name="email" className={inp} value={formData.email} onChange={handleChange} required />
                </Field>
                <Field label="Phone Number" icon={<FiPhone />} error={!!error} id="phone-input">
                  <input id="phone-input" type="tel" inputMode="numeric" placeholder="Phone number" name="phone" className={inp} onKeyDown={handleNumKey} value={formData.phone} onChange={handleChange} required />
                </Field>
              </FormSection>

              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
                  <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-5 py-4 font-semibold shadow-sm">
                    {error}
                  </p>
                </motion.div>
              )}

              <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.4 }}>
                <button
                  type="submit"
                  disabled={loading}
                  className={`mt-2 flex-1 flex items-center justify-center gap-3 w-full rounded-xl py-4 text-lg font-semibold text-slate-900 bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-400 bg-[length:200%_auto] hover:bg-right shadow-[0_0_20px_rgba(45,212,191,0.2)] hover:shadow-[0_0_30px_rgba(45,212,191,0.4)] transition-all duration-500 tracking-wide group cursor-pointer ${loading ? "opacity-50 cursor-not-allowed shadow-none hover:shadow-none hover:bg-left" : ""}`}
                >
                  {loading ? "CREATING ACCOUNT..." : (
                    <span className="flex items-center justify-center gap-2">
                      CREATE ACCOUNT 
                      <FiArrowRight className="text-xl transition-transform duration-300 group-hover:translate-x-1.5" />
                    </span>
                  )}
                </button>
              </motion.div>
            </form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.45, delay: 0.5 }}
              className="mt-8 pt-6 border-t border-white/10 text-center relative z-10"
            >
              <p className="text-sm text-white/50 font-medium">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={goToLogin}
                  className="text-teal-400 font-bold hover:text-teal-300 transition-colors duration-200 cursor-pointer ml-1"
                >
                  Sign in here
                </button>
              </p>
            </motion.div>
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="pb-8 text-center mt-auto z-10">
        <p className="text-xs text-white/15 tracking-widest uppercase font-bold">© 2025 GCES · Student Portal</p>
      </footer>
    </div>
  )
}

export default Register