import { z } from 'zod';

// Role related enums
export const RoleEnum = z.enum([
  'admin',
  'shareholder', 
  'designer_manager',
  'production_manager',
  'designer',
  'production_worker',
  'prepress',
  'operator',
  'customer_service',
  'accountant',
  'hr'
]);

export const PermissionEnum = z.enum([
  'create',
  'read', 
  'update',
  'delete',
  'manage_all',
  'view_all',
  'export',
  'import',
  'approve',
  'reject'
]);

export const ResourceEnum = z.enum([
  'users',
  'roles',
  'departments',
  'employees',
  'assignments',
  'reports',
  'notifications',
  'analytics',
  'attendance',
  'performance',
  'designs',
  'orders',
  'customers',
  'inventory',
  'materials',
  'production'
]);

// Status enums
export const StatusEnum = z.enum([
  'active',
  'inactive',
  'pending',
  'approved',
  'rejected',
  'draft',
  'completed',
  'cancelled',
  'archived'
]);

export const PriorityEnum = z.enum([
  'low',
  'medium', 
  'high',
  'urgent',
  'critical'
]);

// Export types for use in other schemas
export type RoleType = z.infer<typeof RoleEnum>;
export type PermissionType = z.infer<typeof PermissionEnum>;
export type ResourceType = z.infer<typeof ResourceEnum>;
export type StatusType = z.infer<typeof StatusEnum>;
export type PriorityType = z.infer<typeof PriorityEnum>;