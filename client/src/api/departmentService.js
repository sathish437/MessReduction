import apiClient from './apiClient';

let activeDepartmentsCache = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60000; // 1 minute in-memory cache

export const getActiveDepartments = async (forceRefresh = false) => {
  const now = Date.now();
  if (!forceRefresh && activeDepartmentsCache && (now - cacheTimestamp < CACHE_TTL_MS)) {
    return activeDepartmentsCache;
  }
  try {
    const response = await apiClient.get('/api/departments/active');
    activeDepartmentsCache = response.data || [];
    cacheTimestamp = now;
    return activeDepartmentsCache;
  } catch (error) {
    console.error('Failed to fetch active departments:', error);
    // Return cached if available, otherwise empty array
    return activeDepartmentsCache || [];
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
