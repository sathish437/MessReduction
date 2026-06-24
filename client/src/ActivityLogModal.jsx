import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiClock, FiUser, FiActivity, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import apiClient from "./api/apiClient";

export default function ActivityLogModal({ isOpen, onClose, actionTitle, actionType, themeColor = "emerald" }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const themeColors = {
        emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400" },
        rose: { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400" },
        blue: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400" },
        violet: { bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-400" }
    };

    const t = themeColors[themeColor] || themeColors.emerald;

    useEffect(() => {
        if (isOpen) {
            fetchLogs(page);
        }
    }, [isOpen, page]);

    const fetchLogs = async (pageNumber) => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/api/logs/role?action=${actionType}&page=${pageNumber}&size=5`);
            setLogs(res.data.content || []);
            setTotalPages(res.data.totalPages || 0);
        } catch (err) {
            console.error("Failed to fetch activity logs:", err);
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
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
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

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden min-h-[300px]">
                            {loading ? (
                                <div className="h-full flex items-center justify-center">
                                    <div className={`w-12 h-12 border-4 border-t-transparent border-white/20 rounded-full animate-spin`} />
                                </div>
                            ) : logs.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center gap-4 text-center text-white/30 p-8">
                                    <div className={`w-16 h-16 rounded-full ${t.bg} ${t.border} flex items-center justify-center`}>
                                        <FiClock size={32} className={t.text} />
                                    </div>
                                    <p className="font-medium text-sm text-white/50 tracking-wider">No activity logs found.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {logs.map((log) => (
                                        <div key={log.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 sm:p-5 hover:bg-white/[0.04] transition-all">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className="text-white/40 text-xs font-semibold tracking-wider uppercase">Form #{log.formId}</span>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase ${t.bg} ${t.text} ${t.border} border`}>
                                                            {log.action}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-sm font-semibold text-white">{log.studentName}</h4>
                                                    <p className="text-xs text-white/40 font-medium uppercase tracking-wider">{log.department}</p>
                                                </div>
                                                
                                                <div className="flex flex-col sm:items-end gap-2 mt-2 sm:mt-0">
                                                    <div className="flex items-center gap-2 text-sm text-white/50 font-medium">
                                                        <FiUser size={14} /> {log.staffName}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-white/30 font-semibold uppercase tracking-wider">
                                                        <FiClock size={12} /> {new Date(log.timestamp).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Pagination Footer */}
                        {!loading && totalPages > 1 && (
                            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                                <button
                                    disabled={page === 0}
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all font-bold uppercase text-xs tracking-widest"
                                >
                                    <FiChevronLeft /> Prev
                                </button>
                                <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                                    Page {page + 1} of {totalPages}
                                </span>
                                <button
                                    disabled={page >= totalPages - 1}
                                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all font-bold uppercase text-xs tracking-widest"
                                >
                                    Next <FiChevronRight />
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
