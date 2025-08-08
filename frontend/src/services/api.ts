// ==============================================================================
// File: frontend/src/services/api.ts
// Description: This file reads the environment variable to configure Axios.
// ==============================================================================
import axios from 'axios';

const apiClient = axios.create({
  // This line reads the variable from your .env file
  baseURL: import.meta.env.VITE_API_BASE_URL, 
});

// This interceptor automatically adds the auth token to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;