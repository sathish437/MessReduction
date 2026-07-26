import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MdSearch, MdCheckCircle, MdCancel, MdVisibility, MdPendingActions
} from 'react-icons/md';
import apiClient from './api/apiClient';

const AdminExtraSubmissions = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  
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

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/admin/extra-submissions');
      setRequests(response.data || []);
    } catch (error) {
      alert('Error fetching extra submissions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAction = async (id, action) => {
    const isApprove = action === 'approve';
    if (window.confirm(`Are you sure you want to ${isApprove ? 'approve' : 'reject'} this extra submission request?`)) {
      try {
        await apiClient.post(`/api/admin/extra-submissions/${id}/${action}`);
        fetchRequests(); // Refresh data
        if (showDetails) setShowDetails(false);
      } catch (error) {
        alert(`Error ${isApprove ? 'approving' : 'rejecting'} request: ` + (error.response?.data?.message || 'Unknown error'));
      }
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) return;
    const isApprove = action === 'approve';
    if (window.confirm(`Are you sure you want to bulk ${isApprove ? 'approve' : 'reject'} ${selectedIds.length} selected requests?`)) {
      try {
        await apiClient.post(`/api/admin/extra-submissions/bulk-${action}`, selectedIds);
        setSelectedIds([]);
        fetchRequests();
      } catch (error) {
        alert(`Error bulk ${isApprove ? 'approving' : 'rejecting'}: ` + (error.response?.data?.message || 'Unknown error'));
      }
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
      case 'PENDING': return <span className="px-2 py-1 rounded-md bg-yellow-500/20 text-yellow-500 text-xs font-medium border border-yellow-500/20">Pending</span>;
      case 'APPROVED': return <span className="px-2 py-1 rounded-md bg-green-500/20 text-green-500 text-xs font-medium border border-green-500/20">Approved</span>;
      case 'REJECTED': return <span className="px-2 py-1 rounded-md bg-red-500/20 text-red-500 text-xs font-medium border border-red-500/20">Rejected</span>;
      default: return <span className="px-2 py-1 rounded-md bg-gray-500/20 text-[var(--color-text-secondary)] text-xs font-medium border border-gray-500/20">{status}</span>;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  return (
    <div className="flex flex-col h-full space-y-4 min-w-0 w-full">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold">Extra Submission Requests</h2>
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="relative flex-1 md:w-64">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" size={20} />
            <input 
              type="text"
              placeholder="Search Name, Reg No, Roll No, Dept..."
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all duration-300 shadow-sm"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); setSelectedIds([]); }}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <select 
              value={selectedDept}
              onChange={(e) => { setSelectedDept(e.target.value); setPage(0); setSelectedIds([]); }}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all duration-300 shadow-sm"
            >
              <option value="">All Depts</option>
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="MECH">MECH</option>
              <option value="CIVIL">CIVIL</option>
              <option value="MECHATRONICS">MECHATRONICS</option>
            </select>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-4 bg-purple-500/10 border border-purple-500/20 p-3 rounded-xl"
          >
            <span className="text-sm font-semibold text-purple-400">{selectedIds.length} requests selected</span>
            <div className="flex gap-2">
              <button onClick={() => handleBulkAction('approve')} className="px-4 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-500 rounded-lg text-sm font-semibold transition-colors">
                Approve Selected
              </button>
              <button onClick={() => handleBulkAction('reject')} className="px-4 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-lg text-sm font-semibold transition-colors">
                Reject Selected
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Data Table */}
      <div className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden flex flex-col shadow-lg shadow-black/50 min-w-0 w-full">
        <div className="overflow-x-auto flex-1 relative">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[var(--color-primary-bg)] sticky top-0 z-10 shadow-sm border-b border-[var(--color-border)]">
              <tr>
                <th className="px-4 py-3">
                  <input 
                    type="checkbox" 
                    className="accent-purple-500 w-4 h-4 rounded border-gray-600 bg-[var(--color-surface)]"
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
                <th className="px-4 py-3 cursor-pointer hover:text-[var(--color-text-primary)] transition-colors" onClick={() => handleSort('registerNo')}>Reg No {sortBy === 'registerNo' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                <th className="px-4 py-3 cursor-pointer hover:text-[var(--color-text-primary)] transition-colors" onClick={() => handleSort('name')}>Student {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                <th className="px-4 py-3 cursor-pointer hover:text-[var(--color-text-primary)] transition-colors" onClick={() => handleSort('department')}>Dept {sortBy === 'department' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                <th className="px-4 py-3 cursor-pointer hover:text-[var(--color-text-primary)] transition-colors" onClick={() => handleSort('count')}>Submissions Today {sortBy === 'count' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                <th className="px-4 py-3 cursor-pointer hover:text-[var(--color-text-primary)] transition-colors" onClick={() => handleSort('createdAt')}>Requested At {sortBy === 'createdAt' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                <th className="px-4 py-3 cursor-pointer hover:text-[var(--color-text-primary)] transition-colors" onClick={() => handleSort('status')}>Status {sortBy === 'status' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y border-[var(--color-border)]">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-[var(--color-text-secondary)]">
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading requests...
                  </td>
                </tr>
              ) : currentRequests.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-[var(--color-text-secondary)]">No requests found.</td>
                </tr>
              ) : (
                currentRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-[var(--color-card)] transition-all duration-300 group hover:-translate-y-[1px] hover:shadow-[0_4px_15px_rgba(0,0,0,0.1)] relative z-0 hover:z-10">
                    <td className="px-4 py-3">
                      <input 
                        type="checkbox" 
                        className="accent-purple-500 w-4 h-4 rounded border-gray-600 bg-[var(--color-surface)]"
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
                    <td className="px-4 py-3 font-medium">{req.studentDetails?.registerNo}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-card)] flex items-center justify-center text-xs font-bold text-[var(--color-text-primary)]">
                          {req.studentDetails?.name?.charAt(0)}
                        </div>
                        <div>
                          <div>{req.studentDetails?.name}</div>
                          <div className="text-xs text-[var(--color-text-secondary)]">{req.studentDetails?.rollNo}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-md bg-[var(--color-card)] text-xs font-medium text-[var(--color-text-primary)]">
                        {req.studentDetails?.department}
                      </span>
                      <span className="ml-2 text-[var(--color-text-secondary)] text-xs">
                         {req.studentDetails?.currentYear ? `${req.studentDetails.currentYear} Yr` : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-primary)]">
                      <span className="font-bold text-[var(--color-text-primary)]">{req.studentDetails?.dailySubmissionCount || 0}</span> / 3
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                      {formatDate(req.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => { setSelectedRequest(req); setShowDetails(true); }}
                          className="p-1.5 hover:bg-gray-700 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                          title="View Details"
                        >
                          <MdVisibility size={18} />
                        </button>
                        {req.status === 'PENDING' && (
                           <>
                             <button 
                               onClick={() => handleAction(req.id, 'approve')}
                               className="p-1.5 hover:bg-green-500/20 rounded-lg text-green-500 hover:text-green-400 transition-colors"
                               title="Approve"
                             >
                               <MdCheckCircle size={18} />
                             </button>
                             <button 
                               onClick={() => handleAction(req.id, 'reject')}
                               className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-500 hover:text-red-400 transition-colors"
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
        <div className="border-t border-[var(--color-border)] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[var(--color-primary-bg)] min-w-0 w-full">
          <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
            <span>Rows per page:</span>
            <select 
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-1 outline-none focus:border-purple-500"
              value={size}
              onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button 
              className="px-3 py-1 border border-[var(--color-border)] rounded hover:bg-[var(--color-card)] disabled:opacity-50 transition-colors text-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="admin-card w-full max-w-2xl max-h-[90vh] rounded-2xl border border-[var(--color-border)] overflow-hidden flex flex-col shadow-2xl"
          >
            <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-primary-bg)]">
              <h3 className="text-xl font-bold">Request Details</h3>
              <button onClick={() => setShowDetails(false)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">✕</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-purple-500 font-bold mb-2">Student Information</h4>
                  <p><span className="text-[var(--color-text-secondary)]">Name:</span> {selectedRequest.studentDetails?.name}</p>
                  <p><span className="text-[var(--color-text-secondary)]">Register No:</span> {selectedRequest.studentDetails?.registerNo}</p>
                  <p><span className="text-[var(--color-text-secondary)]">Roll No:</span> {selectedRequest.studentDetails?.rollNo}</p>
                  <p><span className="text-[var(--color-text-secondary)]">Department:</span> {selectedRequest.studentDetails?.department}</p>
                  <p><span className="text-[var(--color-text-secondary)]">Year:</span> {selectedRequest.studentDetails?.currentYear}</p>
                </div>
                <div>
                  <h4 className="text-purple-500 font-bold mb-2">Request Information</h4>
                  <p><span className="text-[var(--color-text-secondary)]">Status:</span> {getStatusBadge(selectedRequest.status)}</p>
                  <p><span className="text-[var(--color-text-secondary)]">Requested:</span> {formatDate(selectedRequest.createdAt)}</p>
                  <p><span className="text-[var(--color-text-secondary)]">Current Submissions:</span> {selectedRequest.studentDetails?.dailySubmissionCount || 0}</p>
                  {selectedRequest.approvedBy && (
                    <p><span className="text-[var(--color-text-secondary)]">Action By:</span> {selectedRequest.approvedBy}</p>
                  )}
                  {selectedRequest.approvedAt && (
                    <p><span className="text-[var(--color-text-secondary)]">Action Time:</span> {formatDate(selectedRequest.approvedAt)}</p>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="text-purple-500 font-bold mb-2">Reason for Extra Submission</h4>
                <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] text-[var(--color-text-primary)]">
                  {selectedRequest.reason}
                </div>
              </div>

              {selectedRequest.status === 'PENDING' && (
                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                  <button 
                    onClick={() => handleAction(selectedRequest.id, 'reject')}
                    className="px-4 py-2 border border-purple-500/50 text-purple-500 rounded-lg hover:bg-purple-500/10 transition-colors font-medium"
                  >
                    Reject Request
                  </button>
                  <button 
                    onClick={() => handleAction(selectedRequest.id, 'approve')}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-[var(--color-text-primary)] rounded-lg transition-colors font-medium shadow-lg shadow-green-600/20"
                  >
                    Approve Request
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminExtraSubmissions;
