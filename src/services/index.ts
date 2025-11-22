// Service access helpers for easy import throughout the app
import { ServiceFactory } from './ServiceFactory';
import AuthService from './ModernAuthService';
import { EnhancedUserService } from './EnhancedUserService';
import { BaseService } from './BaseService';
import type { LoginRequest } from '../Schema/auth.schema';

// Singleton service factory instance
const serviceFactory = ServiceFactory.getInstance();

// Service access helpers
export const getAuthService = (): AuthService => {
  return serviceFactory.getService<AuthService>('auth');
};

export const getUserService = (): EnhancedUserService => {
  return serviceFactory.getUserService();
};

// Legacy compatibility - can be deprecated later
export const authAPI = {
  login: async (credentials: LoginRequest) => {
    const response = await getAuthService().login(credentials);
    if (response.success && response.data) {
      return response.data; // Return LoginResponse directly for backward compatibility
    }
    throw new Error(response.message || 'Login failed');
  },
  logout: () => getAuthService().logout(),
  getCurrentUser: () => getAuthService().getCurrentUser(),
  isAuthenticated: () => getAuthService().isAuthenticated(),
  getAccessToken: () => getAuthService().getAccessToken(),
};

// Service factory utilities
export const serviceAPI = {
  // Get any registered service
  get: <T extends BaseService>(serviceName: string): T => serviceFactory.getService<T>(serviceName),
  
  // Health and monitoring
  getHealth: () => serviceFactory.getHealthStatus(),
  getMetrics: () => serviceFactory.getAllMetrics(),
  clearCaches: () => serviceFactory.clearAllCaches(),
  
  // Service registration for lazy loading
  register: <T extends BaseService>(name: string, service: T) => serviceFactory.registerService(name, service),
  
  // Feature flags
  isFeatureEnabled: (feature: string) => serviceFactory.isFeatureEnabled(feature),
};

// Direct exports for individual imports
export { BaseService, ServiceError } from './BaseService';
export { ServiceFactory } from './ServiceFactory';
export { EnhancedUserService } from './EnhancedUserService';
export { default as ModernAuthService } from './ModernAuthService';