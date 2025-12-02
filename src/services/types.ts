// Base types for API responses and errors
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  errors?: Record<string, string[]>;
  timestamp?: string;
}

// Pagination and filtering types
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortingParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface FilterParams {
  search?: string;
  filters?: Record<string, unknown>;
}

export interface QueryParams
  extends PaginationParams,
    SortingParams,
    FilterParams {
  include?: string[];
  fields?: string[];
}

// Cache configuration
export interface CacheConfig {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of cached items
  enabled?: boolean;
}

// Request configuration
export interface RequestConfig {
  cache?: CacheConfig;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  abortSignal?: AbortSignal;
  headers?: Record<string, string>;
}

// Service method options
export interface ServiceOptions extends RequestConfig {
  skipCache?: boolean;
  freshData?: boolean;
}

// CRUD operation types
export interface CreateOptions<T> extends ServiceOptions {
  data: Omit<T, "id" | "createdAt" | "updatedAt">;
}

export interface UpdateOptions<T> extends ServiceOptions {
  id: string | number;
  data: Partial<Omit<T, "id" | "createdAt" | "updatedAt">>;
}

export interface DeleteOptions extends ServiceOptions {
  id: string | number;
}

export interface FindOptions extends ServiceOptions {
  id: string | number;
  include?: string[];
}

export interface FindManyOptions extends ServiceOptions, QueryParams {}

// Validation types
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => boolean | string;
}

export type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule;
};

// Audit and logging types
export interface AuditLog {
  action: "create" | "update" | "delete" | "read";
  resource: string;
  resourceId?: string | number;
  userId?: string;
  timestamp: Date;
  changes?: Record<string, { from: unknown; to: unknown }>;
  metadata?: Record<string, unknown>;
}

// Webhook types
export interface WebhookEvent<T = unknown> {
  type: string;
  resource: string;
  action: "created" | "updated" | "deleted";
  data: T;
  timestamp: Date;
  version: string;
}

// Bulk operations
export interface BulkCreateOptions<T> extends ServiceOptions {
  data: Array<Omit<T, "id" | "createdAt" | "updatedAt">>;
  batchSize?: number;
}

export interface BulkUpdateOptions<T> extends ServiceOptions {
  items: Array<{ id: string | number; data: Partial<T> }>;
  batchSize?: number;
}

export interface BulkDeleteOptions extends ServiceOptions {
  ids: Array<string | number>;
  batchSize?: number;
}

// Export operations
export interface ExportOptions extends ServiceOptions {
  format: "json" | "csv" | "xlsx" | "pdf";
  filters?: Record<string, unknown>;
  fields?: string[];
  filename?: string;
}

// Import operations
export interface ImportOptions extends ServiceOptions {
  file: File | Buffer;
  format: "json" | "csv" | "xlsx";
  mapping?: Record<string, string>;
  validateOnly?: boolean;
  upsert?: boolean;
}

// Real-time subscription types
export interface SubscriptionOptions {
  filters?: Record<string, unknown>;
  events?: string[];
  onData?: (data: unknown) => void;
  onError?: (error: ApiError) => void;
  onComplete?: () => void;
}

export interface Subscription {
  id: string;
  unsubscribe: () => void;
  pause: () => void;
  resume: () => void;
}

// Health check and metrics
export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  timestamp: Date;
  services: Record<
    string,
    {
      status: "up" | "down" | "degraded";
      responseTime?: number;
      lastCheck?: Date;
    }
  >;
}

export interface ServiceMetrics {
  requestCount: number;
  errorRate: number;
  averageResponseTime: number;
  cacheHitRate: number;
  lastReset: Date;
}

// Feature flags and configuration
export interface FeatureFlag {
  name: string;
  enabled: boolean;
  description?: string;
  rolloutPercentage?: number;
  conditions?: Record<string, unknown>;
}

export interface ServiceConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  cache: CacheConfig;
  features: Record<string, FeatureFlag>;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
}
