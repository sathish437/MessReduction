import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiBell, FiArrowRight, FiUser, FiCalendar } from 'react-icons/fi';

/**
 * Floating notification queue for real-time SSE Mess Reduction requests.
 * Stacks smoothly in top-right corner using Framer Motion layout animations.
 */
export default function SseNotificationToast({ notifications = [], onDismiss, onViewRequest }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!notifications || notifications.length === 0) return;

    const handleOutsideClick = (event) => {
      // Do not dismiss if click was inside the notification container
      if (containerRef.current && containerRef.current.contains(event.target)) {
        return;
      }
      // Do not conflict if click was on a notification bell
      if (event.target && event.target.closest && event.target.closest('[data-notification-bell]')) {
        return;
      }
      // Dismiss active floating notifications
      notifications.forEach((item) => {
        if (onDismiss && item?.applicationId) {
          onDismiss(item.applicationId);
        }
      });
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        notifications.forEach((item) => {
          if (onDismiss && item?.applicationId) {
            onDismiss(item.applicationId);
          }
        });
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [notifications, onDismiss]);

  if (!notifications || notifications.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="fixed top-3 sm:top-4 right-3 sm:right-4 left-3 sm:left-auto z-[9999] flex flex-col gap-2.5 sm:max-w-sm pointer-events-none"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {notifications.map((item) => (
          <motion.div
            key={`sse-notif-${item.applicationId}`}
            layout
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9, transition: { duration: 0.18 } }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="pointer-events-auto relative w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--theme-border-strong)] bg-[var(--theme-card)] p-4 shadow-2xl backdrop-blur-md text-[var(--theme-text-primary)]"
            style={{
              boxShadow: 'var(--shadow-modal)',
            }}
          >
            {/* Top Bar with NEW badge & Dismiss button */}
            <div className="flex items-center justify-between gap-2 border-b border-[var(--theme-border)] pb-2.5 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-primary)]">
                  New Mess Reduction Request
                </span>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  NEW
                </span>
              </div>

              <button
                type="button"
                onClick={() => onDismiss(item.applicationId)}
                aria-label="Dismiss notification"
                className="p-1 rounded-md text-[var(--theme-text-faint)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-soft)] transition-colors"
              >
                <FiX size={15} />
              </button>
            </div>

            {/* Student & Request Summary */}
            <div className="space-y-1.5 text-xs text-[var(--theme-text-secondary)]">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-semibold text-[var(--theme-text-primary)] text-[13.5px] truncate">
                  {item.studentName}
                </p>
                <span className="font-mono text-[11.5px] text-[var(--theme-text-faint)] shrink-0">
                  {item.registerNumber}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300 border border-blue-500/30">
                  {item.department}
                </span>
                <span className="text-[var(--theme-text-secondary)] text-[11px]">
                  {Number(item.yearOfStudy) === 1
                    ? '1st Year'
                    : Number(item.yearOfStudy) === 2
                    ? '2nd Year'
                    : Number(item.yearOfStudy) === 3
                    ? '3rd Year'
                    : Number(item.yearOfStudy) === 4
                    ? '4th Year'
                    : `${item.yearOfStudy || ''} Year`}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-3.5 flex items-center justify-end gap-2 pt-2 border-t border-[var(--theme-border)]">
              <button
                type="button"
                onClick={() => onDismiss(item.applicationId)}
                className="px-2.5 py-1 text-[11.5px] font-medium text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => onViewRequest(item)}
                className="btn btn-primary h-7 px-3 text-[11.5px] font-semibold flex items-center gap-1.5 shadow-md"
              >
                <span>View Request</span>
                <FiArrowRight size={13} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
