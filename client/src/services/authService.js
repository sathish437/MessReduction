// Auth Service - Centralized authentication logic
// Separates auth concerns from UI components

import apiClient from '../api/apiClient';
import { getCookie, setCookie, deleteCookie } from '../utils/cookieUtils';

// Staff auth functions
export const getStaffAuth = () => {
  return {
    token: getCookie('staffToken'),
    username: getCookie('staffUsername'),
    role: getCookie('staffRole'),
  };
};

export const setStaffAuth = (token, username, role) => {
  setCookie('staffToken', token, 7);
  setCookie('staffUsername', username, 7);
  setCookie('staffRole', role, 7);
};

export const clearStaffAuth = () => {
  deleteCookie('staffToken');
  deleteCookie('staffUsername');
  deleteCookie('staffRole');
};

export const validateStaff = async () => {
  const { token, username, role } = getStaffAuth();

  console.log(`[validateStaff] Token from cookie: ${token ? 'YES (' + token.substring(0, 20) + '...)' : 'NO'}`);
  console.log(`[validateStaff] Username from cookie: ${username || 'NONE'}`);
  console.log(`[validateStaff] Role from cookie: ${role || 'NONE'}`);

  if (!token) {
    console.warn('[validateStaff] No token found - returning invalid');
    return { valid: false, reason: 'no_token' };
  }

  try {
    // Call dedicated auth validation endpoint only
    console.log('[validateStaff] Calling /api/staff/validate...');
    const response = await apiClient.get('/api/staff/validate');
    console.log('[validateStaff] Response:', response.data);
    console.log(`[validateStaff] Success - username: ${response.data.username}, role: ${response.data.role}`);
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
  return {
    token: sessionStorage.getItem('token'),
    user: JSON.parse(sessionStorage.getItem('currentUser') || 'null'),
  };
};

export const setStudentAuth = (token, userData) => {
  sessionStorage.setItem('token', token);
  sessionStorage.setItem('currentUser', JSON.stringify(userData));
};

export const clearStudentAuth = () => {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('currentUser');
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
