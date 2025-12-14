import { ENTITY_CONFIG } from "@/config/entities.config";

export const ROLE = {
  ADMIN: "admin",
  MANAGER: "manager",
  DESIGN: "design",
  DESIGN_LEAD: "design_lead",
  PRODUCTION: "production",
  PRODUCTION_LEAD: "production_lead",
  ACCOUNTING: "accounting",
  ACCOUNTING_LEAD: "accounting_lead",
  PROOFER: "proofer",
} as const;

export const ROLE_LABELS: Record<string, string> = ENTITY_CONFIG.roles.values;
