import React, { useState, useEffect } from 'react';
import { FiAlertCircle, FiClock, FiCalendar } from 'react-icons/fi';
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
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <div className="skeleton h-6 w-44" />
        <div className="skeleton h-3.5 w-72" />
        <div className="skeleton mt-2 h-64 w-full" />
        <div className="skeleton h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex w-full max-w-4xl min-w-0 flex-col gap-5 pb-10">
      {/* Toast Notification Panel */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Page Header */}
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">
          Configure notification schedules and mess reduction holiday deduction policies.
        </p>
      </div>

      {/* Setting 1: Reminder Before Arrival */}
      <section className="panel">
        <header className="panel-header">
          <div className="flex items-start gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)]"
              style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}
            >
              <FiClock size={17} />
            </div>
            <div>
              <h2 className="panel-title">Reminder before arrival</h2>
              <p className="panel-subtitle">
                Number of days before a student&apos;s arrival that warden reminders are generated.
              </p>
            </div>
          </div>
        </header>

        <form onSubmit={handleSaveReminder} className="space-y-5 p-5">
          <div>
            <label className="field-label" htmlFor="reminder-offset">Reminder timing window</label>
            <div className="flex flex-wrap items-center gap-3">
              <input
                id="reminder-offset"
                type="number"
                min="1"
                step="1"
                value={reminderOffset}
                onChange={handleReminderChange}
                className="h-10 w-28 text-[13px] font-semibold"
                style={reminderError ? { borderColor: 'var(--color-danger)' } : undefined}
              />
              <span className="text-[12.5px] font-medium text-[var(--theme-text-secondary)]">
                days before arrival
              </span>
            </div>

            {/* Quick Select Presets */}
            <div className="mt-4">
              <span className="section-label">Quick presets</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[1, 2, 3, 5, 7].map((num) => {
                  const active = Number(reminderOffset) === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setReminderOffset(String(num));
                        setReminderError('');
                      }}
                      aria-pressed={active}
                      className="h-8 rounded-[var(--radius-sm)] border px-3 text-[12px] font-medium transition-colors"
                      style={
                        active
                          ? {
                              background: 'var(--theme-btn-primary)',
                              borderColor: 'var(--theme-btn-primary)',
                              color: '#ffffff'
                            }
                          : {
                              background: 'var(--theme-card)',
                              borderColor: 'var(--theme-border)',
                              color: 'var(--theme-text-secondary)'
                            }
                      }
                    >
                      {num} {num === 1 ? 'day' : 'days'}
                    </button>
                  );
                })}
              </div>
            </div>

            {reminderError && (
              <p className="mt-2 flex items-center gap-1.5 text-[11.5px] font-medium" style={{ color: 'var(--color-danger)' }}>
                <FiAlertCircle size={13} />
                {reminderError}
              </p>
            )}
          </div>

          <div
            className="flex justify-end pt-3.5"
            style={{ borderTop: '1px solid var(--theme-border)' }}
          >
            <button
              type="submit"
              disabled={savingReminder || Boolean(reminderError)}
              className="btn btn-primary"
            >
              {savingReminder ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Saving…
                </>
              ) : (
                'Save reminder changes'
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Setting 2: Holiday Deduction */}
      <section className="panel">
        <header className="panel-header">
          <div className="flex items-start gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)]"
              style={{ background: 'var(--color-info-soft)', color: 'var(--color-info)' }}
            >
              <FiCalendar size={17} />
            </div>
            <div>
              <h2 className="panel-title">Holiday deduction</h2>
              <p className="panel-subtitle">
                Days deducted from the start of every new mess reduction request.
              </p>
            </div>
          </div>
        </header>

        <form onSubmit={handleSaveDeduction} className="space-y-5 p-5">
          <div>
            <label className="field-label" htmlFor="holiday-deduction">Days to deduct</label>
            <div className="flex flex-wrap items-center gap-3">
              <input
                id="holiday-deduction"
                type="number"
                min="0"
                step="1"
                value={holidayDeduction}
                onChange={handleDeductionChange}
                className="h-10 w-28 text-[13px] font-semibold"
                style={deductionError ? { borderColor: 'var(--color-danger)' } : undefined}
              />
              <span className="text-[12.5px] font-medium text-[var(--theme-text-secondary)]">
                days deducted
              </span>
            </div>

            {/* Quick Select Presets */}
            <div className="mt-4">
              <span className="section-label">Quick presets</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[0, 1, 2, 3, 4, 5].map((num) => {
                  const active = Number(holidayDeduction) === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setHolidayDeduction(String(num));
                        setDeductionError('');
                      }}
                      aria-pressed={active}
                      className="h-8 rounded-[var(--radius-sm)] border px-3 text-[12px] font-medium transition-colors"
                      style={
                        active
                          ? {
                              background: 'var(--theme-btn-primary)',
                              borderColor: 'var(--theme-btn-primary)',
                              color: '#ffffff'
                            }
                          : {
                              background: 'var(--theme-card)',
                              borderColor: 'var(--theme-border)',
                              color: 'var(--theme-text-secondary)'
                            }
                      }
                    >
                      {num} {num === 1 ? 'day' : 'days'}
                    </button>
                  );
                })}
              </div>
            </div>

            {deductionError && (
              <p className="mt-2 flex items-center gap-1.5 text-[11.5px] font-medium" style={{ color: 'var(--color-danger)' }}>
                <FiAlertCircle size={13} />
                {deductionError}
              </p>
            )}
          </div>

          <div
            className="flex justify-end pt-3.5"
            style={{ borderTop: '1px solid var(--theme-border)' }}
          >
            <button
              type="submit"
              disabled={savingDeduction || Boolean(deductionError)}
              className="btn btn-primary"
            >
              {savingDeduction ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Saving…
                </>
              ) : (
                'Save deduction changes'
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default AdminSettings;
