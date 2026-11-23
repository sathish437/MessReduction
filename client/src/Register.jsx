import React, { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { FiSun, FiUser, FiCreditCard, FiHash, FiCalendar, FiBookOpen, FiMail, FiPhone, FiArrowRight, FiCheckCircle, FiShield, FiLogIn } from "react-icons/fi"
import apiClient from "./api/apiClient"
import CustomSelect from "./CustomSelect"
import { getHostelVerificationEnabled } from "./services/authService"
import { getActiveDepartments } from "./api/departmentService"
import Toast from "./components/Toast"
import AuthShell from "./components/AuthShell"

function Field({ label, icon, error, className = "", children, id }) {
  return (
    <div className={`flex w-full flex-col gap-1.5 text-left ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="field-label select-none"
          style={error ? { color: 'var(--color-danger)' } : undefined}
        >
          {label}
        </label>
      )}
      <div
        className="field-shell w-full"
        style={error ? { borderColor: 'var(--color-danger-border)' } : undefined}
      >
        {icon && (
          <span
            className="shrink-0"
            style={{ color: error ? 'var(--color-danger)' : 'var(--theme-text-faint)' }}
          >
            {icon}
          </span>
        )}
        {children}
      </div>
    </div>
  )
}

function FormSection({ title, icon, delay, children }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="px-5 py-5 sm:px-6"
    >
      <div className="mb-4 flex items-center gap-2">
        <span style={{ color: 'var(--color-accent)' }}>{icon}</span>
        <h2 className="section-label" style={{ margin: 0 }}>{title}</h2>
      </div>
      <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
        {children}
      </div>
    </motion.section>
  )
}

const inp = "h-8 w-full min-w-0 flex-1 bg-transparent text-[13px] font-medium text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-faint)] focus:outline-none"
const disabledInp = "h-8 w-full min-w-0 flex-1 cursor-not-allowed bg-transparent text-[13px] font-medium text-[var(--theme-text-secondary)] focus:outline-none"

function Register({ onNavigate }) {
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
            regNo: verifiedData.registerNo || verifiedData.regNo || prev.regNo,
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
    if (!/[0-9]/.test(e.key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Enter"].includes(e.key))
      e.preventDefault();
  };

  const handleAlphaNumKey = (e) => {
    if (!/[a-zA-Z0-9]/.test(e.key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Enter"].includes(e.key))
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
    return (
      <AuthShell onNavigate={onNavigate} backTo="/" backLabel="Portal home" maxWidth="760px" footerNote="Student registration">
        <div className="panel p-6">
          <div className="skeleton h-4 w-40" />
          <div className="skeleton mt-3 h-3 w-64" />
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="skeleton h-11 w-full" />
            ))}
          </div>
        </div>
      </AuthShell>
    );
  }

  if (success) {
    return (
      <AuthShell onNavigate={onNavigate} backTo="/" backLabel="Portal home" maxWidth="440px" footerNote="Student registration">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="panel p-8 text-center"
        >
          <div
            className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: 'var(--color-success-soft)', color: 'var(--color-success)' }}
          >
            <FiCheckCircle size={26} />
          </div>
          <h1 className="text-[17px] font-semibold text-[var(--theme-text-primary)]">Registration successful</h1>
          <p className="mt-1.5 text-[13px] text-[var(--theme-text-secondary)]">
            Your student account has been created. Redirecting to sign in…
          </p>
        </motion.div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      onNavigate={onNavigate}
      backTo="/"
      backLabel="Portal home"
      maxWidth="760px"
      footerNote="Student registration"
    >
      <Toast toast={toast} onClose={() => setToast(null)} onLogin={goToLogin} />

      <div className="panel overflow-hidden">
        {/* Card header */}
        <header className="panel-header flex-col items-start gap-1">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--color-accent)' }}>
            Government College of Engineering, Srirangam
          </p>
          <h1 className="mt-0.5 text-[19px] font-semibold tracking-[-0.02em] text-[var(--theme-text-primary)]">
            Student registration
          </h1>
          <p className="text-[12.5px] text-[var(--theme-text-secondary)]">
            Create your account for the hostel mess reduction portal.
          </p>
          {isVerified && (
            <span className="badge badge-success mt-1.5">Hostel access verified</span>
          )}
        </header>

        <form onSubmit={handleSubmit} className="divide-y divide-[var(--theme-border)]">
          {/* Section 1: Personal */}
          <FormSection delay={0.05} title="Personal information" icon={<FiUser size={14} />}>
            <div className="sm:col-span-2">
              <Field label="Full name" icon={<FiUser size={14} />} error={!!error} id="name-input">
                <input id="name-input" type="text" placeholder="Enter your full name" name="name" className={inp} value={formData.name} onChange={handleChange} required />
              </Field>
            </div>
            <Field
              label={
                <span className="flex items-center justify-between gap-2">
                  <span>Register number</span>
                  <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--color-accent)' }}>
                    Read only
                  </span>
                </span>
              }
              icon={<FiCreditCard size={14} />}
              error={!!error}
              id="regNo-input"
            >
              <input id="regNo-input" type="text" placeholder="Register number (12 digits)" name="regNo" className={disabledInp} value={formData.regNo} readOnly required />
            </Field>
            <Field label="Roll number" icon={<FiHash size={14} />} error={!!error} id="rollNo-input">
              <input id="rollNo-input" type="text" placeholder="Roll number" name="rollNo" className={inp} value={formData.rollNo} onChange={handleChange} onKeyDown={handleAlphaNumKey} required />
            </Field>
            <Field label="Date of birth" icon={<FiCalendar size={14} />} error={!!error} id="dob-input">
              <input id="dob-input" type="date" value={formData.dob} max={today} onChange={(e) => handleChange({ target: { name: 'dob', value: e.target.value } })} required className={inp} />
            </Field>
            <CustomSelect
              label="Gender"
              icon={<FiUser />}
              name="gender"
              id="gender-select"
              value={formData.gender}
              onChange={handleChange}
              required
              placeholder="Select gender"
              options={[
                { value: 'MALE', label: 'Male' },
                { value: 'FEMALE', label: 'Female' }
              ]}
              error={error && !formData.gender ? error : null}
            />
          </FormSection>

          {/* Section 2: Academic */}
          <FormSection delay={0.1} title="Academic information" icon={<FiBookOpen size={14} />}>
            <div className="sm:col-span-2">
              <CustomSelect
                label="Department"
                icon={<FiBookOpen />}
                name="dept"
                id="dept-select"
                value={formData.dept}
                onChange={handleChange}
                required
                placeholder="Select department"
                options={departmentOptions.length > 0 ? departmentOptions : ['CSE', 'ECE', 'EEE', 'CIVIL', 'MECH', 'MECHATRONICS'].map(d => ({ value: d, label: d }))}
                error={error && !formData.dept ? error : null}
              />
            </div>
          </FormSection>

          {/* Section 3: Contact */}
          <FormSection delay={0.15} title="Contact information" icon={<FiMail size={14} />}>
            <Field label="Email address" icon={<FiMail size={14} />} error={!!error} id="email-input">
              <input id="email-input" type="email" placeholder="Email address" name="email" className={inp} value={formData.email} onChange={handleChange} required />
            </Field>
            <Field label="Phone number" icon={<FiPhone size={14} />} error={!!error} id="phone-input">
              <input id="phone-input" type="tel" inputMode="numeric" placeholder="Phone number" name="phone" className={inp} onKeyDown={handleNumKey} value={formData.phone} onChange={handleChange} required />
            </Field>
          </FormSection>

          {/* Actions */}
          <div className="flex flex-col gap-3 px-5 py-4 sm:px-6">
            <button type="submit" disabled={loading} className="btn btn-primary h-10 w-full text-[13px]">
              {loading ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Creating account…
                </>
              ) : (
                <>
                  Create account
                  <FiArrowRight size={15} />
                </>
              )}
            </button>

            <p className="text-center text-[12.5px] text-[var(--theme-text-secondary)]">
              Already have an account?{' '}
              <button
                type="button"
                onClick={goToLogin}
                className="font-semibold transition-colors hover:underline"
                style={{ color: 'var(--color-accent)' }}
              >
                Sign in
              </button>
            </p>
          </div>
        </form>
      </div>
    </AuthShell>
  )
}

export default Register
