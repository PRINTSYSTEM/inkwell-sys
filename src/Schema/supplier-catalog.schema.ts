// src/Schema/supplier-catalog.schema.ts
import { z } from "zod";
import { schemas } from "./generated";

// ===== SupplierCatalog schemas =====
export const SupplierCatalogResponseSchema = schemas.SupplierCatalogResponse.passthrough();
export type SupplierCatalogResponse = z.infer<typeof SupplierCatalogResponseSchema>;

export const CreateSupplierCatalogRequestSchema = schemas.CreateSupplierCatalogRequest.passthrough();
export type CreateSupplierCatalogRequest = z.infer<typeof CreateSupplierCatalogRequestSchema>;
