// src/Schema/plate-vendor.schema.ts
import { z } from "zod";
import { IdSchema, DateSchema, createPagedResponseSchema } from "./Common";

// ===== PlateVendorResponse =====

export const PlateVendorResponseSchema = z
  .object({
    id: IdSchema.optional(),
    name: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    note: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
    createdAt: DateSchema.optional(),
    updatedAt: DateSchema.nullable().optional(),
  })
  .passthrough();

export type PlateVendorResponse = z.infer<typeof PlateVendorResponseSchema>;

// ===== PagedResponse =====

export const PlateVendorResponsePagedResponseSchema =
  createPagedResponseSchema(PlateVendorResponseSchema);

export type PlateVendorResponsePagedResponse = z.infer<
  typeof PlateVendorResponsePagedResponseSchema
>;

// ===== CreatePlateVendorRequest =====

export const CreatePlateVendorRequestSchema = z
  .object({
    name: z.string().min(0).max(255),
    phone: z.string().min(0).max(20).nullable().optional(),
    email: z.string().email().max(255).nullable().optional(),
    address: z.string().nullable().optional(),
  })
  .passthrough();

export type CreatePlateVendorRequest = z.infer<
  typeof CreatePlateVendorRequestSchema
>;

// ===== UpdatePlateVendorRequest =====

export const UpdatePlateVendorRequestSchema = z
  .object({
    name: z.string().min(0).max(255).nullable().optional(),
    phone: z.string().min(0).max(20).nullable().optional(),
    email: z.string().email().max(255).nullable().optional(),
    address: z.string().nullable().optional(),
  })
  .passthrough();

export type UpdatePlateVendorRequest = z.infer<
  typeof UpdatePlateVendorRequestSchema
>;

