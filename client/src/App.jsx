import './App.css'
import { useNavigate, useLocation } from 'react-router-dom'
import LandingPage from './LandingPage'
import StudentLogin from './StudentLogin'
import StaffLogin from './StaffLogin'
import Register from './Register'
import MessReductionPage from './MessReductionPage'
import Deputy_warden_side from './Deputy_warden_side'
import Warden from './Warden'
import HostelOffice from './Hostel_office'
import ProtectedRoute from './ProtectedRoute'

// ============================================
// ROOT ROUTER CONFIGURATION
// All app routes defined in one place
// ============================================

// Route definitions: path -> { screen, isProtected, props }
const ROUTE_CONFIG = {
  // Public routes
  '/':                    { screen: 'landing', protected: false },
  '/student-login':       { screen: 'student-login', protected: false },
  '/staff-login':         { screen: 'staff-login', protected: false },
  '/register':            { screen: 'register', protected: false },
  // Protected student routes
  '/student-dashboard':   { screen: 'student-dashboard', protected: true, type: 'student' },
  '/dashboard':           { screen: 'student-dashboard', protected: true, type: 'student' },
  // Protected staff routes
  '/deputy':              { screen: 'deputy', protected: true, type: 'staff', role: 'DeputyWarden' },
  '/warden':              { screen: 'warden', protected: true, type: 'staff', role: 'Warden' },
  '/office':              { screen: 'office', protected: true, type: 'staff', role: 'Office' },
};

// Helper: Get route config for current path
const getRouteConfig = (pathname) => {
  return ROUTE_CONFIG[pathname] || { screen: 'landing', protected: false };
};

function App() {
  const navigateReactRouter = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  // Navigation function - ONLY place that changes routes
  const navigate = (path) => {
    navigateReactRouter(path);
  };

  // Get current route configuration
  const route = getRouteConfig(currentPath);

  // Render the appropriate screen based on route
  const renderScreen = () => {
    switch (route.screen) {
      case 'landing':
        return <LandingPage onNavigate={navigate} />;

      case 'student-login':
        return <StudentLogin onNavigate={navigate} />;

      case 'staff-login':
        return <StaffLogin onNavigate={navigate} />;

      case 'register':
        return <Register onNavigate={navigate} />;

      case 'student-dashboard':
        return (
          <ProtectedRoute requiredType="student" onNavigate={navigate}>
            <div className="relative">
              <MessReductionPage />
              <button
                onClick={() => {
                  sessionStorage.removeItem("token");
                  sessionStorage.removeItem("currentUser");
                  navigate('/');
                }}
                className="fixed bottom-6 left-6 px-6 py-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 font-bold uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all z-[100]"
              >
                Logout
              </button>
            </div>
          </ProtectedRoute>
        );

      case 'deputy':
        return (
          <ProtectedRoute requiredType="staff" requiredRole="DeputyWarden" onNavigate={navigate}>
            <Deputy_warden_side onNavigate={navigate} />
          </ProtectedRoute>
        );

      case 'warden':
        return (
          <ProtectedRoute
            requiredType="staff"
            requiredRole="Warden"
            onNavigate={navigate}
          >
            <Warden onNavigate={navigate} />
          </ProtectedRoute>
        );

      case 'office':
        return (
          <ProtectedRoute requiredType="staff" requiredRole="Office" onNavigate={navigate}>
            <HostelOffice onNavigate={navigate} />
          </ProtectedRoute>
        );

      default:
        return <LandingPage onNavigate={navigate} />;
    }
  };

  return (
    <div className="app-container">
      {renderScreen()}
    </div>
  );
}

function navCls(href, current, inactive, active) {
  const isActive = current === href;
  return `px-3 py-2 rounded-md text-xs font-bold border transition-all text-center ${isActive ? active : inactive}`;
}

export default App
