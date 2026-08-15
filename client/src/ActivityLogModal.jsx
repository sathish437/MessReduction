import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    FiX, 
    FiClock, 
    FiActivity, 
    FiChevronLeft, 
    FiChevronRight, 
    FiChevronUp,
    FiChevronDown,
    FiSearch, 
    FiFilter, 
    FiCalendar, 
    FiRotateCcw 
} from "react-icons/fi";
import apiClient from "./api/apiClient";
import { getActiveDepartments } from "./api/departmentService";

export default function ActivityLogModal({ 
    isOpen, 
    onClose, 
    actionTitle, 
    actionType, 
    themeColor = "emerald",
    role 
}) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [isPageSizeOpen, setIsPageSizeOpen] = useState(false);
    const pageSizeRef = useRef(null);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // Filters state
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [selectedDept, setSelectedDept] = useState("");
    const [selectedYear, setSelectedYear] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [departments, setDepartments] = useState([]);

    // Close page size drop-up when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pageSizeRef.current && !pageSizeRef.current.contains(event.target)) {
                setIsPageSizeOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Determine if the current log view is for Warden or Office (where Year filter is allowed)
    const isWardenOrOffice = role 
        ? (role === "Warden" || role === "Office") 
        : (
            (actionTitle?.toLowerCase().includes("warden") && !actionTitle?.toLowerCase().includes("deputy")) ||
            actionTitle?.toLowerCase().includes("office") ||
            (localStorage.getItem("staff_role") !== "DeputyWarden" && !actionTitle?.toLowerCase().includes("deputy"))
        );

    const themeColors = {
        emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", activeBg: "bg-emerald-500 text-black" },
        rose: { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400", activeBg: "bg-rose-500 text-white" },
        blue: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", activeBg: "bg-blue-500 text-white" },
        violet: { bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-400", activeBg: "bg-violet-500 text-white" }
    };

    const t = themeColors[themeColor] || themeColors.emerald;

    // Load active departments on mount
    useEffect(() => {
        if (!isOpen) return;
        const loadDepts = async () => {
            try {
                const depts = await getActiveDepartments();
                setDepartments(depts || []);
            } catch (e) {
                setDepartments([]);
            }
        };
        loadDepts();
    }, [isOpen]);

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Reset pagination to page 0 whenever any filter or search or page size changes
    const prevFiltersRef = useRef({ debouncedSearch, selectedDept, selectedYear, fromDate, toDate, size });
    useEffect(() => {
        if (!isOpen) return;
        const prev = prevFiltersRef.current;
        if (
            prev.debouncedSearch !== debouncedSearch ||
            prev.selectedDept !== selectedDept ||
            prev.selectedYear !== selectedYear ||
            prev.fromDate !== fromDate ||
            prev.toDate !== toDate ||
            prev.size !== size
        ) {
            setPage(0);
            prevFiltersRef.current = { debouncedSearch, selectedDept, selectedYear, fromDate, toDate, size };
        }
    }, [debouncedSearch, selectedDept, selectedYear, fromDate, toDate, size, isOpen]);

    // Display name helpers
    const formatActorName = (staffName) => {
        if (!staffName) return "—";
        if (staffName === "SYSTEM") return "Auto Accept";
        if (/^deputyWarden\d+$/i.test(staffName)) return "Deputy Warden";
        if (/^warden\d*$/i.test(staffName)) return "Warden";
        if (/^office$/i.test(staffName)) return "Office";
        return staffName;
    };

    const formatActionBadge = (action, staffName) => {
        if (staffName === "SYSTEM") return "Auto Accept";
        return action || "—";
    };

    const formatYear = (year) => {
        if (!year && year !== 0) return "—";
        const yStr = String(year).trim();
        if (yStr === "1") return "1st Year";
        if (yStr === "2") return "2nd Year";
        if (yStr === "3") return "3rd Year";
        if (yStr === "4") return "4th Year";
        return `${yStr} Year`;
    };

    // Main fetch logs function
    const fetchLogs = useCallback(async () => {
        if (!isOpen) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("action", actionType || "Approved");
            params.set("page", String(page));
            params.set("size", String(size));

            if (debouncedSearch.trim()) {
                params.set("search", debouncedSearch.trim());
            }
            if (selectedDept && selectedDept !== "ALL") {
                params.set("department", selectedDept);
            }
            if (isWardenOrOffice && selectedYear) {
                params.set("year", selectedYear);
            }
            if (fromDate) {
                params.set("fromDate", fromDate);
            }
            if (toDate) {
                params.set("toDate", toDate);
            }

            const res = await apiClient.get(`/api/logs/role?${params.toString()}`);
            setLogs(res.data.content || []);
            setTotalPages(res.data.totalPages || 0);
            setTotalElements(res.data.totalElements || 0);
        } catch (err) {
            setLogs([]);
            setTotalPages(0);
            setTotalElements(0);
        } finally {
            setLoading(false);
        }
    }, [isOpen, actionType, page, size, debouncedSearch, selectedDept, selectedYear, isWardenOrOffice, fromDate, toDate]);

    // Fetch on initial open and whenever page or filter values change
    useEffect(() => {
        if (isOpen) {
            fetchLogs();
        }
    }, [isOpen, fetchLogs]);

    // Auto-refresh every 20 seconds while open
    useEffect(() => {
        if (!isOpen) return;
        const interval = setInterval(() => {
            fetchLogs();
        }, 20000);
        return () => clearInterval(interval);
    }, [isOpen, fetchLogs]);

    // Reset all filters
    const handleClearFilters = () => {
        setSearchTerm("");
        setDebouncedSearch("");
        setSelectedDept("");
        setSelectedYear("");
        setFromDate("");
        setToDate("");
        setPage(0);
    };

    const hasActiveFilters = Boolean(
        searchTerm || selectedDept || (isWardenOrOffice && selectedYear) || fromDate || toDate
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 12 }}
                        transition={{ duration: 0.2 }}
                        className="relative w-full max-w-5xl bg-[#0f1f38] border border-white/10 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-2xl overflow-hidden flex flex-col h-[94vh] sm:h-auto sm:max-h-[90vh]"
                    >
                        {/* Header (fixed at top) */}
                        <div className="flex-shrink-0 flex items-center justify-between pb-2.5 sm:pb-4 border-b border-white/10">
                            <div className="flex items-center gap-2.5 sm:gap-3">
                                <div className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl ${t.bg} border ${t.border}`}>
                                    <FiActivity size={18} className={`${t.text} sm:text-[22px]`} />
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-xl font-bold text-white flex items-center gap-2">
                                        {actionTitle} Logs
                                    </h3>
                                    <p className="text-[10px] sm:text-xs text-white/50">
                                        Viewing {actionType?.toLowerCase()} reduction request activity history
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
                                title="Close"
                            >
                                <FiX size={18} />
                            </button>
                        </div>

                        {/* Filter Bar (fixed at top) */}
                        <div className="flex-shrink-0 py-2 sm:py-3 space-y-2">
                            {/* Search Box */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-white/40">
                                    <FiSearch size={14} />
                                </div>
                                <input
                                    id="log-search-input"
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search student name, register no, or form ID..."
                                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-9 pr-8 py-1.5 sm:py-2 text-xs sm:text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm("")}
                                        className="absolute inset-y-0 right-2.5 flex items-center text-white/40 hover:text-white transition-colors"
                                        title="Clear search"
                                    >
                                        <FiX size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Dropdowns and Date Filters */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-2.5 items-end">
                                {/* Department Filter (Short Name / Code) */}
                                <div>
                                    <label htmlFor="dept-filter" className="block text-[9px] sm:text-[10px] uppercase tracking-wider text-white/40 font-semibold mb-0.5 sm:mb-1">
                                        Department
                                    </label>
                                    <select
                                        id="dept-filter"
                                        value={selectedDept}
                                        onChange={(e) => setSelectedDept(e.target.value)}
                                        className="w-full bg-[#132744] border border-white/10 rounded-lg sm:rounded-xl px-2 py-1.5 text-[11px] sm:text-xs text-white/90 focus:outline-none focus:border-teal-500/50 transition-all cursor-pointer"
                                    >
                                        <option value="" className="bg-[#0f1f38] text-white">All Depts</option>
                                        {departments.map((dept) => {
                                            const deptCode = dept.departmentCode || dept.code || dept.departmentName || dept.name;
                                            return (
                                                <option key={dept.id || deptCode} value={deptCode} className="bg-[#0f1f38] text-white">
                                                    {deptCode}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>

                                {/* Year Filter (WARDEN & OFFICE ONLY) */}
                                {isWardenOrOffice && (
                                    <div>
                                        <label htmlFor="year-filter" className="block text-[9px] sm:text-[10px] uppercase tracking-wider text-white/40 font-semibold mb-0.5 sm:mb-1">
                                            Year
                                        </label>
                                        <select
                                            id="year-filter"
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(e.target.value)}
                                            className="w-full bg-[#132744] border border-white/10 rounded-lg sm:rounded-xl px-2 py-1.5 text-[11px] sm:text-xs text-white/90 focus:outline-none focus:border-teal-500/50 transition-all cursor-pointer"
                                        >
                                            <option value="" className="bg-[#0f1f38] text-white">All Years</option>
                                            <option value="1" className="bg-[#0f1f38] text-white">1st Year</option>
                                            <option value="2" className="bg-[#0f1f38] text-white">2nd Year</option>
                                            <option value="3" className="bg-[#0f1f38] text-white">3rd Year</option>
                                            <option value="4" className="bg-[#0f1f38] text-white">4th Year</option>
                                        </select>
                                    </div>
                                )}

                                {/* From Date */}
                                <div>
                                    <label htmlFor="from-date-filter" className="block text-[9px] sm:text-[10px] uppercase tracking-wider text-white/40 font-semibold mb-0.5 sm:mb-1">
                                        From Date
                                    </label>
                                    <input
                                        id="from-date-filter"
                                        type="date"
                                        value={fromDate}
                                        onChange={(e) => setFromDate(e.target.value)}
                                        className="w-full bg-[#132744] border border-white/10 rounded-lg sm:rounded-xl px-1.5 sm:px-2.5 py-1 text-[11px] sm:text-xs text-white/90 focus:outline-none focus:border-teal-500/50 transition-all [color-scheme:dark]"
                                    />
                                </div>

                                {/* To Date */}
                                <div>
                                    <label htmlFor="to-date-filter" className="block text-[9px] sm:text-[10px] uppercase tracking-wider text-white/40 font-semibold mb-0.5 sm:mb-1">
                                        To Date
                                    </label>
                                    <input
                                        id="to-date-filter"
                                        type="date"
                                        value={toDate}
                                        onChange={(e) => setToDate(e.target.value)}
                                        className="w-full bg-[#132744] border border-white/10 rounded-lg sm:rounded-xl px-1.5 sm:px-2.5 py-1 text-[11px] sm:text-xs text-white/90 focus:outline-none focus:border-teal-500/50 transition-all [color-scheme:dark]"
                                    />
                                </div>

                                {/* Clear Filters Button */}
                                <div className={`flex items-end ${isWardenOrOffice ? "col-span-2 sm:col-span-1" : "col-span-2 sm:col-span-1"}`}>
                                    <button
                                        onClick={handleClearFilters}
                                        disabled={!hasActiveFilters}
                                        className={`w-full flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold transition-all ${
                                            hasActiveFilters
                                                ? "bg-white/10 text-white hover:bg-white/20 cursor-pointer"
                                                : "bg-white/[0.02] text-white/20 border border-white/5 cursor-not-allowed"
                                        }`}
                                        title="Reset all filters"
                                    >
                                        <FiRotateCcw size={12} />
                                        Clear {hasActiveFilters && `(${[searchTerm, selectedDept, isWardenOrOffice && selectedYear, fromDate, toDate].filter(Boolean).length})`}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Content Area (Scrollable Table) */}
                        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto border-t border-white/5 pt-2">
                            {(() => {
                                if (loading) {
                                    return (
                                        <div className="h-full min-h-[160px] flex flex-col items-center justify-center gap-2.5 text-center">
                                            <div className="w-8 h-8 border-2 border-t-transparent border-teal-400 rounded-full animate-spin" />
                                            <p className="text-white/50 text-[11px] font-medium tracking-wider uppercase">Loading activity logs...</p>
                                        </div>
                                    );
                                }

                                if (logs.length === 0) {
                                    return (
                                        <div className="h-full min-h-[160px] flex flex-col items-center justify-center gap-2 text-center text-white/30 p-4 sm:p-8">
                                            <div className={`w-12 h-12 rounded-full ${t.bg} ${t.border} border flex items-center justify-center`}>
                                                <FiClock size={22} className={t.text} />
                                            </div>
                                            <p className="font-semibold text-xs sm:text-sm text-white/70">
                                                {hasActiveFilters ? "No logs match the selected filters." : "No logs found"}
                                            </p>
                                            {hasActiveFilters && (
                                                <button
                                                    onClick={handleClearFilters}
                                                    className="mt-1 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-white/70 hover:text-white transition-all"
                                                >
                                                    Reset All Filters
                                                </button>
                                            )}
                                        </div>
                                    );
                                }

                                return (
                                    <div className="w-full overflow-x-auto rounded-xl sm:rounded-2xl border border-white/5 bg-white/[0.01]">
                                        <table className="w-full text-left border-collapse min-w-[700px]">
                                            <thead>
                                                <tr className="border-b border-white/10 bg-white/[0.03] text-[10px] sm:text-[11px] font-bold text-white/50 uppercase tracking-wider">
                                                    <th className="py-2 sm:py-3 px-2.5 sm:px-3.5">Form ID</th>
                                                    <th className="py-2 sm:py-3 px-2.5 sm:px-3.5">Student Name</th>
                                                    <th className="py-2 sm:py-3 px-2.5 sm:px-3.5">Register No</th>
                                                    <th className="py-2 sm:py-3 px-2.5 sm:px-3.5">Department</th>
                                                    {isWardenOrOffice && <th className="py-2 sm:py-3 px-2.5 sm:px-3.5">Year</th>}
                                                    <th className="py-2 sm:py-3 px-2.5 sm:px-3.5">Status</th>
                                                    <th className="py-2 sm:py-3 px-2.5 sm:px-3.5">Staff Role</th>
                                                    <th className="py-2 sm:py-3 px-2.5 sm:px-3.5">Timestamp</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5 text-[11px] sm:text-xs text-white/80">
                                                {logs.map((log) => (
                                                    <tr key={log.id} className="hover:bg-white/[0.03] transition-colors">
                                                        <td className="py-2 sm:py-2.5 px-2.5 sm:px-3.5 font-semibold text-white/60 whitespace-nowrap">#{log.formId}</td>
                                                        <td className="py-2 sm:py-2.5 px-2.5 sm:px-3.5 font-medium text-white whitespace-nowrap">{log.studentName || '—'}</td>
                                                        <td className="py-2 sm:py-2.5 px-2.5 sm:px-3.5 text-white/70 font-mono text-[11px] whitespace-nowrap">{log.studentId || '—'}</td>
                                                        <td className="py-2 sm:py-2.5 px-2.5 sm:px-3.5 text-white/60 uppercase whitespace-nowrap">{log.department || '—'}</td>
                                                        {isWardenOrOffice && (
                                                            <td className="py-2 sm:py-2.5 px-2.5 sm:px-3.5 text-white/80 whitespace-nowrap font-medium">
                                                                {formatYear(log.year)}
                                                            </td>
                                                        )}
                                                        <td className="py-2 sm:py-2.5 px-2.5 sm:px-3.5 whitespace-nowrap">
                                                            {log.staffName === "SYSTEM" ? (
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                                                    Auto Accept
                                                                </span>
                                                            ) : (
                                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase ${t.bg} ${t.text} ${t.border} border`}>
                                                                    {formatActionBadge(log.action, log.staffName)}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-2 sm:py-2.5 px-2.5 sm:px-3.5 text-white/70 whitespace-nowrap">{formatActorName(log.staffName)}</td>
                                                        <td className="py-2 sm:py-2.5 px-2.5 sm:px-3.5 text-white/40 text-[10px] sm:text-[11px] font-mono whitespace-nowrap">
                                                            {log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Pagination & Footer (Always fixed at bottom) */}
                        <div className="flex-shrink-0 mt-2 sm:mt-3 pt-2.5 sm:pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs text-white/60">
                            {/* Rows Per Page (Drop-up Menu opening UPWARDS) & Record Counts */}
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="relative" ref={pageSizeRef}>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-white/40 font-medium text-[10px] sm:text-xs">Rows:</span>
                                        <button
                                            type="button"
                                            id="page-size-toggle-btn"
                                            onClick={() => setIsPageSizeOpen((prev) => !prev)}
                                            className="flex items-center gap-1.5 bg-[#132744] hover:bg-[#1a3356] border border-white/10 rounded-md px-2 py-0.5 sm:py-1 text-[11px] sm:text-xs text-white transition-all cursor-pointer shadow-sm"
                                        >
                                            <span>{size}</span>
                                            <FiChevronUp size={12} className={`text-white/60 transition-transform duration-150 ${isPageSizeOpen ? "rotate-180" : ""}`} />
                                        </button>
                                    </div>

                                    {/* Drop-up Menu opening TOP */}
                                    <AnimatePresence>
                                        {isPageSizeOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 6, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 6, scale: 0.95 }}
                                                transition={{ duration: 0.12 }}
                                                className="absolute bottom-full mb-1.5 left-0 z-50 min-w-[72px] bg-[#132744] border border-white/15 rounded-xl shadow-2xl overflow-hidden py-1 backdrop-blur-md"
                                            >
                                                {[10, 20, 50, 100].map((option) => (
                                                    <button
                                                        key={option}
                                                        type="button"
                                                        onClick={() => {
                                                            setSize(option);
                                                            setIsPageSizeOpen(false);
                                                        }}
                                                        className={`w-full text-left px-3 py-1 text-[11px] sm:text-xs font-semibold transition-colors flex items-center justify-between ${
                                                            size === option
                                                                ? `${t.bg} ${t.text} font-bold`
                                                                : "text-white/80 hover:bg-white/10 hover:text-white"
                                                        }`}
                                                    >
                                                        {option}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {totalElements > 0 && (
                                    <span className="text-white/40 text-[10px] sm:text-xs">
                                        {page * size + 1}–{Math.min((page + 1) * size, totalElements)} of {totalElements}
                                    </span>
                                )}
                            </div>

                            {/* Pagination Buttons */}
                            <div className="flex items-center gap-1 ml-auto">
                                <button
                                    disabled={page === 0}
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    className="flex items-center gap-0.5 px-2 py-1 rounded-md sm:rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-all font-semibold uppercase text-[10px] tracking-wider"
                                >
                                    <FiChevronLeft size={12} />
                                    Prev
                                </button>

                                <div className="flex items-center gap-1">
                                    {totalPages <= 1 ? (
                                        <span className="px-2 py-0.5 text-[11px] font-bold text-white/50">Page 1</span>
                                    ) : (
                                        Array.from({ length: totalPages }, (_, idx) => {
                                            if (
                                                totalPages <= 5 ||
                                                idx === 0 ||
                                                idx === totalPages - 1 ||
                                                (idx >= page - 1 && idx <= page + 1)
                                            ) {
                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setPage(idx)}
                                                        className={`min-w-[24px] sm:min-w-[28px] h-6 sm:h-7 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-semibold transition-all ${
                                                            page === idx
                                                                ? `${t.bg} ${t.text} border ${t.border} shadow-sm font-bold`
                                                                : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                                                        }`}
                                                    >
                                                        {idx + 1}
                                                    </button>
                                                );
                                            }
                                            if (
                                                (idx === 1 && page > 2) ||
                                                (idx === totalPages - 2 && page < totalPages - 3)
                                            ) {
                                                return <span key={idx} className="px-0.5 text-white/20 text-[10px]">…</span>;
                                            }
                                            return null;
                                        })
                                    )}
                                </div>

                                <button
                                    disabled={page >= totalPages - 1 || totalPages <= 1}
                                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                    className="flex items-center gap-0.5 px-2 py-1 rounded-md sm:rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-all font-semibold uppercase text-[10px] tracking-wider"
                                >
                                    Next
                                    <FiChevronRight size={12} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

