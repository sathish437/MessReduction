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
                                     <p className="text-4xl sm:text-5xl font-bold text-white mt-4">{(dashboardStats.pendingDeputyWarden || 0) + (dashboardStats.pendingWarden || 0) + (dashboardStats.rejectedDeputyWarden || 0)}</p>
                                     <button
                                         onClick={() => setView("requests")}
                                         className="mt-6 flex items-center justify-center gap-2 w-full bg-white text-[#0a1628] py-3 rounded-xl font-semibold text-xs tracking-wider uppercase hover:bg-teal-400 transition-colors"
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
                            className="space-y-6"
                        >
                            {/* Header row */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 px-1">
                                <div>
                                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                                        <div className="w-1 h-5 bg-teal-500 rounded-full" />
                                        Pending Requests - Deputy Review
                                    </h2>
                                    <p className="text-xs text-white/40 mt-0.5">Forms awaiting deputy warden approval</p>
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
                                            onClick={() => handleBulkAction("accepted")}
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
                                                        {filteredRequests.length > 0 && selectedIds.length === filteredRequests.length ? <FiCheckSquare size={16} /> : <FiSquare size={16} />}
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
                                            {filteredRequests.length === 0 ? (
                                                <tr>
                                                    <td colSpan="8" className="px-6 py-16 text-center">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white/20">
                                                                <FiList size={24} />
                                                            </div>
                                                            <p className="text-white/30 font-semibold uppercase tracking-wider text-xs">
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
                                                    className={`group hover:bg-white/[0.02] transition-colors ${selectedIds.includes(req.id) ? 'bg-white/[0.01]' : ''}`}
                                                >
                                                    <td className="px-6 py-4 text-center">
                                                        <button onClick={() => toggleSelect(req.id)} className={`${selectedIds.includes(req.id) ? 'text-teal-400' : 'text-white/20 hover:text-white/60'} transition-colors mt-1`}>
                                                            {selectedIds.includes(req.id) ? <FiCheckSquare size={16} /> : <FiSquare size={16} />}
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-4">
                                                            <p className="text-sm font-semibold text-white group-hover:text-teal-400 transition-colors">{req.name}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="px-2.5 py-1 bg-white/5 rounded-md text-xs font-semibold text-white/50 border border-white/5 tracking-wider">{req.dept}</span>
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
                themeColor="blue" 
            />
        </div>
    );
}

export default Deputy_warden_side;