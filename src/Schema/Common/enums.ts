// src/Schema/Common/enums.ts
import { z } from "zod";

// ===== UserRole (swagger: regex pattern trên CreateUserRequest/UpdateUserRequest) =====

// Updated to match swagger.json pattern: ^(admin|manager|design|design_lead|proofer|production|production_lead|accounting|accounting_lead|warehouse|warehouse_lead|hr|hr_lead|cskh|cskh_lead)$
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
  "warehouse",
  "warehouse_lead",
  "hr",
  "hr_lead",
  "cskh",
  "cskh_lead",
]);

export type UserRole = z.infer<typeof UserRoleSchema>;

// ===== CommonStatus (swagger: constants/commonStatuses) =====

export const CommonStatusSchema = z.enum(["active", "inactive"]);
export type CommonStatus = z.infer<typeof CommonStatusSchema>;
