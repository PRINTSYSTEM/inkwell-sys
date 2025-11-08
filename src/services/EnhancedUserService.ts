import { BaseService, ServiceError } from './BaseService';
import { 
  ApiResponse, 
  ServiceOptions, 
  CreateOptions, 
  UpdateOptions,
  FindManyOptions,
  QueryParams
} from './types';

// Enhanced User entity type
export interface EnhancedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  isActive: boolean;
  avatar?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

// User creation data
export interface CreateEnhancedUserData {
  name: string;
  email: string;
  role: string;
  department: string;
  phone?: string;
  avatar?: string;
}

// User update data
export interface UpdateEnhancedUserData {
  name?: string;
  email?: string;
  role?: string;
  department?: string;
  phone?: string;
  avatar?: string;
  isActive?: boolean;
}

// User query filters
export interface EnhancedUserQueryParams extends QueryParams {
  role?: string;
  department?: string;
  isActive?: boolean;
  createdAfter?: string;
  createdBefore?: string;
}

// User statistics
export interface EnhancedUserStats {
  total: number;
  active: number;
  byRole: Record<string, number>;
  byDepartment: Record<string, number>;
  recentRegistrations: number;
}

// Enhanced user service demonstrating BaseService usage
export class EnhancedUserService extends BaseService {
  constructor() {
    super('users'); // Use default API base URL from environment
  }

  // Get all users with advanced filtering
  async getUsers(
    params: EnhancedUserQueryParams = {}, 
    options?: ServiceOptions
  ): Promise<ApiResponse<EnhancedUser[]>> {
    try {
      // Validate query parameters
      this.validateUserQuery(params);

      return await this.findMany<EnhancedUser>(params, {
        ...options,
        cache: {
          ttl: 2 * 60 * 1000, // 2 minutes for user lists
          enabled: true
        }
      });
    } catch (error) {
      throw this.handleServiceError(error, 'Failed to fetch users');
    }
  }

  // Get user by ID with related data
  async getUserById(
    id: string, 
    options: { include?: string[] } & ServiceOptions = {}
  ): Promise<ApiResponse<EnhancedUser>> {
    try {
      this.validateUserId(id);

      const { include, ...serviceOptions } = options;
      const params = include ? { include } : undefined;

      return await this.request<EnhancedUser>({
        method: 'get',
        url: `/users/${id}`,
        params
      }, {
        ...serviceOptions,
        cache: {
          ttl: 5 * 60 * 1000, // 5 minutes for individual users
          enabled: true
        }
      });
    } catch (error) {
      throw this.handleServiceError(error, `Failed to fetch user ${id}`);
    }
  }

  // Create new user with validation
  async createUser(
    userData: CreateEnhancedUserData, 
    options?: ServiceOptions
  ): Promise<ApiResponse<EnhancedUser>> {
    try {
      // Validate user data
      await this.validateCreateUserData(userData);

      // Check for duplicate email
      await this.checkEmailExists(userData.email);

      return await this.create<EnhancedUser>(userData, options);
    } catch (error) {
      throw this.handleServiceError(error, 'Failed to create user');
    }
  }

  // Update user with partial data
  async updateUser(
    id: string, 
    userData: UpdateEnhancedUserData, 
    options?: ServiceOptions
  ): Promise<ApiResponse<EnhancedUser>> {
    try {
      this.validateUserId(id);
      this.validateUpdateUserData(userData);

      // Check for duplicate email if email is being updated
      if (userData.email) {
        await this.checkEmailExists(userData.email, id);
      }

      return await this.update<EnhancedUser>(id, userData, options);
    } catch (error) {
      throw this.handleServiceError(error, `Failed to update user ${id}`);
    }
  }

  // Soft delete user (set inactive)
  async deleteUser(id: string, options?: ServiceOptions): Promise<ApiResponse<void>> {
    try {
      this.validateUserId(id);

      // Soft delete by setting inactive
      await this.updateUser(id, { isActive: false }, options);

      return {
        success: true,
        data: undefined,
        message: 'User deactivated successfully'
      };
    } catch (error) {
      throw this.handleServiceError(error, `Failed to delete user ${id}`);
    }
  }

  // Get user statistics
  async getUserStats(options?: ServiceOptions): Promise<ApiResponse<EnhancedUserStats>> {
    try {
      return await this.request<EnhancedUserStats>({
        method: 'get',
        url: '/users/stats'
      }, {
        ...options,
        cache: {
          ttl: 10 * 60 * 1000, // 10 minutes for stats
          enabled: true
        }
      });
    } catch (error) {
      throw this.handleServiceError(error, 'Failed to fetch user statistics');
    }
  }

  // Validation methods
  private validateUserId(id: string): void {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new ServiceError('User ID is required and must be a non-empty string', {
        code: 'INVALID_USER_ID',
        status: 400
      });
    }
  }

  private validateUserQuery(params: EnhancedUserQueryParams): void {
    if (params.limit && (params.limit < 1 || params.limit > 100)) {
      throw new ServiceError('Limit must be between 1 and 100', {
        code: 'INVALID_LIMIT',
        status: 400
      });
    }

    if (params.page && params.page < 1) {
      throw new ServiceError('Page must be greater than 0', {
        code: 'INVALID_PAGE',
        status: 400
      });
    }
  }

  private async validateCreateUserData(data: CreateEnhancedUserData): Promise<void> {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    }

    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push('Valid email is required');
    }

    if (!data.role || data.role.trim().length === 0) {
      errors.push('Role is required');
    }

    if (!data.department || data.department.trim().length === 0) {
      errors.push('Department is required');
    }

    if (errors.length > 0) {
      throw new ServiceError('Validation failed', {
        code: 'VALIDATION_ERROR',
        status: 400,
        errors: { validation: errors }
      });
    }
  }

  private validateUpdateUserData(data: UpdateEnhancedUserData): void {
    const errors: string[] = [];

    if (data.name !== undefined && data.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    }

    if (data.email !== undefined && !this.isValidEmail(data.email)) {
      errors.push('Valid email is required');
    }

    if (errors.length > 0) {
      throw new ServiceError('Validation failed', {
        code: 'VALIDATION_ERROR',
        status: 400,
        errors: { validation: errors }
      });
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private async checkEmailExists(email: string, excludeId?: string): Promise<void> {
    try {
      const response = await this.request<{ exists: boolean }>({
        method: 'get',
        url: '/users/check-email',
        params: { email, excludeId }
      });

      if (response.data.exists) {
        throw new ServiceError('Email already exists', {
          code: 'EMAIL_EXISTS',
          status: 409
        });
      }
    } catch (error) {
      if (error instanceof ServiceError && error.code === 'EMAIL_EXISTS') {
        throw error;
      }
      // If check fails, continue (assume email is available)
    }
  }

  private handleServiceError(error: unknown, context: string): ServiceError {
    if (error instanceof ServiceError) {
      return error;
    }

    return new ServiceError(`${context}: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      code: 'SERVICE_ERROR',
      status: 500
    });
  }
}

// Create and export singleton instance
export const enhancedUserService = new EnhancedUserService();