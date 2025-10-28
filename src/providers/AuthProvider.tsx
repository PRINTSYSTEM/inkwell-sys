import { useEffect, useState } from 'react';
import { User, authenticateUser } from '../lib/mockData/users';
import { AuthContext } from '../contexts/auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider mounting, checking localStorage...');
    const storedUser = localStorage.getItem('user');
    console.log('Stored user:', storedUser);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
    console.log('AuthProvider initialized');
  }, []);

  const login = async (username: string, password: string) => {
    console.log('Login attempt:', username, password);
    const authenticatedUser = authenticateUser(username, password);
    console.log('Authentication result:', authenticatedUser);
    if (authenticatedUser) {
      setUser(authenticatedUser);
      localStorage.setItem('user', JSON.stringify(authenticatedUser));
      console.log('User set and saved to localStorage');
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}