import { BaseService, ServiceError } from "./BaseService";
import { ApiResponse } from "./types";
import type { LoginRequest, LoginResponse, UserInfo } from "../Schema/auth.schema";
import { validateLoginResponse } from "../Schema/auth.schema";

// Auth utilities for local storage management
export class AuthUtils {
  private static readonly TOKEN_KEY = 'accessToken';
  private static readonly USER_INFO_KEY = 'userInfo';

  // Get stored auth data
  static getAccessToken(): string | null {
    return localStorage.getItem(AuthUtils.TOKEN_KEY);
  }
  
  static getUserInfo(): UserInfo | null {
    const userInfo = localStorage.getItem(AuthUtils.USER_INFO_KEY);
    return userInfo ? JSON.parse(userInfo) : null;
  }
  
  // Store auth data
  static setAuthData(accessToken: string, userInfo: UserInfo): void {
    localStorage.setItem(AuthUtils.TOKEN_KEY, accessToken);
    localStorage.setItem(AuthUtils.USER_INFO_KEY, JSON.stringify(userInfo));
  }
  
  // Clear auth data
  static clearAuthData(): void {
    localStorage.removeItem(AuthUtils.TOKEN_KEY);
    localStorage.removeItem(AuthUtils.USER_INFO_KEY);
  }
  
  // Check if user is authenticated
  static isAuthenticated(): boolean {
    const token = AuthUtils.getAccessToken();
    const userInfo = AuthUtils.getUserInfo();
    return !!(token && userInfo);
  }
}

// Enhanced Auth Service using new architecture
export class AuthService extends BaseService {
  constructor() {
    super('auth'); // Let BaseService use default API base URL
    // Disable caching for auth service
    this.clearCache();
  }

  /**
   * Login user with credentials
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      console.log('🔑 AuthService.login called with:', credentials);
      
      const response = await this.request<LoginResponse>({
        method: 'POST',
        url: '/auth/login',
        data: credentials
      }, { skipCache: true });

      console.log('📡 Auth API response:', response);

      if (response.success) {
        // Validate response data - API returns LoginResponse directly
        console.log('✅ Login API response received');
        const loginData = validateLoginResponse(response.data);
        
        // Store auth data in localStorage
        AuthUtils.setAuthData(loginData.accessToken, loginData.userInfo);
        
        return {
          success: true,
          data: loginData,
          message: 'Login successful'
        };
      }

      console.log('❌ Login failed - response not successful:', response);
      throw new ServiceError(response.message || 'Login failed', {
        code: 'LOGIN_FAILED',
        status: 401
      });
    } catch (error) {
      console.error('💥 Login error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      throw error;
    }
  }

  /**
   * Logout user - clear local storage and optionally call API
   */
  async logout(callApi: boolean = true): Promise<ApiResponse<void>> {
    try {
      if (callApi) {
        await this.request<void>({
          method: 'POST',
          url: '/auth/logout'
        }, { skipCache: true });
      }

      // Clear local auth data
      AuthUtils.clearAuthData();

      return {
        success: true,
        data: undefined,
        message: 'Logout successful'
      };
    } catch (error) {
      // Always clear local data even if API call fails
      AuthUtils.clearAuthData();
      
      return {
        success: true,
        data: undefined,
        message: 'Logout completed (local data cleared)'
      };
    }
  }

  /**
   * Get current user info from localStorage
   */
  getCurrentUser(): UserInfo | null {
    return AuthUtils.getUserInfo();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return AuthUtils.isAuthenticated();
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return AuthUtils.getAccessToken();
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<ApiResponse<{ accessToken: string }>> {
    try {
      const response = await this.request<{ accessToken: string }>({
        method: 'POST',
        url: '/auth/refresh'
      }, { skipCache: true });

      if (response.success && response.data) {
        // Update stored token
        const userInfo = AuthUtils.getUserInfo();
        if (userInfo) {
          AuthUtils.setAuthData(response.data.accessToken, userInfo);
        }
      }

      return response;
    } catch (error) {
      // If refresh fails, user needs to login again
      AuthUtils.clearAuthData();
      throw error;
    }
  }

  /**
   * Validate current session
   */
  async validateSession(): Promise<ApiResponse<UserInfo>> {
    try {
      const response = await this.request<UserInfo>({
        method: 'GET',
        url: '/auth/validate'
      }, { skipCache: true });

      if (response.success && response.data) {
        // Update user info if validation successful
        const token = AuthUtils.getAccessToken();
        if (token) {
          AuthUtils.setAuthData(token, response.data);
        }
      }

      return response;
    } catch (error) {
      // If validation fails, clear auth data
      AuthUtils.clearAuthData();
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    return this.request<void>({
      method: 'POST',
      url: '/auth/change-password',
      data: { oldPassword, newPassword }
    }, { skipCache: true });
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<ApiResponse<void>> {
    return this.request<void>({
      method: 'POST',
      url: '/auth/forgot-password',
      data: { email }
    }, { skipCache: true });
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<ApiResponse<void>> {
    return this.request<void>({
      method: 'POST',
      url: '/auth/reset-password',
      data: { token, newPassword }
    }, { skipCache: true });
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData: Partial<UserInfo>): Promise<ApiResponse<UserInfo>> {
    try {
      const response = await this.request<UserInfo>({
        method: 'PUT',
        url: '/auth/profile',
        data: profileData
      }, { skipCache: true });

      if (response.success && response.data) {
        // Update stored user info
        const token = AuthUtils.getAccessToken();
        if (token) {
          AuthUtils.setAuthData(token, response.data);
        }
      }

      return response;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }
}

// Legacy API class for backward compatibility (will be deprecated)
export class AuthAPI {
  private static authService = new AuthService();

  /**
   * @deprecated Use AuthService.login() instead
   */
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await AuthAPI.authService.login(credentials);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Login failed');
  }

  /**
   * @deprecated Use AuthService.logout() instead
   */
  static async logout(): Promise<void> {
    await AuthAPI.authService.logout(true);
  }

  /**
   * @deprecated Use AuthService.getCurrentUser() instead
   */
  static getCurrentUser(): UserInfo | null {
    return AuthAPI.authService.getCurrentUser();
  }

  /**
   * @deprecated Use AuthService.isAuthenticated() instead
   */
  static isAuthenticated(): boolean {
    return AuthAPI.authService.isAuthenticated();
  }

  /**
   * @deprecated Use AuthService.getAccessToken() instead
   */
  static getAccessToken(): string | null {
    return AuthAPI.authService.getAccessToken();
  }
}

export default AuthService;