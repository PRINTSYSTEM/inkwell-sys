// src/Schema/spec-template.schema.ts
import { z } from "zod";
import { schemas } from "./generated";

// ===== SpecificationTemplate schemas =====
export const SpecificationTemplateResponseSchema = schemas.SpecificationTemplateResponse.passthrough();
export type SpecificationTemplateResponse = z.infer<typeof SpecificationTemplateResponseSchema>;

export const CreateSpecificationTemplateRequestSchema = schemas.CreateSpecificationTemplateRequest.passthrough();
export type CreateSpecificationTemplateRequest = z.infer<typeof CreateSpecificationTemplateRequestSchema>;

export const UpdateSpecificationTemplateRequestSchema = schemas.UpdateSpecificationTemplateRequest.passthrough();
export type UpdateSpecificationTemplateRequest = z.infer<typeof UpdateSpecificationTemplateRequestSchema>;
