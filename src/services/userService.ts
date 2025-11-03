import { 
  Employee, 
  EmployeeMetrics, 
  UserFilters, 
  UserListResponse,
  BulkUserOperation,
  Department,
  EmployeeAssignment,
  WorkTimelineEntry,
  PerformanceComparison
} from '@/types/employee';
import { User, UserRole, Permission } from '@/types';

// Mock data for development
const mockDepartments: Department[] = [
  {
    id: 'dept-design',
    name: 'Phòng Thiết kế',
    description: 'Bộ phận thiết kế và sáng tạo',
    managerId: 'user-dm001',
    managerName: 'Nguyễn Văn A',
    employeeCount: 8,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'dept-production',
    name: 'Phòng Sản xuất',
    description: 'Bộ phận sản xuất và vận hành',
    managerId: 'user-pm001',
    managerName: 'Trần Thị B',
    employeeCount: 12,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'dept-sales',
    name: 'Phòng Kinh doanh',
    description: 'Bộ phận chăm sóc khách hàng và bán hàng',
    managerId: 'user-sm001',
    managerName: 'Lê Văn C',
    employeeCount: 6,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'dept-accounting',
    name: 'Phòng Kế toán',
    description: 'Bộ phận tài chính và kế toán',
    managerId: 'user-am001',
    managerName: 'Phạm Thị D',
    employeeCount: 4,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

const mockEmployees: Employee[] = [
  {
    id: 'user-dm001',
    username: 'design_manager',
    fullName: 'Nguyễn Văn A',
    email: 'manager@company.com',
    phone: '0901234567',
    role: 'designer_manager',
    department: 'dept-design',
    departmentName: 'Phòng Thiết kế',
    position: 'Trưởng phòng Thiết kế',
    employeeId: 'EMP001',
    joiningDate: '2023-01-15',
    hireDate: '2023-01-15',
    permissions: ['designs.view', 'designs.edit', 'designs.assign', 'users.view'],
    status: 'active',
    lastLogin: '2024-11-03T08:00:00Z',
    createdAt: '2023-01-15T00:00:00Z',
    updatedAt: '2024-11-03T08:00:00Z',
    createdBy: 'admin',
    updatedBy: 'admin',
    metrics: {
      totalDesigns: 120,
      completedDesigns: 110,
      inProgressDesigns: 8,
      pendingDesigns: 2,
      averageCompletionTime: 3.5,
      completionRate: 91.7,
      workloadScore: 75,
      lastActivityDate: '2024-11-03',
      monthlyMetrics: [
        { month: '2024-10', designsCompleted: 25, averageTime: 3.2, qualityScore: 95 },
        { month: '2024-09', designsCompleted: 28, averageTime: 3.1, qualityScore: 93 }
      ]
    },
    skills: ['Leadership', 'Design Review', 'Project Management'],
    certifications: ['PMP', 'Adobe Certified Expert'],
    currentWorkload: 75,
    availability: 'available'
  },
  {
    id: 'user-des001',
    username: 'designer_01',
    fullName: 'Trần Thị B',
    email: 'designer1@company.com',
    phone: '0901234568',
    role: 'design',
    department: 'dept-design',
    departmentName: 'Phòng Thiết kế',
    managerId: 'user-dm001',
    managerName: 'Nguyễn Văn A',
    position: 'Nhân viên Thiết kế',
    employeeId: 'EMP002',
    joiningDate: '2023-03-01',
    hireDate: '2023-03-01',
    permissions: ['designs.view', 'designs.edit'],
    status: 'active',
    lastLogin: '2024-11-03T09:30:00Z',
    createdAt: '2023-03-01T00:00:00Z',
    updatedAt: '2024-11-03T09:30:00Z',
    createdBy: 'user-dm001',
    updatedBy: 'user-dm001',
    metrics: {
      totalDesigns: 89,
      completedDesigns: 82,
      inProgressDesigns: 5,
      pendingDesigns: 2,
      averageCompletionTime: 2.8,
      completionRate: 92.1,
      workloadScore: 68,
      lastActivityDate: '2024-11-03',
      monthlyMetrics: [
        { month: '2024-10', designsCompleted: 18, averageTime: 2.5, qualityScore: 88 },
        { month: '2024-09', designsCompleted: 20, averageTime: 2.9, qualityScore: 90 }
      ]
    },
    skills: ['Graphic Design', 'Adobe Creative Suite', 'Print Design'],
    certifications: ['Adobe Certified Associate'],
    currentWorkload: 68,
    availability: 'available'
  },
  {
    id: 'user-des002',
    username: 'designer_02',
    fullName: 'Lê Văn C',
    email: 'designer2@company.com',
    phone: '0901234569',
    role: 'design',
    department: 'dept-design',
    departmentName: 'Phòng Thiết kế',
    managerId: 'user-dm001',
    managerName: 'Nguyễn Văn A',
    position: 'Nhân viên Thiết kế',
    employeeId: 'EMP003',
    joiningDate: '2023-06-15',
    hireDate: '2023-06-15',
    permissions: ['designs.view', 'designs.edit'],
    status: 'active',
    lastLogin: '2024-11-02T16:45:00Z',
    createdAt: '2023-06-15T00:00:00Z',
    updatedAt: '2024-11-02T16:45:00Z',
    createdBy: 'user-dm001',
    updatedBy: 'user-dm001',
    metrics: {
      totalDesigns: 65,
      completedDesigns: 58,
      inProgressDesigns: 6,
      pendingDesigns: 1,
      averageCompletionTime: 3.2,
      completionRate: 89.2,
      workloadScore: 85,
      lastActivityDate: '2024-11-02',
      monthlyMetrics: [
        { month: '2024-10', designsCompleted: 15, averageTime: 3.0, qualityScore: 85 },
        { month: '2024-09', designsCompleted: 17, averageTime: 3.4, qualityScore: 87 }
      ]
    },
    skills: ['UI/UX Design', 'Web Design', 'Branding'],
    certifications: ['Google UX Design Certificate'],
    currentWorkload: 85,
    availability: 'busy'
  }
];

export class UserManagementService {
  // Get all users with filtering and pagination
  static async getUsers(params: {
    page?: number;
    pageSize?: number;
    filters?: UserFilters;
    sortBy?: keyof Employee;
    sortOrder?: 'asc' | 'desc';
  }): Promise<UserListResponse> {
    const { 
      page = 1, 
      pageSize = 20, 
      filters = {}, 
      sortBy = 'fullName', 
      sortOrder = 'asc' 
    } = params;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    let filteredUsers = [...mockEmployees];

    // Apply filters
    if (filters.department) {
      filteredUsers = filteredUsers.filter(user => user.department === filters.department);
    }

    if (filters.role) {
      filteredUsers = filteredUsers.filter(user => user.role === filters.role);
    }

    if (filters.status) {
      filteredUsers = filteredUsers.filter(user => user.status === filters.status);
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.fullName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.employeeId?.toLowerCase().includes(query) ||
        user.phone?.includes(query)
      );
    }

    if (filters.skillSearch) {
      const skillQuery = filters.skillSearch.toLowerCase();
      filteredUsers = filteredUsers.filter(user =>
        user.skills.some(skill => skill.toLowerCase().includes(skillQuery))
      );
    }

    if (filters.workloadRange) {
      filteredUsers = filteredUsers.filter(user =>
        user.currentWorkload >= filters.workloadRange!.min &&
        user.currentWorkload <= filters.workloadRange!.max
      );
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
  static async createUser(userData: Partial<Employee>): Promise<Employee> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const newUser: Employee = {
      id: `user-${Date.now()}`,
      username: userData.username || '',
      fullName: userData.fullName || '',
      email: userData.email || '',
      phone: userData.phone,
      role: userData.role || 'design',
      department: userData.department || 'dept-design',
      departmentName: userData.departmentName || 'Phòng Thiết kế',
      managerId: userData.managerId,
      managerName: userData.managerName,
      position: userData.position || 'Nhân viên',
      employeeId: userData.employeeId || `EMP${Math.floor(Math.random() * 1000)}`,
      joiningDate: userData.joiningDate || new Date().toISOString().split('T')[0],
      hireDate: userData.hireDate || new Date().toISOString().split('T')[0],
      permissions: userData.permissions || [],
      status: userData.status || 'active',
      lastLogin: userData.lastLogin,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userData.createdBy || 'admin',
      updatedBy: userData.updatedBy || 'admin',
      metrics: userData.metrics || {
        totalDesigns: 0,
        completedDesigns: 0,
        inProgressDesigns: 0,
        pendingDesigns: 0,
        averageCompletionTime: 0,
        completionRate: 0,
        workloadScore: 0,
        lastActivityDate: new Date().toISOString().split('T')[0],
        monthlyMetrics: []
      },
      skills: userData.skills || [],
      certifications: userData.certifications || [],
      currentWorkload: userData.currentWorkload || 0,
      availability: userData.availability || 'available'
    };

    // In real implementation, this would save to database
    mockEmployees.push(newUser);
    
    return newUser;
  }

  // Update user
  static async updateUser(id: string, userData: Partial<Employee>): Promise<Employee> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const userIndex = mockEmployees.findIndex(emp => emp.id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    const updatedUser = {
      ...mockEmployees[userIndex],
      ...userData,
      updatedAt: new Date().toISOString()
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
            mockEmployees[userIndex].status = 'active';
            break;
          case 'deactivate':
            mockEmployees[userIndex].status = 'inactive';
            break;
          case 'assign_role':
            if (operation.params?.newRole) {
              mockEmployees[userIndex].role = operation.params.newRole;
            }
            break;
          case 'change_department':
            if (operation.params?.newDepartment) {
              mockEmployees[userIndex].department = operation.params.newDepartment;
              const dept = mockDepartments.find(d => d.id === operation.params!.newDepartment);
              if (dept) {
                mockEmployees[userIndex].departmentName = dept.name;
              }
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
    return mockEmployees.filter(emp => emp.department === departmentId);
  }

  // Get team members for a manager
  static async getTeamMembers(managerId: string): Promise<Employee[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockEmployees.filter(emp => emp.managerId === managerId);
  }

  // Search users
  static async searchUsers(query: string, filters?: UserFilters): Promise<Employee[]> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const searchQuery = query.toLowerCase();
    let results = mockEmployees.filter(emp =>
      emp.fullName.toLowerCase().includes(searchQuery) ||
      emp.email.toLowerCase().includes(searchQuery) ||
      emp.employeeId?.toLowerCase().includes(searchQuery) ||
      emp.skills.some(skill => skill.toLowerCase().includes(searchQuery))
    );

    // Apply additional filters if provided
    if (filters?.department) {
      results = results.filter(emp => emp.department === filters.department);
    }

    if (filters?.role) {
      results = results.filter(emp => emp.role === filters.role);
    }

    return results;
  }

  // Get user permissions
  static async getUserPermissions(userId: string): Promise<Permission[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const user = mockEmployees.find(emp => emp.id === userId);
    return user?.permissions || [];
  }

  // Update user permissions
  static async updateUserPermissions(userId: string, permissions: Permission[]): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const userIndex = mockEmployees.findIndex(emp => emp.id === userId);
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    mockEmployees[userIndex].permissions = permissions;
    mockEmployees[userIndex].updatedAt = new Date().toISOString();
    
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
  static async getAvailableRoles(): Promise<Array<{ value: UserRole; label: string; permissions: Permission[] }>> {
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