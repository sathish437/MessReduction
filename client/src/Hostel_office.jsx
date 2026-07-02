import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FiUsers, FiCheck, FiX, FiPieChart, FiList,
    FiTrendingUp, FiArrowRight, FiBarChart2, FiActivity, FiLogOut,
    FiCheckSquare, FiSquare, FiSearch
} from "react-icons/fi";
import apiClient from "./api/apiClient";
import { deleteCookie } from "./utils/cookieUtils";
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
    "1st": { accent: "teal", bg: "bg-teal-500", text: "text-teal-400", border: "border-teal-500/20", glow: "shadow-md", ring: "bg-teal-500/10" },
    "2nd": { accent: "blue", bg: "bg-blue-500", text: "text-blue-400", border: "border-blue-500/20", glow: "shadow-md", ring: "bg-blue-500/10" },
    "3rd": { accent: "violet", bg: "bg-violet-500", text: "text-violet-400", border: "border-violet-500/20", glow: "shadow-md", ring: "bg-violet-500/10" },
    "4th": { accent: "amber", bg: "bg-amber-500", text: "text-amber-400", border: "border-amber-500/20", glow: "shadow-md", ring: "bg-amber-500/10" },
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
            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className={`px-3 py-1 rounded-lg ${c.ring} border ${c.border}`}>
                    <span className={`text-xs font-semibold tracking-wider uppercase ${c.text}`}>{year} Year</span>
                </div>
                <span className={`text-3xl font-bold ${c.text}`}>{total}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 relative z-10 border-t border-white/5 pt-3">
                {[
                    { label: "Pending", val: pending, color: "text-amber-400" },
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

function HostelOffice() {
    const [view, setView] = useState("dashboard");
    const [selectedYear, setSelectedYear] = useState("all");
    const [genderFilter, setGenderFilter] = useState("ALL");
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);
    const [reportData, setReportData] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");

    const handleGenerateReport = async () => {
        try {
            const response = await apiClient.get("/api/hostelStaff/staff/office/report-data");
            const data = response.data.map(r => ({
                ...r,
                year: r.year === 1 ? "1st" : r.year === 2 ? "2nd" : r.year === 3 ? "3rd" : "4th",
                gender: r.gender || "N/A",
                department: r.department || "N/A"
            }));
            setReportData(data);
        } catch (err) {
            console.error("Error generating report:", err);
            alert("Failed to generate report.");
        }
    };

    const handleDownloadReport = async () => {
        try {
            const response = await apiClient.get("/api/hostelStaff/staff/office/download-report", {
                responseType: "blob"
            });
            const blob = new Blob([response.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "mess_reduction_report.xlsx");
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Error downloading report:", err);
            alert("Failed to download report.");
        }
    };

    const refreshData = async () => {
        try {
            // Fetch ALL pending forms for Office (PendingOffice status)
            const response = await apiClient.get(`/api/hostelStaff/staff/office`);
            const data = response.data.map(r => ({
                ...r,
                id: r.formId,
                year: r.year === 1 ? "1st" : r.year === 2 ? "2nd" : r.year === 3 ? "3rd" : "4th",
                dept: r.department,
                status: r.currentStatus || "PendingOffice",
                gender: r.gender || "ALL"
            }));
            setRequests(data);

            // Fetch dashboard counts
            const countRes = await apiClient.get("/api/hostelStaff/staff/dashboard-count");
            setDashboardStats(countRes.data);

            // Fetch year-wise counts
            const yearCountRes = await apiClient.get("/api/hostelStaff/staff/office/year-count");
            setYearStats(yearCountRes.data);

        } catch (err) {
            console.error("Error fetching Office data:", err);
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                await refreshData();
            } catch (err) {
                console.error("Error loading initial data:", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, []);

    useEffect(() => {
        setSelectedIds([]);
    }, [genderFilter, selectedYear, view]);

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
        const action = actionType === "Approve" ? "Approve" : "Reject";

        if (action === "Reject") {
            setRejectFormId(id);
            setRejectReason("");
            setIsRejectModalOpen(true);
            return;
        }

        try {
            await apiClient.patch(`/api/hostelStaff/staff/office/${id}?action=${action}`);
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
            await apiClient.patch(`/api/hostelStaff/staff/office/${rejectFormId}/reject`, { rejectReason });
            setIsRejectModalOpen(false);
            setRejectFormId(null);
            setRejectReason("");
            await refreshData();
        } catch (err) {
            console.error("Office reject error:", err);
            alert("Failed to reject request.");
        }
    };

    const handleBulkAction = async () => {
        if (selectedIds.length === 0) return;
        try {
            await apiClient.patch(`/api/hostelStaff/staff/office/bulk?action=Approve`, selectedIds);
            setSelectedIds([]);
            await refreshData();
        } catch (err) {
            console.error("Bulk action error:", err);
            alert("Failed to perform bulk approval.");
        }
    };

    const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

    const filteredRequests = requests.filter(req => {
        let matchGender = true;
        let matchYear = true;

        if (genderFilter && genderFilter !== "ALL") {
            matchGender = req.gender === genderFilter;
        }
        if (selectedYear && selectedYear !== "all") {
            matchYear = req.year === selectedYear;
        }

        return matchGender && matchYear;
    });

    const toggleSelectAll = () => {
        const pendingIds = filteredRequests.map(r => r.id);
        setSelectedIds(selectedIds.length === pendingIds.length && pendingIds.length > 0 ? [] : pendingIds);
    };

    const normalizedOfficeSearch = searchQuery.trim().toLowerCase();
    const filteredRequests = requests.filter(r => {
        if (!normalizedOfficeSearch) return true;
        const nameMatch = r.name?.toLowerCase().includes(normalizedOfficeSearch);
        const regNoMatch = r.registerNo?.toLowerCase().includes(normalizedOfficeSearch);
        return nameMatch || regNoMatch;
    });
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

            <header className="w-full flex flex-col lg:flex-row lg:items-center lg:justify-between px-6 py-4 border-b border-white/10 bg-[#0a1628]/80 backdrop-blur-md sticky top-0 z-50 gap-4">
                <div className="flex items-center gap-4 justify-between w-full lg:w-auto">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-teal-500/10 rounded-xl border border-teal-500/20">
                            <img src={logo} alt="GCES Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
                        </div>
                        <div className="flex flex-col leading-tight">
                            <span className="text-[10px] font-semibold tracking-wider text-teal-400/80 uppercase">Hostel Office Panel</span>
                            <span className="text-xl font-bold text-white tracking-normal uppercase">Mess Reduction</span>
                        </div>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full lg:w-auto">
                    {/* Gender Filter */}
                    <select
                        value={genderFilter}
                        onChange={(e) => setGenderFilter(e.target.value)}
                        className="w-full lg:w-auto bg-[#0f1f38] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-white/60 focus:outline-none focus:border-teal-500/55 cursor-pointer order-1 lg:order-2"
                    >
                        <option value="ALL">Gender: All</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                    </select>

                    {/* Year Tabs */}
                    <div className="flex items-center gap-1 bg-[#112240] p-1 rounded-xl border border-white/10 overflow-x-auto w-full lg:w-auto justify-between sm:justify-start [&::-webkit-scrollbar]:hidden order-2 lg:order-1">
                        {["all", ...YEARS].map(yr => (
                            <button
                                key={yr}
                                onClick={() => setSelectedYear(yr)}
                                className={`flex-1 lg:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap text-center ${selectedYear === yr
                                        ? yr === "all" ? "bg-white text-slate-950 shadow-sm"
                                            : `${YEAR_COLORS[yr]?.bg ?? ""} text-slate-955 shadow-sm`
                                        : "text-white/40 hover:text-white"
                                    }`}
                            >
                                {yr === "all" ? "All" : yr}
                            </button>
                        ))}
                    </div>
                </div>

                {/* View Toggle */}
                <div className="flex w-full lg:w-auto bg-[#0f1f38] p-1 rounded-xl border border-white/10 shadow-sm overflow-x-auto [&::-webkit-scrollbar]:hidden">
                    <button onClick={() => setView("dashboard")} className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all duration-200 whitespace-nowrap ${view === "dashboard" ? "bg-teal-500 text-slate-955 shadow-sm" : "text-white/40 hover:text-white"}`}>
                        <FiBarChart2 size={14} /> Dashboard
                    </button>
                    <button onClick={() => setView("requests")} className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all duration-200 whitespace-nowrap ${view === "requests" ? "bg-teal-500 text-slate-955 shadow-sm" : "text-white/40 hover:text-white"}`}>
                        <FiList size={14} /> Requests
                    </button>
                    <button onClick={() => setView("reports")} className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all duration-200 whitespace-nowrap ${view === "reports" ? "bg-teal-500 text-slate-955 shadow-sm" : "text-white/40 hover:text-white"}`}>
                        <FiPieChart size={14} /> Reports
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
                                    {selectedYear === "all" ? "All academic years shown" : `Filtered to ${selectedYear} year submissions`}.
                                </p>
                            </div>

                            {/* ── Year Stat Cards ── */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {YEARS.map(yr => (
                                    <YearStatCard key={yr} year={yr} requests={requests} yearStats={yearStats} />
                                ))}
                            </div>

                            {/* ── Overall Status + Total ── */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Overall Status Tracking */}
                                <div className="lg:col-span-2 bg-[#0f1f38] border border-white/10 rounded-xl p-6 sm:p-8 shadow-sm relative overflow-hidden group">
                                    <h3 className="text-lg font-bold text-white mb-4 sm:mb-6 flex items-center gap-3">
                                        <FiTrendingUp className="text-teal-400" /> Overall Status Tracking
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 relative z-10">
                                        {[
                                            { label: "Pending Office", count: dashboardStats.pendingOffice || 0, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/10" },
                                            { label: "Approved", count: dashboardStats.approved || 0, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/10", action: "Approved", title: "Office Approved" },
                                            { label: "Rejected Office", count: dashboardStats.rejectedOffice || 0, color: "text-rose-400", bg: "bg-rose-400/10", border: "border-rose-400/10", action: "Rejected", title: "Office Rejected" },
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
                                    <p className="text-4xl sm:text-5xl font-bold text-white mt-4">{(dashboardStats.pendingOffice || 0) + (dashboardStats.approved || 0) + (dashboardStats.rejectedOffice || 0)}</p>
                                    <button
                                        onClick={() => setView("requests")}
                                        className="mt-6 flex items-center justify-center gap-2 w-full bg-white text-[#0a1628] py-3 rounded-xl font-semibold text-xs tracking-wider uppercase hover:bg-teal-400 transition-colors"
                                    >
                                        Manage Requests <FiArrowRight />
                                    </button>
                                </div>
                            </div>

                            {/* ── Year-wise Bar Visual ── */}
                            <div className="bg-[#0f1f38] border border-white/10 rounded-xl p-8 shadow-sm">
                                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                    <FiBarChart2 className="text-teal-400" /> Submission Count by Year
                                </h3>
                                <div className="flex items-end gap-6 h-36 max-w-2xl">
                                    {YEARS.map(yr => {
                                        const yearKeyMap = { "1st": "firstYear", "2nd": "secondYear", "3rd": "thirdYear", "4th": "fourthYear" };
                                        const count = yearStats[yearKeyMap[yr]] || 0;
                                        const max = Math.max(yearStats.firstYear, yearStats.secondYear, yearStats.thirdYear, yearStats.fourthYear, 1);
                                        const pct = Math.round((count / max) * 100);
                                        const c = YEAR_COLORS[yr];
                                        return (
                                            <div key={yr} className="flex-1 flex flex-col items-center gap-2">
                                                <span className={`text-sm font-semibold ${c.text}`}>{count}</span>
                                                <div className="w-full bg-white/5 rounded-lg overflow-hidden" style={{ height: "70px" }}>
                                                    <motion.div
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${pct}%` }}
                                                        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: YEARS.indexOf(yr) * 0.1 }}
                                                        className={`w-full ${c.bg} rounded-lg`}
                                                        style={{ marginTop: `${100 - pct}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-semibold text-white/30 uppercase tracking-wider">{yr} Yr</span>
                                            </div>
                                        );
                                    })}
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
                                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                                        <div className="w-1 h-5 bg-teal-500 rounded-full" />
                                        Pending Requests - Office Review
                                    </h2>
                                    <p className="text-xs text-white/40 mt-0.5">Forms awaiting office final approval</p>
                                </div>
                            </div>

                            {/* Search Box */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                    <FiSearch size={15} className="text-white/30" />
                                </div>
                                <input
                                    id="office-search"
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
                                            className="flex items-center justify-center gap-1.5 px-4 py-2 sm:py-2.5 bg-emerald-500 text-slate-950 rounded-xl text-xs font-bold tracking-wider uppercase hover:bg-emerald-400 transition-colors shadow-glow sm:shadow-sm flex-1 sm:flex-none"
                                        >
                                            <FiCheck size={18} /> Approve
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Requests Table (Desktop) & Cards (Mobile) */}
                            <div className="bg-[#0f1f38] border border-white/10 rounded-xl overflow-hidden shadow-sm">
                                
                                {/* 📱 MOBILE CARDS VIEW */}
                                <div className="block md:hidden p-4 space-y-4">
                                    {filteredRequests.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 px-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-white/20 mb-4">
                                                <FiList size={30} />
                                            </div>
                                            <h3 className="text-white text-lg font-bold mb-1">All Caught Up!</h3>
                                            <p className="text-white/40 text-center text-xs">No pending requests for office review.</p>
                                        </div>
                                    ) : (
                                        filteredRequests.map((req, idx) => (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.04 }}
                                                key={`mob-${req.id}`}
                                                onClick={() => toggleSelect(req.id)}
                                                className={`flex flex-col gap-3 p-4 rounded-2xl border transition-colors cursor-pointer ${selectedIds.includes(req.id) ? 'bg-amber-500/10 border-amber-500/30 shadow-glow' : 'bg-white/[0.02] border-white/10 hover:border-white/20'}`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${selectedIds.includes(req.id) ? 'bg-amber-500 border-amber-400 text-slate-900' : 'bg-white/5 border-white/20 text-transparent'}`}>
                                                                <FiCheck size={12} strokeWidth={4} />
                                                            </div>
                                                            <h4 className="text-base font-bold text-white leading-tight">{req.name}</h4>
                                                        </div>
                                                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-white/60 ml-7">
                                                            {req.dept} • {req.year} • {req.roomNo}
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
                                                    <button onClick={() => handleAction(req.id, "Approve")} className="flex-1 flex justify-center items-center gap-2 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 font-bold text-xs uppercase tracking-wider transition-all">
                                                        <FiCheck size={16} /> Approve
                                                    </button>
                                                    <button onClick={() => handleAction(req.id, "Reject")} className="flex-1 flex justify-center items-center gap-2 py-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white font-bold text-xs uppercase tracking-wider transition-all">
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
                                                    <td colSpan="8" className="px-6 py-24 text-center">
                                                        <div className="flex flex-col items-center justify-center gap-3">
                                                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-white/20 mb-2">
                                                                <FiList size={32} />
                                                            </div>
                                                            <h3 className="text-white text-xl font-bold tracking-tight">All Caught Up!</h3>
                                                            <p className="text-white/40 font-medium text-sm">
                                                                No pending office requests.
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
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
                                <div>
                                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                                        <div className="w-1 h-5 bg-teal-500 rounded-full" />
                                        Report Management
                                    </h2>
                                    <p className="text-xs text-white/40 mt-0.5">Generate and download historical approved student reduction requests</p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                    <button
                                        onClick={handleGenerateReport}
                                        className="flex items-center justify-center gap-1.5 px-4 py-2 bg-teal-500 text-slate-955 rounded-lg text-xs font-semibold tracking-wider uppercase hover:bg-teal-400 transition-colors shadow-sm w-full sm:w-auto"
                                    >
                                        <FiActivity size={14} /> Generate Report
                                    </button>
                                    <button
                                        onClick={handleDownloadReport}
                                        disabled={reportData.length === 0}
                                        className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-colors w-full sm:w-auto ${reportData.length > 0
                                                ? "bg-emerald-500 text-slate-955 hover:bg-emerald-400 cursor-pointer shadow-sm"
                                                : "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
                                            }`}
                                    >
                                        <FiTrendingUp size={14} /> Download Report
                                    </button>
                                </div>
                            </div>

                            {/* Report Table */}
                            <div className="bg-[#0f1f38] border border-white/10 rounded-xl overflow-hidden shadow-sm">
                                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                                    <table className="w-full text-left border-collapse min-w-[1000px]">
                                        <thead className="sticky top-0 bg-[#0f1f38] z-10">
                                            <tr className="bg-white/[0.02] text-xs uppercase tracking-wider font-semibold border-b border-white/10">
                                                <th className="px-6 py-4 text-white/40">Student Name</th>
                                                <th className="px-4 py-4 text-white/40 text-center">Register No</th>
                                                <th className="px-4 py-4 text-white/40 text-center">Gender</th>
                                                <th className="px-4 py-4 text-white/40 text-center">Year</th>
                                                <th className="px-4 py-4 text-white/40 text-center">Department</th>
                                                <th className="px-4 py-4 text-white/40 text-center">Leave Date</th>
                                                <th className="px-4 py-4 text-white/40 text-center">Arrival Date</th>
                                                <th className="px-4 py-4 text-white/40 text-center">Holidays</th>
                                                <th className="px-4 py-4 text-white/40 text-center">Deputy Warden</th>
                                                <th className="px-6 py-4 text-white/40 text-right">Refund Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/[0.03]">
                                            {reportData.length === 0 ? (
                                                <tr>
                                                    <td colSpan="10" className="px-6 py-16 text-center">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white/20">
                                                                <FiPieChart size={24} />
                                                            </div>
                                                            <p className="text-white/30 font-semibold uppercase tracking-wider text-xs">
                                                                No report generated yet
                                                            </p>
                                                            <button
                                                                onClick={handleGenerateReport}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold text-white hover:bg-white/10 transition-colors uppercase tracking-wider"
                                                            >
                                                                Generate Data
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : reportData.map((req, idx) => (
                                                <tr
                                                    key={req.formId}
                                                    className="group hover:bg-white/[0.02] transition-colors"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 font-semibold text-sm">
                                                                {req.name?.charAt(0) ?? "?"}
                                                            </div>
                                                            <p className="text-sm font-semibold text-white group-hover:text-teal-400 transition-colors">{req.name}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="text-sm font-medium text-white/70">{req.registerNo}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="text-sm font-medium text-white/70">{req.gender}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="text-sm font-medium text-white/70">{req.year} Yr</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="px-2.5 py-1 bg-white/5 rounded-md text-xs font-semibold text-white/50 border border-white/5 tracking-wider">{req.department}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="text-xs font-medium text-white/50">{req.leaveDate}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="text-xs font-medium text-white/50">{req.arrivalDate}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="text-sm font-semibold text-white/80">{req.totalHolidays}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="text-sm font-medium text-white/70">{req.assignedDeputyWarden}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg font-semibold tracking-wider text-xs border border-emerald-500/20">{req.currentStatus}</span>
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
            </main>

            {/* ── Footer ── */}
            <footer className="px-8 py-4 text-center border-t border-white/5 bg-[#0a1628]/80 backdrop-blur-md">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">
                    <p className="text-xs text-white/20 tracking-wider uppercase font-semibold">© 2025 Government College of Engineering · Srirangam</p>
                    <div className="flex gap-6">
                        <span className="text-xs text-teal-400/35 font-semibold tracking-wider uppercase">Hostel Office — 1 Member</span>
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
                themeColor="violet"
            />
        </div>
    );
}

export default HostelOffice;
