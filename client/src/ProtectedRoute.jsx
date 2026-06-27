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
          console.warn(`[ProtectedRoute] Staff validation failed: ${result.reason}`);
          if (mounted) {
            setAuthState('redirecting');
            onNavigate('/staff-login');
          }
          return;
        }

        // Token valid - check role matches
        if (requiredRole && result.role !== requiredRole) {
          console.warn(`[ProtectedRoute] Role mismatch! Have: ${result.role}, Need: ${requiredRole}`);
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
            console.warn(`[ProtectedRoute] Username mismatch! Have: ${result.username}, Need: ${requiredUsername}`);
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
      console.error(`[ProtectedRoute] Unknown required type: ${requiredType}`);
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

  return children;
}

export default ProtectedRoute;
