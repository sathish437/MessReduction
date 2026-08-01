import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiCheck, FiX, FiSquare, FiCheckSquare } from 'react-icons/fi';

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleOption = (optionValue) => {
    if (!onChange) return;
    const strVal = String(optionValue);

    if (strVal === "ALL") {
      onChange([]);
      return;
    }

    let newSelected;
    if (selectedValues.includes(strVal)) {
      newSelected = selectedValues.filter(v => v !== strVal && v !== "ALL");
    } else {
      newSelected = [...selectedValues.filter(v => v !== "ALL"), strVal];
    }

    // If all individual options selected, reset to empty (ALL)
    if (newSelected.length === normalizedOptions.length) {
      onChange([]);
    } else {
      onChange(newSelected);
    }
  };

  const handleSelectAll = () => {
    if (onChange) onChange([]);
  };

  const handleClearAll = () => {
    if (onChange) onChange([]);
  };

  const filteredOptions = normalizedOptions.filter(opt =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opt.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render button text summary
  const getButtonText = () => {
    if (isAllSelected || selectedValues.length === 0) {
      return allOptionLabel;
    }
    if (selectedValues.length === 1) {
      const match = normalizedOptions.find(o => String(o.value) === selectedValues[0]);
      return match ? match.label : selectedValues[0];
    }
    return `${selectedValues.length} Selected (${selectedValues.join(', ')})`;
  };

  return (
    <div className="flex flex-col gap-1.5 w-full text-left relative" ref={dropdownRef}>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">
          {label}
        </label>
      )}

      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 transition-all duration-200 w-full text-left cursor-pointer text-sm
          ${disabled ? 'opacity-50 cursor-not-allowed bg-[var(--theme-card)]/50' : 'bg-[var(--theme-bg)] hover:bg-[var(--theme-card)]'}
          ${!isAllSelected ? 'border-[var(--theme-btn-primary)] bg-[var(--theme-btn-primary)]/10 text-[var(--theme-btn-primary)] font-semibold' : 'border-[var(--theme-border)] text-[var(--theme-text-primary)]'}
          ${isOpen ? 'ring-2 ring-[var(--theme-btn-primary)]/30 border-[var(--theme-btn-primary)]' : ''}
          ${className}`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {icon && <span className="shrink-0 text-base text-[var(--theme-text-secondary)]">{icon}</span>}
          <span className="truncate">{getButtonText()}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isAllSelected && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--theme-btn-primary)] text-white">
              {selectedValues.length}
            </span>
          )}
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.15 }}
            className="text-[var(--theme-text-secondary)]"
          >
            <FiChevronDown size={16} />
          </motion.span>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 flex flex-col rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-2 shadow-2xl backdrop-blur-xl"
          >
            {/* Header controls: All toggle */}
            <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-[var(--theme-border)] px-1 text-xs">
              <button
                type="button"
                onClick={handleSelectAll}
                className={`font-semibold transition-colors ${isAllSelected ? 'text-[var(--theme-btn-primary)] font-bold' : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'}`}
              >
                Select All ({allOptionLabel})
              </button>
              {!isAllSelected && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
                >
                  <FiX size={12} /> Reset
                </button>
              )}
            </div>

            {/* Options list */}
            <div className="overflow-y-auto max-h-52 flex flex-col gap-0.5 pr-0.5 custom-scrollbar">
              {filteredOptions.length === 0 ? (
                <div className="p-3 text-center text-xs text-[var(--theme-text-secondary)]">
                  No matching options
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isChecked = selectedValues.includes(String(opt.value));
                  return (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => handleToggleOption(opt.value)}
                      className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                        isChecked
                          ? 'bg-[var(--theme-btn-primary)]/15 text-[var(--theme-btn-primary)] font-bold'
                          : 'text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg)]'
                      }`}
                    >
                      <span className="truncate pr-2">{opt.label}</span>
                      {isChecked ? (
                        <FiCheckSquare size={16} className="text-[var(--theme-btn-primary)] shrink-0" />
                      ) : (
                        <FiSquare size={16} className="text-[var(--theme-text-secondary)]/50 shrink-0" />
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
