import z from "zod";
import { DateSchema, IdSchema } from "./Common/base";
import { UserSchema } from "./user.schema";

export const TimelineEntrySchema = z.object({
  id: IdSchema,
  fileUrl: z.string().url(),
  description: z.string(),
  createdAt: DateSchema,
  createdBy: UserSchema,
});

export type TimelineEntry = z.infer<typeof TimelineEntrySchema>;
