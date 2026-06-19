// src/Schema/defect-record.schema.ts
import { z } from "zod";
import { PagedParamsSchema } from "./Common";
import {
  CreateDefectRecordRequestSchema as GenCreateDefectRecordRequestSchema,
  UpdateDefectRecordRequestSchema as GenUpdateDefectRecordRequestSchema,
  DefectRecordResponseSchema as GenDefectRecordResponseSchema,
  DefectRecordResponsePaginateSchema as GenDefectRecordResponsePaginateSchema,
  DefectRecordSummaryByUserResponseSchema as GenDefectRecordSummaryByUserResponseSchema,
  DefectBySourceBreakdownSchema as GenDefectBySourceBreakdownSchema,
} from "./generated";

export const CreateDefectRecordRequestSchema = GenCreateDefectRecordRequestSchema.passthrough();
export type CreateDefectRecordRequest = z.infer<typeof CreateDefectRecordRequestSchema>;

export const UpdateDefectRecordRequestSchema = GenUpdateDefectRecordRequestSchema.passthrough();
export type UpdateDefectRecordRequest = z.infer<typeof UpdateDefectRecordRequestSchema>;

export const DefectRecordResponseSchema = GenDefectRecordResponseSchema.passthrough();
export type DefectRecordResponse = z.infer<typeof DefectRecordResponseSchema>;

export const DefectRecordResponsePaginateSchema = GenDefectRecordResponsePaginateSchema.passthrough();
export type DefectRecordResponsePaginate = z.infer<typeof DefectRecordResponsePaginateSchema>;

export const DefectRecordSummaryByUserResponseSchema = GenDefectRecordSummaryByUserResponseSchema.passthrough();
export type DefectRecordSummaryByUserResponse = z.infer<
  typeof DefectRecordSummaryByUserResponseSchema
>;

export const DefectBySourceBreakdownSchema = GenDefectBySourceBreakdownSchema.passthrough();
export type DefectBySourceBreakdown = z.infer<typeof DefectBySourceBreakdownSchema>;


