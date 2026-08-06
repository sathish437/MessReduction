import { useTheme } from './context/ThemeContext';
import { FiSun, FiMoon } from 'react-icons/fi';
import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FiUser, FiHome, FiCreditCard, FiBookOpen, FiCalendar, FiHash,
    FiClock, FiPhone, FiInfo, FiArrowRight, FiFileText, FiEdit3, FiAlertTriangle,
    FiCheckCircle, FiXCircle, FiActivity, FiMapPin, FiLogOut
} from "react-icons/fi";
import apiClient from "./api/apiClient";
import { logout } from "./services/authService";
import Toast from "./components/Toast";
import ConfirmModal from "./components/ConfirmModal";
import MobileBottomNav from "./components/MobileBottomNav";
import CustomSelect from "./CustomSelect";

import image from "./assets/1000088399.png";

const TITLE = "MESS REDUCTION";

const getMinArrivalDate = (leaveDate) => {
    if (!leaveDate) {
        const today = new Date();
        today.setDate(today.getDate() + 3);
        return today.toISOString().split('T')[0];
    }
    const leave = new Date(leaveDate);
    leave.setDate(leave.getDate() + 3);
    return leave.toISOString().split('T')[0];
};

function Field({ label, icon, as: Component = "input", readOnly = false, children, error, ...props }) {
    const id = props.id || props.name;
    const isSelect = Component === "select";
    return (
        <div className="flex flex-col gap-2 w-full text-left">
            {label && (
                <label htmlFor={id} className="text-sm font-semibold tracking-wide text-[var(--color-text-secondary)]">
                    {label} {props.required && <span className="text-[var(--color-danger)]">*</span>}
                </label>
            )}
            <div className={`flex items-center gap-3 rounded-[12px] border px-4 py-3.5 transition-all duration-200 relative group bg-[var(--color-surface)]
                ${readOnly ? 'opacity-80 cursor-not-allowed border-[var(--color-border)]' : ''} 
                ${error ? 'border-[var(--color-danger)]/50 bg-[var(--color-danger)]/5 focus-within:border-[var(--color-danger)]' : 'border-[var(--color-border)] focus-within:border-[var(--color-btn-primary)]'}`}>
                {icon && <span className={`shrink-0 text-lg transition-colors ${error ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-secondary)] group-focus-within:text-[var(--color-btn-primary)]'}`}>{icon}</span>}
                <Component
                    id={id}
                    className={`flex-1 bg-transparent focus:outline-none text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]/50 font-medium w-full ${isSelect ? 'appearance-none cursor-pointer pr-8' : 'appearance-none'}`}
                    readOnly={readOnly}
                    {...props}
                >
                    {children}
                </Component>
                {isSelect && (
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                        <svg className="w-4 h-4 text-[var(--color-text-secondary)] group-focus-within:text-[var(--color-btn-primary)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                )}
            </div>
            {error && (
                <span className="text-xs font-medium text-[var(--color-danger)] mt-1">
                    {error}
                </span>
            )}
        </div>
    )
}

function RequestTimeline({ tracking, activeRequest, onEditRequest }) {
    if (!tracking && !activeRequest) return null;

    const effectiveTracking = tracking || {
        currentStatus: activeRequest?.currentStatus,
        currentStage: activeRequest?.currentStatus === 'Approved' ? 'COMPLETED' : (
            activeRequest?.currentStatus?.startsWith('Rejected') ? 'REJECTED' : (
                activeRequest?.currentStatus === 'PendingOffice' ? 'OFFICE' : (
                    activeRequest?.currentStatus === 'PendingWarden' ? 'WARDEN' : (
                        activeRequest?.currentStatus === 'PendingDeputyWarden' ? 'DEPUTY_WARDEN' : 'SUBMITTED'
                    )
                )
            )
        ),
        submittedTime: activeRequest?.submittedAt,
        deputyWardenName: activeRequest?.assignedDeputyWarden,
        rejectionReason: activeRequest?.rejectReason
    };

    const trackingData = effectiveTracking;

    const stages = [
        { id: "SUBMITTED", label: "Submitted" },
        { id: "DEPUTY_WARDEN", label: "Deputy Warden" },
        { id: "WARDEN", label: "Warden" },
        { id: "OFFICE", label: "Office" },
        { id: "COMPLETED", label: "Completed" }
    ];

    const currentStageIndex = stages.findIndex(s => s.id === trackingData.currentStage);
    const isRejected = trackingData.currentStage === "REJECTED";

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
            let rejectedIndex = 1;
            if (trackingData.rejectedBy === "Warden" || trackingData.currentStatus === "RejectedWarden") rejectedIndex = 2;
            if (trackingData.rejectedBy === "Office" || trackingData.currentStatus === "RejectedOffice") rejectedIndex = 3;
            if (index < rejectedIndex) return "completed";
            if (index === rejectedIndex) return "rejected";
            return "pending";
        }
        if (currentStageIndex === -1 && trackingData.currentStatus === "Approved") return "completed";
        if (trackingData.currentStage === "COMPLETED") return "completed";
        if (index < currentStageIndex) return "completed";
        if (index === currentStageIndex) return "current";
        return "pending";
    };

    const getStageDetails = (stageId) => {
        if (stageId === "SUBMITTED") {
            const time = formatDate(trackingData.submittedTime);
            return time ? (
                <div className="mt-2 text-center text-xs">
                    <div className="text-[var(--color-text-primary)] font-medium">{time.date}</div>
                    <div className="text-[var(--color-text-secondary)]">{time.time}</div>
                </div>
            ) : null;
        }
        if (stageId === "DEPUTY_WARDEN") {
            if (isRejected && (trackingData.rejectedBy === "DeputyWarden" || trackingData.currentStatus === "RejectedDeputyWarden")) {
                const time = formatDate(trackingData.rejectedTime);
                return (
                    <div className="mt-2 text-center text-xs">
                        <div className="text-[var(--color-danger)] font-semibold mb-1">Rejected</div>
                        {time && <><div className="text-[var(--color-text-secondary)]">{time.date}</div><div className="text-[var(--color-text-secondary)]/70">{time.time}</div></>}
                    </div>
                );
            }
            if (trackingData.deputyApprovalTime) {
                const time = formatDate(trackingData.deputyApprovalTime);
                return (
                    <div className="mt-2 text-center text-xs">
                        <div className="text-[var(--color-success)] font-medium mb-1 truncate max-w-[100px]" title={trackingData.deputyWardenName}>{trackingData.deputyWardenName}</div>
                        {time && <><div className="text-[var(--color-text-secondary)]">{time.date}</div><div className="text-[var(--color-text-secondary)]/70">{time.time}</div></>}
                    </div>
                );
            }
        }
        if (stageId === "WARDEN") {
            if (isRejected && (trackingData.rejectedBy === "Warden" || trackingData.currentStatus === "RejectedWarden")) {
                const time = formatDate(trackingData.rejectedTime);
                return (
                    <div className="mt-2 text-center text-xs">
                        <div className="text-[var(--color-danger)] font-semibold mb-1">Rejected</div>
                        {time && <><div className="text-[var(--color-text-secondary)]">{time.date}</div><div className="text-[var(--color-text-secondary)]/70">{time.time}</div></>}
                    </div>
                );
            }
            if (trackingData.wardenApprovalTime) {
                const time = formatDate(trackingData.wardenApprovalTime);
                return (
                    <div className="mt-2 text-center text-xs">
                        <div className="text-[var(--color-success)] font-medium mb-1 truncate max-w-[100px]" title={trackingData.wardenName}>{trackingData.wardenName}</div>
                        {time && <><div className="text-[var(--color-text-secondary)]">{time.date}</div><div className="text-[var(--color-text-secondary)]/70">{time.time}</div></>}
                    </div>
                );
            }
        }
        if (stageId === "OFFICE") {
            if (isRejected && (trackingData.rejectedBy === "Office" || trackingData.currentStatus === "RejectedOffice")) {
                const time = formatDate(trackingData.rejectedTime);
                return (
                    <div className="mt-2 text-center text-xs">
                        <div className="text-[var(--color-danger)] font-semibold mb-1">Rejected</div>
                        {time && <><div className="text-[var(--color-text-secondary)]">{time.date}</div><div className="text-[var(--color-text-secondary)]/70">{time.time}</div></>}
                    </div>
                );
            }
            if (trackingData.officeApprovalTime) {
                const time = formatDate(trackingData.officeApprovalTime);
                return (
                    <div className="mt-2 text-center text-xs">
                        {trackingData.isAutoAccepted ? (
                            <div className="text-[var(--color-success)] italic font-medium mb-1">Auto Accepted</div>
                        ) : (
                            <div className="text-[var(--color-success)] font-medium mb-1 truncate max-w-[100px]" title={trackingData.officeName}>{trackingData.officeName}</div>
                        )}
                        {time && <><div className="text-[var(--color-text-secondary)]">{time.date}</div><div className="text-[var(--color-text-secondary)]/70">{time.time}</div></>}
                    </div>
                );
            }
        }
        return null;
    };

    return (
        <div className="w-full mt-4 mb-8">
            {/* Desktop Horizontal Workflow */}
            <div className="hidden md:block bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[12px] p-6 shadow-soft">
                <div className="tracking-container">
                    {stages.map((stage, index) => {
                        const state = getStageState(index);
                        let circleContent = state === "completed" ? "✓" : (index + 1);
                        if (state === "rejected") circleContent = "✕";
                        let nextState = "pending";
                        if (index < stages.length - 1) {
                            nextState = getStageState(index + 1);
                        }
                        
                        let labelColor = 'text-[var(--color-text-secondary)]';
                        if (state === 'rejected') labelColor = 'text-[var(--color-danger)]';
                        if (state === 'completed') labelColor = 'text-[var(--color-success)]';
                        if (state === 'current') labelColor = 'text-[var(--color-btn-primary)]';

                        return (
                            <React.Fragment key={stage.id}>
                                <div className="step">
                                    <div className={`circle ${state}`}>
                                        {circleContent}
                                    </div>
                                    <div className={`mt-2 text-[11px] font-bold uppercase tracking-wider ${labelColor}`}>
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

            {/* Mobile Vertical Timeline */}
            <div className="block md:hidden space-y-0 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[12px] p-5 shadow-soft">
                {stages.map((stage, index) => {
                    const state = getStageState(index);
                    const isCompleted = state === "completed";
                    const isCurrent = state === "current";
                    const isRejectedState = state === "rejected";

                    let dotColorClass = "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-card)]";
                    let checkIcon = index + 1;

                    if (isCompleted) {
                        dotColorClass = "bg-[var(--color-success)] text-white border-[var(--color-success)]";
                        checkIcon = "✓";
                    } else if (isRejectedState) {
                        dotColorClass = "bg-[var(--color-danger)] text-white border-[var(--color-danger)]";
                        checkIcon = "✕";
                    } else if (isCurrent) {
                        dotColorClass = "bg-[var(--color-surface)] text-[var(--color-btn-primary)] border-[var(--color-accent)] font-bold";
                        checkIcon = "⏳";
                    }

                    let staffName = "";
                    let dateTimeObj = null;

                    if (stage.id === "SUBMITTED") {
                        dateTimeObj = formatDate(trackingData.submittedTime);
                        staffName = "SYSTEM";
                    } else if (stage.id === "DEPUTY_WARDEN") {
                        if (isRejectedState && (trackingData.rejectedBy === "DeputyWarden" || trackingData.currentStatus === "RejectedDeputyWarden")) {
                            dateTimeObj = formatDate(trackingData.rejectedTime);
                            staffName = trackingData.deputyWardenName || "Deputy Warden";
                        } else if (trackingData.deputyApprovalTime) {
                            dateTimeObj = formatDate(trackingData.deputyApprovalTime);
                            staffName = trackingData.deputyWardenName || "Deputy Warden";
                        }
                    } else if (stage.id === "WARDEN") {
                        if (isRejectedState && (trackingData.rejectedBy === "Warden" || trackingData.currentStatus === "RejectedWarden")) {
                            dateTimeObj = formatDate(trackingData.rejectedTime);
                            staffName = trackingData.wardenName || "Warden";
                        } else if (trackingData.wardenApprovalTime) {
                            dateTimeObj = formatDate(trackingData.wardenApprovalTime);
                            staffName = trackingData.wardenName || "Warden";
                        }
                    } else if (stage.id === "OFFICE") {
                        if (isRejectedState && (trackingData.rejectedBy === "Office" || trackingData.currentStatus === "RejectedOffice")) {
                            dateTimeObj = formatDate(trackingData.rejectedTime);
                            staffName = trackingData.officeName || "Office";
                        } else if (trackingData.officeApprovalTime) {
                            dateTimeObj = formatDate(trackingData.officeApprovalTime);
                            staffName = trackingData.isAutoAccepted ? "SYSTEM" : (trackingData.officeName || "Office");
                        }
                    }

                    let labelColor = 'text-[var(--color-text-secondary)]';
                    if (isRejectedState) labelColor = 'text-[var(--color-danger)]';
                    if (isCompleted) labelColor = 'text-[var(--color-success)]';
                    if (isCurrent) labelColor = 'text-[var(--color-btn-primary)]';

                    return (
                        <div key={stage.id} className="flex gap-4 items-start relative pb-6 last:pb-0">
                            {index < stages.length - 1 && (
                                <div 
                                    className="absolute left-[15px] top-8 w-[2px] transition-all"
                                    style={{ 
                                        height: 'calc(100% - 16px)',
                                        background: getStageState(index + 1) === "completed" 
                                            ? "var(--color-success)" 
                                            : "var(--color-card)"
                                    }}
                                />
                            )}
                            
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors z-10 flex-shrink-0 ${dotColorClass}`}>
                                {checkIcon}
                            </div>

                            <div className="flex-1 min-w-0 pt-1.5 text-left">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center flex-wrap gap-2">
                                        <span className={`text-sm font-semibold tracking-wide ${labelColor}`}>
                                            {stage.label}
                                        </span>
                                        {staffName && (
                                            <span className="text-xs text-[var(--color-text-secondary)]/60 font-medium">
                                                • {staffName}
                                            </span>
                                        )}
                                    </div>
                                    {dateTimeObj && (
                                        <div className="text-[12px] text-[var(--color-text-secondary)] flex gap-2">
                                            <span>{dateTimeObj.date}</span>
                                            <span>{dateTimeObj.time}</span>
                                        </div>
                                    )}
                                </div>

                                {isRejectedState && (
                                    <div className="mt-3">
                                        {trackingData.rejectionReason && (
                                            <div className="text-sm text-[var(--color-text-primary)] bg-[var(--color-danger)]/5 border border-[var(--color-danger)]/10 rounded-xl p-3 shadow-sm">
                                                <span className="font-semibold text-[var(--color-danger)] text-[11px] block mb-1 uppercase tracking-wider">Rejection Reason</span>
                                                {trackingData.rejectionReason}
                                            </div>
                                        )}
                                        {onEditRequest && activeRequest && (
                                            <button
                                                type="button"
                                                onClick={() => onEditRequest(activeRequest)}
                                                className="mt-3 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-danger)]/10 hover:bg-[var(--color-danger)]/20 text-[var(--color-danger)] border border-[var(--color-danger)]/20 rounded-xl text-sm font-semibold transition-all w-full"
                                            >
                                                <FiEdit3 size={16} /> Edit and Resubmit
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {isRejected && trackingData.rejectionReason && (
                <div className="hidden md:block mt-6 p-4 rounded-xl bg-[var(--color-danger)]/5 border border-[var(--color-danger)]/20 text-[var(--color-text-primary)] text-sm shadow-sm">
                    <div className="mb-2"><span className="font-semibold text-[var(--color-danger)]">Rejection Reason:</span> {trackingData.rejectionReason}</div>
                    {onEditRequest && activeRequest && (
                        <div className="mt-4 flex justify-end">
                            <button
                                type="button"
                                onClick={() => onEditRequest(activeRequest)}
                                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[var(--color-danger)]/10 hover:bg-[var(--color-danger)]/20 text-[var(--color-danger)] border border-[var(--color-danger)]/20 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                            >
                                <FiEdit3 size={16} /> Edit and Resubmit
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function MessReductionPage() {
    const { isDark, toggleTheme } = useTheme();


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
        additionalRemarks: "",
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
    const [activeTab, setActiveTab] = useState('dashboard');
    const [limits, setLimits] = useState({ dailyCount: 0, extraRemaining: 0, limitReached: false });
    const [showExtraDialog, setShowExtraDialog] = useState(false);
    const [extraReason, setExtraReason] = useState("");
    const [isRequestingExtra, setIsRequestingExtra] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [extraRequests, setExtraRequests] = useState([]);
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        title: "Confirm Action",
        message: "",
        confirmText: "Delete",
        confirmVariant: "danger",
        onConfirm: null
    });

    const fetchExtraSubmissionStatus = useCallback(async () => {
        if (!studentId) return;
        try {
            const res = await apiClient.get(`/api/student-form/extra-submission/${studentId}`);
            if (Array.isArray(res.data)) {
                setExtraRequests(res.data);
            }
        } catch (error) {
        }
    }, [studentId]);

    useEffect(() => {
        if (!studentId) return;
        fetchExtraSubmissionStatus();
        const interval = setInterval(() => {
            fetchExtraSubmissionStatus();
        }, 4000);
        return () => clearInterval(interval);
    }, [studentId, fetchExtraSubmissionStatus]);

    // Daily Extra Submission Filter (Current Day only)
    const todayStr = new Date().toDateString();
    const todayExtraRequests = Array.isArray(extraRequests)
        ? extraRequests.filter(req => req.createdAt && new Date(req.createdAt).toDateString() === todayStr)
        : [];

    const latestExtraRequest = todayExtraRequests.length > 0
        ? [...todayExtraRequests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
        : null;

    useEffect(() => {
        if (latestExtraRequest && latestExtraRequest.status === 'APPROVED' && studentId) {
            fetchLimits(studentId);
        }
    }, [latestExtraRequest?.status, studentId]);

    const isAnyProcessing = isSubmitting || isDeleting || isRequestingExtra || loading;

    // Helper function to check if a request is expired based on Arrival Date + 1 day <= Current Local Date
    const isRequestExpiredByArrivalDate = useCallback((arrivalDateStr) => {
        if (!arrivalDateStr) return false;
        const parts = arrivalDateStr.split('T')[0].split('-');
        if (parts.length !== 3) return false;

        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // 0-indexed month
        const day = parseInt(parts[2], 10);

        // expiryDate = arrivalDate + 1 day (00:00:00 local time)
        const expiryDate = new Date(year, month, day + 1, 0, 0, 0, 0);

        // Current Local Date (00:00:00 local time)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Current Local Date >= expiryDate
        return today.getTime() >= expiryDate.getTime();
    }, []);

    // Filter out expired forms to determine active tracking request
    const unexpiredForms = Array.isArray(studentForm)
        ? studentForm.filter(form => !isRequestExpiredByArrivalDate(form?.arrivalDate))
        : [];

    const latestForm = unexpiredForms.length > 0 ? unexpiredForms[0] : null;
    const activeRequest = latestForm;

    const isInProgressRequest = latestForm && latestForm.currentStatus && latestForm.currentStatus.startsWith('Pending');
    const isCompletedRequest = latestForm && latestForm.currentStatus === 'Approved';

    const formatNextRequestDate = (arrivalDateStr) => {
        if (!arrivalDateStr) return "";
        const date = new Date(arrivalDateStr + "T00:00:00");
        date.setDate(date.getDate() + 1);
        const day = String(date.getDate()).padStart(2, '0');
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    const isBeforeNextEligibleDate = (arrivalDateStr) => {
        if (!arrivalDateStr) return false;
        const nextDate = new Date(arrivalDateStr + "T00:00:00");
        nextDate.setDate(nextDate.getDate() + 1);
        nextDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today < nextDate;
    };

    const isBlockedByCompletedDate = isCompletedRequest && isBeforeNextEligibleDate(latestForm?.arrivalDate);

    const hasApprovedExtraToday = latestExtraRequest && latestExtraRequest.status === 'APPROVED';
    const totalAllowed = hasApprovedExtraToday ? 4 : 3;
    const isLimitReached = (limits.dailyCount || 0) >= totalAllowed;

    const getDaysDifference = (start, end) => {
        if (!start || !end) return 0;
        const startDate = new Date(start);
        const endDate = new Date(end);
        return (endDate - startDate) / (1000 * 60 * 60 * 24);
    };

    const isInvalidDateDifference = formData.leaveDate && formData.arrivalDate && getDaysDifference(formData.leaveDate, formData.arrivalDate) <= 3;

    const isSubmitBlocked = isSubmitting || (!editingFormId && (isLimitReached || isInProgressRequest || isBlockedByCompletedDate));

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
            setLoading(false);
        }
    }, []);

    // Fetch student details when studentId becomes available
    useEffect(() => {
        if (!studentId) return;
        fetchStudentData(studentId);
    }, [studentId]);

    const fetchLimits = async (id) => {
        try {
            const res = await apiClient.get(`/api/student-form/limits/${id}`);
            setLimits(res.data);
        } catch (error) {
        }
    };

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
                const sortedForms = [...forms].sort((a, b) => (b.formId || 0) - (a.formId || 0));
                setStudentForm(sortedForms);
                fetchLimits(studentId);

                if (sortedForms.length > 0) {
                    const req = sortedForms[0];
                    const isPending = req.currentStatus?.startsWith('Pending') || req.currentStatus === 'Approved';
                    const isExpired = isRequestExpiredByArrivalDate(req.arrivalDate);
                    if (isPending && req.isActive && !isExpired) {
                        setActiveTab('track');
                    }
                }
            } else {
                setStudentDetails(null);
                setStudentForm([]);
            }
        } catch (error) {
            try {  } catch (e) { }
        } finally {
            setLoading(false);
        }
    };

    const checkedExpiredFormIdsRef = useRef(new Set());

    // Automatic refresh when any request's Arrival Date + 1 day <= Current Local Date
    useEffect(() => {
        if (!studentId || !Array.isArray(studentForm) || studentForm.length === 0) return;

        const expiredForm = studentForm.find(form => 
            form && form.arrivalDate && isRequestExpiredByArrivalDate(form.arrivalDate)
        );

        if (expiredForm && expiredForm.formId && !checkedExpiredFormIdsRef.current.has(expiredForm.formId)) {
            checkedExpiredFormIdsRef.current.add(expiredForm.formId);
            fetchStudentData(studentId);
        }
    }, [studentForm, studentId, isRequestExpiredByArrivalDate]);

    useEffect(() => {
        if (activeRequest && activeRequest.formId) {
            const fetchTracking = async () => {
                try {
                    const res = await apiClient.get(`/api/student-form/StudentForm/${studentId}/${activeRequest.formId}/tracking`);
                    setTrackingDetails(res.data);
                } catch (error) {
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
        return 'bg-white/5 text-white/60 border-[var(--color-border)]';
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
        setActiveTab('dashboard');

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
            additionalRemarks: req.additionalRemarks || "",
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
            toDate: "",
            arrivalDate: "",
            arrivalTime: "",
            reason: "",
            otherReason: "",
            additionalRemarks: "",
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

        if (isInvalidDateDifference) {
            showToast("Mess reduction is not applicable for leaves of 3 days or less.", 'error');
            return;
        }

        if (isSubmitBlocked) {
            showToast("You already have an active request. New requests can be submitted after your arrival time.", 'error');
            return;
        }

        setIsSubmitting(true);

        const savedUser = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
        if (!savedUser.studentId) {
            showToast("Session expired. Please login again.", 'error');
            setIsSubmitting(false);
            return;
        }

        const submissionData = {
            year: parseInt(formData.year.replace(/\D/g, '')),
            roomNo: parseInt(formData.room),
            leaveDate: formData.leaveDate,
            leaveTime: formData.leaveTime?.substring(0, 5),
            toDate: formData.toDate,
            arrivalDate: formData.arrivalDate,
            arrivalTime: formData.arrivalTime?.substring(0, 5),
            reason: formData.reason === 'other' ? formData.otherReason : formData.reason,
            additionalRemarks: formData.additionalRemarks,
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
                    toDate: "",
                    arrivalDate: "",
                    arrivalTime: "",
                    reason: "",
                    otherReason: "",
                    additionalRemarks: "",
                    isEmergency: false
                }));
                // Refresh forms list
                fetchStudentData(savedUser.studentId);
            } else {
                showToast("Submission failed. Please try again.", 'error');
            }
        } catch (error) {
            const errMsg = error.response?.data?.message || "Error submitting form. Ensure all fields are valid.";
            showToast(errMsg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteRequest = (formId) => {
        setConfirmState({
            isOpen: true,
            title: "Confirm Action",
            message: "Are you sure you want to delete this request? This action cannot be undone.",
            confirmText: "Delete",
            confirmVariant: "danger",
            onConfirm: () => executeDeleteRequest(formId)
        });
    };

    const executeDeleteRequest = async (formId) => {
        setConfirmState(prev => ({ ...prev, isOpen: false }));
        setIsDeleting(true);
        try {
            await apiClient.delete(`/api/student-form/StudentForm/${studentId}/${formId}`);
            showToast("Request deleted successfully", "success");
            fetchStudentData(studentId);
        } catch (error) {
            showToast(error.response?.data?.message || "Failed to delete request", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleRequestExtraSubmission = async () => {
        if (!extraReason.trim()) {
            showToast("Reason is required", "error");
            return;
        }
        setIsRequestingExtra(true);
        try {
            await apiClient.post(`/api/student-form/extra-submission/${studentId}`, { reason: extraReason });
            showToast("Extra submission requested successfully", "success");
            setShowExtraDialog(false);
            setExtraReason("");
            fetchStudentData(studentId);
            fetchLimits(studentId);
        } catch (error) {
            showToast(error.response?.data?.message || "Failed to request extra submission", "error");
            setShowExtraDialog(false);
            setExtraReason("");
        } finally {
            setIsRequestingExtra(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[100dvh] w-full flex items-center justify-center bg-[var(--color-primary-bg)] text-[var(--color-text-primary)]">
                <div className="text-center">
                    <div className="w-10 h-10 border-2 border-[var(--color-accent)]/30 border-t-[var(--color-accent)] rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-[var(--color-text-secondary)] text-sm font-semibold">Loading Portal...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[100dvh] w-full flex flex-col overflow-hidden bg-[var(--color-primary-bg)] text-[var(--color-text-primary)] font-sans selection:bg-[var(--color-btn-primary)]/30">
            {/* Toast Notification Panel */}
            <Toast toast={toast} onClose={() => setToast(null)} />

            {/* Desktop Top Navbar */}
            <header className="hidden md:flex items-center justify-between px-6 py-3.5 bg-[var(--color-header)] text-white shadow-md z-20 shrink-0">
                <div className="flex items-center gap-3">
                    <img src={image} alt="GCES Logo" className="w-12 h-12 object-contain drop-shadow-md" />
                    <div className="flex flex-col">
                        <span className="text-[11px] font-bold tracking-widest text-white/80 uppercase mb-0.5">GCES Srirangam</span>
                        <span className="text-xl font-bold tracking-tight">Mess Reduction Request Form</span>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <nav className="flex items-center gap-2 bg-black/20 p-1.5 rounded-[14px] border border-white/10">
                        <button 
                            onClick={() => setActiveTab('dashboard')}
                            disabled={isAnyProcessing}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-sm font-semibold transition-all ${isAnyProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${activeTab === 'dashboard' ? 'bg-white text-[var(--color-header)] shadow-sm' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                        >
                            <FiHome size={18} /> Dashboard
                        </button>
                        <button 
                            onClick={() => setActiveTab('track')}
                            disabled={isAnyProcessing}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-sm font-semibold transition-all ${isAnyProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${activeTab === 'track' ? 'bg-white text-[var(--color-header)] shadow-sm' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                        >
                            <FiActivity size={18} /> Track Request
                        </button>
                    </nav>

                    <div className="flex items-center gap-4 pl-6 border-l border-white/20">
                        <button onClick={toggleTheme} className="text-white/80 hover:text-white p-2.5 bg-white/10 hover:bg-white/20 rounded-[10px] border border-white/10 shadow-sm transition-all cursor-pointer">
                            {isDark ? <FiSun size={20} /> : <FiMoon size={20} />}
                        </button>
                        <button onClick={() => logout()} className="text-white/90 hover:text-white flex items-center gap-2 px-4 py-2.5 bg-[var(--color-danger)]/80 hover:bg-[var(--color-danger)] rounded-[10px] border border-[var(--color-danger)]/50 shadow-sm transition-all cursor-pointer font-semibold text-sm">
                            <FiLogOut size={18} /> Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Layout Container */}
            <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
                
                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between px-3 py-3 border-b border-[var(--color-border)] bg-[var(--color-header)] text-white z-20 shrink-0 shadow-md">
                    <div className="flex items-center gap-2.5">
                        <img src={image} alt="GCES Logo" className="w-7 h-7 object-contain" />
                        <span className="text-sm font-bold tracking-tight">Mess Reduction Request Form</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={toggleTheme} className="text-white/80 hover:text-white p-1.5 bg-white/10 rounded-[10px] border border-white/10 shadow-sm transition-all cursor-pointer">
                            {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
                        </button>
                        <button onClick={() => logout()} className="text-white/80 hover:text-white p-1.5 bg-white/10 rounded-[10px] cursor-pointer transition-all">
                            <FiLogOut size={16} />
                        </button>
                    </div>
                </header>


                {/* Main Scrollable Area */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 lg:p-6 pb-28 md:pb-6">
                    <div className="w-full max-w-5xl mx-auto space-y-4 sm:space-y-5">

                        {activeTab === 'dashboard' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-5">
                                {/* Extra Submission Request Status Banner Card */}
                                {latestExtraRequest && (
                                    <div className={`p-4 sm:p-5 rounded-[12px] border transition-all shadow-md flex items-start gap-4 ${
                                        latestExtraRequest.status === 'PENDING'
                                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                                            : latestExtraRequest.status === 'APPROVED'
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                                            : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                                    }`}>
                                        <div className={`p-2.5 rounded-xl shrink-0 ${
                                            latestExtraRequest.status === 'PENDING'
                                                ? 'bg-amber-500/20 text-amber-400'
                                                : latestExtraRequest.status === 'APPROVED'
                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                : 'bg-rose-500/20 text-rose-400'
                                        }`}>
                                            {latestExtraRequest.status === 'PENDING' && <FiClock size={24} />}
                                            {latestExtraRequest.status === 'APPROVED' && <FiCheckCircle size={24} />}
                                            {latestExtraRequest.status === 'REJECTED' && <FiXCircle size={24} />}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm sm:text-base font-extrabold tracking-wide">
                                                {latestExtraRequest.status === 'PENDING' && 'Extra Submission Request Pending'}
                                                {latestExtraRequest.status === 'APPROVED' && 'Extra Submission Request Approved'}
                                                {latestExtraRequest.status === 'REJECTED' && 'Extra Submission Request Rejected'}
                                            </h4>
                                            <p className="text-xs sm:text-sm mt-1 opacity-90 leading-relaxed font-medium">
                                                {latestExtraRequest.status === 'PENDING' && 'Your request has been sent to the Administrator and is awaiting review.'}
                                                {latestExtraRequest.status === 'APPROVED' && 'The Administrator has granted you one additional submission.'}
                                                {latestExtraRequest.status === 'REJECTED' && 'Your request for an additional submission has been rejected by the Administrator.'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Student Profile Information Card */}
                                <div className="bg-[var(--color-surface)] rounded-[12px] border border-[var(--color-border)] shadow-soft p-4 sm:p-5">
                                    <div className="flex items-center gap-3 pb-2.5 mb-3 border-b border-[var(--color-border)]">
                                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[var(--color-btn-primary)]/10 text-[var(--color-btn-primary)] flex items-center justify-center font-bold text-lg border border-[var(--color-btn-primary)]/20">
                                            <FiUser size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)]">
                                                Student Information
                                            </h3>
                                            <p className="text-xs text-[var(--color-text-secondary)] font-normal">
                                                Verified student profile details
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
                                        <div className="bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-xl p-3 sm:p-3.5 flex flex-col">
                                            <span className="text-[10px] sm:text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-0.5">Name</span>
                                            <span className="text-sm font-bold text-[var(--color-text-primary)] truncate">{studentDetails?.name || formData.name || "N/A"}</span>
                                        </div>

                                        <div className="bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-xl p-3 sm:p-3.5 flex flex-col">
                                            <span className="text-[10px] sm:text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-0.5">Register Number</span>
                                            <span className="text-sm font-bold text-[var(--color-text-primary)] font-mono">{studentDetails?.registerNo || formData.id || "N/A"}</span>
                                        </div>

                                        <div className="bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-xl p-3 sm:p-3.5 flex flex-col">
                                            <span className="text-[10px] sm:text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-0.5">Roll Number</span>
                                            <span className="text-sm font-bold text-[var(--color-text-primary)] font-mono">{studentDetails?.rollNo || formData.rollNo || "N/A"}</span>
                                        </div>

                                        <div className="bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-xl p-3 sm:p-3.5 flex flex-col">
                                            <span className="text-[10px] sm:text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-0.5">Department</span>
                                            <span className="text-sm font-bold text-[var(--color-text-primary)]">{studentDetails?.department || formData.dept || "N/A"}</span>
                                        </div>

                                        <div className="bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-xl p-3 sm:p-3.5 flex flex-col">
                                            <span className="text-[10px] sm:text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-0.5">Gender</span>
                                            <span className="text-sm font-bold text-[var(--color-text-primary)] capitalize">{studentDetails?.gender ? (studentDetails.gender.toLowerCase() === 'male' ? 'Male' : studentDetails.gender.toLowerCase() === 'female' ? 'Female' : studentDetails.gender) : "N/A"}</span>
                                        </div>

                                        <div className="bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-xl p-3 sm:p-3.5 flex flex-col">
                                            <span className="text-[10px] sm:text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-0.5">Phone Number</span>
                                            <span className="text-sm font-bold text-[var(--color-text-primary)] font-mono">{studentDetails?.phoneNo || studentDetails?.phone || formData.mobile || "N/A"}</span>
                                        </div>
                                    </div>
                                </div>

                                <div id="form-section" className="bg-[var(--color-surface)] rounded-[12px] border border-[var(--color-border)] shadow-soft overflow-hidden">
                                    <div className="px-4 py-3.5 sm:px-6 sm:py-5 border-b border-[var(--color-border)] flex justify-between items-center flex-wrap gap-3 sm:gap-4">
                                        <div>
                                            <h3 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)]">
                                                {editingFormId ? "Edit Request" : "New Reduction Request"}
                                            </h3>
                                            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-0.5 sm:mt-1">
                                                {editingFormId ? "Update your details and resubmit." : "Fill in your leave details below."}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-[12px] p-3 shadow-sm">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-0.5">Daily Submission Limit</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex gap-1">
                                                        {[...Array(totalAllowed)].map((_, i) => (
                                                            <div key={i} className={`w-3 h-3 rounded-full ${i < limits.dailyCount ? 'bg-[var(--color-btn-primary)]' : 'bg-[var(--color-border)]'}`}></div>
                                                        ))}
                                                    </div>
                                                    <span className="text-xs font-semibold text-[var(--color-text-primary)]">{limits.dailyCount}/{totalAllowed} used</span>
                                                </div>
                                            </div>
                                            {isLimitReached && (
                                                <button
                                                    onClick={() => setShowExtraDialog(true)}
                                                    disabled={isAnyProcessing}
                                                    className={`px-3 py-1.5 bg-[var(--color-warning)] text-white text-xs font-bold rounded-lg shadow-sm transition-all ${isAnyProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[var(--color-warning)]/90 cursor-pointer'}`}
                                                >
                                                    Request Extra
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-4 sm:p-5">
                                        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 sm:gap-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                                                <CustomSelect
                                                    label="Year of Study"
                                                    icon={<FiCalendar size={18} />}
                                                    name="year"
                                                    id="year-select"
                                                    value={formData.year}
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="Select Year"
                                                    options={[
                                                        { value: "1st", label: "1st Year" },
                                                        { value: "2nd", label: "2nd Year" },
                                                        { value: "3rd", label: "3rd Year" },
                                                        { value: "4th", label: "4th Year" }
                                                    ]}
                                                />
                                                <Field
                                                    label="Room Number"
                                                    icon={<FiMapPin size={18} />}
                                                    type="number"
                                                    placeholder="e.g. 4012"
                                                    name="room"
                                                    value={formData.room}
                                                    onChange={handleChange}
                                                    min="1"
                                                    required
                                                    id="room-input"
                                                    error={formErrors.room}
                                                    className="flex-1 bg-transparent focus:outline-none text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]/50 font-medium w-full appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                <Field label="Leave Date" icon={<FiCalendar size={18} />} type="date" name="leaveDate" value={formData.leaveDate} onChange={handleChange} min={new Date().toISOString().split('T')[0]} required id="leave-date-input" />
                                                <Field label="Leave Time" icon={<FiClock size={18} />} type="time" name="leaveTime" value={formData.leaveTime} onChange={handleChange} required id="leave-time-input" />
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                <Field label="Arrival Date" icon={<FiCalendar size={18} />} type="date" name="arrivalDate" value={formData.arrivalDate} onChange={handleChange} min={formData.leaveDate || new Date().toISOString().split('T')[0]} required id="arrival-date-input" />
                                                <Field label="Arrival Time" icon={<FiClock size={18} />} type="time" name="arrivalTime" value={formData.arrivalTime} onChange={handleChange} required id="arrival-time-input" />
                                            </div>

                                            <CustomSelect
                                                label="Reason for Leave"
                                                icon={<FiInfo size={18} />}
                                                name="reason"
                                                id="reason-select"
                                                value={formData.reason}
                                                onChange={handleChange}
                                                required
                                                placeholder="Select Reason"
                                                options={[
                                                    { value: "Study Holidays", label: "Study Holidays" },
                                                    { value: "Medical Leave", label: "Medical Leave" },
                                                    { value: "other", label: "Other Reason" }
                                                ]}
                                            />

                                            <AnimatePresence>
                                                {formData.reason === "other" && (
                                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                                                        <Field label="Specify Reason" icon={<FiFileText size={18} />} type="text" placeholder="Enter your detailed reason" name="otherReason" value={formData.otherReason} onChange={handleChange} required id="other-reason-input" />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            {isInProgressRequest && (
                                                <div className="rounded-[12px] border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5 p-4 flex items-start gap-3 text-[var(--color-warning)]">
                                                    <FiAlertTriangle size={18} className="shrink-0 mt-0.5" />
                                                    <p className="text-sm font-medium leading-relaxed">
                                                        You already have an active request. Please delete it or wait for processing to submit a new one.
                                                    </p>
                                                </div>
                                            )}

                                            {isCompletedRequest && (
                                                <div className="rounded-[12px] border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-start gap-3 text-emerald-400">
                                                    <FiCheckCircle size={18} className="shrink-0 mt-0.5 text-emerald-400" />
                                                    <div className="text-sm font-medium leading-relaxed space-y-1">
                                                        <p className="font-semibold text-emerald-300">
                                                            Your previous mess reduction request has been completed.
                                                        </p>
                                                        <p className="text-emerald-400/90">
                                                            You can submit your next reduction request from: <span className="font-bold underline">{formatNextRequestDate(latestForm.arrivalDate)}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {isLimitReached && !isInProgressRequest && !isCompletedRequest && (
                                                <div className="rounded-[12px] border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5 p-4 flex items-start gap-3 text-[var(--color-warning)]">
                                                    <FiAlertTriangle size={18} className="shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-sm font-semibold leading-relaxed">
                                                            You have reached the maximum limit of 3 mess reduction requests.
                                                        </p>
                                                        <p className="text-xs mt-1 leading-relaxed opacity-90">
                                                            If you need another reduction request, please contact the Hostel Administration through the existing Admin Request process.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex flex-col sm:flex-row gap-4 mt-2">
                                                <button
                                                    className={`flex-1 flex items-center justify-center gap-2 rounded-[12px] py-3.5 text-[15px] font-semibold transition-all ${isSubmitting || isSubmitBlocked || isAnyProcessing ? "bg-[var(--color-card)] text-[var(--color-text-secondary)] cursor-not-allowed border border-[var(--color-border)]" : "bg-[var(--color-btn-primary)] text-white hover:bg-[var(--color-btn-primary)]/90  hover:shadow-md cursor-pointer"}`}
                                                    type="submit"
                                                    disabled={isSubmitting || isSubmitBlocked || isAnyProcessing}
                                                >
                                                    {isSubmitting ? "Processing..." : (editingFormId ? "Resubmit Request" : "Submit Request")}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={handleReset}
                                                    disabled={isAnyProcessing}
                                                    className={`px-8 py-3.5 rounded-[12px] text-[15px] font-semibold text-[var(--color-text-primary)] bg-[var(--color-card)] border border-[var(--color-border)] transition-all ${isAnyProcessing ? "opacity-50 cursor-not-allowed" : "hover:bg-white/10 cursor-pointer"}`}
                                                >
                                                    Reset
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </motion.div>
                        )}


                        {activeTab === 'track' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="w-full max-w-4xl mx-auto">
                                <div className="bg-[var(--color-surface)] rounded-[12px] border border-[var(--color-border)] shadow-soft p-6 sm:p-8">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                        <div>
                                            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">Track Request</h2>
                                            <p className="text-sm text-[var(--color-text-secondary)]">Monitor the real-time status of your active application.</p>
                                        </div>
                                        {activeRequest && (
                                            <span className={`px-4 py-2 rounded-full text-xs font-bold border shrink-0 inline-flex items-center justify-center ${getStatusColor(activeRequest.currentStatus)}`}>
                                                {getStatusDisplay(activeRequest.currentStatus)}
                                            </span>
                                        )}
                                    </div>

                                    {activeRequest ? (
                                        <>
                                            <RequestTimeline tracking={trackingDetails} activeRequest={activeRequest} onEditRequest={handleEditRequest} />

                                            {activeRequest.currentStatus === 'PendingOffice' && (
                                                <div className="mt-8 bg-amber-500/10 border border-amber-500/20 rounded-[12px] p-6 text-amber-400">
                                                    <h3 className="text-base font-bold mb-2 flex items-center gap-2 text-amber-300">
                                                        <FiCheckCircle size={20} className="text-amber-400" />
                                                        Important Information
                                                    </h3>
                                                    <p className="text-sm font-medium leading-relaxed">
                                                        Your mess reduction request has been successfully processed.
                                                    </p>
                                                    <p className="text-sm font-medium leading-relaxed mt-1">
                                                        Your request is now pending final completion at the Hostel Office.
                                                    </p>
                                                    <p className="text-sm font-medium leading-relaxed mt-1">
                                                        Please visit the Hostel Office to complete the final verification and collect your mess reduction confirmation.
                                                    </p>
                                                </div>
                                            )}

                                            {activeRequest.currentStatus !== 'Approved' && (
                                                <div className="mt-6 pt-6 border-t border-[var(--color-border)] flex justify-end">
                                                    <button
                                                        type="button"
                                                        disabled={isAnyProcessing}
                                                        onClick={() => handleDeleteRequest(activeRequest.formId)}
                                                        className={`px-6 py-2.5 rounded-[12px] text-sm font-semibold transition-all w-full sm:w-auto
                                                            ${isAnyProcessing
                                                                ? 'bg-[var(--color-danger)]/5 text-[var(--color-danger)]/50 cursor-not-allowed opacity-70'
                                                                : 'bg-[var(--color-danger)]/10 hover:bg-[var(--color-danger)]/20 text-[var(--color-danger)] cursor-pointer'
                                                            }`}
                                                    >
                                                        {isDeleting ? 'Deleting...' : 'Delete Request'}
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="py-16 text-center">
                                            <div className="w-16 h-16 bg-[var(--color-card)] rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--color-border)]">
                                                <FiCheckCircle size={24} className="text-[var(--color-text-secondary)]" />
                                            </div>
                                            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">No Active Requests</h3>
                                            <p className="text-[var(--color-text-secondary)] text-sm max-w-sm mx-auto">You don't have any pending or active mess reduction requests to track.</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Navigation - Viewport Pinned */}
            <MobileBottomNav
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isAnyProcessing={isAnyProcessing}
            />

            {/* Extra Submission Request Dialog */}
            <AnimatePresence>
                {showExtraDialog && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-primary-bg)]/80 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[20px] shadow-soft overflow-hidden p-8"
                        >
                            <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">Request Extra Limit</h3>
                            <p className="text-[var(--color-text-secondary)] text-sm mb-6 leading-relaxed">
                                Please provide a valid reason for why you need an extra submission limit today. 
                                The administration will review your request.
                            </p>
                            
                            <textarea
                                value={extraReason}
                                onChange={(e) => setExtraReason(e.target.value)}
                                placeholder="Enter detailed reason here..."
                                className="w-full h-32 bg-[var(--color-card)] border border-[var(--color-border)] rounded-[12px] p-4 text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] resize-none mb-6 text-sm"
                            />
                            
                            <div className="flex gap-4">
                                <button
                                    onClick={() => {
                                        setShowExtraDialog(false);
                                        setExtraReason("");
                                    }}
                                    className="flex-1 py-3 rounded-[12px] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-white/5 transition-all text-sm font-semibold cursor-pointer"
                                    disabled={isRequestingExtra}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRequestExtraSubmission}
                                    disabled={isRequestingExtra || !extraReason.trim()}
                                    className="flex-1 py-3 rounded-[12px] bg-[var(--color-warning)] text-white hover:bg-[var(--color-warning)]/90 transition-all text-sm font-semibold disabled:opacity-50 flex justify-center items-center gap-2 shadow-soft cursor-pointer"
                                >
                                    {isRequestingExtra ? "Submitting..." : "Submit Request"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                confirmText={confirmState.confirmText}
                confirmVariant={confirmState.confirmVariant}
                onConfirm={confirmState.onConfirm}
                onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                loading={isDeleting}
            />
        </div>
    );
}

export default MessReductionPage;