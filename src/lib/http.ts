import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import type { UserInfo } from "../Schema/auth.schema";

const parseParams = (params: Record<string, unknown>) => {
  const keys = Object.keys(params);
  let options = "";

  keys.forEach((key) => {
    const isParamTypeObject = typeof params[key] === "object";
    const isParamTypeArray =
      isParamTypeObject &&
      Array.isArray(params[key]) &&
      params[key].length >= 0;

    if (!isParamTypeObject) {
      options += `${key}=${params[key]}&`;
    }

    if (isParamTypeObject && isParamTypeArray) {
      (params[key] as unknown[]).forEach((element: unknown) => {
        options += `${key}=${element}&`;
      });
    }
  });

  return options ? options.slice(0, -1) : options;
};

// Auth utilities
export const authUtils = {
  // Get stored auth data
  getAccessToken: (): string | null => {
    return localStorage.getItem('accessToken');
  },
  
  getUserInfo: (): UserInfo | null => {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  },
  
  // Store auth data
  setAuthData: (accessToken: string, userInfo: UserInfo): void => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
  },
  
  // Clear auth data
  clearAuthData: (): void => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userInfo');
  },
  
  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = authUtils.getAccessToken();
    const userInfo = authUtils.getUserInfo();
    return !!(token && userInfo);
  },
};

// Create axios instance for monolithic API
const createApiInstance = (): AxiosInstance => {
  const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
    paramsSerializer: parseParams,
    withCredentials: false,
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
    },
  });

  // Request interceptor - Add auth token
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const { method, data } = config;

      // Add authorization header if token exists
      const token = authUtils.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Handle different content types
      if (method === "put" || method === "post" || method === "patch") {
        if (data instanceof FormData) {
          // For FormData, let browser set Content-Type automatically
          config.headers["Content-Type"] = "multipart/form-data";
        } else {
          // For JSON data
          config.headers["Content-Type"] = "application/json;charset=UTF-8";
        }
      }

      // Debug logs in development
      if (import.meta.env.VITE_SHOW_API_LOGS === 'true') {
        console.log('🚀 API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          data: config.data,
          params: config.params
        });
      }

      return config;
    },
    (error) => {
      console.error('❌ Request Error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor - Handle responses and errors
  axiosInstance.interceptors.response.use(
    (response) => {
      // Debug logs in development
      if (import.meta.env.VITE_SHOW_API_LOGS === 'true') {
        console.log('✅ API Response:', {
          status: response.status,
          url: response.config.url,
          data: response.data
        });
      }
      return response;
    },
    (error) => {
      // Handle different error cases
      if (error.response) {
        // Server responded with error status
        const { status, data } = error.response;
        
        if (status === 401) {
          // Unauthorized - clear token and redirect to login
          authUtils.clearAuthData();
          window.location.href = '/login';
        } else if (status === 403) {
          // Forbidden
          console.error('❌ Access Denied:', data.message || 'Forbidden');
        } else if (status >= 500) {
          // Server error
          console.error('❌ Server Error:', data.message || 'Internal Server Error');
        }

        console.error('❌ API Error:', {
          status,
          url: error.config?.url,
          message: data.message || error.message
        });
      } else if (error.request) {
        // Network error
        console.error('❌ Network Error:', error.message);
      } else {
        // Other error
        console.error('❌ Error:', error.message);
      }

      return Promise.reject(error);
    }
  );

  return axiosInstance;
};

// Single API instance for monolithic architecture
export const apiRequest = createApiInstance();