// src/Schema/common/enums.ts
import { z } from "zod";

// ===== UserRole (swagger: regex pattern trên CreateUserRequest/UpdateUserRequest) =====

export const UserRoleSchema = z.enum([
  "admin",
  "manager",
  "design",
  "design_lead",
  "proofer",
  "production",
  "production_lead",
  "accounting",
  "accounting_lead",
]);

export type UserRole = z.infer<typeof UserRoleSchema>;

// ===== CommonStatus (swagger: constants/commonStatuses) =====

export const CommonStatusSchema = z.enum(["active", "inactive"]);
export type CommonStatus = z.infer<typeof CommonStatusSchema>;
