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
  name,
  position = "bottom", // "bottom" or "top"
  dropUp = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fieldName = name || id;
  const isTop = position === "top" || dropUp;

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
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleSelect = (optionValue) => {
    if (onChange) {
      onChange({ target: { name: fieldName, value: optionValue } });
    }
    setIsOpen(false);
  };

  return (
    <div className="relative flex w-full flex-col gap-1.5 text-left" ref={dropdownRef}>
      {label && (
        <label htmlFor={id} className="field-label">
          {label} {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
        </label>
      )}

      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        className={`field-shell w-full justify-between text-left ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${className}`}
        style={{
          borderColor: error
            ? 'var(--color-danger-border)'
            : isOpen
              ? 'var(--theme-btn-primary)'
              : undefined,
          background: disabled ? 'var(--theme-card-muted)' : 'var(--theme-card)',
          boxShadow: isOpen ? '0 0 0 3px rgba(23, 74, 120, 0.12)' : undefined
        }}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2.5">
          {icon && (
            <span
              className="shrink-0"
              style={{ color: error ? 'var(--color-danger)' : 'var(--theme-text-faint)' }}
            >
              {icon}
            </span>
          )}
          <span
            className="truncate text-[13.5px] font-medium"
            style={{ color: selectedOption ? 'var(--theme-text-primary)' : 'var(--theme-text-faint)' }}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>

        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.18 }}
          className="shrink-0"
          style={{ color: 'var(--theme-text-faint)' }}
        >
          <FiChevronDown size={16} />
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="listbox"
            initial={isTop ? { opacity: 0, y: 4 } : { opacity: 0, y: -4 }}
            animate={isTop ? { opacity: 1, y: -4 } : { opacity: 1, y: 4 }}
            exit={isTop ? { opacity: 0, y: 4 } : { opacity: 0, y: -4 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className={`absolute left-0 right-0 z-[100] max-h-60 overflow-y-auto rounded-[var(--radius-md)] p-1 ${
              isTop ? 'bottom-full mb-1' : 'top-full mt-1'
            }`}
            style={{
              background: 'var(--theme-card)',
              border: '1px solid var(--theme-border)',
              boxShadow: 'var(--shadow-raised)'
            }}
          >
            {normalizedOptions.length === 0 ? (
              <div className="px-3 py-3 text-center text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                No options available
              </div>
            ) : (
              normalizedOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    className="flex w-full items-center justify-between rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-[13px] font-medium transition-colors"
                    style={{
                      background: isSelected ? 'var(--color-accent-soft)' : 'transparent',
                      color: isSelected ? 'var(--color-accent)' : 'var(--theme-text-primary)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--theme-bg-soft)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && (
                      <FiCheck size={14} className="ml-2 shrink-0" style={{ color: 'var(--color-accent)' }} />
                    )}
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <span className="text-[11px] font-medium" style={{ color: 'var(--color-danger)' }}>
          {error}
        </span>
      )}
    </div>
  );
}
