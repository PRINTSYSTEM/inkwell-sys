import { z } from "zod";

// User reference schema (for createdBy field)
export const UserReferenceSchema = z.object({
  id: z.number(),
  username: z.string(),
  fullName: z.string(),
  role: z.string(),
  email: z.string().email(),
  phone: z.string(),
});

// Customer create/update request schema
export const CustomerRequestSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  companyName: z.string().min(1, "Company name is required"),
  representativeName: z.string().min(1, "Representative name is required"),
  phone: z.string().min(1, "Phone is required"),
  taxCode: z.string().min(1, "Tax code is required"),
  address: z.string().min(1, "Address is required"),
  type: z.string().min(1, "Customer type is required"),
  currentDebt: z.number().min(0, "Current debt cannot be negative"),
  maxDebt: z.number().min(0, "Max debt cannot be negative"),
});

// Customer response schema (full details)
export const CustomerSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  companyName: z.string(),
  representativeName: z.string(),
  phone: z.string(),
  taxCode: z.string().optional(),
  address: z.string(),
  type: z.string(),
  currentDebt: z.number(),
  maxDebt: z.number(),
  debtStatus: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: UserReferenceSchema.optional(),
});

// Customer list item schema (matches API /customers response)
export const CustomerListItemSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  companyName: z.string(),
  debtStatus: z.string(),
  currentDebt: z.number(),
  maxDebt: z.number(),
  // Additional fields for UI compatibility (will be added by service layer)
  representativeName: z.string().optional(),
  phone: z.string().optional(),
  taxCode: z.string().optional(),
  address: z.string().optional(),
  createdAt: z.string().optional(),
  createdBy: z.string().optional(),
  folder: z.string().optional(),
});

// Paginated response schema
export const CustomerListResponseSchema = z.object({
  items: z.array(CustomerListItemSchema),
  totalCount: z.number(),
  pageNumber: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
  hasPreviousPage: z.boolean(),
  hasNextPage: z.boolean(),
});

// Customer search/filter parameters
export const CustomerSearchParamsSchema = z.object({
  pageNumber: z.number().min(1).optional().default(1),
  pageSize: z.number().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  debtStatus: z.string().optional(),
}).partial();

// Types
export type CustomerRequest = z.infer<typeof CustomerRequestSchema>;
export type Customer = z.infer<typeof CustomerSchema>;
export type CustomerListItem = z.infer<typeof CustomerListItemSchema>;
export type CustomerListResponse = z.infer<typeof CustomerListResponseSchema>;
export type CustomerSearchParams = z.infer<typeof CustomerSearchParamsSchema>;
export type UserReference = z.infer<typeof UserReferenceSchema>;

// Customer type enum
export enum CustomerType {
  INDIVIDUAL = "individual",
  COMPANY = "company",
  GOVERNMENT = "government",
  NGO = "ngo"
}

// Debt status enum
export enum DebtStatus {
  GOOD = "good",
  WARNING = "warning", 
  BLOCKED = "blocked",
  OVERDUE = "overdue"
}

// Validation functions
export const validateCustomerRequest = (data: unknown): CustomerRequest => {
  return CustomerRequestSchema.parse(data);
};

export const validateCustomer = (data: unknown): Customer => {
  return CustomerSchema.parse(data);
};

export const validateCustomerListResponse = (data: unknown): CustomerListResponse => {
  return CustomerListResponseSchema.parse(data);
};

export const validateCustomerSearchParams = (data: unknown): CustomerSearchParams => {
  return CustomerSearchParamsSchema.parse(data);
};

// Helper functions for debt management
export const calculateDebtRatio = (currentDebt: number, maxDebt: number): number => {
  if (maxDebt === 0) return 0;
  return (currentDebt / maxDebt) * 100;
};

export const getDebtStatusColor = (debtStatus: string): string => {
  switch (debtStatus.toLowerCase()) {
    case DebtStatus.GOOD:
      return "green";
    case DebtStatus.WARNING:
      return "yellow";
    case DebtStatus.BLOCKED:
    case DebtStatus.OVERDUE:
      return "red";
    default:
      return "gray";
  }
};

export const isDebtStatusCritical = (debtStatus: string): boolean => {
  return [DebtStatus.BLOCKED, DebtStatus.OVERDUE].includes(debtStatus.toLowerCase() as DebtStatus);
};

export const canCreateOrderForCustomer = (customer: Customer): boolean => {
  return !isDebtStatusCritical(customer.debtStatus) && customer.currentDebt <= customer.maxDebt;
};