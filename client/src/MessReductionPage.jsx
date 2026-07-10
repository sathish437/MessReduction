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

function Field({ label, icon, as: Component = "input", readOnly = false, children, error, ...props }) {
    const id = props.id || props.name;
    const isSelect = Component === "select";
    return (
        <div className="flex flex-col gap-1.5 w-full text-left">
            {label && (
                <label htmlFor={id} className="text-sm font-semibold tracking-wide text-white/80 select-none">
                    {label}
                </label>
            )}
            <div className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-all duration-300 relative group 
                ${readOnly ? 'opacity-70 cursor-not-allowed bg-black/40 border-white/5' : 'bg-black/20'} 
                ${error ? 'border-rose-500/50 bg-rose-500/5 focus-within:border-rose-400' : 'border-white/8 focus-within:border-teal-500/60 focus-within:bg-teal-950/10 focus-within:shadow-[0_0_15px_rgba(20,184,166,0.1)]'}`}>
                {icon && <span className={`shrink-0 text-base transition-colors ${error ? 'text-rose-400' : 'text-teal-400/60 group-focus-within:text-teal-400'}`}>{icon}</span>}
                <Component
                    id={id}
                    className={`flex-1 bg-transparent focus:outline-none text-base text-white placeholder:text-white/40 font-medium w-full ${isSelect ? 'appearance-none cursor-pointer pr-8' : 'appearance-none'}`}
                    readOnly={readOnly}
                    {...props}
                >
                    {children}
                </Component>
                {isSelect && (
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                        <svg className="w-4 h-4 text-white/30 group-focus-within:text-teal-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                )}
            </div>
            {error && (
                <span className="text-xs font-semibold text-rose-400 tracking-wide mt-1 pl-1">
                    {error}
                </span>
            )}
        </div>
    )
}

function RequestTimeline({ tracking, activeRequest, onEditRequest }) {
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

        // If it's completed, everything is completed (green)
        if (tracking.currentStage === "COMPLETED") return "completed";

        if (index < currentStageIndex) return "completed";
        if (index === currentStageIndex) return "current";

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
            {/* Desktop and Tablet Horizontal Workflow (screens >= 768px) */}
            <div className="hidden md:block">
                <div className="tracking-container scrollbar-hide">
                    {stages.map((stage, index) => {
                        const state = getStageState(index);

                        let circleContent = state === "completed" ? "✓" : (index + 1);
                        if (state === "rejected") circleContent = "✕";

                        let nextState = "pending";
                        if (index < stages.length - 1) {
                            nextState = getStageState(index + 1);
                        }

                        return (
                            <React.Fragment key={stage.id}>
                                <div className="step">
                                    <div className={`circle ${state}`}>
                                        {circleContent}
                                    </div>
                                    <div className={`mt-1 text-[11px] font-bold uppercase tracking-wider ${state === 'rejected' ? 'text-rose-400' : (state === 'completed' ? 'text-emerald-400' : (state === 'current' ? 'text-amber-400' : 'text-white/40'))}`}>
                                        {stage.label}
                                    </div>
                                    {getStageDetails(stage.id)}
                                </div>

                                {index < stages.length - 1 && (
                                    <div className={`line ${nextState}`}></div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Mobile Vertical Timeline (screens < 768px) */}
            <div className="block md:hidden space-y-6 pl-2">
                {stages.map((stage, index) => {
                    const state = getStageState(index);
                    const isCompleted = state === "completed";
                    const isCurrent = state === "current";
                    const isRejectedState = state === "rejected";

                    let dotColorClass = "bg-white/10 text-white/30 border-white/5";
                    let checkIcon = null;

                    if (isCompleted) {
                        dotColorClass = "bg-emerald-500 text-white border-emerald-400";
                        checkIcon = "✓";
                    } else if (isRejectedState) {
                        dotColorClass = "bg-rose-500 text-white border-rose-400";
                        checkIcon = "✕";
                    } else if (isCurrent) {
                        dotColorClass = "bg-amber-500 text-slate-900 border-amber-400 font-bold";
                        checkIcon = "⏳";
                    } else {
                        checkIcon = index + 1;
                    }

                    let staffName = "";
                    let dateTimeObj = null;

                    if (stage.id === "SUBMITTED") {
                        dateTimeObj = formatDate(tracking.submittedTime);
                        staffName = "SYSTEM";
                    } else if (stage.id === "DEPUTY_WARDEN") {
                        if (isRejectedState && tracking.rejectedBy === "DeputyWarden") {
                            dateTimeObj = formatDate(tracking.rejectedTime);
                            staffName = tracking.deputyWardenName || "Deputy Warden";
                        } else if (tracking.deputyApprovalTime) {
                            dateTimeObj = formatDate(tracking.deputyApprovalTime);
                            staffName = tracking.deputyWardenName || "Deputy Warden";
                        }
                    } else if (stage.id === "WARDEN") {
                        if (isRejectedState && tracking.rejectedBy === "Warden") {
                            dateTimeObj = formatDate(tracking.rejectedTime);
                            staffName = tracking.wardenName || "Warden";
                        } else if (tracking.wardenApprovalTime) {
                            dateTimeObj = formatDate(tracking.wardenApprovalTime);
                            staffName = tracking.wardenName || "Warden";
                        }
                    } else if (stage.id === "OFFICE") {
                        if (isRejectedState && tracking.rejectedBy === "Office") {
                            dateTimeObj = formatDate(tracking.rejectedTime);
                            staffName = tracking.officeName || "Office";
                        } else if (tracking.officeApprovalTime) {
                            dateTimeObj = formatDate(tracking.officeApprovalTime);
                            staffName = tracking.isAutoAccepted ? "SYSTEM" : (tracking.officeName || "Office");
                        }
                    }

                    return (
                        <div key={stage.id} className="flex gap-4 items-start relative">
                            {/* Connector Line behind the dot */}
                            {index < stages.length - 1 && (
                                <div 
                                    className="absolute left-[11px] top-6 w-0.5 transition-all"
                                    style={{ 
                                        height: 'calc(100% + 12px)',
                                        background: getStageState(index + 1) === "completed" 
                                            ? "#10b981" 
                                            : (getStageState(index + 1) === "current" ? "#f59e0b" : "rgba(255, 255, 255, 0.1)")
                                    }}
                                />
                            )}
                            
                            {/* Dot */}
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors z-10 flex-shrink-0 ${dotColorClass}`}>
                                {checkIcon}
                            </div>

                            {/* Right text layout directly next to the dot (no border boxes) */}
                            <div className="flex-1 min-w-0 pt-0.5 text-left">
                                <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center flex-wrap gap-2">
                                        <span className={`text-sm font-semibold tracking-wide ${isRejectedState ? 'text-rose-400' : (isCompleted ? 'text-emerald-400' : (isCurrent ? 'text-amber-400' : 'text-white/40'))}`}>
                                            {stage.label}
                                        </span>
                                        {staffName && (
                                            <span className="text-xs text-white/40 font-normal">
                                                • {staffName}
                                            </span>
                                        )}
                                    </div>
                                    {dateTimeObj && (
                                        <div className="text-[11px] text-white/30 flex gap-2">
                                            <span>{dateTimeObj.date}</span>
                                            <span>{dateTimeObj.time}</span>
                                        </div>
                                    )}
                                </div>

                                {isRejectedState && (
                                    <div className="mt-2 max-w-sm">
                                        {tracking.rejectionReason && (
                                            <div className="text-xs text-rose-300 bg-rose-500/5 border border-rose-500/10 rounded-xl p-3">
                                                <span className="font-bold text-rose-400/80 uppercase tracking-wider text-[10px] block mb-1">Reason:</span>
                                                {tracking.rejectionReason}
                                            </div>
                                        )}
                                        {onEditRequest && activeRequest && (
                                            <button
                                                type="button"
                                                onClick={() => onEditRequest(activeRequest)}
                                                className="mt-2 flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                            >
                                                <FiEdit3 size={13} /> Edit and Resubmit
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {isRejected && tracking.rejectionReason && (
                <div className="hidden md:block mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
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
    const [formErrors, setFormErrors] = useState({});

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
            try { console.error('Failed request headers:', error.config?.headers); } catch (e) { }
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
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: ""
            }));
        }
    };

    const handleEditRequest = (req) => {
        setEditingFormId(req.formId);
        setFormErrors({});

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

    const handleReset = () => {
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
        setEditingFormId(null);
        setFormErrors({});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Room number validation (Starts with 4, second digit is 0,1,2, or 3, length is 4, 5, or 6 digits)
        const roomVal = formData.room ? formData.room.toString().trim() : "";
        const roomRegex = /^4[0-3]\d{2,4}$/;
        if (!roomRegex.test(roomVal)) {
            setFormErrors({ room: "Room number must start with 4, second digit must be 0, 1, 2, or 3, and contain 4 to 6 digits." });
            showToast("Room number must start with 4, second digit must be 0, 1, 2, or 3, and contain 4 to 6 digits.", 'error');
            return;
        } else {
            setFormErrors({});
        }

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
                    <p className="text-white/40 text-sm font-bold tracking-widest">Fetching data...</p>
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
                        <span className="text-xl sm:text-2xl font-bold text-white tracking-widest">
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
                            <h4 className="text-base font-semibold text-white/90 uppercase tracking-wider">Student Profile</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                            <Field label="Full Name" icon={<FiUser />} type="text" placeholder="Full Name" name="name" value={formData.name} readOnly />
                            <Field label="Register No" icon={<FiCreditCard />} type="text" placeholder="Register No" name="id" value={formData.id} readOnly />
                            <Field label="Roll No" icon={<FiHash />} type="text" placeholder="Roll No" name="rollNo" value={formData.rollNo || ""} readOnly />
                            <Field label="Department" icon={<FiBookOpen />} type="text" placeholder="Department" name="dept" value={formData.dept} readOnly />
                            <Field label="Mobile Number" icon={<FiPhone />} type="tel" placeholder="Mobile Number" name="mobile" value={formData.mobile} readOnly />
                        </div>
                    </motion.div>

                    {/* 2. Active Request Status (only when active request exists) */}
                    {activeRequest && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full rounded-2xl border border-teal-500/20 bg-teal-500/5 p-6 sm:p-8 shadow-sm relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-emerald-400" />
                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-teal-500/20 rounded-lg">
                                        <FiActivity className="text-teal-400" size={20} />
                                    </div>
                                    <h4 className="text-base font-semibold text-teal-400 uppercase tracking-wider">Active Request</h4>
                                </div>
                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold border backdrop-blur-md shadow-sm ${getStatusColor(activeRequest.currentStatus)}`}>
                                    {getStatusDisplay(activeRequest.currentStatus)}
                                </span>
                            </div>

                            <RequestTimeline tracking={trackingDetails} activeRequest={activeRequest} onEditRequest={handleEditRequest} />

                            {/* Desktop Details Layout */}
                            <div className="hidden md:grid grid-cols-3 gap-6 bg-black/20 p-5 rounded-2xl border border-white/5 relative z-10">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5"><FiUser size={12} /> Deputy Warden</span>
                                    <span className="text-base font-semibold text-white/90">{activeRequest.assignedDeputyWarden || "Unassigned"}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5"><FiCalendar size={12} /> Leave Date</span>
                                    <span className="text-base font-semibold text-white/90">{activeRequest.leaveDate}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5"><FiCalendar size={12} /> Arrival Date</span>
                                    <span className="text-base font-semibold text-white/90">{activeRequest.arrivalDate}</span>
                                </div>
                            </div>

                            {/* Mobile Details Layout */}
                            <div className="block md:hidden space-y-3 relative z-10">
                                <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col gap-1.5">
                                    <span className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5"><FiUser size={12} /> Assigned Deputy Warden</span>
                                    <span className="text-sm font-semibold text-white/90">{activeRequest.assignedDeputyWarden || "Unassigned"}</span>
                                </div>
                                <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col gap-1.5">
                                    <span className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5"><FiCalendar size={12} /> Leave Date</span>
                                    <span className="text-sm font-semibold text-white/90">{activeRequest.leaveDate}</span>
                                </div>
                                <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col gap-1.5">
                                    <span className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5"><FiCalendar size={12} /> Arrival Date</span>
                                    <span className="text-sm font-semibold text-white/90">{activeRequest.arrivalDate}</span>
                                </div>
                            </div>

                            {((activeRequest.currentStatus)?.startsWith('Rejected')) && (
                                <div className="hidden md:flex flex-col sm:flex-row items-center justify-between gap-4 bg-rose-500/5 p-4 rounded-xl border border-rose-500/20 relative z-10 mt-5 pt-4 border-t border-white/10">
                                    <div className="flex flex-col gap-1.5 text-left">
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
                                <div className="p-3 bg-teal-500 text-slate-950 rounded-xl border border-teal-400/20 shadow-sm">
                                    {editingFormId ? <FiEdit3 size={24} /> : <FiFileText size={24} />}
                                </div>
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                                        {editingFormId ? "EDIT REQUEST" : "NEW REQUEST"}
                                    </h3>
                                    <p className="text-sm text-white/50 font-medium">
                                        {editingFormId ? "Update details and resubmit." : "Fill in your leave details below"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 sm:p-8 relative z-10">
                            <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                                {/* Editable Leave Details */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <Field
                                        as="select"
                                        label="Year of Study"
                                        icon={<FiCalendar size={18} />}
                                        name="year"
                                        value={formData.year}
                                        onChange={handleChange}
                                        required
                                        id="year-select"
                                    >
                                        <option value="" disabled className="text-white/40 bg-[#0f1f38]">Select Year</option>
                                        {["1st", "2nd", "3rd", "4th"].map(y => (
                                            <option key={y} value={y} className="bg-[#0f1f38] text-white">{y} Year</option>
                                        ))}
                                    </Field>
                                    <Field
                                        label="Room Number"
                                        icon={<FiMapPin />}
                                        type="number"
                                        placeholder="Room No"
                                        name="room"
                                        value={formData.room}
                                        onChange={handleChange}
                                        min="1"
                                        required
                                        id="room-input"
                                        error={formErrors.room}
                                    />
                                </div>

                                {/* Leave Date & Time */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <Field
                                        label="Leave Date"
                                        icon={<FiCalendar />}
                                        type="date"
                                        name="leaveDate"
                                        value={formData.leaveDate}
                                        onChange={handleChange}
                                        min={new Date().toISOString().split('T')[0]}
                                        required
                                        id="leave-date-input"
                                    />
                                    <Field
                                        label="Leave Time"
                                        icon={<FiClock />}
                                        type="time"
                                        name="leaveTime"
                                        value={formData.leaveTime}
                                        onChange={handleChange}
                                        required
                                        id="leave-time-input"
                                    />
                                </div>

                                {/* Arrival Date & Time */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <Field
                                        label="Arrival Date"
                                        icon={<FiCalendar />}
                                        type="date"
                                        name="arrivalDate"
                                        value={formData.arrivalDate}
                                        onChange={handleChange}
                                        min={formData.leaveDate || new Date().toISOString().split('T')[0]}
                                        required
                                        id="arrival-date-input"
                                    />
                                    <Field
                                        label="Arrival Time"
                                        icon={<FiClock />}
                                        type="time"
                                        name="arrivalTime"
                                        value={formData.arrivalTime}
                                        onChange={handleChange}
                                        required
                                        id="arrival-time-input"
                                    />
                                </div>

                                {/* Reason */}
                                <Field
                                    as="select"
                                    label="Reason for Leave"
                                    icon={<FiInfo size={18} />}
                                    name="reason"
                                    value={formData.reason}
                                    onChange={handleChange}
                                    required
                                    id="reason-select"
                                >
                                    <option value="" disabled className="text-white/40 bg-[#0f1f38]">Select Reason</option>
                                    <option value="Study Holidays" className="bg-[#0f1f38]">Study Holidays</option>
                                    <option value="Medical Leave" className="bg-[#0f1f38]">Medical Leave</option>
                                    <option value="other" className="bg-[#0f1f38]">Other Reason</option>
                                </Field>

                                {/* Other Reason (conditional) */}
                                <AnimatePresence>
                                    {formData.reason === "other" && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                        >
                                            <Field
                                                label="Specify Reason"
                                                icon={<FiFileText />}
                                                type="text"
                                                placeholder="Enter your reason"
                                                name="otherReason"
                                                value={formData.otherReason}
                                                onChange={handleChange}
                                                required
                                                id="other-reason-input"
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

                                {/* Buttons Container */}
                                <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 w-full">
                                    <motion.button
                                        whileHover={isSubmitBlocked || isSubmitting ? {} : { scale: 1.01, y: -1 }}
                                        whileTap={isSubmitBlocked || isSubmitting ? {} : { scale: 0.99 }}
                                        className={`flex-1 flex items-center justify-center gap-3 w-full rounded-xl py-4 text-base font-semibold text-slate-900 bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-400 bg-[length:200%_auto] hover:bg-right shadow-[0_0_20px_rgba(45,212,191,0.2)] hover:shadow-[0_0_30px_rgba(45,212,191,0.4)] transition-all duration-500 tracking-wide ${isSubmitting || isSubmitBlocked ? "opacity-50 cursor-not-allowed shadow-none hover:shadow-none hover:bg-left" : ""}`}
                                        type="submit"
                                        disabled={isSubmitting || isSubmitBlocked}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                PROCESSING...
                                            </>
                                        ) : (
                                            <>
                                                {editingFormId ? "RESUBMIT REQUEST" : "SUBMIT REQUEST"} <FiArrowRight size={18} />
                                            </>
                                        )}
                                    </motion.button>

                                    <motion.button
                                        whileHover={{ scale: 1.01, y: -1 }}
                                        whileTap={{ scale: 0.99 }}
                                        type="button"
                                        onClick={handleReset}
                                        className="flex-1 flex items-center justify-center gap-3 w-full rounded-xl py-4 text-base font-semibold text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-teal-500/40 transition-all duration-300 tracking-wide cursor-pointer"
                                    >
                                        RESET
                                    </motion.button>
                                </div>
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