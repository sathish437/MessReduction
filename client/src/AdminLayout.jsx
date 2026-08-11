import { useTheme } from './context/ThemeContext';
import { FiSun, FiMoon, FiSettings, FiX, FiCheck, FiClock } from 'react-icons/fi';
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MdPeople, MdLogout, MdMenu, MdPendingActions, MdSchool, MdSettings, MdVpnKey
} from 'react-icons/md';
import { logout } from './services/authService';
import apiClient from './api/apiClient';
import AdminStudents from './AdminStudents';
import AdminExtraSubmissions from './AdminExtraSubmissions';
import AdminDepartments from './AdminDepartments';
import AdminStaffCredentials from './AdminStaffCredentials';
import AdminSettings from './AdminSettings';

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
    { path: '/admin/students', icon: <MdPeople size={24} />, label: 'Students' },
    { path: '/admin/departments', icon: <MdSchool size={24} />, label: 'Departments' },
    { path: '/admin/extra-submissions', icon: <MdPendingActions size={24} />, label: 'Extra Submissions' },
    { path: '/admin/staff-credentials', icon: <MdVpnKey size={24} />, label: 'Staff Credentials' },
    { path: '/admin/settings', icon: <MdSettings size={24} />, label: 'Reminder Settings' }
  ];

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

  return (
    <div className="bg-[var(--color-primary-bg)] min-h-screen text-[var(--color-text-primary)] flex overflow-hidden w-full">
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={isMobile ? { x: -250 } : { width: 250 }}
        animate={isMobile ? { x: sidebarOpen ? 0 : -250, width: 250 } : { width: sidebarOpen ? 250 : 80, x: 0 }}
        className="admin-sidebar border-r border-[var(--color-border)] flex flex-col h-screen shrink-0 z-40 fixed md:relative bg-[var(--color-primary-bg)]"
      >
        <div className="p-4 flex items-center justify-between border-b border-[var(--color-border)]">
          <AnimatePresence mode="wait">
            {sidebarOpen && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="font-bold text-xl tracking-wider text-purple-500"
              >
                ADMIN<span className="text-[var(--color-text-primary)]">PORTAL</span>
              </motion.div>
            )}
          </AnimatePresence>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-[var(--color-card)] rounded-full transition-colors text-[var(--color-text-primary)]">
            <MdMenu size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <div
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setSidebarOpen(false);
                }}
                className={`flex items-center p-3 rounded-xl cursor-pointer transition-all duration-300 relative ${
                  isActive ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_4px_15px_rgba(147,51,234,0.4)] font-bold' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-card)] hover:text-[var(--color-text-primary)] font-medium'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-white rounded-r-full"
                  />
                )}
                <div className="shrink-0">{item.icon}</div>
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="ml-4 whitespace-nowrap text-sm"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--color-border)] space-y-2">
          <button 
            onClick={handleLogout}
            className="flex items-center p-3 w-full text-red-500 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer mt-4 font-bold text-sm"
          >
            <MdLogout size={24} />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="ml-4"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative w-full">
        {/* Top Header */}
        <header className="h-14 sm:h-16 border-b border-[var(--color-border)] backdrop-blur-xl bg-[var(--color-primary-bg)]/80 flex items-center justify-between px-3 sm:px-6 z-10 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="md:hidden p-1.5 sm:p-2 hover:bg-[var(--color-card)] rounded-xl transition-colors text-[var(--color-text-primary)] cursor-pointer shrink-0"
            >
              <MdMenu size={22} />
            </button>
            <div className="text-sm sm:text-xl font-extrabold tracking-tight truncate text-[var(--color-text-primary)]">
              {menuItems.find(item => location.pathname.startsWith(item.path))?.label || 'Students'}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => { fetchSettings(); setShowSettingsModal(true); }}
              className="h-8 sm:h-10 px-2.5 sm:px-3.5 hover:bg-[var(--color-card)] rounded-xl transition-all text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)] shadow-sm cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Admin Settings"
            >
              <FiSettings size={16} />
              <span className="hidden sm:inline">Settings</span>
            </button>
            <button onClick={toggleTheme} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-[var(--color-card)] rounded-xl transition-all text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)] shadow-sm cursor-pointer">
              {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
            </button>
            <div className="text-sm text-right hidden sm:block">
              <div className="font-bold text-xs sm:text-sm text-[var(--color-text-primary)]">Master Admin</div>
              <div className="text-[var(--color-text-secondary)] text-[11px] sm:text-xs font-medium">Administrator</div>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-xs sm:text-sm shadow-md shadow-purple-500/20 shrink-0">
              A
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <div className="flex-1 overflow-auto p-3 sm:p-6 lg:p-8 z-0 w-full relative min-w-0">
          {renderAdminContent()}
        </div>

        {/* Admin Settings Modal */}
        <AnimatePresence>
          {showSettingsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-6 relative overflow-hidden"
              >
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--color-border)]">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-lg">
                    <FiSettings size={20} />
                    <span>Admin Settings</span>
                  </div>
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-bg)] transition-colors"
                  >
                    <FiX size={20} />
                  </button>
                </div>

                {settingsToast && (
                  <div className={`mb-4 p-3 rounded-xl text-xs font-bold ${settingsToast.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
                    {settingsToast.message}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2 flex items-center gap-1.5">
                      <FiClock size={14} className="text-purple-400" />
                      Reminder Before Arrival (Days)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={reminderOffset}
                        onChange={(e) => setReminderOffset(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-24 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-base font-bold text-[var(--color-text-primary)] focus:outline-none focus:border-purple-500"
                      />
                      <span className="text-sm font-semibold text-[var(--color-text-secondary)]">Days</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2 block">Quick Select Presets:</span>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 5, 7].map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setReminderOffset(num)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            Number(reminderOffset) === num
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'bg-[var(--color-primary-bg)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]'
                          }`}
                        >
                          {num} {num === 1 ? 'Day' : 'Days'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-[var(--color-text-secondary)]/80 leading-relaxed pt-2 border-t border-[var(--color-border)]">
                    Configure how many days before arrival reminders should be sent for student mess reduction requests. Hardcoded values have been removed.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[var(--color-border)]">
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5"
                  >
                    {savingSettings ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="py-4 text-center border-t border-[var(--color-border)] bg-[var(--color-primary-bg)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-600 to-transparent opacity-50"></div>
          <p className="text-sm text-[var(--color-text-secondary)] font-medium">Developed by <span className="text-[var(--color-text-primary)]">Dhineshkumar J</span> & <span className="text-[var(--color-text-primary)]">Sathish D</span></p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">Government College of Engineering Srirangam</p>
        </footer>
      </main>
    </div>
  );
};

export default AdminLayout;
