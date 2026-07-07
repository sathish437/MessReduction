import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    FiCheckCircle, FiClock, FiFileText, FiFilter, FiLogOut,
    FiShield, FiTrendingUp, FiArrowRight, FiCalendar, FiMapPin, FiUsers,
    FiCheck, FiX, FiHash, FiCheckSquare, FiSquare, FiSearch
} from "react-icons/fi";
import apiClient from "./api/apiClient";
import { deleteCookie, getCookie } from "./utils/cookieUtils";
import logo from './assets/1000088399.png';
import ActivityLogModal from "./ActivityLogModal";

const handleLogout = () => {
  deleteCookie('staffToken');
  deleteCookie('staffUsername');
  deleteCookie('staffRole');
  window.location.href = '/staff-login';
};

const YEARS = ["1st", "2nd", "3rd", "4th"];

const YEAR_THEME = {
    "1st": { color: "teal",   active: "bg-teal-500",  text: "text-teal-400",  border: "border-teal-500/20",  ring: "bg-teal-500/10",   glow: "shadow-md"  },
    "2nd": { color: "blue",   active: "bg-blue-500",  text: "text-blue-400",  border: "border-blue-500/20",  ring: "bg-blue-500/10",   glow: "shadow-md"  },
    "3rd": { color: "violet", active: "bg-violet-500",text: "text-violet-400",border: "border-violet-500/20",ring: "bg-violet-500/10", glow: "shadow-md"},
    "4th": { color: "amber",  active: "bg-amber-500", text: "text-amber-400", border: "border-amber-500/20", ring: "bg-amber-500/10",  glow: "shadow-md" },
};

/* ── Year Selection Screen ── */
function YearSelectScreen({ onSelect }) {
    return (
        <div className="min-h-screen w-full bg-[#0a1628] flex flex-col items-center justify-center font-sans text-white px-6">
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
                        <p className="text-xs font-semibold tracking-wider text-teal-400/80 uppercase mb-1.5">Authority Panel</p>
                        <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-wide uppercase px-2">Chief Warden</h1>
                        <p className="text-sm sm:text-base text-white/40 font-medium mt-2">Select your year assignment to continue</p>
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
                                className={`group relative bg-[#0f1f38] ${t.border} border rounded-2xl p-6 flex flex-col items-start gap-4 text-left overflow-hidden hover:bg-white/[0.02] shadow-sm transition-all duration-200`}
                            >
                                <div className={`w-10 h-10 rounded-xl ${t.ring} border ${t.border} flex items-center justify-center`}>
                                    <FiUsers className={t.text} size={18} />
                                </div>
                                <div>
                                    <p className={`text-xs font-semibold tracking-wider uppercase ${t.text} mb-1`}>Year {i + 1}</p>
                                    <h3 className="text-2xl font-bold text-white">{yr}</h3>
                                    <p className="text-sm text-white/40 font-medium mt-0.5">Warden Panel</p>
                                </div>
                                <div className={`flex items-center gap-1.5 ${t.text} text-xs font-semibold uppercase tracking-wider mt-auto`}>
                                    Enter <FiArrowRight size={14} />
                                </div>
                            </motion.button>
                        );
                    })}
                </div>

                 <p className="text-sm text-white/15 tracking-widest uppercase">© 2025 GCES · Mess Reduction Portal</p>
            </motion.div>
        </div>
    );
}

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
        const fetchSettings = async () => {
            try {
                const res = await apiClient.get("/api/hostelStaff/staff/auto-accept");
                if (res.data) {
                    setEnabled(res.data.enabled);
                    setFromDate(res.data.fromDate || "");
                    setToDate(res.data.toDate || "");
                    setReason(res.data.reason || "");
                }
            } catch (err) {
                console.error("Error fetching auto-accept settings:", err);
                setError("Failed to load auto-accept settings");
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
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
            console.error("Error saving auto-accept settings:", err);
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
                        onClick={() => setEnabled(!enabled)}
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
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="w-full bg-[#0a1628] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/80 focus:outline-none focus:border-teal-500/50 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">To Date</label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="w-full bg-[#0a1628] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/80 focus:outline-none focus:border-teal-500/50 transition-colors"
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

/* ── Main Warden Panel ── */
const Warden = () => {
    const [requests, setRequests]         = useState([]);
    const [counts, setCounts]             = useState(null);
    const [loading, setLoading]           = useState(true);
    const [view, setView]                 = useState("dashboard"); // 'dashboard' | 'requests'
    const [selectedIds, setSelectedIds]   = useState([]);

    // Filter State
    const [genderFilter, setGenderFilter] = useState("ALL");
    const [selectedYear, setSelectedYear] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    // Processing State for Action Locking
    const [processingIds, setProcessingIds] = useState(new Set());
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);

    // Rejection Modal State
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectFormId, setRejectFormId] = useState(null);
    const [rejectReason, setRejectReason] = useState("");
    const [isBulkReject, setIsBulkReject] = useState(false);

    // Activity Log Modal State
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [logActionType, setLogActionType] = useState("Approved");
    const [logActionTitle, setLogActionTitle] = useState("Accepted");

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        fetchData();
    }, [genderFilter, selectedYear]);

    const fetchData = async () => {
        setLoading(true);
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

            // Fetch warden-specific dashboard counts (filtered by year)
            const countsRes = await apiClient.get(`/api/hostelStaff/staff/dashboard-count/warden?userName=${username}`);
            setCounts(countsRes.data);

            // Fetch warden pending forms with filter parameters
            const formsRes = await apiClient.get(`/api/hostelStaff/staff/warden?${queryParams}`);

            // Backend returns array (may be empty) - map to frontend format
            const data = Array.isArray(formsRes.data) ? formsRes.data.map(r => ({
                ...r,
                id: r.formId,
                dept: r.department,
                status: r.currentStatus || "PendingWarden"
            })) : [];
            setRequests(data);
        } catch (err) {
            // Any error (including 404) - treat as empty
            setRequests([]);
            setCounts({ pendingWarden: 0, pendingDeputyWarden: 0, pendingOffice: 0, approved: 0, rejectedWarden: 0, rejectedDeputyWarden: 0, rejectedOffice: 0 });
            console.error("Error fetching warden data:", err);
        } finally {
            setLoading(false);
        }
    };
    const handleAction = async (formId, action) => {
        if (processingIds.has(formId) || isBulkProcessing) return; // Prevent duplicate clicks

        if (action === "Reject") {
            setRejectFormId(formId);
            setRejectReason("");
            setIsBulkReject(false);
            setIsRejectModalOpen(true);
            return;
        }

        // Add to processing set
        setProcessingIds(prev => {
            const newSet = new Set(prev);
            newSet.add(formId);
            return newSet;
        });

        // Check token before making request
        const token = getCookie('staffToken') || sessionStorage.getItem('staffToken') || localStorage.getItem('staffToken');
        if (!token) {
            alert("Authentication token not found. Please login again.");
            handleLogout();
            return;
        }

        try {
            await apiClient.patch(`/api/hostelStaff/staff/warden/${formId}?action=${action}`);
            // Refresh data after action
            await fetchData();
            // Note: Not removing from processingIds on success so it stays locked until row is gone
        } catch (err) {
            console.error("Warden action error:", err);
            if (err.response?.status === 401) {
                alert("Session expired. Please login again.");
                handleLogout();
            } else {
                alert("Failed to update status.");
            }
            // Remove from processing set on failure to allow retry
            setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(formId);
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

        // Check token before making request
        const token = getCookie('staffToken') || sessionStorage.getItem('staffToken') || localStorage.getItem('staffToken');
        if (!token) {
            alert("Authentication token not found. Please login again.");
            handleLogout();
            return;
        }

        try {
            if (isBulkReject) {
                const res = await apiClient.patch(`/api/hostelStaff/staff/warden/bulk-reject`, {
                    formIds: selectedIds,
                    rejectReason
                });
                alert(`Bulk Reject Summary:\nSelected: ${res.data.selected}\nRejected: ${res.data.rejected}\nFailed: ${res.data.failed}`);
                setSelectedIds([]);
            } else {
                await apiClient.patch(`/api/hostelStaff/staff/warden/${rejectFormId}/reject`, { rejectReason });
            }
            setIsRejectModalOpen(false);
            setRejectFormId(null);
            setIsBulkReject(false);
            setRejectReason("");
            await fetchData();
        } catch (err) {
            console.error("Warden reject error:", err);
            if (err.response?.status === 401) {
                alert("Session expired. Please login again.");
                handleLogout();
            } else {
                alert("Failed to reject request.");
            }
        } finally {
            setIsRejecting(false); // Enable retry on failure
        }
    };

    const handleBulkAction = async () => {
        if (selectedIds.length === 0 || isBulkProcessing) return;

        setIsBulkProcessing(true);

        // Check token before making request
        const token = getCookie('staffToken') || sessionStorage.getItem('staffToken') || localStorage.getItem('staffToken');
        if (!token) {
            alert("Authentication token not found. Please login again.");
            handleLogout();
            return;
        }

        try {
            await apiClient.patch(`/api/hostelStaff/staff/warden/bulk?action=Approve`, selectedIds);
            setSelectedIds([]);
            await fetchData();
        } catch (err) {
            console.error("Bulk action error:", err);
            if (err.response?.status === 401) {
                alert("Session expired. Please login again.");
                handleLogout();
            } else if (err.response?.status === 409) {
                alert("Some selected forms are not in the correct status for approval. Please refresh and try again.");
                await fetchData();
            } else {
                alert("Failed to perform bulk approval.");
            }
            setIsBulkProcessing(false); // Enable retry on failure
        }
    };

    const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

    const toggleSelectAll = () => {
        const pendingIds = requests.map(r => r.id);
        setSelectedIds(selectedIds.length === pendingIds.length && pendingIds.length > 0 ? [] : pendingIds);
    };

    const t = { color: "teal", active: "bg-teal-500", text: "text-teal-400", border: "border-teal-500/20", ring: "bg-teal-500/10", glow: "shadow-sm" };

    // Apply client-side search on top of backend-filtered results
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const pendingForms = requests.filter(r => {
        if (!normalizedSearch) return true;
        const nameMatch = r.name?.toLowerCase().includes(normalizedSearch);
        const regNoMatch = r.registerNo?.toLowerCase().includes(normalizedSearch);
        return nameMatch || regNoMatch;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-t-teal-500 border-teal-500/20 rounded-full animate-spin" />
                     <p className="text-teal-400 font-black tracking-widest uppercase text-base">Loading Warden Data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-[#0a1628] text-white font-sans selection:bg-teal-500/30">
            {/* ── Header ── */}
            <header className="w-full flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0a1628]/80 backdrop-blur-md sticky top-0 z-50 gap-4 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-4">
                    <div className={`p-2 ${t.ring} rounded-xl border ${t.border}`}>
                        <img src={logo} alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
                    </div>
                     <div className="flex flex-col">
                        <span className={`text-[10px] font-semibold tracking-wider ${t.text} uppercase`}>Authority Panel</span>
                        <span className="text-xl font-bold text-white tracking-normal uppercase">Chief Warden</span>
                    </div>
                </div>

                {/* Main View Toggle */}
                <div className="flex bg-[#0f1f38] p-1 rounded-xl border border-white/10 shadow-sm overflow-x-auto max-w-full [&::-webkit-scrollbar]:hidden">
                    <button
                        onClick={() => setView("dashboard")}
                        className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all duration-200 whitespace-nowrap ${view === "dashboard" ? `${t.active} text-slate-950 shadow-sm` : "text-white/40 hover:text-white"}`}
                    >
                        <FiTrendingUp size={14} /> Dashboard
                    </button>
                    <button
                        onClick={() => setView("requests")}
                        className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all duration-200 whitespace-nowrap ${view === "requests" ? `${t.active} text-slate-950 shadow-sm` : "text-white/40 hover:text-white"}`}
                    >
                        <FiFileText size={14} /> Requests
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    {/* Active session badge */}
                    <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 ${t.ring} border ${t.border} rounded-lg`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${t.active}`} />
                         <span className={`text-xs font-semibold uppercase tracking-wider ${t.text}`}>Active Session</span>
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all text-xs font-semibold uppercase tracking-wider"
                    >
                        <FiLogOut size={14} /> Logout
                    </button>
                </div>
            </header>

            {/* ── Main content ── */}
            <main className="max-w-7xl mx-auto p-6 sm:p-10 lg:p-16">
                <AnimatePresence mode="wait">
                    {view === "dashboard" ? (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-12"
                        >
                            {/* ── Stats Row ── */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Pending Requests */}
                                <div className={`bg-[#0f1f38] border ${t.border} rounded-xl p-6 flex flex-col justify-between shadow-sm`}>
                                    <div>
                                        <p className="text-xs text-white/40 uppercase font-semibold tracking-wider mb-2">Pending Requests</p>
                                        <p className="text-3xl font-bold text-white">{counts?.pendingWarden || 0}</p>
                                    </div>
                                    <div className={`mt-4 px-2.5 py-1 ${t.ring} border ${t.border} rounded-lg text-xs font-semibold ${t.text} uppercase inline-block w-fit`}>Need Action</div>
                                </div>

                                {/* Accepted Requests (Warden approved -> PendingOffice) */}
                                <div 
                                    onClick={() => { setLogActionType("Approved"); setLogActionTitle("Warden Approved"); setIsLogModalOpen(true); }}
                                    className="bg-[#0f1f38] border border-emerald-500/20 rounded-xl p-6 flex flex-col justify-between cursor-pointer hover:bg-white/[0.01] transition-colors hover:border-emerald-500/40 shadow-sm"
                                >
                                    <div>
                                        <p className="text-xs text-emerald-400/70 uppercase font-semibold tracking-wider mb-2">Accepted Requests</p>
                                        <p className="text-3xl font-bold text-emerald-400">{counts?.pendingOffice || 0}</p>
                                    </div>
                                    <div className="mt-4 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs font-semibold text-emerald-400 uppercase inline-block w-fit">Warden Approved</div>
                                </div>

                                {/* Rejected Requests */}
                                <div 
                                    onClick={() => { setLogActionType("Rejected"); setLogActionTitle("Warden Rejected"); setIsLogModalOpen(true); }}
                                    className="bg-[#0f1f38] border border-rose-500/20 rounded-xl p-6 flex flex-col justify-between cursor-pointer hover:bg-white/[0.01] transition-colors hover:border-rose-500/40 shadow-sm"
                                >
                                    <div>
                                        <p className="text-xs text-rose-400/70 uppercase font-semibold tracking-wider mb-2">Rejected Requests</p>
                                        <p className="text-3xl font-bold text-rose-400">{counts?.rejectedWarden || 0}</p>
                                    </div>
                                    <div className="mt-4 px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs font-semibold text-rose-400 uppercase inline-block w-fit">Warden Rejected</div>
                                </div>
                            </div>

                                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-[#0f1f38] border border-white/10 rounded-xl p-8 flex flex-col justify-center shadow-sm">
                                    <h3 className="text-xl font-bold text-white mb-3">Warden Protocol</h3>
                                    <p className="text-sm text-white/50 leading-relaxed font-normal">
                                        Review requests pre-approved by Deputy Wardens. Your digital signature finalizes the reduction for the Hostel Office records.
                                    </p>
                                    <div className="mt-6 flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg ${t.ring} flex items-center justify-center`}>
                                            <FiShield className={t.text} size={18} />
                                        </div>
                                        <span className="text-xs font-semibold text-white/30 uppercase tracking-wider">Verified Secure Portal</span>
                                    </div>
                                </div>

                                <div className="bg-[#0f1f38] border border-white/10 rounded-xl p-8 flex flex-col justify-between shadow-sm">
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-2">Review Requests</h3>
                                        <p className="text-sm text-white/50 font-normal">Navigate to the requests table to process forms.</p>
                                    </div>
                                    <button
                                        onClick={() => setView("requests")}
                                        className={`mt-6 flex items-center justify-center gap-2 w-full ${t.active} text-slate-950 py-3.5 rounded-xl font-semibold text-sm tracking-wider uppercase hover:bg-teal-400 transition-colors shadow-sm`}
                                    >
                                        Process Forms <FiArrowRight />
                                    </button>
                                </div>
                            </div>

                            {/* ── Auto Accept Settings ── */}
                            <AutoAcceptSettingsCard />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="requests"
                            className="space-y-6"
                        >
                            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 px-1">
                                <div>
                                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                                        <FiFileText className={t.text} />
                                        Pending Requests
                                    </h2>
                                    <p className="text-xs text-white/40 mt-0.5">Leave reduction forms awaiting your review</p>
                                </div>

                                {/* Filter Controls */}
                                <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full md:w-auto">
                                    {/* Gender Filter */}
                                    <select
                                        value={genderFilter}
                                        onChange={(e) => setGenderFilter(e.target.value)}
                                        className="w-full sm:w-auto bg-[#0f1f38] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-white/60 focus:outline-none focus:border-teal-500/55 cursor-pointer order-1 sm:order-2"
                                    >
                                        <option value="ALL">Gender: All</option>
                                        <option value="MALE">Male</option>
                                        <option value="FEMALE">Female</option>
                                    </select>

                                    {/* Year Tabs */}
                                    <div className="flex items-center gap-1 bg-[#112240] p-1 rounded-xl border border-white/10 overflow-x-auto w-full md:w-auto justify-between sm:justify-start [&::-webkit-scrollbar]:hidden order-2 sm:order-1">
                                        {["all", ...YEARS].map(yr => (
                                            <button
                                                key={yr}
                                                onClick={() => setSelectedYear(yr)}
                                                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap text-center ${
                                                    selectedYear === yr
                                                        ? yr === "all" ? "bg-white text-slate-950 shadow-sm"
                                                            : `${YEAR_THEME[yr]?.active ?? ""} text-slate-950 shadow-sm`
                                                        : "text-white/40 hover:text-white"
                                                }`}
                                            >
                                                {yr === "all" ? "All" : yr}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Search Box */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                    <FiSearch size={15} className="text-white/30" />
                                </div>
                                <input
                                    id="warden-search"
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by Student Name or Register Number"
                                    className="w-full bg-[#0f1f38] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white/80 placeholder:text-white/25 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute inset-y-0 right-4 flex items-center text-white/30 hover:text-white/60 transition-colors text-xs font-semibold"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>

                            <AnimatePresence>
                                {selectedIds.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                        className="fixed bottom-6 left-4 right-4 z-[60] sm:static sm:z-auto shadow-2xl sm:shadow-none bg-[#0f1f38]/95 sm:bg-emerald-500/10 backdrop-blur-xl sm:backdrop-blur-none border border-emerald-500/30 sm:border-emerald-500/20 rounded-2xl sm:rounded-xl p-4 flex flex-row items-center justify-between gap-4"
                                    >
                                        <span className="text-emerald-400 font-bold text-xs sm:text-sm tracking-wider uppercase">
                                            {selectedIds.length} Form{selectedIds.length > 1 ? 's' : ''} Selected
                                        </span>
                                        <button
                                            onClick={handleBulkAction}
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
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Requests Table (Desktop) & Cards (Mobile) */}
                            <div className="bg-[#0f1f38] border border-white/10 rounded-xl overflow-hidden shadow-sm">
                                
                                {/* 📱 MOBILE CARDS VIEW */}
                                <div className="block md:hidden p-4 space-y-4">
                                    {pendingForms.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 px-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-white/20 mb-4">
                                                <FiFilter size={30} />
                                            </div>
                                            <h3 className="text-white text-lg font-bold mb-1">All Caught Up!</h3>
                                            <p className="text-white/40 text-center text-xs">No pending requests for warden review.</p>
                                        </div>
                                    ) : (
                                        pendingForms.map((req, idx) => (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.04 }}
                                                key={`mob-${req.id}`}
                                                onClick={() => toggleSelect(req.id)}
                                                className={`flex flex-col gap-3 p-4 rounded-2xl border transition-colors cursor-pointer ${selectedIds.includes(req.id) ? `bg-${t.color}-500/10 border-${t.color}-500/30 shadow-glow` : 'bg-white/[0.02] border-white/10 hover:border-white/20'}`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${selectedIds.includes(req.id) ? `bg-${t.color}-500 border-${t.color}-400 text-slate-900` : 'bg-white/5 border-white/20 text-transparent'}`}>
                                                                <FiCheck size={12} strokeWidth={4} />
                                                            </div>
                                                            <h4 className="text-base font-bold text-white leading-tight">{req.name}</h4>
                                                        </div>
                                                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-white/60 ml-7">
                                                            {req.dept} • Year {req.year === 1 ? "1st" : req.year === 2 ? "2nd" : req.year === 3 ? "3rd" : "4th"} • Room {req.roomNo}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-2 mt-2">
                                                    <div className="bg-[#0a1628] rounded-xl p-3 border border-white/5">
                                                        <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-1">Leave</p>
                                                        <p className="text-sm font-semibold text-white/80">{req.leaveDate}</p>
                                                    </div>
                                                    <div className="bg-[#0a1628] rounded-xl p-3 border border-white/5">
                                                        <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-1">Arrival</p>
                                                        <p className="text-sm font-semibold text-white/80">{req.arrivalDate}</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="mt-1">
                                                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-1">Reason</p>
                                                    <p className="text-xs text-white/60 line-clamp-2">{req.reason}</p>
                                                </div>

                                                <div className="flex gap-2 mt-2 pt-4 border-t border-white/10" onClick={(e) => e.stopPropagation()}>
                                                    <button 
                                                        disabled={processingIds.has(req.id) || isBulkProcessing}
                                                        onClick={() => handleAction(req.id, "Approve")} 
                                                        className="flex-1 flex justify-center items-center gap-2 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {processingIds.has(req.id) ? (
                                                            <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin"></div>
                                                        ) : (
                                                            <FiCheck size={16} /> 
                                                        )}
                                                        {processingIds.has(req.id) ? 'Processing' : 'Approve'}
                                                    </button>
                                                    <button 
                                                        disabled={processingIds.has(req.id) || isBulkProcessing}
                                                        onClick={() => handleAction(req.id, "Reject")} 
                                                        className="flex-1 flex justify-center items-center gap-2 py-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <FiX size={16} /> Reject
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>

                                {/* 💻 DESKTOP TABLE VIEW */}
                                <div className="hidden md:block overflow-x-auto max-h-[600px] overflow-y-auto">
                                    <table className="w-full text-left border-collapse min-w-[1000px]">
                                        <thead className="sticky top-0 bg-[#0f1f38] z-10">
                                            <tr className="bg-white/[0.02] text-xs uppercase tracking-wider font-semibold border-b border-white/10">
                                                <th className="px-6 py-4 text-white/40 w-16 text-center">
                                                    <button 
                                                        disabled={isBulkProcessing || processingIds.size > 0} 
                                                        onClick={toggleSelectAll} 
                                                        className="text-white/40 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {pendingForms.length > 0 && selectedIds.length === pendingForms.length ? <FiCheckSquare size={16} /> : <FiSquare size={16} />}
                                                    </button>
                                                </th>
                                                <th className="px-6 py-4 text-white/40">Student Name</th>
                                                <th className="px-4 py-4 text-white/40 text-center">Department</th>
                                                <th className="px-4 py-4 text-white/40 text-center">Year</th>
                                                <th className="px-4 py-4 text-white/40 text-center">Room No</th>
                                                <th className="px-4 py-4 text-white/40 text-center">Leave Date</th>
                                                <th className="px-4 py-4 text-white/40 text-center">Arrival Date</th>
                                                <th className="px-4 py-4 text-white/40">Reason</th>
                                                <th className="px-6 py-4 text-white/40 text-right w-40">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/[0.03]">
                                            {pendingForms.length === 0 ? (
                                                <tr>
                                                    <td colSpan="9" className="px-6 py-24 text-center">
                                                        <div className="flex flex-col items-center justify-center gap-3">
                                                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-white/20 mb-2">
                                                                <FiFilter size={32} />
                                                            </div>
                                                            <h3 className="text-white text-xl font-bold tracking-tight">All Caught Up!</h3>
                                                            <p className="text-white/40 font-medium text-sm">
                                                                No pending requests.
                                                            </p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : pendingForms.map((req, idx) => (
                                                <motion.tr
                                                    layout
                                                    key={`desk-${req.id}`}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.02 }}
                                                    onClick={() => !processingIds.has(req.id) && !isBulkProcessing && toggleSelect(req.id)}
                                                    className={`hover:bg-white/[0.02] transition-colors border-b border-white/[0.03] cursor-pointer ${selectedIds.includes(req.id) ? `bg-${t.color}-500/5` : ''} ${processingIds.has(req.id) || isBulkProcessing ? 'opacity-50 pointer-events-none' : ''}`}
                                                >
                                                    <td className="px-6 py-4 text-center">
                                                        <div className={`w-5 h-5 mx-auto rounded flex items-center justify-center border transition-colors ${selectedIds.includes(req.id) ? `bg-${t.color}-500 border-${t.color}-400 text-slate-900` : 'bg-white/5 border-white/20 text-transparent'}`}>
                                                            <FiCheck size={12} strokeWidth={4} />
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-4">
                                                            <p className={`text-sm font-semibold text-white group-hover:${t.text} transition-colors`}>{req.name}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="px-2.5 py-1 bg-white/5 rounded-md text-xs font-semibold text-white/50 border border-white/5 tracking-wider">{req.dept}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="px-2.5 py-1 bg-white/5 rounded-md text-xs font-semibold text-white/50 border border-white/5 tracking-wider">{req.year === 1 ? "1st" : req.year === 2 ? "2nd" : req.year === 3 ? "3rd" : "4th"}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="text-sm font-semibold text-white/80">{req.roomNo}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="text-xs font-medium text-white/50">{req.leaveDate}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="text-xs font-medium text-white/50">{req.arrivalDate}</span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <p title={req.reason} className="text-xs font-medium text-white/40 leading-tight max-w-[150px] truncate cursor-pointer">{req.reason}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
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
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Footer */}
            <footer className="px-8 py-4 text-center border-t border-white/5 bg-[#0a1628]/80 backdrop-blur-md shrink-0 mt-auto">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">
                    <p className="text-xs text-white/20 tracking-wider uppercase font-semibold">© 2025 Government College of Engineering · Srirangam</p>
                    <div className="flex gap-6">
                        <span className={`text-xs ${t.text} opacity-40 font-semibold tracking-wider uppercase`}>Warden Panel</span>
                        <span className={`text-xs ${t.text} opacity-40 font-semibold tracking-wider uppercase`}>System Stable</span>
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
                themeColor={selectedYear ? YEAR_THEME[selectedYear]?.color || "emerald" : "emerald"} 
            />
        </div>
    );
};

export default Warden;
