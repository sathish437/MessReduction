// Auth Service - Centralized authentication logic
// Separates auth concerns from UI components

import apiClient from '../api/apiClient';
import { getCookie, setCookie, deleteCookie } from '../utils/cookieUtils';

// Helper to parse JWT and check if it's expired
export const parseJwt = (token) => {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export const isTokenExpired = (token) => {
  if (!token) return true;
  const payload = parseJwt(token);
  if (!payload) return true;
  if (payload.exp) {
    return payload.exp < Math.floor(Date.now() / 1000);
  }
  return false;
};

// Staff auth functions
export const getStaffAuth = () => {
  const token = localStorage.getItem('auth_token') || getCookie('staffToken');
  const role = localStorage.getItem('staff_role') || getCookie('staffRole');
  let username = getCookie('staffUsername');
  if (!username) {
    try {
      const staffData = JSON.parse(localStorage.getItem('staff_data') || '{}');
      username = staffData.username;
    } catch (e) {}
  }
  return { token, username, role };
};

export const setStaffAuth = (token, username, role) => {
  // Set cookies for legacy/backend API compatibility
  setCookie('staffToken', token, 7);
  setCookie('staffUsername', username, 7);
  setCookie('staffRole', role, 7);

  // Set localStorage as required
  localStorage.setItem('auth_token', token);
  localStorage.setItem('user_type', 'STAFF');
  localStorage.setItem('staff_role', role);
  localStorage.setItem('staff_data', JSON.stringify({ username, role }));

  // Register push notifications
  registerPush().catch(err => console.error('Failed to register push:', err));
};

export const clearStaffAuth = () => {
  deleteCookie('staffToken');
  deleteCookie('staffUsername');
  deleteCookie('staffRole');

  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_type');
  localStorage.removeItem('staff_role');
  localStorage.removeItem('staff_data');
};

export const validateStaff = async () => {
  const { token, username, role } = getStaffAuth();

  if (!token || isTokenExpired(token)) {
    console.warn('[validateStaff] Token missing or expired - returning invalid');
    clearStaffAuth();
    return { valid: false, reason: 'no_token_or_expired' };
  }

  try {
    // Call dedicated auth validation endpoint only
    const response = await apiClient.get('/api/staff/validate');
    return {
      valid: true,
      username: response.data.username,
      role: response.data.role,
    };
  } catch (error) {
    console.error(`[validateStaff] Error: ${error.response?.status || error.message}`);
    if (error.response?.status === 401) {
      console.warn('[validateStaff] 401 received - clearing staff auth');
      clearStaffAuth();
      return { valid: false, reason: 'token_invalid' };
    }
    // Network or other error - don't clear auth, just report invalid
    return { valid: false, reason: 'validation_error' };
  }
};

// Student auth functions
export const getStudentAuth = () => {
  const token = localStorage.getItem('auth_token');
  const userType = localStorage.getItem('user_type');
  const userData = localStorage.getItem('student_data');
  if (userType === 'STUDENT' && token && !isTokenExpired(token)) {
    return {
      token,
      user: JSON.parse(userData || 'null'),
    };
  }
  return { token: null, user: null };
};

import { registerPush, unregisterPush } from '../utils/pushNotificationHelper';

export const setStudentAuth = (token, userData) => {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('user_type', 'STUDENT');
  localStorage.setItem('student_data', JSON.stringify(userData));
  // also set sessionStorage for legacy compatibility
  sessionStorage.setItem('token', token);
  sessionStorage.setItem('currentUser', JSON.stringify(userData));
  
  // Register push notifications
  registerPush().catch(err => console.error('Failed to register push:', err));
};

export const clearStudentAuth = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_type');
  localStorage.removeItem('student_data');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('currentUser');
};

export const logout = async () => {
  // Clear push subscription first before navigating away
  try {
    await unregisterPush();
  } catch (e) {
    console.error('Error unregistering push subscription:', e);
  }

  // Clear localStorage
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_type');
  localStorage.removeItem('student_data');
  localStorage.removeItem('staff_data');
  localStorage.removeItem('staff_role');

  // Clear sessionStorage
  sessionStorage.clear();

  // Clear cookies
  deleteCookie('staffToken');
  deleteCookie('staffUsername');
  deleteCookie('staffRole');

  // Redirect
  window.location.href = '/';
};

// Route resolution for staff
export const getStaffDashboardRoute = (role, username) => {
  if (role === 'Warden') {
    return '/warden';
  }

  if (role === 'DeputyWarden') {
    return '/deputy';
  }

  if (role === 'Office') {
    return '/office';
  }

  return null;
};
