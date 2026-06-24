import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    FiUser, FiHome, FiCreditCard, FiBookOpen, FiCalendar, 
    FiClock, FiPhone, FiInfo, FiArrowRight, FiFileText, FiEdit3, FiAlertTriangle,
    FiCheckCircle, FiXCircle
} from "react-icons/fi";
import apiClient from "./api/apiClient";

import image from "./assets/1000088399.png";

const TITLE = "MESS REDUCTION";

function Field({ icon, as: Component = "input", readOnly = false, children, ...props }) {
    return (
        <div className={`flex items-center gap-3 rounded-xl border border-white/8 bg-white/4 px-4 py-3.5 focus-within:border-teal-500/60 focus-within:bg-teal-950/20 transition-colors duration-200 ${readOnly ? 'opacity-70' : ''}`}>
            <span className="text-teal-400/60 shrink-0 text-base">{icon}</span>
            <Component
                className="flex-1 bg-transparent focus:outline-none text-lg text-white placeholder:text-white/25 font-medium appearance-none w-full"
                readOnly={readOnly}
                {...props}
            >
                {children}
            </Component>
        </div>
    )
}

function MessReductionPage() {
    const [formData, setFormData] = useState({
        name: "",
        id: "",
        room: "",
        dept: "",
        year: "",
        mobile: "",
        leaveDate: "",
        leaveTime: "",
        arrivalDate: "",
        arrivalTime: "",
        reason: "",
        otherReason: "",
        isEmergency: false
    });

    const [studentDetails, setStudentDetails] = useState(null);
    const [studentId, setStudentId] = useState(null);
    const [studentForm, setStudentForm] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [loading, setLoading] = useState(true)
    const [editingFormId, setEditingFormId] = useState(null)
    const [toast, setToast] = useState(null) // { message, type: 'success'|'error' }

    const activeRequest = Array.isArray(studentForm)
        ? studentForm.find(form => form.active === true || form.isActive === true)
        : null;

    const isSubmitBlocked = !!activeRequest && !editingFormId;

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // Initialize studentId from sessionStorage and ensure token exists
    useEffect(() => {
        const savedUser = sessionStorage.getItem("currentUser");
        const token = sessionStorage.getItem('token');
        if (!savedUser || !token) {
            setLoading(false);
            return;
        }
        try {
            const user = JSON.parse(savedUser);
            setStudentId(user.studentId);
        } catch (e) {
            console.error('Failed to parse savedUser', e);
            setLoading(false);
        }
    }, []);

    // Fetch student details when studentId becomes available
    useEffect(() => {
        if (!studentId) return;
        fetchStudentData(studentId);
    }, [studentId]);

    const fetchStudentData = async (studentId) => {
        try {
            console.log('[fetchStudentData] token:', sessionStorage.getItem('token'));
            console.log('[fetchStudentData] currentUser:', sessionStorage.getItem('currentUser'));

            // Use ONLY the Student endpoint which contains student details (and may include reductionForms)
            const studentRes = await apiClient.get(`/api/student-form/Student/${studentId}`);

            const currentStudent = studentRes?.data || null;
            if (currentStudent) {
                setStudentDetails(currentStudent);
                setFormData(prev => ({
                    ...prev,
                    name: currentStudent.name || "",
                    id: currentStudent.registerNo || "",
                    dept: currentStudent.department || "",
                    mobile: currentStudent.phoneNo || ""
                }));

                // Get forms from nested reductionForms if present
                const forms = Array.isArray(currentStudent.reductionForms) ? currentStudent.reductionForms : [];
                setStudentForm(forms);
            } else {
                setStudentDetails(null);
                setStudentForm([]);
            }
        } catch (error) {
            console.error("Error fetching student data:", error);
            try { console.error('Failed request headers:', error.config?.headers); } catch (e) {}
        } finally {
            setLoading(false);
        }
    };

    const getStatusDisplay = (status) => {
        const statusMap = {
            'PendingWarden': 'Pending Warden',
            'PendingDeputyWarden': 'Pending Deputy Warden',
            'PendingOffice': 'Pending Office',
            'Approved': 'Approved',
            'RejectedWarden': 'Rejected by Warden',
            'RejectedDeputyWarden': 'Rejected by Deputy Warden',
            'RejectedOffice': 'Rejected by Office'
        };
        return statusMap[status] || status;
    };

    const getStatusColor = (status) => {
        if (status === 'Approved') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        if (status?.startsWith('Rejected')) return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
        if (status?.startsWith('Pending')) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        return 'bg-white/5 text-white/60 border-white/10';
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
    };

    const handleEditRequest = (req) => {
        setEditingFormId(req.formId);
        
        const yearStrMap = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th" };
        const isStandardReason = ["Study Holidays", "Medical Leave"].includes(req.reason);
        
        setFormData(prev => ({
            ...prev,
            year: yearStrMap[req.year] || "1st",
            room: req.roomNo?.toString() || "",
            leaveDate: req.leaveDate || "",
            leaveTime: req.leaveTime || "",
            arrivalDate: req.arrivalDate || "",
            arrivalTime: req.arrivalTime || "",
            reason: isStandardReason ? req.reason : "other",
            otherReason: isStandardReason ? "" : req.reason,
            isEmergency: req.isEmergency || false
        }));
        
        // Scroll to form smoothly
        document.getElementById("form-section")?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (isSubmitBlocked) {
            showToast("You already have an active mess reduction request. New requests can be submitted after your arrival date and time.", 'error');
            return;
        }

        setIsSubmitting(true);

        const savedUser = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
        if (!savedUser.studentId) {
            alert("Session expired. Please login again.");
            setIsSubmitting(false);
            return;
        }

        // Map year string to number
        const yearMap = { "1st": 1, "2nd": 2, "3rd": 3, "4th": 4 };
        
        const submissionData = {
            year: yearMap[formData.year] || 1,
            roomNo: parseInt(formData.room) || 0,
            leaveDate: formData.leaveDate,
            leaveTime: formData.leaveTime.length === 5 ? `${formData.leaveTime}:00` : formData.leaveTime,
            arrivalDate: formData.arrivalDate,
            arrivalTime: formData.arrivalTime.length === 5 ? `${formData.arrivalTime}:00` : formData.arrivalTime,
            reason: formData.reason === "other" ? formData.otherReason : formData.reason,
            isEmergency: false
        };

        try {
            let response;
            if (editingFormId) {
                response = await apiClient.post(`/api/student-form/StudentForm/${savedUser.studentId}/${editingFormId}/resubmit`, submissionData);
            } else {
                response = await apiClient.post(`/api/student-form/StudentForm/${savedUser.studentId}`, submissionData);
            }

            if (response.status === 200 || response.status === 201) {
                showToast(editingFormId ? "✅ Form resubmitted successfully! Awaiting warden approval." : "✅ Form submitted successfully! Awaiting warden approval.", 'success');
                setEditingFormId(null);
                // Clear editable fields only
                setFormData(prev => ({
                    ...prev,
                    room: "",
                    year: "",
                    leaveDate: "",
                    leaveTime: "",
                    arrivalDate: "",
                    arrivalTime: "",
                    reason: "",
                    otherReason: "",
                    isEmergency: false
                }));
                // Refresh forms list
                fetchStudentData(savedUser.studentId);
            } else {
                showToast("Submission failed. Please try again.", 'error');
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            const errMsg = error.response?.data?.message || "Error submitting form. Ensure all fields are valid.";
            showToast(errMsg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-[#0a1628] text-white">
                <div className="text-center">
                    <div className="w-12 h-12 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white/40 text-sm font-bold tracking-widest">LOADING...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex flex-col font-sans bg-[#0a1628] text-white selection:bg-teal-500/30 relative">
            <div className="fixed inset-0 bg-[#0a1628] -z-10" />

            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -60 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -60 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border max-w-md w-full
                            ${toast.type === 'success' 
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}
                    >
                        {toast.type === 'success' 
                            ? <FiCheckCircle size={22} className="shrink-0 text-emerald-400" />
                            : <FiXCircle size={22} className="shrink-0 text-rose-400" />}
                        <p className="font-bold text-sm">{toast.message}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="w-full flex items-center justify-between gap-4 px-4 sm:px-8 py-4 border-b border-white/5 bg-[#0a1628]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <img src={image} alt="GCES Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
                    <div className="flex flex-col leading-tight">
                        <span className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-teal-400/80 uppercase">
                            Government College of Engineering
                        </span>
                        <span className="text-2xl sm:text-3xl font-black text-white tracking-widest">
                            SRIRANGAM
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">

                </div>
            </header>

            <div className="h-[2px] bg-gradient-to-r from-transparent via-teal-500/50 to-transparent shrink-0" />

            {/* Main Content */}
            <main className="flex-1 w-full flex flex-col items-center px-4 py-6 sm:py-8">
                <div className="w-full max-w-[600px] space-y-4">

                    {/* 1. Student Details (Auto-filled) */}
                    <div className="w-full rounded-2xl border border-white/8 bg-[#0f1f38] p-5 shadow-xl">
                        <h4 className="text-xs font-black text-teal-400/80 uppercase tracking-widest mb-3">Student Details (Auto-filled)</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Field icon={<FiUser />} type="text" placeholder="Full Name" name="name" value={formData.name} readOnly />
                            <Field icon={<FiCreditCard />} type="text" placeholder="Register No" name="id" value={formData.id} readOnly />
                            <Field icon={<FiBookOpen />} type="text" placeholder="Department" name="dept" value={formData.dept} readOnly />
                            <Field icon={<FiPhone />} type="tel" placeholder="Mobile Number" name="mobile" value={formData.mobile} readOnly />
                        </div>
                    </div>

                    {/* 2. Active Request Status (only when active request exists) */}
                    {activeRequest && (
                        <div className="w-full rounded-2xl border border-teal-500/30 bg-[#0f1f38] p-5 shadow-xl">
                            <h4 className="text-xs font-black text-teal-400 uppercase tracking-widest mb-3">Active Request Status</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-xs font-bold text-white/40 uppercase tracking-wider block">Current Status</span>
                                    <span className={`inline-block mt-1 px-3 py-1 rounded-md text-xs font-bold border ${getStatusColor(activeRequest.currentStatus)}`}>
                                        {getStatusDisplay(activeRequest.currentStatus)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-white/40 uppercase tracking-wider block">Assigned Deputy Warden</span>
                                    <span className="text-sm font-semibold text-white/90 block mt-1">{activeRequest.assignedDeputyWarden || "-"}</span>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-white/40 uppercase tracking-wider block">Leave Date</span>
                                    <span className="text-sm font-semibold text-white/90 block mt-1">{activeRequest.leaveDate}</span>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-white/40 uppercase tracking-wider block">Arrival Date</span>
                                    <span className="text-sm font-semibold text-white/90 block mt-1">{activeRequest.arrivalDate}</span>
                                </div>
                            </div>
                            
                            {((activeRequest.currentStatus)?.startsWith('Rejected')) && (
                                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-4">
                                    <span className="text-xs font-bold text-rose-400">Request rejected. You can edit and resubmit.</span>
                                    <button
                                        type="button"
                                        onClick={() => handleEditRequest(activeRequest)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-slate-900 rounded-md text-xs font-bold transition-colors"
                                    >
                                        <FiEdit3 size={14} /> Edit & Resubmit
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 3. New Request Form */}
                    <div id="form-section" className="w-full rounded-2xl border border-white/8 bg-[#0f1f38] shadow-xl overflow-hidden scroll-mt-24">
                        <div className="p-4 sm:p-6 border-b border-white/5 bg-white/[0.02]">
                            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                                {editingFormId ? "EDIT & RESUBMIT REQUEST" : "SUBMIT NEW REQUEST"}
                            </h3>
                            <p className="text-sm text-white/40 mt-1">
                                {editingFormId ? "Update your details and resubmit." : "Fill in your leave details below"}
                            </p>
                        </div>
                        
                        <div className="p-4 sm:p-6">
                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                
                                {/* Editable Leave Details */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/4 px-4 py-3 focus-within:border-teal-500/60 focus-within:bg-teal-950/20 transition-colors relative">
                                        <span className="text-teal-400/60 shrink-0"><FiCalendar size={18} /></span>
                                        <select
                                            name="year"
                                            value={formData.year}
                                            onChange={handleChange}
                                            required
                                            className="flex-1 bg-transparent focus:outline-none text-base text-white font-medium appearance-none w-full cursor-pointer"
                                        >
                                            <option value="" disabled className="text-white/40 bg-[#0f1f38]">Select Year</option>
                                            {["1st", "2nd", "3rd", "4th"].map(y => (
                                                <option key={y} value={y} className="bg-[#0f1f38] text-white">{y} Year</option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                                            <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                    <Field icon={<FiHome />} type="text" placeholder="Room No" name="room" value={formData.room} onChange={handleChange} required />
                                </div>

                                {/* Leave Date & Time */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Field
                                        icon={<FiCalendar />}
                                        type="text"
                                        placeholder="Leave Date"
                                        name="leaveDate"
                                        value={formData.leaveDate}
                                        onChange={handleChange}
                                        onFocus={(e) => (e.target.type = "date")}
                                        onBlur={(e) => { if (!e.target.value) e.target.type = "text"; }}
                                        required
                                    />
                                    <Field
                                        icon={<FiClock />}
                                        type="text"
                                        placeholder="Leave Time"
                                        name="leaveTime"
                                        value={formData.leaveTime}
                                        onChange={handleChange}
                                        onFocus={(e) => (e.target.type = "time")}
                                        onBlur={(e) => { if (!e.target.value) e.target.type = "text"; }}
                                        required
                                    />
                                </div>

                                {/* Arrival Date & Time */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Field
                                        icon={<FiCalendar />}
                                        type="text"
                                        placeholder="Arrival Date"
                                        name="arrivalDate"
                                        value={formData.arrivalDate}
                                        onChange={handleChange}
                                        onFocus={(e) => (e.target.type = "date")}
                                        onBlur={(e) => { if (!e.target.value) e.target.type = "text"; }}
                                        required
                                    />
                                    <Field
                                        icon={<FiClock />}
                                        type="text"
                                        placeholder="Arrival Time"
                                        name="arrivalTime"
                                        value={formData.arrivalTime}
                                        onChange={handleChange}
                                        onFocus={(e) => (e.target.type = "time")}
                                        onBlur={(e) => { if (!e.target.value) e.target.type = "text"; }}
                                        required
                                    />
                                </div>

                                {/* Reason */}
                                <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/4 px-4 py-3 focus-within:border-teal-500/60 focus-within:bg-teal-950/20 transition-colors relative">
                                    <span className="text-teal-400/60 shrink-0"><FiInfo size={18} /></span>
                                    <select
                                        name="reason"
                                        value={formData.reason}
                                        onChange={handleChange}
                                        required
                                        className="flex-1 bg-transparent focus:outline-none text-base text-white font-medium appearance-none w-full cursor-pointer"
                                    >
                                        <option value="" disabled className="text-white/40 bg-[#0f1f38]">Select Reason</option>
                                        <option value="Study Holidays" className="bg-[#0f1f38]">Study Holidays</option>
                                        <option value="Medical Leave" className="bg-[#0f1f38]">Medical Leave</option>
                                        <option value="other" className="bg-[#0f1f38]">Other Reason</option>
                                    </select>
                                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                                        <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>

                                {/* Other Reason (conditional) */}
                                <AnimatePresence>
                                    {formData.reason === "other" && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                        >
                                            <Field
                                                icon={<FiFileText />}
                                                type="text"
                                                placeholder="Enter your reason"
                                                name="otherReason"
                                                value={formData.otherReason}
                                                onChange={handleChange}
                                                required
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>


                                {/* Restriction Warning Block */}
                                {isSubmitBlocked && (
                                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex gap-3 text-amber-400">
                                        <FiAlertTriangle size={20} className="shrink-0 mt-0.5" />
                                        <p className="text-sm font-bold leading-normal">
                                            You already have an active mess reduction request. New requests can be submitted after your arrival date and time.
                                        </p>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <motion.button
                                    whileHover={isSubmitBlocked ? {} : { scale: 1.01 }}
                                    whileTap={isSubmitBlocked ? {} : { scale: 0.99 }}
                                    className={`mt-2 flex items-center justify-center gap-3 w-full rounded-xl py-3.5 text-base font-black text-slate-900 bg-gradient-to-r from-teal-400 to-emerald-400 hover:brightness-110 shadow-lg shadow-teal-900/30 transition-all duration-200 tracking-widest ${isSubmitting || isSubmitBlocked ? "opacity-50 cursor-not-allowed" : ""}`}
                                    type="submit"
                                    disabled={isSubmitting || isSubmitBlocked}
                                >
                                    {isSubmitting ? "SUBMITTING..." : (editingFormId ? "RESUBMIT REQUEST" : "SUBMIT REQUEST")} <FiArrowRight size={16} />
                                </motion.button>
                            </form>
                        </div>
                    </div>

                </div>
            </main>

            {/* Footer */}
            <footer className="shrink-0 pb-4 pt-2 text-center">
                <p className="text-xs text-white/15 tracking-widest uppercase font-bold">
                    © 2025 GCES · Mess Reduction Portal
                </p>
            </footer>
        </div>
    );
}

export default MessReductionPage;