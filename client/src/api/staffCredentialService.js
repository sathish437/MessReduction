import apiClient from './apiClient';

/**
 * Fetch all staff credentials (safe view, passwords masked/omitted).
 */
export const getStaffCredentials = async () => {
  const response = await apiClient.get('/api/admin/staff-credentials');
  return response.data;
};

/**
 * Update staff username and/or password.
 * @param {number|string} id - Staff User ID
 * @param {object} payload - { username: string, password?: string }
 */
export const updateStaffCredential = async (id, payload) => {
  const response = await apiClient.put(`/api/admin/staff-credentials/${id}`, payload);
  return response.data;
};
