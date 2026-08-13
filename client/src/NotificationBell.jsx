import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiCheck, FiInfo, FiAlertCircle, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import apiClient from './api/apiClient';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    const fetchNotifications = async () => {
        try {
            const res = await apiClient.get('/api/notifications');
            setNotifications(res.data.notifications || []);
            setUnreadCount(res.data.unreadCount || 0);
        } catch (error) {
        }
    };

    useEffect(() => {
        fetchNotifications();
        const intervalId = setInterval(fetchNotifications, 5000);

        const handleRefreshEvent = () => {
            fetchNotifications();
        };
        window.addEventListener('app-notification-refresh', handleRefreshEvent);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('app-notification-refresh', handleRefreshEvent);
        };
    }, []);

    const markAsRead = async (id) => {
        try {
            await apiClient.patch(`/api/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
        }
    };

    const markAllAsRead = async () => {
        try {
            await apiClient.patch('/api/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'EMERGENCY_REQUEST': return <FiAlertCircle className="text-rose-500" />;
            case 'NORMAL_REQUEST': return <FiInfo className="text-teal-400" />;
            case 'APPROVED': return <FiCheckCircle className="text-emerald-400" />;
            case 'REJECTED': return <FiXCircle className="text-rose-500" />;
            case 'REMINDER': return <FiClock className="text-amber-400" />;
            default: return <FiBell className="text-white/50" />;
        }
    };

    return (
        <div className="relative z-50">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition-all"
            >
                <FiBell size={20} className="text-white/70 hover:text-white" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-[#0a1628]">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#0f1f38] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <h3 className="text-sm font-black tracking-widest text-white uppercase">Notifications</h3>
                            {unreadCount > 0 && (
                                <button 
                                    onClick={markAllAsRead}
                                    className="text-xs text-teal-400 hover:text-teal-300 font-bold tracking-wider uppercase flex items-center gap-1"
                                >
                                    <FiCheck size={12} /> Mark all read
                                </button>
                            )}
                        </div>

                        <div className="max-h-96 overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
                                    <FiBell size={32} className="text-white/10" />
                                    <p className="text-sm font-medium text-white/30">No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map(notif => (
                                    <div 
                                        key={notif.id}
                                        onClick={() => !notif.read && markAsRead(notif.id)}
                                        className={`p-4 border-b border-white/5 flex gap-4 cursor-pointer transition-colors ${notif.read ? 'bg-transparent hover:bg-white/5' : 'bg-teal-500/5 hover:bg-teal-500/10'}`}
                                    >
                                        <div className="mt-1">
                                            {getIcon(notif.type)}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-sm font-medium ${notif.read ? 'text-white/60' : 'text-white'}`}>
                                                {notif.message}
                                            </p>
                                            <span className="text-[10px] text-white/30 mt-1 block uppercase tracking-wider font-bold">
                                                {new Date(notif.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        {!notif.read && (
                                            <div className="w-2 h-2 rounded-full bg-teal-400 mt-1.5" />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;
