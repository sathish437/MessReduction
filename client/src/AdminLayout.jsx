import { useTheme } from './context/ThemeContext';
import { FiSun, FiMoon, FiSettings, FiX, FiLogOut } from 'react-icons/fi';
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdPeople, MdMenu, MdPendingActions, MdSchool, MdSettings, MdVpnKey
} from 'react-icons/md';
import { logout } from './services/authService';
import apiClient from './api/apiClient';
import AdminStudents from './AdminStudents';
import AdminExtraSubmissions from './AdminExtraSubmissions';
import AdminDepartments from './AdminDepartments';
import AdminStaffCredentials from './AdminStaffCredentials';
import AdminSettings from './AdminSettings';
import logo from './assets/1000088399.png';

const AdminLayout = () => {
  const { isDark, toggleTheme } = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Admin Settings Modal State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [reminderOffset, setReminderOffset] = useState(3);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsToast, setSettingsToast] = useState(null);

  const fetchSettings = async () => {
    try {
      const res = await apiClient.get('/api/admin/settings/reminder-offset');
      if (res.data && res.data.reminderDays) {
        setReminderOffset(res.data.reminderDays);
      }
    } catch (e) {
      /* keep the previous value when the request fails */
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    if (reminderOffset < 1) return;
    setSavingSettings(true);
    try {
      await apiClient.put('/api/admin/settings/reminder-offset', { reminderDays: Number(reminderOffset) });
      setSettingsToast({ message: "Reminder offset setting saved successfully", type: "success" });
      setTimeout(() => {
        setSettingsToast(null);
        setShowSettingsModal(false);
      }, 1200);
    } catch (e) {
      setSettingsToast({ message: e.response?.data?.message || "Failed to save settings", type: "error" });
      setTimeout(() => setSettingsToast(null), 3000);
    } finally {
      setSavingSettings(false);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/admin/students', icon: <MdPeople size={19} />, label: 'Students' },
    { path: '/admin/departments', icon: <MdSchool size={19} />, label: 'Departments' },
    { path: '/admin/extra-submissions', icon: <MdPendingActions size={19} />, label: 'Extra Submissions' },
    { path: '/admin/staff-credentials', icon: <MdVpnKey size={19} />, label: 'Staff Credentials' },
    { path: '/admin/settings', icon: <MdSettings size={19} />, label: 'Reminder Settings' }
  ];

  const activeItem = menuItems.find(item => location.pathname.startsWith(item.path));

  const handleLogout = async () => {
    await logout();
  };

  const renderAdminContent = () => {
    if (location.pathname.startsWith('/admin/departments')) return <AdminDepartments />;
    if (location.pathname.startsWith('/admin/extra-submissions')) return <AdminExtraSubmissions />;
    if (location.pathname.startsWith('/admin/staff-credentials')) return <AdminStaffCredentials />;
    if (location.pathname.startsWith('/admin/settings')) return <AdminSettings />;
    // Default to Students
    return <AdminStudents />;
  };

  const expanded = isMobile ? true : sidebarOpen;

  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-[var(--theme-bg)] text-[var(--theme-text-primary)]">
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[2px] md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={isMobile ? { x: -260 } : { width: 260 }}
        animate={isMobile ? { x: sidebarOpen ? 0 : -260, width: 260 } : { width: sidebarOpen ? 260 : 76, x: 0 }}
        transition={{ type: 'tween', duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 bottom-0 left-0 z-40 flex h-screen h-[100dvh] min-h-screen flex-col border-r border-white/[0.08]"
        style={{ background: 'var(--theme-header)' }}
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between gap-2 border-b border-white/[0.08] px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-white/10 bg-white/[0.07]">
              <img src={logo} alt="GCES emblem" className="h-7 w-7 object-contain" />
            </span>
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="min-w-0 leading-tight"
                >
                  <p className="truncate text-[10px] font-medium uppercase tracking-[0.12em] text-white/55">
                    Administration
                  </p>
                  <p className="truncate text-[13.5px] font-semibold text-white">Mess Reduction</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {!isMobile && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              className="shrink-0 rounded-[var(--radius-sm)] p-1.5 text-white/55 transition-colors hover:bg-white/10 hover:text-white"
            >
              <MdMenu size={18} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2.5" aria-label="Administration sections">
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setSidebarOpen(false);
                }}
                aria-current={isActive ? 'page' : undefined}
                title={item.label}
                className={`relative flex w-full items-center rounded-[var(--radius-md)] px-3 py-2.5 text-left text-sm font-medium transition-all ${
                  isActive ? 'bg-[#1D4ED8] text-white shadow-sm font-semibold' : 'text-[#CBD5E1] hover:bg-[#17375E] hover:text-white'
                } ${expanded ? 'gap-3' : 'justify-center'}`}
              >
                {isActive && (
                  <motion.span
                    layoutId="admin-active-indicator"
                    className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-white"
                  />
                )}
                <span className="shrink-0">{item.icon}</span>
                <AnimatePresence>
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="truncate text-[12.5px] font-medium"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="mt-auto shrink-0 border-t border-white/[0.08] p-2.5">
          <button
            onClick={handleLogout}
            className={`flex w-full items-center rounded-[var(--radius-md)] px-2.5 py-2.5 text-white/60 transition-colors hover:bg-rose-500/15 hover:text-rose-200 ${
              expanded ? 'gap-3' : 'justify-center'
            }`}
            title="Sign out"
          >
            <FiLogOut size={18} />
            {expanded && <span className="truncate text-[12.5px] font-medium">Sign out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main
        className="relative flex min-h-screen min-h-[100dvh] w-full flex-1 flex-col overflow-hidden transition-[padding] duration-200"
        style={{
          paddingLeft: isMobile ? 0 : sidebarOpen ? 260 : 76
        }}
      >
        {/* Top Header */}
        <header className="z-10 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-[var(--theme-border)] bg-[var(--theme-card)] px-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-[var(--radius-sm)] p-2 text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-bg-soft)] hover:text-[var(--theme-text-primary)] md:hidden"
              aria-label="Open sidebar"
            >
              <MdMenu size={20} />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--theme-text-faint)]">
                Administration
              </p>
              <h1 className="truncate text-[15px] font-semibold tracking-tight text-[var(--theme-text-primary)]">
                {activeItem?.label || 'Students'}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => { fetchSettings(); setShowSettingsModal(true); }}
              className="btn btn-secondary h-9 px-2.5 text-[12px] sm:px-3"
              title="Admin settings"
            >
              <FiSettings size={15} />
              <span className="hidden sm:inline">Settings</span>
            </button>

            <button
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-bg-soft)] hover:text-[var(--theme-text-primary)]"
            >
              {isDark ? <FiSun size={15} /> : <FiMoon size={15} />}
            </button>

            <div className="mx-1 hidden h-6 w-px bg-[var(--theme-border)] sm:block" />

            <div className="hidden text-right sm:block">
              <p className="text-[12px] font-semibold leading-tight text-[var(--theme-text-primary)]">Master Admin</p>
              <p className="text-[10.5px] leading-tight text-[var(--theme-text-secondary)]">Administrator</p>
            </div>
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11.5px] font-semibold text-white"
              style={{ background: 'var(--theme-btn-primary)' }}
            >
              A
            </span>
          </div>
        </header>

        {/* Content */}
        <div className="relative z-0 w-full flex-1 overflow-auto p-3 sm:p-6">
          <div className="mx-auto w-full max-w-[1400px]">
            {renderAdminContent()}
          </div>
        </div>

        {/* Footer */}
        <footer className="shrink-0 border-t border-[var(--theme-border)] bg-[var(--theme-card)] px-4 py-2.5">
          <div className="mx-auto flex w-full max-w-[1400px] flex-col items-center justify-between gap-1 text-center sm:flex-row sm:text-left">
            <p className="text-[10.5px] text-[var(--theme-text-secondary)]">
              © {new Date().getFullYear()} Government College of Engineering, Srirangam
            </p>
            <p className="text-[10.5px] text-[var(--theme-text-faint)]">
              Administration · Mess Reduction Portal
            </p>
          </div>
        </footer>

        {/* Admin Settings Modal */}
        <AnimatePresence>
          {showSettingsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                onClick={() => setShowSettingsModal(false)}
                className="absolute inset-0 backdrop-blur-[2px]"
                style={{ background: 'rgba(11, 23, 40, 0.55)' }}
              />
              <motion.div
                role="dialog"
                aria-modal="true"
                initial={{ opacity: 0, scale: 0.97, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 8 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="relative w-full max-w-[440px] overflow-hidden rounded-[var(--radius-lg)]"
                style={{
                  background: 'var(--theme-card)',
                  border: '1px solid var(--theme-border)',
                  boxShadow: 'var(--shadow-modal)'
                }}
              >
                <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4">
                  <div>
                    <h3 className="text-[15px] font-semibold text-[var(--theme-text-primary)]">Admin settings</h3>
                    <p className="mt-0.5 text-xs text-[var(--theme-text-secondary)]">
                      Configure reminder timing for student requests.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    aria-label="Close"
                    className="rounded-[var(--radius-sm)] p-1.5 text-[var(--theme-text-faint)] transition-colors hover:bg-[var(--theme-bg-soft)] hover:text-[var(--theme-text-primary)]"
                  >
                    <FiX size={16} />
                  </button>
                </div>

                <div className="px-6 pb-5">
                  {settingsToast && (
                    <div
                      className="mb-4 rounded-[var(--radius-md)] px-3.5 py-2.5 text-xs font-medium"
                      style={
                        settingsToast.type === 'success'
                          ? { background: 'var(--color-success-soft)', border: '1px solid var(--color-success-border)', color: 'var(--color-success)' }
                          : { background: 'var(--color-danger-soft)', border: '1px solid var(--color-danger-border)', color: 'var(--color-danger)' }
                      }
                    >
                      {settingsToast.message}
                    </div>
                  )}

                  <label htmlFor="reminder-offset" className="field-label">
                    Reminder before arrival (days)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      id="reminder-offset"
                      type="number"
                      min="1"
                      max="30"
                      value={reminderOffset}
                      onChange={(e) => setReminderOffset(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-24 text-[13px] font-semibold"
                    />
                    <span className="text-xs text-[var(--theme-text-secondary)]">days</span>
                  </div>

                  <p className="section-label mt-5">Quick presets</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[1, 2, 3, 5, 7].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setReminderOffset(num)}
                        className={`rounded-[var(--radius-sm)] px-3 py-1.5 text-[11.5px] font-semibold transition-colors ${
                          Number(reminderOffset) === num
                            ? 'text-white'
                            : 'border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-soft)] hover:text-[var(--theme-text-primary)]'
                        }`}
                        style={Number(reminderOffset) === num ? { background: 'var(--theme-btn-primary)' } : undefined}
                      >
                        {num} {num === 1 ? 'day' : 'days'}
                      </button>
                    ))}
                  </div>

                  <p className="mt-5 border-t border-[var(--theme-border)] pt-3 text-[11.5px] leading-relaxed text-[var(--theme-text-secondary)]">
                    Reminders are sent this many days before a student's arrival date for every approved mess reduction request.
                  </p>
                </div>

                <div
                  className="flex items-center justify-end gap-2 px-6 py-3.5"
                  style={{ borderTop: '1px solid var(--theme-border)', background: 'var(--theme-card-muted)' }}
                >
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    className="btn btn-primary"
                  >
                    {savingSettings ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Saving…
                      </>
                    ) : (
                      'Save settings'
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default AdminLayout;
