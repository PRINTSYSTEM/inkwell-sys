// src/Schema/design-type.schema.ts
// Wrapper around generated schemas - keeps utilities and stable exports
import { z } from "zod";
import { createPagedResponseSchema } from "./Common";
import {
  DesignTypeResponseSchema as GenDesignTypeResponseSchema,
  DesignTypeResponsePaginateSchema as GenDesignTypeResponsePaginateSchema,
  CreateDesignTypeRequestSchema as GenCreateDesignTypeRequestSchema,
  UpdateDesignTypeRequestSchema as GenUpdateDesignTypeRequestSchema,
} from "./generated";

// ===== DesignTypeResponse =====
export const DesignTypeResponseSchema = GenDesignTypeResponseSchema.extend({
  deliverySlaDays: z.number().nullish(),
  deliveryWarningBeforeHours: z.number().nullish(),
}).passthrough();
export type DesignTypeResponse = z.infer<typeof DesignTypeResponseSchema>;

// ===== PagedResponse =====
export const DesignTypeListResponseSchema = createPagedResponseSchema(
  DesignTypeResponseSchema
);
export type DesignTypeListResponse = z.infer<
  typeof DesignTypeListResponseSchema
>;

// Re-export generated paginate schema for compatibility
export {
  GenDesignTypeResponsePaginateSchema as DesignTypeResponsePaginateSchema,
};
export type DesignTypeResponsePaginate = z.infer<
  typeof GenDesignTypeResponsePaginateSchema
>;

// ===== CreateDesignTypeRequest =====
export const CreateDesignTypeRequestSchema = GenCreateDesignTypeRequestSchema.extend({
  deliverySlaDays: z.number().nullish(),
  deliveryWarningBeforeHours: z.number().nullish(),
}).passthrough();
export type CreateDesignTypeRequest = z.infer<
  typeof CreateDesignTypeRequestSchema
>;

// ===== UpdateDesignTypeRequest =====
export const UpdateDesignTypeRequestSchema = GenUpdateDesignTypeRequestSchema.extend({
  deliverySlaDays: z.number().nullish(),
  deliveryWarningBeforeHours: z.number().nullish(),
}).passthrough();
export type UpdateDesignTypeRequest = z.infer<
  typeof UpdateDesignTypeRequestSchema
>;
