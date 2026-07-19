import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    FiUsers, FiCheck, FiX, FiPieChart, FiList, 
    FiCheckSquare, FiSquare, FiTrendingUp, FiArrowRight,
    FiClock, FiBarChart2, FiActivity, FiLogOut, FiSearch
} from "react-icons/fi";
import apiClient from "./api/apiClient";
import { deleteCookie, getCookie } from "./utils/cookieUtils";
import logo from "./assets/1000088399.png";
import ActivityLogModal from "./ActivityLogModal";
import { logout } from "./services/authService";


const handleLogout = () => {
  logout();
};

const YEARS = ["1st", "2nd", "3rd", "4th"];

const YEAR_COLORS = {
    "1st": { accent: "teal",    bg: "bg-teal-500",    text: "text-teal-400",    border: "border-teal-500/20",    glow: "shadow-md",    ring: "bg-teal-500/10"  },
    "2nd": { accent: "blue",    bg: "bg-blue-500",    text: "text-blue-400",    border: "border-blue-500/20",    glow: "shadow-md",    ring: "bg-blue-500/10"  },
    "3rd": { accent: "violet",  bg: "bg-violet-500",  text: "text-violet-400",  border: "border-violet-500/20",  glow: "shadow-md",  ring: "bg-violet-500/10"},
    "4th": { accent: "amber",   bg: "bg-amber-500",   text: "text-amber-400",   border: "border-amber-500/20",   glow: "shadow-md",   ring: "bg-amber-500/10" },
};

function YearStatCard({ year, requests, yearStats }) {
    const c = YEAR_COLORS[year];
    const yearKeyMap = { "1st": "firstYear", "2nd": "secondYear", "3rd": "thirdYear", "4th": "fourthYear" };
    const total = yearStats[yearKeyMap[year]] || 0;
    const pending = requests.filter(r => r.year === year).length;

    return (
        <motion.div
            whileHover={{ y: -2 }}
            className={`bg-[#0f1f38] border ${c.border} rounded-xl p-6 shadow-sm relative overflow-hidden group transition-all duration-200`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className={`px-3 py-1 rounded-lg ${c.ring} border ${c.border}`}>
                    <span className={`text-xs font-semibold tracking-wider uppercase ${c.text}`}>{year} Year</span>
                </div>
                <span className={`text-3xl font-bold ${c.text}`}>{total}</span>
            </div>

            {/* Sub counts */}
            <div className="grid grid-cols-2 gap-2 relative z-10 border-t border-white/5 pt-3">
                {[
                    { label: "Pending",  val: pending,  color: "text-amber-400" },
                    { label: "Total Rec.", val: total, color: "text-emerald-400" },
                ].map(({ label, val, color }) => (
                    <div key={label} className="text-center">
                        <p className={`text-lg font-bold ${color}`}>{val}</p>
                        <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">{label}</p>
                    </div>
                ))}
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
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const controller = new AbortController();
        const fetchSettings = async () => {
            try {
                const res = await apiClient.get("/api/hostelStaff/staff/auto-accept", { signal: controller.signal });
                if (res.data) {
                    setEnabled(res.data.enabled);
                    setFromDate(res.data.fromDate || "");
                    setToDate(res.data.toDate || "");
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
            <div className="bg-[#0f1f38] border border-white/10 rounded-xl p-6 shadow-sm flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-t-teal-500 border-teal-500/20 rounded-full animate-spin mr-3" />
                <span className="text-white/60 text-sm">Loading auto-accept settings...</span>
            </div>
        );
    }

    return (
        <div className="bg-[#0f1f38] border border-white/10 rounded-xl p-6 sm:p-8 shadow-sm relative overflow-hidden group">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <FiClock className="text-teal-400" /> Auto Accept / Auto Forward
                    </h3>
                    <p className="text-white/40 text-xs font-normal mt-1">
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
                <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-xl p-4">
                    <div>
                        <span className="text-sm font-semibold text-white">Enable Auto Accept</span>
                        <p className="text-xs text-white/30 mt-0.5">Toggle this feature ON or OFF.</p>
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
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${saving ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${enabled ? 'bg-teal-500' : 'bg-slate-700'}`}
                    >
                        <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">From Date</label>
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
                            className="w-full bg-[#0a1628] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/80 focus:outline-none focus:border-teal-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">To Date</label>
                        <input
                            type="date"
                            disabled={!enabled || saving}
                            min={fromDate || new Date().toISOString().split('T')[0]}
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="w-full bg-[#0a1628] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/80 focus:outline-none focus:border-teal-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Reason / Description</label>
                    <input
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g. Official Duty / Out of Station / Medical Leave"
                        className="w-full bg-[#0a1628] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-teal-500/50 transition-colors"
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
                        className={`px-6 py-2.5 rounded-xl font-semibold text-xs tracking-wider uppercase transition-colors ${isSaveDisabled ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5' : 'bg-teal-500 text-slate-955 hover:bg-teal-400'}`}
                    >
                        {saving ? "Saving..." : "Save Settings"}
                    </button>
                </div>
            </form>
        </div>
    );
}

function Deputy_warden_side() {
    const username = getCookie('staffUsername');
    const deputyDetails = getDeputyDetails(username);
    const deputyYearLabel = deputyDetails ? (deputyDetails.year === 1 ? "1st" : deputyDetails.year === 2 ? "2nd" : deputyDetails.year === 3 ? "3rd" : "4th") : "all";

    const [view, setView]               = useState("dashboard");
    const [selectedYear, setSelectedYear] = useState(deputyYearLabel);
    const [requests, setRequests]       = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [isLoading, setIsLoading]     = useState(true);
    const [search, setSearch]           = useState("");

    // Pagination & Expand Reason Modal States
    const [currentPage, setCurrentPage]   = useState(1);
    const itemsPerPage                    = 15;
    const [selectedReason, setSelectedReason] = useState(null);

    // Reset pagination on search change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, selectedYear]);

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
        if (processingIds.has(id) || isBulkProcessing) return; // Prevent duplicate clicks

        // Normalize action to 'Approve' or 'Reject' for backend
        const action = actionType === "Approve" || actionType === "accepted" ? "Approve" : "Reject";
        
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
            await apiClient.patch(`/api/hostelStaff/staff/deputyWarden/${id}?action=${action}`);
            // Refresh data after action
            await refreshData();
        } catch (err) {
            alert("Failed to update status.");
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
        if (isRejecting) return;

        if (!rejectReason.trim()) {
            alert("Please enter a reason for rejection.");
            return;
        }

        setIsRejecting(true);
        try {
            if (isBulkReject) {
                const res = await apiClient.patch(`/api/hostelStaff/staff/deputyWarden/bulk-reject`, {
                    formIds: selectedIds,
                    rejectReason
                });
                alert(`Bulk Reject Summary:\nSelected: ${res.data.selected}\nRejected: ${res.data.rejected}\nFailed: ${res.data.failed}`);
                setSelectedIds([]);
            } else {
                await apiClient.patch(`/api/hostelStaff/staff/deputyWarden/${rejectFormId}/reject`, { rejectReason });
            }
            setIsRejectModalOpen(false);
            setRejectFormId(null);
            setIsBulkReject(false);
            setRejectReason("");
            await refreshData();
        } catch (err) {
            alert("Failed to reject request.");
        } finally {
            setIsRejecting(false); // Enable retry on failure
        }
    };

    const handleBulkAction = async (newStatus) => {
        if (selectedIds.length === 0 || isBulkProcessing) return;

        setIsBulkProcessing(true);
        const action = newStatus === "accepted" ? "Approve" : "Reject";
        try {
            await apiClient.patch(`/api/hostelStaff/staff/deputyWarden/bulk?action=${action}`, selectedIds);
            setSelectedIds([]);
            // Refresh data after action
            await refreshData();
        } catch (err) {
            alert("Failed to perform bulk action.");
        } finally {
            setIsBulkProcessing(false); // Enable retry on failure
        }
    };

    const filteredRequests = requests
        .filter(r => selectedYear === "all" ? true : r.year === selectedYear)
        .filter(r => {
            const q = search.trim().toLowerCase();
            if (!q) return true;
            const nameMatch = r.name?.toLowerCase().includes(q);
            const regNoMatch = r.registerNo?.toLowerCase().includes(q);
            return nameMatch || regNoMatch;
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
            <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
                    <p className="text-teal-400 font-black tracking-widest uppercase text-sm">Loading requests...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex flex-col font-sans bg-[#0a1628] text-white">
            <div className="fixed inset-0 bg-[#0a1628] -z-10" />

            {/* ── Header ── */}
            <header className="w-full flex flex-col lg:flex-row lg:items-center lg:justify-between px-6 py-4 border-b border-white/10 bg-[#0a1628]/80 backdrop-blur-md sticky top-0 z-50 gap-4">
                <div className="flex items-center gap-4 justify-between w-full lg:w-auto">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-teal-500/10 rounded-xl border border-teal-500/20">
                            <img src={logo} alt="GCES Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
                        </div>
                        <div className="flex flex-col leading-tight">
                            <span className="text-[10px] font-semibold tracking-wider text-teal-400/80 uppercase">{deputyDetails ? deputyDetails.label : "Deputy Warden Panel"}</span>
                            <span className="text-xl font-bold text-white tracking-normal uppercase">Mess Reduction</span>
                        </div>
                    </div>
                </div>

                {/* View Toggle */}
                <div className="flex w-full lg:w-auto bg-[#0f1f38] p-1 rounded-xl border border-white/10 shadow-sm overflow-x-auto [&::-webkit-scrollbar]:hidden">
                    <button onClick={() => setView("dashboard")} className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all duration-200 whitespace-nowrap ${view === "dashboard" ? "bg-teal-500 text-slate-950 shadow-sm" : "text-white/40 hover:text-white"}`}>
                        <FiBarChart2 size={14} /> Dashboard
                    </button>
                    <button onClick={() => setView("requests")} className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all duration-200 whitespace-nowrap ${view === "requests" ? "bg-teal-500 text-slate-950 shadow-sm" : "text-white/40 hover:text-white"}`}>
                        <FiList size={14} /> Requests
                    </button>
                </div>

                {/* Logout Button */}
                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <button
                        onClick={handleLogout}
                        className="w-full lg:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all text-xs font-semibold tracking-wider uppercase"
                    >
                        <FiLogOut size={14} /> Logout
                    </button>
                </div>
            </header>

            {/* ── Main Content ── */}
            <main className="flex-1 p-4 sm:p-8 lg:p-12">
                <AnimatePresence mode="wait">
                    {/* ════ DASHBOARD VIEW ════ */}
                    {view === "dashboard" && (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, y: -30, filter: "blur(10px)" }}
                            transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                            className="max-w-7xl mx-auto space-y-10"
                        >
                            {/* Section heading */}
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                                    <div className="w-1 h-5 bg-teal-500 rounded-full" />
                                    Submission Overview
                                </h2>
                                <p className="text-white/40 text-xs sm:text-sm font-normal ml-3 mt-0.5">
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
                                <div className="lg:col-span-2 bg-[#0f1f38] border border-white/10 rounded-xl p-6 sm:p-8 shadow-sm relative overflow-hidden group">
                                    <h3 className="text-lg font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
                                        <FiTrendingUp className="text-teal-400" /> Overall Status Tracking
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
                                                className={`p-5 rounded-xl ${s.bg} border ${s.border} ${s.action ? 'cursor-pointer hover:bg-white/[0.02] transition-colors' : ''}`}
                                            >
                                                <p className="text-xs text-white/40 uppercase font-semibold tracking-wider mb-1.5">{s.label}</p>
                                                <p className={`text-3xl sm:text-4xl font-bold ${s.color}`}>{s.count}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
 
                                 {/* Total Forms */}
                                 <div className="bg-[#0f1f38] border border-white/10 rounded-xl p-6 sm:p-8 flex flex-col justify-between shadow-sm">
                                     <div>
                                         <h3 className="text-lg font-bold text-white mb-1">Total Forms</h3>
                                         <p className="text-white/40 text-xs font-normal">Cumulative submissions received.</p>
                                     </div>
                                     <p className="text-4xl sm:text-5xl font-bold text-white mt-4">
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
                                         className="mt-6 flex items-center justify-center gap-2 w-full bg-white text-[#0a1628] py-3 rounded-xl font-semibold text-xs tracking-wider uppercase hover:bg-teal-400 transition-colors"
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
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 px-1">
                                <div>
                                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                                        <div className="w-1 h-5 bg-teal-500 rounded-full" />
                                        Pending Requests - Deputy Review
                                    </h2>
                                    <p className="text-xs text-white/40 mt-0.5">Forms awaiting deputy warden approval</p>
                                </div>
                            </div>

                            {/* Search Box */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                    <FiSearch size={15} className="text-white/30" />
                                </div>
                                <input
                                    id="deputy-search"
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by Student Name or Register Number"
                                    className="w-full bg-[#0f1f38] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white/80 placeholder:text-white/25 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all"
                                />
                                {search && (
                                    <button
                                        onClick={() => setSearch("")}
                                        className="absolute inset-y-0 right-4 flex items-center text-white/30 hover:text-white/60 transition-colors text-xs font-semibold"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>

                            <AnimatePresence>
                                {selectedIds.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="relative z-20 shadow-2xl sm:shadow-none bg-[#0f1f38]/95 sm:bg-emerald-500/10 backdrop-blur-xl sm:backdrop-blur-none border border-emerald-500/30 sm:border-emerald-500/20 rounded-2xl sm:rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-4"
                                    >
                                        <span className="text-emerald-400 font-bold text-xs sm:text-sm tracking-wider uppercase text-center sm:text-left">
                                            {selectedIds.length} Form{selectedIds.length > 1 ? 's' : ''} Selected
                                        </span>
                                        <div className="flex items-center gap-3 w-full sm:w-auto">
                                            <button
                                                onClick={() => handleBulkAction("accepted")}
                                                disabled={isBulkProcessing}
                                                className="flex items-center justify-center gap-1.5 px-4 py-2 sm:py-2.5 bg-emerald-500 text-slate-950 rounded-xl text-xs font-bold tracking-wider uppercase hover:bg-emerald-400 transition-colors shadow-glow sm:shadow-sm flex-1 sm:flex-none disabled:opacity-70 disabled:cursor-not-allowed"
                                            >
                                                {isBulkProcessing ? (
                                                    <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></div>
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
                            <div className="bg-[#0f1f38] border border-white/10 rounded-xl overflow-hidden shadow-sm">
                                
                                {/* 💻 TABLE VIEW */}
                                <div 
                                    className="overflow-x-auto max-h-[600px] overflow-y-auto"
                                    style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}
                                >
                                    <table 
                                        className="w-full text-left border-collapse"
                                        style={{ minWidth: 'max-content', whiteSpace: 'nowrap' }}
                                    >
                                        <thead className="sticky top-0 bg-[#0f1f38] z-10">
                                            <tr className="bg-white/[0.02] text-xs uppercase tracking-wider font-semibold border-b border-white/10">
                                                <th className="px-6 py-4 text-white/40 w-16 text-center">
                                                    <button 
                                                        disabled={isBulkProcessing || processingIds.size > 0} 
                                                        onClick={toggleSelectAll} 
                                                        className="text-white/40 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {paginatedForms.length > 0 && paginatedForms.every(r => selectedIds.includes(r.id)) ? <FiCheckSquare size={16} /> : <FiSquare size={16} />}
                                                    </button>
                                                </th>
                                                <th className="px-6 py-4 text-white/40">Student Name</th>
                                                <th className="px-4 py-4 text-white/40 text-center">Department</th>
                                                <th className="px-4 py-4 text-white/40 text-center">Room No</th>
                                                <th className="px-4 py-4 text-white/40 text-center">Leave Date</th>
                                                <th className="px-4 py-4 text-white/40 text-center">Arrival Date</th>
                                                <th className="px-4 py-4 text-white/40">Reason</th>
                                                <th className="px-6 py-4 text-white/40 text-right w-40">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/[0.03]">
                                            {paginatedForms.length === 0 ? (
                                                <tr>
                                                    <td colSpan="8" className="px-6 py-24 text-center">
                                                        <div className="flex flex-col items-center justify-center gap-3">
                                                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-white/20 mb-2">
                                                                <FiList size={32} />
                                                            </div>
                                                            <h3 className="text-white text-xl font-bold tracking-tight">No records found</h3>
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
                                                    className={`hover:bg-white/[0.02] transition-colors border-b border-white/[0.03] cursor-pointer ${selectedIds.includes(req.id) ? 'bg-white/[0.01]' : ''} ${processingIds.has(req.id) || isBulkProcessing ? 'opacity-50 pointer-events-none' : ''}`}
                                                >
                                                    <td className="px-6 py-4 text-center">
                                                        <div className={`w-5 h-5 mx-auto rounded flex items-center justify-center border transition-colors ${selectedIds.includes(req.id) ? 'bg-teal-500 border-teal-400 text-slate-900' : 'bg-white/5 border-white/20 text-transparent'}`}>
                                                            <FiCheck size={12} strokeWidth={4} />
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-4 max-w-[150px]">
                                                            <p className="text-sm font-semibold text-white group-hover:text-teal-400 transition-colors truncate">{req.name}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-center whitespace-nowrap">
                                                        <span className="px-2.5 py-1 bg-white/5 rounded-md text-xs font-semibold text-white/50 border border-white/5 tracking-wider block truncate max-w-[120px]">{req.dept}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center whitespace-nowrap">
                                                        <span className="text-sm font-semibold text-white/80">{req.roomNo}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center whitespace-nowrap">
                                                        <span className="text-xs font-medium text-white/50">{req.leaveDate}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center whitespace-nowrap">
                                                        <span className="text-xs font-medium text-white/50">{req.arrivalDate}</span>
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                        <p 
                                                            title={req.reason} 
                                                            onClick={(e) => { e.stopPropagation(); setSelectedReason(req.reason); }}
                                                            className="text-xs font-medium text-white/40 leading-tight max-w-[150px] truncate cursor-pointer hover:text-white transition-colors"
                                                        >
                                                            {req.reason && req.reason.length > 35 ? req.reason.substring(0, 35) + "..." : req.reason}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-3 text-right whitespace-nowrap">
                                                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                            {processingIds.has(req.id) ? (
                                                                <div className="px-3 py-2 bg-white/5 rounded-lg border border-white/10 flex items-center gap-2">
                                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white/80 rounded-full animate-spin"></div>
                                                                    <span className="text-[10px] uppercase tracking-widest text-white/60 font-semibold">Processing</span>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <button
                                                                        disabled={isBulkProcessing}
                                                                        onClick={() => handleAction(req.id, "Approve")}
                                                                        className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500 hover:text-slate-950 transition-all border border-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                {totalPages > 1 && (
                                    <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-t border-white/5 bg-white/[0.01]">
                                        <button
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            className="px-3 py-1.5 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all font-bold uppercase text-xs tracking-widest"
                                        >
                                            Previous
                                        </button>
                                        
                                        <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] sm:max-w-md [&::-webkit-scrollbar]:hidden">
                                            {Array.from({ length: totalPages }, (_, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setCurrentPage(idx + 1)}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                                                    style={currentPage === idx + 1 ? { backgroundColor: '#14b8a6', color: '#0f1f38' } : {}}
                                                >
                                                    {idx + 1}
                                                </button>
                                            ))}
                                        </div>

                                        <button
                                            disabled={currentPage === totalPages}
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            className="px-3 py-1.5 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all font-bold uppercase text-xs tracking-widest"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* ── Footer ── */}
            <footer className="px-8 py-4 text-center border-t border-white/5 bg-[#0a1628]/80 backdrop-blur-md">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">
                    <p className="text-xs text-white/20 tracking-wider uppercase font-semibold">© 2025 Government College of Engineering · Srirangam</p>
                    <div className="flex gap-6">
                        <span className="text-xs text-teal-400/35 font-semibold tracking-wider uppercase">{deputyDetails ? deputyDetails.label : "Deputy Warden Panel"}</span>
                        <span className="text-xs text-teal-400/35 font-semibold tracking-wider uppercase">System Stable</span>
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
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-[#0f1f38] border border-white/10 rounded-xl p-6 shadow-xl overflow-hidden"
                        >
                            <h3 className="text-lg font-bold text-white mb-1.5 flex items-center gap-2">
                                <span className="w-1 h-5 bg-rose-500 rounded-full" />
                                Reason for Rejection <span className="text-rose-500">*</span>
                            </h3>
                            <p className="text-xs text-white/40 mb-4 font-normal">Please provide a clear reason for rejecting this request.</p>
                            
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Enter rejection reason..."
                                className="w-full h-28 bg-black/20 border border-white/15 rounded-lg p-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-rose-500/50 resize-none transition-all"
                            />

                            <div className="flex items-center justify-end gap-3 mt-6">
                                <button
                                    disabled={isRejecting}
                                    onClick={() => !isRejecting && setIsRejectModalOpen(false)}
                                    className="px-4 py-2 rounded-lg font-semibold tracking-wider uppercase text-xs text-white/40 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md min-h-[320px] flex flex-col bg-[#0f1f38] border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden"
                        >
                            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2 text-teal-400">
                                <span className="w-1.5 h-5 bg-teal-500 rounded-full" />
                                Request Reason
                            </h3>
                            <div className="flex-1 text-sm text-white/70 leading-relaxed font-normal bg-black/20 border border-white/10 rounded-xl p-4 max-h-[60vh] overflow-y-auto">
                                {selectedReason}
                            </div>
                            <div className="flex justify-end mt-6">
                                <button
                                    onClick={() => setSelectedReason(null)}
                                    className="px-4 py-2 rounded-xl bg-teal-500 text-slate-950 text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all"
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