import { useEffect, useState } from 'react';
import {
  validateStaff,
  getStudentAuth,
  clearStaffAuth,
  getStaffDashboardRoute,
} from './services/authService';

function ProtectedRoute({ children, requiredType, requiredRole, requiredUsername, onNavigate }) {
  const [authState, setAuthState] = useState('loading');

  useEffect(() => {
    let mounted = true;

    const validateAuth = async () => {
      // Student route validation
      if (requiredType === 'student') {
        const { token } = getStudentAuth();
        if (!token) {
          if (mounted) {
            setAuthState('redirecting');
            onNavigate('/student-login');
          }
          return;
        }
        if (mounted) {
          setAuthState('authenticated');
        }
        return;
      }

      // Staff route validation
      if (requiredType === 'staff') {
        // Call dedicated auth validation endpoint
        const result = await validateStaff();

        if (!result.valid) {
          // Token missing or invalid
          
          if (result.reason === 'validation_error') {
            // Network error (backend down). Do not redirect to login, show error state.
            if (mounted) {
              setAuthState('network_error');
            }
            return;
          }

          if (mounted) {
            setAuthState('redirecting');
            onNavigate('/staff-login');
          }
          return;
        }

        // Token valid - check role matches
        if (requiredRole && result.role !== requiredRole) {
          // Wrong role - redirect to their correct dashboard
          if (mounted) {
            const correctRoute = getStaffDashboardRoute(result.role, result.username);
            if (correctRoute) {
              onNavigate(correctRoute);
            } else {
              clearStaffAuth();
              onNavigate('/staff-login');
            }
          }
          return;
        }

        // Role matches - check username for wardens
        if (requiredRole === 'Warden' && requiredUsername) {
          if (result.username !== requiredUsername) {
            // Wrong warden - redirect to their correct year
            if (mounted) {
              const correctRoute = getStaffDashboardRoute('Warden', result.username);
              if (correctRoute) {
                onNavigate(correctRoute);
              } else {
                clearStaffAuth();
                onNavigate('/staff-login');
              }
            }
            return;
          }
        }

        // All checks passed
        if (mounted) {
          setAuthState('authenticated');
        }
        return;
      }

      // Unknown required type
      if (mounted) {
        setAuthState('redirecting');
        onNavigate('/');
      }
    };

    // Small delay to ensure cookies are ready
    const timer = setTimeout(() => {
      validateAuth();
    }, 10);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [requiredType, requiredRole, requiredUsername, onNavigate]);

  // Show loading while validating
  if (authState === 'loading' || authState === 'redirecting') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0a1628]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/40 text-sm font-bold tracking-widest">VERIFYING...</p>
        </div>
      </div>
    );
  }

  if (authState === 'network_error') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0a1628]">
        <div className="text-center p-8 bg-[#112240] rounded-xl border border-red-500/30 max-w-md shadow-2xl">
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">!</div>
          <h2 className="text-xl font-bold text-white mb-2">Connection Error</h2>
          <p className="text-gray-400 mb-6 text-sm">Unable to reach the server. The backend might be offline or starting up.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
