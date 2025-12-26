// src/Schema/material-type.schema.ts
// Wrapper around generated schemas - keeps utilities and stable exports
import { z } from "zod";
import {
  IdSchema,
  DateSchema,
  NameSchema,
  createPagedResponseSchema,
} from "./Common";
import { UserInfoSchema } from "./Common";
import {
  MaterialTypeResponseSchema as GenMaterialTypeResponseSchema,
  MaterialTypeResponsePaginateSchema as GenMaterialTypeResponsePaginateSchema,
  CreateMaterialTypeRequestSchema as GenCreateMaterialTypeRequestSchema,
  UpdateMaterialTypeRequestSchema as GenUpdateMaterialTypeRequestSchema,
  MaterialTypeItemSchema as GenMaterialTypeItemSchema,
  BulkCreateMaterialTypeRequestSchema as GenBulkCreateMaterialTypeRequestSchema,
} from "./generated";

// ===== MaterialTypeClassificationOptionResponse =====
// Custom schema - not in generated (used in MaterialTypeResponse.classifications)
export const MaterialTypeClassificationOptionResponseSchema = z.object({
  id: IdSchema,
  value: z.string(),
});
export type MaterialTypeClassificationOptionResponse = z.infer<
  typeof MaterialTypeClassificationOptionResponseSchema
>;

// ===== MaterialTypeClassificationResponse =====
// Custom schema - not in generated (used in MaterialTypeResponse.classifications)
export const MaterialTypeClassificationResponseSchema = z.object({
  id: IdSchema,
  classificationName: z.string(),
  classificationKey: z.string(),
  options: z.array(MaterialTypeClassificationOptionResponseSchema),
});
export type MaterialTypeClassificationResponse = z.infer<
  typeof MaterialTypeClassificationResponseSchema
>;

// ===== MaterialTypeResponse =====
export const MaterialTypeResponseSchema =
  GenMaterialTypeResponseSchema.passthrough();
export type MaterialTypeResponse = z.infer<typeof MaterialTypeResponseSchema>;

// ===== PagedResponse =====
export const MaterialTypeResponsePagedResponseSchema = createPagedResponseSchema(
  MaterialTypeResponseSchema
);
export type MaterialTypeResponsePagedResponse = z.infer<
  typeof MaterialTypeResponsePagedResponseSchema
>;

// Re-export generated paginate schema for compatibility
export {
  GenMaterialTypeResponsePaginateSchema as MaterialTypeResponsePaginateSchema,
};
export type MaterialTypeResponsePaginate = z.infer<
  typeof GenMaterialTypeResponsePaginateSchema
>;

// ===== CreateMaterialTypeRequest =====
export const CreateMaterialTypeRequestSchema =
  GenCreateMaterialTypeRequestSchema.passthrough();
export type CreateMaterialTypeRequest = z.infer<
  typeof CreateMaterialTypeRequestSchema
>;

// ===== MaterialTypeItem (for bulk create) =====
export const MaterialTypeItemSchema = GenMaterialTypeItemSchema.passthrough();
export type MaterialTypeItem = z.infer<typeof MaterialTypeItemSchema>;

// ===== BulkCreateMaterialTypeRequest =====
// Base from generated, but keep custom validation
export const BulkCreateMaterialTypeRequestSchema =
  GenBulkCreateMaterialTypeRequestSchema.refine(
    (data) => {
      if (data.materials && data.materials.length < 1) {
        return false;
      }
      return true;
    },
    { message: "Cần ít nhất 1 chất liệu", path: ["materials"] }
  );
export type BulkCreateMaterialTypeRequest = z.infer<
  typeof BulkCreateMaterialTypeRequestSchema
>;

// ===== UpdateMaterialTypeRequest =====
export const UpdateMaterialTypeRequestSchema =
  GenUpdateMaterialTypeRequestSchema.passthrough();
export type UpdateMaterialTypeRequest = z.infer<
  typeof UpdateMaterialTypeRequestSchema
>;
