// src/context/auth-context.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import type {
  LoginRequest,
  ChangePasswordRequest,
  UserInfo,
  LoginResponse,
} from "../Schema";
import { authService } from "../services/authService";
import { AuthUtils } from "../services/AuthUtils";

type AuthUser = UserInfo | null;

interface AuthState {
  user: AuthUser;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (payload: LoginRequest) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  changePassword: (payload: ChangePasswordRequest) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Khởi tạo từ localStorage, không gọi API validate
  useEffect(() => {
    const token = AuthUtils.getAccessToken();
    const userInfo = AuthUtils.getUserInfo();

    setAccessToken(token);
    setUser(userInfo);
    setIsLoading(false);
  }, []);

  const login = async (payload: LoginRequest): Promise<LoginResponse> => {
    const res = await authService.login(payload);
    setAccessToken(res.accessToken ?? null);
    setUser(res.userInfo ?? null);
    return res;
  };

  const logout = async (): Promise<void> => {
    await authService.logout();
    setAccessToken(null);
    setUser(null);
  };

  const changePassword = async (
    payload: ChangePasswordRequest
  ): Promise<void> => {
    await authService.changePassword(payload);
  };

  const value: AuthContextValue = useMemo(
    () => ({
      user,
      accessToken,
      isAuthenticated: !!user && !!accessToken,
      isLoading,
      login,
      logout,
      changePassword,
    }),
    [user, accessToken, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuthContext = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return ctx;
};
