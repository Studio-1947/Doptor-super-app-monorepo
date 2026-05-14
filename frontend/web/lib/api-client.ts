import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Safe localStorage access
const getStorageItem = (key: string) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem(key);
  }
  return null;
};

const setStorageItem = (key: string, value: string) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(key, value);
  }
};

const removeStorageItem = (key: string) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem(key);
  }
};

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = getStorageItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor - Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getStorageItem("refresh_token");
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Try to refresh the token
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token } = response.data;
        setStorageItem("access_token", access_token);

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        removeStorageItem("access_token");
        removeStorageItem("refresh_token");
        
        if (typeof window !== 'undefined') {
          window.location.href = "/login";
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
