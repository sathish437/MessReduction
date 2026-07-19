import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdSearch, MdFilterList, MdCheckCircle, MdCancel,
  MdRefresh, MdExpandMore, MdExpandLess
} from 'react-icons/md';
import { FiCalendar, FiUser, FiHash } from 'react-icons/fi';
import apiClient from './api/apiClient';

const STATUS_CONFIG = {
  Approved:              { label: 'Approved',        cls: 'bg-green-500/10 text-green-400 border-green-500/20' },
  PendingDeputyWarden:   { label: 'Pending Deputy',  cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  PendingWarden:         { label: 'Pending Warden',  cls: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  PendingOffice:         { label: 'Pending Office',  cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  RejectedDeputyWarden:  { label: 'Rejected',        cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
  RejectedWarden:        { label: 'Rejected',        cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
  RejectedOffice:        { label: 'Rejected',        cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20' };
  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS'];

const AdminRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Expanded row detail
  const [expandedRow, setExpandedRow] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (deptFilter) params.department = deptFilter;

      const response = await apiClient.get('/api/admin/requests', { params });
      setRequests(response.data.content || []);
      setTotalPages(response.data.totalPages || 0);
      setTotalElements(response.data.totalElements || 0);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, [page, size, search, statusFilter, deptFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchRequests, 400);
    return () => clearTimeout(timer);
  }, [fetchRequests]);

  const handleForceApprove = async (id) => {
    if (!window.confirm('Force APPROVE this request? This overrides the normal workflow.')) return;
    try {
      await apiClient.post(`/api/admin/requests/${id}/force-approve`);
      fetchRequests();
    } catch {
      alert('Failed to force approve.');
    }
  };

  const handleForceReject = async (id) => {
    if (!window.confirm('Force REJECT this request?')) return;
    try {
      await apiClient.post(`/api/admin/requests/${id}/force-reject`);
      fetchRequests();
    } catch {
      alert('Failed to force reject.');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const formatDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setDeptFilter('');
    setPage(0);
  };

  return (
    <div className="flex flex-col space-y-4 h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Request Management</h2>
          <p className="text-xs text-gray-500 mt-1">{totalElements} total requests</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-all ${showFilters ? 'border-red-500 text-red-400 bg-red-500/10' : 'admin-border text-gray-400 hover:text-white bg-[#161616]'}`}
          >
            <MdFilterList size={18} />
            Filters
            {showFilters ? <MdExpandLess size={16} /> : <MdExpandMore size={16} />}
          </button>
          <button
            onClick={fetchRequests}
            className="flex items-center gap-2 px-3 py-2 bg-[#161616] border admin-border rounded-xl text-sm text-gray-400 hover:text-white hover:border-red-500 transition-all"
          >
            <MdRefresh size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Search Bar always visible */}
      <div className="relative">
        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
        <input
          type="text"
          placeholder="Search by student name or register number..."
          className="w-full bg-[#161616] border admin-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-red-500 transition-colors"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        />
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[#161616] border admin-border rounded-xl p-4 flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs text-gray-500 mb-1.5">Status</label>
                <select
                  className="w-full bg-[#0A0A0A] border admin-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                >
                  <option value="">All Statuses</option>
                  <option value="PendingDeputyWarden">Pending Deputy Warden</option>
                  <option value="PendingWarden">Pending Warden</option>
                  <option value="PendingOffice">Pending Office</option>
                  <option value="Approved">Approved</option>
                  <option value="RejectedDeputyWarden">Rejected by Deputy</option>
                  <option value="RejectedWarden">Rejected by Warden</option>
                  <option value="RejectedOffice">Rejected by Office</option>
                </select>
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs text-gray-500 mb-1.5">Department</label>
                <select
                  className="w-full bg-[#0A0A0A] border admin-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  value={deptFilter}
                  onChange={(e) => { setDeptFilter(e.target.value); setPage(0); }}
                >
                  <option value="">All Departments</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-xs text-gray-400 hover:text-white border admin-border rounded-lg hover:border-red-500 transition-all"
              >
                Reset Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="flex-1 bg-[#161616] border admin-border rounded-xl overflow-hidden flex flex-col shadow-lg shadow-black/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#0A0A0A] sticky top-0 z-10 border-b admin-border">
              <tr>
                <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Student</th>
                <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Dept / Year</th>
                <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Leave Period</th>
                <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Days</th>
                <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Reason</th>
                <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Submitted</th>
                <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y admin-border">
              {loading ? (
                Array(5).fill(null).map((_, i) => (
                  <tr key={i}>
                    {Array(9).fill(null).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 bg-gray-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-16 text-center text-gray-500">
                    <MdSearch size={36} className="mx-auto mb-3 opacity-30" />
                    No requests match the current filters.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <React.Fragment key={req.formId}>
                    <tr
                      className="hover:bg-[#1c1c1c] transition-colors group cursor-pointer"
                      onClick={() => setExpandedRow(expandedRow === req.formId ? null : req.formId)}
                    >
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">#{req.formId}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-200">{req.name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <FiHash size={10} />{req.registerNo}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">{req.department}</span>
                        <div className="text-xs text-gray-500 mt-1">Year {req.year}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-300 text-xs">{formatDate(req.leaveDate)}</div>
                        <div className="text-gray-500 text-xs">→ {formatDate(req.arrivalDate)}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-300 font-semibold">{req.totalHolidays}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs max-w-[140px] truncate" title={req.reason}>{req.reason}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDateTime(req.submittedAt)}</td>
                      <td className="px-4 py-3"><StatusBadge status={req.currentStatus} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {req.currentStatus !== 'Approved' && !req.currentStatus?.includes('Rejected') && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleForceApprove(req.formId); }}
                              className="flex items-center gap-1 px-2.5 py-1 bg-green-900/30 hover:bg-green-600/40 text-green-400 rounded-lg text-xs border border-green-500/30 transition-colors"
                            >
                              <MdCheckCircle size={14} /> Approve
                            </button>
                          )}
                          {!req.currentStatus?.includes('Rejected') && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleForceReject(req.formId); }}
                              className="flex items-center gap-1 px-2.5 py-1 bg-red-900/30 hover:bg-red-600/40 text-red-400 rounded-lg text-xs border border-red-500/30 transition-colors"
                            >
                              <MdCancel size={14} /> Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* Expanded detail row */}
                    <AnimatePresence>
                      {expandedRow === req.formId && (
                        <tr>
                          <td colSpan="9" className="bg-[#0f0f0f] border-b admin-border">
                            <motion.div
                              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs overflow-hidden"
                            >
                              <div><span className="text-gray-500 block mb-1">Roll No</span><span className="text-gray-200">{req.rollNo || '—'}</span></div>
                              <div><span className="text-gray-500 block mb-1">Room No</span><span className="text-gray-200">{req.roomNo}</span></div>
                              <div><span className="text-gray-500 block mb-1">Assigned Deputy</span><span className="text-gray-200">{req.assignedDeputyWarden || '—'}</span></div>
                              <div><span className="text-gray-500 block mb-1">Gender</span><span className="text-gray-200">{req.gender || '—'}</span></div>
                              <div><span className="text-gray-500 block mb-1">Leave Time</span><span className="text-gray-200">{req.leaveTime || '—'}</span></div>
                              <div><span className="text-gray-500 block mb-1">Arrival Time</span><span className="text-gray-200">{req.arrivalTime || '—'}</span></div>
                              {req.rejectReason && (
                                <div className="col-span-2">
                                  <span className="text-gray-500 block mb-1">Reject Reason</span>
                                  <span className="text-red-400">{req.rejectReason}</span>
                                </div>
                              )}
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t admin-border p-3 flex items-center justify-between bg-[#0A0A0A] text-sm flex-shrink-0">
          <div className="flex items-center gap-3 text-gray-500">
            <span>Rows:</span>
            <select
              className="bg-[#161616] border admin-border rounded px-2 py-1 text-xs outline-none"
              value={size}
              onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}
            >
              {[10, 25, 50].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="text-xs">{totalElements} total</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 border admin-border rounded hover:bg-[#202020] disabled:opacity-30 transition-colors text-xs"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0 || loading}
            >
              ← Prev
            </button>
            <span className="text-xs text-gray-400 px-2">Page {page + 1} of {Math.max(1, totalPages)}</span>
            <button
              className="px-3 py-1 border admin-border rounded hover:bg-[#202020] disabled:opacity-30 transition-colors text-xs"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages - 1 || loading}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRequests;
