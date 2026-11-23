import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdSearch, MdCheckCircle, MdCancel, MdVisibility, MdPendingActions
} from 'react-icons/md';
import apiClient from './api/apiClient';
import { getActiveDepartments } from './api/departmentService';
import Toast from './components/Toast';
import ConfirmModal from './components/ConfirmModal';
import BulkOperationProgress from './components/BulkOperationProgress';
import useBulkOperation from './hooks/useBulkOperation';

const AdminExtraSubmissions = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeDepts, setActiveDepts] = useState([]);

  const {
    bulkState,
    isBulkProcessing,
    startBulkOperation,
    completeSuccess,
    completePartial,
    completeFailure,
    closeProgress
  } = useBulkOperation();

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

  // Modal States
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Toast State
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Confirmation Modal State
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    confirmVariant: "primary",
    onConfirm: () => {}
  });

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/admin/extra-submissions');
      setRequests(res.data || []);
    } catch (error) {
      showToast('Error fetching extra submission requests', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSelectAll = (e) => {
    if (isBulkProcessing) return;
    if (e.target.checked) {
      setSelectedIds(filteredRequests.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    if (isBulkProcessing) return;
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleAction = (id, action) => {
    const isApprove = action === 'approve';
    setConfirmState({
      isOpen: true,
      title: isApprove ? "Approve Extra Submission" : "Reject Extra Submission",
      message: `Are you sure you want to ${action} this extra submission request?`,
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
    if (selectedIds.length === 0 || isBulkProcessing) return;
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
    if (selectedIds.length === 0 || isBulkProcessing) return;
    setConfirmState(prev => ({ ...prev, isOpen: false }));
    const isApprove = action === 'approve';
    const opType = isApprove ? 'APPROVE' : 'REJECT';
    const idsToProcess = [...selectedIds];
    startBulkOperation(opType, idsToProcess.length, isApprove ? 'Approving Requests...' : 'Rejecting Requests...');

    try {
      await apiClient.post(`/api/admin/extra-submissions/bulk-${action}`, idsToProcess);
      setSelectedIds([]);
      completeSuccess(idsToProcess.length, idsToProcess.length);
      showToast(`Bulk ${isApprove ? 'approval' : 'rejection'} completed successfully`, 'success');
      fetchRequests();
    } catch (error) {
      const errorMsg = error.response?.data?.message || `Error bulk ${isApprove ? 'approving' : 'rejecting'}`;
      completeFailure(errorMsg);
      showToast(errorMsg, 'error');
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
      case 'PENDING': return <span className="badge badge-warning">Pending</span>;
      case 'APPROVED': return <span className="badge badge-success">Approved</span>;
      case 'REJECTED': return <span className="badge badge-danger">Rejected</span>;
      default: return <span className="badge badge-neutral">{status}</span>;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full space-y-4 min-w-0 w-full relative">
      {/* Toast Notification Panel */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">Extra submissions</h1>
          <p className="page-subtitle">Student requests for an additional submission beyond the daily limit.</p>
        </div>
        <span className="badge badge-warning self-start sm:self-auto">
          {requests.filter(r => r.status === 'PENDING').length} pending
        </span>
      </div>

      {/* Filters */}
      <div className="panel p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="field-shell flex-1">
            <MdSearch size={16} style={{ color: 'var(--theme-text-faint)' }} />
            <input
              type="text"
              placeholder="Search name, register no or department"
              className="w-full flex-1 bg-transparent text-[13px] font-medium focus:outline-none"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); setSelectedIds([]); }}
            />
          </div>

          <label className="sr-only" htmlFor="extra-dept-filter">Department</label>
          <select
            id="extra-dept-filter"
            value={selectedDept}
            onChange={(e) => { setSelectedDept(e.target.value); setPage(0); setSelectedIds([]); }}
            className="h-9 min-h-0 py-0 text-[12px] font-medium lg:w-60"
          >
            <option value="">All departments</option>
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

      {/* Bulk Actions Banner */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col items-stretch justify-between gap-3 rounded-[var(--radius-lg)] p-3.5 sm:flex-row sm:items-center"
            style={{
              background: 'var(--theme-card)',
              border: '1px solid var(--color-accent)',
              boxShadow: 'var(--shadow-raised)'
            }}
          >
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-7 min-w-7 items-center justify-center rounded-[6px] px-1.5 text-[11.5px] font-semibold text-white"
                style={{ background: 'var(--theme-btn-primary)' }}
              >
                {selectedIds.length}
              </span>
              <span className="text-[12.5px] font-medium text-[var(--theme-text-primary)]">
                {selectedIds.length === 1 ? 'request selected' : 'requests selected'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleBulkAction('approve')} className="btn btn-primary flex-1 sm:flex-none">
                <MdCheckCircle size={15} /> Approve
              </button>
              <button onClick={() => handleBulkAction('reject')} className="btn btn-danger flex-1 sm:flex-none">
                <MdCancel size={15} /> Reject
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Data Table Container */}
      <div className="panel overflow-hidden">
        {!loading && currentRequests.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <MdPendingActions size={20} style={{ color: 'var(--color-accent)' }} />
            </div>
            <h3 className="text-[14px] font-semibold text-[var(--theme-text-primary)]">No requests found</h3>
            <p className="max-w-xs text-xs text-[var(--theme-text-secondary)]">
              No extra submission request matches the current filters.
            </p>
          </div>
        )}
        <div className={`select-none overflow-x-auto ${!loading && currentRequests.length === 0 ? 'hidden' : ''}`}>
          <table className="data-table min-w-[820px]">
            <thead>
              <tr>
                <th className="w-12 text-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 cursor-pointer accent-[var(--theme-btn-primary)]"
                    checked={currentRequests.length > 0 && selectedIds.length === currentRequests.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(currentRequests.map(r => r.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                    aria-label="Select all requests on this page"
                  />
                </th>
                {[
                  { key: 'registerNo', label: 'Reg no' },
                  { key: 'name', label: 'Student' },
                  { key: 'department', label: 'Dept' },
                  { key: 'count', label: 'Submissions today' },
                  { key: 'createdAt', label: 'Requested at' },
                  { key: 'status', label: 'Status' }
                ].map(col => (
                  <th
                    key={col.key}
                    className="cursor-pointer select-none transition-colors hover:text-[var(--theme-text-primary)]"
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}{' '}
                    <span className="text-[10px] text-[var(--theme-text-faint)]">
                      {sortBy === col.key ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                    </span>
                  </th>
                ))}
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan="8">
                      <div className="skeleton my-1.5 h-9 w-full" />
                    </td>
                  </tr>
                ))
              ) : currentRequests.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <MdPendingActions size={20} style={{ color: 'var(--color-accent)' }} />
                      </div>
                      <h3 className="text-[14px] font-semibold text-[var(--theme-text-primary)]">No requests found</h3>
                      <p className="max-w-xs text-xs text-[var(--theme-text-secondary)]">
                        No extra submission request matches the current filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentRequests.map((req) => (
                  <tr key={req.id}>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 cursor-pointer accent-[var(--theme-btn-primary)]"
                        checked={selectedIds.includes(req.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(prev => [...prev, req.id]);
                          } else {
                            setSelectedIds(prev => prev.filter(id => id !== req.id));
                          }
                        }}
                        aria-label={`Select ${req.studentDetails?.name || 'request'}`}
                      />
                    </td>
                    <td className="whitespace-nowrap">
                      <span className="font-mono text-[11.5px] font-medium text-[var(--theme-text-secondary)]">{req.studentDetails?.registerNo}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11.5px] font-semibold"
                          style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}
                        >
                          {req.studentDetails?.name?.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-[var(--theme-text-primary)]">{req.studentDetails?.name}</p>
                          <p className="truncate font-mono text-[11px] text-[var(--theme-text-secondary)]">{req.studentDetails?.rollNo}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{req.studentDetails?.department}</span>
                    </td>
                    <td className="whitespace-nowrap text-[12.5px] font-semibold text-[var(--theme-text-primary)]">
                      {req.studentDetails?.dailySubmissionCount || 0} / 3
                    </td>
                    <td className="whitespace-nowrap">
                      <span className="font-mono text-[11.5px] font-medium text-[var(--theme-text-secondary)]">{formatDate(req.createdAt)}</span>
                    </td>
                    <td>{getStatusBadge(req.status)}</td>
                    <td>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => { setSelectedRequest(req); setShowDetails(true); }}
                          className="flex h-7 w-7 items-center justify-center rounded-[6px] border transition-colors"
                          style={{ background: 'var(--color-accent-soft)', borderColor: 'var(--color-accent-border)', color: 'var(--color-accent)' }}
                          title="View details"
                        >
                          <MdVisibility size={15} />
                        </button>
                        {req.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleAction(req.id, 'approve')}
                              className="flex h-7 w-7 items-center justify-center rounded-[6px] border transition-colors"
                              style={{ background: 'var(--color-success-soft)', borderColor: 'var(--color-success-border)', color: 'var(--color-success)' }}
                              title="Approve"
                            >
                              <MdCheckCircle size={15} />
                            </button>
                            <button
                              onClick={() => handleAction(req.id, 'reject')}
                              className="flex h-7 w-7 items-center justify-center rounded-[6px] border transition-colors"
                              style={{ background: 'var(--color-danger-soft)', borderColor: 'var(--color-danger-border)', color: 'var(--color-danger)' }}
                              title="Reject"
                            >
                              <MdCancel size={15} />
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
        <div className="flex flex-col items-center justify-between gap-3 border-t border-[var(--theme-border)] bg-[var(--theme-card)] px-4 py-3 sm:flex-row">
          <div className="flex items-center gap-2 text-[11.5px] text-[var(--theme-text-secondary)]">
            <span>Rows per page</span>
            <select
              className="h-8 min-h-0 py-0 text-[12px] font-medium"
              style={{ width: 'auto' }}
              value={size}
              onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}
              aria-label="Rows per page"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-secondary h-8 px-3 text-[12px]" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>
              Previous
            </button>
            <span className="text-[11.5px] font-medium text-[var(--theme-text-secondary)]">
              Page <span className="font-semibold text-[var(--theme-text-primary)]">{page + 1}</span> of {Math.max(1, totalPages)}
            </span>
            <button className="btn btn-secondary h-8 px-3 text-[12px]" onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1}>
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Details Dialog */}
      {showDetails && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 backdrop-blur-[2px]"
            style={{ background: 'rgba(11, 23, 40, 0.55)' }}
            onClick={() => setShowDetails(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[var(--radius-lg)]"
            style={{
              background: 'var(--theme-card)',
              border: '1px solid var(--theme-border)',
              boxShadow: 'var(--shadow-modal)'
            }}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-[var(--theme-border)] px-6 py-4">
              <div>
                <h3 className="text-[15px] font-semibold text-[var(--theme-text-primary)]">Request details</h3>
                <p className="mt-0.5 text-xs text-[var(--theme-text-secondary)]">
                  {selectedRequest.studentDetails?.name} · {selectedRequest.studentDetails?.registerNo}
                </p>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                aria-label="Close"
                className="rounded-[var(--radius-sm)] p-1.5 text-[var(--theme-text-faint)] transition-colors hover:bg-[var(--theme-bg-soft)] hover:text-[var(--theme-text-primary)]"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Student Information */}
                <div className="space-y-3">
                  <h4 className="section-label" style={{ color: 'var(--color-accent)' }}>Student information</h4>
                  <div className="space-y-2.5">
                    <div className="flex flex-col justify-between gap-1 border-b border-[var(--theme-border)] pb-2 sm:flex-row sm:items-baseline">
                      <span className="min-w-[100px] text-[10.5px] font-medium uppercase tracking-wide text-[var(--theme-text-faint)]">Name</span>
                      <span className="text-[13px] font-semibold text-[var(--theme-text-primary)]">{selectedRequest.studentDetails?.name || '—'}</span>
                    </div>
                    <div className="flex flex-col justify-between gap-1 border-b border-[var(--theme-border)] pb-2 sm:flex-row sm:items-baseline">
                      <span className="min-w-[100px] text-[10.5px] font-medium uppercase tracking-wide text-[var(--theme-text-faint)]">Register no</span>
                      <span className="font-mono text-[12.5px] font-medium text-[var(--theme-text-primary)]">{selectedRequest.studentDetails?.registerNo || '—'}</span>
                    </div>
                    <div className="flex flex-col justify-between gap-1 border-b border-[var(--theme-border)] pb-2 sm:flex-row sm:items-baseline">
                      <span className="min-w-[100px] text-[10.5px] font-medium uppercase tracking-wide text-[var(--theme-text-faint)]">Roll no</span>
                      <span className="font-mono text-[12.5px] font-medium text-[var(--theme-text-primary)]">{selectedRequest.studentDetails?.rollNo || '—'}</span>
                    </div>
                    <div className="flex flex-col justify-between gap-1 border-b border-[var(--theme-border)] pb-2 sm:flex-row sm:items-baseline">
                      <span className="min-w-[100px] text-[10.5px] font-medium uppercase tracking-wide text-[var(--theme-text-faint)]">Department</span>
                      <span className="text-[13px] font-medium text-[var(--theme-text-primary)]">{selectedRequest.studentDetails?.department || '—'}</span>
                    </div>
                    <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline">
                      <span className="min-w-[100px] text-[10.5px] font-medium uppercase tracking-wide text-[var(--theme-text-faint)]">Year</span>
                      <span className="text-[13px] font-medium text-[var(--theme-text-primary)]">{selectedRequest.studentDetails?.currentYear || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Request Information */}
                <div className="space-y-3">
                  <h4 className="section-label" style={{ color: 'var(--color-accent)' }}>Request information</h4>
                  <div className="space-y-2.5">
                    <div className="flex flex-col justify-between gap-1 border-b border-[var(--theme-border)] pb-2 sm:flex-row sm:items-center">
                      <span className="min-w-[110px] text-[10.5px] font-medium uppercase tracking-wide text-[var(--theme-text-faint)]">Status</span>
                      <span>{getStatusBadge(selectedRequest.status)}</span>
                    </div>
                    <div className="flex flex-col justify-between gap-1 border-b border-[var(--theme-border)] pb-2 sm:flex-row sm:items-baseline">
                      <span className="min-w-[110px] text-[10.5px] font-medium uppercase tracking-wide text-[var(--theme-text-faint)]">Requested</span>
                      <span className="font-mono text-[11.5px] font-medium text-[var(--theme-text-secondary)]">{formatDate(selectedRequest.createdAt)}</span>
                    </div>
                    <div className="flex flex-col justify-between gap-1 border-b border-[var(--theme-border)] pb-2 sm:flex-row sm:items-baseline">
                      <span className="min-w-[110px] text-[10.5px] font-medium uppercase tracking-wide text-[var(--theme-text-faint)]">Submissions today</span>
                      <span className="text-[13px] font-semibold text-[var(--theme-text-primary)]">{selectedRequest.studentDetails?.dailySubmissionCount || 0}</span>
                    </div>
                    {selectedRequest.approvedBy && (
                      <div className="flex flex-col justify-between gap-1 border-b border-[var(--theme-border)] pb-2 sm:flex-row sm:items-baseline">
                        <span className="min-w-[110px] text-[10.5px] font-medium uppercase tracking-wide text-[var(--theme-text-faint)]">Action by</span>
                        <span className="text-[13px] font-medium text-[var(--theme-text-primary)]">{selectedRequest.approvedBy}</span>
                      </div>
                    )}
                    {selectedRequest.approvedAt && (
                      <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline">
                        <span className="min-w-[110px] text-[10.5px] font-medium uppercase tracking-wide text-[var(--theme-text-faint)]">Action time</span>
                        <span className="font-mono text-[11.5px] font-medium text-[var(--theme-text-secondary)]">{formatDate(selectedRequest.approvedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Reason Section */}
              <div className="space-y-2">
                <h4 className="section-label">Reason for extra submission</h4>
                <div
                  className="rounded-[var(--radius-md)] px-3.5 py-3 text-[13px] font-normal leading-relaxed text-[var(--theme-text-secondary)]"
                  style={{ background: 'var(--theme-card-muted)', border: '1px solid var(--theme-border)' }}
                >
                  {selectedRequest.reason}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className="flex items-center justify-end gap-2 px-6 py-3.5"
              style={{ borderTop: '1px solid var(--theme-border)', background: 'var(--theme-card-muted)' }}
            >
              {selectedRequest.status === 'PENDING' && (
                <>
                  <button onClick={() => handleAction(selectedRequest.id, 'reject')} className="btn btn-danger">
                    Reject
                  </button>
                  <button onClick={() => handleAction(selectedRequest.id, 'approve')} className="btn btn-primary">
                    Approve
                  </button>
                </>
              )}
              <button onClick={() => setShowDetails(false)} className="btn btn-secondary">
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

      {/* Bulk Operation Progress Modal */}
      <BulkOperationProgress
        isOpen={bulkState.isOpen}
        status={bulkState.status}
        operationType={bulkState.operationType}
        title={bulkState.title}
        total={bulkState.total}
        processed={bulkState.processed}
        successCount={bulkState.successCount}
        failedCount={bulkState.failedCount}
        error={bulkState.error}
        onClose={closeProgress}
      />
    </div>
  );
};

export default AdminExtraSubmissions;
