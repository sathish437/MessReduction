import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    FiCheckCircle, FiClock, FiFileText, FiFilter, FiLogOut,
    FiShield, FiTrendingUp, FiArrowRight, FiCalendar, FiMapPin, FiUsers,
    FiCheck, FiX, FiHash, FiCheckSquare, FiSquare
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

    // Rejection Modal State
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectFormId, setRejectFormId] = useState(null);
    const [rejectReason, setRejectReason] = useState("");

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
        if (action === "Reject") {
            setRejectFormId(formId);
            setRejectReason("");
            setIsRejectModalOpen(true);
            return;
        }

        // Check token before making request
        const token = getCookie('staffToken') || sessionStorage.getItem('staffToken') || localStorage.getItem('staffToken');
        console.log('[Warden Action] Token exists:', !!token);
        if (!token) {
            alert("Authentication token not found. Please login again.");
            handleLogout();
            return;
        }

        try {
            await apiClient.patch(`/api/hostelStaff/staff/warden/${formId}?action=${action}`);
            // Refresh data after action
            await fetchData();
        } catch (err) {
            console.error("Warden action error:", err);
            if (err.response?.status === 401) {
                alert("Session expired. Please login again.");
                handleLogout();
            } else {
                alert("Failed to update status.");
            }
        }
    };

    const handleRejectSubmit = async () => {
        if (!rejectReason.trim()) {
            alert("Please enter a reason for rejection.");
            return;
        }

        // Check token before making request
        const token = getCookie('staffToken') || sessionStorage.getItem('staffToken') || localStorage.getItem('staffToken');
        console.log('[Warden Reject] Token exists:', !!token);
        if (!token) {
            alert("Authentication token not found. Please login again.");
            handleLogout();
            return;
        }

        try {
            await apiClient.patch(`/api/hostelStaff/staff/warden/${rejectFormId}/reject`, { rejectReason });
            setIsRejectModalOpen(false);
            setRejectFormId(null);
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
        }
    };

    const handleBulkAction = async () => {
        if (selectedIds.length === 0) return;

        // Check token before making request
        const token = getCookie('staffToken') || sessionStorage.getItem('staffToken') || localStorage.getItem('staffToken');
        console.log('[Warden Bulk Action] Token exists:', !!token);
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
        }
    };

    const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

    const toggleSelectAll = () => {
        const pendingIds = requests.map(r => r.id);
        setSelectedIds(selectedIds.length === pendingIds.length && pendingIds.length > 0 ? [] : pendingIds);
    };

    const t = { color: "teal", active: "bg-teal-500", text: "text-teal-400", border: "border-teal-500/20", ring: "bg-teal-500/10", glow: "shadow-sm" };

    // Backend already filters by year and status - use data directly
    const pendingForms = requests;

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

                                {/* Accepted Requests (Warden approved -> PendingDeputyWarden) */}
                                <div 
                                    onClick={() => { setLogActionType("Approved"); setLogActionTitle("Warden Approved"); setIsLogModalOpen(true); }}
                                    className="bg-[#0f1f38] border border-emerald-500/20 rounded-xl p-6 flex flex-col justify-between cursor-pointer hover:bg-white/[0.01] transition-colors hover:border-emerald-500/40 shadow-sm"
                                >
                                    <div>
                                        <p className="text-xs text-emerald-400/70 uppercase font-semibold tracking-wider mb-2">Accepted Requests</p>
                                        <p className="text-3xl font-bold text-emerald-400">{counts?.pendingDeputyWarden || 0}</p>
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

                            <AnimatePresence>
                                {selectedIds.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex flex-col sm:flex-row items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 gap-4"
                                    >
                                        <span className="text-emerald-400 font-semibold text-xs tracking-wider uppercase">
                                            {selectedIds.length} Form(s) Selected
                                        </span>
                                        <button
                                            onClick={handleBulkAction}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-slate-955 rounded-lg text-xs font-semibold tracking-wider uppercase hover:bg-emerald-400 transition-colors w-full sm:w-auto justify-center shadow-sm"
                                        >
                                            <FiCheck size={18} /> Approve Selected
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Requests Table */}
                            <div className="bg-[#0f1f38] border border-white/10 rounded-xl overflow-hidden shadow-sm">
                                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                                    <table className="w-full text-left border-collapse min-w-[1000px]">
                                        <thead className="sticky top-0 bg-[#0f1f38] z-10">
                                            <tr className="bg-white/[0.02] text-xs uppercase tracking-wider font-semibold border-b border-white/10">
                                                <th className="px-6 py-4 text-white/40 w-16 text-center">
                                                    <button onClick={toggleSelectAll} className="text-white/40 hover:text-white transition-colors">
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
                                                    <td colSpan="9" className="px-6 py-16 text-center">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white/20">
                                                                <FiFilter size={24} />
                                                            </div>
                                                            <p className="text-white/30 font-semibold uppercase tracking-wider text-xs">
                                                                No pending requests
                                                            </p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : pendingForms.map((req, idx) => (
                                                <motion.tr
                                                    layout
                                                    key={req.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.04 }}
                                                    className={`group hover:bg-white/[0.02] transition-colors ${selectedIds.includes(req.id) ? 'bg-white/[0.01]' : ''}`}
                                                >
                                                    <td className="px-6 py-4 text-center">
                                                        <button onClick={() => toggleSelect(req.id)} className={`${selectedIds.includes(req.id) ? 'text-teal-400' : 'text-white/20 hover:text-white/60'} transition-colors mt-1`}>
                                                            {selectedIds.includes(req.id) ? <FiCheckSquare size={16} /> : <FiSquare size={16} />}
                                                        </button>
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
                                                    <td className="px-6 py-3 text-right">
                                                        <div className="flex justify-end gap-1.5">
                                                            <button
                                                                onClick={() => handleAction(req.id, "Approve")}
                                                                className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500 hover:text-slate-950 transition-all border border-emerald-500/10"
                                                            >
                                                                <FiCheck size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleAction(req.id, "Reject")}
                                                                className="p-2 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500 hover:text-white transition-all border border-rose-500/10"
                                                            >
                                                                <FiX size={16} />
                                                            </button>
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
                                    onClick={() => setIsRejectModalOpen(false)}
                                    className="px-4 py-2 rounded-lg font-semibold tracking-wider uppercase text-xs text-white/40 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRejectSubmit}
                                    className="px-4 py-2 rounded-lg font-semibold tracking-wider uppercase text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all"
                                >
                                    Reject
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
