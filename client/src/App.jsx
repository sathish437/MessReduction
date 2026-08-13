import { useEffect, lazy, Suspense } from 'react'
import './App.css'
import { useNavigate, useLocation } from 'react-router-dom'
import LandingPage from './LandingPage'
import StudentLogin from './StudentLogin'
import StaffLogin from './StaffLogin'
import ProtectedRoute from './ProtectedRoute'
import { isTokenExpired, getStaffDashboardRoute, logout } from './services/authService'
import { setCookie, deleteCookie } from './utils/cookieUtils'
import { requestFcmToken, setupForegroundNotificationListener } from './firebase/messaging'

// Lazy load heavy dashboard and admin routes for code splitting & initial bundle optimization
const Register = lazy(() => import('./Register'));
const HostelVerification = lazy(() => import('./HostelVerification'));
const MessReductionPage = lazy(() => import('./MessReductionPage'));
const Deputy_warden_side = lazy(() => import('./Deputy_warden_side'));
const Warden = lazy(() => import('./Warden'));
const HostelOffice = lazy(() => import('./Hostel_office'));
const AdminLogin = lazy(() => import('./AdminLogin'));
const AdminLayout = lazy(() => import('./AdminLayout'));

const RouteLoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[60vh] w-full text-[var(--color-text-secondary)]">
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-bold uppercase tracking-wider">Loading...</span>
    </div>
  </div>
);

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
  '/admin-login':         { screen: 'admin-login', protected: false },
  '/hostel-verification': { screen: 'hostel-verification', protected: false },
  '/student-register':    { screen: 'register', protected: false },
  '/register':            { screen: 'register', protected: false },
  // Protected student routes
  '/student-dashboard':   { screen: 'student-dashboard', protected: true, type: 'student' },
  '/dashboard':           { screen: 'student-dashboard', protected: true, type: 'student' },
  // Protected staff routes
  '/deputy':              { screen: 'deputy', protected: true, type: 'staff', role: 'DeputyWarden' },
  '/warden':              { screen: 'warden', protected: true, type: 'staff', role: 'Warden' },
  '/office':              { screen: 'office', protected: true, type: 'staff', role: 'Office' },
  // Admin Routes (rendered via nested routes in App.jsx but root registered here)
  '/admin':               { screen: 'admin-layout', protected: true, type: 'staff', role: 'ADMIN' },
};

// Helper: Get route config for current path
const getRouteConfig = (pathname) => {
  if (pathname.startsWith('/admin') && pathname !== '/admin-login') {
    return { screen: 'admin-layout', protected: true, type: 'staff', role: 'ADMIN' };
  }
  return ROUTE_CONFIG[pathname] || { screen: 'landing', protected: false };
};

function App() {
  const navigateReactRouter = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  // Foreground FCM notification listener & token setup
  useEffect(() => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('token');
    if (token && !isTokenExpired(token)) {
      requestFcmToken().catch(() => {});
    }

    const cleanupListener = setupForegroundNotificationListener((payload) => {
      window.dispatchEvent(new CustomEvent('app-notification-refresh', { detail: payload }));
    });

    return () => {
      if (typeof cleanupListener === 'function') {
        cleanupListener();
      }
    };
  }, []);

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

      case 'hostel-verification':
        return <HostelVerification onNavigate={navigate} />;

      case 'register':
        return <Register onNavigate={navigate} />;

      case 'student-dashboard':
        return (
          <ProtectedRoute requiredType="student" onNavigate={navigate}>
            <MessReductionPage />
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

      case 'admin-login':
        return <AdminLogin />;

      case 'admin-layout':
        return (
          <ProtectedRoute requiredType="staff" requiredRole="ADMIN" onNavigate={navigate}>
            <AdminLayout />
          </ProtectedRoute>
        );

      default:
        // Handle nested admin routes
        if (currentPath.startsWith('/admin/')) {
           return (
            <ProtectedRoute requiredType="staff" requiredRole="ADMIN" onNavigate={navigate}>
              <AdminLayout />
            </ProtectedRoute>
          );
        }
        return <LandingPage onNavigate={navigate} />;
    }
  };

  return (
    <div className="app-container">
      <Suspense fallback={<RouteLoadingSpinner />}>
        {renderScreen()}
      </Suspense>
    </div>
  );
}

export default App
