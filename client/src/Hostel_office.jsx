import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCheck, FiX, FiList, FiCheckSquare, FiSquare, FiArrowRight, FiBarChart2, FiSearch, FiPieChart, FiTrendingUp, FiXCircle, FiLoader } from "react-icons/fi";
import apiClient from "./api/apiClient";
import ActivityLogModal from "./ActivityLogModal";
import { logout } from "./services/authService";
import { getActiveDepartments } from "./api/departmentService";
import MultiSelect from "./MultiSelect";
import Toast from "./components/Toast";
import BulkOperationProgress from "./components/BulkOperationProgress";
import useBulkOperation from "./hooks/useBulkOperation";
import StaffHeader from "./components/StaffHeader";
import AppLayout from "./components/AppLayout";


const handleLogout = () => {
  logout();
};

const YEARS = ["1st", "2nd", "3rd", "4th"];

function YearStatCard({ year, requests, yearStats }) {
    const pending = requests.filter(r => r.year === year).length;
    const key = year === "1st" ? "firstYear" : year === "2nd" ? "secondYear" : year === "3rd" ? "thirdYear" : "fourthYear";
    const total = yearStats && yearStats[key] != null ? yearStats[key] : pending;

    return (
        <div className="stat-card">
            <div className="flex items-start justify-between gap-3">
                <p className="section-label">{year} year</p>
                <span className="badge badge-neutral">{pending} pending</span>
            </div>
            <p className="mt-2 text-[28px] font-semibold leading-none tracking-tight text-[var(--theme-text-primary)]">
                {total}
            </p>
            <p className="mt-4 text-xs leading-relaxed text-[var(--theme-text-secondary)]">
                Total submissions · awaiting final approval
            </p>
        </div>
    );
}

const getLocalDateString = (d) => {
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
};

const defaultFromDate = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return getLocalDateString(d);
};
const defaultToDate = () => {
    return getLocalDateString(new Date());
};

function HostelOffice() {
    const [view, setView] = useState("dashboard");
    const [selectedYear, setSelectedYear] = useState("all");
    const [genderFilter, setGenderFilter] = useState("ALL");
    const [deptFilter, setDeptFilter] = useState("ALL");
    const [activeDepts, setActiveDepts] = useState([]);

    useEffect(() => {
        getActiveDepartments().then(depts => {
            if (Array.isArray(depts)) {
                setActiveDepts(depts);
            }
        });
    }, []);
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);
    const [reportData, setReportData] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");

    // Date & Dropdown selectors for Report
    const [reportFromDate, setReportFromDate] = useState(defaultFromDate());
    const [reportToDate, setReportToDate] = useState(defaultToDate());
    const [reportDeptFilters, setReportDeptFilters] = useState([]);
    const [reportYearFilters, setReportYearFilters] = useState([]);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [hasGeneratedReport, setHasGeneratedReport] = useState(false);

    // Pagination & Expand Reason Modal States
    const [currentPage, setCurrentPage]   = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [selectedReason, setSelectedReason] = useState(null);

    // Reset pagination on search change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedYear, genderFilter, deptFilter, itemsPerPage]);

    const handleGenerateReport = async () => {
        if (isGeneratingReport) return;
        setIsGeneratingReport(true);
        try {
            const response = await apiClient.get(`/api/hostelStaff/staff/office/report-data?t=${Date.now()}`);
            const data = response.data.map(r => ({
                ...r,
                year: r.year === 1 ? "1st" : r.year === 2 ? "2nd" : r.year === 3 ? "3rd" : "4th",
                gender: r.gender || "N/A",
                department: r.department || "N/A"
            }));
            const filtered = data.filter(r => {
                const date = r.leaveDate;
                const matchDate = (!reportFromDate || date >= reportFromDate) && (!reportToDate || date <= reportToDate);
                const matchDept = reportDeptFilters.length === 0 || reportDeptFilters.includes("ALL") || reportDeptFilters.includes(r.department);
                const matchYear = reportYearFilters.length === 0 || reportYearFilters.includes("ALL") || reportYearFilters.some(y => {
                    const strY = String(y);
                    const rY = String(r.year);
                    return strY === rY || strY.startsWith(rY) || rY.startsWith(strY) || (strY.includes("1") && rY.includes("1")) || (strY.includes("2") && rY.includes("2")) || (strY.includes("3") && rY.includes("3")) || (strY.includes("4") && rY.includes("4"));
                });
                return matchDate && matchDept && matchYear;
            });
            setReportData(filtered);
            setHasGeneratedReport(true);
        } catch (err) {
            showToast("Failed to generate report.", 'error');
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const handleDownloadReport = async () => {
        try {
            const response = await apiClient.get('/api/hostelStaff/staff/office/download-report', {
                responseType: 'blob'
            });
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `mess_reduction_report_${reportFromDate || 'start'}_to_${reportToDate || 'end'}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            showToast("Excel report downloaded successfully.", "success");
        } catch (err) {
            console.error("Failed to download report:", err);
            showToast("Failed to download report.", 'error');
        }
    };

    const refreshData = async (signal = null) => {
        try {
            // Fetch forms, dashboard counts, and year-wise counts concurrently
            const [response, countRes, yearCountRes] = await Promise.all([
                apiClient.get(`/api/hostelStaff/staff/office?t=${Date.now()}`, signal ? { signal } : {}),
                apiClient.get(`/api/hostelStaff/staff/dashboard-count?t=${Date.now()}`, signal ? { signal } : {}),
                apiClient.get(`/api/hostelStaff/staff/office/year-count?t=${Date.now()}`, signal ? { signal } : {})
            ]);
            if (signal && signal.aborted) return;
            
            const data = (response.data || []).map(r => ({
                ...r,
                id: r.formId,
                year: r.year === 1 ? "1st" : r.year === 2 ? "2nd" : r.year === 3 ? "3rd" : "4th",
                dept: r.department,
                phone: r.phoneNo || r.phone || r.studentPhone || r.mobile || "N/A",
                status: r.currentStatus || "PendingOffice",
                gender: r.gender || "ALL"
            }));
            setRequests(data);
            setDashboardStats(countRes.data);
            setYearStats(yearCountRes.data);
        } catch (err) {
            if (signal && signal.aborted) return;
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        const loadInitialData = async () => {
            try {
                await refreshData(controller.signal);
            } catch (err) {
                if (controller.signal.aborted) return;
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

    useEffect(() => {
        setSelectedIds([]);
    }, [genderFilter, selectedYear, deptFilter, view]);

    const [dashboardStats, setDashboardStats] = useState({
        pendingOffice: 0,
        approved: 0,
        rejectedOffice: 0
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
        if (processingIds.has(id) || isBulkProcessing) return; // Prevent duplicate clicks

        // Normalize action to 'Approve' or 'Reject' for backend
        const action = actionType === "Approve" ? "Approve" : "Reject";

        if (action === "Reject") {
            setRejectFormId(id);
            setRejectReason("");
            setIsBulkReject(false);
            setIsRejectModalOpen(true);
            return;
        }

        // Add to processing set
        setProcessingIds(prev => {
            const newSet = new Set(prev);
            newSet.add(id);
            return newSet;
        });

        try {
            await apiClient.patch(`/api/hostelStaff/staff/office/${id}?action=${action}`);
            showToast(`Request ${action.toLowerCase()}d successfully`, 'success');
            setRequests(prev => prev.filter(r => r.id !== id));
            setDashboardStats(prev => prev ? {
                ...prev,
                pendingOffice: Math.max(0, (prev.pendingOffice || 0) - 1),
                approved: (prev.approved || 0) + 1
            } : prev);
            // Refresh data after action
            await refreshData();
        } catch (err) {
            showToast("Failed to update status.", 'error');
        } finally {
            // Remove from processing set to allow subsequent actions/retries
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
                const res = await apiClient.patch(`/api/hostelStaff/staff/office/bulk-reject`, {
                    formIds: idsToReject,
                    rejectReason: reason
                });
                const processedSet = new Set(idsToReject);
                const rejCount = res.data?.rejected || 0;
                const failCount = res.data?.failed || 0;

                setRequests(prev => prev.filter(r => !processedSet.has(r.id)));
                setDashboardStats(prev => prev ? {
                    ...prev,
                    pendingOffice: Math.max(0, (prev.pendingOffice || 0) - (rejCount || processedSet.size)),
                    rejectedOffice: (prev.rejectedOffice || 0) + (rejCount || processedSet.size)
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
                await apiClient.patch(`/api/hostelStaff/staff/office/${rejectFormId}/reject`, { rejectReason });
                setRequests(prev => prev.filter(r => r.id !== rejectFormId));
                setDashboardStats(prev => prev ? {
                    ...prev,
                    pendingOffice: Math.max(0, (prev.pendingOffice || 0) - 1),
                    rejectedOffice: (prev.rejectedOffice || 0) + 1
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
                setIsRejecting(false); // Enable retry on failure
            }
        }
    };

    const handleBulkAction = async () => {
        if (selectedIds.length === 0 || isBulkProcessing) return;

        const idsToProcess = [...selectedIds];
        startBulkOperation('APPROVE', idsToProcess.length, 'Approving Requests...');

        try {
            await apiClient.patch(`/api/hostelStaff/staff/office/bulk?action=Approve`, idsToProcess);
            const processedSet = new Set(idsToProcess);
            setRequests(prev => prev.filter(r => !processedSet.has(r.id)));
            setDashboardStats(prev => prev ? {
                ...prev,
                pendingOffice: Math.max(0, (prev.pendingOffice || 0) - processedSet.size),
                approved: (prev.approved || 0) + processedSet.size
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

    const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

    const normalizedOfficeSearch = searchQuery.trim().toLowerCase();
    const filteredRequests = requests.filter(req => {
        let matchGender = true;
        let matchYear = true;
        let matchDept = true;

        if (genderFilter && genderFilter !== "ALL") {
            matchGender = req.gender === genderFilter;
        }
        if (selectedYear && selectedYear !== "all") {
            matchYear = req.year === selectedYear;
        }
        if (deptFilter && deptFilter !== "ALL") {
            matchDept = (req.dept || req.department) === deptFilter;
        }
        if (normalizedOfficeSearch) {
            const nameMatch = req.name?.toLowerCase().includes(normalizedOfficeSearch);
            const regNoMatch = req.registerNo?.toLowerCase().includes(normalizedOfficeSearch);
            const phoneMatch = (req.phone || req.phoneNo || "").toLowerCase().includes(normalizedOfficeSearch);
            if (!nameMatch && !regNoMatch && !phoneMatch) return false;
        }

        return matchGender && matchYear && matchDept;
    });

    const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
    const paginatedForms = filteredRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--theme-bg)]">
                <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6">
                    <div className="skeleton mb-6 h-7 w-56" />
                    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[0, 1, 2, 3].map((i) => (
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
            roleTag="HOSTEL OFFICE"
            pageTitle={view === "dashboard" ? "Hostel Office Overview" : view === "requests" ? "Review & Confirm Reductions" : "Monthly Mess Reduction Reports"}
            breadcrumbs={["GCES", "Office", view === "dashboard" ? "Dashboard" : view === "requests" ? "Requests" : "Reports"]}
            navItems={[
                { key: 'dashboard', label: 'Dashboard', icon: FiBarChart2 },
                { key: 'requests', label: 'Requests', icon: FiList, badge: requests.length > 0 ? requests.length : undefined },
                { key: 'reports', label: 'Reports', icon: FiPieChart }
            ]}
            activeNav={view}
            onNavChange={setView}
            userInfo={{
                name: "Hostel Office",
                role: "Administration",
                userName: "office"
            }}
            onLogout={handleLogout}
        >
            {/* Toast Notification Panel */}
            <Toast toast={toast} onClose={() => setToast(null)} />



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
                                    <p className="page-subtitle">All academic year submissions awaiting final approval.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setView('requests')}
                                    className="btn btn-primary self-start sm:self-auto"
                                >
                                    <FiList size={14} /> Review requests
                                </button>
                            </div>

                            {/* Year tiles */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {YEARS.map(yr => (
                                    <YearStatCard key={yr} year={yr} requests={requests} yearStats={yearStats} />
                                ))}
                            </div>

                            {/* Status tiles */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="stat-card">
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="section-label">Pending office</p>
                                        <span className="badge badge-warning">Queue</span>
                                    </div>
                                    <p className="mt-2 text-[28px] font-semibold leading-none tracking-tight text-[var(--theme-text-primary)]">
                                        {dashboardStats.pendingOffice || 0}
                                    </p>
                                    <p className="mt-4 text-xs leading-relaxed text-[var(--theme-text-secondary)]">
                                        Awaiting final office confirmation
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setLogActionType('Approved');
                                        setLogActionTitle('Office Approved');
                                        setIsLogModalOpen(true);
                                    }}
                                    className="stat-card text-left transition-colors hover:border-[var(--theme-border-strong)]"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="section-label">Approved</p>
                                        <span className="badge badge-success">Reduction applied</span>
                                    </div>
                                    <p className="mt-2 text-[28px] font-semibold leading-none tracking-tight text-[var(--theme-text-primary)]">
                                        {dashboardStats.approved || 0}
                                    </p>
                                    <p className="mt-4 text-xs leading-relaxed text-[var(--theme-text-secondary)]">
                                        Completed requests · view activity log
                                    </p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setLogActionType('Rejected');
                                        setLogActionTitle('Office Rejected');
                                        setIsLogModalOpen(true);
                                    }}
                                    className="stat-card text-left transition-colors hover:border-[var(--theme-border-strong)]"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="section-label">Rejected</p>
                                        <span className="badge badge-danger">Returned</span>
                                    </div>
                                    <p className="mt-2 text-[28px] font-semibold leading-none tracking-tight text-[var(--theme-text-primary)]">
                                        {dashboardStats.rejectedOffice || 0}
                                    </p>
                                    <p className="mt-4 text-xs leading-relaxed text-[var(--theme-text-secondary)]">
                                        Returned to students · view activity log
                                    </p>
                                </button>

                                <div className="stat-card">
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="section-label">Total forms</p>
                                        <span className="badge badge-neutral">This cycle</span>
                                    </div>
                                    <p className="mt-2 text-[28px] font-semibold leading-none tracking-tight text-[var(--theme-text-primary)]">
                                        {(dashboardStats.pendingOffice || 0) + (dashboardStats.approved || 0) + (dashboardStats.rejectedOffice || 0)}
                                    </p>
                                    <p className="mt-4 text-xs leading-relaxed text-[var(--theme-text-secondary)]">
                                        Cumulative submissions received
                                    </p>
                                </div>
                            </div>

                            {/* Workflow */}
                            <div className="panel">
                                <div className="panel-header">
                                    <div>
                                        <h2 className="panel-title">Final approval checklist</h2>
                                        <p className="panel-subtitle">Confirm these points before approving a request.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
                                    {[
                                        { step: '01', title: 'Prior approvals', text: 'Deputy warden and warden have already approved the request.' },
                                        { step: '02', title: 'Leave dates', text: 'Dates fall within the current reporting period and are valid.' },
                                        { step: '03', title: 'Records', text: 'Reduction is applied to the mess register for the same month.' }
                                    ].map((item) => (
                                        <div key={item.step} className="flex gap-3">
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
                                        </div>
                                    ))}
                                </div>
                            </div>

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
                            className="max-w-7xl mx-auto space-y-6"
                        >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <h1 className="page-title">Pending requests</h1>
                                    <p className="page-subtitle">Forms awaiting final office approval.</p>
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
                                            id="office-search"
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

                                    <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
                                        <label htmlFor="office-year-filter" className="sr-only">Year</label>
                                        <select
                                            id="office-year-filter"
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(e.target.value)}
                                            className="h-9 min-h-0 py-0 text-[12px] font-medium"
                                            style={{ width: 'auto', minWidth: '7rem' }}
                                        >
                                            <option value="all">All years</option>
                                            {YEARS.map(yr => (
                                                <option key={yr} value={yr}>{yr}</option>
                                            ))}
                                        </select>

                                        <label htmlFor="office-gender-filter" className="sr-only">Gender</label>
                                        <select
                                            id="office-gender-filter"
                                            value={genderFilter}
                                            onChange={(e) => setGenderFilter(e.target.value)}
                                            className="h-9 min-h-0 py-0 text-[12px] font-medium"
                                            style={{ width: 'auto', minWidth: '7rem' }}
                                        >
                                            <option value="ALL">All genders</option>
                                            <option value="MALE">Male</option>
                                            <option value="FEMALE">Female</option>
                                        </select>

                                        <label htmlFor="office-dept-filter" className="sr-only">Department</label>
                                        <select
                                            id="office-dept-filter"
                                            value={deptFilter}
                                            onChange={(e) => setDeptFilter(e.target.value)}
                                            className="h-9 min-h-0 py-0 text-[12px] font-medium"
                                            style={{ width: 'auto', minWidth: '7.5rem' }}
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

                                        <label htmlFor="office-records-per-page" className="sr-only">Records per page</label>
                                        <select
                                            id="office-records-per-page"
                                            value={itemsPerPage}
                                            onChange={(e) => {
                                                setItemsPerPage(Number(e.target.value));
                                                setCurrentPage(1);
                                            }}
                                            className="h-9 min-h-0 py-0 text-[12px] font-medium"
                                            style={{ width: 'auto', minWidth: '7.5rem' }}
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
                                    {(selectedYear !== 'all' || genderFilter !== 'ALL' || deptFilter !== 'ALL' || searchQuery) && (
                                        <button
                                            type="button"
                                            onClick={() => { setSelectedYear('all'); setGenderFilter('ALL'); setDeptFilter('ALL'); setSearchQuery(''); }}
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
                                            Nothing matches the current filters. Try a different year, department or search term.
                                        </p>
                                    </div>
                                )}
                                <div
                                    className={`max-h-[600px] overflow-x-auto overflow-y-auto ${paginatedForms.length === 0 ? 'hidden' : ''}`}
                                    style={{ WebkitOverflowScrolling: 'touch' }}
                                >
                                    <table className="data-table min-w-[900px]">
                                        <thead className="z-10">
                                            <tr>
                                                <th className="w-12 text-center">
                                                    <button
                                                        disabled={isBulkProcessing || processingIds.size > 0}
                                                        onClick={toggleSelectAll}
                                                        className="text-[var(--theme-text-secondary)] transition-colors hover:text-[var(--theme-text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
                                                        aria-label="Select all requests on this page"
                                                    >
                                                        {paginatedForms.length > 0 && paginatedForms.every(r => selectedIds.includes(r.id)) ? <FiCheckSquare size={15} /> : <FiSquare size={15} />}
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
                                                                <FiList size={22} />
                                                            </div>
                                                            <h3 className="text-[14px] font-semibold text-[var(--theme-text-primary)]">No requests found</h3>
                                                            <p className="max-w-xs text-xs text-[var(--theme-text-secondary)]">
                                                                Nothing matches the current filters. Try a different year, department or search term.
                                                            </p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : paginatedForms.map((req, idx) => (
                                                <motion.tr
                                                    key={'desk-' + req.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: Math.min(idx * 0.015, 0.2) }}
                                                    onClick={() => !processingIds.has(req.id) && !isBulkProcessing && toggleSelect(req.id)}
                                                    className={'cursor-pointer ' + (processingIds.has(req.id) || isBulkProcessing ? 'pointer-events-none opacity-50' : '')}
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
                                                        <span className="text-[12px] font-medium text-[var(--theme-text-secondary)]">{req.year}</span>
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
                                                            {req.reason && req.reason.length > 35 ? req.reason.substring(0, 35) + '…' : req.reason}
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

                    {/* ════ REPORTS VIEW ════ */}
                    {view === "reports" && (
                        <motion.div
                            key="reports"
                            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, y: -30, filter: "blur(10px)" }}
                            transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                            className="space-y-6"
                        >
                            {/* Report Header */}
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between no-print">
                                <div>
                                    <h1 className="page-title">Reports</h1>
                                    <p className="page-subtitle">Generate and download approved student reduction records.</p>
                                </div>
                                {hasGeneratedReport && (
                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <button
                                            onClick={handleDownloadReport}
                                            disabled={reportData.length === 0}
                                            className="btn btn-secondary"
                                        >
                                            <FiTrendingUp size={14} /> Download Excel
                                        </button>
                                        <button
                                            onClick={() => window.print()}
                                            disabled={reportData.length === 0}
                                            className="btn btn-primary"
                                        >
                                            <FiPieChart size={14} /> Export PDF
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Date and filter selectors */}
                            <div className="panel no-print relative z-50 overflow-visible p-5">
                                <div className="mb-4">
                                    <p className="section-label">Report filters</p>
                                    <p className="mt-0.5 text-xs text-[var(--theme-text-secondary)]">
                                        Narrow the export by department, year and leave date range.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 xl:grid-cols-5">
                                    <div className="relative z-20">
                                        <MultiSelect
                                            label="Department"
                                            options={
                                                activeDepts.length > 0
                                                    ? activeDepts.map(d => ({ value: d.departmentCode, label: d.departmentCode }))
                                                    : ["CSE", "ECE", "EEE", "MECH", "CIVIL", "MECHATRONICS"].map(code => ({ value: code, label: code }))
                                            }
                                            value={reportDeptFilters}
                                            onChange={(selected) => setReportDeptFilters(selected)}
                                            allOptionLabel="All Departments"
                                        />
                                    </div>
                                    <div className="relative z-20">
                                        <MultiSelect
                                            label="Year"
                                            options={[
                                                { value: "1st", label: "I Year (1st)" },
                                                { value: "2nd", label: "II Year (2nd)" },
                                                { value: "3rd", label: "III Year (3rd)" },
                                                { value: "4th", label: "IV Year (4th)" }
                                            ]}
                                            value={reportYearFilters}
                                            onChange={(selected) => setReportYearFilters(selected)}
                                            allOptionLabel="All Years"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="report-from-date" className="field-label">From date</label>
                                        <input
                                            id="report-from-date"
                                            type="date"
                                            value={reportFromDate}
                                            onChange={(e) => setReportFromDate(e.target.value)}
                                            className="w-full text-[13px]"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="report-to-date" className="field-label">To date</label>
                                        <input
                                            id="report-to-date"
                                            type="date"
                                            value={reportToDate}
                                            onChange={(e) => setReportToDate(e.target.value)}
                                            className="w-full text-[13px]"
                                        />
                                    </div>
                                    <button
                                        onClick={handleGenerateReport}
                                        disabled={isGeneratingReport}
                                        className="btn btn-primary w-full md:col-span-2 xl:col-span-1"
                                    >
                                        {isGeneratingReport ? (
                                            <>
                                                <FiLoader className="animate-spin" size={15} /> Generating…
                                            </>
                                        ) : (
                                            'Generate report'
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Print layout title (only visible when printing) */}
                            <div className="hidden print:block text-black mb-6">
                                <h1 className="text-2xl font-black uppercase text-center tracking-wider">GCES Srirangam Hostel Office</h1>
                                <h2 className="text-lg font-bold text-center mt-1 uppercase">Mess Reduction Report</h2>
                                <p className="text-center text-xs mt-2 font-medium">Period: {reportFromDate || "Start"} to {reportToDate || "End"}</p>
                            </div>

                            {/* Report Table */}
                            <div className="panel overflow-hidden print:border-none print:shadow-none">
                                {reportData.length === 0 && (
                                    <div className="empty-state no-print">
                                        <div className="empty-state-icon">
                                            <FiPieChart size={20} />
                                        </div>
                                        <h3 className="text-[14px] font-semibold text-[var(--theme-text-primary)]">No report data</h3>
                                        <p className="max-w-xs text-xs text-[var(--theme-text-secondary)]">
                                            No approved records fall within the selected date range.
                                        </p>
                                        <button onClick={handleGenerateReport} className="btn btn-secondary mt-1">
                                            Refresh data
                                        </button>
                                    </div>
                                )}
                                <div className={`max-h-[600px] overflow-x-auto overflow-y-auto ${reportData.length === 0 ? 'hidden print:block' : ''}`}>
                                    <table className="data-table min-w-[1000px] print:min-w-full">
                                        <thead className="z-10 print:static">
                                            <tr className="print:border-b-2 print:border-black">
                                                <th className="print:text-black">Student name</th>
                                                <th className="text-center print:text-black">Reg / Roll No</th>
                                                <th className="text-center print:text-black">Gender</th>
                                                <th className="text-center print:text-black">Year</th>
                                                <th className="text-center print:text-black">Department</th>
                                                <th className="text-center print:text-black">Leave date</th>
                                                <th className="text-center print:text-black">Arrival date</th>
                                                <th className="text-center print:text-black">Holidays</th>
                                                <th className="text-center print:text-black">Month-wise</th>
                                                <th className="text-center print:text-black">Deputy Warden</th>
                                                <th className="text-right print:text-black">Refund status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="print:divide-y print:divide-black">
                                            {reportData.length === 0 ? (
                                                <tr>
                                                    <td colSpan="11" className="print:text-black">
                                                        <div className="empty-state no-print">
                                                            <div className="empty-state-icon">
                                                                <FiPieChart size={20} />
                                                            </div>
                                                            <h3 className="text-[14px] font-semibold text-[var(--theme-text-primary)]">No report data</h3>
                                                            <p className="max-w-xs text-xs text-[var(--theme-text-secondary)]">
                                                                No approved records fall within the selected date range.
                                                            </p>
                                                            <button onClick={handleGenerateReport} className="btn btn-secondary mt-1">
                                                                Refresh data
                                                            </button>
                                                        </div>
                                                        <div className="hidden text-center text-sm font-bold print:block">
                                                            No records found for the selected date range.
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : reportData.map((req) => (
                                                <tr
                                                    key={req.formId}
                                                    className="print:text-black"
                                                >
                                                    <td>
                                                        <p className="text-[13px] font-semibold text-[var(--theme-text-primary)] print:text-black">{req.name}</p>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="font-mono text-[11.5px] font-medium text-[var(--theme-text-secondary)] print:text-black">{req.registerNo}</span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="text-[12px] font-medium text-[var(--theme-text-secondary)] print:text-black">{req.gender}</span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="text-[12px] font-medium text-[var(--theme-text-secondary)] print:text-black">{req.year} Yr</span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="badge badge-neutral print:border-none print:text-black">{req.department}</span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="text-[12px] text-[var(--theme-text-secondary)] print:text-black">{req.leaveDate}</span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="text-[12px] text-[var(--theme-text-secondary)] print:text-black">{req.arrivalDate}</span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="text-[12px] font-semibold text-[var(--theme-text-primary)] print:text-black">{req.totalHolidays}</span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="whitespace-nowrap text-[12px] text-[var(--theme-text-secondary)] print:text-black">{req.monthWiseHolidays || "-"}</span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="text-[12px] font-medium text-[var(--theme-text-secondary)] print:text-black">{req.assignedDeputyWarden}</span>
                                                    </td>
                                                    <td className="text-right">
                                                        <span className="badge badge-success print:border-none print:text-black">{req.currentStatus}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
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
                        Hostel office · Mess Reduction Portal
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

                                <label htmlFor="office-reject-reason" className="field-label mt-4">
                                    Rejection reason <span style={{ color: 'var(--color-danger)' }}>*</span>
                                </label>
                                <textarea
                                    id="office-reject-reason"
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="e.g. Reduction already applied for these dates."
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
                themeColor="violet"
                role="Office"
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
}

export default HostelOffice;
