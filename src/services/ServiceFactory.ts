import { BaseService, ServiceError } from './BaseService';
import { EnhancedUserService } from './EnhancedUserService';
import { ServiceConfig, HealthStatus, ServiceMetrics } from './types';
import AuthService from './ModernAuthService';

// Service registry interface
interface ServiceRegistry {
  [key: string]: BaseService;
}

// Global service configuration
const defaultServiceConfig: ServiceConfig = {
  baseURL: '/api/v1',
  timeout: 30000,
  retries: 3,
  cache: {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 1000,
    enabled: true
  },
  features: {},
  rateLimit: {
    maxRequests: 100,
    windowMs: 60 * 1000 // 1 minute
  }
};

// Service factory class
export class ServiceFactory {
  private static instance: ServiceFactory;
  private services: ServiceRegistry = {};
  private config: ServiceConfig;
  private healthChecks: Map<string, () => Promise<boolean>> = new Map();

  private constructor(config: Partial<ServiceConfig> = {}) {
    this.config = { ...defaultServiceConfig, ...config };
    this.initializeServices();
    this.setupHealthChecks();
  }

  // Singleton pattern
  public static getInstance(config?: Partial<ServiceConfig>): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory(config);
    }
    return ServiceFactory.instance;
  }

  // Initialize all services
  private initializeServices(): void {
    // Register core services
    this.registerService('users', new EnhancedUserService());
    this.registerService('auth', new AuthService());
    // Note: Customer services replaced by React Query hooks in @/hooks/use-customer
  }

  // Register a service
  public registerService<T extends BaseService>(name: string, service: T): void {
    this.services[name] = service;
    
    // Set up health check for the service
    this.healthChecks.set(name, async () => {
      try {
        // Simple health check - try to get service metrics
        service.getMetrics();
        return true;
      } catch {
        return false;
      }
    });
  }

  // Get a service by name
  public getService<T extends BaseService>(name: string): T {
    const service = this.services[name];
    if (!service) {
      throw new ServiceError(`Service '${name}' not found`, {
        code: 'SERVICE_NOT_FOUND',
        status: 404
      });
    }
    return service as T;
  }

  // Get user service (convenience method)
  public getUserService(): EnhancedUserService {
    return this.getService<EnhancedUserService>('users');
  }

  // Customer service has been replaced by React Query hooks
  // Use useCustomers, useCreateCustomer, etc. from @/hooks/use-customer

  // Clear cache for all services
  public clearAllCaches(): void {
    Object.values(this.services).forEach(service => {
      service.clearCache();
    });
  }

  // Clear cache for specific service
  public clearServiceCache(serviceName: string): void {
    const service = this.services[serviceName];
    if (service) {
      service.clearCache();
    }
  }

  // Get metrics for all services
  public getAllMetrics(): Record<string, ServiceMetrics> {
    const metrics: Record<string, ServiceMetrics> = {};
    
    Object.entries(this.services).forEach(([name, service]) => {
      metrics[name] = service.getMetrics();
    });
    
    return metrics;
  }

  // Get metrics for specific service
  public getServiceMetrics(serviceName: string): ServiceMetrics | null {
    const service = this.services[serviceName];
    return service ? service.getMetrics() : null;
  }

  // Reset metrics for all services
  public resetAllMetrics(): void {
    Object.values(this.services).forEach(service => {
      service.resetMetrics();
    });
  }

  // Get cache stats for all services
  public getAllCacheStats(): Record<string, { size: number; maxSize: number }> {
    const stats: Record<string, { size: number; maxSize: number }> = {};
    
    Object.entries(this.services).forEach(([name, service]) => {
      stats[name] = service.getCacheStats();
    });
    
    return stats;
  }

  // Setup health checks
  private setupHealthChecks(): void {
    // Add basic health checks for common service dependencies
    this.healthChecks.set('database', async () => {
      // Placeholder for database health check
      // In a real app, this would check database connectivity
      return true;
    });

    this.healthChecks.set('redis', async () => {
      // Placeholder for Redis health check
      // In a real app, this would check Redis connectivity
      return true;
    });

    this.healthChecks.set('external_api', async () => {
      // Placeholder for external API health check
      return true;
    });
  }

  // Perform health check
  public async getHealthStatus(): Promise<HealthStatus> {
    const services: HealthStatus['services'] = {};
    let overallStatus: HealthStatus['status'] = 'healthy';

    // Check all registered health checks
    for (const [name, healthCheck] of this.healthChecks) {
      const startTime = Date.now();
      
      try {
        const isHealthy = await Promise.race([
          healthCheck(),
          // Timeout after 5 seconds
          new Promise<boolean>((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), 5000)
          )
        ]);

        const responseTime = Date.now() - startTime;
        
        services[name] = {
          status: isHealthy ? 'up' : 'down',
          responseTime,
          lastCheck: new Date()
        };

        if (!isHealthy) {
          overallStatus = overallStatus === 'healthy' ? 'degraded' : 'unhealthy';
        }
      } catch (error) {
        const responseTime = Date.now() - startTime;
        
        services[name] = {
          status: 'down',
          responseTime,
          lastCheck: new Date()
        };

        overallStatus = 'unhealthy';
      }
    }

    return {
      status: overallStatus,
      version: '1.0.0', // This should come from package.json or environment
      timestamp: new Date(),
      services
    };
  }

  // Update service configuration
  public updateConfig(newConfig: Partial<ServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current configuration
  public getConfig(): ServiceConfig {
    return { ...this.config };
  }

  // Check if a feature is enabled
  public isFeatureEnabled(featureName: string): boolean {
    const feature = this.config.features[featureName];
    return feature ? feature.enabled : false;
  }

  // Get list of all registered services
  public getRegisteredServices(): string[] {
    return Object.keys(this.services);
  }

  // Graceful shutdown of all services
  public async shutdown(): Promise<void> {
    // Clear all caches
    this.clearAllCaches();
    
    // Reset all metrics
    this.resetAllMetrics();
    
    // Additional cleanup can be added here
    console.log('All services shut down gracefully');
  }
}

// Service utilities
export const serviceUtils = {
  // Format service error for display
  formatServiceError: (error: ServiceError): string => {
    if (error.errors) {
      const errorMessages = Object.values(error.errors).flat();
      return errorMessages.join(', ');
    }
    return error.message;
  },

  // Check if error is a service error
  isServiceError: (error: unknown): error is ServiceError => {
    return error instanceof ServiceError;
  },

  // Retry a service operation with exponential backoff
  retryOperation: async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> => {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxRetries) {
          break;
        }

        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  },

  // Batch operations with concurrency control
  batchOperation: async <T, R>(
    items: T[],
    operation: (item: T) => Promise<R>,
    batchSize: number = 10,
    concurrency: number = 3
  ): Promise<R[]> => {
    const results: R[] = [];
    
    // Process items in batches
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      // Process batch items with concurrency control
      const batchPromises = batch.map(item => operation(item));
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Collect successful results and handle errors
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`Batch operation failed for item ${i + index}:`, result.reason);
          // Could implement error handling strategy here
        }
      });
    }
    
    return results;
  }
};

// Create and export default service factory instance
export const serviceFactory = ServiceFactory.getInstance();

// Export individual services for convenience
export const userService = serviceFactory.getUserService();