import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiCheck, FiInfo, FiAlertCircle, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import apiClient from './api/apiClient';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const bellRef = useRef(null);

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
        const intervalId = setInterval(() => {
            if (typeof document !== 'undefined' && document.hidden) return;
            fetchNotifications();
        }, 30000);

        const handleRefreshEvent = () => {
            fetchNotifications();
        };
        window.addEventListener('app-notification-refresh', handleRefreshEvent);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('app-notification-refresh', handleRefreshEvent);
        };
    }, []);

    // Outside-click and Escape key handler to close notification dropdown without marking as read
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event) => {
            if (bellRef.current && !bellRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

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
            case 'EMERGENCY_REQUEST': return <FiAlertCircle className="text-rose-600 dark:text-rose-400" size={17} />;
            case 'NORMAL_REQUEST':
            case 'BATCH_REQUEST': return <FiInfo className="text-blue-600 dark:text-blue-400" size={17} />;
            case 'APPROVED': return <FiCheckCircle className="text-emerald-600 dark:text-emerald-400" size={17} />;
            case 'REJECTED': return <FiXCircle className="text-rose-600 dark:text-rose-400" size={17} />;
            case 'REMINDER':
            case 'BATCH_REMINDER': return <FiClock className="text-amber-600 dark:text-amber-400" size={17} />;
            default: return <FiBell className="text-[var(--theme-text-faint)]" size={17} />;
        }
    };

    return (
        <div ref={bellRef} data-notification-bell="true" className="relative z-50">
            <button 
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="View notifications"
                className="relative flex items-center justify-center p-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-card)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-soft)] transition-colors shadow-xs"
            >
                <FiBell size={18} className="text-current" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-xs ring-2 ring-[var(--theme-card)]">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] shadow-2xl overflow-hidden z-50 text-[var(--theme-text-primary)]"
                    >
                        <div className="p-3.5 sm:p-4 border-b border-[var(--theme-border)] flex items-center justify-between bg-[var(--theme-card-muted)]">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-primary)]">Notifications</h3>
                            {unreadCount > 0 && (
                                <button 
                                    onClick={markAllAsRead}
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 transition-colors"
                                >
                                    <FiCheck size={13} /> Mark all read
                                </button>
                            )}
                        </div>

                        <div className="max-h-96 overflow-y-auto custom-scrollbar divide-y divide-[var(--theme-border)]">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
                                    <FiBell size={32} className="text-[var(--theme-text-faint)] opacity-40" />
                                    <p className="text-xs font-medium text-[var(--theme-text-faint)]">No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map(notif => (
                                    <div 
                                        key={notif.id}
                                        onClick={() => !notif.read && markAsRead(notif.id)}
                                        className={`p-3.5 sm:p-4 flex gap-3.5 cursor-pointer transition-colors ${
                                            notif.read 
                                                ? 'bg-transparent hover:bg-[var(--theme-bg-soft)]' 
                                                : 'bg-blue-500/5 dark:bg-blue-400/10 hover:bg-blue-500/10'
                                        }`}
                                    >
                                        <div className="mt-0.5 shrink-0">
                                            {getIcon(notif.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs sm:text-[13px] leading-snug ${notif.read ? 'text-[var(--theme-text-secondary)] font-medium' : 'text-[var(--theme-text-primary)] font-semibold'}`}>
                                                {notif.message}
                                            </p>
                                            <span className="text-[10.5px] text-[var(--theme-text-faint)] mt-1 block uppercase tracking-wider font-semibold">
                                                {new Date(notif.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        {!notif.read && (
                                            <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 mt-1.5 shrink-0" />
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
