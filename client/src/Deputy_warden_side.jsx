import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCheck, FiX, FiList, FiCheckSquare, FiSquare, FiArrowRight, FiClock, FiBarChart2, FiSearch, FiXCircle, FiUser, FiCalendar, FiFileText, FiPhone, FiHash, FiMapPin, FiActivity, FiExternalLink } from "react-icons/fi";
import apiClient from "./api/apiClient";
import { getCookie } from "./utils/cookieUtils";
import ActivityLogModal from "./ActivityLogModal";
import { getActiveDepartments } from "./api/departmentService";
import { logout } from "./services/authService";
import Toast from "./components/Toast";
import BulkOperationProgress from "./components/BulkOperationProgress";
import useBulkOperation from "./hooks/useBulkOperation";
import StaffHeader from "./components/StaffHeader";
import AutoAcceptSettingsCard from "./components/AutoAcceptSettingsCard";
import AppLayout from "./components/AppLayout";
import StatusBadge from "./components/StatusBadge";
import { useSseNotifications } from "./hooks/useSseNotifications";
import SseNotificationToast from "./components/SseNotificationToast";


const handleLogout = () => {
  logout();
};

function YearStatCard({ year, requests, yearStats }) {
    const pending = requests ? requests.length : 0;
    const key = year === "1st" ? "firstYear" : year === "2nd" ? "secondYear" : year === "3rd" ? "thirdYear" : "fourthYear";
    const total = yearStats && yearStats[key] != null ? yearStats[key] : pending;

    return (
        <div className="stat-card">
            <div className="flex items-start justify-between gap-3">
                <p className="section-label">Assigned year</p>
                <span className="badge badge-neutral">{year} year</span>
            </div>
            <p className="mt-2 text-[28px] font-semibold leading-none tracking-tight text-[var(--theme-text-primary)]">
                {total}
            </p>
            <p className="mt-4 text-xs leading-relaxed text-[var(--theme-text-secondary)]">
                Total submissions · <span className="font-semibold text-[var(--color-warning)]">{pending}</span> awaiting your review
            </p>
        </div>
    );
}

const getDeputyDetails = (username) => {
  if (!username) return null;
  const match = username.match(/^deputyWarden([1-8])$/);
  if (!match) return null;
  const num = parseInt(match[1]);
  if (num >= 1 && num <= 4) {
    return { gender: 'MALE', year: num, label: `Male - Year ${num} Dashboard` };
  } else if (num >= 5 && num <= 8) {
    return { gender: 'FEMALE', year: num - 4, label: `Female - Year ${num - 4} Dashboard` };
  }
  return null;
};

function Deputy_warden_side() {
    const username = getCookie('staffUsername');
    const deputyDetails = getDeputyDetails(username);
    const deputyYearLabel = deputyDetails ? (deputyDetails.year === 1 ? "1st" : deputyDetails.year === 2 ? "2nd" : deputyDetails.year === 3 ? "3rd" : "4th") : "all";

    const [view, setView]               = useState("dashboard");
    const [selectedYear, setSelectedYear] = useState(deputyYearLabel);
    const [requests, setRequests]       = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [deptFilter, setDeptFilter]   = useState("ALL");
    const [activeDepts, setActiveDepts] = useState([]);

    useEffect(() => {
        getActiveDepartments().then(depts => {
            if (Array.isArray(depts)) {
                setActiveDepts(depts);
            }
        });
    }, []);
    const [isLoading, setIsLoading]     = useState(true);
    const [search, setSearch]           = useState("");

    // Pagination & Expand Reason Modal States
    const [currentPage, setCurrentPage]   = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [selectedReason, setSelectedReason] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);

    const refreshData = useCallback(async (signal = null) => {
        try {
            const currentUsername = getCookie('staffUsername');
            const currentDeputyDetails = getDeputyDetails(currentUsername);

            // Fetch forms, dashboard counts, and year-wise counts concurrently
            const [response, countRes, yearCountRes] = await Promise.all([
                apiClient.get("/api/hostelStaff/staff/deputyWarden", signal ? { signal } : {}),
                apiClient.get("/api/hostelStaff/staff/dashboard-count", signal ? { signal } : {}),
                apiClient.get("/api/hostelStaff/staff/deputyWarden/year-count", signal ? { signal } : {})
            ]);
            if (signal && signal.aborted) return;

            // Filter forms in frontend
            const filteredData = (response.data || []).filter(form => {
                if (!currentDeputyDetails) return true;
                const isAssigned = form.assignedDeputyWarden === currentUsername;
                if (isAssigned) return true;
                const isGenderMatch = !form.gender || form.gender === currentDeputyDetails.gender;
                const isYearMatch = form.year === currentDeputyDetails.year;
                return isGenderMatch && isYearMatch;
            });

            const data = filteredData.map(r => ({
                ...r,
                id: r.formId,
                year: r.year === 1 ? "1st" : r.year === 2 ? "2nd" : r.year === 3 ? "3rd" : "4th",
                dept: r.department,
                phone: r.phoneNo || r.phone || r.studentPhone || r.mobile || "N/A",
                gender: r.gender || "ALL",
                status: r.currentStatus || "PendingDeputyWarden"
            }));

            // Prevent duplicate records using application ID
            setRequests(prev => {
                const map = new Map();
                data.forEach(item => map.set(item.id, item));
                return Array.from(map.values());
            });

            setDashboardStats(countRes.data);
            setYearStats(yearCountRes.data);

        } catch (err) {
            if (signal && signal.aborted) return;
        }
    }, []);

    // Real-time SSE Notifications for Deputy Warden with automatic table synchronization
    const handleSseNewRequest = useCallback(async (newItem) => {
        if (!newItem || !newItem.applicationId) return;

        // 1. Immediately trigger the existing pending requests GET API to fetch committed records
        try {
            await refreshData();
        } catch (err) {
            console.error("Failed to sync requests table after SSE event:", err);
        }

        // 2. Fetch the specific committed application to guarantee zero-latency table rendering
        try {
            const res = await apiClient.get(`/api/hostelStaff/staff/deputyWarden/form/${newItem.applicationId}`);
            if (res && res.data) {
                const form = res.data;
                const newReq = {
                    ...form,
                    id: form.formId,
                    year: form.year === 1 ? "1st" : form.year === 2 ? "2nd" : form.year === 3 ? "3rd" : "4th",
                    dept: form.department,
                    phone: form.phoneNo || form.phone || form.studentPhone || form.mobile || "N/A",
                    gender: form.gender || "ALL",
                    status: form.currentStatus || "PendingDeputyWarden"
                };

                setRequests(prev => {
                    const exists = prev.some(r => r.id === newReq.id);
                    if (exists) {
                        return prev.map(r => r.id === newReq.id ? newReq : r);
                    }
                    return [newReq, ...prev];
                });
            }
        } catch (singleErr) {
            // refreshData() already called /api/hostelStaff/staff/deputyWarden
        }
    }, [refreshData]);

    const {
        notifications: sseNotifications,
        unreadCount: sseUnreadCount,
        dismissNotification: dismissSseNotification,
        clearAllNotifications: clearAllSseNotifications,
    } = useSseNotifications({
        onNewRequest: handleSseNewRequest,
    });

    const handleViewRequestFromSse = async (item) => {
        try {
            dismissSseNotification(item.applicationId);
            const res = await apiClient.get(`/api/hostelStaff/staff/deputyWarden/form/${item.applicationId}`);
            if (res && res.data) {
                const form = res.data;
                const mappedStudent = {
                    ...form,
                    id: form.formId,
                    year: form.year === 1 ? "1st" : form.year === 2 ? "2nd" : form.year === 3 ? "3rd" : "4th",
                    dept: form.department,
                    status: form.currentStatus || "PendingDeputyWarden"
                };
                setSelectedStudent(mappedStudent);
            }
        } catch (error) {
            // Fallback to minimal payload details if network error
            setSelectedStudent({
                id: item.applicationId,
                name: item.studentName,
                registerNo: item.registerNumber,
                department: item.department,
                dept: item.department,
                year: item.yearOfStudy,
                roomNo: "N/A",
                leaveDate: "Pending Review",
                arrivalDate: "Pending Review",
                reason: "New application received via real-time notification",
                status: "PendingDeputyWarden"
            });
        }
    };

    // Reset pagination on search / filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, selectedYear, deptFilter, itemsPerPage]);

    useEffect(() => {
        const controller = new AbortController();
        const loadInitialData = async () => {
            try {
                await refreshData(controller.signal);
            } catch (err) {
                if (controller.signal.aborted) return;
                const fallback = JSON.parse(localStorage.getItem("mock_requests") || "[]");
                setRequests(fallback);
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        };
        loadInitialData();
        return () => {
            controller.abort();
        };
    }, []);

    const [dashboardStats, setDashboardStats] = useState({
        pendingDeputyWarden: 0,
        pendingWarden: 0,
        approved: 0,
        rejectedWarden: 0,
        rejectedDeputyWarden: 0
    });

    const [yearStats, setYearStats] = useState({
        firstYear: 0,
        secondYear: 0,
        thirdYear: 0,
        fourthYear: 0
    });

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

    // Processing State for Action Locking
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

    // Activity Log Modal State
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [logActionType, setLogActionType] = useState("Approved");
    const [logActionTitle, setLogActionTitle] = useState("Accepted");

    const handleAction = async (id, actionType) => {
        if (processingIds.has(id) || isBulkProcessing) return;

        const action = actionType === "Approve" || actionType === "accepted" ? "Approve" : "Reject";
        
        if (action === "Reject") {
            setRejectFormId(id);
            setRejectReason("");
            setIsBulkReject(false);
            setIsRejectModalOpen(true);
            return;
        }

        setProcessingIds(prev => {
            const newSet = new Set(prev);
            newSet.add(id);
            return newSet;
        });

        try {
            await apiClient.patch(`/api/hostelStaff/staff/deputyWarden/${id}?action=${action}`);
            showToast(`Request ${action.toLowerCase()}d successfully`, 'success');
            setRequests(prev => prev.filter(r => r.id !== id));
            setDashboardStats(prev => prev ? {
                ...prev,
                pendingDeputyWarden: Math.max(0, (prev.pendingDeputyWarden || 0) - 1),
                pendingWarden: (prev.pendingWarden || 0) + 1
            } : prev);
            await refreshData();
        } catch (err) {
            showToast("Failed to update status.", 'error');
        } finally {
            setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(id);
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

        if (isBulkReject) {
            const idsToReject = [...selectedIds];
            const reason = rejectReason;
            setIsRejectModalOpen(false);
            setRejectFormId(null);
            setIsBulkReject(false);
            setRejectReason("");
            startBulkOperation('REJECT', idsToReject.length, 'Rejecting Requests...');

            try {
                const res = await apiClient.patch(`/api/hostelStaff/staff/deputyWarden/bulk-reject`, {
                    formIds: idsToReject,
                    rejectReason: reason
                });
                const processedSet = new Set(idsToReject);
                const rejCount = res.data?.rejected || 0;
                const failCount = res.data?.failed || 0;

                setRequests(prev => prev.filter(r => !processedSet.has(r.id)));
                setDashboardStats(prev => prev ? {
                    ...prev,
                    pendingDeputyWarden: Math.max(0, (prev.pendingDeputyWarden || 0) - (rejCount || processedSet.size)),
                    rejectedDeputyWarden: (prev.rejectedDeputyWarden || 0) + (rejCount || processedSet.size)
                } : prev);
                setSelectedIds([]);

                if (failCount > 0) {
                    completePartial(res.data?.selected || idsToReject.length, rejCount, failCount);
                } else {
                    completeSuccess(rejCount, res.data?.selected || idsToReject.length);
                }
                showToast(`Bulk Reject Summary: Selected: ${res.data.selected}, Rejected: ${res.data.rejected}, Failed: ${res.data.failed}`, 'success');
                await refreshData();
            } catch (err) {
                const errorMsg = err.response?.data?.message || "Failed to reject requests.";
                completeFailure(errorMsg);
                showToast(errorMsg, 'error');
            }
        } else {
            setIsRejecting(true);
            try {
                await apiClient.patch(`/api/hostelStaff/staff/deputyWarden/${rejectFormId}/reject`, { rejectReason });
                setRequests(prev => prev.filter(r => r.id !== rejectFormId));
                setDashboardStats(prev => prev ? {
                    ...prev,
                    pendingDeputyWarden: Math.max(0, (prev.pendingDeputyWarden || 0) - 1),
                    rejectedDeputyWarden: (prev.rejectedDeputyWarden || 0) + 1
                } : prev);
                showToast("Request rejected successfully", 'success');
                setIsRejectModalOpen(false);
                setRejectFormId(null);
                setIsBulkReject(false);
                setRejectReason("");
                await refreshData();
            } catch (err) {
                showToast("Failed to reject request.", 'error');
            } finally {
                setIsRejecting(false);
            }
        }
    };

    const handleBulkAction = async () => {
        if (selectedIds.length === 0 || isBulkProcessing) return;

        const idsToProcess = [...selectedIds];
        startBulkOperation('APPROVE', idsToProcess.length, 'Approving Requests...');

        try {
            await apiClient.patch(`/api/hostelStaff/staff/deputyWarden/bulk?action=Approve`, idsToProcess);
            const processedSet = new Set(idsToProcess);
            setRequests(prev => prev.filter(r => !processedSet.has(r.id)));
            setDashboardStats(prev => prev ? {
                ...prev,
                pendingDeputyWarden: Math.max(0, (prev.pendingDeputyWarden || 0) - processedSet.size),
                pendingWarden: (prev.pendingWarden || 0) + processedSet.size
            } : prev);
            setSelectedIds([]);
            completeSuccess(idsToProcess.length, idsToProcess.length);
            showToast("Bulk approval completed successfully", 'success');
            await refreshData();
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Failed to perform bulk approval.";
            completeFailure(errorMsg);
            showToast(errorMsg, 'error');
        }
    };

    const filteredRequests = requests
        .filter(r => deptFilter === "ALL" ? true : (r.dept || r.department) === deptFilter)
        .filter(r => {
            const q = search.trim().toLowerCase();
            if (!q) return true;
            const nameMatch = r.name?.toLowerCase().includes(q);
            const regNoMatch = r.registerNo?.toLowerCase().includes(q);
            const phoneMatch = (r.phone || r.phoneNo || "").toLowerCase().includes(q);
            return nameMatch || regNoMatch || phoneMatch;
        });

    const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
    const paginatedForms = filteredRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

    const toggleSelectAll = () => {
        const allFilteredIds = filteredRequests.map(r => r.id);
        const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedIds.includes(id));
        setSelectedIds(prev => {
            if (allSelected) {
                return prev.filter(id => !allFilteredIds.includes(id));
            } else {
                return Array.from(new Set([...prev, ...allFilteredIds]));
            }
        });
    };

    // Dashboard aggregates
    const totalForms     = requests.length;
    const totalPending   = requests.filter(r => r.status?.startsWith("Pending")).length;
    const totalAccepted  = requests.filter(r => r.status === "Approved").length;
    const totalRejected  = requests.filter(r => r.status?.startsWith("Rejected")).length;

    if (isLoading) {
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
            roleTag="DEPUTY WARDEN"
            pageTitle={view === "dashboard" ? "Deputy Warden Dashboard" : "Review Mess Reduction Requests"}
            breadcrumbs={["GCES", "Deputy Warden", view === "dashboard" ? "Dashboard" : "Requests"]}
            navItems={[
                { key: 'dashboard', label: 'Dashboard', icon: FiBarChart2 },
                { key: 'requests', label: 'Requests', icon: FiList, badge: (requests.length + sseUnreadCount) > 0 ? (requests.length + sseUnreadCount) : undefined }
            ]}
            activeNav={view}
            onNavChange={setView}
            userInfo={{
                name: deputyDetails ? deputyDetails.label : (username || "Deputy Warden"),
                role: "Deputy Warden",
                userName: username
            }}
            onLogout={handleLogout}
        >
            {/* Toast Notification Panel */}
            <Toast toast={toast} onClose={() => setToast(null)} />

            {/* Real-Time Floating SSE Notifications for Deputy Warden */}
            <SseNotificationToast
                notifications={sseNotifications}
                onDismiss={dismissSseNotification}
                onViewRequest={handleViewRequestFromSse}
            />

            <div className="space-y-4">
                <AnimatePresence mode="wait">
                    {/* ════ DASHBOARD VIEW ════ */}
                    {view === "dashboard" && (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, y: -30, filter: "blur(10px)" }}
                            transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                            className="max-w-7xl mx-auto space-y-4 sm:space-y-6"
                        >
                            {/* Page heading */}
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <h1 className="page-title">Overview</h1>
                                    <p className="page-subtitle">
                                        {deputyDetails
                                            ? `Submissions for ${deputyDetails.label}.`
                                            : 'Submissions for your assigned year.'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setView('requests')}
                                    className="btn btn-primary self-start sm:self-auto"
                                >
                                    <FiList size={14} /> Review requests
                                </button>
                            </div>

                            {/* Stat tiles */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {deputyDetails && (
                                    <YearStatCard
                                        year={deputyDetails.year === 1 ? '1st' : deputyDetails.year === 2 ? '2nd' : deputyDetails.year === 3 ? '3rd' : '4th'}
                                        requests={requests}
                                        yearStats={yearStats}
                                    />
                                )}

                                <div className="stat-card">
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="section-label">Pending with you</p>
                                        <span
                                            className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)]"
                                            style={{ background: 'var(--color-warning-soft)', color: 'var(--color-warning)' }}
                                        >
                                            <FiClock size={14} />
                                        </span>
                                    </div>
                                    <p className="mt-2 text-[28px] font-semibold leading-none tracking-tight text-[var(--theme-text-primary)]">
                                        {dashboardStats.pendingDeputyWarden || 0}
                                    </p>
                                    <p className="mt-4 text-xs leading-relaxed text-[var(--theme-text-secondary)]">
                                        Requests awaiting deputy warden review
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setLogActionType('Approved');
                                        setLogActionTitle('Deputy Warden Approved');
                                        setIsLogModalOpen(true);
                                    }}
                                    className="stat-card text-left transition-colors hover:border-[var(--theme-border-strong)]"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="section-label">Forwarded onward</p>
                                        <span
                                            className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)]"
                                            style={{ background: 'var(--color-info-soft)', color: 'var(--color-info)' }}
                                        >
                                            <FiArrowRight size={14} />
                                        </span>
                                    </div>
                                    <p className="mt-2 text-[28px] font-semibold leading-none tracking-tight text-[var(--theme-text-primary)]">
                                        {(dashboardStats.pendingWarden || 0) +
                                            (dashboardStats.pendingOffice || 0) +
                                            (dashboardStats.approved || 0) +
                                            (dashboardStats.rejectedWarden || 0) +
                                            (dashboardStats.rejectedOffice || 0)}
                                    </p>
                                    <p className="mt-4 text-xs leading-relaxed text-[var(--theme-text-secondary)]">
                                        Approved by you · view activity log
                                    </p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setLogActionType('Rejected');
                                        setLogActionTitle('Deputy Warden Rejected');
                                        setIsLogModalOpen(true);
                                    }}
                                    className="stat-card text-left transition-colors hover:border-[var(--theme-border-strong)]"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="section-label">Rejected by you</p>
                                        <span
                                            className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)]"
                                            style={{ background: 'var(--color-danger-soft)', color: 'var(--color-danger)' }}
                                        >
                                            <FiX size={14} />
                                        </span>
                                    </div>
                                    <p className="mt-2 text-[28px] font-semibold leading-none tracking-tight text-[var(--theme-text-primary)]">
                                        {dashboardStats.rejectedDeputyWarden || 0}
                                    </p>
                                    <p className="mt-4 text-xs leading-relaxed text-[var(--theme-text-secondary)]">
                                        Requests returned to students · view log
                                    </p>
                                </button>
                            </div>

                            {/* Totals + protocol */}
                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                                <div className="panel flex flex-col justify-between p-5">
                                    <div>
                                        <p className="section-label">Total forms</p>
                                        <p className="mt-2 text-[32px] font-semibold leading-none tracking-tight text-[var(--theme-text-primary)]">
                                            {(dashboardStats.pendingDeputyWarden || 0) +
                                                (dashboardStats.pendingWarden || 0) +
                                                (dashboardStats.pendingOffice || 0) +
                                                (dashboardStats.approved || 0) +
                                                (dashboardStats.rejectedDeputyWarden || 0) +
                                                (dashboardStats.rejectedWarden || 0) +
                                                (dashboardStats.rejectedOffice || 0)}
                                        </p>
                                    </div>
                                    <p className="mt-4 text-xs leading-relaxed text-[var(--theme-text-secondary)]">
                                        Cumulative submissions received this cycle.
                                    </p>
                                </div>

                                <div className="panel lg:col-span-2">
                                    <div className="panel-header">
                                        <div>
                                            <h2 className="panel-title">Approval protocol</h2>
                                            <p className="panel-subtitle">How each request moves through the hostel office.</p>
                                        </div>
                                    </div>
                                    <ol className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
                                        {[
                                            { step: '01', title: 'Deputy warden', text: 'Verifies the submission for your assigned year.' },
                                            { step: '02', title: 'Warden', text: 'Reviews the forwarded request and recommendation.' },
                                            { step: '03', title: 'Hostel office', text: 'Confirms the final reduction and updates records.' }
                                        ].map((item) => (
                                            <li key={item.step} className="flex gap-3">
                                                <span
                                                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                                                    style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}
                                                >
                                                    {item.step}
                                                </span>
                                                <div>
                                                    <p className="text-[13px] font-semibold text-[var(--theme-text-primary)]">{item.title}</p>
                                                    <p className="mt-0.5 text-[11.5px] leading-relaxed text-[var(--theme-text-secondary)]">{item.text}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            </div>

                            {/* ── Auto Accept Settings ── */}
                            <AutoAcceptSettingsCard />
                        </motion.div>
                    )}

                    {/* ════ REQUESTS VIEW ════ */}
                    {view === "requests" && (
                        <motion.div
                            key="requests"
                            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, y: -30, filter: "blur(10px)" }}
                            transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                            className="space-y-6"
                        >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <h1 className="page-title">Pending requests</h1>
                                    <p className="page-subtitle">Forms awaiting deputy warden review.</p>
                                </div>
                                <span className="badge badge-warning self-start sm:self-auto">
                                    {filteredRequests.length} in queue
                                </span>
                            </div>

                            {/* Toolbar */}
                            <div className="panel p-4">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                                    <div className="field-shell flex-1 lg:max-w-sm">
                                        <FiSearch size={15} style={{ color: 'var(--theme-text-faint)' }} />
                                        <input
                                            id="deputy-search"
                                            type="text"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Search name, register number or phone"
                                            className="w-full flex-1 bg-transparent text-[13px] font-medium focus:outline-none"
                                        />
                                        {search && (
                                            <button
                                                type="button"
                                                onClick={() => setSearch("")}
                                                className="shrink-0 text-[11px] font-semibold"
                                                style={{ color: 'var(--color-accent)' }}
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
                                        <label htmlFor="deputy-dept-filter" className="sr-only">Department</label>
                                        <select
                                            id="deputy-dept-filter"
                                            value={deptFilter}
                                            onChange={(e) => setDeptFilter(e.target.value)}
                                            className="h-9 min-h-0 py-0 text-[12px] font-medium"
                                            style={{ width: 'auto', minWidth: '8rem' }}
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

                                        <label htmlFor="deputy-records-per-page" className="sr-only">Records per page</label>
                                        <select
                                            id="deputy-records-per-page"
                                            value={itemsPerPage}
                                            onChange={(e) => {
                                                setItemsPerPage(Number(e.target.value));
                                                setCurrentPage(1);
                                            }}
                                            className="h-9 min-h-0 py-0 text-[12px] font-medium"
                                            style={{ width: 'auto', minWidth: '8rem' }}
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
                                        <span className="font-semibold text-[var(--theme-text-primary)]">{filteredRequests.length}</span>{' '}
                                        {filteredRequests.length === 1 ? 'request matches' : 'requests match'} the current filters
                                    </p>
                                    {(deptFilter !== 'ALL' || search) && (
                                        <button
                                            type="button"
                                            onClick={() => { setDeptFilter('ALL'); setSearch(''); }}
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

                            {/* Requests table */}
                            <div className="panel overflow-hidden">
                                {paginatedForms.length === 0 && (
                                    <div className="empty-state">
                                        <div className="empty-state-icon">
                                            <FiList size={22} />
                                        </div>
                                        <h3 className="text-[14px] font-semibold text-[var(--theme-text-primary)]">No requests found</h3>
                                        <p className="max-w-xs text-xs text-[var(--theme-text-secondary)]">
                                            Nothing matches the current filters. Try a different department or search term.
                                        </p>
                                    </div>
                                )}
                                <div
                                    className={`max-h-[600px] overflow-x-auto overflow-y-auto ${paginatedForms.length === 0 ? 'hidden' : ''}`}
                                    style={{ WebkitOverflowScrolling: 'touch' }}
                                >
                                    <table className="data-table w-full min-w-[700px]">
                                        <thead className="z-10">
                                            <tr>
                                                <th className="pl-4 text-left">
                                                    <div className="flex items-center gap-2.5">
                                                        <button
                                                            disabled={isBulkProcessing || processingIds.size > 0}
                                                            onClick={toggleSelectAll}
                                                            className="text-[var(--theme-text-secondary)] transition-colors hover:text-[var(--theme-text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
                                                            aria-label="Select all requests on this page"
                                                        >
                                                            {filteredRequests.length > 0 && filteredRequests.every(r => selectedIds.includes(r.id)) ? <FiCheckSquare size={15} /> : <FiSquare size={15} />}
                                                        </button>
                                                        <span>Register Number</span>
                                                    </div>
                                                </th>
                                                <th className="text-left">Student Name</th>
                                                <th className="text-center">Department</th>
                                                <th className="text-center">Year</th>
                                                <th className="pr-4 text-right" style={{ width: '7.5rem' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedForms.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5">
                                                        <div className="empty-state">
                                                            <div className="empty-state-icon">
                                                                <FiList size={22} />
                                                            </div>
                                                            <h3 className="text-[14px] font-semibold text-[var(--theme-text-primary)]">No requests found</h3>
                                                            <p className="max-w-xs text-xs text-[var(--theme-text-secondary)]">
                                                                Nothing matches the current filters. Try a different department or search term.
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
                                                    onClick={() => !processingIds.has(req.id) && !isBulkProcessing && setSelectedStudent(req)}
                                                    className={`cursor-pointer transition-colors hover:bg-[var(--theme-card-muted)] ${processingIds.has(req.id) || isBulkProcessing ? 'pointer-events-none opacity-50' : ''}`}
                                                    style={selectedIds.includes(req.id) ? { background: 'var(--color-accent-soft)' } : undefined}
                                                >
                                                    {/* 1. Register Number */}
                                                    <td className="whitespace-nowrap pl-4">
                                                        <div className="flex items-center gap-2.5">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (!processingIds.has(req.id) && !isBulkProcessing) {
                                                                        toggleSelect(req.id);
                                                                    }
                                                                }}
                                                                className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors"
                                                                style={selectedIds.includes(req.id)
                                                                    ? { background: 'var(--theme-btn-primary)', borderColor: 'var(--theme-btn-primary)', color: '#fff' }
                                                                    : { background: 'var(--theme-card)', borderColor: 'var(--theme-border-strong)', color: 'transparent' }}
                                                                aria-label={`Select ${req.registerNo || req.name}`}
                                                            >
                                                                <FiCheck size={11} strokeWidth={3.5} />
                                                            </button>
                                                            <span className="font-mono text-[12px] font-medium text-[var(--theme-text-secondary)]">
                                                                {req.registerNo || "N/A"}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* 2. Student Name */}
                                                    <td className="whitespace-nowrap">
                                                        <span className="text-[13px] font-semibold text-[var(--theme-text-primary)] hover:text-[var(--color-accent)]">
                                                            {req.name}
                                                        </span>
                                                    </td>

                                                    {/* 3. Department */}
                                                    <td className="whitespace-nowrap text-center">
                                                        <span className="badge badge-neutral">{req.dept}</span>
                                                    </td>

                                                    {/* 4. Year */}
                                                    <td className="whitespace-nowrap text-center">
                                                        <span className="text-[12px] font-medium text-[var(--theme-text-secondary)]">
                                                            {Number(req.year) === 1 ? "1st" : Number(req.year) === 2 ? "2nd" : Number(req.year) === 3 ? "3rd" : Number(req.year) === 4 ? "4th" : req.year || "N/A"}
                                                        </span>
                                                    </td>

                                                    {/* 5. Action */}
                                                    <td className="whitespace-nowrap pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center justify-end gap-1.5">
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
                                                                        className="flex h-7 w-7 items-center justify-center rounded-[6px] border transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
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
                                                                        className="flex h-7 w-7 items-center justify-center rounded-[6px] border transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
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
                                    <p className="text-[11.5px] text-[var(--theme-text-secondary)]">
                                        Showing <span className="font-semibold text-[var(--theme-text-primary)]">{filteredRequests.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredRequests.length)}</span> of{' '}
                                        <span className="font-semibold text-[var(--theme-text-primary)]">{filteredRequests.length}</span> requests
                                    </p>

                                    <div className="flex items-center gap-2">
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
                        {deputyDetails ? deputyDetails.label : 'Deputy Warden panel'} · Mess Reduction Portal
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

                                <label htmlFor="deputy-reject-reason" className="field-label mt-4">
                                    Rejection reason <span style={{ color: 'var(--color-danger)' }}>*</span>
                                </label>
                                <textarea
                                    id="deputy-reject-reason"
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="e.g. Submitted after the cut-off time for the selected date."
                                    className="h-28 w-full resize-none text-[13px]"
                                    autoFocus
                                />
                            </div>

                            <div
                                className="flex items-center justify-end gap-2 px-6 py-3.5"
                                style={{ borderTop: '1px solid var(--theme-border)', background: 'var(--theme-card-muted)' }}
                            >
                                <button
                                    type="button"
                                    disabled={isRejecting}
                                    onClick={() => !isRejecting && setIsRejectModalOpen(false)}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={isRejecting || !rejectReason.trim()}
                                    onClick={handleRejectSubmit}
                                    className="btn btn-danger"
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
                themeColor="blue" 
                role="DeputyWarden"
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

            {/* Student Details Drawer / Modal */}
            <AnimatePresence>
                {selectedStudent && (
                    <div className="fixed inset-0 z-[120] flex justify-end">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setSelectedStudent(null)}
                            className="absolute inset-0 backdrop-blur-[2px]"
                            style={{ background: 'rgba(11, 23, 40, 0.65)' }}
                        />

                        {/* Slide-out Drawer Panel */}
                        <motion.div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="student-details-title"
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 280 }}
                            className="relative z-10 flex h-full w-full max-w-[540px] flex-col border-l border-[var(--theme-border)] bg-[var(--theme-card)] shadow-2xl"
                        >
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between border-b border-[var(--theme-border)] bg-[var(--theme-card-muted)] px-6 py-4">
                                <h2 id="student-details-title" className="text-[15px] font-semibold text-[var(--theme-text-primary)]">
                                    Student Details
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setSelectedStudent(null)}
                                    aria-label="Close drawer"
                                    className="rounded-[var(--radius-sm)] p-1.5 text-[var(--theme-text-faint)] transition-colors hover:bg-[var(--theme-card)] hover:text-[var(--theme-text-primary)]"
                                >
                                    <FiX size={18} />
                                </button>
                            </div>

                            {/* Drawer Scrollable Body */}
                            <div className="flex-1 space-y-6 overflow-y-auto p-6" style={{ WebkitOverflowScrolling: 'touch' }}>
                                {/* 1. STUDENT INFORMATION (Compact Section) */}
                                <div>
                                    <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                                        STUDENT INFORMATION
                                    </h3>
                                    <div
                                        className="rounded-[var(--radius-md)] border border-[var(--theme-border)] bg-[var(--theme-card-muted)] p-4"
                                    >
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[11px] font-medium uppercase text-[var(--theme-text-faint)]">Student Name</p>
                                                <p className="mt-1 text-[13.5px] font-semibold text-[var(--theme-text-primary)]">
                                                    {selectedStudent.name || "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-medium uppercase text-[var(--theme-text-faint)]">Register Number</p>
                                                <p className="mt-1 font-mono text-[13px] font-semibold text-[var(--theme-text-primary)]">
                                                    {selectedStudent.registerNo || "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-medium uppercase text-[var(--theme-text-faint)]">Department</p>
                                                <p className="mt-1 text-[13px] font-medium text-[var(--theme-text-primary)]">
                                                    {selectedStudent.department || selectedStudent.dept || "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-medium uppercase text-[var(--theme-text-faint)]">Year of Study</p>
                                                <p className="mt-1 text-[13px] font-medium text-[var(--theme-text-primary)]">
                                                    {Number(selectedStudent.year) === 1 ? "1st Year" : Number(selectedStudent.year) === 2 ? "2nd Year" : Number(selectedStudent.year) === 3 ? "3rd Year" : Number(selectedStudent.year) === 4 ? "4th Year" : selectedStudent.year || "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. MESS REDUCTION DETAILS */}
                                <div>
                                    <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                                        MESS REDUCTION DETAILS
                                    </h3>
                                    <div
                                        className="space-y-4 rounded-[var(--radius-md)] border border-[var(--theme-border)] bg-[var(--theme-card-muted)] p-4"
                                    >
                                        <div>
                                            <p className="text-[11px] font-medium uppercase text-[var(--theme-text-faint)]">Room Number</p>
                                            <p className="mt-1 text-[13.5px] font-semibold text-[var(--theme-text-primary)]">
                                                {selectedStudent.roomNo || "N/A"}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[11px] font-medium uppercase text-[var(--theme-text-faint)]">Leave Date</p>
                                                <p className="mt-1 text-[13px] font-semibold text-[var(--theme-text-primary)]">
                                                    {selectedStudent.leaveDate || "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-medium uppercase text-[var(--theme-text-faint)]">Arrival Date</p>
                                                <p className="mt-1 text-[13px] font-semibold text-[var(--theme-text-primary)]">
                                                    {selectedStudent.arrivalDate || "N/A"}
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-[11px] font-medium uppercase text-[var(--theme-text-faint)]">Reason for Leave</p>
                                            <div
                                                className="mt-1.5 rounded-[var(--radius-sm)] border border-[var(--theme-border)] bg-[var(--theme-card)] p-3 text-[13px] leading-relaxed text-[var(--theme-text-primary)]"
                                            >
                                                {selectedStudent.reason || "No reason specified."}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Drawer Footer Actions */}
                            <div
                                className="flex items-center justify-between gap-3 border-t border-[var(--theme-border)] px-6 py-4"
                                style={{ background: 'var(--theme-card-muted)' }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setSelectedStudent(null)}
                                    className="btn btn-secondary"
                                >
                                    Close
                                </button>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={processingIds.has(selectedStudent.id) || isBulkProcessing}
                                        onClick={() => {
                                            const targetReq = selectedStudent;
                                            setSelectedStudent(null);
                                            handleAction(targetReq.id, "Reject");
                                        }}
                                        className="btn btn-secondary flex items-center gap-1.5 text-[var(--color-danger)] transition-all hover:bg-[var(--color-danger-soft)] active:scale-95 disabled:opacity-50"
                                        style={{ borderColor: 'var(--color-danger-border)' }}
                                    >
                                        <FiX size={15} />
                                        Reject
                                    </button>
                                    <button
                                        type="button"
                                        disabled={processingIds.has(selectedStudent.id) || isBulkProcessing}
                                        onClick={() => {
                                            const targetReq = selectedStudent;
                                            setSelectedStudent(null);
                                            handleAction(targetReq.id, "Approve");
                                        }}
                                        className="btn flex items-center gap-1.5 text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                                        style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                                    >
                                        <FiCheck size={15} />
                                        Accept
                                    </button>
                                </div>
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
}

export default Deputy_warden_side;