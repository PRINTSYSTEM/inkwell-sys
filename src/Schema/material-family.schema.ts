// src/Schema/material-family.schema.ts
import { z } from "zod";
import { schemas } from "./generated";

// ===== MaterialFamily schemas =====
export const MaterialFamilyResponseSchema = schemas.MaterialFamilyResponse.passthrough();
export type MaterialFamilyResponse = z.infer<typeof MaterialFamilyResponseSchema>;

export const MaterialFamilyResponseIPaginateSchema = schemas.MaterialFamilyResponseIPaginate.passthrough();
export type MaterialFamilyResponseIPaginate = z.infer<typeof MaterialFamilyResponseIPaginateSchema>;

export const CreateMaterialFamilyRequestSchema = schemas.CreateMaterialFamilyRequest.passthrough();
export type CreateMaterialFamilyRequest = z.infer<typeof CreateMaterialFamilyRequestSchema>;

export const UpdateMaterialFamilyRequestSchema = schemas.UpdateMaterialFamilyRequest.passthrough();
export type UpdateMaterialFamilyRequest = z.infer<typeof UpdateMaterialFamilyRequestSchema>;
