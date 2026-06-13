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
    "1st": { color: "teal",   active: "bg-teal-500",  text: "text-teal-400",  border: "border-teal-500/30",  ring: "bg-teal-500/10",   glow: "shadow-teal-500/30"  },
    "2nd": { color: "blue",   active: "bg-blue-500",  text: "text-blue-400",  border: "border-blue-500/30",  ring: "bg-blue-500/10",   glow: "shadow-blue-500/30"  },
    "3rd": { color: "violet", active: "bg-violet-500",text: "text-violet-400",border: "border-violet-500/30",ring: "bg-violet-500/10", glow: "shadow-violet-500/30"},
    "4th": { color: "amber",  active: "bg-amber-500", text: "text-amber-400", border: "border-amber-500/30", ring: "bg-amber-500/10",  glow: "shadow-amber-500/30" },
};

/* ── Year Selection Screen ── */
function YearSelectScreen({ onSelect }) {
    return (
        <div className="min-h-screen w-full bg-[#0a1628] flex flex-col items-center justify-center font-sans text-white px-6">
            {/* Background glow */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[120px]" />
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
                        <p className="text-xs sm:text-sm font-black tracking-[0.3em] text-teal-400/70 uppercase mb-2">Authority Panel</p>
                        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-widest uppercase px-2">Chief Warden</h1>
                        <p className="text-base sm:text-lg text-white/30 font-medium mt-3">Select your year assignment to continue</p>
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
                                whileHover={{ scale: 1.04, translateY: -4 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => onSelect(yr)}
                                className={`group relative bg-[#0f1f38] ${t.border} border rounded-3xl p-8 flex flex-col items-start gap-4 text-left overflow-hidden hover:shadow-2xl ${t.glow} transition-all duration-300`}
                            >
                                <div className={`absolute -top-8 -right-8 w-32 h-32 ${t.active} opacity-5 rounded-full blur-2xl group-hover:opacity-15 transition-opacity duration-500`} />
                                <div className={`w-12 h-12 rounded-2xl ${t.ring} border ${t.border} flex items-center justify-center`}>
                                    <FiUsers className={t.text} size={22} />
                                </div>
                                <div>
                                    <p className={`text-sm font-black tracking-[0.3em] uppercase ${t.text} mb-2`}>Year {i + 1}</p>
                                    <h3 className="text-4xl font-black text-white">{yr}</h3>
                                    <p className="text-base text-white/30 font-medium mt-1">Warden Panel</p>
                                </div>
                                <div className={`flex items-center gap-2 ${t.text} text-sm font-black uppercase tracking-widest mt-auto`}>
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
const Warden = ({ assignedYear = null }) => {
    // If a URL-level year was provided, start there directly (no selection screen)
    const [selectedYear, setSelectedYear] = useState(assignedYear);
    const [requests, setRequests]         = useState([]);
    const [counts, setCounts]             = useState(null);
    const [loading, setLoading]           = useState(true);
    const [view, setView]                 = useState("dashboard"); // 'dashboard' | 'requests'
    const [selectedIds, setSelectedIds]   = useState([]);
    
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

    const fetchData = async () => {
        setLoading(true);
        try {
            // Get logged-in username from cookie
            const username = getCookie('staffUsername');

            // Fetch warden-specific dashboard counts (filtered by year)
            const countsRes = await apiClient.get(`/api/hostelStaff/staff/dashboard-count/warden?userName=${username}`);
            setCounts(countsRes.data);

            // Fetch warden pending forms with explicit username param
            const formsRes = await apiClient.get(`/api/hostelStaff/staff/warden?userName=${username}`);

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

        try {
            await apiClient.patch(`/api/hostelStaff/staff/warden/${formId}?action=${action}`);
            // Refresh data after action
            await fetchData();
        } catch (err) {
            console.error("Warden action error:", err);
            alert("Failed to update status.");
        }
    };

    const handleRejectSubmit = async () => {
        if (!rejectReason.trim()) {
            alert("Please enter a reason for rejection.");
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
            alert("Failed to reject request.");
        }
    };

    const handleBulkAction = async () => {
        if (selectedIds.length === 0) return;
        try {
            await apiClient.patch(`/api/hostelStaff/staff/warden/bulk?action=Approve`, selectedIds);
            setSelectedIds([]);
            await fetchData();
        } catch (err) {
            console.error("Bulk action error:", err);
            alert("Failed to perform bulk approval.");
        }
    };

    const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

    const toggleSelectAll = () => {
        const pendingIds = requests.map(r => r.id);
        setSelectedIds(selectedIds.length === pendingIds.length && pendingIds.length > 0 ? [] : pendingIds);
    };

    // ── Year selection screen (only shown when NO assignedYear from URL) ──
    if (!selectedYear) {
        return <YearSelectScreen onSelect={(yr) => { setSelectedYear(yr); setView("pending_final"); }} />;
    }

    const t = YEAR_THEME[selectedYear];

    // Backend already filters by year and status - use data directly
    const pendingForms = requests;

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className={`w-16 h-16 border-4 border-t-${t.color}-500 border-${t.color}-500/20 rounded-full animate-spin`} />
                     <p className={`${t.text} font-black tracking-widest uppercase text-base`}>Loading {selectedYear} Year Data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-[#0a1628] text-white font-sans selection:bg-teal-500/30">
            {/* ── Header ── */}
            <header className="w-full flex items-center justify-between px-4 sm:px-10 py-4 sm:py-6 border-b border-white/5 bg-[#0a1628]/80 backdrop-blur-xl sticky top-0 z-50 gap-4 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-3 sm:gap-5">
                    <div className={`p-1.5 sm:p-2 ${t.ring} rounded-xl sm:rounded-2xl border ${t.border}`}>
                        <img src={logo} alt="Logo" className="w-8 h-8 sm:w-11 sm:h-11 object-contain" />
                    </div>
                     <div className="flex flex-col">
                        <span className={`text-xs sm:text-base font-black tracking-[.2em] sm:tracking-[.3em] ${t.text} uppercase`}>Authority Panel</span>
                        <span className="text-xl sm:text-4xl font-black text-white tracking-widest uppercase">Chief Warden</span>
                    </div>
                </div>

                {/* Year badge — show switch only when NOT locked to a URL endpoint */}
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-4 py-2 ${t.ring} border ${t.border} rounded-2xl`}>
                        <div className={`w-2 h-2 rounded-full ${t.active} animate-pulse`} />
                         <span className={`text-sm font-black uppercase tracking-widest ${t.text}`}>{selectedYear} Year Warden</span>
                    </div>
                    {/* Switch Year only available when arrived via /warden (no assignedYear prop) */}
                    {!assignedYear && (
                         <button
                            onClick={() => setSelectedYear(null)}
                            className="flex items-center gap-2 px-5 py-2.5 border border-white/10 rounded-xl text-sm font-black text-white/30 uppercase tracking-widest hover:text-white hover:border-white/20 transition-all"
                        >
                            <FiLogOut size={14} /> Switch Year
                        </button>
                    )}
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white transition-all text-sm font-black uppercase tracking-widest"
                >
                    <FiLogOut size={16} /> Logout
                </button>

                {/* Main View Toggle */}
                <div className="flex bg-[#0f1f38] p-1.5 rounded-2xl border border-white/5 shadow-xl overflow-x-auto max-w-full [&::-webkit-scrollbar]:hidden">
                    <button
                        onClick={() => setView("dashboard")}
                        className={`flex items-center gap-2 px-6 sm:px-10 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-black tracking-widest uppercase transition-all duration-300 whitespace-nowrap ${view === "dashboard" ? `${t.active} text-slate-900 shadow-lg` : "text-white/40 hover:text-white"}`}
                    >
                        <FiTrendingUp size={18} /> Dashboard
                    </button>
                    <button
                        onClick={() => setView("requests")}
                        className={`flex items-center gap-2 px-6 sm:px-10 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-black tracking-widest uppercase transition-all duration-300 whitespace-nowrap ${view === "requests" ? `${t.active} text-slate-900 shadow-lg` : "text-white/40 hover:text-white"}`}
                    >
                        <FiFileText size={18} /> Requests
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
                                <div className={`bg-[#0f1f38] border ${t.border} rounded-2xl p-6 flex flex-col justify-between`}>
                                    <div>
                                        <p className="text-sm text-white/40 uppercase font-black tracking-widest mb-2">Pending Requests</p>
                                        <p className="text-5xl font-black text-white">{counts?.pendingWarden || 0}</p>
                                    </div>
                                    <div className={`mt-4 px-3 py-1 ${t.ring} border ${t.border} rounded-full text-xs font-black ${t.text} uppercase inline-block w-fit`}>Need Action</div>
                                </div>

                                {/* Accepted Requests (Warden approved -> PendingDeputyWarden) */}
                                <div 
                                    onClick={() => { setLogActionType("Approved"); setLogActionTitle("Warden Approved"); setIsLogModalOpen(true); }}
                                    className="bg-[#0f1f38] border border-emerald-500/20 rounded-2xl p-6 flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-transform hover:border-emerald-500/40"
                                >
                                    <div>
                                        <p className="text-sm text-emerald-400/60 uppercase font-black tracking-widest mb-2">Accepted Requests</p>
                                        <p className="text-5xl font-black text-emerald-400">{counts?.pendingDeputyWarden || 0}</p>
                                    </div>
                                    <div className="mt-4 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-black text-emerald-400 uppercase inline-block w-fit">Warden Approved</div>
                                </div>

                                {/* Rejected Requests */}
                                <div 
                                    onClick={() => { setLogActionType("Rejected"); setLogActionTitle("Warden Rejected"); setIsLogModalOpen(true); }}
                                    className="bg-[#0f1f38] border border-rose-500/20 rounded-2xl p-6 flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-transform hover:border-rose-500/40"
                                >
                                    <div>
                                        <p className="text-sm text-rose-400/60 uppercase font-black tracking-widest mb-2">Rejected Requests</p>
                                        <p className="text-5xl font-black text-rose-400">{counts?.rejectedWarden || 0}</p>
                                    </div>
                                    <div className="mt-4 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full text-xs font-black text-rose-400 uppercase inline-block w-fit">Warden Rejected</div>
                                </div>
                            </div>

                            {/* Quick Actions / Info */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-[#0f1f38] border border-white/5 rounded-[2.5rem] p-10 flex flex-col justify-center">
                                    <h3 className="text-2xl font-black text-white mb-4">Warden Protocol</h3>
                                    <p className="text-lg text-white/30 leading-relaxed font-medium">
                                        Review requests pre-approved by Deputy Wardens. Your digital signature finalized the reduction for the Hostel Office records.
                                    </p>
                                    <div className="mt-8 flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl ${t.ring} flex items-center justify-center`}>
                                            <FiShield className={t.text} size={20} />
                                        </div>
                                        <span className="text-sm font-black text-white/20 uppercase tracking-[0.2em]">Verified Secure Portal</span>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-[2.5rem] p-10 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-2xl font-black text-white mb-2">Review Requests</h3>
                                        <p className="text-white/40 text-lg font-medium">Navigate to the requests table to process forms.</p>
                                    </div>
                                    <button
                                        onClick={() => setView("requests")}
                                        className={`mt-10 flex items-center justify-center gap-3 w-full ${t.active} text-slate-900 py-5 rounded-2xl font-black text-base tracking-widest uppercase hover:scale-[1.02] transition-all shadow-xl ${t.glow}`}
                                    >
                                        Process Forms <FiArrowRight />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="requests"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                            {/* ── Requests Header ── */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 px-1">
                                <div>
                                    <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                                        <FiFileText className={t.text} />
                                        Pending Requests - {selectedYear} Year
                                    </h2>
                                    <p className="text-sm text-white/40 mt-1">Forms awaiting warden approval</p>
                                </div>
                            </div>

                            <AnimatePresence>
                                {selectedIds.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex flex-col sm:flex-row items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 gap-4"
                                    >
                                        <span className="text-emerald-400 font-bold text-sm tracking-widest uppercase">
                                            {selectedIds.length} Form(s) Selected
                                        </span>
                                        <button
                                            onClick={handleBulkAction}
                                            className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-slate-900 rounded-xl font-black tracking-widest uppercase hover:bg-emerald-400 transition-colors w-full sm:w-auto justify-center"
                                        >
                                            <FiCheck size={18} /> Approve Selected
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Mobile Cards */}
                            <div className="space-y-4 lg:hidden">
                                {pendingForms.length === 0 ? (
                                    <div className="bg-[#0f1f38] border border-white/5 rounded-3xl p-12 text-center">
                                         <p className="text-white/25 font-black uppercase tracking-widest text-base">No pending requests</p>
                                    </div>
                                ) : pendingForms.map((req, idx) => (
                                    <motion.div
                                        key={req.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={`bg-[#0f1f38] border ${selectedIds.includes(req.id) ? 'border-emerald-500/50' : t.border} rounded-3xl p-6 space-y-5 shadow-xl transition-all`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <button onClick={() => toggleSelect(req.id)} className={`flex-shrink-0 ${selectedIds.includes(req.id) ? 'text-teal-400' : 'text-white/20 hover:text-white/60'} transition-colors`}>
                                                {selectedIds.includes(req.id) ? <FiCheckSquare size={24} /> : <FiSquare size={24} />}
                                            </button>

                                            <div>
                                                <h4 className="text-xl font-black text-white">{req.name}</h4>
                                                <p className="text-sm font-bold text-white/20 tracking-widest uppercase">{req.dept}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                                            <div>
                                                <p className="text-xs font-black text-white/20 uppercase tracking-widest mb-1">Room No</p>
                                                <p className="text-sm font-bold text-white/60">{req.roomNo}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-white/20 uppercase tracking-widest mb-1">Period</p>
                                                <p className="text-sm font-bold text-white/60">{req.leaveDate} - {req.arrivalDate}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-xs font-black text-white/20 uppercase tracking-widest">Reason</p>
                                            <p title={req.reason} className="text-sm font-medium text-white/40 leading-relaxed cursor-pointer">{req.reason}</p>
                                        </div>

                                        <div className="flex items-center justify-end gap-2 pt-2">
                                            <button
                                                onClick={() => handleAction(req.id, "Approve")}
                                                className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl hover:bg-emerald-500 hover:text-slate-900 transition-all border border-emerald-500/10"
                                            >
                                                <FiCheck size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleAction(req.id, "Reject")}
                                                className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl hover:bg-rose-500 hover:text-white transition-all border border-rose-500/10"
                                            >
                                                <FiX size={18} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Desktop Table */}
                            <div className={`hidden lg:block bg-[#0f1f38] border ${t.border} rounded-3xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.4)]`}>
                                <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden">
                                    <table className="w-full text-left border-collapse min-w-[1000px]">
                                        <thead>
                                            <tr className="bg-white/[0.03] text-sm uppercase tracking-[0.3em] font-black border-b border-white/5">
                                                <th className="px-6 py-6 text-white/40 w-16 text-center">
                                                    <button onClick={toggleSelectAll} className="text-white/40 hover:text-white transition-colors">
                                                        {pendingForms.length > 0 && selectedIds.length === pendingForms.length ? <FiCheckSquare size={20} /> : <FiSquare size={20} />}
                                                    </button>
                                                </th>
                                                <th className="px-6 py-6 text-white/40">Student Name</th>
                                                <th className="px-4 py-6 text-white/40 text-center">Department</th>
                                                <th className="px-4 py-6 text-white/40 text-center">Room No</th>
                                                <th className="px-4 py-6 text-white/40 text-center">Leave Date</th>
                                                <th className="px-4 py-6 text-white/40 text-center">Arrival Date</th>
                                                <th className="px-4 py-6 text-white/40">Reason</th>
                                                <th className="px-6 py-6 text-white/40 text-right w-40">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/[0.03]">
                                            {pendingForms.length === 0 ? (
                                                <tr>
                                                    <td colSpan="8" className="px-6 py-24 text-center">
                                                        <div className="flex flex-col items-center gap-4">
                                                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-white/10">
                                                                <FiFilter size={32} />
                                                            </div>
                                                            <p className="text-white/25 font-black uppercase tracking-widest text-base">
                                                                No pending requests for {selectedYear} Year
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
                                                    className={`group hover:bg-white/[0.04] transition-colors ${selectedIds.includes(req.id) ? 'bg-white/[0.02]' : ''}`}
                                                >
                                                    <td className="px-6 py-6 text-center">
                                                        <button onClick={() => toggleSelect(req.id)} className={`${selectedIds.includes(req.id) ? 'text-teal-400' : 'text-white/20 hover:text-white/60'} transition-colors mt-1`}>
                                                            {selectedIds.includes(req.id) ? <FiCheckSquare size={20} /> : <FiSquare size={20} />}
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-6">
                                                        <div className="flex items-center gap-4">

                                                            <p className={`text-lg font-black text-white group-hover:${t.text} transition-colors`}>{req.name}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-6 text-center">
                                                        <span className="px-4 py-1.5 bg-white/5 rounded-lg text-base font-black text-white/50 border border-white/5 tracking-wider">{req.dept}</span>
                                                    </td>
                                                    <td className="px-4 py-6 text-center">
                                                        <span className="text-lg font-black text-white/80">{req.roomNo}</span>
                                                    </td>
                                                    <td className="px-4 py-6 text-center">
                                                        <span className="text-base font-bold text-white/50">{req.leaveDate}</span>
                                                    </td>
                                                    <td className="px-4 py-6 text-center">
                                                        <span className="text-base font-bold text-white/50">{req.arrivalDate}</span>
                                                    </td>
                                                    <td className="px-4 py-6">
                                                        <p title={req.reason} className="text-base font-medium text-white/40 leading-tight max-w-[150px] truncate cursor-pointer">{req.reason}</p>
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => handleAction(req.id, "Approve")}
                                                                className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl hover:bg-emerald-500 hover:text-slate-900 transition-all border border-emerald-500/10"
                                                            >
                                                                <FiCheck size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleAction(req.id, "Reject")}
                                                                className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl hover:bg-rose-500 hover:text-white transition-all border border-rose-500/10"
                                                            >
                                                                <FiX size={18} />
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
            <footer className="px-8 py-5 text-center border-t border-white/5 bg-[#0a1628]/80 backdrop-blur-xl shrink-0 mt-auto">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">
                    <p className="text-sm text-white/10 tracking-[0.5em] uppercase font-bold">© 2025 Government College of Engineering · Srirangam</p>
                    <div className="flex gap-8">
                        <span className={`text-sm ${t.text} opacity-30 font-black tracking-widest uppercase`}>Warden Panel — {selectedYear} Year</span>
                        <span className={`text-sm ${t.text} opacity-30 font-black tracking-widest uppercase`}>System Stable</span>
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
                            className="relative w-full max-w-lg bg-[#0f1f38] border border-rose-500/30 rounded-3xl p-8 shadow-2xl shadow-rose-900/20 overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-8 scale-150 rotate-12 opacity-5 text-rose-500 pointer-events-none">
                                <FiX size={100} />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2 flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-rose-500 rounded-full" />
                                Reason for Rejection <span className="text-rose-500">*</span>
                            </h3>
                            <p className="text-sm text-white/40 mb-6 font-medium">Please provide a clear reason for rejecting this request.</p>
                            
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Enter rejection reason..."
                                className="w-full h-32 bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder-white/20 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 resize-none transition-all"
                            />

                            <div className="flex items-center justify-end gap-4 mt-8">
                                <button
                                    onClick={() => setIsRejectModalOpen(false)}
                                    className="px-6 py-2.5 rounded-xl font-black tracking-widest uppercase text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRejectSubmit}
                                    className="px-6 py-2.5 rounded-xl font-black tracking-widest uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all shadow-[0_0_20px_rgba(244,63,94,0.1)]"
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
