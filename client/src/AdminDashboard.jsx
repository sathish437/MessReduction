import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  MdPeople, MdAssignment, MdPendingActions,
  MdCheckCircle, MdCancel, MdSupervisedUserCircle, MdNotifications,
  MdRefresh
} from 'react-icons/md';
import apiClient from './api/apiClient';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#DC2626', '#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6'];

const DEPT_COLORS = {
  CSE: '#DC2626', ECE: '#EF4444', EEE: '#F97316',
  MECH: '#EAB308', CIVIL: '#22C55E', IT: '#3B82F6', AIDS: '#8B5CF6', MECHATRONICS: '#8B5CF6'
};

const STATUS_COLORS = {
  PendingDeputyWarden: '#EAB308',
  PendingWarden: '#F97316',
  PendingOffice: '#3B82F6',
  Approved: '#22C55E',
  RejectedDeputyWarden: '#EF4444',
  RejectedWarden: '#EF4444',
  RejectedOffice: '#DC2626',
};

const STATUS_LABELS = {
  PendingDeputyWarden: 'Pending Deputy',
  PendingWarden: 'Pending Warden',
  PendingOffice: 'Pending Office',
  Approved: 'Approved',
  RejectedDeputyWarden: 'Rejected (Dep.)',
  RejectedWarden: 'Rejected (War.)',
  RejectedOffice: 'Rejected (Off.)',
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.4, type: 'spring' }
  })
};

const StatCard = ({ icon, title, value, colorClass, index, loading }) => (
  <motion.div
    custom={index}
    initial="hidden"
    animate="visible"
    variants={cardVariants}
    className="admin-card rounded-2xl p-5 admin-border border admin-glow admin-lift relative overflow-hidden"
  >
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 ${colorClass}`} />
    <div className="flex items-center justify-between mb-3 relative z-10">
      <h3 className="text-gray-400 font-medium text-xs uppercase tracking-wider">{title}</h3>
      <div className={`p-2 rounded-lg ${colorClass} bg-opacity-20`}>{icon}</div>
    </div>
    {loading ? (
      <div className="h-9 w-16 bg-gray-700/50 rounded-lg animate-pulse" />
    ) : (
      <p className="text-3xl font-bold text-white relative z-10">{value ?? 0}</p>
    )}
  </motion.div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchStats = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/admin/dashboard');
      setStats(response.data);
      setLastRefresh(new Date());
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 45000); // auto-refresh every 45 seconds
    return () => clearInterval(interval);
  }, [fetchStats]);

  // Build chart data from backend maps
  const deptBarData = stats?.studentsByDepartment
    ? Object.entries(stats.studentsByDepartment).map(([name, students]) => ({
        name,
        Students: students,
        Requests: stats.requestsByDepartment?.[name] ?? 0,
      }))
    : [];

  const requestsPieData = stats
    ? [
        { name: 'Pending Deputy', value: stats.pendingAtDeputyWarden, color: STATUS_COLORS.PendingDeputyWarden },
        { name: 'Pending Warden', value: stats.pendingAtWarden, color: STATUS_COLORS.PendingWarden },
        { name: 'Pending Office', value: stats.pendingAtOffice, color: STATUS_COLORS.PendingOffice },
        { name: 'Approved Today', value: stats.approvedToday, color: STATUS_COLORS.Approved },
        { name: 'Rejected Today', value: stats.rejectedToday, color: STATUS_COLORS.RejectedOffice },
      ].filter(d => d.value > 0)
    : [];

  const statCards = stats
    ? [
        { title: "Today's Registrations", value: stats.todaysRegistrations, icon: <MdPeople size={22} className="text-red-500" />, colorClass: 'bg-red-500' },
        { title: "Today's Requests", value: stats.todaysRequests, icon: <MdAssignment size={22} className="text-blue-500" />, colorClass: 'bg-blue-500' },
        { title: 'Approved Today', value: stats.approvedToday, icon: <MdCheckCircle size={22} className="text-green-500" />, colorClass: 'bg-green-500' },
        { title: 'Rejected Today', value: stats.rejectedToday, icon: <MdCancel size={22} className="text-rose-500" />, colorClass: 'bg-rose-500' },
        { title: 'Total Staff', value: stats.totalStaff, icon: <MdSupervisedUserCircle size={22} className="text-purple-500" />, colorClass: 'bg-purple-500' },
        { title: 'Pending Deputy Warden', value: stats.pendingAtDeputyWarden, icon: <MdPendingActions size={22} className="text-yellow-500" />, colorClass: 'bg-yellow-500' },
        { title: 'Pending Warden', value: stats.pendingAtWarden, icon: <MdPendingActions size={22} className="text-orange-500" />, colorClass: 'bg-orange-500' },
        { title: 'Pending Office', value: stats.pendingAtOffice, icon: <MdPendingActions size={22} className="text-amber-500" />, colorClass: 'bg-amber-500' },
        { title: 'Notifications', value: stats.totalNotifications, icon: <MdNotifications size={22} className="text-pink-500" />, colorClass: 'bg-pink-500' },
      ]
    : Array(9).fill({ title: '...', value: 0, icon: null, colorClass: 'bg-gray-500' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>
          <p className="text-xs text-gray-500 mt-1">
            Last updated: {lastRefresh.toLocaleTimeString()} • Auto-refreshes every 45s
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2 bg-[#161616] border admin-border rounded-xl text-sm text-gray-400 hover:text-white hover:border-red-500 transition-all"
        >
          <MdRefresh size={18} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {statCards.map((card, i) => (
          <StatCard
            key={i}
            index={i}
            title={card.title}
            value={card.value}
            icon={card.icon}
            colorClass={card.colorClass}
            loading={loading}
          />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="admin-card rounded-2xl p-6 admin-border border shadow-lg"
        >
          <h3 className="text-base font-bold text-white mb-1">Department Wise Students</h3>
          <p className="text-xs text-gray-500 mb-4">Live data from database</p>
          <div className="h-64 w-full">
            {loading || deptBarData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                {loading ? (
                  <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                ) : 'No department data yet'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptBarData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" stroke="#6B7280" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#6B7280" tick={{ fontSize: 12 }} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="Students" fill="#DC2626" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Requests" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Requests Donut Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="admin-card rounded-2xl p-6 admin-border border shadow-lg"
        >
          <h3 className="text-base font-bold text-white mb-1">Requests Overview</h3>
          <p className="text-xs text-gray-500 mb-4">Live pending & resolved counts</p>
          <div className="h-64 w-full">
            {loading || requestsPieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                {loading ? (
                  <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                ) : 'No active requests'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={requestsPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {requestsPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff', borderRadius: '8px' }} />
                  <Legend iconType="circle" iconSize={10} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Summary Strip */}
      {!loading && stats && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="admin-card rounded-2xl p-4 admin-border border shadow-lg"
        >
          <div className="flex flex-wrap gap-6 items-center">
            <div className="text-xs text-gray-400">
              <span className="font-semibold text-white text-sm">
                {(stats.pendingAtDeputyWarden ?? 0) + (stats.pendingAtWarden ?? 0) + (stats.pendingAtOffice ?? 0)}
              </span>{' '}total pending requests
            </div>
            <div className="text-xs text-gray-400">
              Approval rate today:{' '}
              <span className="font-semibold text-green-400">
                {stats.approvedToday > 0 || stats.rejectedToday > 0
                  ? `${Math.round((stats.approvedToday / (stats.approvedToday + stats.rejectedToday)) * 100)}%`
                  : 'N/A'}
              </span>
            </div>
            <div className="text-xs text-gray-400">
              Total staff registered: <span className="font-semibold text-purple-400">{stats.totalStaff}</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AdminDashboard;
