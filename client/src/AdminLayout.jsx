import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MdDashboard, MdPeople, MdAssignment, MdAnalytics, 
  MdList, MdSettings, MdPerson, MdLogout, MdMenu 
} from 'react-icons/md';
import { logout } from './services/authService';
import AdminDashboard from './AdminDashboard';
import AdminStudents from './AdminStudents';
import AdminRequests from './AdminRequests';
import AdminSettings from './AdminSettings';
import AdminProfile from './AdminProfile';
import AdminExtraSubmissions from './AdminExtraSubmissions';

const AdminLayout = () => {
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
    { path: '/admin/dashboard', icon: <MdDashboard size={24} />, label: 'Dashboard' },
    { path: '/admin/students', icon: <MdPeople size={24} />, label: 'Students' },
    { path: '/admin/requests', icon: <MdAssignment size={24} />, label: 'Requests' },
    { path: '/admin/extra-submissions', icon: <MdList size={24} />, label: 'Extra Permissions' },
    { path: '/admin/settings', icon: <MdSettings size={24} />, label: 'Settings' },
    { path: '/admin/profile', icon: <MdPerson size={24} />, label: 'Profile' }
  ];

  const handleLogout = async () => {
    await logout();
  };

  const renderAdminContent = () => {
    if (location.pathname.startsWith('/admin/dashboard')) return <AdminDashboard />;
    if (location.pathname.startsWith('/admin/students')) return <AdminStudents />;
    if (location.pathname.startsWith('/admin/requests')) return <AdminRequests />;
    if (location.pathname.startsWith('/admin/extra-submissions')) return <AdminExtraSubmissions />;
    if (location.pathname.startsWith('/admin/settings')) return <AdminSettings />;
    if (location.pathname.startsWith('/admin/profile')) return <AdminProfile />;
    return <AdminDashboard />;
  };

  return (
    <div className="admin-bg min-h-screen text-white flex overflow-hidden w-full">
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
        className="admin-sidebar border-r admin-border flex flex-col h-screen shrink-0 z-40 fixed md:relative bg-[#0A0A0A]"
      >
        <div className="p-4 flex items-center justify-between border-b admin-border">
          <AnimatePresence mode="wait">
            {sidebarOpen && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="font-bold text-xl tracking-wider text-red-500"
              >
                ADMIN<span className="text-white">PORTAL</span>
              </motion.div>
            )}
          </AnimatePresence>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-300">
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
                  isActive ? 'admin-primary-red text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'
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

        <div className="p-4 border-t admin-border">
          <button 
            onClick={handleLogout}
            className="flex items-center p-3 w-full text-red-400 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
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
        <header className="h-16 border-b admin-border admin-glass flex items-center justify-between px-4 md:px-6 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="md:hidden p-2 hover:bg-white/10 rounded-full transition-colors text-gray-300"
            >
              <MdMenu size={24} />
            </button>
            <div className="text-xl font-bold truncate">
              {menuItems.find(item => location.pathname.startsWith(item.path))?.label || 'Dashboard'}
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-sm text-right hidden sm:block">
              <div className="font-medium">Leodas Admin</div>
              <div className="text-gray-400 text-xs">Administrator</div>
            </div>
            <div className="w-10 h-10 rounded-full admin-primary-red flex items-center justify-center font-bold shadow-lg shadow-red-500/20 shrink-0">
              L
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <div className="flex-1 overflow-auto p-6 z-0">
          {renderAdminContent()}
        </div>

        {/* Footer */}
        <footer className="py-4 text-center border-t admin-border bg-[#0A0A0A] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50"></div>
          <p className="text-sm text-gray-400 font-medium">Developed by <span className="text-white">Dhineshkumar J</span> & <span className="text-white">Sathish D</span></p>
          <p className="text-xs text-gray-500 mt-1">Government College of Engineering Srirangam</p>
        </footer>
      </main>
    </div>
  );
};

export default AdminLayout;
