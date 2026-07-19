import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiXCircle, FiClock, FiSearch, FiRefreshCw } from 'react-icons/fi';
import apiClient from './api/apiClient';

const AdminExtraSubmissions = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionLoading, setActionLoading] = useState(null); // stores ID of request being processed

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/api/admin/extra-submissions');
            setRequests(res.data || []);
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (id, action) => {
        if (!window.confirm(`Are you sure you want to ${action} this request?`)) return;
        
        setActionLoading(id);
        try {
            await apiClient.post(`/api/admin/extra-submissions/${id}/${action}`);
            setRequests(prev => prev.filter(req => req.id !== id));
        } catch (error) {
            alert(`Failed to ${action} request`);
        } finally {
            setActionLoading(null);
        }
    };

    const filteredRequests = requests.filter(req => 
        (req.studentDetails?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (req.studentDetails?.registerNo || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto h-full flex flex-col">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        Extra Submission Requests
                        <span className="text-xs font-bold bg-amber-500/20 text-amber-500 px-3 py-1 rounded-full border border-amber-500/30">
                            {requests.length} Pending
                        </span>
                    </h1>
                    <p className="text-gray-400 text-sm">Review and manage student requests for daily limit overrides.</p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search by name or reg no..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition-colors"
                        />
                    </div>
                    <button 
                        onClick={fetchRequests}
                        disabled={loading}
                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 transition-colors"
                    >
                        <FiRefreshCw className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
                {loading ? (
                    <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                        <FiRefreshCw className="animate-spin text-3xl mb-4 text-red-500/50" />
                        <p>Loading requests...</p>
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-gray-500 border border-white/5 rounded-2xl bg-white/[0.02]">
                        <FiCheckCircle className="text-4xl mb-4 text-emerald-500/30" />
                        <p className="text-lg">No pending requests found.</p>
                        {searchTerm && <p className="text-sm mt-2">Try adjusting your search query.</p>}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {filteredRequests.map(req => (
                                <motion.div
                                    key={req.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col relative overflow-hidden group"
                                >
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
                                    
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-white">{req.studentDetails?.name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded">{req.studentDetails?.registerNo}</span>
                                                <span className="text-xs text-gray-400">{req.studentDetails?.department}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 bg-black/20 rounded-xl p-4 mb-6 border border-white/5">
                                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                            <FiClock /> Reason for Request
                                        </div>
                                        <p className="text-gray-300 text-sm leading-relaxed">
                                            {req.reason}
                                        </p>
                                    </div>

                                    <div className="flex gap-3 mt-auto">
                                        <button
                                            onClick={() => handleAction(req.id, 'reject')}
                                            disabled={actionLoading === req.id}
                                            className="flex-1 py-2.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 flex items-center justify-center gap-2 text-sm font-bold transition-all disabled:opacity-50"
                                        >
                                            <FiXCircle /> {actionLoading === req.id ? 'Processing...' : 'Reject'}
                                        </button>
                                        <button
                                            onClick={() => handleAction(req.id, 'approve')}
                                            disabled={actionLoading === req.id}
                                            className="flex-1 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 flex items-center justify-center gap-2 text-sm font-bold transition-all disabled:opacity-50"
                                        >
                                            <FiCheckCircle /> {actionLoading === req.id ? 'Processing...' : 'Approve'}
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminExtraSubmissions;
