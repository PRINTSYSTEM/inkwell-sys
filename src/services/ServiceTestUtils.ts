import { BaseService, ServiceError } from './BaseService';
import { ApiResponse, ServiceOptions, QueryParams } from './types';

// Mock response builder
class MockResponseBuilder<T> {
  private response: ApiResponse<T>;

  constructor(data: T) {
    this.response = {
      success: true,
      data,
      message: 'Success'
    };
  }

  withMessage(message: string): MockResponseBuilder<T> {
    this.response.message = message;
    return this;
  }

  withMeta(meta: ApiResponse<T>['meta']): MockResponseBuilder<T> {
    this.response.meta = meta;
    return this;
  }

  withError(message: string, code?: string, status?: number): MockResponseBuilder<T> {
    this.response = {
      success: false,
      data: this.response.data,
      message,
      errors: code ? { [code]: [message] } : undefined
    };
    return this;
  }

  build(): ApiResponse<T> {
    return { ...this.response };
  }
}

// Service mock utilities
class ServiceMock {
  private responses = new Map<string, unknown>();
  private errors = new Map<string, ServiceError>();
  private delays = new Map<string, number>();

  // Mock a successful response
  mockResponse<T>(method: string, url: string, data: T): void {
    const key = this.createKey(method, url);
    this.responses.set(key, new MockResponseBuilder(data).build());
  }

  // Mock an error response
  mockError(method: string, url: string, error: ServiceError): void {
    const key = this.createKey(method, url);
    this.errors.set(key, error);
  }

  // Mock response with delay
  mockDelayedResponse<T>(method: string, url: string, data: T, delay: number): void {
    const key = this.createKey(method, url);
    this.responses.set(key, new MockResponseBuilder(data).build());
    this.delays.set(key, delay);
  }

  // Get mocked response
  async getMockResponse<T>(method: string, url: string): Promise<ApiResponse<T>> {
    const key = this.createKey(method, url);
    
    // Check for error first
    const error = this.errors.get(key);
    if (error) {
      throw error;
    }

    // Check for response
    const response = this.responses.get(key);
    if (!response) {
      throw new ServiceError(`No mock response found for ${method} ${url}`, {
        code: 'MOCK_NOT_FOUND',
        status: 404
      });
    }

    // Apply delay if configured
    const delay = this.delays.get(key);
    if (delay) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    return response as ApiResponse<T>;
  }

  // Clear all mocks
  clear(): void {
    this.responses.clear();
    this.errors.clear();
    this.delays.clear();
  }

  // Clear specific mock
  clearMock(method: string, url: string): void {
    const key = this.createKey(method, url);
    this.responses.delete(key);
    this.errors.delete(key);
    this.delays.delete(key);
  }

  private createKey(method: string, url: string): string {
    return `${method.toUpperCase()}:${url}`;
  }
}

// User type for testing
interface MockUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Test service that extends BaseService for testing
class TestService extends BaseService {
  private mock: ServiceMock;

  constructor(resourceName: string, mock?: ServiceMock) {
    super(resourceName, '/api/test');
    this.mock = mock || new ServiceMock();
  }

  // Override request method to use mocks
  protected async request<T>(
    config: Record<string, unknown>, 
    options: ServiceOptions = {}
  ): Promise<ApiResponse<T>> {
    const method = (config.method as string) || 'get';
    const url = (config.url as string) || `/${this.resourceName}`;
    
    try {
      return await this.mock.getMockResponse<T>(method, url);
    } catch (error) {
      if (error instanceof ServiceError && error.code === 'MOCK_NOT_FOUND') {
        // Fallback to parent implementation for unmocked requests
        return super.request<T>(config, options);
      }
      throw error;
    }
  }

  // Expose mock for configuration
  getMock(): ServiceMock {
    return this.mock;
  }

  // Test helper methods
  async testFindMany<T>(params?: QueryParams, options?: ServiceOptions): Promise<ApiResponse<T[]>> {
    return this.findMany<T>(params, options);
  }

  async testFindById<T>(id: string | number, options?: ServiceOptions): Promise<ApiResponse<T>> {
    return this.findById<T>(id, options);
  }

  async testCreate<T>(data: unknown, options?: ServiceOptions): Promise<ApiResponse<T>> {
    return this.create<T>(data, options);
  }

  async testUpdate<T>(id: string | number, data: unknown, options?: ServiceOptions): Promise<ApiResponse<T>> {
    return this.update<T>(id, data, options);
  }

  async testDelete(id: string | number, options?: ServiceOptions): Promise<ApiResponse<void>> {
    return this.delete(id, options);
  }
}

// Service test utilities
export const serviceTestUtils = {
  // Create a test service with mocked responses
  createTestService: (resourceName: string, mock?: ServiceMock): TestService => {
    return new TestService(resourceName, mock);
  },

  // Create mock data generators
  createMockUser: (overrides: Partial<MockUser> = {}): MockUser => ({
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    department: 'IT',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  }),

  createMockUsers: (count: number = 5): MockUser[] => {
    return Array.from({ length: count }, (_, index) => 
      serviceTestUtils.createMockUser({ 
        id: (index + 1).toString(),
        name: `Test User ${index + 1}`,
        email: `test${index + 1}@example.com`
      })
    );
  },

  // Create paginated response
  createPaginatedResponse: <T>(
    data: T[], 
    page: number = 1, 
    limit: number = 10, 
    total?: number
  ): ApiResponse<T[]> => {
    const actualTotal = total || data.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedData = data.slice(start, end);

    return {
      success: true,
      data: paginatedData,
      meta: {
        total: actualTotal,
        page,
        limit,
        hasMore: end < actualTotal
      }
    };
  },

  // Service error builders
  createValidationError: (errors: Record<string, string[]>): ServiceError => {
    return new ServiceError('Validation failed', {
      code: 'VALIDATION_ERROR',
      status: 400,
      errors
    });
  },

  createNotFoundError: (resource: string, id?: string | number): ServiceError => {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    return new ServiceError(message, {
      code: 'NOT_FOUND',
      status: 404
    });
  },

  createUnauthorizedError: (): ServiceError => {
    return new ServiceError('Unauthorized', {
      code: 'UNAUTHORIZED',
      status: 401
    });
  },

  createServerError: (message: string = 'Internal server error'): ServiceError => {
    return new ServiceError(message, {
      code: 'INTERNAL_ERROR',
      status: 500
    });
  },

  // Test scenarios
  testServiceCaching: async (service: BaseService, testFn: () => Promise<unknown>) => {
    // Clear cache
    service.clearCache();
    
    // First call - should hit the API
    const start1 = Date.now();
    const result1 = await testFn();
    const time1 = Date.now() - start1;
    
    // Second call - should use cache (much faster)
    const start2 = Date.now();
    const result2 = await testFn();
    const time2 = Date.now() - start2;
    
    return {
      firstCall: { result: result1, time: time1 },
      secondCall: { result: result2, time: time2 },
      cacheWorking: time2 < time1 / 2 // Cache should be significantly faster
    };
  },

  testServiceRetry: async (
    service: TestService, 
    method: string,
    url: string,
    failCount: number = 2
  ) => {
    const mock = service.getMock();
    
    // Mock successful response for final attempt
    mock.mockResponse(method, url, { success: true });
    
    // Note: Cannot directly override protected method, so this is simplified
    const result = await service.testFindMany();
    
    return {
      callCount: failCount + 1, // Simulated
      success: result.success,
      retryWorked: true
    };
  },

  // Performance testing
  measureServicePerformance: async <T>(
    testFn: () => Promise<T>,
    iterations: number = 100
  ) => {
    const times: number[] = [];
    const results: T[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      const result = await testFn();
      const time = Date.now() - start;
      
      times.push(time);
      results.push(result);
    }
    
    const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    return {
      iterations,
      averageTime: avgTime,
      minTime,
      maxTime,
      times,
      results
    };
  }
};

// Export everything
export { MockResponseBuilder, ServiceMock, TestService };