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
    title: 'Approving requests',
    actionVerb: 'approved',
    icon: FiCheckCircle,
    fg: 'var(--color-success)',
    soft: 'var(--color-success-soft)',
    border: 'var(--color-success-border)',
    solid: 'var(--color-success)'
  },
  DELETE: {
    title: 'Deleting records',
    actionVerb: 'deleted',
    icon: FiTrash2,
    fg: 'var(--color-danger)',
    soft: 'var(--color-danger-soft)',
    border: 'var(--color-danger-border)',
    solid: 'var(--color-danger)'
  },
  REJECT: {
    title: 'Rejecting requests',
    actionVerb: 'rejected',
    icon: FiAlertTriangle,
    fg: 'var(--color-warning)',
    soft: 'var(--color-warning-soft)',
    border: 'var(--color-warning-border)',
    solid: 'var(--color-warning)'
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
    ? 'Operation completed'
    : isPartial
    ? 'Completed with errors'
    : 'Operation failed';

  const IconComponent = isSuccess
    ? FiCheckCircle
    : isPartial
    ? FiAlertTriangle
    : isFailed
    ? FiXCircle
    : config.icon;

  const state = isSuccess
    ? { fg: 'var(--color-success)', soft: 'var(--color-success-soft)', border: 'var(--color-success-border)', solid: 'var(--color-success)' }
    : isPartial
    ? { fg: 'var(--color-warning)', soft: 'var(--color-warning-soft)', border: 'var(--color-warning-border)', solid: 'var(--color-warning)' }
    : isFailed
    ? { fg: 'var(--color-danger)', soft: 'var(--color-danger-soft)', border: 'var(--color-danger-border)', solid: 'var(--color-danger)' }
    : config;

  const pct = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-progress-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 backdrop-blur-[2px]"
            style={{ background: 'rgba(11, 23, 40, 0.55)' }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-[440px] overflow-hidden rounded-[var(--radius-lg)]"
            style={{
              background: 'var(--theme-card)',
              border: '1px solid var(--theme-border)',
              boxShadow: 'var(--shadow-modal)'
            }}
          >
            {!isProcessing && onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="absolute top-3.5 right-3.5 rounded-[var(--radius-sm)] p-1.5 transition-colors cursor-pointer"
                style={{ color: 'var(--theme-text-faint)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--theme-bg-soft)';
                  e.currentTarget.style.color = 'var(--theme-text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--theme-text-faint)';
                }}
              >
                <FiX size={17} />
              </button>
            )}

            <div className="flex flex-col items-center px-6 pt-7 pb-6 text-center">
              <div
                className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)]"
                style={{ background: state.soft, color: state.fg, border: `1px solid ${state.border}` }}
              >
                <IconComponent className="text-xl" />
                {isProcessing && (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.6, ease: 'linear' }}
                    className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full"
                    style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}
                  >
                    <FiLoader className="text-xs" style={{ color: 'var(--theme-text-secondary)' }} />
                  </motion.span>
                )}
              </div>

              <h3
                id="bulk-progress-title"
                className="text-[15px] font-semibold tracking-tight leading-snug"
                style={{ color: 'var(--theme-text-primary)' }}
              >
                {defaultTitle}
              </h3>

              {isProcessing && (
                <div className="mt-3 w-full flex flex-col items-center">
                  <p className="mb-4 text-[13px] leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
                    Processing <span className="font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{total}</span>{' '}
                    selected {total === 1 ? 'record' : 'records'}…
                  </p>

                  <div
                    role="progressbar"
                    aria-busy="true"
                    aria-label={`Processing ${total} items`}
                    className="relative h-2 w-full overflow-hidden rounded-full"
                    style={{ background: 'var(--theme-bg-soft)', border: '1px solid var(--theme-border)' }}
                  >
                    <motion.div
                      animate={{ x: ['-110%', '110%'] }}
                      transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                      className="absolute top-0 bottom-0 w-1/2 rounded-full"
                      style={{ background: state.solid, opacity: 0.85 }}
                    />
                  </div>

                  {total > 0 && (
                    <p className="mt-2 text-[11px] font-medium" style={{ color: 'var(--theme-text-faint)' }}>
                      {processed} of {total} processed · {pct}%
                    </p>
                  )}

                  <p className="mt-3 text-[11px]" style={{ color: 'var(--theme-text-faint)' }}>
                    Please do not close this window or navigate away.
                  </p>
                </div>
              )}

              {isSuccess && (
                <div className="mt-3 w-full flex flex-col items-center">
                  <div className="mb-4 h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--theme-bg-soft)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: state.solid }}
                    />
                  </div>

                  <span className="badge badge-success">
                    {total} / {total} processed
                  </span>

                  <p className="mt-2.5 text-[13px] leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
                    {total} {total === 1 ? 'record was' : 'records were'} {config.actionVerb} successfully.
                  </p>

                  <button
                    type="button"
                    onClick={onClose}
                    className="btn btn-primary mt-5 min-w-[130px]"
                  >
                    Done
                  </button>
                </div>
              )}

              {isPartial && (
                <div className="mt-3 w-full flex flex-col items-center">
                  <p className="mb-4 text-[13px] leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
                    The operation finished, but some records could not be {config.actionVerb}.
                  </p>

                  <div className="mb-5 grid w-full grid-cols-3 gap-2">
                    {[
                      { label: 'Selected', value: total, color: 'var(--theme-text-primary)' },
                      { label: 'Successful', value: successCount, color: 'var(--color-success)' },
                      { label: 'Failed', value: failedCount, color: 'var(--color-danger)' }
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex flex-col items-center rounded-[var(--radius-md)] px-2 py-2.5"
                        style={{ background: 'var(--theme-card-muted)', border: '1px solid var(--theme-border)' }}
                      >
                        <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--theme-text-secondary)' }}>
                          {item.label}
                        </span>
                        <span className="mt-0.5 text-base font-semibold" style={{ color: item.color }}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button type="button" onClick={onClose} className="btn btn-secondary min-w-[130px]">
                    Dismiss
                  </button>
                </div>
              )}

              {isFailed && (
                <div className="mt-3 w-full flex flex-col items-center">
                  <p className="mb-5 px-1 text-[13px] leading-relaxed break-words" style={{ color: 'var(--theme-text-secondary)' }}>
                    {error || 'An unexpected error occurred while processing the bulk operation. Please try again.'}
                  </p>

                  <button type="button" onClick={onClose} className="btn btn-secondary min-w-[130px]">
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
