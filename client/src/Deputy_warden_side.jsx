import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiUsers, FiCheck, FiX, FiPieChart, FiList, FiCheckSquare, FiSquare, FiTrendingUp, FiArrowRight, FiClock, FiBarChart2, FiActivity, FiLogOut, FiSearch, FiSun, FiMoon, FiCheckCircle, FiXCircle } from "react-icons/fi";
import apiClient from "./api/apiClient";
import { deleteCookie, getCookie } from "./utils/cookieUtils";
import { useTheme } from "./context/ThemeContext";
import logo from "./assets/1000088399.png";
import ActivityLogModal from "./ActivityLogModal";
import { logout } from "./services/authService";
import { getActiveDepartments } from "./api/departmentService";


const handleLogout = () => {
  logout();
};

const YEARS = ["1st", "2nd", "3rd", "4th"];

const YEAR_COLORS = {
    "1st": { accent: "teal", bg: "bg-[var(--theme-btn-primary)]", text: "text-[var(--theme-btn-primary)]", border: "border-[var(--theme-btn-primary)]/20", glow: "shadow-sm", ring: "bg-[var(--theme-btn-primary)]/10" },
    "2nd": { accent: "teal", bg: "bg-[var(--theme-btn-primary)]", text: "text-[var(--theme-btn-primary)]", border: "border-[var(--theme-btn-primary)]/20", glow: "shadow-sm", ring: "bg-[var(--theme-btn-primary)]/10" },
    "3rd": { accent: "teal", bg: "bg-[var(--theme-btn-primary)]", text: "text-[var(--theme-btn-primary)]", border: "border-[var(--theme-btn-primary)]/20", glow: "shadow-sm", ring: "bg-[var(--theme-btn-primary)]/10" },
    "4th": { accent: "teal", bg: "bg-[var(--theme-btn-primary)]", text: "text-[var(--theme-btn-primary)]", border: "border-[var(--theme-btn-primary)]/20", glow: "shadow-sm", ring: "bg-[var(--theme-btn-primary)]/10" },
};

function YearStatCard({ year, requests }) {
    const pending = requests.filter(r => r.year === year).length;

    return (
        <motion.div
            whileHover={{ y: -2 }}
            className="bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-xl p-5 shadow-sm relative overflow-hidden group transition-all duration-200"
        >
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold tracking-wider uppercase text-[var(--theme-btn-primary)]">{year} Year</span>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-[var(--theme-btn-primary)]/10 text-[var(--theme-btn-primary)] border border-[var(--theme-btn-primary)]/20 uppercase tracking-wider">Pending</span>
            </div>
            <div className="mt-1">
                <p className="text-3xl font-bold text-[var(--theme-btn-primary)]">{pending}</p>
            </div>
        </motion.div>
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

function AutoAcceptSettingsCard() {
    const [enabled, setEnabled] = useState(false);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [department, setDepartment] = useState("ALL");
    const [year, setYear] = useState("ALL");
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [activeDepts, setActiveDepts] = useState([]);

    useEffect(() => {
        getActiveDepartments().then(depts => {
            if (Array.isArray(depts)) setActiveDepts(depts);
        });
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        const fetchSettings = async () => {
            try {
                const res = await apiClient.get("/api/hostelStaff/staff/auto-accept", { signal: controller.signal });
                if (res.data) {
                    setEnabled(res.data.enabled);
                    setFromDate(res.data.fromDate || "");
                    setToDate(res.data.toDate || "");
                    setDepartment(res.data.department || "ALL");
                    setYear(res.data.year || "ALL");
                    setReason(res.data.reason || "");
                }
            } catch (err) {
                if (controller.signal.aborted) return;
                setError("Failed to load auto-accept settings");
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };
        fetchSettings();
        return () => {
            controller.abort();
        };
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        setError(null);

        if (!fromDate || !toDate) {
            setError("Both from and to dates are required.");
            setSaving(false);
            return;
        }

        if (new Date(fromDate) > new Date(toDate)) {
            setError("From date cannot be after to date.");
            setSaving(false);
            return;
        }

        try {
            await apiClient.post("/api/hostelStaff/staff/auto-accept", {
                enabled,
                fromDate,
                toDate,
                department,
                year,
                reason
            });
            setMessage("Settings saved successfully!");
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const getStatusInfo = () => {
        if (!enabled) return { label: "Disabled", color: "bg-slate-500/10 text-slate-400 border-slate-500/20" };
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const from = fromDate ? new Date(fromDate) : null;
        const to = toDate ? new Date(toDate) : null;
        if (from) from.setHours(0, 0, 0, 0);
        if (to) to.setHours(0, 0, 0, 0);

        if (!from || !to) return { label: "Incomplete Date Range", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
        
        if (today >= from && today <= to) {
            const diffTime = to.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const expiryText = diffDays === 0 ? "Expires today" : `Expires in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
            return { label: "Active Now", sub: expiryText, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
        } else if (today > to) {
            return { label: "Expired", color: "bg-rose-500/10 text-rose-400 border-rose-500/20" };
        } else {
            return { label: "Scheduled", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" };
        }
    };

    const statusInfo = getStatusInfo();
    const isSaveDisabled = !fromDate || !toDate || new Date(fromDate) > new Date(toDate);

    if (loading) {
        return (
            <div className="bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-xl p-6 shadow-sm flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-t-teal-500 border-teal-500/20 rounded-full animate-spin mr-3" />
                <span className="text-[var(--theme-text-secondary)] text-sm">Loading auto-accept settings...</span>
            </div>
        );
    }

    return (
        <div className="bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-xl p-6 sm:p-8 shadow-sm relative overflow-hidden group">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--theme-border)] pb-4 mb-6">
                <div>
                    <h3 className="text-lg font-bold text-[var(--theme-text-primary)] flex items-center gap-2">
                        <FiClock className="text-[var(--theme-btn-primary)]" /> Auto Accept / Auto Forward
                    </h3>
                    <p className="text-[var(--theme-text-secondary)] text-xs font-normal mt-1">
                        Automatically forward incoming requests during your leave or unavailability.
                    </p>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-1.5">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider border ${statusInfo.color}`}>
                        {statusInfo.label}
                    </span>
                    {statusInfo.sub && (
                        <span className="text-[10px] text-emerald-400/80 font-medium">
                            {statusInfo.sub}
                        </span>
                    )}
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <div className="flex items-center justify-between bg-white/[0.02] border border-[var(--theme-border)] rounded-xl p-4">
                    <div>
                        <span className="text-sm font-semibold text-[var(--theme-text-primary)]">Enable Auto Accept</span>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">Toggle this feature ON or OFF.</p>
                    </div>
                    <button
                        type="button"
                        disabled={saving}
                        onClick={() => {
                            const newEnabled = !enabled;
                            setEnabled(newEnabled);
                            if (newEnabled) {
                                // Default fromDate to today if turning on and it's missing or before today
                                const todayStr = new Date().toISOString().split('T')[0];
                                if (!fromDate || fromDate < todayStr) {
                                    setFromDate(todayStr);
                                    if (toDate && toDate < todayStr) setToDate(todayStr);
                                }
                            }
                        }}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${saving ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${enabled ? 'bg-[var(--theme-btn-primary)]' : 'bg-slate-700'}`}
                    >
                        <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-2">From Date</label>
                        <input
                            type="date"
                            disabled={!enabled || saving}
                            min={new Date().toISOString().split('T')[0]}
                            value={fromDate}
                            onChange={(e) => {
                                const newFrom = e.target.value;
                                setFromDate(newFrom);
                                if (toDate && toDate < newFrom) setToDate(newFrom);
                            }}
                            className="w-full bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--theme-text-primary)] focus:outline-none focus:border-teal-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-2">To Date</label>
                        <input
                            type="date"
                            disabled={!enabled || saving}
                            min={fromDate || new Date().toISOString().split('T')[0]}
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="w-full bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--theme-text-primary)] focus:outline-none focus:border-teal-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-2">Department</label>
                        <select
                            disabled={!enabled || saving}
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            className="w-full bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--theme-text-primary)] focus:outline-none focus:border-teal-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <option value="ALL">All Departments</option>
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
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-2">Year</label>
                        <select
                            disabled={!enabled || saving}
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            className="w-full bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--theme-text-primary)] focus:outline-none focus:border-teal-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <option value="ALL">All Years</option>
                            <option value="1">1st Year (1)</option>
                            <option value="2">2nd Year (2)</option>
                            <option value="3">3rd Year (3)</option>
                            <option value="4">4th Year (4)</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-2">Reason / Description</label>
                    <input
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g. Official Duty / Out of Station / Medical Leave"
                        className="w-full bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)] focus:outline-none focus:border-teal-500/50 transition-colors"
                    />
                </div>

                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl p-4 text-xs font-medium">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl p-4 text-xs font-medium animate-pulse">
                        {message}
                    </div>
                )}

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving || isSaveDisabled}
                        className={`px-6 py-2.5 rounded-xl font-semibold text-xs tracking-wider uppercase transition-colors ${isSaveDisabled ? 'bg-[var(--theme-border)]/40 text-[var(--theme-text-secondary)] cursor-not-allowed border border-[var(--theme-border)]' : 'bg-[var(--theme-btn-primary)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-btn-primary-hover)]'}`}
                    >
                        {saving ? "Saving..." : "Save Settings"}
                    </button>
                </div>
            </form>
        </div>
    );
}

function Deputy_warden_side() {
    const { isDark, toggleTheme } = useTheme();
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

    // Reset pagination on search / filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, selectedYear, deptFilter, itemsPerPage]);

    const refreshData = async (signal = null) => {
        try {
            const currentUsername = getCookie('staffUsername');
            const currentDeputyDetails = getDeputyDetails(currentUsername);

            // Fetch pending forms for Deputy Warden
            const response = await apiClient.get("/api/hostelStaff/staff/deputyWarden", signal ? { signal } : {});
            if (signal && signal.aborted) return;

            // Filter forms in frontend
            const filteredData = response.data.filter(form => {
                if (!currentDeputyDetails) return true;
                const isGenderMatch = !form.gender || form.gender === currentDeputyDetails.gender;
                const isYearMatch = form.year === currentDeputyDetails.year;
                const isAssigned = form.assignedDeputyWarden === currentUsername;
                return (isGenderMatch && isYearMatch) || isAssigned;
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
            setRequests(data);

            // Fetch dashboard counts
            const countRes = await apiClient.get("/api/hostelStaff/staff/dashboard-count", signal ? { signal } : {});
            if (signal && signal.aborted) return;
            setDashboardStats(countRes.data);

            // Fetch year-wise counts
            const yearCountRes = await apiClient.get("/api/hostelStaff/staff/deputyWarden/year-count", signal ? { signal } : {});
            if (signal && signal.aborted) return;
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
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);
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
        if (isRejecting) return;

        if (!rejectReason.trim()) {
            showToast("Please enter a reason for rejection.", 'error');
            return;
        }

        setIsRejecting(true);
        try {
            if (isBulkReject) {
                const res = await apiClient.patch(`/api/hostelStaff/staff/deputyWarden/bulk-reject`, {
                    formIds: selectedIds,
                    rejectReason
                });
                showToast(`Bulk Reject Summary: Selected: ${res.data.selected}, Rejected: ${res.data.rejected}, Failed: ${res.data.failed}`, 'success');
                setSelectedIds([]);
            } else {
                await apiClient.patch(`/api/hostelStaff/staff/deputyWarden/${rejectFormId}/reject`, { rejectReason });
                showToast("Request rejected successfully", 'success');
            }
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
    };

    const handleBulkAction = async (newStatus) => {
        if (selectedIds.length === 0 || isBulkProcessing) return;

        setIsBulkProcessing(true);
        const action = newStatus === "accepted" ? "Approve" : "Reject";
        try {
            await apiClient.patch(`/api/hostelStaff/staff/deputyWarden/bulk?action=${action}`, selectedIds);
            showToast(`Bulk ${action.toLowerCase()} completed successfully`, 'success');
            setSelectedIds([]);
            await refreshData();
        } catch (err) {
            showToast("Failed to perform bulk action.", 'error');
        } finally {
            setIsBulkProcessing(false);
        }
    };

    const filteredRequests = requests
        .filter(r => selectedYear === "all" ? true : r.year === selectedYear)
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
        const paginatedIds = paginatedForms.map(r => r.id);
        const allSelectedOnPage = paginatedIds.every(id => selectedIds.includes(id));
        setSelectedIds(prev => {
            if (allSelectedOnPage) {
                return prev.filter(id => !paginatedIds.includes(id));
            } else {
                return Array.from(new Set([...prev, ...paginatedIds]));
            }
        });
    };

    // Dashboard aggregates
    const totalForms     = requests.length;
    const totalPending   = requests.filter(r => r.status === "pending").length;
    const totalAccepted  = requests.filter(r => ["accepted","approved_by_warden","fully_approved"].includes(r.status)).length;
    const totalRejected  = requests.filter(r => ["rejected","final_rejected"].includes(r.status)).length;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--theme-bg)] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-[var(--theme-btn-primary)]/20 border-t-[var(--theme-btn-primary)] rounded-full animate-spin" />
                    <p className="text-[var(--theme-btn-primary)] font-black tracking-widest uppercase text-sm">Loading requests...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex flex-col font-sans bg-[var(--theme-bg)] text-[var(--theme-text-primary)]">
            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-[12px] shadow-lg border w-[calc(100%-2rem)] sm:w-auto sm:min-w-[320px] max-w-md
                            ${toast.type === 'success'
                                ? 'bg-slate-900 border-emerald-500/30 text-emerald-400'
                                : 'bg-slate-900 border-rose-500/30 text-rose-400'}`}
                    >
                        {toast.type === 'success'
                            ? <FiCheckCircle size={20} className="shrink-0" />
                            : <FiXCircle size={20} className="shrink-0" />}
                        <p className="font-medium text-sm text-white">{toast.message}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="fixed inset-0 bg-[var(--theme-bg)] -z-10" />

            {/* ── Header ── */}
            <header className="w-full flex flex-col lg:flex-row lg:items-center lg:justify-between px-3 sm:px-6 py-2.5 sm:py-3 border-b border-[var(--theme-border)] bg-[var(--theme-header)] sticky top-0 z-50 gap-2.5 sm:gap-4" style={{transition: "background-color 0.3s ease"}}>
                <div className="flex items-center gap-3 sm:gap-4 justify-between w-full lg:w-auto">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="p-1.5 sm:p-2 bg-teal-500/10 rounded-xl border border-teal-500/20">
                            <img src={logo} alt="GCES Logo" className="w-7 h-7 sm:w-10 sm:h-10 object-contain" />
                        </div>
                        <div className="flex flex-col leading-tight">
                            <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-white/70 uppercase">{deputyDetails ? deputyDetails.label : "Deputy Warden Panel"}</span>
                            <span className="text-lg sm:text-xl font-bold text-white tracking-normal uppercase">Mess Reduction</span>
                        </div>
                    </div>
                </div>

                {/* View Toggle */}
                <div className="flex w-full lg:w-auto bg-[var(--theme-card)] p-1 rounded-xl border border-[var(--theme-border)] shadow-sm overflow-x-auto [&::-webkit-scrollbar]:hidden">
                    <button onClick={() => setView("dashboard")} className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all duration-200 whitespace-nowrap ${view === "dashboard" ? "bg-[var(--theme-btn-primary)] text-white shadow-sm" : "text-[var(--theme-text-primary)] hover:text-[var(--theme-btn-primary)] hover:bg-[var(--theme-btn-primary)]/10"}`}>
                        <FiBarChart2 size={14} /> Dashboard
                    </button>
                    <button onClick={() => setView("requests")} className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all duration-200 whitespace-nowrap ${view === "requests" ? "bg-[var(--theme-btn-primary)] text-white shadow-sm" : "text-[var(--theme-text-primary)] hover:text-[var(--theme-btn-primary)] hover:bg-[var(--theme-btn-primary)]/10"}`}>
                        <FiList size={14} /> Requests
                    </button>
                </div>

                {/* Theme Toggle + Logout */}
                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <button
                        onClick={toggleTheme}
                        title={isDark ? "Switch to Light" : "Switch to Dark"}
                        className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/20 text-white hover:bg-[var(--theme-btn-primary)]/10 transition-all shrink-0"
                    >
                        {isDark ? <FiSun size={14} /> : <FiMoon size={14} />}
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full lg:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all text-xs font-semibold tracking-wider uppercase"
                    >
                        <FiLogOut size={14} /> Logout
                    </button>
                </div>
            </header>

            {/* ── Main Content ── */}
            <main className="flex-1 p-3 sm:p-6 lg:p-6">
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
                            {/* Section heading */}
                            <div>
                                <h2 className="text-lg sm:text-2xl font-bold text-[var(--theme-text-primary)] tracking-tight flex items-center gap-2">
                                    <div className="w-1 h-4 sm:h-5 bg-[var(--theme-btn-primary)] rounded-full" />
                                    Submission Overview
                                </h2>
                                <p className="text-[var(--theme-text-secondary)] text-xs sm:text-sm font-normal ml-3 mt-0.5">
                                    Submissions for your assigned year.
                                </p>
                            </div>

                            {/* ── Year Stat Cards ── */}
                            <div className="grid grid-cols-1 gap-6 max-w-sm">
                                {deputyDetails && (
                                    <YearStatCard 
                                        year={deputyDetails.year === 1 ? "1st" : deputyDetails.year === 2 ? "2nd" : deputyDetails.year === 3 ? "3rd" : "4th"} 
                                        requests={requests} 
                                        yearStats={yearStats} 
                                    />
                                )}
                            </div>

                            {/* ── Overall Status + Total ── */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Overall Status Tracking */}
                                <div className="lg:col-span-2 bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-xl p-6 sm:p-8 shadow-sm relative overflow-hidden group">
                                    <h3 className="text-lg font-bold text-[var(--theme-text-primary)] mb-4 sm:mb-6 flex items-center gap-2">
                                        <FiTrendingUp className="text-[var(--theme-btn-primary)]" /> Overall Status Tracking
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 relative z-10">
                                        {[
                                            { label: "Pending Deputy",  count: dashboardStats.pendingDeputyWarden || 0,  color: "text-amber-400",   bg: "bg-amber-400/10",   border: "border-amber-400/10"   },
                                            { label: "Forwarded Warden", count: (dashboardStats.pendingWarden || 0) + (dashboardStats.pendingOffice || 0) + (dashboardStats.approved || 0) + (dashboardStats.rejectedWarden || 0) + (dashboardStats.rejectedOffice || 0), color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/10", action: "Approved", title: "Deputy Warden Approved" },
                                            { label: "Rejected Deputy", count: dashboardStats.rejectedDeputyWarden || 0, color: "text-rose-400",    bg: "bg-rose-400/10",    border: "border-rose-400/10", action: "Rejected", title: "Deputy Warden Rejected"    },
                                        ].map(s => (
                                            <div 
                                                key={s.label} 
                                                onClick={() => {
                                                    if (s.action) {
                                                        setLogActionType(s.action);
                                                        setLogActionTitle(s.title);
                                                        setIsLogModalOpen(true);
                                                    }
                                                }}
                                                className={`p-5 rounded-xl ${s.bg} border ${s.border} ${s.action ? 'cursor-pointer hover:bg-[var(--theme-btn-primary)]/5 transition-colors' : ''}`}
                                            >
                                                <p className="text-xs text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider mb-1.5">{s.label}</p>
                                                <p className={`text-3xl sm:text-4xl font-bold ${s.color}`}>{s.count}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
 
                                 {/* Total Forms */}
                                 <div className="bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-xl p-6 sm:p-8 flex flex-col justify-between shadow-sm">
                                     <div>
                                         <h3 className="text-lg font-bold text-[var(--theme-text-primary)] mb-1">Total Forms</h3>
                                         <p className="text-[var(--theme-text-secondary)] text-xs font-normal">Cumulative submissions received.</p>
                                     </div>
                                     <p className="text-4xl sm:text-5xl font-bold text-[var(--theme-text-primary)] mt-4">
                                         {(dashboardStats.pendingDeputyWarden || 0) + 
                                          (dashboardStats.pendingWarden || 0) + 
                                          (dashboardStats.pendingOffice || 0) + 
                                          (dashboardStats.approved || 0) + 
                                          (dashboardStats.rejectedDeputyWarden || 0) + 
                                          (dashboardStats.rejectedWarden || 0) + 
                                          (dashboardStats.rejectedOffice || 0)}
                                     </p>
                                     <button
                                         onClick={() => setView("requests")}
                                         className="mt-6 flex items-center justify-center gap-2 w-full bg-[var(--theme-btn-primary)] text-white py-3 rounded-xl font-semibold text-xs tracking-wider uppercase hover:bg-[var(--theme-btn-primary-hover)] transition-colors"
                                     >
                                         Manage Requests <FiArrowRight />
                                     </button>
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
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
                                <div>
                                    <h2 className="text-xl font-bold text-[var(--theme-text-primary)] tracking-tight flex items-center gap-2">
                                        <div className="w-1 h-5 bg-[var(--theme-btn-primary)] rounded-full" />
                                        Pending Requests - Deputy Review
                                    </h2>
                                    <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">Forms awaiting deputy warden approval</p>
                                </div>
                            </div>

                            {/* Table Toolbar Above Table: Split into 3 logical sections */}
                            <div className="bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-xl p-4 shadow-sm space-y-4">
                                {/* Row 1: Search Students (Left) & Total Records (Right) */}
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                                    <div className="relative flex-1 min-w-[240px]">
                                        <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                                            <FiSearch size={15} className="text-[var(--theme-text-secondary)]" />
                                        </div>
                                        <input
                                            id="deputy-search"
                                            type="text"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Search Students..."
                                            className="w-full bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-lg pl-10 pr-8 py-2 text-xs font-medium text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)] focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/20 transition-all"
                                        />
                                        {search && (
                                            <button
                                                onClick={() => setSearch("")}
                                                className="absolute inset-y-0 right-3 flex items-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors text-xs font-semibold"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>

                                    <div className="px-3.5 py-2 bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-lg text-xs font-bold text-[var(--theme-text-primary)] whitespace-nowrap self-start sm:self-auto">
                                        Total Records : <span className="text-[var(--theme-btn-primary)] font-bold ml-1">{filteredRequests.length}</span>
                                    </div>
                                </div>

                                {/* Row 2: Filtering Controls (Department, Records Per Page) */}
                                <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[var(--theme-border)]">
                                    {/* Department Filter */}
                                    <div className="flex items-center gap-2 bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-lg px-3 py-1.5 shadow-xs hover:border-[var(--theme-btn-primary)]/50 transition-colors">
                                        <span className="text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider whitespace-nowrap">Department</span>
                                        <select
                                            id="deputy-dept-filter"
                                            value={deptFilter}
                                            onChange={(e) => setDeptFilter(e.target.value)}
                                            className="bg-transparent text-xs font-bold text-[var(--theme-text-primary)] focus:outline-none cursor-pointer"
                                        >
                                            <option value="ALL" className="bg-[var(--theme-card)] text-[var(--theme-text-primary)] font-medium">All</option>
                                            {activeDepts.length > 0 ? (
                                                activeDepts.map(d => (
                                                    <option key={d.id} value={d.departmentCode} className="bg-[var(--theme-card)] text-[var(--theme-text-primary)] font-medium">{d.departmentCode}</option>
                                                ))
                                            ) : (
                                                ["CSE", "ECE", "EEE", "MECH", "CIVIL", "MECHATRONICS"].map(code => (
                                                    <option key={code} value={code} className="bg-[var(--theme-card)] text-[var(--theme-text-primary)] font-medium">{code}</option>
                                                ))
                                            )}
                                        </select>
                                    </div>

                                    {/* Records Per Page Filter */}
                                    <div className="flex items-center gap-2 bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-lg px-3 py-1.5 shadow-xs hover:border-[var(--theme-btn-primary)]/50 transition-colors">
                                        <span className="text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider whitespace-nowrap">Records Per Page</span>
                                        <select
                                            id="deputy-records-per-page"
                                            value={itemsPerPage}
                                            onChange={(e) => {
                                                setItemsPerPage(Number(e.target.value));
                                                setCurrentPage(1);
                                            }}
                                            className="bg-transparent text-xs font-bold text-[var(--theme-text-primary)] focus:outline-none cursor-pointer"
                                        >
                                            <option value={20} className="bg-[var(--theme-card)] text-[var(--theme-text-primary)] font-medium">20</option>
                                            <option value={40} className="bg-[var(--theme-card)] text-[var(--theme-text-primary)] font-medium">40</option>
                                            <option value={60} className="bg-[var(--theme-card)] text-[var(--theme-text-primary)] font-medium">60</option>
                                            <option value={80} className="bg-[var(--theme-card)] text-[var(--theme-text-primary)] font-medium">80</option>
                                            <option value={100} className="bg-[var(--theme-card)] text-[var(--theme-text-primary)] font-medium">100</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <AnimatePresence>
                                {selectedIds.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="relative z-20 shadow-2xl sm:shadow-none bg-[var(--theme-card)]/95 sm:bg-emerald-500/10 backdrop-blur-xl sm:backdrop-blur-none border border-emerald-500/30 sm:border-emerald-500/20 rounded-2xl sm:rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-4"
                                    >
                                        <span className="text-emerald-400 font-bold text-xs sm:text-sm tracking-wider uppercase text-center sm:text-left">
                                            {selectedIds.length} Form{selectedIds.length > 1 ? 's' : ''} Selected
                                        </span>
                                        <div className="flex items-center gap-3 w-full sm:w-auto">
                                            <button
                                                onClick={() => handleBulkAction("accepted")}
                                                disabled={isBulkProcessing}
                                                className="flex items-center justify-center gap-1.5 px-4 py-2 sm:py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-bold tracking-wider uppercase hover:bg-emerald-400 transition-colors shadow-glow sm:shadow-sm flex-1 sm:flex-none disabled:opacity-70 disabled:cursor-not-allowed"
                                            >
                                                {isBulkProcessing ? (
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                ) : (
                                                    <FiCheck size={18} />
                                                )}
                                                {isBulkProcessing ? 'Processing...' : 'Approve'}
                                            </button>
                                            <button
                                                onClick={() => { setIsBulkReject(true); setRejectReason(""); setIsRejectModalOpen(true); }}
                                                disabled={isBulkProcessing}
                                                className="flex items-center justify-center gap-1.5 px-4 py-2 sm:py-2.5 bg-rose-500 text-white rounded-xl text-xs font-bold tracking-wider uppercase hover:bg-rose-400 transition-colors shadow-glow sm:shadow-sm flex-1 sm:flex-none disabled:opacity-70 disabled:cursor-not-allowed"
                                            >
                                                <FiX size={18} />
                                                Reject
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Requests Table (Desktop) & Cards (Mobile) */}
                            <div className="bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-xl overflow-hidden shadow-sm">
                                
                                {/* 💻 TABLE VIEW */}
                                <div 
                                    className="overflow-x-auto max-h-[600px] overflow-y-auto"
                                    style={{ WebkitOverflowScrolling: 'touch' }}
                                >
                                    <table 
                                        className="w-full text-left border-collapse min-w-[750px] lg:min-w-0 lg:table-auto lg:whitespace-normal"
                                    >
                                        <thead className="sticky top-0 bg-[var(--theme-card)] z-10">
                                            <tr className="bg-[var(--theme-bg)] text-xs uppercase tracking-wider font-semibold border-b border-[var(--theme-border)]">
                                                <th className="px-6 py-4 text-[var(--theme-text-secondary)] w-16 text-center">
                                                    <button 
                                                        disabled={isBulkProcessing || processingIds.size > 0} 
                                                        onClick={toggleSelectAll} 
                                                        className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {paginatedForms.length > 0 && paginatedForms.every(r => selectedIds.includes(r.id)) ? <FiCheckSquare size={16} /> : <FiSquare size={16} />}
                                                    </button>
                                                </th>
                                                <th className="px-4 py-4 text-[var(--theme-text-secondary)]">Student Name</th>
                                                <th className="px-4 py-4 text-[var(--theme-text-secondary)] text-center">Register No</th>
                                                <th className="px-4 py-4 text-[var(--theme-text-secondary)] text-center">Department</th>
                                                <th className="px-4 py-4 text-[var(--theme-text-secondary)] text-center">Year</th>
                                                <th className="px-4 py-4 text-[var(--theme-text-secondary)] text-center">Gender</th>
                                                <th className="px-4 py-4 text-[var(--theme-text-secondary)] text-center">Phone Number</th>
                                                <th className="px-4 py-4 text-[var(--theme-text-secondary)] text-center">Room No</th>
                                                <th className="px-4 py-4 text-[var(--theme-text-secondary)] text-center">Leave Date</th>
                                                <th className="px-4 py-4 text-[var(--theme-text-secondary)] text-center">Arrival Date</th>
                                                <th className="px-4 py-4 text-[var(--theme-text-secondary)]">Reason</th>
                                                <th className="px-6 py-4 text-[var(--theme-text-secondary)] text-right w-40">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/[0.03]">
                                            {paginatedForms.length === 0 ? (
                                                <tr>
                                                    <td colSpan="12" className="px-6 py-24 text-center">
                                                        <div className="flex flex-col items-center justify-center gap-3">
                                                            <div className="w-16 h-16 bg-[var(--theme-border)] rounded-full flex items-center justify-center text-[var(--theme-text-secondary)] mb-2">
                                                                <FiList size={32} />
                                                            </div>
                                                            <h3 className="text-[var(--theme-text-primary)] text-xl font-bold tracking-tight">No records found</h3>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : paginatedForms.map((req, idx) => (
                                                <motion.tr
                                                    layout
                                                    key={`desk-${req.id}`}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.04 }}
                                                    onClick={() => !processingIds.has(req.id) && !isBulkProcessing && toggleSelect(req.id)}
                                                    className={`hover:bg-[var(--theme-btn-primary)]/5 transition-colors border-b border-[var(--theme-border)] cursor-pointer ${selectedIds.includes(req.id) ? 'bg-[var(--theme-btn-primary)]/5' : ''} ${processingIds.has(req.id) || isBulkProcessing ? 'opacity-50 pointer-events-none' : ''}`}
                                                >
                                                    <td className="px-6 py-4 text-center">
                                                        <div className={`w-5 h-5 mx-auto rounded flex items-center justify-center border transition-colors ${selectedIds.includes(req.id) ? 'bg-teal-500 border-teal-400 text-slate-900' : 'bg-[var(--theme-bg)] border-[var(--theme-border)] text-transparent'}`}>
                                                            <FiCheck size={12} strokeWidth={4} />
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-4 max-w-[150px]">
                                                            <p className="text-sm font-semibold text-[var(--theme-text-primary)] group-hover:text-[var(--theme-btn-primary)] transition-colors truncate">{req.name}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-center whitespace-nowrap">
                                                        <span className="text-xs font-semibold text-[var(--theme-text-primary)]">{req.registerNo || "N/A"}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center whitespace-nowrap">
                                                        <span className="px-2.5 py-1 bg-[var(--theme-bg)] rounded-md text-xs font-semibold text-[var(--theme-text-secondary)] border border-[var(--theme-border)] tracking-wider block truncate max-w-[120px]">{req.dept}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center whitespace-nowrap">
                                                        <span className="px-2 py-0.5 bg-[var(--theme-bg)] rounded text-xs font-medium text-[var(--theme-text-secondary)]">{req.year}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center whitespace-nowrap">
                                                        <span className="text-xs font-medium text-[var(--theme-text-secondary)]">{req.gender}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center whitespace-nowrap">
                                                        <span className="text-xs font-mono font-medium text-[var(--theme-btn-primary)]">{req.phone || req.phoneNo || "N/A"}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center whitespace-nowrap">
                                                        <span className="text-sm font-semibold text-[var(--theme-text-primary)]">{req.roomNo}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center whitespace-nowrap">
                                                        <span className="text-xs font-medium text-[var(--theme-text-secondary)]">{req.leaveDate}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center whitespace-nowrap">
                                                        <span className="text-xs font-medium text-[var(--theme-text-secondary)]">{req.arrivalDate}</span>
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                        <p 
                                                            title={req.reason} 
                                                            onClick={(e) => { e.stopPropagation(); setSelectedReason(req.reason); }}
                                                            className="text-xs font-medium text-[var(--theme-text-secondary)] leading-tight max-w-[150px] truncate cursor-pointer hover:text-[var(--theme-btn-primary)] transition-colors"
                                                        >
                                                            {req.reason && req.reason.length > 35 ? req.reason.substring(0, 35) + "..." : req.reason}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-3 text-right whitespace-nowrap">
                                                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                            {processingIds.has(req.id) ? (
                                                                <div className="px-3 py-2 bg-[var(--theme-bg)] rounded-lg border border-[var(--theme-border)] flex items-center gap-2">
                                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white/80 rounded-full animate-spin"></div>
                                                                    <span className="text-[10px] uppercase tracking-widest text-[var(--theme-text-secondary)] font-semibold">Processing</span>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <button
                                                                        disabled={isBulkProcessing}
                                                                        onClick={() => handleAction(req.id, "Approve")}
                                                                        className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    >
                                                                        <FiCheck size={16} />
                                                                    </button>
                                                                    <button
                                                                        disabled={isBulkProcessing}
                                                                        onClick={() => handleAction(req.id, "Reject")}
                                                                        className="p-2 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500 hover:text-white transition-all border border-rose-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    >
                                                                        <FiX size={16} />
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
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-[var(--theme-border)] bg-[var(--theme-card)]">
                                    <div className="text-xs font-semibold text-[var(--theme-text-secondary)]">
                                        Displaying {filteredRequests.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredRequests.length)} of {filteredRequests.length} Requests
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            className="px-3.5 py-1.5 rounded-lg bg-[var(--theme-bg)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-btn-primary)]/10 hover:text-[var(--theme-text-primary)] disabled:opacity-30 disabled:pointer-events-none transition-all font-bold text-xs tracking-wider flex items-center gap-1"
                                        >
                                            ◀ Previous
                                        </button>
                                        
                                        <span className="px-3 py-1.5 rounded-lg bg-[var(--theme-btn-primary)] text-white font-bold text-xs">
                                            Page {currentPage} of {totalPages || 1}
                                        </span>

                                        <button
                                            disabled={currentPage >= totalPages || totalPages === 0}
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            className="px-3.5 py-1.5 rounded-lg bg-[var(--theme-bg)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-btn-primary)]/10 hover:text-[var(--theme-text-primary)] disabled:opacity-30 disabled:pointer-events-none transition-all font-bold text-xs tracking-wider flex items-center gap-1"
                                        >
                                            Next ▶
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* ── Footer ── */}
            <footer className="px-8 py-4 text-center border-t border-[var(--theme-border)] bg-[var(--theme-header)] backdrop-blur-md">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">
                    <p className="text-xs text-[var(--theme-text-secondary)] tracking-wider uppercase font-semibold">© 2025 Government College of Engineering · Srirangam</p>
                    <div className="flex gap-6">
                        <span className="text-xs text-[var(--theme-text-secondary)] font-semibold tracking-wider uppercase">{deputyDetails ? deputyDetails.label : "Deputy Warden Panel"}</span>
                        <span className="text-xs text-[var(--theme-text-secondary)] font-semibold tracking-wider uppercase">System Stable</span>
                    </div>
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
                            onClick={() => setIsRejectModalOpen(false)}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-xl p-6 shadow-xl overflow-hidden"
                        >
                            <h3 className="text-lg font-bold text-[var(--theme-text-primary)] mb-1.5 flex items-center gap-2">
                                <span className="w-1 h-5 bg-rose-500 rounded-full" />
                                Reason for Rejection <span className="text-rose-500">*</span>
                            </h3>
                            <p className="text-xs text-[var(--theme-text-secondary)] mb-4 font-normal">Please provide a clear reason for rejecting this request.</p>
                            
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Enter rejection reason..."
                                className="w-full h-28 bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-lg p-3 text-xs text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)] focus:outline-none focus:border-[var(--color-danger)]/50 resize-none transition-all"
                            />

                            <div className="flex items-center justify-end gap-3 mt-6">
                                <button
                                    disabled={isRejecting}
                                    onClick={() => !isRejecting && setIsRejectModalOpen(false)}
                                    className="px-4 py-2 rounded-lg font-semibold tracking-wider uppercase text-xs text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={isRejecting}
                                    onClick={handleRejectSubmit}
                                    className="px-4 py-2 rounded-lg font-semibold tracking-wider uppercase text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isRejecting ? (
                                        <div className="w-4 h-4 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin"></div>
                                    ) : null}
                                    {isRejecting ? 'Rejecting...' : 'Reject'}
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
            />

            {/* Reason Modal */}
            <AnimatePresence>
                {selectedReason && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedReason(null)}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md min-h-[320px] flex flex-col bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-2xl overflow-hidden"
                        >
                            <h3 className="text-lg font-bold text-[var(--theme-btn-primary)] mb-2 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-[var(--theme-btn-primary)] rounded-full" />
                                Request Reason
                            </h3>
                            <div className="flex-1 text-sm text-[var(--theme-text-secondary)] leading-relaxed font-normal bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl p-4 max-h-[60vh] overflow-y-auto">
                                {selectedReason}
                            </div>
                            <div className="flex justify-end mt-6">
                                <button
                                    onClick={() => setSelectedReason(null)}
                                    className="px-4 py-2 rounded-xl bg-[var(--theme-btn-primary)] text-white text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default Deputy_warden_side;