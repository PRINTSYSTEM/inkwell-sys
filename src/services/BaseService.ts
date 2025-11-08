import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  ApiResponse,
  ApiError,
  ServiceOptions,
  CacheConfig,
  RequestConfig,
  ServiceMetrics,
  QueryParams
} from './types';

// Extend AxiosRequestConfig to include metadata
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      startTime?: number;
    };
  }
}

// Simple in-memory cache implementation
class ServiceCache {
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();
  private maxSize: number;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl: number): void {
    // Clean up expired entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}

// Custom error class for service errors
export class ServiceError extends Error {
  public readonly code?: string;
  public readonly status?: number;
  public readonly errors?: Record<string, string[]>;
  public readonly timestamp: Date;

  constructor(message: string, options: Partial<ApiError> = {}) {
    super(message);
    this.name = 'ServiceError';
    this.code = options.code;
    this.status = options.status;
    this.errors = options.errors;
    this.timestamp = new Date();
  }
}

// Base service class
export abstract class BaseService {
  protected client: AxiosInstance;
  protected cache: ServiceCache;
  protected baseURL: string;
  protected resourceName: string;
  protected defaultCacheConfig: CacheConfig;
  protected metrics: ServiceMetrics;

  constructor(
    resourceName: string,
    baseURL: string = import.meta.env.VITE_API_BASE_URL || '/api',
    cacheConfig: CacheConfig = {}
  ) {
    this.resourceName = resourceName;
    this.baseURL = baseURL;
    this.defaultCacheConfig = {
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 1000,
      enabled: true,
      ...cacheConfig
    };

    // Initialize cache
    this.cache = new ServiceCache(this.defaultCacheConfig.maxSize);

    // Initialize metrics
    this.metrics = {
      requestCount: 0,
      errorRate: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      lastReset: new Date()
    };

    // Create axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Setup interceptors
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log('🔧 Request interceptor - config:', {
          method: config.method,
          url: config.url,
          baseURL: config.baseURL,
          headers: config.headers,
          data: config.data
        });

        // Add authentication token if available
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('🔑 Added auth token to request');
        }

        // Add request timestamp for metrics
        config.metadata = { startTime: Date.now() };

        return config;
      },
      (error) => {
        return Promise.reject(this.handleError(error));
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Update metrics
        this.updateMetrics(response);
        return response;
      },
      (error) => {
        // Update error metrics
        this.updateErrorMetrics(error);
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private getAuthToken(): string | null {
    // Get token from localStorage using AuthUtils key
    try {
      return localStorage.getItem('accessToken'); // Match AuthUtils.TOKEN_KEY
    } catch {
      return null;
    }
  }

  private updateMetrics(response: AxiosResponse): void {
    const startTime = response.config.metadata?.startTime;
    if (startTime) {
      const responseTime = Date.now() - startTime;
      
      // Update rolling average
      const currentCount = this.metrics.requestCount;
      const currentAverage = this.metrics.averageResponseTime;
      
      this.metrics.averageResponseTime = 
        (currentAverage * currentCount + responseTime) / (currentCount + 1);
      this.metrics.requestCount++;
    }
  }

  private updateErrorMetrics(error: unknown): void {
    this.metrics.requestCount++;
    // Error rate calculation would need more sophisticated tracking
  }

  private handleError(error: unknown): ServiceError {
    if (axios.isAxiosError(error)) {
      const response = error.response;
      const message = response?.data?.message || error.message || 'An error occurred';
      
      return new ServiceError(message, {
        code: response?.data?.code || error.code,
        status: response?.status,
        errors: response?.data?.errors
      });
    }

    if (error instanceof ServiceError) {
      return error;
    }

    return new ServiceError(
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }

  // Cache key generation
  protected getCacheKey(method: string, params?: unknown): string {
    const paramStr = params ? JSON.stringify(params) : '';
    return `${this.resourceName}:${method}:${paramStr}`;
  }

  // Generic request method with caching
  protected async request<T>(
    config: AxiosRequestConfig,
    options: ServiceOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      cache = this.defaultCacheConfig,
      skipCache = false,
      freshData = false,
      timeout,
      retries = 3,
      retryDelay = 1000
    } = options;

    // Generate cache key for GET requests
    const cacheKey = config.method === 'get' ? 
      this.getCacheKey(config.url || '', config.params) : null;

    // Try cache first for GET requests
    if (cacheKey && cache.enabled && !skipCache && !freshData) {
      const cached = this.cache.get<ApiResponse<T>>(cacheKey);
      if (cached) {
        // Update cache hit rate
        this.metrics.cacheHitRate = 
          (this.metrics.cacheHitRate * this.metrics.requestCount + 1) / 
          (this.metrics.requestCount + 1);
        return cached;
      }
    }

    // Apply request-specific config
    const requestConfig: AxiosRequestConfig = {
      ...config,
      timeout: timeout || config.timeout,
      signal: options.abortSignal
    };

    // Retry logic
    let lastError: ServiceError;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log('🚀 Making API request:', requestConfig);
        const response = await this.client.request(requestConfig);
        
        console.log('📡 API Response received:', {
          status: response.status,
          headers: response.headers,
          data: response.data
        });

        // Normalize response to ApiResponse format
        const apiResponse: ApiResponse<T> = {
          success: response.status >= 200 && response.status < 300,
          data: response.data,
          message: response.statusText || 'Success'
        };
        
        // Cache successful GET responses
        if (cacheKey && cache.enabled && apiResponse.success) {
          this.cache.set(cacheKey, apiResponse, cache.ttl || 300000);
        }

        return apiResponse;
      } catch (error) {
        lastError = error instanceof ServiceError ? error : this.handleError(error);
        
        // Don't retry for client errors (4xx) or on last attempt
        if (attempt === retries || (lastError.status && lastError.status < 500)) {
          throw lastError;
        }

        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
      }
    }

    throw lastError!;
  }

  // Standard CRUD methods
  protected async findMany<T>(params?: QueryParams, options?: ServiceOptions): Promise<ApiResponse<T[]>> {
    return this.request<T[]>({
      method: 'get',
      url: `/${this.resourceName}`,
      params
    }, options);
  }

  protected async findById<T>(id: string | number, options?: ServiceOptions): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'get',
      url: `/${this.resourceName}/${id}`
    }, options);
  }

  protected async create<T>(data: unknown, options?: ServiceOptions): Promise<ApiResponse<T>> {
    // Clear related cache entries
    this.clearResourceCache();

    return this.request<T>({
      method: 'post',
      url: `/${this.resourceName}`,
      data
    }, options);
  }

  protected async update<T>(
    id: string | number, 
    data: unknown, 
    options?: ServiceOptions
  ): Promise<ApiResponse<T>> {
    // Clear related cache entries
    this.clearResourceCache();
    this.cache.delete(this.getCacheKey('findById', id));

    return this.request<T>({
      method: 'put',
      url: `/${this.resourceName}/${id}`,
      data
    }, options);
  }

  protected async delete(id: string | number, options?: ServiceOptions): Promise<ApiResponse<void>> {
    // Clear related cache entries
    this.clearResourceCache();
    this.cache.delete(this.getCacheKey('findById', id));

    return this.request<void>({
      method: 'delete',
      url: `/${this.resourceName}/${id}`
    }, options);
  }

  // Bulk operations
  protected async bulkCreate<T>(
    items: unknown[], 
    options?: ServiceOptions
  ): Promise<ApiResponse<T[]>> {
    this.clearResourceCache();

    return this.request<T[]>({
      method: 'post',
      url: `/${this.resourceName}/bulk`,
      data: { items }
    }, options);
  }

  protected async bulkUpdate<T>(
    updates: Array<{ id: string | number; data: unknown }>,
    options?: ServiceOptions
  ): Promise<ApiResponse<T[]>> {
    this.clearResourceCache();

    return this.request<T[]>({
      method: 'put',
      url: `/${this.resourceName}/bulk`,
      data: { updates }
    }, options);
  }

  protected async bulkDelete(
    ids: Array<string | number>, 
    options?: ServiceOptions
  ): Promise<ApiResponse<void>> {
    this.clearResourceCache();

    return this.request<void>({
      method: 'delete',
      url: `/${this.resourceName}/bulk`,
      data: { ids }
    }, options);
  }

  // Cache management
  protected clearResourceCache(): void {
    // Clear all cache entries for this resource
    const prefix = `${this.resourceName}:`;
    // Note: In a real implementation, you'd want a more efficient way to clear by prefix
    this.cache.clear();
  }

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
    this.metrics = {
      requestCount: 0,
      errorRate: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      lastReset: new Date()
    };
  }
}

// Utility functions for common service operations
export const serviceUtils = {
  // Build query string from params
  buildQueryString: (params: Record<string, unknown>): string => {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, String(v)));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });
    
    return searchParams.toString();
  },

  // Debounce function for search queries
  debounce: <T extends unknown[]>(
    func: (...args: T) => void,
    delay: number
  ): ((...args: T) => void) => {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: T) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  },

  // Validate required fields
  validateRequired: (data: Record<string, unknown>, fields: string[]): string[] => {
    const errors: string[] = [];
    
    fields.forEach(field => {
      if (!data[field] || (typeof data[field] === 'string' && !data[field].toString().trim())) {
        errors.push(`${field} is required`);
      }
    });
    
    return errors;
  },

  // Format error message for display
  formatErrorMessage: (error: ServiceError): string => {
    if (error.errors) {
      const errorMessages = Object.values(error.errors).flat();
      return errorMessages.join(', ');
    }
    return error.message;
  }
};