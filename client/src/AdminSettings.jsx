import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertCircle, FiClock, FiCalendar, FiCheckCircle } from 'react-icons/fi';
import apiClient from './api/apiClient';
import Toast from './components/Toast';

const AdminSettings = () => {
  const [reminderOffset, setReminderOffset] = useState('3');
  const [holidayDeduction, setHolidayDeduction] = useState('3');
  const [loading, setLoading] = useState(true);
  const [savingReminder, setSavingReminder] = useState(false);
  const [savingDeduction, setSavingDeduction] = useState(false);
  const [reminderError, setReminderError] = useState('');
  const [deductionError, setDeductionError] = useState('');
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }

  const showToastNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/admin/settings');
      if (response.data) {
        if (response.data.reminderDays !== undefined) {
          setReminderOffset(String(response.data.reminderDays));
        }
        if (response.data.deductionDays !== undefined) {
          setHolidayDeduction(String(response.data.deductionDays));
        }
      }
    } catch (err) {
      // Fallback to individual endpoints if needed
      try {
        const [remRes, dedRes] = await Promise.all([
          apiClient.get('/api/admin/settings/reminder-offset'),
          apiClient.get('/api/admin/settings/holiday-deduction')
        ]);
        if (remRes.data?.reminderDays !== undefined) {
          setReminderOffset(String(remRes.data.reminderDays));
        }
        if (dedRes.data?.deductionDays !== undefined) {
          setHolidayDeduction(String(dedRes.data.deductionDays));
        }
      } catch (fallbackErr) {
        showToastNotification('Failed to load system settings', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const validateReminder = (val) => {
    const num = Number(val);
    if (val === '' || isNaN(num) || num <= 0 || !Number.isInteger(num)) {
      setReminderError('Please enter a valid positive integer greater than 0.');
      return false;
    }
    setReminderError('');
    return true;
  };

  const validateDeduction = (val) => {
    const num = Number(val);
    if (val === '' || isNaN(num) || num < 0 || !Number.isInteger(num)) {
      setDeductionError('Please enter a valid non-negative integer (0 or greater).');
      return false;
    }
    setDeductionError('');
    return true;
  };

  const handleReminderChange = (e) => {
    const val = e.target.value;
    setReminderOffset(val);
    validateReminder(val);
  };

  const handleDeductionChange = (e) => {
    const val = e.target.value;
    setHolidayDeduction(val);
    validateDeduction(val);
  };

  const handleSaveReminder = async (e) => {
    e.preventDefault();
    if (!validateReminder(reminderOffset)) return;

    const num = Number(reminderOffset);
    setSavingReminder(true);
    try {
      await apiClient.put('/api/admin/settings/reminder-offset', { reminderDays: num });
      showToastNotification('Reminder settings updated successfully.', 'success');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to save reminder settings';
      showToastNotification(errMsg, 'error');
    } finally {
      setSavingReminder(false);
    }
  };

  const handleSaveDeduction = async (e) => {
    e.preventDefault();
    if (!validateDeduction(holidayDeduction)) return;

    const num = Number(holidayDeduction);
    setSavingDeduction(true);
    try {
      await apiClient.put('/api/admin/settings/holiday-deduction', { deductionDays: num });
      showToastNotification('Holiday deduction settings updated successfully.', 'success');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to save holiday deduction settings';
      showToastNotification(errMsg, 'error');
    } finally {
      setSavingDeduction(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] w-full text-[var(--color-text-secondary)] font-medium">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-5 sm:space-y-6 min-w-0 w-full max-w-4xl mx-auto relative pb-10 text-[var(--color-text-primary)]">
      {/* Toast Notification Panel */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Page Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
          System Settings
        </h1>
        <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] font-medium mt-1">
          Configure notification schedules and mess reduction holiday deduction policies.
        </p>
      </div>

      {/* Setting 1: Reminder Before Arrival */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-soft p-5 sm:p-7 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-[var(--color-border)]">
          <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-600/20 text-purple-400 flex items-center justify-center font-bold text-lg shrink-0">
            <FiClock size={20} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)]">
              Reminder Before Arrival
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] font-normal">
              Set the offset in days when upcoming arrival reminders trigger automatically for hostel staff.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveReminder} className="space-y-6">
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Reminder Timing Window
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                step="1"
                value={reminderOffset}
                onChange={handleReminderChange}
                className={`w-36 h-11 bg-[var(--color-primary-bg)] border rounded-xl px-4 text-base font-bold text-[var(--color-text-primary)] focus:outline-none transition-all shadow-sm ${
                  reminderError
                    ? 'border-rose-500 ring-2 ring-rose-500/20'
                    : 'border-[var(--color-border)] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                }`}
              />
              <span className="text-sm font-bold text-[var(--color-text-secondary)]">Days Before Arrival</span>
            </div>

            {/* Quick Select Presets */}
            <div className="pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2 block">
                Quick Select Presets:
              </span>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 5, 7].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setReminderOffset(String(num));
                      setReminderError('');
                    }}
                    className={`h-9 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      Number(reminderOffset) === num
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                        : 'bg-[var(--color-primary-bg)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-card)]'
                    }`}
                  >
                    {num} {num === 1 ? 'Day' : 'Days'}
                  </button>
                ))}
              </div>
            </div>

            {/* Validation Error */}
            {reminderError && (
              <p className="text-xs font-bold text-rose-500 flex items-center gap-1.5 mt-2">
                <FiAlertCircle size={14} />
                {reminderError}
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-[var(--color-border)] flex justify-end">
            <button
              type="submit"
              disabled={savingReminder || Boolean(reminderError)}
              className={`h-11 px-6 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                savingReminder || Boolean(reminderError)
                  ? 'bg-purple-600/50 text-white/50 cursor-not-allowed border border-purple-600/30'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white cursor-pointer shadow-md shadow-purple-500/20 active:scale-95'
              }`}
            >
              {savingReminder ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Reminder Changes'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Setting 2: Holiday Deduction */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-soft p-5 sm:p-7 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-[var(--color-border)]">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-lg shrink-0">
            <FiCalendar size={20} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)]">
              Holiday Deduction
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] font-normal">
              Admin-configured days (N) deducted from the start of new student mess reduction requests.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveDeduction} className="space-y-6">
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Days to Deduct
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                step="1"
                value={holidayDeduction}
                onChange={handleDeductionChange}
                className={`w-36 h-11 bg-[var(--color-primary-bg)] border rounded-xl px-4 text-base font-bold text-[var(--color-text-primary)] focus:outline-none transition-all shadow-sm ${
                  deductionError
                    ? 'border-rose-500 ring-2 ring-rose-500/20'
                    : 'border-[var(--color-border)] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                }`}
              />
              <span className="text-sm font-bold text-[var(--color-text-secondary)]">Days Deducted</span>
            </div>

            {/* Quick Select Presets */}
            <div className="pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2 block">
                Quick Select Presets:
              </span>
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setHolidayDeduction(String(num));
                      setDeductionError('');
                    }}
                    className={`h-9 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      Number(holidayDeduction) === num
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                        : 'bg-[var(--color-primary-bg)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-card)]'
                    }`}
                  >
                    {num} {num === 1 ? 'Day' : 'Days'}
                  </button>
                ))}
              </div>
            </div>

            {/* Validation Error */}
            {deductionError && (
              <p className="text-xs font-bold text-rose-500 flex items-center gap-1.5 mt-2">
                <FiAlertCircle size={14} />
                {deductionError}
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-[var(--color-border)] flex justify-end">
            <button
              type="submit"
              disabled={savingDeduction || Boolean(deductionError)}
              className={`h-11 px-6 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                savingDeduction || Boolean(deductionError)
                  ? 'bg-indigo-600/50 text-white/50 cursor-not-allowed border border-indigo-600/30'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white cursor-pointer shadow-md shadow-indigo-500/20 active:scale-95'
              }`}
            >
              {savingDeduction ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Deduction Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSettings;
