import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertCircle, FiClock, FiCheckCircle } from 'react-icons/fi';
import apiClient from './api/apiClient';
import Toast from './components/Toast';

const AdminSettings = () => {
  const [reminderOffset, setReminderOffset] = useState('3');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }

  const showToastNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/admin/settings/reminder-offset');
      if (response.data && response.data.reminderDays !== undefined) {
        setReminderOffset(String(response.data.reminderDays));
      }
    } catch (err) {
      showToastNotification('Failed to load system settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const validateValue = (val) => {
    const num = Number(val);
    if (!val || isNaN(num) || num <= 0 || !Number.isInteger(num)) {
      setValidationError('Please enter a valid positive integer greater than 0.');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setReminderOffset(val);
    validateValue(val);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateValue(reminderOffset)) return;

    const num = Number(reminderOffset);
    setSaving(true);
    try {
      await apiClient.put('/api/admin/settings/reminder-offset', { reminderDays: num });
      showToastNotification('Reminder settings updated successfully.', 'success');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to save settings';
      showToastNotification(errMsg, 'error');
    } finally {
      setSaving(false);
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
          System Reminder Settings
        </h1>
        <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] font-medium mt-1">
          Configure automated notification timing for student mess reduction requests.
        </p>
      </div>

      {/* Settings Card */}
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
              Set the offset in days when upcoming arrival reminders trigger automatically.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
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
                onChange={handleInputChange}
                className={`w-36 h-11 bg-[var(--color-primary-bg)] border rounded-xl px-4 text-base font-bold text-[var(--color-text-primary)] focus:outline-none transition-all shadow-sm ${
                  validationError
                    ? 'border-rose-500 ring-2 ring-rose-500/20'
                    : 'border-[var(--color-border)] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                }`}
              />
              <span className="text-sm font-bold text-[var(--color-text-secondary)]">Days Before Arrival</span>
            </div>

            {/* Quick Select Presets */}
            <div className="pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2 block">Quick Select Presets:</span>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 5, 7].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setReminderOffset(String(num));
                      setValidationError('');
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
            {validationError && (
              <p className="text-xs font-bold text-rose-500 flex items-center gap-1.5 mt-2">
                <FiAlertCircle size={14} />
                {validationError}
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-[var(--color-border)] flex justify-end">
            <button
              type="submit"
              disabled={saving || Boolean(validationError)}
              className={`h-11 px-6 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                saving || Boolean(validationError)
                  ? 'bg-purple-600/50 text-white/50 cursor-not-allowed border border-purple-600/30'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white cursor-pointer shadow-md shadow-purple-500/20 active:scale-95'
              }`}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSettings;
