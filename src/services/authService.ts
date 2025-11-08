/**
 * @deprecated This file is deprecated. Use ModernAuthService instead.
 * This file is kept for backward compatibility during migration.
 */

import type { LoginRequest, LoginResponse, UserInfo } from "../Schema/auth.schema";
import { getAuthService } from "./index";

// Auth API service - Legacy wrapper for backward compatibility
export class AuthAPI {
  /**
   * @deprecated Use getAuthService().login() instead
   * Login user
   * @param credentials - Username and password
   * @returns Promise with access token and user info
   */
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    const authService = getAuthService();
    const response = await authService.login(credentials);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Login failed');
  }

  /**
   * @deprecated Use getAuthService().logout() instead
   * Logout user
   */
  static async logout(): Promise<void> {
    const authService = getAuthService();
    await authService.logout(true);
  }

  /**
   * @deprecated Use getAuthService().getCurrentUser() instead
   * Get current user info
   * @returns Current user info from localStorage
   */
  static getCurrentUser(): UserInfo | null {
    const authService = getAuthService();
    return authService.getCurrentUser();
  }

  /**
   * @deprecated Use getAuthService().isAuthenticated() instead
   * Check if user is authenticated
   * @returns boolean indicating authentication status
   */
  static isAuthenticated(): boolean {
    const authService = getAuthService();
    return authService.isAuthenticated();
  }

  /**
   * @deprecated Use getAuthService().getAccessToken() instead
   * Get current access token
   * @returns Access token or null
   */
  static getAccessToken(): string | null {
    const authService = getAuthService();
    return authService.getAccessToken();
  }

  /**
   * @deprecated Use getAuthService().refreshToken() instead
   * Refresh token
   */
  static async refreshToken(): Promise<LoginResponse | null> {
    try {
      const authService = getAuthService();
      const response = await authService.refreshToken();
      
      if (response.success && response.data) {
        return {
          accessToken: response.data.accessToken,
          userInfo: authService.getCurrentUser()!
        };
      }
      
      return null;
    } catch (error) {
      console.error("Refresh token failed:", error);
      return null;
    }
  }
}

// Export individual functions for easier usage
export const authAPI = {
  login: AuthAPI.login,
  logout: AuthAPI.logout,
  getCurrentUser: AuthAPI.getCurrentUser,
  isAuthenticated: AuthAPI.isAuthenticated,
  getAccessToken: AuthAPI.getAccessToken,
  refreshToken: AuthAPI.refreshToken,
};

// Default export
export default AuthAPI;