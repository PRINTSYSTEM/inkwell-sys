import { apiRequest } from '@/lib/http';

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  fullName: string;
  role: string;
  email: string;
  phone: string;
}

export interface UpdateUserRequest {
  fullName?: string;
  role?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserListResponse {
  items: User[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export const USER_ROLES = [
  { value: 'admin', label: 'Quản trị viên', description: 'Toàn quyền hệ thống' },
  { value: 'manager', label: 'Quản lý', description: 'Quản lý đơn hàng và nhân viên' },
  { value: 'design', label: 'Thiết kế', description: 'Thiết kế sản phẩm' },
  { value: 'production', label: 'Sản xuất', description: 'Quản lý sản xuất' },
  { value: 'prepress', label: 'Bình bài', description: 'Chuẩn bị file in' },
  { value: 'accounting', label: 'Kế toán', description: 'Quản lý tài chính' },
  { value: 'customer_service', label: 'Chăm sóc khách hàng', description: 'Hỗ trợ khách hàng' }
];

class UserApiService {
  private baseUrl = 'https://checkafe.online/api/users';

  async getUsers(params?: {
    pageNumber?: number;
    pageSize?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
  }): Promise<UserListResponse> {
    const searchParams = new URLSearchParams();
    
    if (params?.pageNumber) searchParams.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.role) searchParams.append('role', params.role);
    if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());

    const url = searchParams.toString() ? `${this.baseUrl}?${searchParams}` : this.baseUrl;
    
    const response = await apiRequest.get(url);
    return response.data;
  }

  async createUser(data: CreateUserRequest): Promise<User> {
    const response = await apiRequest.post(this.baseUrl, data);
    return response.data;
  }

  async updateUser(id: number, data: Partial<CreateUserRequest>): Promise<User> {
    const response = await apiRequest.put(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  async getUserById(id: number): Promise<User> {
    const response = await apiRequest.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async getUserByUsername(username: string): Promise<User> {
    const response = await apiRequest.get(`${this.baseUrl}/username/${username}`);
    return response.data;
  }

  async changePassword(id: number, data: { currentPassword: string; newPassword: string; confirmPassword: string }): Promise<void> {
    await apiRequest.post(`${this.baseUrl}/${id}/change-password`, data);
  }

  async deleteUser(id: number): Promise<void> {
    await apiRequest.delete(`${this.baseUrl}/${id}`);
  }

  async toggleUserStatus(id: number, isActive: boolean): Promise<User> {
    const response = await apiRequest.put(`${this.baseUrl}/${id}/status`, { isActive });
    return response.data;
  }
}

export const userApiService = new UserApiService();