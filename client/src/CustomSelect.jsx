import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiCheck } from 'react-icons/fi';

export default function CustomSelect({
  label,
  icon,
  options = [],
  value,
  onChange,
  placeholder = "Select option",
  required = false,
  error,
  disabled = false,
  className = "",
  id,
  name
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fieldName = name || id;

  // Normalize options to objects { value, label }
  const normalizedOptions = options.map(opt =>
    typeof opt === 'object' && opt !== null ? opt : { value: opt, label: String(opt) }
  );

  const selectedOption = normalizedOptions.find(opt => String(opt.value) === String(value));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    if (onChange) {
      onChange({ target: { name: fieldName, value: optionValue } });
    }
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col gap-2 w-full text-left relative" ref={dropdownRef}>
      {label && (
        <label htmlFor={id} className="text-sm font-semibold tracking-wide text-[var(--color-text-secondary)]">
          {label} {required && <span className="text-[var(--color-danger)]">*</span>}
        </label>
      )}

      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        className={`flex items-center justify-between gap-3 rounded-[12px] border px-4 py-3.5 transition-all duration-200 w-full text-left cursor-pointer
          ${disabled ? 'opacity-50 cursor-not-allowed bg-black/10' : 'bg-[var(--color-surface)]'}
          ${error ? 'border-[var(--color-danger)]/50 bg-[var(--color-danger)]/5' : 'border-[var(--color-border)] hover:border-[var(--color-btn-primary)]/50'}
          ${isOpen ? 'border-[var(--color-btn-primary)] ring-2 ring-[var(--color-btn-primary)]/20' : ''}
          ${className}`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {icon && (
            <span className={`shrink-0 text-lg transition-colors ${error ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-secondary)]'}`}>
              {icon}
            </span>
          )}
          <span className={`text-base font-medium truncate ${selectedOption ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]/60'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-[var(--color-text-secondary)] shrink-0"
        >
          <FiChevronDown size={18} />
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 right-0 top-full z-[100] mt-1 max-h-60 overflow-y-auto rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 shadow-2xl backdrop-blur-xl"
          >
            {normalizedOptions.length === 0 ? (
              <div className="p-3 text-center text-sm text-[var(--color-text-secondary)]">
                No options available
              </div>
            ) : (
              normalizedOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-[8px] text-sm font-medium transition-colors text-left cursor-pointer
                      ${isSelected ? 'bg-[var(--color-btn-primary)]/20 text-[var(--color-btn-primary)] font-bold' : 'text-[var(--color-text-primary)] hover:bg-[var(--color-btn-primary)]/10 hover:text-[var(--color-btn-primary)]'}`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <FiCheck size={16} className="text-[var(--color-btn-primary)] shrink-0 ml-2" />}
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <span className="text-xs font-medium text-[var(--color-danger)] mt-1">
          {error}
        </span>
      )}
    </div>
  );
}
