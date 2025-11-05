import { Permission, UserRole } from './index';

// Role Management types
export interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean; // System roles cannot be deleted
  isActive: boolean;
  userCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface RoleTemplate {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: 'management' | 'operational' | 'support' | 'custom';
  permissions: Permission[];
  isRecommended: boolean;
}

export interface PermissionGroup {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: 'core' | 'business' | 'system' | 'reports';
  permissions: PermissionDetail[];
}

export interface PermissionDetail {
  id: Permission;
  name: string;
  description: string;
  category: string;
  isSystem: boolean;
  dependencies?: Permission[]; // Required permissions
  risk: 'low' | 'medium' | 'high';
}

export interface RoleAssignment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  roleId: string;
  roleName: string;
  assignedBy: string;
  assignedAt: string;
  expiresAt?: string;
  isActive: boolean;
  department?: string;
}

export interface RoleAnalytics {
  roleId: string;
  roleName: string;
  userCount: number;
  activeUsers: number;
  lastUsed: string;
  permissionUsage: {
    permission: Permission;
    usageCount: number;
    lastUsed: string;
  }[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface RoleConflict {
  type: 'duplicate_permission' | 'missing_dependency' | 'role_overlap' | 'security_risk';
  severity: 'warning' | 'error' | 'critical';
  message: string;
  roleIds: string[];
  permissions?: Permission[];
  recommendation: string;
}

// Form types
export interface RoleFormData {
  name: string;
  displayName: string;
  description: string;
  permissions: Permission[];
  isActive: boolean;
}

export interface BulkRoleAssignment {
  userIds: string[];
  roleId: string;
  expiresAt?: string;
}

// API Response types
export interface RoleListResponse {
  roles: Role[];
  total: number;
  page: number;
  limit: number;
  filters?: {
    search?: string;
    category?: string;
    isActive?: boolean;
  };
}

export interface RoleValidationResult {
  isValid: boolean;
  conflicts: RoleConflict[];
  warnings: string[];
  suggestions: string[];
}