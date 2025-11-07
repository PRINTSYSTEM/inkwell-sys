import { 
  Role, 
  RoleTemplate, 
  PermissionGroup, 
  PermissionDetail, 
  RoleAssignment, 
  RoleAnalytics, 
  RoleConflict, 
  RoleFormData, 
  BulkRoleAssignment, 
  RoleListResponse, 
  RoleValidationResult 
} from '@/types/role';
import { Permission, UserRole, ROLE_PERMISSIONS } from '@/types';

// Mock data for role templates
const mockRoleTemplates: RoleTemplate[] = [
  {
    id: 'template-admin',
    name: 'full_admin',
    displayName: 'Quản trị viên hệ thống',
    description: 'Quyền quản trị toàn bộ hệ thống, bao gồm quản lý người dùng, cài đặt và báo cáo',
    category: 'management',
    permissions: ROLE_PERMISSIONS.admin,
    isRecommended: true
  },
  {
    id: 'template-design-manager',
    name: 'design_manager',
    displayName: 'Quản lý thiết kế',
    description: 'Quản lý phòng ban thiết kế, phân công công việc và kiểm duyệt thiết kế',
    category: 'management',
    permissions: [
      'designs.view', 'designs.create', 'designs.edit', 'designs.assign', 'designs.manage',
      'design_assignments.view', 'design_assignments.create', 'design_assignments.edit', 'design_assignments.delete',
      'designer_performance.view', 'designer_workload.view',
      'users.view', 'materials.view', 'orders.view', 'customers.view',
      'reports.view'
    ],
    isRecommended: true
  },
  {
    id: 'template-production-manager',
    name: 'production_manager',
    displayName: 'Quản lý sản xuất',
    description: 'Quản lý quy trình sản xuất và nhân viên sản xuất',
    category: 'management',
    permissions: ROLE_PERMISSIONS.production_manager,
    isRecommended: true
  },
  {
    id: 'template-designer',
    name: 'designer',
    displayName: 'Nhân viên thiết kế',
    description: 'Thực hiện thiết kế theo yêu cầu và chỉnh sửa thiết kế',
    category: 'operational',
    permissions: ROLE_PERMISSIONS.design,
    isRecommended: true
  },
  {
    id: 'template-cskh',
    name: 'customer_service',
    displayName: 'Chăm sóc khách hàng',
    description: 'Quản lý khách hàng và đơn hàng',
    category: 'support',
    permissions: ROLE_PERMISSIONS.cskh,
    isRecommended: true
  },
  {
    id: 'template-accountant',
    name: 'accountant',
    displayName: 'Kế toán',
    description: 'Quản lý tài chính và báo cáo kế toán',
    category: 'support',
    permissions: ROLE_PERMISSIONS.accounting,
    isRecommended: true
  }
];

// Mock permission groups
const mockPermissionGroups: PermissionGroup[] = [
  {
    id: 'group-users',
    name: 'users',
    displayName: 'Quản lý người dùng',
    description: 'Quyền liên quan đến quản lý người dùng và nhân viên',
    category: 'core',
    permissions: [
      { id: 'users.view', name: 'Xem người dùng', description: 'Xem danh sách và thông tin người dùng', category: 'users', isSystem: false, risk: 'low' },
      { id: 'users.create', name: 'Tạo người dùng', description: 'Tạo tài khoản người dùng mới', category: 'users', isSystem: false, dependencies: ['users.view'], risk: 'medium' },
      { id: 'users.edit', name: 'Sửa người dùng', description: 'Chỉnh sửa thông tin người dùng', category: 'users', isSystem: false, dependencies: ['users.view'], risk: 'medium' },
      { id: 'users.delete', name: 'Xóa người dùng', description: 'Xóa tài khoản người dùng', category: 'users', isSystem: false, dependencies: ['users.view', 'users.edit'], risk: 'high' }
    ]
  },
  {
    id: 'group-designs',
    name: 'designs',
    displayName: 'Quản lý thiết kế',
    description: 'Quyền liên quan đến thiết kế và creative',
    category: 'business',
    permissions: [
      { id: 'designs.view', name: 'Xem thiết kế', description: 'Xem danh sách và chi tiết thiết kế', category: 'designs', isSystem: false, risk: 'low' },
      { id: 'designs.create', name: 'Tạo thiết kế', description: 'Tạo thiết kế mới', category: 'designs', isSystem: false, dependencies: ['designs.view'], risk: 'low' },
      { id: 'designs.edit', name: 'Sửa thiết kế', description: 'Chỉnh sửa thiết kế', category: 'designs', isSystem: false, dependencies: ['designs.view'], risk: 'medium' },
      { id: 'designs.delete', name: 'Xóa thiết kế', description: 'Xóa thiết kế', category: 'designs', isSystem: false, dependencies: ['designs.view', 'designs.edit'], risk: 'high' },
      { id: 'designs.assign', name: 'Phân công thiết kế', description: 'Phân công thiết kế cho nhân viên', category: 'designs', isSystem: false, dependencies: ['designs.view', 'users.view'], risk: 'medium' }
    ]
  },
  {
    id: 'group-orders',
    name: 'orders',
    displayName: 'Quản lý đơn hàng',
    description: 'Quyền liên quan đến đơn hàng và giao dịch',
    category: 'business',
    permissions: [
      { id: 'orders.view', name: 'Xem đơn hàng', description: 'Xem danh sách và chi tiết đơn hàng', category: 'orders', isSystem: false, risk: 'low' },
      { id: 'orders.create', name: 'Tạo đơn hàng', description: 'Tạo đơn hàng mới', category: 'orders', isSystem: false, dependencies: ['orders.view', 'customers.view'], risk: 'medium' },
      { id: 'orders.edit', name: 'Sửa đơn hàng', description: 'Chỉnh sửa đơn hàng', category: 'orders', isSystem: false, dependencies: ['orders.view'], risk: 'medium' },
      { id: 'orders.delete', name: 'Xóa đơn hàng', description: 'Xóa đơn hàng', category: 'orders', isSystem: false, dependencies: ['orders.view', 'orders.edit'], risk: 'high' }
    ]
  },
  {
    id: 'group-system',
    name: 'system',
    displayName: 'Quản lý hệ thống',
    description: 'Quyền hệ thống và cài đặt',
    category: 'system',
    permissions: [
      { id: 'settings.view', name: 'Xem cài đặt', description: 'Xem cài đặt hệ thống', category: 'system', isSystem: true, risk: 'medium' },
      { id: 'settings.edit', name: 'Sửa cài đặt', description: 'Chỉnh sửa cài đặt hệ thống', category: 'system', isSystem: true, dependencies: ['settings.view'], risk: 'high' },
      { id: 'reports.view', name: 'Xem báo cáo', description: 'Xem các báo cáo hệ thống', category: 'system', isSystem: false, risk: 'low' },
      { id: 'reports.export', name: 'Xuất báo cáo', description: 'Xuất báo cáo ra file', category: 'system', isSystem: false, dependencies: ['reports.view'], risk: 'medium' }
    ]
  }
];

// Mock roles data
const mockRoles: Role[] = [
  {
    id: 'role-admin',
    name: 'admin',
    displayName: 'Quản trị viên',
    description: 'Quyền quản trị toàn bộ hệ thống',
    permissions: ROLE_PERMISSIONS.admin,
    isSystem: true,
    isActive: true,
    userCount: 2,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'system'
  },
  {
    id: 'role-design-manager',
    name: 'designer_manager',
    displayName: 'Quản lý thiết kế',
    description: 'Quản lý phòng ban thiết kế',
    permissions: [
      'designs.view', 'designs.create', 'designs.edit', 'designs.assign',
      'users.view', 'materials.view', 'orders.view', 'customers.view',
      'reports.view'
    ],
    isSystem: false,
    isActive: true,
    userCount: 3,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'user-admin001'
  },
  {
    id: 'role-production-manager',
    name: 'production_manager',
    displayName: 'Quản lý sản xuất',
    description: 'Quản lý quy trình sản xuất',
    permissions: ROLE_PERMISSIONS.production_manager,
    isSystem: false,
    isActive: true,
    userCount: 2,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'user-admin001'
  },
  {
    id: 'role-designer',
    name: 'designer',
    displayName: 'Nhân viên thiết kế',
    description: 'Thực hiện thiết kế theo yêu cầu',
    permissions: ROLE_PERMISSIONS.design,
    isSystem: false,
    isActive: true,
    userCount: 8,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'user-admin001'
  },
  {
    id: 'role-cskh',
    name: 'customer_service',
    displayName: 'Chăm sóc khách hàng',
    description: 'Quản lý khách hàng và đơn hàng',
    permissions: ROLE_PERMISSIONS.cskh,
    isSystem: false,
    isActive: true,
    userCount: 4,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'user-admin001'
  }
];

export class RoleManagementService {
  // Get all roles with filtering and pagination
  static async getRoles(params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    isActive?: boolean;
  } = {}): Promise<RoleListResponse> {
    await new Promise(resolve => setTimeout(resolve, 400));

    let filteredRoles = [...mockRoles];

    // Apply filters
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filteredRoles = filteredRoles.filter(role => 
        role.displayName.toLowerCase().includes(searchLower) ||
        role.description.toLowerCase().includes(searchLower) ||
        role.name.toLowerCase().includes(searchLower)
      );
    }

    if (params.isActive !== undefined) {
      filteredRoles = filteredRoles.filter(role => role.isActive === params.isActive);
    }

    // Apply pagination
    const page = params.page || 1;
    const limit = params.limit || 10;
    const startIndex = (page - 1) * limit;
    const paginatedRoles = filteredRoles.slice(startIndex, startIndex + limit);

    return {
      roles: paginatedRoles,
      total: filteredRoles.length,
      page,
      limit,
      filters: params
    };
  }

  // Get role by ID
  static async getRoleById(roleId: string): Promise<Role> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const role = mockRoles.find(r => r.id === roleId);
    if (!role) {
      throw new Error('Role not found');
    }
    
    return role;
  }

  // Create new role
  static async createRole(roleData: RoleFormData): Promise<Role> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const newRole: Role = {
      id: `role-${Date.now()}`,
      name: roleData.name.toLowerCase().replace(/\s+/g, '_'),
      displayName: roleData.displayName,
      description: roleData.description,
      permissions: roleData.permissions,
      isSystem: false,
      isActive: roleData.isActive,
      userCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current-user-id'
    };

    mockRoles.push(newRole);
    return newRole;
  }

  // Update role
  static async updateRole(roleId: string, roleData: Partial<RoleFormData>): Promise<Role> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const roleIndex = mockRoles.findIndex(r => r.id === roleId);
    if (roleIndex === -1) {
      throw new Error('Role not found');
    }

    const existingRole = mockRoles[roleIndex];
    if (existingRole.isSystem && roleData.permissions) {
      throw new Error('Cannot modify permissions of system role');
    }

    const updatedRole: Role = {
      ...existingRole,
      displayName: roleData.displayName || existingRole.displayName,
      description: roleData.description || existingRole.description,
      permissions: roleData.permissions || existingRole.permissions,
      isActive: roleData.isActive !== undefined ? roleData.isActive : existingRole.isActive,
      updatedAt: new Date().toISOString()
    };

    mockRoles[roleIndex] = updatedRole;
    return updatedRole;
  }

  // Delete role
  static async deleteRole(roleId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const roleIndex = mockRoles.findIndex(r => r.id === roleId);
    if (roleIndex === -1) {
      throw new Error('Role not found');
    }

    const role = mockRoles[roleIndex];
    if (role.isSystem) {
      throw new Error('Cannot delete system role');
    }

    if (role.userCount > 0) {
      throw new Error('Cannot delete role that is assigned to users');
    }

    mockRoles.splice(roleIndex, 1);
  }

  // Get role templates
  static async getRoleTemplates(): Promise<RoleTemplate[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockRoleTemplates;
  }

  // Get permission groups
  static async getPermissionGroups(): Promise<PermissionGroup[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockPermissionGroups;
  }

  // Get all permissions with details
  static async getAllPermissions(): Promise<PermissionDetail[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return mockPermissionGroups.flatMap(group => group.permissions);
  }

  // Validate role permissions
  static async validateRole(roleData: RoleFormData): Promise<RoleValidationResult> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const conflicts: RoleConflict[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check for permission dependencies
    const allPermissions = mockPermissionGroups.flatMap(group => group.permissions);
    
    for (const permission of roleData.permissions) {
      const permDetail = allPermissions.find(p => p.id === permission);
      if (permDetail?.dependencies) {
        const missingDeps = permDetail.dependencies.filter(dep => 
          !roleData.permissions.includes(dep)
        );
        
        if (missingDeps.length > 0) {
          conflicts.push({
            type: 'missing_dependency',
            severity: 'error',
            message: `Permission "${permDetail.name}" requires: ${missingDeps.join(', ')}`,
            roleIds: [],
            permissions: [permission, ...missingDeps],
            recommendation: `Add missing dependencies: ${missingDeps.join(', ')}`
          });
        }
      }

      // Check for high-risk permissions
      if (permDetail?.risk === 'high') {
        warnings.push(`High-risk permission: ${permDetail.name}`);
      }
    }

    // Check for role overlap
    const existingRole = mockRoles.find(r => 
      r.name === roleData.name.toLowerCase().replace(/\s+/g, '_')
    );
    if (existingRole) {
      conflicts.push({
        type: 'duplicate_permission',
        severity: 'error',
        message: 'Role name already exists',
        roleIds: [existingRole.id],
        recommendation: 'Choose a different role name'
      });
    }

    // Suggestions
    if (roleData.permissions.length > 15) {
      suggestions.push('Consider breaking this role into smaller, more specific roles');
    }

    if (roleData.permissions.some(p => p.includes('delete'))) {
      suggestions.push('Review delete permissions carefully for security');
    }

    return {
      isValid: conflicts.filter(c => c.severity === 'error').length === 0,
      conflicts,
      warnings,
      suggestions
    };
  }

  // Get role analytics
  static async getRoleAnalytics(): Promise<RoleAnalytics[]> {
    await new Promise(resolve => setTimeout(resolve, 500));

    return mockRoles.map(role => ({
      roleId: role.id,
      roleName: role.displayName,
      userCount: role.userCount,
      activeUsers: Math.floor(role.userCount * 0.8), // Mock: 80% active
      lastUsed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      permissionUsage: role.permissions.slice(0, 5).map(permission => ({
        permission,
        usageCount: Math.floor(Math.random() * 100),
        lastUsed: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
      })),
      riskLevel: role.permissions.some(p => 
        mockPermissionGroups.flatMap(g => g.permissions)
          .find(pd => pd.id === p)?.risk === 'high'
      ) ? 'high' : 'low'
    }));
  }

  // Clone role
  static async cloneRole(roleId: string, newName: string): Promise<Role> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const sourceRole = mockRoles.find(r => r.id === roleId);
    if (!sourceRole) {
      throw new Error('Source role not found');
    }

    const clonedRole: Role = {
      id: `role-${Date.now()}`,
      name: newName.toLowerCase().replace(/\s+/g, '_'),
      displayName: newName,
      description: `Cloned from ${sourceRole.displayName}`,
      permissions: [...sourceRole.permissions],
      isSystem: false,
      isActive: true,
      userCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current-user-id'
    };

    mockRoles.push(clonedRole);
    return clonedRole;
  }

  // Bulk operations
  static async bulkUpdateRoles(roleIds: string[], updates: Partial<Pick<Role, 'isActive'>>): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 600));

    roleIds.forEach(roleId => {
      const roleIndex = mockRoles.findIndex(r => r.id === roleId);
      if (roleIndex !== -1) {
        mockRoles[roleIndex] = {
          ...mockRoles[roleIndex],
          ...updates,
          updatedAt: new Date().toISOString()
        };
      }
    });
  }

  // Export roles
  static async exportRoles(roleIds?: string[]): Promise<Blob> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const rolesToExport = roleIds 
      ? mockRoles.filter(r => roleIds.includes(r.id))
      : mockRoles;

    const exportData = {
      exportDate: new Date().toISOString(),
      roles: rolesToExport.map(role => ({
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        permissions: role.permissions,
        isActive: role.isActive
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    return blob;
  }
}