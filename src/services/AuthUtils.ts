// src/services/AuthUtils.ts
import type { UserInfo, UserRole } from "../Schema";

export class AuthUtils {
  // Giữ trùng với BaseService.getAuthToken
  static readonly TOKEN_KEY = "accessToken";
  static readonly USER_INFO_KEY = "userInfo";

  private static isBrowser(): boolean {
    return typeof window !== "undefined" && !!window.localStorage;
  }

  // ========== STORAGE ==========

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

  // ========== ROLE & ROUTES ==========

  /** Lấy role hiện tại từ userInfo */
  static getUserRole(): UserRole | null {
    const user = this.getUserInfo();
    return (user?.role as UserRole) ?? null;
  }

  /** Nhóm route base theo loại role */
  private static readonly ADMIN_ROUTES = [
    "/dashboard",
    "/users",
    "/users/manage",
    "/settings",
    "/reports",
    "/profile",
    "/analytics",
  ] as const;

  private static readonly MANAGER_ROUTES = [
    "/dashboard",
    "/reports",
    "/team",
    "/profile",
    "/projects",
  ] as const;

  private static readonly STAFF_ROUTES = [
    "/dashboard",
    "/profile",
    "/projects",
  ] as const;

  /** Map tất cả UserRole → list routes được phép */
  private static readonly ROLE_ROUTES: Record<UserRole, readonly string[]> = {
    // ===== Admin & manager =====
    admin: this.ADMIN_ROUTES,
    manager: this.MANAGER_ROUTES,

    // ===== Design =====
    design: this.STAFF_ROUTES,
    design_lead: this.STAFF_ROUTES,

    // ===== Production =====
    production: this.STAFF_ROUTES,
    production_lead: this.STAFF_ROUTES,

    // ===== Accounting =====
    accounting: this.STAFF_ROUTES,
    accounting_lead: this.STAFF_ROUTES,

    // ===== Warehouse =====
    warehouse: this.STAFF_ROUTES,
    warehouse_lead: this.STAFF_ROUTES,

    // ===== HR =====
    hr: this.STAFF_ROUTES,
    hr_lead: this.STAFF_ROUTES,

    // ===== CSKH =====
    cskh: this.STAFF_ROUTES,
    cskh_lead: this.STAFF_ROUTES,
  } as const;

  /** Kiểm tra xem user có quyền truy cập route không */
  static canAccessRoute(path: string, role?: UserRole | null): boolean {
    const userRole = role ?? this.getUserRole();
    if (!userRole) return false;

    const allowedRoutes = this.ROLE_ROUTES[userRole];
    if (!allowedRoutes) return false;

    return allowedRoutes.some((route) => {
      if (route === path) return true;
      // nested routes (ví dụ: /users cho phép /users/123)
      if (path.startsWith(route + "/")) return true;
      return false;
    });
  }

  /** Lấy danh sách routes mà user được phép truy cập */
  static getAllowedRoutes(role?: UserRole | null): string[] {
    const userRole = role ?? this.getUserRole();
    if (!userRole) return [];
    const allowed = this.ROLE_ROUTES[userRole];
    return allowed ? [...allowed] : [];
  }
}
