import apiClient from './apiClient';
import { getCookie } from '../utils/cookieUtils';

export const DEFAULT_DEPARTMENTS = [
  { id: 1, departmentCode: 'CSE', departmentName: 'Computer Science and Engineering', shortName: 'CSE', orderIndex: 1, isActive: true },
  { id: 2, departmentCode: 'ECE', departmentName: 'Electronics and Communication Engineering', shortName: 'ECE', orderIndex: 2, isActive: true },
  { id: 3, departmentCode: 'EEE', departmentName: 'Electrical and Electronics Engineering', shortName: 'EEE', orderIndex: 3, isActive: true },
  { id: 4, departmentCode: 'CIVIL', departmentName: 'Civil Engineering', shortName: 'CIVIL', orderIndex: 4, isActive: true },
  { id: 5, departmentCode: 'MECH', departmentName: 'Mechanical Engineering', shortName: 'MECH', orderIndex: 5, isActive: true },
  { id: 6, departmentCode: 'MECHATRONICS', departmentName: 'Mechatronics Engineering', shortName: 'MECHTRON', orderIndex: 6, isActive: true }
];

let activeDepartmentsCache = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60000; // 1 minute in-memory cache

const hasAuthToken = () => {
  try {
    return Boolean(
      localStorage.getItem('auth_token') ||
      sessionStorage.getItem('token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('staffToken') ||
      sessionStorage.getItem('staffToken') ||
      getCookie('staffToken') ||
      getCookie('token')
    );
  } catch {
    return false;
  }
};

export const getActiveDepartments = async (forceRefresh = false) => {
  const now = Date.now();
  if (!forceRefresh && activeDepartmentsCache && (now - cacheTimestamp < CACHE_TTL_MS)) {
    return activeDepartmentsCache;
  }

  // If no auth token is present (e.g. public registration page), return defaults
  // without sending an unauthenticated request that would fail with 401
  if (!hasAuthToken()) {
    activeDepartmentsCache = DEFAULT_DEPARTMENTS;
    cacheTimestamp = now;
    return activeDepartmentsCache;
  }

  try {
    const response = await apiClient.get('/api/departments/active');
    if (Array.isArray(response.data) && response.data.length > 0) {
      activeDepartmentsCache = response.data;
    } else {
      activeDepartmentsCache = DEFAULT_DEPARTMENTS;
    }
    cacheTimestamp = now;
    return activeDepartmentsCache;
  } catch (error) {
    if (error.response?.status !== 401) {
      console.warn('Could not load departments from API, using defaults:', error.message);
    }
    activeDepartmentsCache = activeDepartmentsCache || DEFAULT_DEPARTMENTS;
    return activeDepartmentsCache;
  }
};

export const clearDepartmentsCache = () => {
  activeDepartmentsCache = null;
  cacheTimestamp = 0;
};

export const getAllDepartments = async (params = {}) => {
  const response = await apiClient.get('/api/departments', { params });
  return response.data;
};

export const createDepartment = async (deptData) => {
  const response = await apiClient.post('/api/departments', deptData);
  clearDepartmentsCache();
  return response.data;
};

export const updateDepartment = async (id, deptData) => {
  const response = await apiClient.put(`/api/departments/${id}`, deptData);
  clearDepartmentsCache();
  return response.data;
};

export const toggleDepartmentStatus = async (id, isActive) => {
  const response = await apiClient.patch(`/api/departments/${id}/status`, { isActive });
  clearDepartmentsCache();
  return response.data;
};
