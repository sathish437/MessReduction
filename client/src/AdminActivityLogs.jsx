import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MdRefresh, MdPerson, MdAdminPanelSettings, MdHistory, MdSearch } from 'react-icons/md';
import { FiClock, FiUser, FiActivity } from 'react-icons/fi';
import apiClient from './api/apiClient';

const ACTION_CONFIG = {
  'FORM_SUBMITTED':      { color: 'text-blue-400',   bg: 'bg-blue-500/10',   label: 'Form Submitted' },
  'FORM_APPROVED':       { color: 'text-green-400',  bg: 'bg-green-500/10',  label: 'Approved' },
  'FORM_REJECTED':       { color: 'text-red-400',    bg: 'bg-red-500/10',    label: 'Rejected' },
  'FORM_FORWARDED':      { color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'Forwarded' },
  'FORM_RESUBMITTED':    { color: 'text-cyan-400',   bg: 'bg-cyan-500/10',   label: 'Resubmitted' },
  'EXTRA_APPROVED':      { color: 'text-emerald-400',bg: 'bg-emerald-500/10',label: 'Extra Approved' },
  'EXTRA_REJECTED':      { color: 'text-rose-400',   bg: 'bg-rose-500/10',   label: 'Extra Rejected' },
};

const ROLE_CONFIG = {
  ADMIN:         { icon: <MdAdminPanelSettings size={14} />, color: 'text-red-400',    bg: 'bg-red-500/10' },
  DeputyWarden:  { icon: <MdPerson size={14} />,             color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  Warden:        { icon: <MdPerson size={14} />,             color: 'text-orange-400', bg: 'bg-orange-500/10' },
  Office:        { icon: <MdPerson size={14} />,             color: 'text-blue-400',   bg: 'bg-blue-500/10' },
};

const formatDateTime = (ts) => {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const timeAgo = (ts) => {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const AdminActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/admin/logs', {
        params: { page, size: 25 }
      });
      const data = response.data;
      // Spring Page response
      const content = data.content || data;
      setLogs(Array.isArray(content) ? content : []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || (Array.isArray(content) ? content.length : 0));
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 60000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const filteredLogs = search
    ? logs.filter(log =>
        (log.staffName?.toLowerCase().includes(search.toLowerCase())) ||
        (log.studentName?.toLowerCase().includes(search.toLowerCase())) ||
        (log.action?.toLowerCase().includes(search.toLowerCase())) ||
        (log.department?.toLowerCase().includes(search.toLowerCase()))
      )
    : logs;

  const getActionCfg = (action) => ACTION_CONFIG[action] || { color: 'text-gray-400', bg: 'bg-gray-500/10', label: action };
  const getRoleCfg = (role) => ROLE_CONFIG[role] || { icon: <MdPerson size={14} />, color: 'text-gray-400', bg: 'bg-gray-500/10' };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Activity Logs</h2>
          <p className="text-xs text-gray-500 mt-1">{totalElements} total events • Auto-refreshes every 60s</p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 bg-[#161616] border admin-border rounded-xl text-sm text-gray-400 hover:text-white hover:border-red-500 transition-all"
        >
          <MdRefresh size={18} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
        <input
          type="text"
          placeholder="Filter by staff, student, action, department..."
          className="w-full bg-[#161616] border admin-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-red-500 transition-colors"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Timeline */}
      <div className="admin-card border admin-border rounded-2xl overflow-hidden shadow-lg shadow-black/40">
        {loading ? (
          <div className="divide-y admin-border">
            {Array(8).fill(null).map((_, i) => (
              <div key={i} className="flex gap-4 p-4 items-start">
                <div className="w-8 h-8 rounded-full bg-gray-800 animate-pulse flex-shrink-0 mt-1" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-800 rounded animate-pulse w-1/3" />
                  <div className="h-3 bg-gray-800 rounded animate-pulse w-1/2" />
                </div>
                <div className="h-3 w-16 bg-gray-800 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <FiActivity size={40} className="mb-4 opacity-30" />
            <p className="text-sm">No activity logs found.</p>
            <p className="text-xs mt-1 text-gray-600">Events will appear here as staff take actions.</p>
          </div>
        ) : (
          <div className="divide-y admin-border">
            {filteredLogs.map((log, index) => {
              const actionCfg = getActionCfg(log.action);
              const roleCfg = getRoleCfg(log.staffRole);
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="flex gap-4 px-5 py-4 hover:bg-[#111] transition-colors items-start group"
                >
                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${actionCfg.bg}`}>
                    <span className={actionCfg.color}>
                      <FiActivity size={14} />
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Staff who acted */}
                      {log.staffName && (
                        <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${roleCfg.bg} ${roleCfg.color}`}>
                          {roleCfg.icon}
                          {log.staffName}
                        </span>
                      )}
                      {/* Action */}
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border border-transparent ${actionCfg.bg} ${actionCfg.color}`}>
                        {actionCfg.label}
                      </span>
                      {/* Role */}
                      {log.staffRole && (
                        <span className="text-xs text-gray-600">{log.staffRole}</span>
                      )}
                    </div>

                    <div className="mt-1.5 text-xs text-gray-400">
                      {log.studentName && (
                        <span className="flex items-center gap-1">
                          <FiUser size={10} className="text-gray-600" />
                          Student: <span className="text-gray-200 font-medium">{log.studentName}</span>
                          {log.department && <span className="ml-2 text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded text-[10px]">{log.department}</span>}
                          {log.formId && <span className="ml-1 text-gray-600">• Form #{log.formId}</span>}
                        </span>
                      )}
                    </div>

                    {log.ipAddress && (
                      <div className="mt-1 text-[10px] text-gray-700 font-mono">
                        IP: {log.ipAddress}
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-gray-600 group-hover:text-gray-400 transition-colors">
                      {timeAgo(log.timestamp)}
                    </div>
                    <div className="text-[10px] text-gray-700 mt-0.5">
                      {formatDateTime(log.timestamp)}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="border-t admin-border p-3 flex items-center justify-between bg-[#0A0A0A]">
            <span className="text-xs text-gray-500">{totalElements} total events</span>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1 border admin-border rounded text-xs hover:bg-[#202020] disabled:opacity-30 transition-colors"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                ← Prev
              </button>
              <span className="text-xs text-gray-500 px-2">Page {page + 1} of {totalPages}</span>
              <button
                className="px-3 py-1 border admin-border rounded text-xs hover:bg-[#202020] disabled:opacity-30 transition-colors"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages - 1}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminActivityLogs;
