import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    FiUser, FiHome, FiCreditCard, FiBookOpen, FiCalendar, FiHash,
    FiClock, FiPhone, FiInfo, FiArrowRight, FiFileText, FiEdit3, FiAlertTriangle,
    FiCheckCircle, FiXCircle, FiActivity, FiMapPin
} from "react-icons/fi";
import apiClient from "./api/apiClient";

import image from "./assets/1000088399.png";

const TITLE = "MESS REDUCTION";

function Field({ icon, as: Component = "input", readOnly = false, children, ...props }) {
    return (
        <div className={`flex items-center gap-3 rounded-xl border border-white/8 bg-black/20 px-4 py-3.5 focus-within:border-teal-500/60 focus-within:bg-teal-950/20 focus-within:shadow-[0_0_15px_rgba(20,184,166,0.1)] transition-all duration-300 relative group ${readOnly ? 'opacity-70 cursor-not-allowed bg-black/40' : ''}`}>
            <span className="text-teal-400/60 shrink-0 text-base group-focus-within:text-teal-400 transition-colors">{icon}</span>
            <Component
                className="flex-1 bg-transparent focus:outline-none text-base sm:text-lg text-white placeholder:text-white/30 font-medium appearance-none w-full"
                readOnly={readOnly}
                {...props}
            >
                {children}
            </Component>
        </div>
    )
}

function RequestTimeline({ tracking }) {
    if (!tracking) return null;

    const stages = [
        { id: "SUBMITTED", label: "Submitted" },
        { id: "DEPUTY_WARDEN", label: "Deputy Warden" },
        { id: "WARDEN", label: "Warden" },
        { id: "OFFICE", label: "Office" },
        { id: "COMPLETED", label: "Completed" }
    ];

    const currentStageIndex = stages.findIndex(s => s.id === tracking.currentStage);
    const isRejected = tracking.currentStage === "REJECTED";

    // Format date beautifully
    const formatDate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }),
            time: date.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: true })
        };
    };

    const getStageState = (index) => {
        if (isRejected) {
            // Find which stage rejected
            let rejectedIndex = 1; // Default deputy
            if (tracking.rejectedBy === "Warden") rejectedIndex = 2;
            if (tracking.rejectedBy === "Office") rejectedIndex = 3;

            if (index < rejectedIndex) return "completed";
            if (index === rejectedIndex) return "rejected";
            return "pending";
        }

        if (currentStageIndex === -1 && tracking.currentStatus === "Approved") {
             return "completed";
        }

        if (index < currentStageIndex) return "completed";
        if (index === currentStageIndex) return "current";
        // If it's completed, everything is completed
        if (tracking.currentStage === "COMPLETED") return "completed";
        
        return "pending";
    };

    const getStageDetails = (stageId) => {
        if (stageId === "SUBMITTED") {
            const time = formatDate(tracking.submittedTime);
            return time ? (
                <div className="mt-2 text-center text-xs">
                    <div className="text-white/80 font-medium">{time.date}</div>
                    <div className="text-white/50">{time.time}</div>
                </div>
            ) : null;
        }
        if (stageId === "DEPUTY_WARDEN") {
            if (isRejected && tracking.rejectedBy === "DeputyWarden") {
                const time = formatDate(tracking.rejectedTime);
                return (
                    <div className="mt-2 text-center text-xs">
                        <div className="text-rose-400 font-bold mb-1">Rejected</div>
                        {time && <><div className="text-white/70">{time.date}</div><div className="text-white/50">{time.time}</div></>}
                    </div>
                );
            }
            if (tracking.deputyApprovalTime) {
                const time = formatDate(tracking.deputyApprovalTime);
                return (
                    <div className="mt-2 text-center text-xs">
                        <div className="text-emerald-400 font-medium mb-1 truncate max-w-[100px]" title={tracking.deputyWardenName}>{tracking.deputyWardenName}</div>
                        {time && <><div className="text-white/70">{time.date}</div><div className="text-white/50">{time.time}</div></>}
                    </div>
                );
            }
        }
        if (stageId === "WARDEN") {
            if (isRejected && tracking.rejectedBy === "Warden") {
                const time = formatDate(tracking.rejectedTime);
                return (
                    <div className="mt-2 text-center text-xs">
                        <div className="text-rose-400 font-bold mb-1">Rejected</div>
                        {time && <><div className="text-white/70">{time.date}</div><div className="text-white/50">{time.time}</div></>}
                    </div>
                );
            }
            if (tracking.wardenApprovalTime) {
                const time = formatDate(tracking.wardenApprovalTime);
                return (
                    <div className="mt-2 text-center text-xs">
                        <div className="text-emerald-400 font-medium mb-1 truncate max-w-[100px]" title={tracking.wardenName}>{tracking.wardenName}</div>
                        {time && <><div className="text-white/70">{time.date}</div><div className="text-white/50">{time.time}</div></>}
                    </div>
                );
            }
        }
        if (stageId === "OFFICE") {
            if (isRejected && tracking.rejectedBy === "Office") {
                const time = formatDate(tracking.rejectedTime);
                return (
                    <div className="mt-2 text-center text-xs">
                        <div className="text-rose-400 font-bold mb-1">Rejected</div>
                        {time && <><div className="text-white/70">{time.date}</div><div className="text-white/50">{time.time}</div></>}
                    </div>
                );
            }
            if (tracking.officeApprovalTime) {
                const time = formatDate(tracking.officeApprovalTime);
                return (
                    <div className="mt-2 text-center text-xs">
                        {tracking.isAutoAccepted ? (
                            <div className="text-emerald-400/80 italic font-medium mb-1">Auto Accepted</div>
                        ) : (
                            <div className="text-emerald-400 font-medium mb-1 truncate max-w-[100px]" title={tracking.officeName}>{tracking.officeName}</div>
                        )}
                        {time && <><div className="text-white/70">{time.date}</div><div className="text-white/50">{time.time}</div></>}
                    </div>
                );
            }
        }
        
        return null;
    };

    return (
        <div className="w-full mt-2 mb-6">
            <div className="overflow-x-auto pb-4 scrollbar-hide">
                <div className="min-w-[500px] px-4">
                    <div className="flex items-center justify-between relative">
                        {/* Connecting Lines Background */}
                        <div className="absolute top-4 left-0 w-full h-1 bg-white/10 -z-10 rounded-full"></div>
                        
                        {/* Active Line */}
                        <div 
                            className="absolute top-4 left-0 h-1 bg-gradient-to-r from-teal-400 to-emerald-400 -z-10 transition-all duration-700 ease-in-out rounded-full"
                            style={{ 
                                width: isRejected 
                                    ? `${(stages.findIndex(s => s.label.replace(' ', '') === tracking.rejectedBy) || 1) * 25}%` 
                                    : (tracking.currentStage === "COMPLETED" ? '100%' : `${currentStageIndex * 25}%`) 
                            }}
                        ></div>

                        {stages.map((stage, index) => {
                            const state = getStageState(index);
                            
                            // Colors
                            let bgColor = "bg-[#0a1628]";
                            let borderColor = "border-white/20";
                            let iconColor = "text-white/30";
                            let titleColor = "text-white/40";
                            
                            if (state === "completed") {
                                bgColor = "bg-emerald-500";
                                borderColor = "border-emerald-500";
                                iconColor = "text-white";
                                titleColor = "text-emerald-400 font-bold";
                            } else if (state === "current") {
                                bgColor = "bg-[#0a1628]";
                                borderColor = "border-amber-400";
                                iconColor = "text-amber-400";
                                titleColor = "text-amber-400 font-bold";
                            } else if (state === "rejected") {
                                bgColor = "bg-rose-500";
                                borderColor = "border-rose-500";
                                iconColor = "text-white";
                                titleColor = "text-rose-400 font-bold";
                            }

                            return (
                                <div key={stage.id} className="flex flex-col items-center relative z-10 w-24">
                                    <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-colors duration-500 ${bgColor} ${borderColor} shadow-lg shadow-black/50`}>
                                        {state === "completed" && <FiCheckCircle size={18} className={iconColor} />}
                                        {state === "current" && <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>}
                                        {state === "pending" && <div className="w-2.5 h-2.5 bg-white/20 rounded-full"></div>}
                                        {state === "rejected" && <FiXCircle size={18} className={iconColor} />}
                                    </div>
                                    <div className={`mt-3 text-[11px] uppercase tracking-wider text-center ${titleColor}`}>
                                        {stage.label}
                                    </div>
                                    {getStageDetails(stage.id)}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            
            {isRejected && tracking.rejectionReason && (
                <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
                    <span className="font-bold">Rejection Reason:</span> {tracking.rejectionReason}
                </div>
            )}
        </div>
    );
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
    const [trackingDetails, setTrackingDetails] = useState(null)

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
            // Use ONLY the Student endpoint which contains student details (and may include reductionForms)
            const studentRes = await apiClient.get(`/api/student-form/Student/${studentId}`);

            const currentStudent = studentRes?.data || null;
            if (currentStudent) {
                setStudentDetails(currentStudent);
                setFormData(prev => ({
                    ...prev,
                    name: currentStudent.name || "",
                    id: currentStudent.registerNo || "",
                    rollNo: currentStudent.rollNo || "",
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

    useEffect(() => {
        if (activeRequest && activeRequest.formId) {
            const fetchTracking = async () => {
                try {
                    const res = await apiClient.get(`/api/student-form/StudentForm/${studentId}/${activeRequest.formId}/tracking`);
                    setTrackingDetails(res.data);
                } catch (error) {
                    console.error("Error fetching tracking details:", error);
                }
            };
            fetchTracking();
        } else {
            setTrackingDetails(null);
        }
    }, [activeRequest?.formId, studentId]);

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
        <div className="min-h-screen w-full flex flex-col font-sans bg-[#0a1628] text-white selection:bg-teal-500/30 relative overflow-hidden">
            <div className="fixed inset-0 bg-[#0a1628] -z-20" />
            <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-teal-600/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
            <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

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
            <main className="flex-1 w-full flex flex-col items-center px-4 py-8 sm:py-12 z-10">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, staggerChildren: 0.1 }}
                    className="w-full max-w-[650px] space-y-6"
                >

                    {/* 1. Student Details (Auto-filled) */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 sm:p-8 shadow-2xl relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        <div className="flex items-center gap-3 mb-6 relative z-10">
                            <div className="p-2 bg-teal-500/20 rounded-lg">
                                <FiUser className="text-teal-400" size={20} />
                            </div>
                            <h4 className="text-sm font-black text-white/90 uppercase tracking-widest">Student Profile</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                            <Field icon={<FiUser />} type="text" placeholder="Full Name" name="name" value={formData.name} readOnly />
                            <Field icon={<FiCreditCard />} type="text" placeholder="Register No" name="id" value={formData.id} readOnly />
                            <Field icon={<FiHash />} type="text" placeholder="Roll No" name="rollNo" value={formData.rollNo || ""} readOnly />
                            <Field icon={<FiBookOpen />} type="text" placeholder="Department" name="dept" value={formData.dept} readOnly />
                            <Field icon={<FiPhone />} type="tel" placeholder="Mobile Number" name="mobile" value={formData.mobile} readOnly />
                        </div>
                    </motion.div>

                    {/* 2. Active Request Status (only when active request exists) */}
                    {activeRequest && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full rounded-3xl border border-teal-500/30 bg-teal-950/20 backdrop-blur-xl p-6 sm:p-8 shadow-[0_0_40px_0_rgba(20,184,166,0.15)] relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-emerald-400" />
                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-teal-500/20 rounded-lg">
                                        <FiActivity className="text-teal-400" size={20} />
                                    </div>
                                    <h4 className="text-sm font-black text-teal-400 uppercase tracking-widest">Active Request</h4>
                                </div>
                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold border backdrop-blur-md shadow-sm ${getStatusColor(activeRequest.currentStatus)}`}>
                                    {getStatusDisplay(activeRequest.currentStatus)}
                                </span>
                            </div>

                            <RequestTimeline tracking={trackingDetails} />

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-black/20 p-5 rounded-2xl border border-white/5 relative z-10">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5"><FiUser size={12}/> Deputy Warden</span>
                                    <span className="text-base font-semibold text-white/90">{activeRequest.assignedDeputyWarden || "Unassigned"}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5"><FiCalendar size={12}/> Leave Date</span>
                                    <span className="text-base font-semibold text-white/90">{activeRequest.leaveDate}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5"><FiCalendar size={12}/> Arrival Date</span>
                                    <span className="text-base font-semibold text-white/90">{activeRequest.arrivalDate}</span>
                                </div>
                            </div>
                            
                            {((activeRequest.currentStatus)?.startsWith('Rejected')) && (
                                <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-rose-500/5 p-4 rounded-xl border border-rose-500/20 relative z-10">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-3 text-rose-400">
                                            <FiAlertTriangle size={18} className="shrink-0" />
                                            <span className="text-sm font-bold">Request rejected. You can edit and resubmit.</span>
                                        </div>
                                        {activeRequest.rejectReason && (
                                            <div className="pl-[30px] text-sm font-medium text-rose-300/80">
                                                <span className="text-rose-400/70 font-bold uppercase tracking-wider text-xs">Reason: </span>
                                                {activeRequest.rejectReason}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleEditRequest(activeRequest)}
                                        className="w-full sm:w-auto flex justify-center items-center gap-2 px-5 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-sm font-bold transition-all"
                                    >
                                        <FiEdit3 size={16} /> Edit and Resubmit
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* 3. New Request Form */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        id="form-section" 
                        className="w-full rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-2xl overflow-hidden scroll-mt-24 relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] via-transparent to-white/[0.01] pointer-events-none" />
                        <div className="p-6 sm:p-8 border-b border-white/5 bg-white/[0.01] relative z-10">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-xl shadow-[0_0_20px_rgba(45,212,191,0.3)] text-slate-900">
                                    {editingFormId ? <FiEdit3 size={24} /> : <FiFileText size={24} />}
                                </div>
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                                        {editingFormId ? "EDIT REQUEST" : "NEW REQUEST"}
                                    </h3>
                                    <p className="text-sm text-white/50 font-medium">
                                        {editingFormId ? "Update details and resubmit." : "Fill in your leave details below"}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6 sm:p-8 relative z-10">
                            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                                
                                {/* Editable Leave Details */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-black/20 px-4 py-3.5 focus-within:border-teal-500/60 focus-within:bg-teal-950/20 focus-within:shadow-[0_0_15px_rgba(20,184,166,0.1)] transition-all duration-300 relative group">
                                        <span className="text-teal-400/60 shrink-0 group-focus-within:text-teal-400 transition-colors"><FiCalendar size={18} /></span>
                                        <select
                                            name="year"
                                            value={formData.year}
                                            onChange={handleChange}
                                            required
                                            className="flex-1 bg-transparent focus:outline-none text-base sm:text-lg text-white font-medium appearance-none w-full cursor-pointer"
                                        >
                                            <option value="" disabled className="text-white/40 bg-[#0f1f38]">Select Year</option>
                                            {["1st", "2nd", "3rd", "4th"].map(y => (
                                                <option key={y} value={y} className="bg-[#0f1f38] text-white">{y} Year</option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                                            <svg className="w-4 h-4 text-white/30 group-focus-within:text-teal-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                    <Field icon={<FiMapPin />} type="number" placeholder="Room No" name="room" value={formData.room} onChange={handleChange} min="1" required />
                                </div>

                                {/* Leave Date & Time */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field
                                        icon={<FiCalendar />}
                                        type="text"
                                        placeholder="Leave Date"
                                        name="leaveDate"
                                        value={formData.leaveDate}
                                        onChange={handleChange}
                                        min={new Date().toISOString().split('T')[0]}
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field
                                        icon={<FiCalendar />}
                                        type="text"
                                        placeholder="Arrival Date"
                                        name="arrivalDate"
                                        value={formData.arrivalDate}
                                        onChange={handleChange}
                                        min={formData.leaveDate || new Date().toISOString().split('T')[0]}
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
                                <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-black/20 px-4 py-3.5 focus-within:border-teal-500/60 focus-within:bg-teal-950/20 focus-within:shadow-[0_0_15px_rgba(20,184,166,0.1)] transition-all duration-300 relative group">
                                    <span className="text-teal-400/60 shrink-0 group-focus-within:text-teal-400 transition-colors"><FiInfo size={18} /></span>
                                    <select
                                        name="reason"
                                        value={formData.reason}
                                        onChange={handleChange}
                                        required
                                        className="flex-1 bg-transparent focus:outline-none text-base sm:text-lg text-white font-medium appearance-none w-full cursor-pointer"
                                    >
                                        <option value="" disabled className="text-white/40 bg-[#0f1f38]">Select Reason</option>
                                        <option value="Study Holidays" className="bg-[#0f1f38]">Study Holidays</option>
                                        <option value="Medical Leave" className="bg-[#0f1f38]">Medical Leave</option>
                                        <option value="other" className="bg-[#0f1f38]">Other Reason</option>
                                    </select>
                                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                                        <svg className="w-4 h-4 text-white/30 group-focus-within:text-teal-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
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
                                    whileHover={isSubmitBlocked ? {} : { scale: 1.02, y: -2 }}
                                    whileTap={isSubmitBlocked ? {} : { scale: 0.98 }}
                                    className={`mt-4 flex items-center justify-center gap-3 w-full rounded-xl py-4 text-base font-black text-slate-900 bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-400 bg-[length:200%_auto] hover:bg-right shadow-[0_0_20px_rgba(45,212,191,0.3)] hover:shadow-[0_0_30px_rgba(45,212,191,0.5)] transition-all duration-500 tracking-widest ${isSubmitting || isSubmitBlocked ? "opacity-50 cursor-not-allowed shadow-none hover:shadow-none hover:bg-left" : ""}`}
                                    type="submit"
                                    disabled={isSubmitting || isSubmitBlocked}
                                >
                                    {isSubmitting ? "PROCESSING..." : (editingFormId ? "RESUBMIT REQUEST" : "SUBMIT REQUEST")} <FiArrowRight size={18} className={isSubmitting ? "animate-pulse" : ""} />
                                </motion.button>
                            </form>
                        </div>
                    </motion.div>

                </motion.div>
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