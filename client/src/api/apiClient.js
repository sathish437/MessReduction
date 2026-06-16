import axios from 'axios';
import { getCookie } from '../utils/cookieUtils';

const apiClient = axios.create({
  baseURL: 'http://localhost:8083',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add the JWT token to headers
apiClient.interceptors.request.use((config) => {
  // Check for both student and staff tokens (sessionStorage, localStorage, cookies)
  const token = sessionStorage.getItem('token') ||
                localStorage.getItem('staffToken') ||
                sessionStorage.getItem('staffToken') ||
                getCookie('staffToken');

  console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
  console.log(`[API Request] Token found: ${token ? 'YES (' + token.substring(0, 20) + '...)' : 'NO'}`);

  if (token) {
    const requestPath = config.url || '';
    // Do not attach Authorization header for public registration endpoint
    if (!requestPath.includes('/api/student/reg')) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`[API Request] Authorization header set: Bearer ${token.substring(0, 20)}...`);
        // Log headers for debugging (non-sensitive partial token only)
        console.log('[API Request] Outgoing headers:', {
          Authorization: config.headers.Authorization ? (config.headers.Authorization.substring(0, 20) + '...') : null,
          'Content-Type': config.headers['Content-Type']
        });
    } else {
      console.log(`[API Request] Skipping Authorization header for ${requestPath}`);
    }
  } else {
    console.warn(`[API Request] No token found - request will be unauthenticated`);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to handle errors
// NOTE: We do NOT auto-logout on 401 here. ProtectedRoute is the ONLY
// place that should decide auth state and handle logout.
// This prevents fake redirect loops from temporary API failures.
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    // Log 401 but DO NOT auto-logout - let ProtectedRoute handle auth state
    if (error.response?.status === 401) {
      console.warn(`[API Response] 401 Unauthorized on ${error.config?.url}`);
      console.warn('[API Response] Letting ProtectedRoute handle logout decision');
      console.warn('[API Response] Request headers at failure:', error.config?.headers);
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.warn("Forbidden access.");
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      console.warn("Resource not found.");
    }

    return Promise.reject(error);
  }
);

export default apiClient;
