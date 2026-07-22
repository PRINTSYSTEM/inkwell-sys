import { z } from "zod";
import {
  CustomerOpeningBalanceResponseSchema as GenCustomerOpeningBalanceResponseSchema,
  ImportCustomerOpeningBalanceItemSchema as GenImportCustomerOpeningBalanceItemSchema,
  ImportVendorOpeningBalanceItemSchema as GenImportVendorOpeningBalanceItemSchema,
  UpsertCustomerOpeningBalanceRequestSchema as GenUpsertCustomerOpeningBalanceRequestSchema,
  UpsertVendorOpeningBalanceRequestSchema as GenUpsertVendorOpeningBalanceRequestSchema,
  VendorOpeningBalanceResponseSchema as GenVendorOpeningBalanceResponseSchema,
  ImportResultResponseSchema as GenImportResultResponseSchema,
} from "./generated";

export const CustomerOpeningBalanceResponseSchema = GenCustomerOpeningBalanceResponseSchema;
export type CustomerOpeningBalanceResponse = z.infer<typeof CustomerOpeningBalanceResponseSchema>;

export const ImportCustomerOpeningBalanceItemSchema = GenImportCustomerOpeningBalanceItemSchema;
export type ImportCustomerOpeningBalanceItem = z.infer<typeof ImportCustomerOpeningBalanceItemSchema>;

export const ImportVendorOpeningBalanceItemSchema = GenImportVendorOpeningBalanceItemSchema;
export type ImportVendorOpeningBalanceItem = z.infer<typeof ImportVendorOpeningBalanceItemSchema>;

export const UpsertCustomerOpeningBalanceRequestSchema = GenUpsertCustomerOpeningBalanceRequestSchema;
export type UpsertCustomerOpeningBalanceRequest = z.infer<typeof UpsertCustomerOpeningBalanceRequestSchema>;

export const UpsertVendorOpeningBalanceRequestSchema = GenUpsertVendorOpeningBalanceRequestSchema;
export type UpsertVendorOpeningBalanceRequest = z.infer<typeof UpsertVendorOpeningBalanceRequestSchema>;

export const VendorOpeningBalanceResponseSchema = GenVendorOpeningBalanceResponseSchema;
export type VendorOpeningBalanceResponse = z.infer<typeof VendorOpeningBalanceResponseSchema>;

export const ImportResultResponseSchema = GenImportResultResponseSchema;
export type ImportResultResponse = z.infer<typeof ImportResultResponseSchema>;
