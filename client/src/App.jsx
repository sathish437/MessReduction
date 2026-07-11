import { useEffect } from 'react'
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
import { isTokenExpired, getStaffDashboardRoute, logout } from './services/authService'
import { setCookie, deleteCookie } from './utils/cookieUtils'

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

  // Startup session checks & redirection
  useEffect(() => {
    const userType = localStorage.getItem('user_type');
    const token = localStorage.getItem('auth_token');

    if (userType === 'STUDENT') {
      if (token && !isTokenExpired(token)) {
        // Restore session
        const studentData = localStorage.getItem('student_data');
        if (studentData) {
          sessionStorage.setItem('token', token);
          sessionStorage.setItem('currentUser', studentData);
        }
        
        // Skip login page and redirect to /student-dashboard
        if (['/', '/student-login', '/staff-login', '/register'].includes(currentPath)) {
          navigate('/student-dashboard');
        }
      } else {
        // Clear student auth from localStorage & sessionStorage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_type');
        localStorage.removeItem('student_data');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('currentUser');
        
        // Redirect to student login page
        if (['/student-dashboard', '/dashboard'].includes(currentPath)) {
          navigate('/student-login');
        }
      }
    } else if (userType === 'STAFF') {
      if (token && !isTokenExpired(token)) {
        // Restore staff cookies
        const staffRole = localStorage.getItem('staff_role');
        const staffDataStr = localStorage.getItem('staff_data');
        let staffUsername = '';
        if (staffDataStr) {
          try {
            const staffData = JSON.parse(staffDataStr);
            staffUsername = staffData.username;
          } catch(e) {}
        }
        if (token) setCookie('staffToken', token, 7);
        if (staffUsername) setCookie('staffUsername', staffUsername, 7);
        if (staffRole) setCookie('staffRole', staffRole, 7);

        // Skip login page and redirect to role-based dashboard
        if (['/', '/student-login', '/staff-login', '/register'].includes(currentPath)) {
          const correctRoute = getStaffDashboardRoute(staffRole, staffUsername);
          if (correctRoute) {
            navigate(correctRoute);
          }
        }
      } else {
        // Clear staff auth
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_type');
        localStorage.removeItem('staff_role');
        localStorage.removeItem('staff_data');
        deleteCookie('staffToken');
        deleteCookie('staffUsername');
        deleteCookie('staffRole');

        // Redirect to staff login
        if (['/warden', '/deputy', '/office'].includes(currentPath)) {
          navigate('/staff-login');
        }
      }
    }
  }, [currentPath]);

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
