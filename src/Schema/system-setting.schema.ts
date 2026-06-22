import { z } from "zod";

export const SystemSettingResponseSchema = z.object({
  key: z.string(),
  value: z.string(),
  description: z.string(),
  isEditable: z.boolean(),
  lastModifiedAt: z.string().optional().nullable(),
  lastModifiedBy: z.any().optional().nullable(),
});

export type SystemSettingResponse = z.infer<typeof SystemSettingResponseSchema>;

export const UpdateSystemSettingRequestSchema = z.object({
  value: z.string(),
  description: z.string(),
});

export type UpdateSystemSettingRequest = z.infer<
  typeof UpdateSystemSettingRequestSchema
>;
