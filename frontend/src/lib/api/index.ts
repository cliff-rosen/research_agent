import axios from 'axios';
import settings from '../../config/settings';

// Add this to store the handleSessionExpired callback
let sessionExpiredHandler: (() => void) | null = null;

export const setSessionExpiredHandler = (handler: () => void) => {
    sessionExpiredHandler = handler;
};

export const api = axios.create({
    baseURL: settings.apiUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config.url?.includes('/login')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      // Call the session expired handler if it exists
      if (sessionExpiredHandler) {
        sessionExpiredHandler();
      }
    }
    return Promise.reject(error);
  }
);

// Common error handling
export const handleApiError = (error: any): string => {
  if (error.response) {
    const data = error.response.data;
    return data.detail || data.message || 'An error occurred';
  } else if (error.request) {
    return 'No response from server';
  } else {
    return 'Error creating request';
  }
};

// Common date formatting
export const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleString();
}; 