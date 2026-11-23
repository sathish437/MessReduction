import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiTrash2, FiCheckCircle, FiX } from 'react-icons/fi';

export default function ConfirmModal({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this action? This cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  confirmVariant = 'danger', // 'danger' | 'warning' | 'primary'
  onConfirm,
  onClose,
  loading = false
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape' && !loading) onClose?.();
    };
    document.addEventListener('keydown', handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, loading, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const isDanger = confirmVariant === 'danger';
  const isWarning = confirmVariant === 'warning';

  const IconComponent = isDanger ? FiTrash2 : (isWarning ? FiAlertTriangle : FiCheckCircle);

  const palette = isDanger
    ? {
        fg: 'var(--color-danger)',
        soft: 'var(--color-danger-soft)',
        border: 'var(--color-danger-border)',
        solid: 'var(--color-danger)',
        solidHover: '#9a1c14'
      }
    : isWarning
      ? {
          fg: 'var(--color-warning)',
          soft: 'var(--color-warning-soft)',
          border: 'var(--color-warning-border)',
          solid: 'var(--color-warning)',
          solidHover: '#92400e'
        }
      : {
          fg: 'var(--theme-btn-primary)',
          soft: 'var(--color-accent-soft)',
          border: 'var(--theme-border)',
          solid: 'var(--theme-btn-primary)',
          solidHover: 'var(--theme-btn-primary-hover)'
        };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={loading ? undefined : onClose}
            className="fixed inset-0 backdrop-blur-[2px]"
            style={{ background: 'rgba(11, 23, 40, 0.55)' }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-[420px] overflow-hidden rounded-[var(--radius-lg)]"
            style={{
              background: 'var(--theme-card)',
              border: '1px solid var(--theme-border)',
              boxShadow: 'var(--shadow-modal)'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              aria-label="Close dialog"
              className="absolute top-3.5 right-3.5 rounded-[var(--radius-sm)] p-1.5 transition-colors cursor-pointer disabled:opacity-50"
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

            <div className="px-6 pt-7 pb-5 flex flex-col items-center text-center">
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)]"
                style={{ background: palette.soft, color: palette.fg, border: `1px solid ${palette.border}` }}
              >
                <IconComponent className="text-xl" />
              </div>

              <h3
                className="text-[15px] font-semibold tracking-tight"
                style={{ color: 'var(--theme-text-primary)' }}
              >
                {title}
              </h3>

              <p
                className="mt-1.5 px-1 text-[13px] leading-relaxed"
                style={{ color: 'var(--theme-text-secondary)' }}
              >
                {message}
              </p>
            </div>

            <div
              className="flex items-center gap-2.5 px-6 py-4"
              style={{ borderTop: '1px solid var(--theme-border)', background: 'var(--theme-card-muted)' }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="btn btn-secondary flex-1"
              >
                {cancelText}
              </button>

              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="btn flex-1 text-white"
                style={{ background: palette.solid }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = palette.solidHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = palette.solid; }}
              >
                {loading ? 'Processing…' : confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
