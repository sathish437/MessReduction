import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    FiUsers, FiCheck, FiX, FiPieChart, FiList, 
    FiCheckSquare, FiSquare, FiTrendingUp, FiArrowRight,
    FiClock, FiBarChart2, FiActivity, FiLogOut
} from "react-icons/fi";
import apiClient from "./api/apiClient";
import { deleteCookie, getCookie } from "./utils/cookieUtils";
import logo from "./assets/1000088399.png";
import ActivityLogModal from "./ActivityLogModal";


const handleLogout = () => {
  deleteCookie('staffToken');
  deleteCookie('staffUsername');
  deleteCookie('staffRole');
  window.location.href = '/staff-login';
};

const YEARS = ["1st", "2nd", "3rd", "4th"];

const YEAR_COLORS = {
    "1st": { accent: "teal",    bg: "bg-teal-500",    text: "text-teal-400",    border: "border-teal-500/30",    glow: "shadow-teal-500/20",    ring: "bg-teal-500/10"  },
    "2nd": { accent: "blue",    bg: "bg-blue-500",    text: "text-blue-400",    border: "border-blue-500/30",    glow: "shadow-blue-500/20",    ring: "bg-blue-500/10"  },
    "3rd": { accent: "violet",  bg: "bg-violet-500",  text: "text-violet-400",  border: "border-violet-500/30",  glow: "shadow-violet-500/20",  ring: "bg-violet-500/10"},
    "4th": { accent: "amber",   bg: "bg-amber-500",   text: "text-amber-400",   border: "border-amber-500/30",   glow: "shadow-amber-500/20",   ring: "bg-amber-500/10" },
};

function YearStatCard({ year, requests, yearStats }) {
    const c = YEAR_COLORS[year];
    // Since we only fetch pending requests, we can't calculate approved/rejected from 'requests' array
    // We use the yearStats object for totals if available
    const yearKeyMap = { "1st": "firstYear", "2nd": "secondYear", "3rd": "thirdYear", "4th": "fourthYear" };
    const total = yearStats[yearKeyMap[year]] || 0;
    const pending = requests.filter(r => r.year === year).length;
    
    // Note: The backend doesn't seem to provide separate approved/rejected counts per year in YearWiseCountDTO
    // It just provides counts. Assuming these counts are total submissions.
    // For now, I'll display pending from the current list.
    const accepted = 0; // Backend needs to be updated to provide this
    const rejected = 0; // Backend needs to be updated to provide this

    return (
        <motion.div
            whileHover={{ scale: 1.02, translateY: -4 }}
            className={`bg-[#0f1f38] border ${c.border} rounded-3xl p-7 shadow-xl shadow-black/30 relative overflow-hidden group`}
        >
            {/* Glow orb */}
            <div className={`absolute -top-10 -right-10 w-36 h-36 ${c.bg} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity duration-500`} />

            {/* Header */}
            <div className="flex items-center justify-between mb-5 relative z-10">
                <div className={`px-4 py-1.5 rounded-lg ${c.ring} border ${c.border}`}>
                    <span className={`text-sm font-black tracking-[0.25em] uppercase ${c.text}`}>{year} Year</span>
                </div>
                <span className={`text-6xl font-black ${c.text}`}>{total}</span>
            </div>

            {/* Sub counts */}
            <div className="grid grid-cols-2 gap-2 relative z-10">
                {[
                    { label: "Pending",  val: pending,  color: "text-amber-400" },
                    { label: "Total Rec.", val: total, color: "text-emerald-400" },
                ].map(({ label, val, color }) => (
                    <div key={label} className="text-center">
                        <p className={`text-2xl font-black ${color}`}>{val}</p>
                        <p className="text-sm font-bold text-white/25 uppercase tracking-widest">{label}</p>
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

    const refreshData = async () => {
        try {
            const currentUsername = getCookie('staffUsername');
            const currentDeputyDetails = getDeputyDetails(currentUsername);

            // Fetch pending forms for Deputy Warden
            const response = await apiClient.get("/api/hostelStaff/staff/deputyWarden");

            // Filter forms in frontend
            const filteredData = response.data.filter(form => {
                if (!currentDeputyDetails) return true;
                const isGenderMatch = !form.gender || form.gender === currentDeputyDetails.gender;
                const isYearMatch = form.year === currentDeputyDetails.year;
                const isAssigned = form.assignedDeputyWarden === currentUsername;
                return (isGenderMatch && isYearMatch) || isAssigned;
            });

            // TEMP DEBUG LOGS
            console.log("[DEBUG] Logged-in deputy warden:", { username: currentUsername, gender: currentDeputyDetails?.gender, year: currentDeputyDetails?.year });
            console.log("[DEBUG] API response before filtering:", response.data);
            console.log("[DEBUG] Final filtered list count:", filteredData.length);

            const data = filteredData.map(r => ({
                ...r,
                id: r.formId,
                year: r.year === 1 ? "1st" : r.year === 2 ? "2nd" : r.year === 3 ? "3rd" : "4th",
                dept: r.department,
                status: r.currentStatus || "PendingDeputyWarden"
            }));
            setRequests(data);

            // Fetch dashboard counts
            const countRes = await apiClient.get("/api/hostelStaff/staff/dashboard-count");
            setDashboardStats(countRes.data);

            // Fetch year-wise counts
            const yearCountRes = await apiClient.get("/api/hostelStaff/staff/deputyWarden/year-count");
            setYearStats(yearCountRes.data);

        } catch (err) {
            console.error("Error fetching Deputy Warden data:", err);
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                await refreshData();
            } catch (err) {
                console.error("Error loading initial data:", err);
                const fallback = JSON.parse(localStorage.getItem("mock_requests") || "[]");
                setRequests(fallback);
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
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

    // Activity Log Modal State
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [logActionType, setLogActionType] = useState("Approved");
    const [logActionTitle, setLogActionTitle] = useState("Accepted");

    const handleAction = async (id, actionType) => {
        // Normalize action to 'Approve' or 'Reject' for backend
        const action = actionType === "Approve" || actionType === "accepted" ? "Approve" : "Reject";
        
        if (action === "Reject") {
            setRejectFormId(id);
            setRejectReason("");
            setIsRejectModalOpen(true);
            return;
        }

        try {
            await apiClient.patch(`/api/hostelStaff/staff/deputyWarden/${id}?action=${action}`);
            // Refresh data after action
            await refreshData();
        } catch (err) {
            console.error("Action error:", err);
            alert("Failed to update status.");
        }
    };

    const handleRejectSubmit = async () => {
        if (!rejectReason.trim()) {
            alert("Please enter a reason for rejection.");
            return;
        }
        try {
            await apiClient.patch(`/api/hostelStaff/staff/deputyWarden/${rejectFormId}/reject`, { rejectReason });
            setIsRejectModalOpen(false);
            setRejectFormId(null);
            setRejectReason("");
            await refreshData();
        } catch (err) {
            console.error("Deputy Warden reject error:", err);
            alert("Failed to reject request.");
        }
    };

    const handleBulkAction = async (newStatus) => {
        const action = newStatus === "accepted" ? "Approve" : "Reject";
        try {
            await apiClient.patch(`/api/hostelStaff/staff/deputyWarden/bulk?action=${action}`, selectedIds);
            setSelectedIds([]);
            // Refresh data after action
            await refreshData();
        } catch (err) {
            console.error("Bulk action error:", err);
            alert("Failed to perform bulk action.");
        }
    };

    const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

    const toggleSelectAll = () => {
        const pendingIds = filteredRequests.map(r => r.id);
        setSelectedIds(selectedIds.length === pendingIds.length && pendingIds.length > 0 ? [] : pendingIds);
    };

    const filteredRequests = requests
        .filter(r => selectedYear === "all" ? true : r.year === selectedYear)
        .filter(r => search === "" ? true :
            r.name?.toLowerCase().includes(search.toLowerCase()) ||
            String(r.id)?.toLowerCase().includes(search.toLowerCase()) ||
            r.dept?.toLowerCase().includes(search.toLowerCase())
        );

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
                    <p className="text-teal-400 font-black tracking-widest uppercase text-sm">Loading Panel...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex flex-col font-sans bg-[#0a1628] text-white">
            <div className="fixed inset-0 bg-[#0a1628] -z-10" />

            {/* ── Header ── */}
            <header className="w-full flex flex-col sm:flex-row items-center justify-between px-4 sm:px-8 py-4 sm:py-5 border-b border-white/5 bg-[#0a1628]/80 backdrop-blur-xl sticky top-0 z-50 gap-4">
                <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <img src={logo} alt="GCES Logo" className="w-8 h-8 sm:w-11 sm:h-11 object-contain" />
                    <div className="flex flex-col leading-tight">
                        <span className="text-xs sm:text-sm font-semibold tracking-[0.2em] sm:tracking-[0.25em] text-teal-400/80 uppercase">{deputyDetails ? deputyDetails.label : "Deputy Warden Panel"}</span>
                        <span className="text-xl sm:text-3xl font-black text-white tracking-widest uppercase">MessReduction</span>
                    </div>
                </div>

                {/* View Toggle */}
                <div className="flex bg-[#0f1f38]/60 p-1.5 sm:p-2 rounded-2xl border border-white/5 backdrop-blur-sm overflow-x-auto max-w-full [&::-webkit-scrollbar]:hidden">
                    <button onClick={() => setView("dashboard")} className={`flex items-center gap-2 px-5 sm:px-7 py-2 sm:py-3 rounded-xl text-sm sm:text-base font-black tracking-widest uppercase transition-all duration-300 whitespace-nowrap ${view === "dashboard" ? "bg-teal-500 text-slate-900 shadow-[0_0_20px_rgba(45,212,191,0.3)]" : "text-white/40 hover:text-white"}`}>
                        <FiBarChart2 size={16} /> Dashboard
                    </button>
                    <button onClick={() => setView("requests")} className={`flex items-center gap-2 px-5 sm:px-7 py-2 sm:py-3 rounded-xl text-sm sm:text-base font-black tracking-widest uppercase transition-all duration-300 whitespace-nowrap ${view === "requests" ? "bg-teal-500 text-slate-900 shadow-[0_0_20px_rgba(45,212,191,0.3)]" : "text-white/40 hover:text-white"}`}>
                        <FiList size={16} /> Requests
                    </button>
                </div>

                {/* Logout Button */}
                <div className="flex items-center gap-3">

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white transition-all text-sm font-black uppercase tracking-widest"
                    >
                        <FiLogOut size={16} /> Logout
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
                                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3 sm:gap-4">
                                    <div className="w-1.5 h-6 sm:h-8 bg-teal-500 rounded-full" />
                                    Submission Overview
                                </h2>
                                <p className="text-white/30 text-sm sm:text-base font-medium ml-4 sm:ml-5 mt-1">
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
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Overall Status Tracking */}
                                <div className="lg:col-span-2 bg-[#0f1f38] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-10 scale-150 rotate-12 opacity-5 text-teal-400 pointer-events-none group-hover:opacity-10 transition-opacity duration-700">
                                        <FiActivity size={200} />
                                    </div>
                                    <h3 className="text-xl sm:text-2xl font-black text-white mb-6 sm:mb-8 flex items-center gap-3">
                                        <FiTrendingUp className="text-teal-400" /> Overall Status Tracking
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 relative z-10">
                                        {[
                                            { label: "Pending Deputy",  count: dashboardStats.pendingDeputyWarden || 0,  color: "text-amber-400",   bg: "bg-amber-400/10",   border: "border-amber-400/10"   },
                                            { label: "Forwarded Warden", count: dashboardStats.pendingWarden || 0, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/10", action: "Approved", title: "Deputy Warden Approved" },
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
                                                className={`p-6 sm:p-8 rounded-2xl ${s.bg} border ${s.border} ${s.action ? 'cursor-pointer hover:scale-[1.02] transition-transform hover:opacity-80' : ''}`}
                                            >
                                                <p className="text-xs sm:text-sm text-white/30 uppercase font-black tracking-widest mb-2">{s.label}</p>
                                                <p className={`text-5xl sm:text-7xl font-black ${s.color}`}>{s.count}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                 {/* Total Forms */}
                                 <div className="bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/30 rounded-3xl p-8 sm:p-10 flex flex-col justify-between">
                                     <div>
                                         <h3 className="text-xl sm:text-2xl font-black text-white mb-2">Total Forms</h3>
                                         <p className="text-white/40 text-sm sm:text-base font-medium">Cumulative submissions received.</p>
                                     </div>
                                     <p className="text-6xl sm:text-8xl font-black text-white mt-8">{(dashboardStats.pendingDeputyWarden || 0) + (dashboardStats.pendingWarden || 0) + (dashboardStats.rejectedDeputyWarden || 0)}</p>
                                     <button
                                         onClick={() => setView("requests")}
                                         className="mt-8 flex items-center justify-center gap-3 w-full bg-white text-[#0a1628] py-4 rounded-2xl font-black text-base tracking-widest uppercase hover:bg-teal-400 transition-colors"
                                     >
                                         Manage Requests <FiArrowRight />
                                     </button>
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
                            {/* Header row */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 px-1">
                                <div>
                                    <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                                        <div className="w-1.5 h-8 bg-teal-500 rounded-full" />
                                        Pending Requests - Deputy Review
                                    </h2>
                                    <p className="text-sm text-white/40 mt-1">Forms awaiting deputy warden approval</p>
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
                                            onClick={() => handleBulkAction("accepted")}
                                            className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-slate-900 rounded-xl font-black tracking-widest uppercase hover:bg-emerald-400 transition-colors w-full sm:w-auto justify-center"
                                        >
                                            <FiCheck size={18} /> Approve Selected
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Mobile Cards - Match Warden Style */}
                            <div className="space-y-4 lg:hidden">
                                {filteredRequests.length === 0 ? (
                                    <div className="bg-[#0f1f38] border border-white/5 rounded-3xl p-12 text-center">
                                         <p className="text-white/25 font-black uppercase tracking-widest text-base">No pending requests</p>
                                    </div>
                                ) : filteredRequests.map((req, idx) => (
                                    <motion.div
                                        key={req.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={`bg-[#0f1f38] border ${selectedIds.includes(req.id) ? 'border-emerald-500/50' : 'border-white/5'} rounded-3xl p-6 space-y-5 shadow-xl transition-all`}
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

                            {/* Desktop Table - Match Warden Structure */}
                            <div className="hidden lg:block bg-[#0f1f38] border border-white/5 rounded-3xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.4)]">
                                <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden">
                                    <table className="w-full text-left border-collapse min-w-[1000px]">
                                        <thead>
                                            <tr className="bg-white/[0.03] text-sm uppercase tracking-[0.3em] font-black border-b border-white/5">
                                                <th className="px-6 py-6 text-white/40 w-16 text-center">
                                                    <button onClick={toggleSelectAll} className="text-white/40 hover:text-white transition-colors">
                                                        {filteredRequests.length > 0 && selectedIds.length === filteredRequests.length ? <FiCheckSquare size={20} /> : <FiSquare size={20} />}
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
                                            {filteredRequests.length === 0 ? (
                                                <tr>
                                                    <td colSpan="8" className="px-6 py-24 text-center">
                                                        <div className="flex flex-col items-center gap-4">
                                                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-white/10">
                                                                <FiList size={32} />
                                                            </div>
                                                            <p className="text-white/25 font-black uppercase tracking-widest text-base">
                                                                No pending requests for deputy review
                                                            </p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : filteredRequests.map((req, idx) => (
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
                                                            <p className="text-lg font-black text-white group-hover:text-teal-400 transition-colors">{req.name}</p>
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

            {/* ── Footer ── */}
            <footer className="px-8 py-5 text-center border-t border-white/5 bg-[#0a1628]/80 backdrop-blur-xl">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">
                    <p className="text-sm text-white/10 tracking-[0.5em] uppercase font-bold">© 2025 Government College of Engineering · Srirangam</p>
                    <div className="flex gap-8">
                        <span className="text-sm text-teal-400/30 font-black tracking-widest uppercase">{deputyDetails ? deputyDetails.label : "Deputy Warden Panel"}</span>
                        <span className="text-sm text-teal-400/30 font-black tracking-widest uppercase">System Stable</span>
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
                themeColor="blue" 
            />
        </div>
    );
}

export default Deputy_warden_side;