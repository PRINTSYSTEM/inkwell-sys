// src/services/AuthService.ts
import { BaseService, ServiceError } from "./BaseService";
import type { ApiResponse } from "./types";
import {
  LoginRequest,
  LoginResponse,
  UserInfo,
  ChangePasswordRequest,
  validateLoginResponse,
} from "../Schema";
import { AuthUtils } from "./AuthUtils";

export class AuthService extends BaseService {
  constructor() {
    // resourceName = 'auth', cache tắt cho auth
    super("auth", undefined, { enabled: false });
  }

  /**
   * Đăng nhập
   * - Gọi /auth/login (theo swagger)
   * - Validate bằng zod
   * - Lưu token + user vào localStorage
   * - Trả LoginResponse
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const res: ApiResponse<LoginResponse> = await this.request<LoginResponse>(
      {
        method: "POST",
        url: "/auth/login",
        data: credentials,
      },
      { skipCache: true }
    );

    if (!res.success || !res.data) {
      throw new ServiceError(res.message || "Login failed", {
        code: "LOGIN_FAILED",
        status: 401,
      });
    }

    const loginData = validateLoginResponse(res.data);

    if (!loginData.accessToken || !loginData.userInfo) {
      throw new ServiceError("Invalid login response from server", {
        code: "INVALID_LOGIN_RESPONSE",
        status: 500,
      });
    }

    AuthUtils.setAuthData(loginData.accessToken, loginData.userInfo);
    return loginData;
  }

  /**
   * Logout
   * Swagger không định nghĩa /auth/logout, nên mặc định chỉ clear localStorage.
   * Nếu sau này bạn có endpoint /auth/logout thì thêm call ở đây.
   */
  async logout(): Promise<void> {
    // Nếu sau này có API:
    // await this.request<void>({ method: 'POST', url: '/auth/logout' }, { skipCache: true });
    AuthUtils.clearAuthData();
  }

  getCurrentUser(): UserInfo | null {
    return AuthUtils.getUserInfo();
  }

  isAuthenticated(): boolean {
    return AuthUtils.isAuthenticated();
  }

  getAccessToken(): string | null {
    return AuthUtils.getAccessToken();
  }

  /**
   * Đổi mật khẩu
   * - /auth/change-password (swagger có)
   */
  async changePassword(payload: ChangePasswordRequest): Promise<void> {
    const res: ApiResponse<void> = await this.request<void>(
      {
        method: "POST",
        url: "/auth/change-password",
        data: payload,
      },
      { skipCache: true }
    );

    if (!res.success) {
      throw new ServiceError(res.message || "Change password failed", {
        code: "CHANGE_PASSWORD_FAILED",
      });
    }
  }
}

export const authService = new AuthService();
