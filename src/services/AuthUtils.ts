// src/services/AuthUtils.ts
import type { UserInfo } from "../Schema";

export class AuthUtils {
  // Giữ trùng với BaseService.getAuthToken (localStorage.getItem('accessToken'))
  static readonly TOKEN_KEY = "accessToken";
  static readonly USER_INFO_KEY = "userInfo";

  private static isBrowser(): boolean {
    return (
      typeof window !== "undefined" &&
      typeof window.localStorage !== "undefined"
    );
  }

  static getAccessToken(): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static getUserInfo(): UserInfo | null {
    if (!this.isBrowser()) return null;
    const raw = localStorage.getItem(this.USER_INFO_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as UserInfo;
    } catch {
      return null;
    }
  }

  static setAuthData(accessToken: string, userInfo: UserInfo): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(this.TOKEN_KEY, accessToken);
    localStorage.setItem(this.USER_INFO_KEY, JSON.stringify(userInfo));
  }

  static clearAuthData(): void {
    if (!this.isBrowser()) return;
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_INFO_KEY);
  }

  static isAuthenticated(): boolean {
    const token = this.getAccessToken();
    const user = this.getUserInfo();
    return !!(token && user);
  }
}
