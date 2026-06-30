// src/Schema/spec-value.schema.ts
import { z } from "zod";
import { schemas } from "./generated";

// ===== SpecValue schemas =====
export const SpecValueResponseSchema = schemas.SpecValueResponse.passthrough();
export type SpecValueResponse = z.infer<typeof SpecValueResponseSchema>;

export const CreateSpecValueRequestSchema = schemas.CreateSpecValueRequest.passthrough();
export type CreateSpecValueRequest = z.infer<typeof CreateSpecValueRequestSchema>;

export const UpdateSpecValueRequestSchema = schemas.UpdateSpecValueRequest.passthrough();
export type UpdateSpecValueRequest = z.infer<typeof UpdateSpecValueRequestSchema>;
