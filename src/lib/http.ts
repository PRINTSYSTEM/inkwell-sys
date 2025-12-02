import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import type { UserInfo } from "../Schema";

const parseParams = (params: Record<string, unknown>) => {
  const keys = Object.keys(params);
  let options = "";

  keys.forEach((key) => {
    const isParamTypeObject = typeof params[key] === "object";
    const isParamTypeArray =
      isParamTypeObject &&
      Array.isArray(params[key]) &&
      (params[key] as unknown[]).length >= 0;

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

// ===================== AUTH UTILS =====================

export const authUtils = {
  getAccessToken: (): string | null => {
    return localStorage.getItem("accessToken");
  },

  getUserInfo: (): UserInfo | null => {
    const userInfo = localStorage.getItem("userInfo");
    return userInfo ? JSON.parse(userInfo) : null;
  },

  setAuthData: (accessToken: string, userInfo: UserInfo): void => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("userInfo", JSON.stringify(userInfo));
  },

  clearAuthData: (): void => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userInfo");
  },

  isAuthenticated: (): boolean => {
    const token = authUtils.getAccessToken();
    const userInfo = authUtils.getUserInfo();
    return !!(token && userInfo);
  },
};

// ===================== AXIOS INSTANCE =====================

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

      const token = authUtils.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (method === "put" || method === "post" || method === "patch") {
        if (data instanceof FormData) {
          config.headers["Content-Type"] = "multipart/form-data";
        } else {
          config.headers["Content-Type"] = "application/json;charset=UTF-8";
        }
      }

      if (import.meta.env.VITE_SHOW_API_LOGS === "true") {
        console.log("🚀 API Request:", {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          data: config.data,
          params: config.params,
        });
      }

      return config;
    },
    (error) => {
      console.error("❌ Request Error:", error);
      return Promise.reject(error);
    }
  );

  // Response interceptor - Handle responses and errors
  axiosInstance.interceptors.response.use(
    (response) => {
      if (import.meta.env.VITE_SHOW_API_LOGS === "true") {
        console.log("✅ API Response:", {
          status: response.status,
          url: response.config.url,
          data: response.data,
        });
      }
      return response;
    },
    (error) => {
      if (error.response) {
        const { status, data } = error.response;

        if (status === 401) {
          authUtils.clearAuthData();
          window.location.href = "/login";
        } else if (status === 403) {
          console.error("❌ Access Denied:", data.message || "Forbidden");
        } else if (status >= 500) {
          console.error(
            "❌ Server Error:",
            data.message || "Internal Server Error"
          );
        }

        console.error("❌ API Error:", {
          status,
          url: error.config?.url,
          message: data.message || error.message,
        });
      } else if (error.request) {
        console.error("❌ Network Error:", error.message);
      } else {
        console.error("❌ Error:", error.message);
      }

      return Promise.reject(error);
    }
  );

  return axiosInstance;
};

// Axios instance dùng chung
export const apiRequest = createApiInstance();

// ===================== HTTP WRAPPER (get/post/put/delete/upload/download) =====================

export const http = {
  get: async <T>(url: string, params?: any): Promise<T> => {
    const response = await apiRequest.get<T>(url, { params });
    return response.data;
  },

  post: async <T>(url: string, data?: any): Promise<T> => {
    const response = await apiRequest.post<T>(url, data);
    return response.data;
  },

  put: async <T>(url: string, data?: any): Promise<T> => {
    const response = await apiRequest.put<T>(url, data);
    return response.data;
  },

  delete: async <T>(url: string): Promise<T> => {
    const response = await apiRequest.delete<T>(url);
    return response.data;
  },

  // Upload file (multipart/form-data)
  upload: async <T>(url: string, formData: FormData): Promise<T> => {
    const response = await apiRequest.post<T>(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Download file (blob)
  download: async (url: string, filename?: string): Promise<void> => {
    const response = await apiRequest.get(url, {
      responseType: "blob",
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },
};

// ===================== GENERIC CRUD API =====================

/**
 * TEntity: kiểu dữ liệu entity (DesignTypeEntity, MaterialTypeEntity, ...)
 * TCreate: payload khi tạo mới
 * TUpdate: payload khi update (mặc định là Partial<TCreate>)
 * TId: kiểu id (number | string)
 * TListParams: kiểu query params khi get list
 * TListResponse: kiểu response khi get list (mặc định là TEntity[])
 */
export function crudApi<
  TEntity,
  TCreate,
  TUpdate = Partial<TCreate>,
  TId = number,
  TListParams = any,
  TListResponse = TEntity[]
>(basePath: string) {
  return {
    // GET /resource
    list: (params?: TListParams) => http.get<TListResponse>(basePath, params),

    // GET /resource/:id
    get: (id: TId) => http.get<TEntity>(`${basePath}/${id}`),

    // POST /resource
    create: (data: TCreate) => http.post<TEntity>(basePath, data),

    // PUT /resource/:id
    update: (id: TId, data: TUpdate) =>
      http.put<TEntity>(`${basePath}/${id}`, data),

    // DELETE /resource/:id
    delete: (id: TId) => http.delete<void>(`${basePath}/${id}`),

    // UPLOAD file cho resource (mặc định /resource/upload)
    upload: <TResponse = any>(
      formData: FormData,
      subPath: string = "/upload"
    ) => http.upload<TResponse>(`${basePath}${subPath}`, formData),

    // DOWNLOAD file cho resource (mặc định /resource/download)
    download: (subPath: string = "/download", filename?: string) =>
      http.download(`${basePath}${subPath}`, filename),
  };
}
