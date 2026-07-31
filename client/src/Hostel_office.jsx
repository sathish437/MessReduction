import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiUsers, FiCheck, FiX, FiPieChart, FiList, FiTrendingUp, FiArrowRight, FiBarChart2, FiActivity, FiLogOut, FiCheckSquare, FiSquare, FiSearch, FiSun, FiMoon, FiCheckCircle, FiXCircle } from "react-icons/fi";
import apiClient from "./api/apiClient";
import { deleteCookie } from "./utils/cookieUtils";
import { useTheme } from "./context/ThemeContext";
import logo from "./assets/1000088399.png";
import ActivityLogModal from "./ActivityLogModal";
import { logout } from "./services/authService";
import { getActiveDepartments } from "./api/departmentService";


const handleLogout = () => {
  logout();
};

const YEARS = ["1st", "2nd", "3rd", "4th"];

const YEAR_COLORS = {
    "1st": { text: "text-[var(--theme-btn-primary)]", bg: "bg-[var(--theme-btn-primary)]/10", border: "border-[var(--theme-btn-primary)]/20" },
    "2nd": { text: "text-[var(--theme-btn-primary)]", bg: "bg-[var(--theme-btn-primary)]/10", border: "border-[var(--theme-btn-primary)]/20" },
    "3rd": { text: "text-[var(--theme-btn-primary)]", bg: "bg-[var(--theme-btn-primary)]/10", border: "border-[var(--theme-btn-primary)]/20" },
    "4th": { text: "text-[var(--theme-btn-primary)]", bg: "bg-[var(--theme-btn-primary)]/10", border: "border-[var(--theme-btn-primary)]/20" },
};

function YearStatCard({ year, requests }) {
    const pending = requests.filter(r => r.year === year).length;
    const colors = YEAR_COLORS[year] || YEAR_COLORS["1st"];

    return (
        <motion.div
            whileHover={{ y: -2 }}
            className="bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-xl p-5 shadow-sm relative overflow-hidden group transition-all duration-200"
        >
            <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-bold tracking-wider uppercase ${colors.text}`}>{year} Year</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${colors.bg} ${colors.text} border ${colors.border} uppercase tracking-wider`}>Pending</span>
            </div>
            <div className="mt-1">
                <p className={`text-3xl font-bold ${colors.text}`}>{pending}</p>
            </div>
        </motion.div>
    );
}

const getLocalDateString = (d) => {
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
};

const defaultFromDate = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return getLocalDateString(d);
};
const defaultToDate = () => {
    return getLocalDateString(new Date());
};

function HostelOffice() {
    const { isDark, toggleTheme } = useTheme();
    const [view, setView] = useState("dashboard");
    const [selectedYear, setSelectedYear] = useState("all");
    const [genderFilter, setGenderFilter] = useState("ALL");
    const [deptFilter, setDeptFilter] = useState("ALL");
    const [activeDepts, setActiveDepts] = useState([]);

    useEffect(() => {
        getActiveDepartments().then(depts => {
            if (Array.isArray(depts)) {
                setActiveDepts(depts);
            }
        });
    }, []);
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);
    const [reportData, setReportData] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");

    // Date & Dropdown selectors for Report
    const [reportFromDate, setReportFromDate] = useState(defaultFromDate());
    const [reportToDate, setReportToDate] = useState(defaultToDate());
    const [reportDeptFilter, setReportDeptFilter] = useState("ALL");
    const [reportYearFilter, setReportYearFilter] = useState("ALL");

    // Pagination & Expand Reason Modal States
    const [currentPage, setCurrentPage]   = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [selectedReason, setSelectedReason] = useState(null);

    // Reset pagination on search change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedYear, genderFilter, deptFilter, itemsPerPage]);

    const handleGenerateReport = async () => {
        try {
            const response = await apiClient.get(`/api/hostelStaff/staff/office/report-data?t=${Date.now()}`);
            const data = response.data.map(r => ({
                ...r,
                year: r.year === 1 ? "1st" : r.year === 2 ? "2nd" : r.year === 3 ? "3rd" : "4th",
                gender: r.gender || "N/A",
                department: r.department || "N/A"
            }));
            const filtered = data.filter(r => {
                const date = r.leaveDate;
                const matchDate = (!reportFromDate || date >= reportFromDate) && (!reportToDate || date <= reportToDate);
                const matchDept = reportDeptFilter === "ALL" || !reportDeptFilter || r.department === reportDeptFilter;
                const matchYear = reportYearFilter === "ALL" || !reportYearFilter || r.year === reportYearFilter;
                return matchDate && matchDept && matchYear;
            });
            setReportData(filtered);
        } catch (err) {
            showToast("Failed to generate report.", 'error');
        }
    };

    const handleDownloadReport = () => {
        if (reportData.length === 0) return;
        
        let xlsContent = `
          <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
          <head>
            <!--[if gte mso 9]>
            <xml>
              <x:ExcelWorkbook>
                <x:ExcelWorksheets>
                  <x:ExcelWorksheet>
                    <x:Name>Office Report</x:Name>
                    <x:WorksheetOptions>
                      <x:DisplayGridlines/>
                    </x:WorksheetOptions>
                  </x:ExcelWorksheet>
                </x:ExcelWorksheets>
              </x:ExcelWorkbook>
            </xml>
            <![endif]-->
            <meta charset="utf-8">
          </head>
          <body>
            <table border="1">
              <thead>
                <tr style="font-weight: bold; background-color: #f2f2f2;">
                  <th>Student Name</th>
                  <th>Register Number</th>
                  <th>Gender</th>
                  <th>Year</th>
                  <th>Department</th>
                  <th>Leave Date</th>
                  <th>Arrival Date</th>
                  <th>Total Holidays</th>
                  <th>Assigned Deputy Warden</th>
                  <th>Final Status</th>
                </tr>
              </thead>
              <tbody>
        `;
        
        reportData.forEach(item => {
            xlsContent += `
              <tr>
                <td>${item.name || ''}</td>
                <td>${item.registerNo || ''}</td>
                <td>${item.gender || ''}</td>
                <td>${item.year || ''}</td>
                <td>${item.department || ''}</td>
                <td>${item.leaveDate || ''}</td>
                <td>${item.arrivalDate || ''}</td>
                <td>${item.totalHolidays || 0}</td>
                <td>${item.assignedDeputyWarden || ''}</td>
                <td>${item.currentStatus || ''}</td>
              </tr>
            `;
        });
        
        xlsContent += `
              </tbody>
            </table>
          </body>
          </html>
        `;
        
        const blob = new Blob([xlsContent], { type: "application/vnd.ms-excel" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `mess_reduction_report_${reportFromDate || 'start'}_to_${reportToDate || 'end'}.xls`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    };

    // Auto load data on tab switch
    useEffect(() => {
        if (view === "reports" && reportData.length === 0) {
            handleGenerateReport();
        }
    }, [view]);

    const refreshData = async (signal = null) => {
        try {
            // Fetch ALL pending forms for Office (PendingOffice status) with cache-busting
            const response = await apiClient.get(`/api/hostelStaff/staff/office?t=${Date.now()}`, signal ? { signal } : {});
            if (signal && signal.aborted) return;
            
            const data = response.data.map(r => ({
                ...r,
                id: r.formId,
                year: r.year === 1 ? "1st" : r.year === 2 ? "2nd" : r.year === 3 ? "3rd" : "4th",
                dept: r.department,
                phone: r.phoneNo || r.phone || r.studentPhone || r.mobile || "N/A",
                status: r.currentStatus || "PendingOffice",
                gender: r.gender || "ALL"
            }));
            setRequests(data);

            // Fetch dashboard counts with cache-busting
            const countRes = await apiClient.get(`/api/hostelStaff/staff/dashboard-count?t=${Date.now()}`, signal ? { signal } : {});
            if (signal && signal.aborted) return;
            setDashboardStats(countRes.data);

            // Fetch year-wise counts with cache-busting
            const yearCountRes = await apiClient.get(`/api/hostelStaff/staff/office/year-count?t=${Date.now()}`, signal ? { signal } : {});
            if (signal && signal.aborted) return;
            setYearStats(yearCountRes.data);

            // Refresh Reports dynamically to maintain full synchronization across tabs
            await handleGenerateReport();

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

    useEffect(() => {
        setSelectedIds([]);
    }, [genderFilter, selectedYear, deptFilter, view]);

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

    // Toast Notification State
    const [toast, setToast] = useState(null);
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

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
        const action = actionType === "Approve" ? "Approve" : "Reject";

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
            await apiClient.patch(`/api/hostelStaff/staff/office/${id}?action=${action}`);
            showToast(`Request ${action.toLowerCase()}d successfully`, 'success');
            // Refresh data after action
            await refreshData();
        } catch (err) {
            showToast("Failed to update status.", 'error');
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
            showToast("Please enter a reason for rejection.", 'error');
            return;
        }

        setIsRejecting(true);
        try {
            if (isBulkReject) {
                const res = await apiClient.patch(`/api/hostelStaff/staff/office/bulk-reject`, {
                    formIds: selectedIds,
                    rejectReason
                });
                showToast(`Bulk Reject Summary: Selected: ${res.data.selected}, Rejected: ${res.data.rejected}, Failed: ${res.data.failed}`, 'success');
                setSelectedIds([]);
            } else {
                await apiClient.patch(`/api/hostelStaff/staff/office/${rejectFormId}/reject`, { rejectReason });
                showToast("Request rejected successfully", 'success');
            }
            setIsRejectModalOpen(false);
            setRejectFormId(null);
            setIsBulkReject(false);
            setRejectReason("");
            await refreshData();
        } catch (err) {
            showToast("Failed to reject request.", 'error');
        } finally {
            setIsRejecting(false); // Enable retry on failure
        }
    };

    const handleBulkAction = async () => {
        if (selectedIds.length === 0 || isBulkProcessing) return;

        setIsBulkProcessing(true);
        try {
            await apiClient.patch(`/api/hostelStaff/staff/office/bulk?action=Approve`, selectedIds);
            showToast("Bulk approval completed successfully", 'success');
            setSelectedIds([]);
            await refreshData();
        } catch (err) {
            showToast("Failed to perform bulk approval.", 'error');
        } finally {
            setIsBulkProcessing(false); // Enable retry on failure
        }
    };

    const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

    const normalizedOfficeSearch = searchQuery.trim().toLowerCase();
    const filteredRequests = requests.filter(req => {
        let matchGender = true;
        let matchYear = true;
        let matchDept = true;

        if (genderFilter && genderFilter !== "ALL") {
            matchGender = req.gender === genderFilter;
        }
        if (selectedYear && selectedYear !== "all") {
            matchYear = req.year === selectedYear;
        }
        if (deptFilter && deptFilter !== "ALL") {
            matchDept = (req.dept || req.department) === deptFilter;
        }
        if (normalizedOfficeSearch) {
            const nameMatch = req.name?.toLowerCase().includes(normalizedOfficeSearch);
            const regNoMatch = req.registerNo?.toLowerCase().includes(normalizedOfficeSearch);
            const phoneMatch = (req.phone || req.phoneNo || "").toLowerCase().includes(normalizedOfficeSearch);
            if (!nameMatch && !regNoMatch && !phoneMatch) return false;
        }

        return matchGender && matchYear && matchDept;
    });

    const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
    const paginatedForms = filteredRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--theme-bg)] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-[var(--theme-btn-primary)]/20 border-t-[var(--theme-btn-primary)] rounded-full animate-spin" />
                    <p className="text-[var(--theme-btn-primary)] font-black tracking-widest uppercase text-sm">Loading requests...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex flex-col font-sans bg-[var(--theme-bg)] text-[var(--theme-text-primary)]">
            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-[12px] shadow-lg border w-[calc(100%-2rem)] sm:w-auto sm:min-w-[320px] max-w-md
                            ${toast.type === 'success'
                                ? 'bg-slate-900 border-emerald-500/30 text-emerald-400'
                                : 'bg-slate-900 border-rose-500/30 text-rose-400'}`}
                    >
                        {toast.type === 'success'
                            ? <FiCheckCircle size={20} className="shrink-0" />
                            : <FiXCircle size={20} className="shrink-0" />}
                        <p className="font-medium text-sm text-white">{toast.message}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="fixed inset-0 bg-[var(--theme-bg)] -z-10" />

            <header className="w-full flex flex-col lg:flex-row lg:items-center lg:justify-between px-3 sm:px-6 py-2.5 sm:py-3 border-b border-[var(--theme-border)] bg-[var(--theme-header)] sticky top-0 z-50 gap-2.5 sm:gap-4" style={{transition: "background-color 0.3s ease"}}>
                <div className="flex items-center gap-3 sm:gap-4 justify-between w-full lg:w-auto">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="p-1.5 sm:p-2 bg-teal-500/10 rounded-xl border border-teal-500/20">
                            <img src={logo} alt="GCES Logo" className="w-7 h-7 sm:w-10 sm:h-10 object-contain" />
                        </div>
                        <div className="flex flex-col leading-tight">
                            <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-white/70 uppercase">Hostel Office Panel</span>
                            <span className="text-lg sm:text-xl font-bold text-white tracking-normal uppercase">Mess Reduction</span>
                        </div>
                    </div>
                </div>

                {/* View Toggle */}
                <div className="flex w-full lg:w-auto bg-[var(--theme-card)] p-1 rounded-xl border border-[var(--theme-border)] shadow-sm overflow-x-auto [&::-webkit-scrollbar]:hidden no-print">
                    <button onClick={() => setView("dashboard")} className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all duration-200 whitespace-nowrap ${view === "dashboard" ? "bg-[var(--theme-btn-primary)] text-white shadow-sm" : "text-[var(--theme-text-primary)] hover:text-[var(--theme-btn-primary)] hover:bg-[var(--theme-btn-primary)]/10"}`}>
                        <FiBarChart2 size={14} /> Dashboard
                    </button>
                    <button onClick={() => setView("requests")} className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all duration-200 whitespace-nowrap ${view === "requests" ? "bg-[var(--theme-btn-primary)] text-white shadow-sm" : "text-[var(--theme-text-primary)] hover:text-[var(--theme-btn-primary)] hover:bg-[var(--theme-btn-primary)]/10"}`}>
                        <FiList size={14} /> Pending Requests
                    </button>
                    <button onClick={() => setView("reports")} className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all duration-200 whitespace-nowrap ${view === "reports" ? "bg-[var(--theme-btn-primary)] text-white shadow-sm" : "text-[var(--theme-text-primary)] hover:text-[var(--theme-btn-primary)] hover:bg-[var(--theme-btn-primary)]/10"}`}>
                        <FiPieChart size={14} /> Reports
                    </button>
                </div>

                {/* Theme Toggle + Logout */}
                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <button
                        onClick={toggleTheme}
                        title={isDark ? "Switch to Light" : "Switch to Dark"}
                        className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/20 text-white hover:bg-[var(--theme-btn-primary)]/10 transition-all shrink-0"
                    >
                        {isDark ? <FiSun size={14} /> : <FiMoon size={14} />}
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full lg:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all text-xs font-semibold tracking-wider uppercase"
                    >
                        <FiLogOut size={14} /> Logout
                    </button>
                </div>
            </header>

            {/* ── Main Content ── */}
            <main className="flex-1 p-3 sm:p-6 lg:p-6">
                <AnimatePresence mode="wait">
                    {/* ════ DASHBOARD VIEW ════ */}
                    {view === "dashboard" && (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, y: -30, filter: "blur(10px)" }}
                            transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                            className="max-w-7xl mx-auto space-y-4 sm:space-y-6"
                        >
                            {/* Section heading */}
                            <div>
                                <h2 className="text-lg sm:text-2xl font-bold text-[var(--theme-text-primary)] tracking-tight flex items-center gap-2">
                                    <div className="w-1 h-4 sm:h-5 bg-[var(--theme-btn-primary)] rounded-full" />
                                    Submission Overview
                                </h2>
                                <p className="text-[var(--theme-text-secondary)] text-xs sm:text-sm font-normal ml-3 mt-0.5">
                                    Overview of all academic year submissions.
                                </p>
                            </div>

                            {/* ── Year Stat Cards ── */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                                {YEARS.map(yr => (
                                    <YearStatCard key={yr} year={yr} requests={requests} yearStats={yearStats} />
                                ))}
                            </div>

                            {/* ── Overall Status + Total ── */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
                                {/* Overall Status Tracking */}
                                <div className="lg:col-span-2 bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-xl p-4 sm:p-5 lg:p-6 shadow-sm relative overflow-hidden group">
                                    <h3 className="text-base sm:text-lg font-bold text-[var(--theme-text-primary)] mb-3 sm:mb-4 flex items-center gap-2.5 sm:gap-3">
                                        <FiTrendingUp className="text-[var(--theme-btn-primary)]" /> Overall Status Tracking
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 relative z-10">
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
                                                className={`p-3.5 sm:p-5 rounded-xl ${s.bg} border ${s.border} ${s.action ? 'cursor-pointer hover:bg-[var(--theme-btn-primary)]/5 transition-colors' : ''}`}
                                            >
                                                <p className="text-[11px] sm:text-xs text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider mb-1">{s.label}</p>
                                                <p className={`text-2xl sm:text-4xl font-bold ${s.color}`}>{s.count}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Total Forms */}
                                <div className="bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-xl p-4 sm:p-5 lg:p-6 flex flex-col justify-between shadow-sm">
                                    <div>
                                        <h3 className="text-base sm:text-lg font-bold text-[var(--theme-text-primary)] mb-1">Total Forms</h3>
                                        <p className="text-[var(--theme-text-secondary)] text-xs font-normal">Cumulative submissions received.</p>
                                    </div>
                                    <p className="text-3xl sm:text-5xl font-bold text-[var(--theme-text-primary)] mt-3 sm:mt-4">{(dashboardStats.pendingOffice || 0) + (dashboardStats.approved || 0) + (dashboardStats.rejectedOffice || 0)}</p>
                                    <button
                                        onClick={() => setView("requests")}
                                        className="mt-4 sm:mt-6 flex items-center justify-center gap-2 w-full bg-[var(--theme-btn-primary)] text-white py-2.5 sm:py-3 rounded-xl font-semibold text-xs tracking-wider uppercase hover:bg-[var(--theme-btn-primary-hover)] transition-colors"
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
                                    <h2 className="text-xl font-bold text-[var(--theme-text-primary)] tracking-tight flex items-center gap-2">
                                        <div className="w-1 h-5 bg-[var(--theme-btn-primary)] rounded-full" />
                                        Pending Requests - Office Review
                                    </h2>
                                    <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">Forms awaiting office final approval</p>
                                </div>
                            </div>

                            {/* Table Toolbar Above Table: Split into 3 logical sections */}
                            <div className="bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-xl p-4 shadow-sm space-y-4">
                                {/* Row 1: Search Students (Left) & Total Records (Right) */}
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                                    <div className="relative flex-1 min-w-[240px]">
                                        <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                                            <FiSearch size={15} className="text-[var(--theme-text-secondary)]" />
                                        </div>
                                        <input
                                            id="office-search"
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search Students..."
                                            className="w-full bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-lg pl-10 pr-8 py-2 text-xs font-medium text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)] focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/20 transition-all"
                                        />
                                        {searchQuery && (
                                            <button
                                                onClick={() => setSearchQuery("")}
                                                className="absolute inset-y-0 right-3 flex items-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors text-xs font-semibold"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>

                                    <div className="px-3.5 py-2 bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-lg text-xs font-bold text-[var(--theme-text-primary)] whitespace-nowrap self-start sm:self-auto">
                                        Total Records : <span className="text-[var(--theme-btn-primary)] font-bold ml-1">{filteredRequests.length}</span>
                                    </div>
                                </div>

                                {/* Row 2: Filtering Controls (Gender, Department, Records Per Page) */}
                                <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[var(--theme-border)]">
                                    {/* Year Filter */}
                                    <div className="flex items-center gap-2 bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-lg px-3 py-1.5 shadow-xs hover:border-[var(--theme-btn-primary)]/50 transition-colors">
                                        <span className="text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider whitespace-nowrap">Year</span>
                                        <select
                                            id="office-year-filter"
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(e.target.value)}
                                            className="bg-transparent text-xs font-bold text-[var(--theme-text-primary)] focus:outline-none cursor-pointer"
                                        >
                                            <option value="all" className="bg-[var(--theme-card)] text-[var(--theme-text-primary)] font-medium">All</option>
                                            {YEARS.map(yr => (
                                                <option key={yr} value={yr} className="bg-[var(--theme-card)] text-[var(--theme-text-primary)] font-medium">{yr}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Gender Filter */}
                                    <div className="flex items-center gap-2 bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-lg px-3 py-1.5 shadow-xs hover:border-[var(--theme-btn-primary)]/50 transition-colors">
                                        <span className="text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider whitespace-nowrap">Gender</span>
                                        <select
                                            id="office-gender-filter"
                                            value={genderFilter}
                                            onChange={(e) => setGenderFilter(e.target.value)}
                                            className="bg-transparent text-xs font-bold text-[var(--theme-text-primary)] focus:outline-none cursor-pointer"
                                        >
                                            <option value="ALL" className="bg-[var(--theme-card)] text-[var(--theme-text-primary)] font-medium">All</option>
                                            <option value="MALE" className="bg-[var(--theme-card)] text-[var(--theme-text-primary)] font-medium">Male</option>
                                            <option value="FEMALE" className="bg-[var(--theme-card)] text-[var(--theme-text-primary)] font-medium">Female</option>
                                        </select>
                                    </div>

                                    {/* Department Filter */}
                                    <div className="flex items-center gap-2 bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-lg px-3 py-1.5 shadow-xs hover:border-[var(--theme-btn-primary)]/50 transition-colors">
                                        <span className="text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider whitespace-nowrap">Department</span>
                                        <select
                                            id="office-dept-filter"
                                            value={deptFilter}
                                            onChange={(e) => setDeptFilter(e.target.value)}
                                            className="bg-transparent text-xs font-bold text-[var(--theme-text-primary)] focus:outline-none cursor-pointer"
                                        >
                                            <option value="ALL" className="bg-[var(--theme-card)] text-[var(--theme-text-primary)] font-medium">All</option>
                                            {activeDepts.length > 0 ? (
                                                activeDepts.map(d => (
                                                    <option key={d.id} value={d.departmentCode} className="bg-[var(--theme-card)] text-[var(--theme-text-primary)] font-medium">{d.departmentCode}</option>
                                                ))
                                            ) : (
                                                ["CSE", "ECE", "EEE", "MECH", "CIVIL", "MECHATRONICS"].map(code => (
                                                    <option key={code} value={code} className="bg-[var(--theme-card)] text-[var(--theme-text-primary)] font-medium">{code}</option>
                                                ))
                                            )}
                                        </select>
                                    </div>

                                    {/* Records Per Page Filter */}
                                    <div className="flex items-center gap-2 bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-lg px-3 py-1.5 shadow-xs hover:border-[var(--theme-btn-primary)]/50 transition-colors">
                                        <span className="text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider whitespace-nowrap">Records Per Page</span>
                                        <select
                                            id="office-records-per-page"
                                            value={itemsPerPage}
                                            onChange={(e) => {
                                                setItemsPerPage(Number(e.target.value));
                                                setCurrentPage(1);
                                            }}
                                            className="bg-transparent text-xs font-bold text-[var(--theme-text-primary)] focus:outline-none cursor-pointer"
                                        >
                                            <option value={20} className="bg-[var(--theme-card)] text-[var(--theme-text-primary)] font-medium">20</option>
                                            <option value={40} className="bg-[var(--theme-card)] text-[var(--theme-text-primary)] font-medium">40</option>
                                            <option value={60} className="bg-[var(--theme-card)] text-[var(--theme-text-primary)] font-medium">60</option>
                                            <option value={80} className="bg-[var(--theme-card)] text-[var(--theme-text-primary)] font-medium">80</option>
                                            <option value={100} className="bg-[var(--theme-card)] text-[var(--theme-text-primary)] font-medium">100</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <AnimatePresence>
                                {selectedIds.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="relative z-20 shadow-2xl sm:shadow-none bg-[var(--theme-card)]/95 sm:bg-emerald-500/10 backdrop-blur-xl sm:backdrop-blur-none border border-emerald-500/30 sm:border-emerald-500/20 rounded-2xl sm:rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-4"
                                    >
                                        <span className="text-emerald-400 font-bold text-xs sm:text-sm tracking-wider uppercase text-center sm:text-left">
                                            {selectedIds.length} Form{selectedIds.length > 1 ? 's' : ''} Selected
                                        </span>
                                        <div className="flex items-center gap-3 w-full sm:w-auto">
                                            <button
                                                onClick={handleBulkAction}
                                                disabled={isBulkProcessing}
                                                className="flex items-center justify-center gap-1.5 px-4 py-2 sm:py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-bold tracking-wider uppercase hover:bg-emerald-400 transition-colors shadow-glow sm:shadow-sm flex-1 sm:flex-none disabled:opacity-70 disabled:cursor-not-allowed"
                                            >
                                                {isBulkProcessing ? (
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
                            <div className="bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-xl overflow-hidden shadow-sm">
                                
                                {/* 💻 TABLE VIEW */}
                                <div 
                                    className="overflow-x-auto max-h-[600px] overflow-y-auto"
                                    style={{ WebkitOverflowScrolling: 'touch' }}
                                >
                                    <table 
                                        className="w-full text-left border-collapse min-w-[750px] lg:min-w-0 lg:table-auto lg:whitespace-normal"
                                    >
                                        <thead className="sticky top-0 bg-[var(--theme-card)] z-10">
                                             <tr className="bg-[var(--theme-bg)] text-xs uppercase tracking-wider font-semibold border-b border-[var(--theme-border)]">
                                                <th className="px-6 py-4 text-[var(--theme-text-secondary)] w-16 text-center">
                                                    <button 
                                                        disabled={isBulkProcessing || processingIds.size > 0} 
                                                        onClick={toggleSelectAll} 
                                                        className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {paginatedForms.length > 0 && paginatedForms.every(r => selectedIds.includes(r.id)) ? <FiCheckSquare size={16} /> : <FiSquare size={16} />}
                                                    </button>
                                                </th>
                                                <th className="px-4 py-4 text-[var(--theme-text-secondary)]">Student Name</th>
                                                <th className="px-4 py-4 text-[var(--theme-text-secondary)] text-center">Register No</th>
                                                <th className="px-4 py-4 text-[var(--theme-text-secondary)] text-center">Department</th>
                                                <th className="px-4 py-4 text-[var(--theme-text-secondary)] text-center">Year</th>
                                                <th className="px-4 py-4 text-[var(--theme-text-secondary)] text-center">Gender</th>
                                                <th className="px-4 py-4 text-[var(--theme-text-secondary)] text-center">Phone Number</th>
                                                <th className="px-4 py-4 text-[var(--theme-text-secondary)] text-center">Room No</th>
                                                <th className="px-4 py-4 text-[var(--theme-text-secondary)] text-center">Leave Date</th>
                                                <th className="px-4 py-4 text-[var(--theme-text-secondary)] text-center">Arrival Date</th>
                                                <th className="px-4 py-4 text-[var(--theme-text-secondary)]">Reason</th>
                                                <th className="px-6 py-4 text-[var(--theme-text-secondary)] text-right w-40">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/[0.03]">
                                            {paginatedForms.length === 0 ? (
                                                <tr>
                                                    <td colSpan="12" className="px-6 py-24 text-center">
                                                        <div className="flex flex-col items-center justify-center gap-3">
                                                            <div className="w-16 h-16 bg-[var(--theme-border)] rounded-full flex items-center justify-center text-[var(--theme-text-secondary)] mb-2">
                                                                <FiList size={32} />
                                                            </div>
                                                            <h3 className="text-[var(--theme-text-primary)] text-xl font-bold tracking-tight">No records found</h3>
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
                                                    className={`hover:bg-[var(--theme-btn-primary)]/5 transition-colors border-b border-[var(--theme-border)] cursor-pointer ${selectedIds.includes(req.id) ? 'bg-[var(--theme-btn-primary)]/5' : ''} ${processingIds.has(req.id) || isBulkProcessing ? 'opacity-50 pointer-events-none' : ''}`}
                                                >
                                                    <td className="px-6 py-4 text-center">
                                                        <div className={`w-5 h-5 mx-auto rounded flex items-center justify-center border transition-colors ${selectedIds.includes(req.id) ? 'bg-amber-500 border-amber-400 text-slate-900' : 'bg-[var(--theme-bg)] border-[var(--theme-border)] text-transparent'}`}>
                                                            <FiCheck size={12} strokeWidth={4} />
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-4 max-w-[150px]">
                                                            <p className="text-sm font-semibold text-[var(--theme-text-primary)] group-hover:text-[var(--theme-btn-primary)] transition-colors truncate">{req.name}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-center whitespace-nowrap">
                                                        <span className="text-xs font-semibold text-[var(--theme-text-primary)]">{req.registerNo || "N/A"}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center whitespace-nowrap">
                                                        <span className="px-2.5 py-1 bg-[var(--theme-bg)] rounded-md text-xs font-semibold text-[var(--theme-text-secondary)] border border-[var(--theme-border)] tracking-wider block truncate max-w-[120px]">{req.dept}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center whitespace-nowrap">
                                                        <span className="px-2 py-0.5 bg-[var(--theme-bg)] rounded text-xs font-medium text-[var(--theme-text-secondary)]">{req.year}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center whitespace-nowrap">
                                                        <span className="text-xs font-medium text-[var(--theme-text-secondary)]">{req.gender}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center whitespace-nowrap">
                                                        <span className="text-xs font-mono font-medium text-[var(--theme-btn-primary)]">{req.phone || req.phoneNo || "N/A"}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center whitespace-nowrap">
                                                        <span className="text-sm font-semibold text-[var(--theme-text-primary)]">{req.roomNo}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center whitespace-nowrap">
                                                        <span className="text-xs font-medium text-[var(--theme-text-secondary)]">{req.leaveDate}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center whitespace-nowrap">
                                                        <span className="text-xs font-medium text-[var(--theme-text-secondary)]">{req.arrivalDate}</span>
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                        <p 
                                                            title={req.reason} 
                                                            onClick={(e) => { e.stopPropagation(); setSelectedReason(req.reason); }}
                                                            className="text-xs font-medium text-[var(--theme-text-secondary)] leading-tight max-w-[150px] truncate cursor-pointer hover:text-[var(--theme-btn-primary)] transition-colors"
                                                        >
                                                            {req.reason && req.reason.length > 35 ? req.reason.substring(0, 35) + "..." : req.reason}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-3 text-right whitespace-nowrap">
                                                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                            {processingIds.has(req.id) ? (
                                                                <div className="px-3 py-2 bg-[var(--theme-bg)] rounded-lg border border-[var(--theme-border)] flex items-center gap-2">
                                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white/80 rounded-full animate-spin"></div>
                                                                    <span className="text-[10px] uppercase tracking-widest text-[var(--theme-text-secondary)] font-semibold">Processing</span>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <button
                                                                        disabled={isBulkProcessing}
                                                                        onClick={() => handleAction(req.id, "Approve")}
                                                                        className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-[var(--theme-border)] bg-[var(--theme-card)]">
                                    <div className="text-xs font-semibold text-[var(--theme-text-secondary)]">
                                        Displaying {filteredRequests.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredRequests.length)} of {filteredRequests.length} Requests
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            className="px-3.5 py-1.5 rounded-lg bg-[var(--theme-bg)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-btn-primary)]/10 hover:text-[var(--theme-text-primary)] disabled:opacity-30 disabled:pointer-events-none transition-all font-bold text-xs tracking-wider flex items-center gap-1"
                                        >
                                            ◀ Previous
                                        </button>
                                        
                                        <span className="px-3 py-1.5 rounded-lg bg-[var(--theme-btn-primary)] text-white font-bold text-xs">
                                            Page {currentPage} of {totalPages || 1}
                                        </span>

                                        <button
                                            disabled={currentPage >= totalPages || totalPages === 0}
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            className="px-3.5 py-1.5 rounded-lg bg-[var(--theme-bg)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-btn-primary)]/10 hover:text-[var(--theme-text-primary)] disabled:opacity-30 disabled:pointer-events-none transition-all font-bold text-xs tracking-wider flex items-center gap-1"
                                        >
                                            Next ▶
                                        </button>
                                    </div>
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
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1 no-print">
                                <div>
                                    <h2 className="text-xl font-bold text-[var(--theme-text-primary)] tracking-tight flex items-center gap-2">
                                        <div className="w-1 h-5 bg-[var(--theme-btn-primary)] rounded-full" />
                                        Report Management
                                    </h2>
                                    <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">Generate and download historical approved student reduction requests</p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                    <button
                                        onClick={handleDownloadReport}
                                        disabled={reportData.length === 0}
                                        className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-colors w-full sm:w-auto ${reportData.length > 0
                                                ? "bg-[var(--color-success)] text-[var(--theme-text-primary)] hover:brightness-110 cursor-pointer shadow-sm font-bold"
                                                : "bg-[var(--theme-border)]/30 text-[var(--theme-text-secondary)] cursor-not-allowed border border-[var(--theme-border)]"
                                            }`}
                                    >
                                        <FiTrendingUp size={14} /> Download Excel
                                    </button>
                                    <button
                                        onClick={() => window.print()}
                                        disabled={reportData.length === 0}
                                        className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-colors w-full sm:w-auto ${reportData.length > 0
                                                ? "bg-violet-500 text-white hover:bg-violet-400 cursor-pointer shadow-sm font-bold"
                                                : "bg-[var(--theme-border)]/30 text-[var(--theme-text-secondary)] cursor-not-allowed border border-[var(--theme-border)]"
                                            }`}
                                    >
                                        <FiPieChart size={14} /> Export PDF
                                    </button>
                                </div>
                            </div>

                            {/* Date and Filter selectors row */}
                            <div className="flex flex-col sm:flex-row items-end gap-4 bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-2xl p-6 no-print">
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-semibold text-[var(--theme-text-secondary)] mb-1.5 uppercase tracking-wider">Department</label>
                                    <select
                                        value={reportDeptFilter}
                                        onChange={(e) => setReportDeptFilter(e.target.value)}
                                        className="w-full bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl px-4 py-2 text-sm text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-btn-primary)]/50 cursor-pointer"
                                    >
                                        <option value="ALL">All Departments</option>
                                        {activeDepts.length > 0 ? (
                                            activeDepts.map(d => (
                                                <option key={d.id} value={d.departmentCode}>{d.departmentCode}</option>
                                            ))
                                        ) : (
                                            ["CSE", "ECE", "EEE", "MECH", "CIVIL", "MECHATRONICS"].map(code => (
                                                <option key={code} value={code}>{code}</option>
                                            ))
                                        )}
                                    </select>
                                </div>
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-semibold text-[var(--theme-text-secondary)] mb-1.5 uppercase tracking-wider">Year</label>
                                    <select
                                        value={reportYearFilter}
                                        onChange={(e) => setReportYearFilter(e.target.value)}
                                        className="w-full bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl px-4 py-2 text-sm text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-btn-primary)]/50 cursor-pointer"
                                    >
                                        <option value="ALL">All Years</option>
                                        {YEARS.map(yr => (
                                            <option key={yr} value={yr}>{yr} Year</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-semibold text-[var(--theme-text-secondary)] mb-1.5 uppercase tracking-wider">From Date</label>
                                    <input
                                        type="date"
                                        value={reportFromDate}
                                        onChange={(e) => setReportFromDate(e.target.value)}
                                        className="w-full bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl px-4 py-2 text-sm text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-btn-primary)]/50"
                                    />
                                </div>
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-semibold text-[var(--theme-text-secondary)] mb-1.5 uppercase tracking-wider">To Date</label>
                                    <input
                                        type="date"
                                        value={reportToDate}
                                        onChange={(e) => setReportToDate(e.target.value)}
                                        className="w-full bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl px-4 py-2 text-sm text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-btn-primary)]/50"
                                    />
                                </div>
                                <button
                                    onClick={handleGenerateReport}
                                    className="px-6 py-2.5 bg-[var(--theme-btn-primary)] hover:bg-[var(--theme-btn-primary-hover)] text-[var(--theme-text-primary)] rounded-xl text-xs font-bold uppercase tracking-wider transition-colors w-full sm:w-auto shrink-0"
                                >
                                    Generate Report
                                </button>
                            </div>

                            {/* Print layout title (only visible when printing) */}
                            <div className="hidden print:block text-black mb-6">
                                <h1 className="text-2xl font-black uppercase text-center tracking-wider">GCES Srirangam Hostel Office</h1>
                                <h2 className="text-lg font-bold text-center mt-1 uppercase">Mess Reduction Report</h2>
                                <p className="text-center text-xs mt-2 font-medium">Period: {reportFromDate || "Start"} to {reportToDate || "End"}</p>
                            </div>

                            {/* Report Table */}
                            <div className="bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-xl overflow-hidden shadow-sm print:border-none print:shadow-none">
                                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                                    <table className="w-full text-left border-collapse min-w-[1000px] print:min-w-full">
                                        <thead className="sticky top-0 bg-[var(--theme-card)] z-10 print:static">
                                            <tr className="bg-[var(--theme-bg)] text-xs uppercase tracking-wider font-semibold border-b border-[var(--theme-border)] print:border-b-2 print:border-black print:text-black">
                                                <th className="px-6 py-4 text-[var(--theme-text-secondary)] print:text-black">Student Name</th>
                                                <th className="px-4 py-4 text-[var(--theme-text-secondary)] text-center print:text-black">Reg / Roll No</th>
                                                <th className="px-4 py-4 text-[var(--theme-text-secondary)] text-center print:text-black">Gender</th>
                                                <th className="px-4 py-4 text-[var(--theme-text-secondary)] text-center print:text-black">Year</th>
                                                <th className="px-4 py-4 text-[var(--theme-text-secondary)] text-center print:text-black">Department</th>
                                                <th className="px-4 py-4 text-[var(--theme-text-secondary)] text-center print:text-black">Leave Date</th>
                                                <th className="px-4 py-4 text-[var(--theme-text-secondary)] text-center print:text-black">Arrival Date</th>
                                                <th className="px-4 py-4 text-[var(--theme-text-secondary)] text-center print:text-black">Holidays</th>
                                                <th className="px-4 py-4 text-[var(--theme-text-secondary)] text-center print:text-black">Deputy Warden</th>
                                                <th className="px-6 py-4 text-[var(--theme-text-secondary)] text-right print:text-black">Refund Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/[0.03] print:divide-y print:divide-black">
                                            {reportData.length === 0 ? (
                                                <tr>
                                                    <td colSpan="10" className="px-6 py-16 text-center print:text-black">
                                                        <div className="flex flex-col items-center gap-3 no-print">
                                                            <div className="w-12 h-12 bg-[var(--theme-border)] rounded-full flex items-center justify-center text-[var(--theme-text-secondary)]">
                                                                <FiPieChart size={24} />
                                                            </div>
                                                            <p className="text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider text-xs">
                                                                No report data found in this range
                                                            </p>
                                                            <button
                                                                onClick={handleGenerateReport}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-lg text-xs font-semibold text-[var(--theme-text-primary)] hover:bg-[var(--theme-btn-primary)]/10 transition-colors uppercase tracking-wider"
                                                            >
                                                                Refresh Data
                                                            </button>
                                                        </div>
                                                        <div className="hidden print:block text-center font-bold text-sm">
                                                            No records found for the selected date range.
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : reportData.map((req, idx) => (
                                                <tr
                                                    key={req.formId}
                                                    className="group hover:bg-[var(--theme-btn-primary)]/5 transition-colors print:text-black"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-[var(--theme-btn-primary)]/10 border border-[var(--theme-btn-primary)]/20 flex items-center justify-center text-teal-400 font-semibold text-sm print:hidden">
                                                                {req.name?.charAt(0) ?? "?"}
                                                            </div>
                                                            <p className="text-sm font-semibold text-[var(--theme-text-primary)] group-hover:text-[var(--theme-btn-primary)] transition-colors print:text-black">{req.name}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="text-sm font-medium text-[var(--theme-text-secondary)] print:text-black">{req.registerNo}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="text-sm font-medium text-[var(--theme-text-secondary)] print:text-black">{req.gender}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="text-sm font-medium text-[var(--theme-text-secondary)] print:text-black">{req.year} Yr</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="px-2.5 py-1 bg-[var(--theme-bg)] rounded-md text-xs font-semibold text-[var(--theme-text-secondary)] border border-[var(--theme-border)] tracking-wider print:border-none print:text-black">{req.department}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="text-xs font-medium text-[var(--theme-text-secondary)] print:text-black">{req.leaveDate}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="text-xs font-medium text-[var(--theme-text-secondary)] print:text-black">{req.arrivalDate}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="text-sm font-semibold text-[var(--theme-text-primary)] print:text-black">{req.totalHolidays}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="text-sm font-medium text-[var(--theme-text-secondary)] print:text-black">{req.assignedDeputyWarden}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg font-semibold tracking-wider text-xs border border-emerald-500/20 print:border-none print:text-black">{req.currentStatus}</span>
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
            <footer className="px-8 py-4 text-center border-t border-[var(--theme-border)] bg-[var(--theme-header)] backdrop-blur-md">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">
                    <p className="text-xs text-[var(--theme-text-secondary)] tracking-wider uppercase font-semibold">© 2025 Government College of Engineering · Srirangam</p>
                    <div className="flex gap-6">
                        <span className="text-xs text-[var(--theme-text-secondary)] font-semibold tracking-wider uppercase">Hostel Office — 1 Member</span>
                        <span className="text-xs text-[var(--theme-text-secondary)] font-semibold tracking-wider uppercase">System Stable</span>
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
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-xl p-6 shadow-xl overflow-hidden"
                        >
                            <h3 className="text-lg font-bold text-[var(--theme-text-primary)] mb-1.5 flex items-center gap-2">
                                <span className="w-1 h-5 bg-rose-500 rounded-full" />
                                Reason for Rejection <span className="text-rose-500">*</span>
                            </h3>
                            <p className="text-xs text-[var(--theme-text-secondary)] mb-4 font-normal">Please provide a clear reason for rejecting this request.</p>

                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Enter rejection reason..."
                                className="w-full h-28 bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-lg p-3 text-xs text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)] focus:outline-none focus:border-[var(--color-danger)]/50 resize-none transition-all"
                            />

                            <div className="flex items-center justify-end gap-3 mt-6">
                                <button
                                    disabled={isRejecting}
                                    onClick={() => !isRejecting && setIsRejectModalOpen(false)}
                                    className="px-4 py-2 rounded-lg font-semibold tracking-wider uppercase text-xs text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                themeColor="violet"
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
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md min-h-[320px] flex flex-col bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-2xl overflow-hidden"
                        >
                            <h3 className="text-lg font-bold text-[var(--theme-btn-primary)] mb-2 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-[var(--theme-btn-primary)] rounded-full" />
                                Request Reason
                            </h3>
                            <div className="flex-1 text-sm text-[var(--theme-text-secondary)] leading-relaxed font-normal bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl p-4 max-h-[60vh] overflow-y-auto">
                                {selectedReason}
                            </div>
                            <div className="flex justify-end mt-6">
                                <button
                                    onClick={() => setSelectedReason(null)}
                                    className="px-4 py-2 rounded-xl bg-[var(--theme-btn-primary)] text-white text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all"
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

export default HostelOffice;
