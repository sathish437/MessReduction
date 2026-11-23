import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle,
  FiInfo,
  FiX,
  FiLogIn
} from 'react-icons/fi';

const TYPE_CONFIG = {
  success: {
    title: 'Success',
    icon: FiCheckCircle,
    accent: 'var(--color-success)',
    chipBg: 'var(--color-success-soft)',
    chipColor: 'var(--color-success)',
    chipBorder: 'var(--color-success-border)'
  },
  warning: {
    title: 'Warning',
    icon: FiAlertTriangle,
    accent: 'var(--color-warning)',
    chipBg: 'var(--color-warning-soft)',
    chipColor: 'var(--color-warning)',
    chipBorder: 'var(--color-warning-border)'
  },
  'already-registered': {
    title: 'Already Registered',
    icon: FiAlertTriangle,
    accent: 'var(--color-warning)',
    chipBg: 'var(--color-warning-soft)',
    chipColor: 'var(--color-warning)',
    chipBorder: 'var(--color-warning-border)'
  },
  error: {
    title: 'Error',
    icon: FiXCircle,
    accent: 'var(--color-danger)',
    chipBg: 'var(--color-danger-soft)',
    chipColor: 'var(--color-danger)',
    chipBorder: 'var(--color-danger-border)'
  },
  info: {
    title: 'Information',
    icon: FiInfo,
    accent: 'var(--color-info)',
    chipBg: 'var(--color-info-soft)',
    chipColor: 'var(--color-info)',
    chipBorder: 'var(--color-info-border)'
  }
};

export default function Toast({ toast, onClose, onLogin }) {
  // Auto-close duration logic:
  // Success -> 3s, Info -> 3s, Warning -> 4s, Error -> 5s
  useEffect(() => {
    if (!toast) return;

    const rawType = typeof toast === 'string' ? 'success' : (toast.type || 'success');
    let duration = 3000;
    if (rawType === 'warning' || rawType === 'already-registered') {
      duration = 4000;
    } else if (rawType === 'error') {
      duration = 5000;
    }

    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (typeof document === 'undefined') return null;

  // Extract toast details (support string or object format)
  const isString = typeof toast === 'string';
  const rawType = isString ? 'success' : (toast?.type || 'success');
  const typeKey = TYPE_CONFIG[rawType] ? rawType : 'success';
  const config = TYPE_CONFIG[typeKey];

  const title = !isString && toast?.title ? toast.title : config.title;
  const message = isString ? toast : (toast?.message || '');
  const IconComponent = config.icon;

  return createPortal(
    <AnimatePresence>
      {toast && (
        <motion.div
          key="centered-toast-portal"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -24, x: '-50%', scale: 0.97 }}
          animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
          exit={{ opacity: 0, y: -16, x: '-50%', scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="fixed top-5 sm:top-6 left-1/2 z-[99999] w-[calc(100vw-2rem)] sm:w-[440px] max-w-[520px] pointer-events-auto"
        >
          <div
            className="relative flex items-start gap-3.5 p-4 rounded-[var(--radius-lg)] overflow-hidden"
            style={{
              background: 'var(--theme-card)',
              border: '1px solid var(--theme-border)',
              boxShadow: 'var(--shadow-raised)'
            }}
          >
            <span
              className="absolute left-0 top-0 bottom-0 w-[3px]"
              style={{ background: config.accent }}
              aria-hidden="true"
            />

            <div
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)]"
              style={{
                background: config.chipBg,
                color: config.chipColor,
                border: `1px solid ${config.chipBorder}`
              }}
            >
              <IconComponent className="text-lg" />
            </div>

            <div className="flex-1 min-w-0">
              <h4
                className="text-[13.5px] font-semibold leading-snug"
                style={{ color: 'var(--theme-text-primary)' }}
              >
                {title}
              </h4>
              {message && (
                <p
                  className="mt-1 text-xs leading-relaxed break-words"
                  style={{ color: 'var(--theme-text-secondary)' }}
                >
                  {message}
                </p>
              )}

              {typeKey === 'already-registered' && onLogin && (
                <button
                  type="button"
                  onClick={onLogin}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
                  style={{
                    background: 'var(--color-warning-soft)',
                    color: 'var(--color-warning)',
                    border: '1px solid var(--color-warning-border)'
                  }}
                >
                  <FiLogIn size={13} /> Go to Student Login
                </button>
              )}
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Dismiss notification"
                className="shrink-0 -mr-1 -mt-1 rounded-[var(--radius-sm)] p-1.5 transition-colors cursor-pointer"
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
                <FiX size={16} />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
