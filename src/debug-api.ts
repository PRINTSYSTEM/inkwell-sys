// Debug utility to check API configuration
import { getAuthService } from './services';

export const debugAPI = {
  // Check environment variables
  checkEnv: () => {
    console.log('🔍 Environment Variables Check:');
    console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
    console.log('VITE_API_TIMEOUT:', import.meta.env.VITE_API_TIMEOUT);
    console.log('VITE_APP_ENV:', import.meta.env.VITE_APP_ENV);
  },

  // Check service configuration
  checkServices: () => {
    console.log('🔍 Service Configuration Check:');
    try {
      const authService = getAuthService();
      // Access private baseURL via prototype hack for debugging
      const baseURL = (authService as any).baseURL;
      const client = (authService as any).client;
      
      console.log('AuthService baseURL:', baseURL);
      console.log('AuthService client defaults:', client.defaults);
    } catch (error) {
      console.error('Service configuration error:', error);
    }
  },

  // Test API connection
  testConnection: async () => {
    console.log('🔍 Testing API Connection:');
    try {
      const authService = getAuthService();
      
      // Try a simple request to see what URL is actually called
      console.log('Making test request...');
      
      // This will fail but we can see the actual URL in network tab
      await authService.validateSession();
    } catch (error) {
      console.log('Expected error (helps us see actual URL):', error);
    }
  },

  // Run all checks
  runAll: () => {
    debugAPI.checkEnv();
    debugAPI.checkServices();
    debugAPI.testConnection();
  }
};

// Auto-run debug on import in development
if (import.meta.env.DEV) {
  console.log('🚀 API Debug Tools Loaded');
  console.log('Run debugAPI.runAll() in console to check configuration');
}

export default debugAPI;