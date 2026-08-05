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
            initial={{ opacity: 0, y: openUpward ? 4 : -4, scale: 0.98 }}
            animate={{ opacity: 1, y: openUpward ? -4 : 4, scale: 1 }}
            exit={{ opacity: 0, y: openUpward ? 4 : -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute left-0 right-0 ${openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} z-50 flex flex-col rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-2.5 shadow-xl backdrop-blur-xl border-white/10 w-full min-w-0 max-w-full`}
          >
            {/* Search Box if list is larger */}
            {normalizedOptions.length > 6 && (
              <div className="relative mb-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search department..."
                  className="w-full bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl px-3 py-1.5 text-xs text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)]/50 focus:outline-none focus:border-[var(--theme-btn-primary)]"
                />
              </div>
            )}

            {/* Header controls: Select All / Reset */}
            <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-[var(--theme-border)] px-1 text-xs">
              <button
                type="button"
                onClick={handleSelectAll}
                className={`font-semibold transition-colors cursor-pointer ${isAllSelected ? 'text-[var(--theme-btn-primary)] font-bold' : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'}`}
              >
                Select All ({allOptionLabel})
              </button>
              {!isAllSelected && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <FiX size={12} /> Reset
                </button>
              )}
            </div>

            {/* Options list */}
            <div className="overflow-y-auto touch-pan-y max-h-[200px] sm:max-h-[250px] flex flex-col gap-0.5 pr-1.5 custom-scrollbar [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/30">
              {filteredOptions.length === 0 ? (
                <div className="p-3 text-center text-xs text-[var(--theme-text-secondary)] font-medium">
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
                      className={`flex items-center justify-between w-full px-3 sm:px-3.5 py-2.5 sm:py-2 my-0.5 rounded-xl text-xs sm:text-sm font-semibold transition-all text-left cursor-pointer border active:scale-[0.99] ${
                        isChecked
                          ? 'bg-[var(--theme-btn-primary)]/15 border-[var(--theme-btn-primary)]/30 text-[var(--theme-btn-primary)] font-bold'
                          : 'border-transparent text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg)] hover:border-[var(--theme-border)]/50'
                      }`}
                    >
                      <span className="flex-1 min-w-0 pr-2 tracking-wide truncate">{opt.label}</span>
                      {isChecked ? (
                        <FiCheckSquare size={16} className="text-[var(--theme-btn-primary)] shrink-0 ml-2" />
                      ) : (
                        <FiSquare size={16} className="text-[var(--theme-text-secondary)]/50 shrink-0 ml-2" />
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
