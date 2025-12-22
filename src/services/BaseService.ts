import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import {
  ApiResponse,
  ApiError,
  ServiceOptions,
  CacheConfig,
  ServiceMetrics,
  QueryParams,
} from "./types";

/* ======================================================
   Axios metadata extension
====================================================== */
declare module "axios" {
  interface AxiosRequestConfig {
    metadata?: {
      startTime?: number;
    };
  }
}

/* ======================================================
   Utilities
====================================================== */
const isDev = import.meta.env.DEV;

const log = (...args: unknown[]) => {
  if (isDev) console.log(...args);
};

const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return `{${Object.keys(obj)
      .sort()
      .map((k) => `"${k}":${stableStringify(obj[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
};

/* ======================================================
   Cache
====================================================== */
class ServiceCache {
  private store = new Map<
    string,
    { data: unknown; timestamp: number; ttl: number }
  >();

  constructor(private readonly maxSize = 1000) {}

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.timestamp + entry.ttl) {
      this.store.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl: number): void {
    if (this.store.size >= this.maxSize) {
      this.cleanup();
    }

    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  deleteByPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.timestamp + entry.ttl) {
        this.store.delete(key);
      }
    }
  }

  getStats() {
    return {
      size: this.store.size,
      maxSize: this.maxSize,
    };
  }
}

/* ======================================================
   Error handling
====================================================== */
type BackendErrorPayload = {
  message?: string;
  code?: string;
  errors?: Record<string, string[]>;
};

const isBackendErrorPayload = (data: unknown): data is BackendErrorPayload =>
  typeof data === "object" &&
  data !== null &&
  ("message" in data || "code" in data || "errors" in data);

export class ServiceError extends Error {
  readonly code?: string;
  readonly status?: number;
  readonly errors?: Record<string, string[]>;
  readonly timestamp = new Date();

  constructor(message: string, options: Partial<ApiError> = {}) {
    super(message);
    this.name = "ServiceError";
    this.code = options.code;
    this.status = options.status;
    this.errors = options.errors;
  }
}

/* ======================================================
   Base Service
====================================================== */
export abstract class BaseService {
  protected readonly client: AxiosInstance;
  protected readonly cache: ServiceCache;
  protected readonly resourceName: string;
  protected readonly baseURL: string;
  protected readonly defaultCacheConfig: CacheConfig;

  protected metrics: ServiceMetrics & {
    cacheHits: number;
    cacheChecks: number;
  };

  constructor(
    resourceName: string,
    baseURL: string = import.meta.env.VITE_API_BASE_URL || "/api",
    cacheConfig: CacheConfig = {}
  ) {
    this.resourceName = resourceName;
    this.baseURL = baseURL;

    this.defaultCacheConfig = {
      ttl: 5 * 60 * 1000,
      maxSize: 1000,
      enabled: true,
      ...cacheConfig,
    };

    this.cache = new ServiceCache(this.defaultCacheConfig.maxSize);

    this.metrics = {
      requestCount: 0,
      errorRate: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      lastReset: new Date(),
      cacheHits: 0,
      cacheChecks: 0,
    };

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: Number(import.meta.env.VITE_API_TIMEOUT),
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    this.setupInterceptors();
  }

  /* =========================
     Interceptors
  ========================= */
  private setupInterceptors(): void {
    this.client.interceptors.request.use((config) => {
      const token = this.getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      config.metadata = { startTime: Date.now() };
      log("➡️ Request", config.method, config.url);
      return config;
    });

    this.client.interceptors.response.use(
      (res) => {
        this.updateMetrics(res);
        return res;
      },
      (err) => {
        this.updateErrorMetrics();
        return Promise.reject(this.parseError(err));
      }
    );
  }

  private getAuthToken(): string | null {
    try {
      return localStorage.getItem("accessToken");
    } catch {
      return null;
    }
  }

  /* =========================
     Metrics
  ========================= */
  private updateMetrics(response: AxiosResponse): void {
    this.metrics.requestCount++;

    const start = response.config.metadata?.startTime;
    if (!start) return;

    const duration = Date.now() - start;
    const n = this.metrics.requestCount;

    this.metrics.averageResponseTime =
      (this.metrics.averageResponseTime * (n - 1) + duration) / n;
  }

  private updateErrorMetrics(): void {
    this.metrics.requestCount++;
  }

  /* =========================
     Error parsing
  ========================= */
  private parseError(error: unknown): ServiceError {
    if (axios.isAxiosError(error)) {
      const payload = error.response?.data;
      const backend = isBackendErrorPayload(payload) ? payload : undefined;

      return new ServiceError(
        backend?.message ?? error.message ?? "Request failed",
        {
          code: backend?.code ?? error.code,
          status: error.response?.status,
          errors: backend?.errors,
        }
      );
    }

    return error instanceof ServiceError
      ? error
      : new ServiceError(
          error instanceof Error ? error.message : "Unknown error"
        );
  }

  /* =========================
     Cache helpers
  ========================= */
  protected getCacheKey(path: string, params?: unknown): string {
    return `${this.resourceName}:${path}:${
      params ? stableStringify(params) : ""
    }`;
  }

  protected clearResourceCache(): void {
    this.cache.deleteByPrefix(`${this.resourceName}:`);
  }

  /* =========================
     Core request
  ========================= */
  protected async request<T>(
    config: AxiosRequestConfig,
    options: ServiceOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      cache = this.defaultCacheConfig,
      skipCache,
      freshData,
      timeout,
      retries = 3,
      retryDelay = 1000,
      abortSignal,
    } = options;

    const isGet = config.method === "get";
    const cacheKey = isGet
      ? this.getCacheKey(config.url || "", config.params)
      : null;

    if (isGet && cache.enabled && !skipCache && !freshData && cacheKey) {
      this.metrics.cacheChecks++;
      const cached = this.cache.get<ApiResponse<T>>(cacheKey);
      if (cached) {
        this.metrics.cacheHits++;
        this.metrics.cacheHitRate =
          this.metrics.cacheHits / this.metrics.cacheChecks;
        return cached;
      }
    }

    const requestConfig: AxiosRequestConfig = {
      ...config,
      timeout: timeout ?? config.timeout,
      signal: abortSignal,
    };

    let lastError: ServiceError | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await this.client.request(requestConfig);

        const apiResponse: ApiResponse<T> = {
          success: res.status >= 200 && res.status < 300,
          data: res.data,
          message: res.statusText || "Success",
        };

        if (cacheKey && cache.enabled && apiResponse.success) {
          this.cache.set(cacheKey, apiResponse, cache.ttl);
        }

        return apiResponse;
      } catch (e) {
        lastError = e as ServiceError;
        if (
          attempt === retries ||
          (lastError.status && lastError.status < 500)
        ) {
          throw lastError;
        }
        await new Promise((r) =>
          setTimeout(r, retryDelay * Math.pow(2, attempt))
        );
      }
    }

    throw lastError!;
  }

  /* =========================
     CRUD helpers (API giữ nguyên)
  ========================= */
  protected findMany<T>(
    params?: QueryParams,
    options?: ServiceOptions
  ): Promise<ApiResponse<T[]>> {
    return this.request(
      { method: "get", url: `/${this.resourceName}`, params },
      options
    );
  }

  protected findById<T>(
    id: string | number,
    options?: ServiceOptions
  ): Promise<ApiResponse<T>> {
    return this.request(
      { method: "get", url: `/${this.resourceName}/${id}` },
      options
    );
  }

  protected create<T>(
    data: unknown,
    options?: ServiceOptions
  ): Promise<ApiResponse<T>> {
    this.clearResourceCache();
    return this.request(
      { method: "post", url: `/${this.resourceName}`, data },
      options
    );
  }

  protected update<T>(
    id: string | number,
    data: unknown,
    options?: ServiceOptions
  ): Promise<ApiResponse<T>> {
    this.clearResourceCache();
    return this.request(
      { method: "put", url: `/${this.resourceName}/${id}`, data },
      options
    );
  }

  protected delete(
    id: string | number,
    options?: ServiceOptions
  ): Promise<ApiResponse<void>> {
    this.clearResourceCache();
    return this.request(
      { method: "delete", url: `/${this.resourceName}/${id}` },
      options
    );
  }

  /* =========================
     Public helpers
  ========================= */
  public clearCache(): void {
    this.cache.clear();
  }

  public getCacheStats() {
    return this.cache.getStats();
  }

  public getMetrics(): ServiceMetrics {
    return { ...this.metrics };
  }

  public resetMetrics(): void {
    this.metrics.cacheHits = 0;
    this.metrics.cacheChecks = 0;
    this.metrics.requestCount = 0;
    this.metrics.averageResponseTime = 0;
    this.metrics.cacheHitRate = 0;
    this.metrics.lastReset = new Date();
  }
}

/* ======================================================
   getErrorMessage – CLEAN VERSION
====================================================== */
export const getErrorMessage = (
  error: unknown,
  fallback = "Đã xảy ra lỗi không xác định"
): string => {
  if (error instanceof ServiceError) {
    if (error.errors) {
      return Object.values(error.errors).flat().join(", ");
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};
