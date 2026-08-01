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
    accentBorder: 'border-emerald-500/50',
    iconBg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
    glow: 'from-emerald-500/10'
  },
  warning: {
    title: 'Warning',
    icon: FiAlertTriangle,
    accentBorder: 'border-amber-500/50',
    iconBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/40',
    glow: 'from-amber-500/10'
  },
  'already-registered': {
    title: 'Already Registered',
    icon: FiAlertTriangle,
    accentBorder: 'border-amber-500/50',
    iconBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/40',
    glow: 'from-amber-500/10'
  },
  error: {
    title: 'Error',
    icon: FiXCircle,
    accentBorder: 'border-rose-500/50',
    iconBg: 'bg-rose-500/20 text-rose-400 border border-rose-500/40',
    glow: 'from-rose-500/10'
  },
  info: {
    title: 'Information',
    icon: FiInfo,
    accentBorder: 'border-sky-500/50',
    iconBg: 'bg-sky-500/20 text-sky-400 border border-sky-500/40',
    glow: 'from-sky-500/10'
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
          initial={{ opacity: 0, y: -40, x: "-50%", scale: 0.95 }}
          animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
          exit={{ opacity: 0, y: -40, x: "-50%", scale: 0.95 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed top-6 left-1/2 z-[99999] w-[calc(100vw-2.5rem)] sm:w-[480px] max-w-[520px] pointer-events-auto"
        >
          <div className={`relative flex items-start gap-4 min-h-[96px] p-4 sm:p-5 rounded-2xl bg-slate-900/95 text-white border ${config.accentBorder} shadow-2xl shadow-black/80 backdrop-blur-md overflow-hidden group select-none`}>
            {/* Subtle background gradient glow */}
            <div className={`absolute inset-0 bg-gradient-to-br ${config.glow} to-transparent opacity-40 pointer-events-none`} />

            {/* Left Accent Bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
              typeKey === 'success' ? 'bg-emerald-500' :
              typeKey === 'error' ? 'bg-rose-500' :
              typeKey === 'info' ? 'bg-sky-500' : 'bg-amber-500'
            }`} />

            {/* Icon Badge */}
            <div className={`mt-0.5 p-3 rounded-xl shrink-0 ${config.iconBg} shadow-md`}>
              <IconComponent className="text-2xl sm:text-3xl" />
            </div>

            {/* Content Area */}
            <div className="flex-1 min-w-0 pr-1 relative z-10 my-auto">
              <h4 className="text-base sm:text-lg font-bold tracking-tight text-white leading-snug">
                {title}
              </h4>
              {message && (
                <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed mt-1 break-words opacity-95">
                  {message}
                </p>
              )}

              {/* Special Action Button for Already Registered */}
              {typeKey === 'already-registered' && onLogin && (
                <button
                  type="button"
                  onClick={onLogin}
                  className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 transition-all cursor-pointer shadow-sm"
                >
                  <FiLogIn size={14} /> Go to Student Login
                </button>
              )}
            </div>

            {/* Close Button */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 p-1.5 -mr-1.5 -mt-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer relative z-10"
                title="Dismiss"
              >
                <FiX className="text-lg sm:text-xl" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
