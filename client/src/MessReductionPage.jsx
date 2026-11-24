import AppLayout from "./components/AppLayout";
import { useTheme } from './context/ThemeContext';
import { FiSun, FiMoon } from 'react-icons/fi';
import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FiUser, FiHome, FiCreditCard, FiBookOpen, FiCalendar, FiHash,
    FiClock, FiPhone, FiInfo, FiArrowRight, FiArrowLeft, FiFileText, FiEdit3, FiAlertTriangle,
    FiCheckCircle, FiXCircle, FiActivity, FiMapPin, FiLogOut, FiPlus, FiRotateCcw
} from "react-icons/fi";
import apiClient from "./api/apiClient";
import { logout, logoutStudent } from "./services/authService";
import Toast from "./components/Toast";
import ConfirmModal from "./components/ConfirmModal";
import MobileBottomNav from "./components/MobileBottomNav";
import CustomSelect from "./CustomSelect";
import { useStudentTrackSse } from "./hooks/useStudentTrackSse";

import image from "./assets/1000088399.png";

const TITLE = "MESS REDUCTION";

const getMinArrivalDate = (leaveDate, todayServerStr) => {
    const baseDateStr = leaveDate || todayServerStr;
    if (!baseDateStr) {
        const today = new Date();
        today.setDate(today.getDate() + 3);
        return today.toLocaleDateString('en-CA');
    }
    const parts = baseDateStr.split('T')[0].split('-');
    if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        d.setDate(d.getDate() + 3);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }
    const leave = new Date(baseDateStr);
    leave.setDate(leave.getDate() + 3);
    return leave.toLocaleDateString('en-CA');
};

function Field({ label, icon, as: Component = "input", readOnly = false, children, error, ...props }) {
    const id = props.id || props.name;
    const isSelect = Component === "select";
    return (
        <div className="flex flex-col gap-1.5 w-full text-left">
            {label && (
                <label htmlFor={id} className="field-label">
                    {label} {props.required && <span className="text-[var(--color-danger)]">*</span>}
                </label>
            )}
            <div className={`field-shell ${readOnly ? 'opacity-80 cursor-not-allowed bg-[var(--theme-card-muted)]' : ''} ${error ? 'border-[var(--color-danger-border)]' : ''}`}>
                {icon && <span className={`shrink-0 text-base ${error ? 'text-[var(--color-danger)]' : 'text-[var(--theme-text-faint)]'}`}>{icon}</span>}
                <Component
                    id={id}
                    className={`flex-1 bg-transparent focus:outline-none text-[13.5px] text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-faint)] font-medium w-full ${isSelect ? 'appearance-none cursor-pointer pr-6' : 'appearance-none'}`}
                    readOnly={readOnly}
                    {...props}
                >
                    {children}
                </Component>
                {isSelect && (
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-faint)]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                )}
            </div>
            {error && (
                <span className="text-xs font-semibold text-[var(--color-danger)] mt-0.5">
                    {error}
                </span>
            )}
        </div>
    );
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
                                    <motion.div 
                                        key={`circle-${stage.id}-${state}`}
                                        initial={{ scale: 0.85, opacity: 0.8 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                        className={`circle ${state}`}
                                    >
                                        {circleContent}
                                    </motion.div>
                                    <div className={`mt-2 text-[11px] font-bold uppercase tracking-wider ${labelColor}`}>
                                        {stage.label}
                                    </div>
                                    <motion.div
                                        key={`details-${stage.id}-${state}`}
                                        initial={{ opacity: 0, y: 3 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.25 }}
                                    >
                                        {getStageDetails(stage.id)}
                                    </motion.div>
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
                            
                            <motion.div 
                                key={`mob-circle-${stage.id}-${state}`}
                                initial={{ scale: 0.85, opacity: 0.8 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors z-10 flex-shrink-0 ${dotColorClass}`}
                            >
                                {checkIcon}
                            </motion.div>

                            <motion.div 
                                key={`mob-details-${stage.id}-${state}`}
                                initial={{ opacity: 0, x: -4 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.25 }}
                                className="flex-1 min-w-0 pt-1.5 text-left"
                            >
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
                            </motion.div>
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
    const [isApplying, setIsApplying] = useState(false);
    const [limits, setLimits] = useState({ dailyCount: 0, extraRemaining: 0, limitReached: false });
    const [showExtraDialog, setShowExtraDialog] = useState(false);
    const [extraReason, setExtraReason] = useState("");
    const [isRequestingExtra, setIsRequestingExtra] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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
            if (typeof document !== 'undefined' && document.hidden) return;
            fetchExtraSubmissionStatus();
        }, 15000);
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

    const latestForm = unexpiredForms.length > 0 ? unexpiredForms[0] : (Array.isArray(studentForm) && studentForm.length > 0 ? studentForm[0] : null);
    const activeRequest = latestForm;

    const isInProgressRequest = latestForm && latestForm.currentStatus && latestForm.currentStatus.startsWith('Pending');
    const isCompletedRequest = latestForm && latestForm.currentStatus === 'Approved';
    const isRejectedRequest = Boolean(
        activeRequest && activeRequest.currentStatus && activeRequest.currentStatus.startsWith('Rejected')
    );
    const hasActiveAppliedRequest = Boolean(
        activeRequest &&
        (activeRequest.currentStatus?.startsWith('Pending') || activeRequest.currentStatus === 'Approved')
    );

    const studentCounts = {
        total: Array.isArray(studentForm) ? studentForm.length : 0,
        pending: Array.isArray(studentForm) ? studentForm.filter(f => f?.currentStatus?.startsWith('Pending')).length : 0,
        approved: Array.isArray(studentForm) ? studentForm.filter(f => f?.currentStatus === 'Approved').length : 0,
        rejected: Array.isArray(studentForm) ? studentForm.filter(f => f?.currentStatus?.startsWith('Rejected')).length : 0
    };

    const getRejectedStageDisplay = (form) => {
        if (!form) return "Staff";
        const stage = form.rejectedStage || "";
        if (stage === 'DEPUTY_WARDEN' || stage === 'DeputyWarden' || stage === 'RejectedDeputyWarden') return 'Deputy Warden';
        if (stage === 'WARDEN' || stage === 'Warden' || stage === 'RejectedWarden') return 'Warden';
        if (stage === 'OFFICE' || stage === 'Office' || stage === 'RejectedOffice') return 'Hostel Office';
        if (form.currentStatus === 'RejectedDeputyWarden') return 'Deputy Warden';
        if (form.currentStatus === 'RejectedWarden') return 'Warden';
        if (form.currentStatus === 'RejectedOffice') return 'Hostel Office';
        return stage || 'Staff';
    };

    const getRejectedTimeDisplay = (form) => {
        const dt = form?.rejectedAt || trackingDetails?.rejectedTime;
        if (!dt) return null;
        try {
            const d = new Date(dt);
            if (isNaN(d.getTime())) return String(dt);
            return `${d.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })} at ${d.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: true })}`;
        } catch (e) {
            return String(dt);
        }
    };

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

    // Refresh student data when receiving app-notification-refresh event (SSE)
    useEffect(() => {
        if (!studentId) return;
        const handleNotificationRefresh = () => {
            fetchStudentData(studentId);
        };
        window.addEventListener('app-notification-refresh', handleNotificationRefresh);
        return () => {
            window.removeEventListener('app-notification-refresh', handleNotificationRefresh);
        };
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
                        // Keep student on dashboard to display Applied status card
                        // setActiveTab('track');
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

    // Real-time SSE Application Tracking for Student
    const handleTrackUpdate = useCallback((eventData) => {
        if (!eventData) return;

        // 1. Immediately update trackingDetails
        if (eventData.tracking) {
            setTrackingDetails(eventData.tracking);
        }

        // 2. Immediately update in-memory studentForm
        if (eventData.formId && eventData.currentStatus) {
            setStudentForm(prevForms => {
                if (!Array.isArray(prevForms)) return prevForms;
                return prevForms.map(f => {
                    if (f.formId === eventData.formId) {
                        return {
                            ...f,
                            currentStatus: eventData.currentStatus,
                            rejectReason: eventData.tracking?.rejectionReason || f.rejectReason,
                            rejectedAt: eventData.tracking?.rejectedTime || f.rejectedAt,
                            rejectedStage: eventData.tracking?.rejectedBy || f.rejectedStage
                        };
                    }
                    return f;
                });
            });
        }

        // 3. Re-fetch student data in background to ensure all records match committed DB
        if (studentId) {
            fetchStudentData(studentId);
        }
    }, [studentId]);

    const { connectionStatus: sseConnectionStatus } = useStudentTrackSse({
        studentId,
        onTrackUpdate: handleTrackUpdate
    });

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
        if (status === 'Approved') return 'badge badge-success';
        if (status?.startsWith('Rejected')) return 'badge badge-danger';
        if (status?.startsWith('Pending')) return 'badge badge-warning';
        return 'badge badge-neutral';
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
        setIsApplying(true);

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
        setFormErrors({});

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
                setIsApplying(false);
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

    const handleLogoutPrompt = () => {
        setConfirmState({
            isOpen: true,
            title: "Confirm Logout",
            message: "Are you sure you want to logout?",
            confirmText: "Logout",
            confirmVariant: "danger",
            onConfirm: () => {
                disconnectSse();
                logoutStudent();
            }
        });
    };

    if (loading) {
        return (
            <div className="min-h-[100dvh] w-full bg-[var(--color-primary-bg)]">
                <div className="mx-auto w-full max-w-4xl space-y-4 px-4 py-8">
                    <div className="skeleton h-7 w-56" />
                    <div className="panel p-5">
                        <div className="skeleton mb-4 h-4 w-40" />
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            {[0, 1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="skeleton h-14 w-full" />
                            ))}
                        </div>
                    </div>
                    <div className="panel p-5">
                        <div className="skeleton mb-4 h-4 w-48" />
                        {[0, 1, 2].map(i => (
                            <div key={i} className="skeleton mb-3 h-12 w-full" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <AppLayout
            roleTag="STUDENT PORTAL"
            pageTitle={activeTab === 'dashboard' ? 'Student Mess Reduction' : 'Track Request Status'}
            breadcrumbs={["GCES", "Student", activeTab === 'dashboard' ? 'Dashboard & Apply' : 'Track Request']}
            navItems={[
                { key: 'dashboard', label: 'Dashboard & Apply', icon: FiHome },
                { key: 'track', label: 'Track Request', icon: FiActivity, badge: activeRequest ? '1' : undefined }
            ]}
            activeNav={activeTab}
            onNavChange={setActiveTab}
            userInfo={{
                name: studentDetails?.name || formData.name || "Student",
                role: `Reg: ${studentDetails?.registerNo || formData.id || ""} · Room: ${studentDetails?.roomNo || formData.roomNo || ""}`,
                userName: studentDetails?.registerNo || formData.id
            }}
            onLogout={handleLogoutPrompt}
            onMobileDrawerChange={setIsDrawerOpen}
        >
            {/* Toast Notification Panel */}
            <Toast toast={toast} onClose={() => setToast(null)} />

            <div className="w-full space-y-6 pb-24 md:pb-8">

                        {activeTab === 'dashboard' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="w-full space-y-6">
                                {/* Extra Submission Request Status Banner Card */}
                                {latestExtraRequest && (
                                    <div
                                        className="flex items-start gap-4 rounded-[var(--radius-md)] p-3.5 sm:p-5"
                                        style={{
                                            background: latestExtraRequest.status === 'PENDING'
                                                ? 'var(--color-warning-soft)'
                                                : latestExtraRequest.status === 'APPROVED'
                                                    ? 'var(--color-success-soft)'
                                                    : 'var(--color-danger-soft)',
                                            border: '1px solid ' + (latestExtraRequest.status === 'PENDING'
                                                ? 'var(--color-warning-border)'
                                                : latestExtraRequest.status === 'APPROVED'
                                                    ? 'var(--color-success-border)'
                                                    : 'var(--color-danger-border)')
                                        }}
                                    >
                                        <div
                                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)]"
                                            style={{
                                                background: 'var(--theme-card)',
                                                color: latestExtraRequest.status === 'PENDING'
                                                    ? 'var(--color-warning)'
                                                    : latestExtraRequest.status === 'APPROVED'
                                                        ? 'var(--color-success)'
                                                        : 'var(--color-danger)'
                                            }}
                                        >
                                            {latestExtraRequest.status === 'PENDING' && <FiClock size={18} />}
                                            {latestExtraRequest.status === 'APPROVED' && <FiCheckCircle size={18} />}
                                            {latestExtraRequest.status === 'REJECTED' && <FiXCircle size={18} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4
                                                className="text-[13.5px] font-semibold truncate"
                                                style={{
                                                    color: latestExtraRequest.status === 'PENDING'
                                                        ? 'var(--color-warning)'
                                                        : latestExtraRequest.status === 'APPROVED'
                                                            ? 'var(--color-success)'
                                                            : 'var(--color-danger)'
                                                }}
                                            >
                                                {latestExtraRequest.status === 'PENDING' && 'Extra submission request pending'}
                                                {latestExtraRequest.status === 'APPROVED' && 'Extra submission request approved'}
                                                {latestExtraRequest.status === 'REJECTED' && 'Extra submission request rejected'}
                                            </h4>
                                            <p className="mt-1 text-xs leading-relaxed text-[var(--theme-text-secondary)] break-words">
                                                {latestExtraRequest.status === 'PENDING' && 'Your request has been sent to the administrator and is awaiting review.'}
                                                {latestExtraRequest.status === 'APPROVED' && 'The administrator has granted you one additional submission.'}
                                                {latestExtraRequest.status === 'REJECTED' && 'Your request for an additional submission has been rejected by the administrator.'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Student Profile Information Card */}
                                <div className="panel p-5 sm:p-7">
                                    <div className="flex items-center gap-3.5 pb-4 mb-5 border-b border-[var(--theme-border)]">
                                        <div
                                            className="flex h-11 w-11 items-center justify-center rounded-xl shrink-0 shadow-sm"
                                            style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}
                                        >
                                            <FiUser size={22} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="panel-title text-base sm:text-lg font-bold truncate">
                                                Student profile
                                            </h3>
                                            <p className="panel-subtitle text-xs sm:text-sm truncate">
                                                Verified institutional enrollment details
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                                        <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card-muted)] p-3.5 sm:p-4 flex flex-col min-w-0 shadow-sm">
                                            <span className="text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-1">Name</span>
                                            <span className="text-[15px] sm:text-[16px] font-semibold text-[var(--theme-text-primary)] truncate">{studentDetails?.name || formData.name || "N/A"}</span>
                                        </div>

                                        <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card-muted)] p-3.5 sm:p-4 flex flex-col min-w-0 shadow-sm">
                                            <span className="text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-1">Register Number</span>
                                            <span className="text-[15px] sm:text-[16px] font-semibold font-mono text-[var(--theme-text-primary)] truncate">{studentDetails?.registerNo || formData.id || "N/A"}</span>
                                        </div>

                                        <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card-muted)] p-3.5 sm:p-4 flex flex-col min-w-0 shadow-sm">
                                            <span className="text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-1">Roll Number</span>
                                            <span className="text-[15px] sm:text-[16px] font-semibold font-mono text-[var(--theme-text-primary)] truncate">{studentDetails?.rollNo || formData.rollNo || "N/A"}</span>
                                        </div>

                                        <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card-muted)] p-3.5 sm:p-4 flex flex-col min-w-0 shadow-sm">
                                            <span className="text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-1">Department</span>
                                            <span className="text-[15px] sm:text-[16px] font-semibold text-[var(--theme-text-primary)] truncate">{studentDetails?.department || formData.dept || "N/A"}</span>
                                        </div>

                                        <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card-muted)] p-3.5 sm:p-4 flex flex-col min-w-0 shadow-sm">
                                            <span className="text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-1">Gender</span>
                                            <span className="text-[15px] sm:text-[16px] font-semibold text-[var(--theme-text-primary)] capitalize truncate">{studentDetails?.gender ? (studentDetails.gender.toLowerCase() === 'male' ? 'Male' : studentDetails.gender.toLowerCase() === 'female' ? 'Female' : studentDetails.gender) : "N/A"}</span>
                                        </div>

                                        <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card-muted)] p-3.5 sm:p-4 flex flex-col min-w-0 shadow-sm">
                                            <span className="text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-1">Phone Number</span>
                                            <span className="text-[15px] sm:text-[16px] font-semibold font-mono text-[var(--theme-text-primary)] truncate">{studentDetails?.phoneNo || studentDetails?.phone || formData.mobile || "N/A"}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* ── 1. Applied Status State ── */}
                                {hasActiveAppliedRequest && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="panel p-5 sm:p-7 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-5 border-emerald-500/25 bg-emerald-500/5 shadow-sm"
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <span
                                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                                                style={{
                                                    backgroundColor: "var(--color-success-soft)",
                                                    color: "var(--color-success)",
                                                    border: "1px solid var(--color-success-border)"
                                                }}
                                            >
                                                <FiCheckCircle size={24} className="text-emerald-600 dark:text-emerald-400" />
                                            </span>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2.5 flex-wrap">
                                                    <span className="text-[17px] sm:text-[19px] font-bold text-[var(--theme-text-primary)]">
                                                        Applied
                                                    </span>
                                                    <span className="badge badge-success text-[12px] font-semibold">
                                                        {getStatusDisplay(activeRequest?.currentStatus || "Submitted")}
                                                    </span>
                                                </div>
                                                <p className="text-xs sm:text-sm text-[var(--theme-text-secondary)] mt-1 break-words">
                                                    Your mess reduction request has been submitted and is currently in review.
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('track')}
                                            className="btn btn-primary h-11 px-5 text-sm font-semibold shrink-0 w-full sm:w-auto flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            <FiActivity size={16} /> Track Status
                                        </button>
                                    </motion.div>
                                )}

                                {/* ── 2. Rejected Status State ── */}
                                {!hasActiveAppliedRequest && isRejectedRequest && !isApplying && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="panel p-4 sm:p-6 flex flex-col gap-4 sm:gap-5 border-[var(--color-danger-border)] bg-[var(--color-danger-soft)]"
                                    >
                                        {/* Header with Rejected Badge & Stage */}
                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 border-b border-[var(--color-danger-border)]/40">
                                            <div className="flex items-center gap-3.5 min-w-0">
                                                <span
                                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                                                    style={{
                                                        backgroundColor: "var(--theme-card)",
                                                        color: "var(--color-danger)",
                                                        border: "1px solid var(--color-danger-border)"
                                                    }}
                                                >
                                                    <FiXCircle size={22} className="text-rose-600 dark:text-rose-400" />
                                                </span>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-[16px] sm:text-[17px] font-semibold text-[var(--theme-text-primary)]">
                                                            Application Rejected
                                                        </span>
                                                        <span className="badge badge-danger text-[11px] font-bold uppercase tracking-wider">
                                                            REJECTED
                                                        </span>
                                                        <span className="text-xs font-semibold text-[var(--color-danger)]">
                                                            by {getRejectedStageDisplay(activeRequest)}
                                                        </span>
                                                    </div>
                                                    {getRejectedTimeDisplay(activeRequest) && (
                                                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                                                            Decision recorded on {getRejectedTimeDisplay(activeRequest)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 self-stretch sm:self-auto flex-col sm:flex-row">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEditRequest(activeRequest)}
                                                    className="btn btn-primary h-10 sm:h-9 px-4 text-xs font-semibold w-full sm:w-auto flex items-center justify-center gap-1.5"
                                                >
                                                    <FiEdit3 size={14} /> Edit & Resubmit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('track')}
                                                    className="btn btn-secondary h-10 sm:h-9 px-3 text-xs w-full sm:w-auto flex items-center justify-center gap-1.5"
                                                >
                                                    <FiActivity size={14} /> Track Status
                                                </button>
                                            </div>
                                        </div>

                                        {/* Rejection Reason Callout */}
                                        <div className="p-4 rounded-[var(--radius-md)] border border-[var(--color-danger-border)] bg-[var(--theme-card)]">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <FiAlertTriangle size={15} className="text-[var(--color-danger)] shrink-0" />
                                                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-danger)]">
                                                    Rejection Reason
                                                </span>
                                            </div>
                                            <p className="text-[13.5px] font-medium leading-relaxed text-[var(--theme-text-primary)] break-words">
                                                {activeRequest.rejectReason || trackingDetails?.rejectionReason || "No specific reason provided by reviewer."}
                                            </p>
                                        </div>

                                        {/* Preserved Application Details */}
                                        <div className="rounded-[var(--radius-md)] border border-[var(--theme-border)] bg-[var(--theme-card)] p-4">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-secondary)] mb-3">
                                                Original Application Details
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-[10px] font-semibold text-[var(--theme-text-secondary)] uppercase">Leave Schedule</span>
                                                    <span className="text-[13px] font-semibold text-[var(--theme-text-primary)] truncate">
                                                        {activeRequest.leaveDate} {activeRequest.leaveTime ? activeRequest.leaveTime.substring(0, 5) : ''}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-[10px] font-semibold text-[var(--theme-text-secondary)] uppercase">Arrival Schedule</span>
                                                    <span className="text-[13px] font-semibold text-[var(--theme-text-primary)] truncate">
                                                        {activeRequest.arrivalDate} {activeRequest.arrivalTime ? activeRequest.arrivalTime.substring(0, 5) : ''}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-[10px] font-semibold text-[var(--theme-text-secondary)] uppercase">Reason for Leave</span>
                                                    <span className="text-[13px] font-semibold text-[var(--theme-text-primary)] truncate" title={activeRequest.reason}>
                                                        {activeRequest.reason || "N/A"}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-[10px] font-semibold text-[var(--theme-text-secondary)] uppercase">Room / Year</span>
                                                    <span className="text-[13px] font-semibold text-[var(--theme-text-primary)] truncate">
                                                        Room {activeRequest.roomNo || "N/A"} · {activeRequest.year ? `${activeRequest.year} Year` : "N/A"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Helper Note & Fresh Application option */}
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 text-xs text-[var(--theme-text-secondary)]">
                                            <p className="break-words">
                                                You can correct your dates or reason and resubmit, or apply for an entirely new date window.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    handleReset();
                                                    setIsApplying(true);
                                                }}
                                                className="text-xs font-semibold text-[var(--color-accent)] hover:underline whitespace-nowrap self-start sm:self-auto cursor-pointer"
                                            >
                                                Submit fresh application instead →
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* ── 3. Initial Dashboard State: Prominent Apply Button ── */}
                                {!hasActiveAppliedRequest && !isRejectedRequest && !isApplying && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.25 }}
                                        className="panel p-4 sm:p-7 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4"
                                    >
                                        <div className="min-w-0">
                                            <h3 className="panel-title truncate">Mess Reduction Application</h3>
                                            <p className="panel-subtitle">
                                                Submit a request for hostel mess bill reduction during eligible leave days.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setIsApplying(true)}
                                            disabled={isLimitReached}
                                            className="btn btn-primary h-11 px-7 text-sm font-semibold shadow-sm w-full sm:w-auto flex items-center justify-center gap-2 shrink-0"
                                        >
                                            <FiEdit3 size={16} />
                                            Apply Mess Reduction
                                        </button>
                                    </motion.div>
                                )}

                                {/* ── 3. When Apply Mess Reduction Is Clicked: Complete Form ── */}
                                {!hasActiveAppliedRequest && isApplying && (
                                    <motion.div
                                        id="form-section"
                                        initial={{ opacity: 0, y: 14 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -14 }}
                                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                        className="panel overflow-visible"
                                    >
                                    <div className="panel-header flex-col sm:flex-row items-start sm:items-center gap-3">
                                        <div className="min-w-0">
                                            <h3 className="panel-title">
                                                {editingFormId ? "Edit reduction request" : "New mess reduction request"}
                                            </h3>
                                            <p className="panel-subtitle">
                                                {editingFormId ? "Update your dates or reason and resubmit." : "Fill in your hostel leave schedule below."}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--theme-border)] bg-[var(--theme-card-muted)] p-2.5 shadow-xs w-full sm:w-auto justify-between sm:justify-start">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-0.5">Daily submission limit</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex gap-1">
                                                        {[...Array(totalAllowed)].map((_, i) => (
                                                            <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < limits.dailyCount ? 'bg-[var(--theme-btn-primary)]' : 'bg-[var(--theme-border-strong)]'}`}></div>
                                                        ))}
                                                    </div>
                                                    <span className="text-xs font-semibold text-[var(--theme-text-primary)]">{limits.dailyCount}/{totalAllowed} used</span>
                                                </div>
                                            </div>
                                            {isLimitReached && (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowExtraDialog(true)}
                                                    disabled={isAnyProcessing}
                                                    className="btn btn-secondary h-8 px-2.5 text-[11px]"
                                                >
                                                    Request extra
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-5 sm:p-7">
                                        <form onSubmit={handleSubmit} className="flex flex-col gap-5 sm:gap-6">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                                <CustomSelect
                                                    label="Year of Study"
                                                    icon={<FiCalendar size={20} />}
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
                                                    icon={<FiMapPin size={20} />}
                                                    type="number"
                                                    placeholder="e.g. 4012"
                                                    name="room"
                                                    value={formData.room}
                                                    onChange={handleChange}
                                                    min="1"
                                                    required
                                                    id="room-input"
                                                    error={formErrors.room}
                                                    className="flex-1 bg-transparent focus:outline-none text-[15px] sm:text-[16px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]/50 font-medium w-full appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                                <Field label="Leave Date" icon={<FiCalendar size={20} />} type="date" name="leaveDate" value={formData.leaveDate} onChange={handleChange} min={new Date().toLocaleDateString('en-CA')} required id="leave-date-input" />
                                                <Field label="Leave Time" icon={<FiClock size={20} />} type="time" name="leaveTime" value={formData.leaveTime} onChange={handleChange} required id="leave-time-input" />
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                                <Field label="Arrival Date" icon={<FiCalendar size={20} />} type="date" name="arrivalDate" value={formData.arrivalDate} onChange={handleChange} min={formData.leaveDate || new Date().toLocaleDateString('en-CA')} required id="arrival-date-input" />
                                                <Field label="Arrival Time" icon={<FiClock size={20} />} type="time" name="arrivalTime" value={formData.arrivalTime} onChange={handleChange} required id="arrival-time-input" />
                                            </div>

                                            <CustomSelect
                                                label="Reason for Leave"
                                                icon={<FiInfo size={20} />}
                                                name="reason"
                                                id="reason-select"
                                                value={formData.reason}
                                                onChange={handleChange}
                                                required
                                                placeholder="Select Leave Reason"
                                                options={[
                                                    { value: "Going to home", label: "Going to home" },
                                                    { value: "Going to hospital", label: "Going to hospital" },
                                                    { value: "Attending symposium", label: "Attending symposium" },
                                                    { value: "Attending conference", label: "Attending conference" },
                                                    { value: "Attending workshop", label: "Attending workshop" },
                                                    { value: "Industrial visit", label: "Industrial visit" },
                                                    { value: "Sports event", label: "Sports event" },
                                                    { value: "Other", label: "Other (Please specify)" }
                                                ]}
                                                dropUp={true}
                                            />

                                            <AnimatePresence>
                                                {(formData.reason === "other" || formData.reason === "Other Reason" || formData.reason === "Other") && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, height: 0, marginTop: 0 }} 
                                                        animate={{ opacity: 1, height: "auto", marginTop: 8 }} 
                                                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="overflow-visible w-full"
                                                    >
                                                        <Field 
                                                            label="Specify Reason" 
                                                            icon={<FiFileText size={18} />} 
                                                            type="text" 
                                                            placeholder="Enter your specific reason for leave" 
                                                            name="otherReason" 
                                                            value={formData.otherReason} 
                                                            onChange={handleChange} 
                                                            required 
                                                            id="other-reason-input"
                                                            error={formErrors.otherReason}
                                                        />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            {isInProgressRequest && (
                                                <div className="rounded-[12px] border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5 p-3.5 sm:p-4 flex items-start gap-3 text-[var(--color-warning)]">
                                                    <FiAlertTriangle size={18} className="shrink-0 mt-0.5" />
                                                    <p className="text-sm font-medium leading-relaxed">
                                                        You already have an active request. Please delete it or wait for processing to submit a new one.
                                                    </p>
                                                </div>
                                            )}

                                            {isCompletedRequest && (
                                                <div
                                                    className="flex items-start gap-3 rounded-[var(--radius-md)] p-3.5 sm:p-4"
                                                    style={{ background: 'var(--color-success-soft)', border: '1px solid var(--color-success-border)' }}
                                                >
                                                    <FiCheckCircle size={18} className="mt-0.5 shrink-0" style={{ color: 'var(--color-success)' }} />
                                                    <div className="space-y-1 text-[13px] font-medium leading-relaxed text-[var(--theme-text-secondary)]">
                                                        <p className="font-semibold" style={{ color: 'var(--color-success)' }}>
                                                            Your previous mess reduction request has been completed.
                                                        </p>
                                                        <p>
                                                            You can submit your next reduction request from:{' '}
                                                            <span className="font-semibold text-[var(--theme-text-primary)]">{formatNextRequestDate(latestForm.arrivalDate)}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {isLimitReached && !isInProgressRequest && !isCompletedRequest && (
                                                <div className="rounded-[12px] border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5 p-3.5 sm:p-4 flex items-start gap-3 text-[var(--color-warning)]">
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

                                            <div className="mt-2 flex flex-col gap-2.5 sm:flex-row">
                                                <button
                                                    className="btn btn-primary h-11 flex-1 text-[14px] flex items-center justify-center gap-2"
                                                    type="submit"
                                                    disabled={isSubmitting || isSubmitBlocked || isAnyProcessing}
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                                            Processing…
                                                        </>
                                                    ) : (
                                                        editingFormId ? "Resubmit request" : "Submit request"
                                                    )}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={handleReset}
                                                    disabled={isAnyProcessing}
                                                    className="btn btn-secondary h-11 px-8 text-[14px] flex items-center justify-center"
                                                >
                                                    Reset
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsApplying(false);
                                                        setEditingFormId(null);
                                                        setFormErrors({});
                                                    }}
                                                    disabled={isAnyProcessing}
                                                    className="btn btn-ghost h-11 px-6 text-[14px] flex items-center justify-center"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}


                        {activeTab === 'track' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="w-full space-y-6">
                                <div className="panel p-5 sm:p-8 shadow-sm">
                                    <div className="mb-7 flex flex-col justify-between gap-4 border-b border-[var(--theme-border)] pb-6 sm:flex-row sm:items-center">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h2 className="text-lg sm:text-xl font-bold text-[var(--theme-text-primary)]">Track request</h2>
                                                {sseConnectionStatus === 'connected' && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live
                                                    </span>
                                                )}
                                                {sseConnectionStatus === 'reconnecting' && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" /> Reconnecting
                                                    </span>
                                                )}
                                                {sseConnectionStatus === 'disconnected' && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-gray-500/10 text-gray-500 dark:text-gray-400 border border-gray-500/20">
                                                        <span className="h-2 w-2 rounded-full bg-gray-400" /> Disconnected
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-1 text-xs sm:text-sm text-[var(--theme-text-secondary)]">
                                                Monitor the real-time status of your active application.
                                            </p>
                                        </div>
                                        {activeRequest && (
                                            <motion.span 
                                                key={activeRequest.currentStatus}
                                                initial={{ scale: 0.9, opacity: 0.8 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ duration: 0.2 }}
                                                className={`${getStatusColor(activeRequest.currentStatus)} shrink-0`}
                                            >
                                                {getStatusDisplay(activeRequest.currentStatus)}
                                            </motion.span>
                                        )}
                                    </div>

                                    {activeRequest ? (
                                        <>
                                            <RequestTimeline tracking={trackingDetails} activeRequest={activeRequest} onEditRequest={handleEditRequest} />

                                            {activeRequest.currentStatus === 'PendingOffice' && (
                                                <div
                                                    className="mt-8 rounded-[var(--radius-md)] p-5"
                                                    style={{ background: 'var(--color-info-soft)', border: '1px solid var(--color-info-border)' }}
                                                >
                                                    <h3 className="mb-2 flex items-center gap-2 text-[13.5px] font-semibold" style={{ color: 'var(--color-info)' }}>
                                                        <FiCheckCircle size={17} />
                                                        Important information
                                                    </h3>
                                                    <p className="text-[13px] leading-relaxed text-[var(--theme-text-secondary)]">
                                                        Your mess reduction request has been successfully processed and is now pending final completion at the hostel office.
                                                    </p>
                                                    <p className="mt-1 text-[13px] leading-relaxed text-[var(--theme-text-secondary)]">
                                                        Please visit the hostel office to complete the final verification and collect your mess reduction confirmation.
                                                    </p>
                                                </div>
                                            )}

                                            {activeRequest.currentStatus !== 'Approved' && (
                                                <div className="mt-6 pt-5 border-t border-[var(--theme-border)] flex justify-end">
                                                    <button
                                                        type="button"
                                                        disabled={isAnyProcessing}
                                                        onClick={() => handleDeleteRequest(activeRequest.formId)}
                                                        className="btn btn-secondary text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] w-full sm:w-auto flex items-center justify-center"
                                                        style={{ borderColor: 'var(--color-danger-border)' }}
                                                    >
                                                        {isDeleting ? 'Deleting…' : 'Delete request'}
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="empty-state">
                                            <div className="empty-state-icon">
                                                <FiCheckCircle size={20} />
                                            </div>
                                            <h3 className="text-[14px] font-semibold text-[var(--theme-text-primary)]">No active requests</h3>
                                            <p className="max-w-sm text-xs text-[var(--theme-text-secondary)]">
                                                You don't have any pending or active mess reduction requests to track.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </div>

            {/* Mobile Bottom Navigation - Viewport Pinned, hidden when drawer is open */}
            {!isDrawerOpen && (
                <MobileBottomNav
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    isAnyProcessing={isAnyProcessing}
                />
            )}

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
                            initial={{ scale: 0.97, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.98, opacity: 0, y: 8 }}
                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            role="dialog"
                            aria-modal="true"
                            className="w-full max-w-md overflow-hidden rounded-[var(--radius-lg)]"
                            style={{
                                background: 'var(--theme-card)',
                                border: '1px solid var(--theme-border)',
                                boxShadow: 'var(--shadow-modal)'
                            }}
                        >
                            <div className="px-6 pt-5 pb-4">
                                <h3 className="text-[15px] font-semibold text-[var(--theme-text-primary)]">Request extra limit</h3>
                                <p className="mt-1 text-xs leading-relaxed text-[var(--theme-text-secondary)]">
                                    Explain why you need an additional submission today. The administration will review your request.
                                </p>

                                <label htmlFor="extra-reason" className="field-label mt-4">Reason</label>
                                <textarea
                                    id="extra-reason"
                                    value={extraReason}
                                    onChange={(e) => setExtraReason(e.target.value)}
                                    placeholder="Enter a detailed reason"
                                    className="h-32 w-full resize-none text-[13px]"
                                />
                            </div>

                            <div
                                className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 px-4 sm:px-6 py-3.5"
                                style={{ borderTop: '1px solid var(--theme-border)', background: 'var(--theme-card-muted)' }}
                            >
                                <button
                                    onClick={() => {
                                        setShowExtraDialog(false);
                                        setExtraReason("");
                                    }}
                                    className="btn btn-secondary w-full sm:w-auto flex items-center justify-center"
                                    disabled={isRequestingExtra}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRequestExtraSubmission}
                                    disabled={isRequestingExtra || !extraReason.trim()}
                                    className="btn btn-primary w-full sm:w-auto flex items-center justify-center"
                                >
                                    {isRequestingExtra ? (
                                        <>
                                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                            Submitting…
                                        </>
                                    ) : (
                                        'Submit request'
                                    )}
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
        </AppLayout>
    );
}

export default MessReductionPage;