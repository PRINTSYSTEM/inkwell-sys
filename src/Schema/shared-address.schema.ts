// src/Schema/shared-address.schema.ts
import { z } from "zod";
import { IdSchema, DateSchema, NameSchema, createPagedResponseSchema } from "./Common/base";

// Shared Address entity used for admin CRUD
export const SharedAddressSchema = z
  .object({
    id: IdSchema.optional(),
    label: NameSchema,
    address: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
    createdAt: DateSchema.optional(),
    updatedAt: DateSchema.optional(),
  })
  .passthrough();

export type SharedAddress = z.infer<typeof SharedAddressSchema>;

export const SharedAddressPagedResponseSchema = createPagedResponseSchema(SharedAddressSchema);
export type SharedAddressPagedResponse = z.infer<typeof SharedAddressPagedResponseSchema>;

export const CreateSharedAddressRequestSchema = z
  .object({
    label: NameSchema,
    address: z.string().nullable().optional(),
  })
  .passthrough();
export type CreateSharedAddressRequest = z.infer<typeof CreateSharedAddressRequestSchema>;

export const UpdateSharedAddressRequestSchema = CreateSharedAddressRequestSchema.partial();
export type UpdateSharedAddressRequest = z.infer<typeof UpdateSharedAddressRequestSchema>;

export default SharedAddressSchema;
