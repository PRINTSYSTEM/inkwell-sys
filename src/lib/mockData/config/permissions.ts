/**
 * User Role Permissions Configuration
 */

export interface Permission {
  resource: string;
  actions: string[];
}

export interface RolePermissions {
  role: string;
  permissions: Permission[];
}

export const rolePermissions: RolePermissions[] = [
  {
    role: 'admin',
    permissions: [
      { resource: '*', actions: ['*'] }, // Admin has all permissions
    ],
  },
  {
    role: 'cskh',
    permissions: [
      { resource: 'customers', actions: ['create', 'read', 'update'] },
      { resource: 'orders', actions: ['create', 'read', 'update'] },
      { resource: 'designs', actions: ['read'] },
      { resource: 'payments', actions: ['read', 'update'] },
    ],
  },
  {
    role: 'design',
    permissions: [
      { resource: 'designs', actions: ['read', 'update', 'create'] },
      { resource: 'orders', actions: ['read'] },
      { resource: 'customers', actions: ['read'] },
      { resource: 'design-types', actions: ['read'] },
    ],
  },
  {
    role: 'production',
    permissions: [
      { resource: 'production', actions: ['read', 'update', 'create'] },
      { resource: 'designs', actions: ['read'] },
      { resource: 'orders', actions: ['read'] },
      { resource: 'inventory', actions: ['read', 'update'] },
    ],
  },
  {
    role: 'accounting',
    permissions: [
      { resource: 'payments', actions: ['read', 'update', 'create'] },
      { resource: 'orders', actions: ['read'] },
      { resource: 'customers', actions: ['read', 'update'] },
      { resource: 'reports', actions: ['read'] },
    ],
  },
  {
    role: 'hr',
    permissions: [
      { resource: 'users', actions: ['read', 'update', 'create'] },
      { resource: 'attendance', actions: ['read', 'update', 'create'] },
      { resource: 'reports', actions: ['read'] },
    ],
  },
];

/**
 * Check if user has permission for specific resource and action
 */
export function hasPermission(
  userRole: string,
  resource: string,
  action: string
): boolean {
  const roleConfig = rolePermissions.find(rp => rp.role === userRole);
  if (!roleConfig) return false;

  // Check for wildcard permissions (admin)
  const wildcardPermission = roleConfig.permissions.find(
    p => p.resource === '*' && p.actions.includes('*')
  );
  if (wildcardPermission) return true;

  // Check specific resource permissions
  const resourcePermission = roleConfig.permissions.find(
    p => p.resource === resource
  );
  if (!resourcePermission) return false;

  // Check if action is allowed
  return resourcePermission.actions.includes(action) || 
         resourcePermission.actions.includes('*');
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: string): Permission[] {
  const roleConfig = rolePermissions.find(rp => rp.role === role);
  return roleConfig?.permissions || [];
}