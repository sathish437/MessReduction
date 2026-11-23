import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiX, FiSquare, FiCheckSquare } from 'react-icons/fi';

export default function MultiSelect({
  label,
  icon,
  options = [],
  value = [],
  onChange,
  placeholder = "Select options",
  allOptionLabel = "All Options",
  disabled = false,
  className = "",
  id
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);

  // Normalize options to objects { value, label }
  const normalizedOptions = options.map(opt =>
    typeof opt === 'object' && opt !== null ? opt : { value: String(opt), label: String(opt) }
  );

  // Convert current value prop into array of strings
  const selectedValues = Array.isArray(value)
    ? value.map(String)
    : (value && value !== "ALL" ? [String(value)] : []);

  const isAllSelected = selectedValues.length === 0 || selectedValues.includes("ALL");

  const filteredOptions = searchQuery.trim()
    ? normalizedOptions.filter(opt => {
        const query = searchQuery.trim().toLowerCase();
        return (
          String(opt.label || '').toLowerCase().includes(query) ||
          String(opt.value || '').toLowerCase().includes(query)
        );
      })
    : normalizedOptions;

  const getButtonText = () => {
    if (isAllSelected) return allOptionLabel || placeholder;
    if (selectedValues.length === 1) {
      const match = normalizedOptions.find(opt => String(opt.value) === selectedValues[0]);
      return match ? match.label : selectedValues[0];
    }
    return `${selectedValues.length} selected`;
  };

  const handleSelectAll = () => {
    if (disabled) return;
    onChange?.([]);
  };

  const handleClearAll = () => {
    if (disabled) return;
    onChange?.([]);
  };

  const handleToggleOption = (optionValue) => {
    if (disabled) return;
    const val = String(optionValue);
    const current = selectedValues.filter(v => v !== "ALL");
    const next = current.includes(val)
      ? current.filter(v => v !== val)
      : [...current, val];
    onChange?.(next);
  };

  const toggleOpen = () => {
    if (disabled) return;
    setIsOpen(prev => {
      const next = !prev;
      if (next) setSearchQuery("");
      return next;
    });
  };

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      if (spaceBelow < 260 && spaceAbove > spaceBelow) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative flex w-full flex-col text-left" ref={dropdownRef}>
      {label && (
        <label htmlFor={id} className="field-label">
          {label}
        </label>
      )}

      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={toggleOpen}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`flex w-full items-center justify-between gap-2 rounded-[var(--radius-md)] border px-3 text-left text-[13px] transition-colors ${className}`}
        style={{
          minHeight: '2.5rem',
          background: disabled ? 'var(--theme-card-muted)' : 'var(--theme-card)',
          borderColor: (!isAllSelected || isOpen) ? 'var(--theme-btn-primary)' : 'var(--theme-border-strong)',
          color: 'var(--theme-text-primary)',
          opacity: disabled ? 0.65 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          {icon && <span className="shrink-0" style={{ color: 'var(--theme-text-faint)' }}>{icon}</span>}
          <span className={`truncate ${!isAllSelected ? 'font-semibold' : 'font-medium'}`}>{getButtonText()}</span>
        </span>

        <span className="flex shrink-0 items-center gap-1.5">
          {!isAllSelected && (
            <span
              className="rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold text-white"
              style={{ background: 'var(--theme-btn-primary)' }}
            >
              {selectedValues.filter(v => v !== "ALL").length}
            </span>
          )}
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.15 }}
            style={{ color: 'var(--theme-text-faint)' }}
          >
            <FiChevronDown size={15} />
          </motion.span>
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: openUpward ? 4 : -4, scale: 0.99 }}
            animate={{ opacity: 1, y: openUpward ? -4 : 4, scale: 1 }}
            exit={{ opacity: 0, y: openUpward ? 4 : -4, scale: 0.99 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            role="listbox"
            className={`absolute left-0 right-0 z-50 flex w-full min-w-0 max-w-full flex-col rounded-[var(--radius-md)] p-1.5 ${openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'}`}
            style={{
              background: 'var(--theme-card)',
              border: '1px solid var(--theme-border)',
              boxShadow: 'var(--shadow-modal)'
            }}
          >
            {/* Search Box if list is larger */}
            {normalizedOptions.length > 6 && (
              <div className="relative mb-1.5">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search options…"
                  className="h-8 w-full text-[12px]"
                />
              </div>
            )}

            {/* Header controls: Select All / Reset */}
            <div
              className="mb-1 flex items-center justify-between px-1.5 pb-1.5 text-[11.5px]"
              style={{ borderBottom: '1px solid var(--theme-border)' }}
            >
              <button
                type="button"
                onClick={handleSelectAll}
                className="font-medium transition-colors"
                style={{ color: isAllSelected ? 'var(--theme-btn-primary)' : 'var(--theme-text-secondary)' }}
              >
                Select all ({allOptionLabel})
              </button>
              {!isAllSelected && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="flex items-center gap-1 font-medium transition-colors"
                  style={{ color: 'var(--color-danger)' }}
                >
                  <FiX size={11} /> Reset
                </button>
              )}
            </div>

            {/* Options list */}
            <div className="flex max-h-[220px] flex-col gap-0.5 overflow-y-auto pr-0.5">
              {filteredOptions.length === 0 ? (
                <div className="p-3 text-center text-[11.5px] font-medium" style={{ color: 'var(--theme-text-secondary)' }}>
                  No matching options
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isChecked = selectedValues.includes(String(opt.value));
                  return (
                    <button
                      key={String(opt.value)}
                      type="button"
                      role="option"
                      aria-selected={isChecked}
                      onClick={() => handleToggleOption(opt.value)}
                      className="flex w-full items-center justify-between rounded-[5px] px-2 py-1.5 text-left text-[12.5px] font-medium transition-colors"
                      style={
                        isChecked
                          ? { background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }
                          : { color: 'var(--theme-text-primary)' }
                      }
                      onMouseEnter={(e) => {
                        if (!isChecked) e.currentTarget.style.background = 'var(--theme-bg-soft)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isChecked) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span className="min-w-0 flex-1 truncate pr-2">{opt.label}</span>
                      {isChecked ? (
                        <FiCheckSquare size={14} className="ml-2 shrink-0" />
                      ) : (
                        <FiSquare size={14} className="ml-2 shrink-0" style={{ color: 'var(--theme-text-faint)' }} />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
