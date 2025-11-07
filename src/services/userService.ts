import {
  User,
  Employee,
  CreateUser,
  UpdateUser,
  UserFilter,
  UserFilterSchema,
  CreateEmployeeSchema,
  UpdateEmployeeSchema,
  Department,
  EmployeeAssignment,
  CreateEmployee,
  UpdateEmployee,
  EmployeeFilter,
  validateSchema,
  formatValidationErrors,
  z
} from '@/Schema';

// Types for bulk operations
interface BulkUserOperation {
  operation: 'activate' | 'deactivate' | 'assign_role' | 'change_department' | 'delete';
  userIds: string[];
  params?: {
    newRole?: string;
    newDepartment?: string;
  };
}

interface Permission {
  id: string;
  name: string;
  description?: string;
}

// Mock data for development
const mockDepartments: Department[] = [
  {
    id: 'dept-design',
    name: 'Phòng Thiết kế',
    description: 'Bộ phận thiết kế và sáng tạo',
    managerId: 'user-dm001',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  },
  {
    id: 'dept-production',
    name: 'Phòng Sản xuất',
    description: 'Bộ phận sản xuất và vận hành',
    managerId: 'user-pm001',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  },
  {
    id: 'dept-sales',
    name: 'Phòng Kinh doanh',
    description: 'Bộ phận chăm sóc khách hàng và bán hàng',
    managerId: 'user-sm001',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  },
  {
    id: 'dept-accounting',
    name: 'Phòng Kế toán',
    description: 'Bộ phận tài chính và kế toán',
    managerId: 'user-am001',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  }
];

const mockEmployees: Employee[] = [
  {
    id: 'user-dm001',
    employeeCode: 'EMP001',
    userId: 'user-001',
    positionId: 'pos-001',
    departmentId: 'dept-design',
    managerId: null,
    isActive: true,
    personalInfo: {
      firstName: 'Nguyễn',
      lastName: 'Văn A',
      fullName: 'Nguyễn Văn A',
      email: 'manager@company.com',
      phone: '0901234567',
      dateOfBirth: new Date('1985-05-15'),
      gender: 'male',
      address: '123 Đường ABC, Quận 1, TP.HCM',
      country: 'Việt Nam',
      emergencyContact: {
        name: 'Nguyễn Thị X',
        relationship: 'spouse',
        phone: '0901234568'
      }
    },
    employmentInfo: {
      startDate: new Date('2023-01-15'),
      status: 'active',
      employmentType: 'full_time',
      workLocation: 'office'
    },
    skills: [
      {
        id: 'skill-001',
        name: 'Leadership',
        level: 'expert',
        category: 'Management',
        yearsOfExperience: 8,
        isVerified: true
      },
      {
        id: 'skill-002',
        name: 'Design Review',
        level: 'expert',
        category: 'Design',
        yearsOfExperience: 10,
        isVerified: true
      }
    ],
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2024-11-03T08:00:00Z'),
    createdBy: 'admin'
  },
  {
    id: 'user-des001',
    employeeCode: 'EMP002',
    userId: 'user-002',
    positionId: 'pos-002',
    departmentId: 'dept-design',
    managerId: 'user-dm001',
    isActive: true,
    personalInfo: {
      firstName: 'Trần',
      lastName: 'Thị B',
      fullName: 'Trần Thị B',
      email: 'designer1@company.com',
      phone: '0901234568',
      dateOfBirth: new Date('1990-08-20'),
      gender: 'female',
      address: '456 Đường DEF, Quận 2, TP.HCM',
      country: 'Việt Nam',
      emergencyContact: {
        name: 'Trần Văn Y',
        relationship: 'parent',
        phone: '0901234569'
      }
    },
    employmentInfo: {
      startDate: new Date('2023-03-01'),
      status: 'active',
      employmentType: 'full_time',
      workLocation: 'office'
    },
    skills: [
      {
        id: 'skill-003',
        name: 'Graphic Design',
        level: 'advanced',
        category: 'Design',
        yearsOfExperience: 5,
        isVerified: true
      },
      {
        id: 'skill-004',
        name: 'Adobe Creative Suite',
        level: 'advanced',
        category: 'Software',
        yearsOfExperience: 5,
        isVerified: true
      }
    ],
    createdAt: new Date('2023-03-01'),
    updatedAt: new Date('2024-11-03T09:30:00Z'),
    createdBy: 'user-dm001'
  },
  {
    id: 'user-des002',
    employeeCode: 'EMP003',
    userId: 'user-003',
    positionId: 'pos-002',
    departmentId: 'dept-design',
    managerId: 'user-dm001',
    isActive: true,
    personalInfo: {
      firstName: 'Lê',
      lastName: 'Văn C',
      fullName: 'Lê Văn C',
      email: 'designer2@company.com',
      phone: '0901234570',
      dateOfBirth: new Date('1992-12-10'),
      gender: 'male',
      address: '789 Đường GHI, Quận 3, TP.HCM',
      country: 'Việt Nam',
      emergencyContact: {
        name: 'Lê Thị Z',
        relationship: 'spouse',
        phone: '0901234571'
      }
    },
    employmentInfo: {
      startDate: new Date('2023-06-15'),
      status: 'active',
      employmentType: 'full_time',
      workLocation: 'office'
    },
    skills: [
      {
        id: 'skill-005',
        name: 'UI/UX Design',
        level: 'intermediate',
        category: 'Design',
        yearsOfExperience: 3,
        isVerified: true
      },
      {
        id: 'skill-006',
        name: 'Web Design',
        level: 'intermediate',
        category: 'Design',
        yearsOfExperience: 3,
        isVerified: false
      }
    ],
    createdAt: new Date('2023-06-15'),
    updatedAt: new Date('2024-11-02T16:45:00Z'),
    createdBy: 'user-dm001'
  }
];

export class UserManagementService {
  // Get all users with filtering and pagination
  static async getUsers(params: {
    page?: number;
    pageSize?: number;
    filters?: UserFilter;
    sortBy?: keyof Employee;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    data: Employee[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const { 
      page = 1, 
      pageSize = 20, 
      filters = {}, 
      sortBy = 'id', 
      sortOrder = 'asc' 
    } = params;

    // Validate filters using Zod
    const validationResult = validateSchema(UserFilterSchema, filters);

    if (!validationResult.success) {
      const errorResult = validationResult as { success: false; errors: z.ZodError };
      throw new Error(`Invalid parameters: ${formatValidationErrors(errorResult.errors)}`);
    }

    const validatedFilters = validationResult.data;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    let filteredUsers = [...mockEmployees];

    // Apply filters
    if (validatedFilters.role) {
      filteredUsers = filteredUsers.filter(user => 
        // Assuming we need to check against some role mapping
        user.positionId === validatedFilters.role
      );
    }

    if (validatedFilters.status) {
      filteredUsers = filteredUsers.filter(user => 
        user.employmentInfo?.status === validatedFilters.status
      );
    }

    if (validatedFilters.search) {
      const query = validatedFilters.search.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.personalInfo?.fullName?.toLowerCase().includes(query) ||
        user.personalInfo?.email?.toLowerCase().includes(query) ||
        user.employeeCode?.toLowerCase().includes(query) ||
        user.personalInfo?.phone?.includes(query)
      );
    }

    if (validatedFilters.isActive !== undefined) {
      filteredUsers = filteredUsers.filter(user => user.isActive === validatedFilters.isActive);
    }

    // Apply sorting
    filteredUsers.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    return {
      data: paginatedUsers,
      total: filteredUsers.length,
      page,
      pageSize,
      totalPages: Math.ceil(filteredUsers.length / pageSize)
    };
  }

  // Get user by ID
  static async getUserById(id: string): Promise<Employee | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const user = mockEmployees.find(emp => emp.id === id);
    return user || null;
  }

  // Create new user
  static async createUser(userData: unknown): Promise<Employee> {
    await new Promise(resolve => setTimeout(resolve, 800));

    // Validate input data using Zod
    const validationResult = validateSchema(CreateEmployeeSchema, userData);
    if (!validationResult.success) {
      const errorResult = validationResult as { success: false; errors: z.ZodError };
      throw new Error(`Validation failed: ${JSON.stringify(formatValidationErrors(errorResult.errors))}`);
    }

    const validatedData = validationResult.data;

    const newEmployee: Employee = {
      ...validatedData,
      id: `user-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // In real implementation, this would save to database
    mockEmployees.push(newEmployee);
    
    return newEmployee;
  }

  // Update user
  static async updateUser(id: string, userData: unknown): Promise<Employee> {
    await new Promise(resolve => setTimeout(resolve, 600));

    // Validate update data using Zod
    const validationResult = validateSchema(UpdateEmployeeSchema, userData);
    if (!validationResult.success) {
      const errorResult = validationResult as { success: false; errors: z.ZodError };
      throw new Error(`Validation failed: ${JSON.stringify(formatValidationErrors(errorResult.errors))}`);
    }

    const validatedData = validationResult.data;

    const userIndex = mockEmployees.findIndex(emp => emp.id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    const updatedUser = {
      ...mockEmployees[userIndex],
      ...validatedData,
      updatedAt: new Date()
    };

    mockEmployees[userIndex] = updatedUser;
    return updatedUser;
  }

  // Delete user
  static async deleteUser(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const userIndex = mockEmployees.findIndex(emp => emp.id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    mockEmployees.splice(userIndex, 1);
    return true;
  }

  // Bulk operations
  static async bulkOperation(operation: BulkUserOperation): Promise<{ success: number; failed: number; errors: string[] }> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const userId of operation.userIds) {
      try {
        const userIndex = mockEmployees.findIndex(emp => emp.id === userId);
        if (userIndex === -1) {
          failed++;
          errors.push(`User ${userId} not found`);
          continue;
        }

        switch (operation.operation) {
          case 'activate':
            if (mockEmployees[userIndex].employmentInfo) {
              mockEmployees[userIndex].employmentInfo!.status = 'active';
            }
            mockEmployees[userIndex].isActive = true;
            break;
          case 'deactivate':
            if (mockEmployees[userIndex].employmentInfo) {
              mockEmployees[userIndex].employmentInfo!.status = 'inactive';
            }
            mockEmployees[userIndex].isActive = false;
            break;
          case 'assign_role':
            if (operation.params?.newRole) {
              mockEmployees[userIndex].positionId = operation.params.newRole;
            }
            break;
          case 'change_department':
            if (operation.params?.newDepartment) {
              mockEmployees[userIndex].departmentId = operation.params.newDepartment;
            }
            break;
          case 'delete':
            mockEmployees.splice(userIndex, 1);
            break;
        }

        success++;
      } catch (error) {
        failed++;
        errors.push(`Failed to process user ${userId}: ${error}`);
      }
    }

    return { success, failed, errors };
  }

  // Get departments
  static async getDepartments(): Promise<Department[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockDepartments;
  }

  // Get users by department
  static async getUsersByDepartment(departmentId: string): Promise<Employee[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockEmployees.filter(emp => emp.departmentId === departmentId);
  }

  // Get team members for a manager
  static async getTeamMembers(managerId: string): Promise<Employee[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockEmployees.filter(emp => emp.managerId === managerId);
  }

  // Search users
  static async searchUsers(query: string, filters?: UserFilter): Promise<Employee[]> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const searchQuery = query.toLowerCase();
    let results = mockEmployees.filter(emp =>
      emp.personalInfo?.fullName?.toLowerCase().includes(searchQuery) ||
      emp.personalInfo?.email?.toLowerCase().includes(searchQuery) ||
      emp.employeeCode?.toLowerCase().includes(searchQuery) ||
      emp.skills?.some(skill => skill.name?.toLowerCase().includes(searchQuery))
    );

    // Apply additional filters if provided
    if (filters?.role) {
      results = results.filter(emp => emp.positionId === filters.role);
    }

    return results;
  }

  // Get user permissions
  static async getUserPermissions(userId: string): Promise<string[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const user = mockEmployees.find(emp => emp.id === userId);
    // For now, return empty array as permissions are not in Employee schema
    return [];
  }

  // Update user permissions
  static async updateUserPermissions(userId: string, permissions: string[]): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const userIndex = mockEmployees.findIndex(emp => emp.id === userId);
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    // In real implementation, this would update user permissions
    mockEmployees[userIndex].updatedAt = new Date();
    
    return true;
  }

  // Change user password
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // In real implementation, verify current password and hash new password
    const user = mockEmployees.find(emp => emp.id === userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Simulate password validation
    if (currentPassword.length < 6 || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    return true;
  }

  // Get available roles
  static async getAvailableRoles(): Promise<Array<{ value: string; label: string; permissions: string[] }>> {
    await new Promise(resolve => setTimeout(resolve, 100));

    return [
      { 
        value: 'admin', 
        label: 'Quản trị viên', 
        permissions: ['users.view', 'users.create', 'users.edit', 'users.delete', 'designs.view', 'designs.create', 'designs.edit', 'designs.delete'] 
      },
      { 
        value: 'designer_manager', 
        label: 'Trưởng phòng Thiết kế', 
        permissions: ['designs.view', 'designs.edit', 'designs.assign', 'users.view'] 
      },
      { 
        value: 'design', 
        label: 'Nhân viên Thiết kế', 
        permissions: ['designs.view', 'designs.edit'] 
      },
      { 
        value: 'customer_service', 
        label: 'Chăm sóc Khách hàng', 
        permissions: ['customers.view', 'customers.create', 'customers.edit', 'orders.view', 'orders.create'] 
      },
      { 
        value: 'production_manager', 
        label: 'Trưởng phòng Sản xuất', 
        permissions: ['production.view', 'production.edit', 'users.view'] 
      },
      { 
        value: 'production', 
        label: 'Nhân viên Sản xuất', 
        permissions: ['production.view', 'production.edit'] 
      },
      { 
        value: 'accountant', 
        label: 'Kế toán', 
        permissions: ['accounting.view', 'accounting.create', 'accounting.edit'] 
      }
    ];
  }
}

export default UserManagementService;