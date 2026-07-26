import { useTheme } from './context/ThemeContext';
import { FiSun, FiMoon } from 'react-icons/fi';
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MdPeople, MdLogout, MdMenu, MdPendingActions 
} from 'react-icons/md';
import { logout } from './services/authService';
import AdminStudents from './AdminStudents';
import AdminExtraSubmissions from './AdminExtraSubmissions';
import AdminDepartments from './AdminDepartments';
import { MdPerson, MdLockOutline, MdSchool } from 'react-icons/md';

const AdminLayout = () => {
  const { isDark, toggleTheme } = useTheme();


  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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
    { path: '/admin/extra-submissions', icon: <MdPendingActions size={24} />, label: 'Extra Submissions' }
  ];

  const handleLogout = async () => {
    await logout();
  };

  const renderAdminContent = () => {
    if (location.pathname.startsWith('/admin/departments')) return <AdminDepartments />;
    if (location.pathname.startsWith('/admin/extra-submissions')) return <AdminExtraSubmissions />;
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
                onClick={() => navigate(item.path)}
                className={`flex items-center p-3 rounded-xl cursor-pointer transition-all duration-300 relative ${
                  isActive ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_4px_15px_rgba(147,51,234,0.4)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-card)] hover:text-[var(--color-text-primary)]'
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
                      className="ml-4 font-medium whitespace-nowrap"
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
            className="flex items-center p-3 w-full text-red-500 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer mt-4"
          >
            <MdLogout size={24} />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="ml-4 font-medium"
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
        {/* Top Header (Optional) */}
        <header className="h-14 border-b border-[var(--color-border)] backdrop-blur-xl bg-[var(--color-primary-bg)]/80 flex items-center justify-between px-4 md:px-6 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="md:hidden p-2 hover:bg-[var(--color-card)] rounded-full transition-colors text-[var(--color-text-primary)]"
            >
              <MdMenu size={24} />
            </button>
            <div className="text-lg md:text-xl font-bold truncate">
              {menuItems.find(item => location.pathname.startsWith(item.path))?.label || 'Students'}
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <button onClick={toggleTheme} className="p-2 hover:bg-[var(--color-card)] rounded-xl transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)] shadow-sm cursor-pointer">
              {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>
            <div className="text-sm text-right hidden sm:block">
              <div className="font-medium text-xs md:text-sm">Master Admin</div>
              <div className="text-[var(--color-text-secondary)] text-[11px] md:text-xs">Administrator</div>
            </div>
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold shadow-lg shadow-purple-500/20 shrink-0">
              A
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <div className="flex-1 overflow-auto p-3 md:p-4 lg:p-5 z-0 w-full relative">
          {renderAdminContent()}
        </div>

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
