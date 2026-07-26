import React, { useState, useEffect, useCallback } from "react"
import { useTheme } from './context/ThemeContext';
import { motion, AnimatePresence } from "framer-motion"
import { FiSun, FiMoon, FiUser, FiCreditCard, FiHash, FiCalendar, FiBookOpen, FiMail, FiPhone, FiArrowRight, FiArrowLeft, FiCheckCircle, FiShield, FiAlertTriangle, FiLogIn, FiX } from "react-icons/fi"
import apiClient from "./api/apiClient"
import image from "./assets/1000088399.png"
import CustomSelect from "./CustomSelect"
import { getHostelVerificationEnabled } from "./services/authService"
import { getActiveDepartments } from "./api/departmentService"

function Toast({ toast, onClose, onLogin }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key="toast"
          initial={{ opacity: 0, y: -80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -60, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="fixed top-6 left-1/2 z-[9999] -translate-x-1/2 w-full max-w-md px-4"
        >
          <div className={`flex items-start gap-4 rounded-2xl shadow-2xl border px-5 py-4 ${
            toast.type === 'already-registered'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            <div className="mt-0.5 shrink-0">
              <FiAlertTriangle size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm leading-snug">
                {toast.title}
              </p>
              <p className="text-xs mt-1 opacity-80 leading-relaxed">
                {toast.message}
              </p>
              {toast.type === 'already-registered' && (
                <button
                  onClick={onLogin}
                  className="mt-3 flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-amber-200 transition-colors"
                >
                  <FiLogIn size={13} /> Go to Student Login
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity mt-0.5"
            >
              <FiX size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const TITLE = "STUDENT REGISTRATION"

function Field({ label, icon, error, className = "", children, id, isSelect = false }) {
  return (
    <div className={`flex flex-col gap-1.5 sm:gap-2 w-full text-left ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs sm:text-sm font-semibold tracking-wide text-[var(--color-text-primary)]/80 select-none">
          {label}
        </label>
      )}
      <div 
        className={`flex items-center gap-2.5 sm:gap-3 rounded-xl border px-3 sm:px-4 py-2.5 sm:py-3.5 transition-all duration-300 relative group bg-[var(--color-primary-bg)] w-full 
          ${error 
            ? 'border-rose-500/50 bg-rose-500/5 focus-within:border-rose-400' 
            : 'border-[var(--color-border)] focus-within:border-[var(--color-btn-primary)] focus-within:bg-[var(--color-btn-primary)]/5 focus-within:ring-2 focus-within:ring-[var(--color-btn-primary)]/20'
          }`}
      >
        {icon && (
          <span className={`shrink-0 text-sm sm:text-base transition-colors ${error ? 'text-rose-400' : 'text-[var(--color-text-secondary)] group-focus-within:text-[var(--color-btn-primary)]'}`}>
            {icon}
          </span>
        )}
        {children}
        {isSelect && (
          <div className="pointer-events-none absolute right-3 sm:right-4 top-1/2 -translate-y-1/2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-text-secondary)] group-focus-within:text-[var(--color-btn-primary)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 sm:p-6 mb-4 sm:mb-8 shadow-sm"
    >
      <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[var(--color-btn-primary)]/10 flex items-center justify-center text-[var(--color-btn-primary)] border border-teal-500/20 text-sm sm:text-base">
          {icon}
        </div>
        <h3 className="text-sm sm:text-lg font-bold text-[var(--color-text-primary)] tracking-wide">{title}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-4 sm:gap-y-6">
        {children}
      </div>
    </motion.div>
  )
}

const inp = "flex-1 min-w-0 bg-transparent focus:outline-none text-sm sm:text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] font-medium w-full h-full"
const disabledInp = "flex-1 min-w-0 bg-transparent focus:outline-none text-sm sm:text-base text-[var(--color-btn-primary-hover)]/90 font-semibold cursor-not-allowed w-full h-full"

function Register({ onNavigate }) {
  const { isDark, toggleTheme } = useTheme();
  const [formData, setFormData] = useState({
    name: "", regNo: "8301", rollNo: "", dob: "", dept: "", gender: "", email: "", phone: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((type, title, message) => {
    setToast({ type, title, message });
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, []);

  const today = new Date().toISOString().split("T")[0];

  const navigateTo = (path) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.href = path;
    }
  };

  useEffect(() => {
    const verifySessionAccess = async () => {
      const enabled = await getHostelVerificationEnabled();
      const verified = sessionStorage.getItem("hostelVerified") === "true";

      if (enabled && !verified) {
        navigateTo("/hostel-verification");
        return;
      }

      setIsVerified(verified);
      const verifiedDataStr = sessionStorage.getItem("verifiedStudentData");
      if (verifiedDataStr) {
        try {
          const verifiedData = JSON.parse(verifiedDataStr);
          setFormData(prev => ({
            ...prev,
            rollNo: verifiedData.rollNo || prev.rollNo,
            dept: verifiedData.department || verifiedData.dept || prev.dept,
            gender: verifiedData.gender || prev.gender,
            email: verifiedData.email || prev.email,
            phone: verifiedData.phone || prev.phone,
            dob: verifiedData.dob || prev.dob
          }));
        } catch (e) {}
      }
      setCheckingAccess(false);
    };

    verifySessionAccess();
  }, []);

  const [departmentOptions, setDepartmentOptions] = useState([]);

  useEffect(() => {
    getActiveDepartments().then(depts => {
      if (Array.isArray(depts) && depts.length > 0) {
        setDepartmentOptions(depts.map(d => ({ value: d.departmentCode, label: `${d.departmentCode} - ${d.departmentName}` })));
      }
    });
  }, []);

  const goToLogin = () => {
    if (onNavigate) onNavigate('/student-login');
  };

  const handleChange = (e) => {
    let { name, value } = e.target;
    
    if (name === "regNo") {
      let digits = value.replace(/[^0-9]/g, "");
      if (!digits.startsWith("8301")) {
        digits = "8301" + digits.replace(/.*?8301/, "");
      }
      value = digits.slice(0, 12);
    }
    
    if (name === "phone") {
      value = value.replace(/[^0-9]/g, "").slice(0, 10);
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
    if (loading) return;
    setError("");

    // Validate inputs
    if (!formData.name || formData.name.trim().length < 2) {
      showToast('error', 'Invalid Name', 'Please enter a valid Full Name.');
      return;
    }
    if (!formData.regNo || formData.regNo.length !== 12) {
      showToast('error', 'Invalid Register Number', 'Register Number must be 12 digits (starting with 8301).');
      return;
    }
    if (!formData.rollNo || !formData.rollNo.trim()) {
      showToast('error', 'Invalid Roll Number', 'Please enter a valid Roll Number.');
      return;
    }
    if (!formData.dob) {
      showToast('error', 'Date of Birth Required', 'Please select your Date of Birth.');
      return;
    }
    if (!formData.gender) {
      showToast('error', 'Gender Required', 'Please select your Gender.');
      return;
    }
    if (!formData.dept) {
      showToast('error', 'Department Required', 'Please select your Department.');
      return;
    }
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      showToast('error', 'Invalid Email', 'Please enter a valid Email Address.');
      return;
    }
    if (!formData.phone || formData.phone.length !== 10) {
      showToast('error', 'Invalid Phone Number', 'Please enter a valid 10-digit Phone Number.');
      return;
    }

    setLoading(true);

    const submissionData = {
      name: formData.name.trim(),
      registerNo: formData.regNo,
      rollNo: formData.rollNo.trim(),
      dob: formData.dob,
      department: formData.dept,
      gender: formData.gender,
      emailId: formData.email.trim(),
      phoneNo: formData.phone
    };

    try {
      const response = await apiClient.post("/api/student/reg", submissionData);
      if (response.status === 200 || response.status === 201) {
        sessionStorage.removeItem("hostelVerified");
        sessionStorage.removeItem("verifiedStudentData");
        setSuccess(true);
        setTimeout(() => goToLogin(), 1500);
      } else {
        showToast('error', 'Registration Failed', 'Something went wrong. Please try again.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || "";
      const isAlreadyRegistered =
        msg.toLowerCase().includes("roll number is already registered") ||
        msg.toLowerCase().includes("register number is already registered") ||
        msg.toLowerCase().includes("roll_no") ||
        msg.toLowerCase().includes("register_no");

      if (isAlreadyRegistered) {
        showToast(
          'already-registered',
          'You are already registered!',
          'An account with this Roll Number or Register Number already exists. Please sign in to your existing account.'
        );
      } else if (msg.toLowerCase().includes("email already exists")) {
        showToast('error', 'Email Already Used', 'This email address is already registered with another account.');
      } else if (msg.toLowerCase().includes("phone number is already")) {
        showToast('error', 'Phone Number Already Used', 'This phone number is already registered with another account.');
      } else {
        showToast('error', 'Registration Failed', msg || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingAccess) {
    return null;
  }


  if (success) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[var(--color-primary-bg)] text-[var(--color-text-primary)] px-4 relative overflow-hidden" style={{ fontFamily: "'Inter', 'Poppins', 'Source Sans Pro', 'Segoe UI', sans-serif" }}>
                        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-[var(--color-surface)] border border-[var(--color-border)]  rounded-3xl p-10 sm:p-12 shadow-2xl max-w-md w-full relative z-10"
        >
          <div className="w-24 h-24 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-emerald-500/20">
            <FiCheckCircle size={44} />
          </div>
          <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2 tracking-tight">Registration Successful!</h3>
          <p className="text-base text-[var(--color-text-primary)]/60">Redirecting to login...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col font-sans bg-[var(--color-primary-bg)] text-[var(--color-text-primary)] selection:bg-teal-500/30 relative overflow-hidden" style={{ fontFamily: "'Inter', 'Poppins', 'Source Sans Pro', 'Segoe UI', sans-serif" }}>
      <Toast toast={toast} onClose={() => setToast(null)} onLogin={goToLogin} />
                  
      {/* Header */}
      <header className="w-full flex items-center justify-between px-4 sm:px-8 py-3.5 sm:py-4 border-b border-[var(--color-border)] bg-[var(--color-header)] text-white sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-3 sm:gap-4">
          <img src={image} alt="GCES Logo" className="w-10 h-10 sm:w-16 sm:h-16 object-contain drop-shadow-md" />
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={toggleTheme} className="text-white/80 hover:text-white p-2 sm:p-2.5 bg-white/10 hover:bg-white/20 rounded-[10px] border border-[var(--color-border)] shadow-sm transition-all cursor-pointer">
              {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
          </button>
          <button onClick={() => onNavigate ? onNavigate('/') : window.location.href = '/'} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-[10px] text-white/90 hover:text-white font-semibold bg-white/10 hover:bg-white/20 transition-all text-xs sm:text-sm cursor-pointer border border-[var(--color-border)] shadow-sm"><FiArrowLeft size={15} /> Back</button>
        </div>
      </header>
      

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-3 sm:px-4 py-6 sm:py-8 z-10">
        <div className="w-full max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full rounded-2xl sm:rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden relative p-4 sm:p-8 group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="relative z-10">
            {/* Header section inside card */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="flex justify-center mb-3 sm:mb-5"><img src={image} className="w-14 h-14 sm:w-20 sm:h-20 object-contain" alt="Logo"/></div>
              <h1 className="text-lg sm:text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">Government College of Engineering, Srirangam</h1>
              <h2 className="text-sm sm:text-lg text-[var(--color-btn-primary)] font-semibold mt-1 uppercase tracking-wider">Hostel Mess Reduction System</h2>
              
              <div className="w-full h-px bg-white/10 my-4 sm:my-8"></div>
              
              <h3 className="text-xl sm:text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">{TITLE}</h3>
              <p className="text-xs sm:text-base text-[var(--color-text-secondary)] mt-1 sm:mt-2 font-medium">Create your mess account</p>
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
                  <input id="regNo-input" type="text" placeholder="Register number (12 digits)" name="regNo" className={inp} value={formData.regNo} onChange={handleChange} maxLength={12} required />
                </Field>
                <Field label="Roll Number" icon={<FiHash />} error={!!error} id="rollNo-input">
                  <input id="rollNo-input" type="text" placeholder="Roll number" name="rollNo" className={disabledInp} value={formData.rollNo} readOnly required />
                </Field>
                <Field label="Date of Birth" icon={<FiCalendar />} error={!!error} id="dob-input">
                   <input id="dob-input" type="date" value={formData.dob} max={today} onChange={(e) => handleChange({ target: { name: "dob", value: e.target.value } })} required className={`${inp} cursor-pointer`} />
                </Field>
                <CustomSelect
                  label="Gender"
                  icon={<FiUser />}
                  name="gender"
                  id="gender-select"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  placeholder="Select Gender"
                  options={[
                    { value: "MALE", label: "Male" },
                    { value: "FEMALE", label: "Female" }
                  ]}
                  error={error && !formData.gender ? error : null}
                />
              </FormSection>

              {/* Section 2: Academic */}
              <FormSection delay={0.2} title="ACADEMIC INFORMATION" icon={<FiBookOpen size={20} />}>
                <div className="col-span-1 sm:col-span-2">
                  <CustomSelect
                    label="Department"
                    icon={<FiBookOpen />}
                    name="dept"
                    id="dept-select"
                    value={formData.dept}
                    onChange={handleChange}
                    required
                    placeholder="Select Department"
                    options={departmentOptions.length > 0 ? departmentOptions : ["CSE", "ECE", "EEE", "CIVIL", "MECH", "MECHATRONICS"].map(d => ({ value: d, label: d }))}
                    error={error && !formData.dept ? error : null}
                  />
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


              <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.4 }}>
                <button
                  type="submit"
                  disabled={loading}
                  className={`mt-2 flex-1 flex items-center justify-center gap-3 w-full rounded-xl py-4 text-lg font-semibold text-white bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] hover:bg-right shadow-sm hover:shadow-md transition-all duration-500 tracking-wide group cursor-pointer ${loading ? "opacity-50 cursor-not-allowed shadow-none hover:shadow-none hover:bg-left" : ""}`}
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
              className="mt-8 pt-6 border-t border-[var(--color-border)] text-center relative z-10"
            >
              <p className="text-sm text-[var(--color-text-secondary)] font-medium">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={goToLogin}
                  className="text-[var(--color-btn-primary)] font-bold hover:text-[var(--color-btn-primary-hover)] transition-colors duration-200 cursor-pointer ml-1"
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
        <p className="text-xs text-[var(--color-text-secondary)]/40 tracking-widest uppercase font-bold">© 2025 GCES · Student Portal</p>
      </footer>
    </div>
  )
}

export default Register