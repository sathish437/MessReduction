import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    FiCheckCircle, FiXCircle, FiClock, FiFileText, FiFilter, FiLogOut,
    FiShield, FiTrendingUp, FiArrowRight, FiCalendar, FiMapPin, FiUsers,
    FiCheck, FiX, FiHash, FiCheckSquare, FiSquare, FiSearch, FiSun, FiMoon
} from "react-icons/fi";
import axios from 'axios';
import { useTheme } from "./context/ThemeContext";
import apiClient from "./api/apiClient";
import { deleteCookie, getCookie } from "./utils/cookieUtils";
import logo from './assets/1000088399.png';
import ActivityLogModal from "./ActivityLogModal";
import { logout } from "./services/authService";
import { getActiveDepartments } from "./api/departmentService";
import Toast from "./components/Toast";
import MultiSelect from "./MultiSelect";
import BulkOperationProgress from "./components/BulkOperationProgress";
import useBulkOperation from "./hooks/useBulkOperation";
import StaffHeader from "./components/StaffHeader";
import AutoAcceptSettingsCard from "./components/AutoAcceptSettingsCard";
import AppLayout from "./components/AppLayout";
import { useSseNotifications } from "./hooks/useSseNotifications";
import SseNotificationToast from "./components/SseNotificationToast";

const handleLogout = () => {
  logout();
};

const YEARS = ["1st", "2nd", "3rd", "4th"];

const YEAR_THEME = {
    "1st": { color: "teal", active: "bg-[var(--theme-btn-primary)]", text: "text-[var(--theme-btn-primary)]", border: "border-[var(--theme-btn-primary)]/20", ring: "bg-[var(--theme-btn-primary)]/10", glow: "shadow-sm" },
    "2nd": { color: "blue", active: "bg-blue-500", text: "text-blue-400", border: "border-blue-500/20", ring: "bg-blue-500/10", glow: "shadow-sm" },
    "3rd": { color: "teal", active: "bg-[var(--theme-btn-primary)]", text: "text-[var(--theme-btn-primary)]", border: "border-[var(--theme-btn-primary)]/20", ring: "bg-[var(--theme-btn-primary)]/10", glow: "shadow-sm" },
    "4th": { color: "blue", active: "bg-blue-500", text: "text-blue-400", border: "border-blue-500/20", ring: "bg-blue-500/10", glow: "shadow-sm" },
};

/* ── Year Selection Screen ── */
function YearSelectScreen({ onSelect }) {
    return (
        <div className="min-h-screen w-full bg-[var(--theme-bg)] flex flex-col items-center justify-center font-sans text-[var(--theme-text-primary)] px-6">
            {/* Background glow removed for professional admin dashboard */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
            </div>

            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                className="flex flex-col items-center gap-10 max-w-2xl w-full"
            >
                {/* Logo + Title */}
                <div className="flex flex-col items-center gap-4 text-center">
                    <img src={logo} alt="GCES" className="w-12 h-12 sm:w-16 sm:h-16 object-contain" />
                    <div>
                        <p className="text-xs font-semibold tracking-wider text-[var(--theme-text-secondary)] uppercase mb-1.5">Authority Panel</p>
                        <h1 className="text-2xl sm:text-4xl font-bold text-[var(--theme-text-primary)] tracking-wide uppercase px-2">Chief Warden</h1>
                        <p className="text-sm sm:text-base text-[var(--theme-text-secondary)] font-medium mt-2">Select your year assignment to continue</p>
                    </div>
                </div>

                {/* Year Cards */}
                <div className="grid grid-cols-2 gap-5 w-full">
                    {YEARS.map((yr, i) => {
                        const t = YEAR_THEME[yr];
                        return (
                            <motion.button
                                key={yr}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 + 0.2 }}
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onSelect(yr)}
                                className={`group relative bg-[var(--theme-card)] ${t.border} border rounded-2xl p-6 flex flex-col items-start gap-4 text-left overflow-hidden hover:bg-white/[0.02] shadow-sm transition-all duration-200`}
                            >
                                <div className={`w-10 h-10 rounded-xl ${t.ring} border ${t.border} flex items-center justify-center`}>
                                    <FiUsers className={t.text} size={18} />
                                </div>
                                <div>
                                    <p className={`text-xs font-semibold tracking-wider uppercase ${t.text} mb-1`}>Year {i + 1}</p>
                                    <h3 className="text-2xl font-bold text-[var(--theme-text-primary)]">{yr}</h3>
                                    <p className="text-sm text-[var(--theme-text-secondary)] font-medium mt-0.5">Warden Panel</p>
                                </div>
                                <div className={`flex items-center gap-1.5 ${t.text} text-xs font-semibold uppercase tracking-wider mt-auto`}>
                                    Enter <FiArrowRight size={14} />
                                </div>
                            </motion.button>
                        );
                    })}
                </div>

                 <p className="text-sm text-[var(--theme-text-secondary)] tracking-widest uppercase">© 2025 GCES · Mess Reduction Portal</p>
            </motion.div>
        </div>
    );
}

/* ── Main Warden Panel ── */
const Warden = () => {
    const { isDark, toggleTheme } = useTheme();
    const [requests, setRequests]         = useState([]);
    const [counts, setCounts]             = useState(null);
    const [loading, setLoading]           = useState(true);
    const [view, setView]                 = useState("dashboard"); // 'dashboard' | 'requests'
    const [selectedIds, setSelectedIds]   = useState([]);

    // Pagination & Expand Reason Modal States
    const [currentPage, setCurrentPage]   = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [selectedReason, setSelectedReason] = useState(null);

    // Filter State
    const [genderFilter, setGenderFilter] = useState("ALL");
    const [deptFilter, setDeptFilter]     = useState("ALL");
    const [selectedYear, setSelectedYear] = useState("all");
    const [searchQuery, setSearchQuery]   = useState("");
    const [activeDepts, setActiveDepts]   = useState([]);

    useEffect(() => {
        getActiveDepartments().then(depts => {
            if (Array.isArray(depts)) {
                setActiveDepts(depts);
            }
        });
    }, []);

    // Reset pagination on filter/search change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedYear, genderFilter, deptFilter, itemsPerPage]);

    const [processingIds, setProcessingIds] = useState(new Set());
    const {
        bulkState,
        isBulkProcessing,
        startBulkOperation,
        completeSuccess,
        completePartial,
        completeFailure,
        closeProgress
    } = useBulkOperation();
    const [isRejecting, setIsRejecting] = useState(false);

    // Toast Notification State
    const [toast, setToast] = useState(null);
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // Rejection Modal State
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectFormId, setRejectFormId] = useState(null);
    const [rejectReason, setRejectReason] = useState("");
    const [isBulkReject, setIsBulkReject] = useState(false);

    // Activity Log Modal State
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [logActionType, setLogActionType] = useState("Approved");
    const [logActionTitle, setLogActionTitle] = useState("Accepted");

    // Real-time SSE Notifications for Warden with automatic table synchronization
    const {
        notifications: sseNotifications,
        unreadCount: sseUnreadCount,
        dismissNotification: dismissSseNotification,
    } = useSseNotifications({
        onNewRequest: async () => {
            try {
                await fetchData(null, true);
            } catch (err) {
                console.error("Failed to sync warden requests after SSE event:", err);
            }
        }
    });

    useEffect(() => {
        const controller = new AbortController();
        fetchData(controller.signal);
        return () => {
            controller.abort();
        };
    }, [genderFilter, selectedYear]);

    const fetchData = async (signal = null, silent = false) => {
        if (!silent) setLoading(true);
        try {
            // Get logged-in username from cookie
            const username = getCookie('staffUsername');

            // Build query params for filtering
            let queryParams = `userName=${username}`;
            if (genderFilter && genderFilter !== "ALL") {
                queryParams += `&gender=${genderFilter}`;
            }
            if (selectedYear !== "all") {
                const yearNum = selectedYear === "1st" ? 1 : selectedYear === "2nd" ? 2 : selectedYear === "3rd" ? 3 : 4;
                queryParams += `&year=${yearNum}`;
            }

            // Fetch warden counts and forms concurrently
            const [countsRes, formsRes] = await Promise.all([
                apiClient.get(`/api/hostelStaff/staff/dashboard-count/warden?userName=${username}`, signal ? { signal } : {}),
                apiClient.get(`/api/hostelStaff/staff/warden?${queryParams}`, signal ? { signal } : {})
            ]);
            if (signal && signal.aborted) return;
            setCounts(countsRes.data);

            // Backend returns array (may be empty) - map to frontend format
            const data = Array.isArray(formsRes.data) ? formsRes.data.map(r => ({
                ...r,
                id: r.formId,
                name: r.name || r.studentDetails?.name || "N/A",
                dept: r.department || r.dept || r.studentDetails?.department || "N/A",
                registerNo: r.registerNo || r.studentDetails?.registerNo || "N/A",
                phone: r.phoneNo || r.phone || r.studentDetails?.phoneNo || "N/A",
                year: r.year ?? r.studentDetails?.year ?? r.studentDetails?.currentYear ?? "N/A",
                room: r.roomNo || "N/A",
                dates: `${r.leaveDate} ${r.leaveTime ? r.leaveTime.substring(0, 5) : ''} - ${r.arrivalDate} ${r.arrivalTime ? r.arrivalTime.substring(0, 5) : ''}`,
                submittedAt: r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "N/A"
            })) : [];
            // Prevent duplicate records using application ID
            setRequests(prev => {
                const map = new Map();
                data.forEach(item => map.set(item.id, item));
                return Array.from(map.values());
            });
        } catch (err) {
            if (axios.isCancel(err) || (signal && signal.aborted) || err?.name === 'CanceledError') {
                return;
            }
            console.error("Error fetching data:", err);
            showToast("Failed to load requests", 'error');
            setRequests([]);
            setCounts({ pendingWarden: 0, pendingDeputyWarden: 0, pendingOffice: 0, approved: 0, rejectedWarden: 0, rejectedDeputyWarden: 0, rejectedOffice: 0 });
        } finally {
            if (!silent && (!signal || !signal.aborted)) {
                setLoading(false);
            }
        }
    };
    const handleAction = async (formId, action) => {
        // Prevent concurrent execution for the same formId
        if (processingIds.has(formId) || isBulkProcessing) return;

        // Optimistically lock item
        setProcessingIds(prev => new Set(prev).add(formId));

        if (action === "Reject") {
            setRejectFormId(formId);
            setRejectReason("");
            setIsBulkReject(false);
            setIsRejectModalOpen(true);
            setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(formId);
                return newSet;
            });
            return;
        }

        // Check token before making request
        const token = getCookie('staffToken') || sessionStorage.getItem('staffToken') || localStorage.getItem('staffToken');
        if (!token) {
            showToast("Authentication token not found. Please login again.", 'error');
            handleLogout();
            return;
        }

        try {
            await apiClient.patch(`/api/hostelStaff/staff/warden/${formId}?action=${action}`);
            showToast(`Request ${action.toLowerCase()}d successfully`, 'success');
            // Optimistic update
            setRequests(prev => prev.filter(r => r.id !== formId));
            setCounts(prev => prev ? {
                ...prev,
                pendingWarden: Math.max(0, (prev.pendingWarden || 0) - 1),
                pendingOffice: (prev.pendingOffice || 0) + 1
            } : prev);
            // Silent refresh data after action
            await fetchData(null, true);
        } catch (err) {
            if (err.response?.status === 401) {
                showToast("Session expired. Please login again.", 'error');
                handleLogout();
            } else {
                showToast("Failed to update status.", 'error');
            }
        } finally {
            // Remove from processing set to allow subsequent actions/retries
            setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(formId);
                return newSet;
            });
        }
    };

    const handleRejectSubmit = async () => {
        if (isRejecting || isBulkProcessing) return;
        
        if (!rejectReason.trim()) {
            showToast("Please enter a reason for rejection.", 'error');
            return;
        }

        // Check token before making request
        const token = getCookie('staffToken') || sessionStorage.getItem('staffToken') || localStorage.getItem('staffToken');
        if (!token) {
            showToast("Authentication token not found. Please login again.", 'error');
            handleLogout();
            return;
        }

        if (isBulkReject) {
            const idsToReject = [...selectedIds];
            const reason = rejectReason;
            setIsRejectModalOpen(false);
            setRejectFormId(null);
            setIsBulkReject(false);
            setRejectReason("");
            startBulkOperation('REJECT', idsToReject.length, 'Rejecting Requests...');

            try {
                const res = await apiClient.patch(`/api/hostelStaff/staff/warden/bulk-reject`, {
                    formIds: idsToReject,
                    rejectReason: reason
                });
                const processedSet = new Set(idsToReject);
                const rejCount = res.data?.rejected || 0;
                const failCount = res.data?.failed || 0;

                setRequests(prev => prev.filter(r => !processedSet.has(r.id)));
                setCounts(prev => prev ? {
                    ...prev,
                    pendingWarden: Math.max(0, (prev.pendingWarden || 0) - (rejCount || processedSet.size)),
                    rejectedWarden: (prev.rejectedWarden || 0) + (rejCount || processedSet.size)
                } : prev);
                setSelectedIds([]);

                if (failCount > 0) {
                    completePartial(res.data?.selected || idsToReject.length, rejCount, failCount);
                } else {
                    completeSuccess(rejCount, res.data?.selected || idsToReject.length);
                }
                showToast(`Bulk Reject Summary: Selected: ${res.data.selected}, Rejected: ${res.data.rejected}, Failed: ${res.data.failed}`, 'success');
                await fetchData(null, true);
            } catch (err) {
                if (err.response?.status === 401) {
                    closeProgress();
                    showToast("Session expired. Please login again.", 'error');
                    handleLogout();
                } else {
                    const errorMsg = err.response?.data?.message || "Failed to reject request.";
                    completeFailure(errorMsg);
                    showToast(errorMsg, 'error');
                }
            }
        } else {
            setIsRejecting(true);
            try {
                await apiClient.patch(`/api/hostelStaff/staff/warden/${rejectFormId}/reject`, { rejectReason });
                setRequests(prev => prev.filter(r => r.id !== rejectFormId));
                setCounts(prev => prev ? {
                    ...prev,
                    pendingWarden: Math.max(0, (prev.pendingWarden || 0) - 1),
                    rejectedWarden: (prev.rejectedWarden || 0) + 1
                } : prev);
                showToast("Request rejected successfully", 'success');
                setIsRejectModalOpen(false);
                setRejectFormId(null);
                setIsBulkReject(false);
                setRejectReason("");
                await fetchData(null, true);
            } catch (err) {
                if (err.response?.status === 401) {
                    showToast("Session expired. Please login again.", 'error');
                    handleLogout();
                } else {
                    showToast("Failed to reject request.", 'error');
                }
            } finally {
                setIsRejecting(false); // Enable retry on failure
            }
        }
    };

    const handleBulkAction = async () => {
        if (selectedIds.length === 0 || isBulkProcessing) return;

        // Check token before making request
        const token = getCookie('staffToken') || sessionStorage.getItem('staffToken') || localStorage.getItem('staffToken');
        if (!token) {
            showToast("Authentication token not found. Please login again.", 'error');
            handleLogout();
            return;
        }

        const idsToProcess = [...selectedIds];
        startBulkOperation('APPROVE', idsToProcess.length, 'Approving Requests...');

        try {
            await apiClient.patch(`/api/hostelStaff/staff/warden/bulk?action=Approve`, idsToProcess);
            const processedSet = new Set(idsToProcess);
            setRequests(prev => prev.filter(r => !processedSet.has(r.id)));
            setCounts(prev => prev ? {
                ...prev,
                pendingWarden: Math.max(0, (prev.pendingWarden || 0) - processedSet.size),
                pendingOffice: (prev.pendingOffice || 0) + processedSet.size
            } : prev);
            setSelectedIds([]);
            completeSuccess(idsToProcess.length, idsToProcess.length);
            showToast("Bulk approval completed successfully", 'success');
            await fetchData(null, true);
        } catch (err) {
            if (err.response?.status === 401) {
                closeProgress();
                showToast("Session expired. Please login again.", 'error');
                handleLogout();
            } else if (err.response?.status === 409) {
                completeFailure("Some selected forms are not in the correct status for approval. Please refresh and try again.");
                showToast("Some selected forms are not in the correct status for approval. Please refresh and try again.", 'error');
                await fetchData(null, true);
            } else {
                const errorMsg = err.response?.data?.message || "Failed to perform bulk approval.";
                completeFailure(errorMsg);
                showToast(errorMsg, 'error');
            }
        }
    };

    // Apply client-side search, department, and year filter
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const pendingForms = requests.filter(r => {
        let matchDept = true;
        if (deptFilter && deptFilter !== "ALL") {
            matchDept = (r.dept || r.department) === deptFilter;
        }
        if (!matchDept) return false;

        let matchYear = true;
        if (selectedYear && selectedYear !== "all") {
            const expectedYear = selectedYear === "1st" ? 1 : selectedYear === "2nd" ? 2 : selectedYear === "3rd" ? 3 : 4;
            matchYear = Number(r.year) === expectedYear;
        }
        if (!matchYear) return false;

        if (!normalizedSearch) return true;
        const nameMatch = r.name?.toLowerCase().includes(normalizedSearch);
        const regNoMatch = r.registerNo?.toLowerCase().includes(normalizedSearch);
        const phoneMatch = (r.phone || r.phoneNo || "").toLowerCase().includes(normalizedSearch);
        return nameMatch || regNoMatch || phoneMatch;
    });

    const totalPages = Math.ceil(pendingForms.length / itemsPerPage);
    const paginatedForms = pendingForms.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

    const toggleSelectAll = () => {
        const allPendingIds = pendingForms.map(r => r.id);
        const allSelected = allPendingIds.length > 0 && allPendingIds.every(id => selectedIds.includes(id));
        setSelectedIds(prev => {
            if (allSelected) {
                return prev.filter(id => !allPendingIds.includes(id));
            } else {
                return Array.from(new Set([...prev, ...allPendingIds]));
            }
        });
    };

    const t = { color: "teal", active: "bg-[var(--theme-btn-primary)]", text: "text-[var(--theme-btn-primary)]", border: "border-[var(--theme-btn-primary)]/20", ring: "bg-[var(--theme-btn-primary)]/10", glow: "shadow-sm" };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--theme-bg)]">
                <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6">
                    <div className="skeleton mb-6 h-7 w-56" />
                    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="panel p-5">
                                <div className="skeleton mb-3 h-3 w-28" />
                                <div className="skeleton h-8 w-16" />
                            </div>
                        ))}
                    </div>
                    <div className="panel p-5">
                        <div className="skeleton mb-4 h-4 w-40" />
                        {[0, 1, 2, 3, 4].map((i) => (
                            <div key={i} className="skeleton mb-2 h-10 w-full" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <AppLayout
            roleTag="WARDEN PORTAL"
            pageTitle={view === "dashboard" ? "Chief Warden Dashboard" : "Review Mess Reduction Requests"}
            breadcrumbs={["GCES", "Warden", view === "dashboard" ? "Dashboard" : "Requests"]}
            navItems={[
                { key: 'dashboard', label: 'Dashboard', icon: FiTrendingUp },
                { key: 'requests', label: 'Requests', icon: FiFileText, badge: requests.length > 0 ? requests.length : undefined }
            ]}
            activeNav={view}
            onNavChange={setView}
            userInfo={{
                name: "Chief Warden",
                role: "Hostel Authority",
                userName: "warden"
            }}
            onLogout={handleLogout}
        >
            {/* Toast Notification Panel */}
            <Toast toast={toast} onClose={() => setToast(null)} />

            {/* Real-Time Floating SSE Notifications for Warden */}
            <SseNotificationToast
                notifications={sseNotifications}
                onDismiss={dismissSseNotification}
                onViewRequest={(item) => {
                    dismissSseNotification(item.applicationId);
                    setView('requests');
                }}
            />

            <div className="space-y-4">
                <AnimatePresence mode="wait">
                    {/* ════ DASHBOARD VIEW ════ */}
                    {view === "dashboard" && (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                            className="w-full space-y-6"
                        >
                            <div>
                                <h1 className="page-title">Overview</h1>
                                <p className="page-subtitle">
                                    Requests awaiting your review, plus decisions already recorded this cycle.
                                </p>
                            </div>

                            {/* ── Stats Row ── */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="stat-card">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="section-label">Pending review</p>
                                            <p className="mt-2 text-[28px] font-semibold leading-none tracking-tight text-[var(--theme-text-primary)]">
                                                {counts?.pendingWarden || 0}
                                            </p>
                                        </div>
                                        <span className="badge badge-warning">Needs action</span>
                                    </div>
                                    <p className="mt-4 text-xs text-[var(--theme-text-secondary)]">
                                        Pre-approved by the deputy warden, awaiting your signature.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => { setLogActionType("Approved"); setLogActionTitle("Warden Approved"); setIsLogModalOpen(true); }}
                                    className="stat-card text-left transition-colors hover:border-[var(--color-success-border)]"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="section-label">Approved</p>
                                            <p className="mt-2 text-[28px] font-semibold leading-none tracking-tight" style={{ color: 'var(--color-success)' }}>
                                                {(counts?.pendingOffice || 0) + (counts?.approved || 0)}
                                            </p>
                                        </div>
                                        <span className="badge badge-success">Warden approved</span>
                                    </div>
                                    <p className="mt-4 text-xs text-[var(--theme-text-secondary)]">
                                        Total requests approved and forwarded to the hostel office.
                                    </p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => { setLogActionType("Rejected"); setLogActionTitle("Warden Rejected"); setIsLogModalOpen(true); }}
                                    className="stat-card text-left transition-colors hover:border-[var(--color-danger-border)]"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="section-label">Rejected</p>
                                            <p className="mt-2 text-[28px] font-semibold leading-none tracking-tight" style={{ color: 'var(--color-danger)' }}>
                                                {counts?.rejectedWarden || 0}
                                            </p>
                                        </div>
                                        <span className="badge badge-danger">Warden rejected</span>
                                    </div>
                                    <p className="mt-4 text-xs text-[var(--theme-text-secondary)]">
                                        Requests declined with a recorded reason.
                                    </p>
                                </button>

                                <div className="stat-card">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="section-label">Total forms</p>
                                            <p className="mt-2 text-[28px] font-semibold leading-none tracking-tight text-[var(--theme-text-primary)]">
                                                {(counts?.pendingWarden || 0) + (counts?.pendingOffice || 0) + (counts?.approved || 0) + (counts?.rejectedWarden || 0)}
                                            </p>
                                        </div>
                                        <span className="badge badge-neutral">This cycle</span>
                                    </div>
                                    <p className="mt-4 text-xs text-[var(--theme-text-secondary)]">
                                        All applications in the warden review workflow.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_1fr]">
                                <section className="panel p-6">
                                    <h2 className="panel-title">Warden protocol</h2>
                                    <p className="mt-2 text-[13px] leading-relaxed text-[var(--theme-text-secondary)]">
                                        Review requests pre-approved by deputy wardens. Your digital signature finalises
                                        the reduction for the hostel office records.
                                    </p>
                                    <div className="mt-6 flex items-center gap-2.5 border-t border-[var(--theme-border)] pt-4">
                                        <span
                                            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)]"
                                            style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}
                                        >
                                            <FiShield size={15} />
                                        </span>
                                        <span className="text-xs font-medium text-[var(--theme-text-secondary)]">
                                            Verified secure portal · actions are logged
                                        </span>
                                    </div>
                                </section>

                                <section className="panel flex flex-col justify-between p-6">
                                    <div>
                                        <h2 className="panel-title">Review queue</h2>
                                        <p className="mt-2 text-[13px] leading-relaxed text-[var(--theme-text-secondary)]">
                                            Open the requests table to approve or reject individual submissions, or
                                            process several at once.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setView("requests")}
                                        className="btn btn-primary mt-6 w-full"
                                    >
                                        Open requests
                                        <FiArrowRight size={15} />
                                    </button>
                                </section>
                            </div>

                            {/* ── Auto Accept Settings ── */}
                            <AutoAcceptSettingsCard />
                        </motion.div>
                    )}

                    {/* ════ REQUESTS VIEW ════ */}
                    {view === "requests" && (
                        <motion.div
                            key="requests"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                            className="max-w-7xl mx-auto space-y-4"
                        >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <h1 className="page-title">Pending requests</h1>
                                    <p className="page-subtitle">Leave reduction forms awaiting your review.</p>
                                </div>

                                {/* Year Filter Tabs */}
                                <div className="inline-flex w-full items-center gap-1 rounded-[var(--radius-md)] border border-[var(--theme-border)] bg-[var(--theme-card)] p-1 sm:w-auto">
                                    {["all", ...YEARS].map(yr => (
                                        <button
                                            key={yr}
                                            onClick={() => setSelectedYear(yr)}
                                            className={`flex-1 whitespace-nowrap rounded-[6px] px-3 py-1.5 text-[11.5px] font-semibold transition-colors sm:flex-none ${
                                                selectedYear === yr
                                                    ? "bg-[var(--theme-btn-primary)] text-white"
                                                    : "text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-soft)] hover:text-[var(--theme-text-primary)]"
                                            }`}
                                        >
                                            {yr === "all" ? "All years" : yr}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Toolbar */}
                            <div className="panel p-4">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                                    <div className="field-shell flex-1 lg:max-w-sm">
                                        <FiSearch size={15} style={{ color: 'var(--theme-text-faint)' }} />
                                        <input
                                            id="warden-search"
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search name, register number or phone"
                                            className="w-full flex-1 bg-transparent text-[13px] font-medium focus:outline-none"
                                        />
                                        {searchQuery && (
                                            <button
                                                type="button"
                                                onClick={() => setSearchQuery("")}
                                                className="shrink-0 text-[11px] font-semibold"
                                                style={{ color: 'var(--color-accent)' }}
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto lg:ml-auto">
                                        <label htmlFor="warden-gender-filter" className="sr-only">Gender</label>
                                        <select
                                            id="warden-gender-filter"
                                            value={genderFilter}
                                            onChange={(e) => setGenderFilter(e.target.value)}
                                            className="h-9 min-h-0 flex-1 sm:flex-none py-0 text-[12px] font-medium"
                                            style={{ minWidth: '7.5rem' }}
                                        >
                                            <option value="ALL">All genders</option>
                                            <option value="MALE">Male</option>
                                            <option value="FEMALE">Female</option>
                                        </select>

                                        <label htmlFor="warden-dept-filter" className="sr-only">Department</label>
                                        <select
                                            id="warden-dept-filter"
                                            value={deptFilter}
                                            onChange={(e) => setDeptFilter(e.target.value)}
                                            className="h-9 min-h-0 flex-1 sm:flex-none py-0 text-[12px] font-medium"
                                            style={{ minWidth: '7.5rem' }}
                                        >
                                            <option value="ALL">All departments</option>
                                            {activeDepts.length > 0 ? (
                                                activeDepts.map(d => (
                                                    <option key={d.id} value={d.departmentCode}>{d.departmentCode}</option>
                                                ))
                                            ) : (
                                                ["CSE", "ECE", "EEE", "MECH", "CIVIL", "MECHATRONICS"].map(code => (
                                                    <option key={code} value={code}>{code}</option>
                                                ))
                                            )}
                                        </select>

                                        <label htmlFor="warden-records-per-page" className="sr-only">Records per page</label>
                                        <select
                                            id="warden-records-per-page"
                                            value={itemsPerPage}
                                            onChange={(e) => {
                                                setItemsPerPage(Number(e.target.value));
                                                setCurrentPage(1);
                                            }}
                                            className="h-9 min-h-0 flex-1 sm:flex-none py-0 text-[12px] font-medium"
                                            style={{ minWidth: '7.5rem' }}
                                        >
                                            <option value={20}>20 per page</option>
                                            <option value={40}>40 per page</option>
                                            <option value={60}>60 per page</option>
                                            <option value={80}>80 per page</option>
                                            <option value={100}>100 per page</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--theme-border)] pt-3">
                                    <p className="text-xs text-[var(--theme-text-secondary)]">
                                        <span className="font-semibold text-[var(--theme-text-primary)]">{pendingForms.length}</span>{' '}
                                        {pendingForms.length === 1 ? 'request matches' : 'requests match'} the current filters
                                    </p>
                                    {(genderFilter !== 'ALL' || selectedYear !== 'all' || searchQuery) && (
                                        <button
                                            type="button"
                                            onClick={() => { setGenderFilter('ALL'); setSelectedYear('all'); setSearchQuery(''); }}
                                            className="text-[11.5px] font-semibold"
                                            style={{ color: 'var(--color-accent)' }}
                                        >
                                            Reset filters
                                        </button>
                                    )}
                                </div>
                            </div>

                            <AnimatePresence>
                                {selectedIds.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.18 }}
                                        className="relative z-20 flex flex-col items-stretch justify-between gap-3 rounded-[var(--radius-lg)] p-3.5 sm:flex-row sm:items-center"
                                        style={{
                                            background: 'var(--theme-card)',
                                            border: '1px solid var(--color-accent)',
                                            boxShadow: 'var(--shadow-raised)'
                                        }}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <span
                                                className="flex h-7 min-w-7 items-center justify-center rounded-[6px] px-1.5 text-[11.5px] font-semibold text-white"
                                                style={{ background: 'var(--theme-btn-primary)' }}
                                            >
                                                {selectedIds.length}
                                            </span>
                                            <span className="text-[12.5px] font-medium text-[var(--theme-text-primary)]">
                                                {selectedIds.length === 1 ? 'request selected' : 'requests selected'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handleBulkAction}
                                                disabled={isBulkProcessing}
                                                className="btn btn-primary flex-1 sm:flex-none"
                                            >
                                                {isBulkProcessing ? (
                                                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                                ) : (
                                                    <FiCheck size={15} />
                                                )}
                                                {isBulkProcessing ? 'Processing…' : 'Approve selected'}
                                            </button>
                                            <button
                                                onClick={() => { setIsBulkReject(true); setRejectReason(""); setIsRejectModalOpen(true); }}
                                                disabled={isBulkProcessing}
                                                className="btn btn-secondary flex-1 text-[var(--color-danger)] sm:flex-none"
                                                style={{ borderColor: 'var(--color-danger-border)' }}
                                            >
                                                <FiX size={15} />
                                                Reject
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Requests Table (Desktop) & Cards (Mobile) */}
                            <div className="panel overflow-hidden">

                                {paginatedForms.length === 0 && (
                                    <div className="empty-state">
                                        <div className="empty-state-icon">
                                            <FiFilter size={22} />
                                        </div>
                                        <h3 className="text-[14px] font-semibold text-[var(--theme-text-primary)]">No requests found</h3>
                                        <p className="max-w-xs text-xs text-[var(--theme-text-secondary)]">
                                            Nothing matches the current filters. Try a different year, gender or search term.
                                        </p>
                                    </div>
                                )}

                                {/* 💻 TABLE VIEW */}
                                <div 
                                    className={`overflow-x-auto max-h-[600px] overflow-y-auto ${paginatedForms.length === 0 ? 'hidden' : ''}`}
                                    style={{ WebkitOverflowScrolling: 'touch' }}
                                >
                                    <table 
                                        className="data-table min-w-[900px]"
                                    >
                                        <thead className="z-10">
                                            <tr>
                                                <th className="w-12 text-center">
                                                    <button 
                                                        disabled={isBulkProcessing || processingIds.size > 0} 
                                                        onClick={toggleSelectAll} 
                                                        className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        aria-label="Select all requests on this page"
                                                    >
                                                        {pendingForms.length > 0 && pendingForms.every(r => selectedIds.includes(r.id)) ? <FiCheckSquare size={15} /> : <FiSquare size={15} />}
                                                    </button>
                                                </th>
                                                <th>Student</th>
                                                <th className="text-center">Register No</th>
                                                <th className="text-center">Dept</th>
                                                <th className="text-center">Year</th>
                                                <th className="text-center">Gender</th>
                                                <th className="text-center">Phone</th>
                                                <th className="text-center">Room</th>
                                                <th className="text-center">Leave date</th>
                                                <th className="text-center">Arrival date</th>
                                                <th>Reason</th>
                                                <th className="text-right" style={{ width: '7.5rem' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedForms.length === 0 ? (
                                                <tr>
                                                    <td colSpan="12">
                                                        <div className="empty-state">
                                                            <div className="empty-state-icon">
                                                                <FiFilter size={22} />
                                                            </div>
                                                            <h3 className="text-[14px] font-semibold text-[var(--theme-text-primary)]">No requests found</h3>
                                                            <p className="max-w-xs text-xs text-[var(--theme-text-secondary)]">
                                                                Nothing matches the current filters. Try a different year, gender or search term.
                                                            </p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : paginatedForms.map((req, idx) => (
                                                <motion.tr
                                                    key={`desk-${req.id}`}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: Math.min(idx * 0.015, 0.2) }}
                                                    onClick={() => !processingIds.has(req.id) && !isBulkProcessing && toggleSelect(req.id)}
                                                    className={`cursor-pointer ${processingIds.has(req.id) || isBulkProcessing ? 'pointer-events-none opacity-50' : ''}`}
                                                    style={selectedIds.includes(req.id) ? { background: 'var(--color-accent-soft)' } : undefined}
                                                >
                                                    <td className="text-center">
                                                        <div
                                                            className="mx-auto flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border transition-colors"
                                                            style={selectedIds.includes(req.id)
                                                                ? { background: 'var(--theme-btn-primary)', borderColor: 'var(--theme-btn-primary)', color: '#fff' }
                                                                : { background: 'var(--theme-card)', borderColor: 'var(--theme-border-strong)', color: 'transparent' }}
                                                        >
                                                            <FiCheck size={11} strokeWidth={3.5} />
                                                        </div>
                                                    </td>
                                                    <td className="whitespace-nowrap">
                                                        <p className="max-w-[170px] truncate text-[13px] font-semibold text-[var(--theme-text-primary)]">{req.name}</p>
                                                    </td>
                                                    <td className="whitespace-nowrap text-center">
                                                        <span className="font-mono text-[11.5px] font-medium text-[var(--theme-text-secondary)]">{req.registerNo || "N/A"}</span>
                                                    </td>
                                                    <td className="whitespace-nowrap text-center">
                                                        <span className="badge badge-neutral">{req.dept}</span>
                                                    </td>
                                                    <td className="whitespace-nowrap text-center">
                                                        <span className="text-[12px] font-medium text-[var(--theme-text-secondary)]">
                                                            {Number(req.year) === 1 ? "1st" : Number(req.year) === 2 ? "2nd" : Number(req.year) === 3 ? "3rd" : Number(req.year) === 4 ? "4th" : req.year || "N/A"}
                                                        </span>
                                                    </td>
                                                    <td className="whitespace-nowrap text-center">
                                                        <span className="text-[12px] font-medium text-[var(--theme-text-secondary)]">{req.gender}</span>
                                                    </td>
                                                    <td className="whitespace-nowrap text-center">
                                                        <span className="font-mono text-[11.5px] font-medium text-[var(--theme-text-secondary)]">{req.phone || req.phoneNo || "N/A"}</span>
                                                    </td>
                                                    <td className="whitespace-nowrap text-center">
                                                        <span className="text-[12px] font-semibold text-[var(--theme-text-primary)]">{req.roomNo}</span>
                                                    </td>
                                                    <td className="whitespace-nowrap text-center">
                                                        <span className="text-[12px] text-[var(--theme-text-secondary)]">{req.leaveDate}</span>
                                                    </td>
                                                    <td className="whitespace-nowrap text-center">
                                                        <span className="text-[12px] text-[var(--theme-text-secondary)]">{req.arrivalDate}</span>
                                                    </td>
                                                    <td className="whitespace-nowrap">
                                                        <button
                                                            type="button"
                                                            title={req.reason}
                                                            onClick={(e) => { e.stopPropagation(); setSelectedReason(req.reason); }}
                                                            className="max-w-[150px] truncate text-left text-[12px] text-[var(--theme-text-secondary)] transition-colors hover:text-[var(--color-accent)]"
                                                        >
                                                            {req.reason && req.reason.length > 35 ? req.reason.substring(0, 35) + "…" : req.reason}
                                                        </button>
                                                    </td>
                                                    <td className="whitespace-nowrap text-right">
                                                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                            {processingIds.has(req.id) ? (
                                                                <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--theme-border)] bg-[var(--theme-card-muted)] px-2.5 py-1.5">
                                                                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--theme-border-strong)] border-t-[var(--theme-btn-primary)]" />
                                                                    <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--theme-text-secondary)]">Saving</span>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        disabled={isBulkProcessing}
                                                                        onClick={() => handleAction(req.id, "Approve")}
                                                                        title="Approve request"
                                                                        className="flex h-7 w-7 items-center justify-center rounded-[6px] border transition-colors disabled:opacity-50"
                                                                        style={{
                                                                            background: 'var(--color-success-soft)',
                                                                            borderColor: 'var(--color-success-border)',
                                                                            color: 'var(--color-success)'
                                                                        }}
                                                                    >
                                                                        <FiCheck size={14} />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        disabled={isBulkProcessing}
                                                                        onClick={() => handleAction(req.id, "Reject")}
                                                                        title="Reject request"
                                                                        className="flex h-7 w-7 items-center justify-center rounded-[6px] border transition-colors disabled:opacity-50"
                                                                        style={{
                                                                            background: 'var(--color-danger-soft)',
                                                                            borderColor: 'var(--color-danger-border)',
                                                                            color: 'var(--color-danger)'
                                                                        }}
                                                                    >
                                                                        <FiX size={14} />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex flex-col items-center justify-between gap-3 border-t border-[var(--theme-border)] bg-[var(--theme-card)] px-4 py-3 sm:flex-row">
                                    <p className="text-[11.5px] text-[var(--theme-text-secondary)] text-center sm:text-left">
                                        Showing <span className="font-semibold text-[var(--theme-text-primary)]">{pendingForms.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, pendingForms.length)}</span> of{' '}
                                        <span className="font-semibold text-[var(--theme-text-primary)]">{pendingForms.length}</span> requests
                                    </p>

                                    <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
                                        <button
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            className="btn btn-secondary h-8 px-3 text-[12px]"
                                        >
                                            Previous
                                        </button>

                                        <span className="text-[11.5px] font-medium text-[var(--theme-text-secondary)]">
                                            Page <span className="font-semibold text-[var(--theme-text-primary)]">{currentPage}</span> of {totalPages || 1}
                                        </span>

                                        <button
                                            disabled={currentPage >= totalPages || totalPages === 0}
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            className="btn btn-secondary h-8 px-3 text-[12px]"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer */}
            <footer className="mt-auto border-t border-[var(--theme-border)] bg-[var(--theme-card)] px-4 py-3.5 sm:px-6">
                <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 sm:flex-row">
                    <p className="text-[11px] text-[var(--theme-text-secondary)]">
                        © {new Date().getFullYear()} Government College of Engineering, Srirangam
                    </p>
                    <p className="text-[11px] text-[var(--theme-text-faint)]">
                        Warden panel · Mess Reduction Portal
                    </p>
                </div>
            </footer>

            {/* Rejection Modal */}
            <AnimatePresence>
                {isRejectModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            onClick={() => setIsRejectModalOpen(false)}
                            className="absolute inset-0 backdrop-blur-[2px]"
                            style={{ background: 'rgba(11, 23, 40, 0.55)' }}
                        />
                        <motion.div
                            role="dialog"
                            aria-modal="true"
                            initial={{ opacity: 0, scale: 0.97, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: 8 }}
                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            className="relative w-full max-w-[440px] overflow-hidden rounded-[var(--radius-lg)]"
                            style={{
                                background: 'var(--theme-card)',
                                border: '1px solid var(--theme-border)',
                                boxShadow: 'var(--shadow-modal)'
                            }}
                        >
                            <div className="px-6 pt-5 pb-4">
                                <div className="flex items-start gap-3">
                                    <div
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)]"
                                        style={{
                                            background: 'var(--color-danger-soft)',
                                            border: '1px solid var(--color-danger-border)',
                                            color: 'var(--color-danger)'
                                        }}
                                    >
                                        <FiXCircle size={17} />
                                    </div>
                                    <div>
                                        <h3 className="text-[15px] font-semibold text-[var(--theme-text-primary)]">
                                            Reason for rejection
                                        </h3>
                                        <p className="mt-0.5 text-xs leading-relaxed text-[var(--theme-text-secondary)]">
                                            {isBulkReject
                                                ? `This reason will be recorded against all ${selectedIds.length} selected requests.`
                                                : 'The student will see this reason on their dashboard.'}
                                        </p>
                                    </div>
                                </div>

                                <label htmlFor="warden-reject-reason" className="field-label mt-4">
                                    Rejection reason <span style={{ color: 'var(--color-danger)' }}>*</span>
                                </label>
                                <textarea
                                    id="warden-reject-reason"
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="e.g. Submitted after the cut-off time for the selected date."
                                    className="h-28 w-full resize-none text-[13px]"
                                    autoFocus
                                />
                            </div>

                            <div
                                className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 px-4 sm:px-6 py-3.5"
                                style={{ borderTop: '1px solid var(--theme-border)', background: 'var(--theme-card-muted)' }}
                            >
                                <button
                                    type="button"
                                    disabled={isRejecting}
                                    onClick={() => !isRejecting && setIsRejectModalOpen(false)}
                                    className="btn btn-secondary w-full sm:w-auto"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={isRejecting || !rejectReason.trim()}
                                    onClick={handleRejectSubmit}
                                    className="btn btn-danger w-full sm:w-auto"
                                >
                                    {isRejecting ? (
                                        <>
                                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                            Rejecting…
                                        </>
                                    ) : (
                                        'Confirm rejection'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

             {/* Activity Log Modal */}
            <ActivityLogModal 
                isOpen={isLogModalOpen} 
                onClose={() => setIsLogModalOpen(false)} 
                actionType={logActionType} 
                actionTitle={logActionTitle} 
                themeColor={selectedYear ? YEAR_THEME[selectedYear]?.color || "emerald" : "emerald"} 
                role="Warden"
            />

            {/* Reason Modal */}
            <AnimatePresence>
                {selectedReason && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            onClick={() => setSelectedReason(null)}
                            className="absolute inset-0 backdrop-blur-[2px]"
                            style={{ background: 'rgba(11, 23, 40, 0.55)' }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.97, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: 8 }}
                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            role="dialog"
                            aria-modal="true"
                            className="relative flex w-full max-w-[460px] flex-col overflow-hidden rounded-[var(--radius-lg)]"
                            style={{
                                background: 'var(--theme-card)',
                                border: '1px solid var(--theme-border)',
                                boxShadow: 'var(--shadow-modal)'
                            }}
                        >
                            <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-3">
                                <div>
                                    <h3 className="text-[15px] font-semibold text-[var(--theme-text-primary)]">Request reason</h3>
                                    <p className="mt-0.5 text-xs text-[var(--theme-text-secondary)]">
                                        Reason provided by the student
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedReason(null)}
                                    aria-label="Close"
                                    className="rounded-[var(--radius-sm)] p-1.5 text-[var(--theme-text-faint)] transition-colors hover:bg-[var(--theme-bg-soft)] hover:text-[var(--theme-text-primary)]"
                                >
                                    <FiX size={16} />
                                </button>
                            </div>

                            <div className="px-6 pb-5">
                                <div
                                    className="max-h-[50vh] overflow-y-auto rounded-[var(--radius-md)] px-3.5 py-3 text-[13px] leading-relaxed text-[var(--theme-text-secondary)]"
                                    style={{ background: 'var(--theme-card-muted)', border: '1px solid var(--theme-border)' }}
                                >
                                    {selectedReason}
                                </div>
                            </div>

                            <div
                                className="flex justify-end px-6 py-3.5"
                                style={{ borderTop: '1px solid var(--theme-border)', background: 'var(--theme-card-muted)' }}
                            >
                                <button onClick={() => setSelectedReason(null)} className="btn btn-secondary">
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Bulk Operation Progress Modal */}
            <BulkOperationProgress
                isOpen={bulkState.isOpen}
                status={bulkState.status}
                operationType={bulkState.operationType}
                title={bulkState.title}
                total={bulkState.total}
                processed={bulkState.processed}
                successCount={bulkState.successCount}
                failedCount={bulkState.failedCount}
                error={bulkState.error}
                onClose={closeProgress}
            />
        </AppLayout>
    );
};

export default Warden;
