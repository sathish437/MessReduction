import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiTrash2, FiCheckCircle, FiX } from 'react-icons/fi';

export default function ConfirmModal({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to proceed with this action? This cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  confirmVariant = "danger", // 'danger' | 'warning' | 'primary'
  onConfirm,
  onClose,
  loading = false
}) {
  if (!isOpen || typeof document === 'undefined') return null;

  const isDanger = confirmVariant === 'danger';
  const isWarning = confirmVariant === 'warning';

  const IconComponent = isDanger ? FiTrash2 : (isWarning ? FiAlertTriangle : FiCheckCircle);
  const iconBg = isDanger 
    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
    : (isWarning ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30');

  const btnBg = isDanger 
    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30' 
    : (isWarning ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30');

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={loading ? undefined : onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-md bg-slate-900 border border-slate-700/70 rounded-2xl p-5 sm:p-6 shadow-2xl text-white z-10 overflow-hidden"
          >
            {/* Top Close Button */}
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              <FiX className="text-lg" />
            </button>

            {/* Modal Body */}
            <div className="flex flex-col items-center text-center">
              {/* Icon Badge */}
              <div className={`p-4 rounded-2xl mb-4 ${iconBg} shadow-inner`}>
                <IconComponent className="text-3xl" />
              </div>

              {/* Title */}
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white mb-2">
                {title}
              </h3>

              {/* Message */}
              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed mb-6 px-2">
                {message}
              </p>

              {/* Button Group */}
              <div className="flex items-center justify-center gap-3 w-full">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs sm:text-sm border border-slate-700/60 transition-all cursor-pointer disabled:opacity-50"
                >
                  {cancelText}
                </button>

                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={loading}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 ${btnBg}`}
                >
                  {loading ? 'Processing...' : confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
