import { z } from 'zod';
import { RoleEnum, PermissionEnum, ResourceEnum, StatusEnum } from './Common/enums';
import { IdSchema, NameSchema, DescriptionSchema, DateSchema } from './Common/base';

// Permission Schema
export const PermissionSchema = z.object({
  id: IdSchema,
  name: NameSchema,
  description: DescriptionSchema,
  resource: ResourceEnum,
  action: PermissionEnum,
  conditions: z.record(z.unknown()).optional(),
  createdAt: DateSchema,
  updatedAt: DateSchema
});

// Role Schema
export const RoleSchema = z.object({
  id: IdSchema,
  name: NameSchema,
  description: DescriptionSchema,
  permissions: z.array(PermissionSchema),
  permissionIds: z.array(IdSchema),
  level: z.number().min(1).max(10).default(1),
  isSystem: z.boolean().default(false),
  isActive: z.boolean().default(true),
  userCount: z.number().min(0).default(0),
  createdAt: DateSchema,
  updatedAt: DateSchema,
  createdBy: IdSchema
});

// Role Template Schema
export const RoleTemplateSchema = z.object({
  id: IdSchema,
  name: NameSchema,
  description: DescriptionSchema,
  baseRole: RoleEnum,
  permissions: z.array(IdSchema),
  isDefault: z.boolean().default(false),
  category: z.string(),
  createdAt: DateSchema,
  updatedAt: DateSchema
});

// Create Role Schema (for API requests)
export const CreateRoleSchema = RoleSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  userCount: true
});

// Update Role Schema
export const UpdateRoleSchema = CreateRoleSchema.partial();

// Role Filter Schema
export const RoleFilterSchema = z.object({
  search: z.string().optional(),
  status: StatusEnum.optional(),
  level: z.number().optional(),
  isSystem: z.boolean().optional(),
  createdBy: IdSchema.optional(),
  sortBy: z.enum(['name', 'level', 'userCount', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Export types
export type Permission = z.infer<typeof PermissionSchema>;
export type Role = z.infer<typeof RoleSchema>;
export type RoleTemplate = z.infer<typeof RoleTemplateSchema>;
export type CreateRole = z.infer<typeof CreateRoleSchema>;
export type UpdateRole = z.infer<typeof UpdateRoleSchema>;
export type RoleFilter = z.infer<typeof RoleFilterSchema>;