import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCheckCircle,
  FiTrash2,
  FiAlertTriangle,
  FiXCircle,
  FiLoader,
  FiX
} from 'react-icons/fi';

const OPERATION_CONFIG = {
  APPROVE: {
    title: 'Approving Requests...',
    actionVerb: 'approved',
    icon: FiCheckCircle,
    color: 'emerald',
    badgeBg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    barColor: 'from-emerald-500 via-teal-400 to-emerald-500'
  },
  DELETE: {
    title: 'Deleting Records...',
    actionVerb: 'deleted',
    icon: FiTrash2,
    color: 'rose',
    badgeBg: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    barColor: 'from-rose-500 via-pink-400 to-rose-500'
  },
  REJECT: {
    title: 'Rejecting Requests...',
    actionVerb: 'rejected',
    icon: FiAlertTriangle,
    color: 'amber',
    badgeBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    barColor: 'from-amber-500 via-yellow-400 to-amber-500'
  }
};

export default function BulkOperationProgress({
  isOpen,
  status = 'IDLE', // 'IDLE' | 'PROCESSING' | 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILED'
  operationType = 'APPROVE', // 'APPROVE' | 'DELETE' | 'REJECT'
  title = null,
  total = 0,
  processed = 0,
  successCount = 0,
  failedCount = 0,
  error = null,
  onClose,
  autoCloseDelay = 1800
}) {
  // Auto-close on pure success
  useEffect(() => {
    if (status === 'SUCCESS' && isOpen && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [status, isOpen, onClose, autoCloseDelay]);

  if (!isOpen || status === 'IDLE' || typeof document === 'undefined') return null;

  const normalizedType = (operationType || 'APPROVE').toUpperCase();
  const config = OPERATION_CONFIG[normalizedType] || OPERATION_CONFIG.APPROVE;
  const isProcessing = status === 'PROCESSING';
  const isSuccess = status === 'SUCCESS';
  const isPartial = status === 'PARTIAL_SUCCESS';
  const isFailed = status === 'FAILED';

  const defaultTitle = isProcessing
    ? (title || config.title)
    : isSuccess
    ? 'Operation Completed'
    : isPartial
    ? 'Completed with Errors'
    : 'Operation Failed';

  const IconComponent = isSuccess
    ? FiCheckCircle
    : isPartial
    ? FiAlertTriangle
    : isFailed
    ? FiXCircle
    : config.icon;

  const iconBadgeClass = isSuccess
    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
    : isPartial
    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
    : isFailed
    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
    : config.badgeBg;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 select-none overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-progress-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-6 sm:p-7 shadow-2xl text-white z-10 overflow-hidden"
          >
            {/* Top Close Button for Non-Processing states */}
            {!isProcessing && onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              >
                <FiX className="text-lg" />
              </button>
            )}

            <div className="flex flex-col items-center text-center">
              {/* Icon Badge */}
              <div className={`relative p-4 rounded-2xl mb-4 ${iconBadgeClass} shadow-inner`}>
                <IconComponent className="text-3xl sm:text-4xl" />
                {isProcessing && (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                    className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center"
                  >
                    <FiLoader className="text-sm text-white drop-shadow" />
                  </motion.span>
                )}
              </div>

              {/* Title */}
              <h3
                id="bulk-progress-title"
                className="text-lg sm:text-xl font-bold tracking-tight text-white mb-2 leading-snug"
              >
                {defaultTitle}
              </h3>

              {/* Body Content by State */}
              {isProcessing && (
                <div className="w-full mt-2 mb-2 flex flex-col items-center">
                  <p className="text-xs sm:text-sm text-slate-300 font-medium mb-4 leading-relaxed">
                    Processing <span className="text-white font-bold">{total}</span> selected {total === 1 ? 'record' : 'records'}...
                  </p>

                  {/* Indeterminate Animated Progress Bar */}
                  <div
                    role="progressbar"
                    aria-busy="true"
                    aria-label={`Processing ${total} items`}
                    className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700/70 shadow-inner"
                  >
                    <motion.div
                      animate={{
                        x: ['-100%', '100%']
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.4,
                        ease: 'easeInOut'
                      }}
                      className={`absolute top-0 bottom-0 w-2/3 bg-gradient-to-r ${config.barColor} rounded-full shadow-lg`}
                    />
                  </div>

                  <p className="text-[11px] sm:text-xs text-slate-400 mt-3 font-medium">
                    Please do not close this window or navigate away.
                  </p>
                </div>
              )}

              {isSuccess && (
                <div className="w-full mt-2 mb-2 flex flex-col items-center">
                  {/* Progress completed bar */}
                  <div
                    role="progressbar"
                    aria-valuenow={100}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-emerald-500/40 mb-4"
                  >
                    <div className="h-full w-full bg-emerald-500 rounded-full" />
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-2">
                    {total} / {total} processed (100%)
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                    {total} {total === 1 ? 'record' : 'records'} {config.actionVerb} successfully.
                  </p>

                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-5 w-full sm:w-auto min-w-[140px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              )}

              {isPartial && (
                <div className="w-full mt-2 mb-2 flex flex-col items-center">
                  <p className="text-xs sm:text-sm text-slate-300 font-medium mb-4 leading-relaxed">
                    The operation finished, but some records could not be {config.actionVerb}.
                  </p>

                  {/* Summary Grid */}
                  <div className="grid grid-cols-3 gap-2 w-full mb-5">
                    <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex flex-col items-center">
                      <span className="text-[11px] text-slate-400 font-medium">Selected</span>
                      <span className="text-base sm:text-lg font-bold text-white mt-0.5">{total}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex flex-col items-center">
                      <span className="text-[11px] text-emerald-400 font-medium">Successful</span>
                      <span className="text-base sm:text-lg font-bold text-emerald-300 mt-0.5">{successCount}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 flex flex-col items-center">
                      <span className="text-[11px] text-rose-400 font-medium">Failed</span>
                      <span className="text-base sm:text-lg font-bold text-rose-300 mt-0.5">{failedCount}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto min-w-[140px] px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-amber-600/30 transition-all cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {isFailed && (
                <div className="w-full mt-2 mb-2 flex flex-col items-center">
                  <p className="text-xs sm:text-sm text-rose-300 font-medium mb-5 px-1 leading-relaxed break-words">
                    {error || 'An unexpected error occurred while processing the bulk operation. Please try again.'}
                  </p>

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto min-w-[140px] px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 font-bold text-xs sm:text-sm shadow transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
