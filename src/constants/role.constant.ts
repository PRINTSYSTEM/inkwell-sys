import { ENTITY_CONFIG } from "@/config/entities.config";
import { ROUTE_PATHS } from "./route.constant";

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

export const REDIRECT_ROLE = {
  [ROLE.ADMIN]: ROUTE_PATHS.DASHBOARD,
  [ROLE.MANAGER]: ROUTE_PATHS.DASHBOARD,
  [ROLE.DESIGN]: ROUTE_PATHS.DESIGN.MY_WORK,
  [ROLE.DESIGN_LEAD]: ROUTE_PATHS.DESIGN.MY_WORK,
  [ROLE.PRODUCTION]: ROUTE_PATHS.PRODUCTION.ROOT,
  [ROLE.ACCOUNTING]: ROUTE_PATHS.ACCOUNTING.ROOT,
  [ROLE.ACCOUNTING_LEAD]: ROUTE_PATHS.ACCOUNTING.ROOT,
  [ROLE.PROOFER]: ROUTE_PATHS.PROOFING.ROOT,
  [ROLE.PRODUCTION_LEAD]: ROUTE_PATHS.PRODUCTION.ROOT,
} as const;

export const ROLE_LABELS: Record<string, string> = ENTITY_CONFIG.roles.values;
