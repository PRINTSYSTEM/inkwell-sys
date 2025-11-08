import { useEffect, useState } from 'react';
import { AuthContext } from '../contexts/auth';
import { authAPI } from '@/services';
import type { UserInfo } from '@/Schema/auth.schema';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load từ hệ thống mới (real API)
    const loadStoredAuth = () => {
      const isAuth = authAPI.isAuthenticated();
      const userInfo = authAPI.getCurrentUser();
      
      if (isAuth && userInfo) {
        setUser(userInfo);
      }
      setIsLoading(false);
    };
    
    loadStoredAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const result = await authAPI.login({ username, password });
      // authAPI.login returns LoginResponse which has userInfo property
      if (result && result.userInfo) {
        setUser(result.userInfo);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    await authAPI.logout();
    setUser(null);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isLoading,
      isAuthenticated 
    }}>
      {children}
    </AuthContext.Provider>
  );
}