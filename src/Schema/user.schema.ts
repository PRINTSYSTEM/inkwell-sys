// src/Schema/user.schema.ts
import { z } from "zod";
import {
  IdSchema,
  DateSchema,
  NameSchema,
  createPagedResponseSchema,
  UserRoleSchema,
} from "./Common";

// ===== UserResponse =====

export const UserResponseSchema = z
  .object({
    id: IdSchema.optional(),
    username: z.string().nullable().optional(),
    fullName: z.string().nullable().optional(),
    role: UserRoleSchema.nullable().optional(),
    email: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
    createdAt: DateSchema.optional(),
    updatedAt: DateSchema.optional(),
  })
  .passthrough();

export type UserResponse = z.infer<typeof UserResponseSchema>;

// ===== UserResponsePagedResponse =====

export const UserResponsePagedResponseSchema =
  createPagedResponseSchema(UserResponseSchema);

export type UserResponsePagedResponse = z.infer<
  typeof UserResponsePagedResponseSchema
>;

// ===== CreateUserRequest =====
// Updated to match swagger.json: username, password, fullName, role required

export const CreateUserRequestSchema = z
  .object({
    username: z.string().min(0).max(100), // Required in swagger, maxLength 100
    password: z.string().min(6).max(100), // Required in swagger, minLength 6, maxLength 100
    fullName: z.string().min(0).max(255), // Required in swagger, maxLength 255
    role: z
      .string()
      .regex(
        /^(admin|manager|design|design_lead|proofer|production|production_lead|accounting|accounting_lead|warehouse|warehouse_lead|hr|hr_lead|cskh|cskh_lead)$/
      ), // Required in swagger, pattern from swagger
    email: z.string().email().max(255).nullable().optional(), // Optional, format email, maxLength 255
    phone: z.string().min(0).max(20).nullable().optional(), // Optional, format tel, maxLength 20
  })
  .passthrough();

export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;

// ===== UpdateUserRequest =====
// Updated to match swagger.json: all fields optional, nullable

export const UpdateUserRequestSchema = z
  .object({
    fullName: z.string().min(0).max(255).nullable().optional(), // Updated to match swagger
    role: z
      .string()
      .regex(
        /^(admin|manager|design|design_lead|proofer|production|production_lead|accounting|accounting_lead|warehouse|warehouse_lead|hr|hr_lead|cskh|cskh_lead)$/
      )
      .nullable()
      .optional(), // Updated to match swagger pattern
    email: z.string().email().min(0).max(255).nullable().optional(), // Updated to match swagger
    phone: z.string().min(0).max(20).nullable().optional(), // Updated to match swagger
    isActive: z.boolean().nullable().optional(),
  })
  .passthrough();

export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;

// ===== UserKpiResponse =====

export const UserKpiResponseSchema = z
  .object({
    userId: IdSchema.optional(),
    fullName: z.string().nullable().optional(),
    role: z.string().nullable().optional(),
    fromDate: DateSchema.optional(),
    toDate: DateSchema.optional(),
    totalDesignsAssigned: z.number().int().optional(),
    designsCompleted: z.number().int().optional(),
    designsInProgress: z.number().int().optional(),
    designCompletionRate: z.number().optional(),
    averageDesignTimeHours: z.number().optional(),
    totalProofingOrdersAssigned: z.number().int().optional(),
    proofingOrdersCompleted: z.number().int().optional(),
    proofingOrdersInProgress: z.number().int().optional(),
    proofingCompletionRate: z.number().optional(),
    totalProductionsAssigned: z.number().int().optional(),
    productionsCompleted: z.number().int().optional(),
    productionsInProgress: z.number().int().optional(),
    productionCompletionRate: z.number().optional(),
    totalOrdersHandled: z.number().int().optional(),
    totalRevenueGenerated: z.number().optional(),
  })
  .passthrough();

export type UserKpiResponse = z.infer<typeof UserKpiResponseSchema>;

// ===== TeamKpiSummaryResponse =====

export const TeamKpiSummaryResponseSchema = z
  .object({
    fromDate: DateSchema.optional(),
    toDate: DateSchema.optional(),
    userKpis: z.array(UserKpiResponseSchema).nullable().optional(),
    totalDesignsCompleted: z.number().int().optional(),
    totalProofingOrdersCompleted: z.number().int().optional(),
    totalProductionsCompleted: z.number().int().optional(),
    totalRevenue: z.number().optional(),
  })
  .passthrough();

export type TeamKpiSummaryResponse = z.infer<
  typeof TeamKpiSummaryResponseSchema
>;
