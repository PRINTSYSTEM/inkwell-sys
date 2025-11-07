import { apiRequest, authUtils } from "../lib/http";
import type { LoginRequest, LoginResponse, UserInfo } from "../Schema/auth.schema";
import { validateLoginResponse } from "../Schema/auth.schema";

// Auth API service
export class AuthAPI {
  /**
   * Login user
   * @param credentials - Username and password
   * @returns Promise with access token and user info
   */
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      // Make login request
      const response = await apiRequest.post("/auth/login", credentials);
      
      // Validate response data
      const loginData = validateLoginResponse(response.data);
      
      // Store auth data in localStorage
      authUtils.setAuthData(loginData.accessToken, loginData.userInfo);
      
      return loginData;
    } catch (error) {
      console.error("❌ Login failed :", error);
      throw error;
    }
  }

  /**
   * Logout user
   * Clear stored auth data and optionally call logout API
   */
  static async logout(): Promise<void> {
    try {
      // Call logout API if endpoint exists (optional)
      // await apiRequest.post("/auth/logout");
      
      // Clear stored auth data
      authUtils.clearAuthData();
      
      console.log("✅ Logout successful");
    } catch (error) {
      // Even if API call fails, still clear local data
      authUtils.clearAuthData();
      console.error("❌ Logout API failed but local data cleared:", error);
    }
  }

  /**
   * Get current user info
   * @returns Current user info from localStorage
   */
  static getCurrentUser(): UserInfo | null {
    return authUtils.getUserInfo();
  }

  /**
   * Check if user is authenticated
   * @returns boolean indicating authentication status
   */
  static isAuthenticated(): boolean {
    return authUtils.isAuthenticated();
  }

  /**
   * Get current access token
   * @returns Access token or null
   */
  static getAccessToken(): string | null {
    return authUtils.getAccessToken();
  }

  /**
   * Refresh token (if refresh endpoint exists)
   * Placeholder for future implementation
   */
  static async refreshToken(): Promise<LoginResponse | null> {
    // This would be implemented if there's a refresh token endpoint
    // const refreshToken = localStorage.getItem('refreshToken');
    // if (!refreshToken) return null;
    
    // try {
    //   const response = await apiRequest.post("/auth/refresh", { refreshToken });
    //   const loginData = validateLoginResponse(response.data);
    //   authUtils.setAuthData(loginData.accessToken, loginData.userInfo);
    //   return loginData;
    // } catch (error) {
    //   authUtils.clearAuthData();
    //   throw error;
    // }
    
    console.warn("Refresh token not implemented yet");
    return null;
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