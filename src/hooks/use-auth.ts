import { useState, useEffect, useCallback } from "react";
import { authAPI } from "../services/authService";
import type { LoginRequest, LoginResponse, UserInfo } from "../Schema/auth.schema";

// Auth state interface
interface AuthState {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Auth hook return type
interface UseAuthReturn extends AuthState {
  login: (credentials: LoginRequest) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  refetchUser: () => void;
}

/**
 * Custom hook for authentication management
 * Provides auth state and functions for login/logout
 */
export const useAuth = (): UseAuthReturn => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true, // Start with loading true to check stored auth
  });

  /**
   * Load user from localStorage on mount
   */
  useEffect(() => {
    const loadStoredAuth = () => {
      try {
        const isAuth = authAPI.isAuthenticated();
        const user = authAPI.getCurrentUser();

        setAuthState({
          user,
          isAuthenticated: isAuth,
          isLoading: false,
        });
      } catch (error) {
        console.error("Error loading stored auth:", error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    loadStoredAuth();
  }, []);

  /**
   * Login function
   */
  const login = useCallback(async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const loginResult = await authAPI.login(credentials);

      // Update auth state
      setAuthState({
        user: loginResult.userInfo,
        isAuthenticated: true,
        isLoading: false,
      });

      return loginResult;
    } catch (error) {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      throw error;
    }
  }, []);

  /**
   * Logout function
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await authAPI.logout();

      // Update auth state
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      // Even if logout fails, clear local state
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      throw error;
    }
  }, []);

  /**
   * Manually refetch user data
   * Useful for refreshing user info after updates
   */
  const refetchUser = useCallback(() => {
    const isAuth = authAPI.isAuthenticated();
    const user = authAPI.getCurrentUser();

    setAuthState(prev => ({
      ...prev,
      user,
      isAuthenticated: isAuth,
    }));
  }, []);

  return {
    ...authState,
    login,
    logout,
    refetchUser,
  };
};

/**
 * Simple hook to check authentication status only
 * Lighter alternative when you only need to check if user is logged in
 */
export const useAuthStatus = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const isAuth = authAPI.isAuthenticated();
        setIsAuthenticated(isAuth);
      } catch (error) {
        console.error("Error checking auth status:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  return { isAuthenticated, isLoading };
};

/**
 * Hook to get current user info only
 * Useful when you only need user data without auth functions
 */
export const useCurrentUser = () => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadUser = () => {
      try {
        const currentUser = authAPI.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Error loading current user:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const refreshUser = useCallback(() => {
    try {
      const currentUser = authAPI.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Error refreshing user:", error);
      setUser(null);
    }
  }, []);

  return { user, isLoading, refreshUser };
};