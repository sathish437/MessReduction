import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MdSearch, MdCheckCircle, MdCancel, MdVisibility, MdPendingActions
} from 'react-icons/md';
import apiClient from './api/apiClient';
import { getActiveDepartments } from './api/departmentService';
import Toast from './components/Toast';
import ConfirmModal from './components/ConfirmModal';

const AdminExtraSubmissions = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeDepts, setActiveDepts] = useState([]);

  useEffect(() => {
    getActiveDepartments().then(depts => {
      if (Array.isArray(depts)) {
        setActiveDepts(depts);
      }
    });
  }, []);
  
  // Client-side pagination and filtering
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  
  // Details Modal
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Toast State
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/admin/extra-submissions');
      setRequests(response.data || []);
    } catch (error) {
      showToast('Error fetching extra submissions', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: "Confirm Action",
    message: "",
    confirmText: "Confirm",
    confirmVariant: "danger",
    onConfirm: null
  });

  const handleAction = (id, action) => {
    const isApprove = action === 'approve';
    setConfirmState({
      isOpen: true,
      title: isApprove ? "Approve Extra Submission" : "Reject Extra Submission",
      message: `Are you sure you want to ${isApprove ? 'approve' : 'reject'} this extra submission request?`,
      confirmText: isApprove ? "Approve" : "Reject",
      confirmVariant: isApprove ? "primary" : "danger",
      onConfirm: () => executeAction(id, action)
    });
  };

  const executeAction = async (id, action) => {
    setConfirmState(prev => ({ ...prev, isOpen: false }));
    const isApprove = action === 'approve';
    try {
      await apiClient.post(`/api/admin/extra-submissions/${id}/${action}`);
      showToast(`Request ${isApprove ? 'approved' : 'rejected'} successfully`, 'success');
      fetchRequests();
      if (showDetails) setShowDetails(false);
    } catch (error) {
      showToast(`Error ${isApprove ? 'approving' : 'rejecting'} request: ` + (error.response?.data?.message || 'Unknown error'), 'error');
    }
  };

  const handleBulkAction = (action) => {
    if (selectedIds.length === 0) return;
    const isApprove = action === 'approve';
    setConfirmState({
      isOpen: true,
      title: isApprove ? "Bulk Approve Extra Submissions" : "Bulk Reject Extra Submissions",
      message: `Are you sure you want to bulk ${isApprove ? 'approve' : 'reject'} ${selectedIds.length} selected requests?`,
      confirmText: isApprove ? "Bulk Approve" : "Bulk Reject",
      confirmVariant: isApprove ? "primary" : "danger",
      onConfirm: () => executeBulkAction(action)
    });
  };

  const executeBulkAction = async (action) => {
    setConfirmState(prev => ({ ...prev, isOpen: false }));
    const isApprove = action === 'approve';
    try {
      await apiClient.post(`/api/admin/extra-submissions/bulk-${action}`, selectedIds);
      showToast(`Bulk ${isApprove ? 'approval' : 'rejection'} completed successfully`, 'success');
      setSelectedIds([]);
      fetchRequests();
    } catch (error) {
      showToast(`Error bulk ${isApprove ? 'approving' : 'rejecting'}: ` + (error.response?.data?.message || 'Unknown error'), 'error');
    }
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  // Client-side filtering
  const filteredRequests = requests.filter(req => {
    const s = search.toLowerCase();
    const matchesSearch = !search || (
      req.studentDetails?.name?.toLowerCase().includes(s) ||
      req.studentDetails?.registerNo?.toLowerCase().includes(s) ||
      req.studentDetails?.rollNo?.toLowerCase().includes(s) ||
      req.studentDetails?.department?.toLowerCase().includes(s)
    );
    const matchesDept = !selectedDept || req.studentDetails?.department === selectedDept;
    
    return matchesSearch && matchesDept;
  });

  // Client-side sorting
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    let valA, valB;
    
    switch (sortBy) {
      case 'name': valA = a.studentDetails?.name; valB = b.studentDetails?.name; break;
      case 'registerNo': valA = a.studentDetails?.registerNo; valB = b.studentDetails?.registerNo; break;
      case 'department': valA = a.studentDetails?.department; valB = b.studentDetails?.department; break;
      case 'count': valA = a.studentDetails?.dailySubmissionCount; valB = b.studentDetails?.dailySubmissionCount; break;
      case 'status': valA = a.status; valB = b.status; break;
      case 'createdAt': default: valA = new Date(a.createdAt).getTime(); valB = new Date(b.createdAt).getTime(); break;
    }

    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  // Client-side pagination
  const totalPages = Math.ceil(sortedRequests.length / size);
  const currentRequests = sortedRequests.slice(page * size, (page + 1) * size);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING': return <span className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/30 inline-flex items-center gap-1">Pending</span>;
      case 'APPROVED': return <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/30 inline-flex items-center gap-1">Approved</span>;
      case 'REJECTED': return <span className="px-3 py-1 rounded-xl bg-rose-500/10 text-rose-400 text-xs font-bold border border-rose-500/30 inline-flex items-center gap-1">Rejected</span>;
      default: return <span className="px-3 py-1 rounded-xl bg-slate-500/10 text-[var(--color-text-secondary)] text-xs font-bold border border-slate-500/30">{status}</span>;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  return (
    <div className="flex flex-col h-full space-y-4 min-w-0 w-full relative">
      {/* Toast Notification Panel */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3.5 sm:gap-4 w-full">
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--color-text-primary)]">Extra Submission Requests</h2>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" size={20} />
            <input 
              type="text"
              placeholder="Search Name, Reg No, Dept..."
              className="w-full h-11 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl pl-10 pr-4 text-xs sm:text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all shadow-sm"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); setSelectedIds([]); }}
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select 
              value={selectedDept}
              onChange={(e) => { setSelectedDept(e.target.value); setPage(0); setSelectedIds([]); }}
              className="h-11 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 text-xs sm:text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all shadow-sm cursor-pointer w-full sm:w-auto"
            >
              <option value="">All Departments</option>
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
        </div>
      </div>

      {/* Bulk Actions Banner */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-between gap-3 bg-purple-500/10 border border-purple-500/30 p-3.5 rounded-2xl text-purple-300"
          >
            <span className="text-xs sm:text-sm font-bold">{selectedIds.length} requests selected</span>
            <div className="flex gap-2">
              <button onClick={() => handleBulkAction('approve')} className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer">
                Approve Selected
              </button>
              <button onClick={() => handleBulkAction('reject')} className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer">
                Reject Selected
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Data Table Container */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-soft flex flex-col min-w-0 w-full">
        <div className="overflow-x-auto select-none w-full">
          <table className="w-full text-left text-xs sm:text-sm min-w-[750px] border-collapse">
            <thead className="bg-[var(--color-primary-bg)] border-b border-[var(--color-border)] text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              <tr>
                <th className="px-4 py-3.5 w-12 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-[var(--color-border)] bg-[var(--color-surface)] text-purple-600 focus:ring-purple-500 cursor-pointer w-4 h-4"
                    checked={currentRequests.length > 0 && selectedIds.length === currentRequests.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(currentRequests.map(r => r.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                  />
                </th>
                <th className="px-4 py-3.5 cursor-pointer hover:text-[var(--color-text-primary)] transition-colors" onClick={() => handleSort('registerNo')}>Reg No {sortBy === 'registerNo' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                <th className="px-4 py-3.5 cursor-pointer hover:text-[var(--color-text-primary)] transition-colors" onClick={() => handleSort('name')}>Student {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                <th className="px-4 py-3.5 cursor-pointer hover:text-[var(--color-text-primary)] transition-colors" onClick={() => handleSort('department')}>Dept {sortBy === 'department' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                <th className="px-4 py-3.5 cursor-pointer hover:text-[var(--color-text-primary)] transition-colors" onClick={() => handleSort('count')}>Submissions Today {sortBy === 'count' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                <th className="px-4 py-3.5 cursor-pointer hover:text-[var(--color-text-primary)] transition-colors" onClick={() => handleSort('createdAt')}>Requested At {sortBy === 'createdAt' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                <th className="px-4 py-3.5 cursor-pointer hover:text-[var(--color-text-primary)] transition-colors" onClick={() => handleSort('status')}>Status {sortBy === 'status' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                <th className="px-4 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-[var(--color-text-secondary)] font-medium">
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading requests...
                  </td>
                </tr>
              ) : currentRequests.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-[var(--color-text-secondary)] font-medium">No requests found.</td>
                </tr>
              ) : (
                currentRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-[var(--color-card)]/50 transition-colors">
                    <td className="px-4 py-3.5 text-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-[var(--color-border)] bg-[var(--color-surface)] text-purple-600 focus:ring-purple-500 cursor-pointer w-4 h-4"
                        checked={selectedIds.includes(req.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(prev => [...prev, req.id]);
                          } else {
                            setSelectedIds(prev => prev.filter(id => id !== req.id));
                          }
                        }}
                      />
                    </td>
                    <td className="px-4 py-3.5 font-bold font-mono text-[var(--color-text-primary)]">{req.studentDetails?.registerNo}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-600/10 border border-purple-600/20 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {req.studentDetails?.name?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-[var(--color-text-primary)]">{req.studentDetails?.name}</div>
                          <div className="text-xs text-[var(--color-text-secondary)] font-normal">{req.studentDetails?.rollNo}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 rounded-lg bg-[var(--color-primary-bg)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text-primary)]">
                        {req.studentDetails?.department}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--color-text-primary)] font-bold">
                      {req.studentDetails?.dailySubmissionCount || 0} / 3
                    </td>
                    <td className="px-4 py-3.5 text-[var(--color-text-secondary)] font-mono text-xs font-medium">
                      {formatDate(req.createdAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => { setSelectedRequest(req); setShowDetails(true); }}
                          className="w-9 h-9 bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                          title="View Details"
                        >
                          <MdVisibility size={18} />
                        </button>
                        {req.status === 'PENDING' && (
                           <>
                             <button 
                               onClick={() => handleAction(req.id, 'approve')}
                               className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                               title="Approve"
                             >
                               <MdCheckCircle size={18} />
                             </button>
                             <button 
                               onClick={() => handleAction(req.id, 'reject')}
                               className="w-9 h-9 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                               title="Reject"
                             >
                               <MdCancel size={18} />
                             </button>
                           </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-[var(--color-border)] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[var(--color-surface)] w-full">
          <div className="flex items-center gap-3 text-xs sm:text-sm text-[var(--color-text-secondary)] font-semibold">
            <span>Rows per page:</span>
            <select 
              className="bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-xl px-2.5 py-1.5 outline-none focus:border-purple-500 text-xs font-bold text-[var(--color-text-primary)] cursor-pointer"
              value={size}
              onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button 
              className="px-4 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-primary-bg)] hover:bg-[var(--color-card)] disabled:opacity-50 transition-all text-xs font-bold cursor-pointer"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              Previous
            </button>
            <span className="text-sm px-2">Page {page + 1} of {Math.max(1, totalPages)}</span>
            <button 
              className="px-3 py-1 border border-[var(--color-border)] rounded hover:bg-[var(--color-card)] disabled:opacity-50 transition-colors text-sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages - 1}
            >
              Next
            </button>
          </div>
        </div>
      </div>
      
      {/* Details Dialog */}
      {showDetails && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-3xl max-h-[90vh] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden flex flex-col shadow-2xl"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-surface)]">
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Request Details</h3>
              <button 
                onClick={() => setShowDetails(false)} 
                className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-primary-bg)] transition-colors text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-[var(--color-surface)] space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Student Information */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 pb-2 border-b border-[var(--color-border)]">
                    Student Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-2 border-b border-[var(--color-border)]/40">
                      <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider min-w-[100px]">Name</span>
                      <span className="text-sm font-bold text-[var(--color-text-primary)]">{selectedRequest.studentDetails?.name || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-2 border-b border-[var(--color-border)]/40">
                      <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider min-w-[100px]">Register No</span>
                      <span className="text-sm font-bold text-[var(--color-text-primary)]">{selectedRequest.studentDetails?.registerNo || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-2 border-b border-[var(--color-border)]/40">
                      <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider min-w-[100px]">Roll No</span>
                      <span className="text-sm font-bold text-[var(--color-text-primary)]">{selectedRequest.studentDetails?.rollNo || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-2 border-b border-[var(--color-border)]/40">
                      <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider min-w-[100px]">Department</span>
                      <span className="text-sm font-bold text-[var(--color-text-primary)]">{selectedRequest.studentDetails?.department || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-2 border-b border-[var(--color-border)]/40">
                      <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider min-w-[100px]">Year</span>
                      <span className="text-sm font-bold text-[var(--color-text-primary)]">{selectedRequest.studentDetails?.currentYear || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Request Information */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 pb-2 border-b border-[var(--color-border)]">
                    Request Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-[var(--color-border)]/40">
                      <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider min-w-[110px]">Status</span>
                      <span>{getStatusBadge(selectedRequest.status)}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-2 border-b border-[var(--color-border)]/40">
                      <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider min-w-[110px]">Requested</span>
                      <span className="text-sm font-bold text-[var(--color-text-primary)]">{formatDate(selectedRequest.createdAt)}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-2 border-b border-[var(--color-border)]/40">
                      <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider min-w-[110px]">Submissions</span>
                      <span className="text-sm font-bold text-[var(--color-text-primary)]">{selectedRequest.studentDetails?.dailySubmissionCount || 0}</span>
                    </div>
                    {selectedRequest.approvedBy && (
                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-2 border-b border-[var(--color-border)]/40">
                        <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider min-w-[110px]">Action By</span>
                        <span className="text-sm font-bold text-[var(--color-text-primary)]">{selectedRequest.approvedBy}</span>
                      </div>
                    )}
                    {selectedRequest.approvedAt && (
                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-2 border-b border-[var(--color-border)]/40">
                        <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider min-w-[110px]">Action Time</span>
                        <span className="text-sm font-bold text-[var(--color-text-primary)]">{formatDate(selectedRequest.approvedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Reason Section */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400">Reason for Extra Submission</h4>
                <div className="bg-[var(--color-primary-bg)] p-4 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-primary)] leading-relaxed">
                  {selectedRequest.reason}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[var(--color-border)] flex items-center justify-end gap-3 bg-[var(--color-surface)]">
              {selectedRequest.status === 'PENDING' && (
                <>
                  <button 
                    onClick={() => handleAction(selectedRequest.id, 'reject')}
                    className="px-4 py-2 border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => handleAction(selectedRequest.id, 'approve')}
                    className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md"
                  >
                    Approve
                  </button>
                </>
              )}
              <button 
                onClick={() => setShowDetails(false)} 
                className="px-5 py-2 rounded-xl bg-[var(--color-primary-bg)] border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-purple-500/40 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        confirmVariant={confirmState.confirmVariant}
        onConfirm={confirmState.onConfirm}
        onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default AdminExtraSubmissions;
