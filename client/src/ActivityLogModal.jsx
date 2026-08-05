import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiClock, FiUser, FiActivity, FiChevronLeft, FiChevronRight, FiSearch } from "react-icons/fi";
import apiClient from "./api/apiClient";

export default function ActivityLogModal({ isOpen, onClose, actionTitle, actionType, themeColor = "emerald" }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [logSearch, setLogSearch] = useState("");

    const themeColors = {
        emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400" },
        rose: { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400" },
        blue: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400" },
        violet: { bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-400" }
    };

    const t = themeColors[themeColor] || themeColors.emerald;

    // ── Display name helpers ──────────────────────────────────────────────
    const formatActorName = (staffName) => {
        if (!staffName) return "—";
        if (staffName === "SYSTEM") return "Auto Accept";
        // deputyWarden3 → "Deputy Warden"
        if (/^deputyWarden\d+$/i.test(staffName)) return "Deputy Warden";
        // warden → "Warden"
        if (/^warden$/i.test(staffName)) return "Warden";
        // office → "Office"
        if (/^office$/i.test(staffName)) return "Office";
        return staffName;
    };

    const formatActionBadge = (action, staffName) => {
        // If performed by SYSTEM, always label it as "Auto Accept"
        if (staffName === "SYSTEM") return "Auto Accept";
        return action || "—";
    };
    // ─────────────────────────────────────────────────────────────────────

    useEffect(() => {
        if (!isOpen) return;

        // Reset to first page and search when modal opens
        setPage(0);
        setLogSearch("");
        fetchLogs(0);

        // Poll every 15 seconds while modal is open so auto-accept logs appear immediately
        const interval = setInterval(() => {
            fetchLogs(page);
        }, 15000);

        return () => clearInterval(interval);
    }, [isOpen]);

    // Refetch when user navigates pages
    useEffect(() => {
        if (isOpen) {
            fetchLogs(page);
        }
    }, [page]);

    const fetchLogs = async (pageNumber) => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/api/logs/role?action=${actionType}&page=${pageNumber}&size=15`);
            setLogs(res.data.content || []);
            setTotalPages(res.data.totalPages || 0);
        } catch (err) {
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-4xl bg-[#0f1f38] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                            <h3 className={`text-lg font-bold text-white flex items-center gap-2 ${t.text}`}>
                                <FiActivity size={20} />
                                {actionTitle} Logs
                            </h3>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all"
                            >
                                <FiX size={24} />
                            </button>
                        </div>

                        {/* Search Box */}
                        <div className="relative mb-4">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <FiSearch size={14} className="text-white/30" />
                            </div>
                            <input
                                id="log-search"
                                type="text"
                                value={logSearch}
                                onChange={(e) => setLogSearch(e.target.value)}
                                placeholder="Search by Student Name or Register Number"
                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white/80 placeholder:text-white/25 focus:outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/10 transition-all"
                            />
                            {logSearch && (
                                <button
                                    onClick={() => setLogSearch("")}
                                    className="absolute inset-y-0 right-4 flex items-center text-white/30 hover:text-white/60 transition-colors text-xs font-semibold"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden min-h-[300px]">
                            {(() => {
                                if (loading) {
                                    return (
                                        <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
                                            <div className={`w-12 h-12 border-4 border-t-transparent border-white/20 rounded-full animate-spin`} />
                                            <p className="text-white/40 text-sm font-bold tracking-widest uppercase">Fetching data...</p>
                                        </div>
                                    );
                                }
                                const q = logSearch.trim().toLowerCase();
                                const visibleLogs = q
                                    ? logs.filter(log =>
                                        log.studentName?.toLowerCase().includes(q) ||
                                        String(log.studentId ?? "").toLowerCase().includes(q)
                                      )
                                    : logs;
                                if (visibleLogs.length === 0) {
                                    return (
                                        <div className="h-full flex flex-col items-center justify-center gap-4 text-center text-white/30 p-8">
                                            <div className={`w-16 h-16 rounded-full ${t.bg} ${t.border} flex items-center justify-center`}>
                                                <FiClock size={32} className={t.text} />
                                            </div>
                                            <p className="font-medium text-sm text-white/50 tracking-wider">
                                                No records found
                                            </p>
                                        </div>
                                    );
                                }
                                return (
                                    <div className="w-full overflow-x-auto rounded-2xl border border-white/5 bg-white/[0.01]">
                                        <table className="w-full text-left border-collapse min-w-[700px]">
                                            <thead>
                                                <tr className="border-b border-white/10 bg-white/[0.03] text-[11px] font-bold text-white/50 uppercase tracking-wider">
                                                    <th className="py-2.5 px-3">Form ID</th>
                                                    <th className="py-2.5 px-3">Student Name</th>
                                                    <th className="py-2.5 px-3">Department</th>
                                                    <th className="py-2.5 px-3">Status</th>
                                                    <th className="py-2.5 px-3">Staff Role</th>
                                                    <th className="py-2.5 px-3">Timestamp</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5 text-xs text-white/80">
                                                {visibleLogs.map((log) => (
                                                    <tr key={log.id} className="hover:bg-white/[0.04] transition-colors">
                                                        <td className="py-2 px-3 font-semibold text-white/60 whitespace-nowrap">#{log.formId}</td>
                                                        <td className="py-2 px-3 font-medium text-white whitespace-nowrap">{log.studentName}</td>
                                                        <td className="py-2 px-3 text-white/60 uppercase whitespace-nowrap">{log.department || '—'}</td>
                                                        <td className="py-2 px-3 whitespace-nowrap">
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
                                                        <td className="py-2 px-3 text-white/70 whitespace-nowrap">{formatActorName(log.staffName)}</td>
                                                        <td className="py-2 px-3 text-white/40 text-[11px] font-mono whitespace-nowrap">
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

                        {/* Pagination Footer */}
                        {!loading && totalPages > 1 && (
                            <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
                                <button
                                    disabled={page === 0}
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all font-bold uppercase text-xs tracking-widest"
                                >
                                    Previous
                                </button>
                                
                                <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] sm:max-w-md [&::-webkit-scrollbar]:hidden">
                                    {Array.from({ length: totalPages }, (_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setPage(idx)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                page === idx
                                                    ? `${t.bg} ${t.text} border ${t.border} shadow-sm`
                                                    : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                                            }`}
                                        >
                                            {idx + 1}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    disabled={page >= totalPages - 1}
                                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all font-bold uppercase text-xs tracking-widest"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
