// Common Schemas

export * from "./common";
// Entity Schemas
export * from "./user.schema";
export * from "./notification.schema";
export * from "./design.schema";
export * from "./design-type.schema";
export * from "./material-type.schema";
export * from "./order.schema";
export * from "./proofing-order.schema";
export * from "./production.schema";
export * from "./customer.schema";
export * from "./invoice.schema";
export * from "./accounting.schema";
export * from "./auth.schema";
export * from "./params.schema";
export * from "./paper-size.schema";
export * from "./plate-export.schema";
export * from "./die-export.schema";

// Re-export zod for convenience
import { z } from "zod";
export { z };

// Schema validation utilities
/**
 * Utility function to validate data against a schema
 * @param schema Zod schema to validate against
 * @param data Data to validate
 * @returns Validation result with success status and parsed data or errors
 */
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

/**
 * Utility function to safely parse data with a schema
 * @param schema Zod schema to validate against
 * @param data Data to validate
 * @returns Parsed data or null if validation fails
 */
export function safeParseSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T | null {
  const result = schema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Utility function to get validation errors as a formatted object
 * @param error Zod validation error
 * @returns Formatted error object with field paths and messages
 */
export function formatValidationErrors(
  error: z.ZodError
): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  error.errors.forEach((err) => {
    const path = err.path.join(".");
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(err.message);
  });

  return errors;
}

/**
 * Utility function to get validation errors as a flat object (first error per field)
 * @param error Zod validation error
 * @returns Formatted error object with field paths and first error message
 */
export function formatValidationErrorsFlat(
  error: z.ZodError
): Record<string, string> {
  const errors: Record<string, string> = {};

  error.errors.forEach((err) => {
    const path = err.path.join(".");
    // Only set the first error for each field
    if (!errors[path]) {
      errors[path] = err.message;
    }
  });

  return errors;
}

/**
 * Utility function to get all validation error messages as an array
 * @param error Zod validation error
 * @returns Array of error messages
 */
export function getValidationErrorMessages(error: z.ZodError): string[] {
  return error.errors.map((err) => {
    const path = err.path.length > 0 ? `${err.path.join(".")}: ` : "";
    return `${path}${err.message}`;
  });
}

/**
 * Utility function to get a single error message for a specific field
 * @param error Zod validation error
 * @param fieldPath Field path (e.g., "name" or "address.street")
 * @returns First error message for the field, or undefined
 */
export function getFieldError(
  error: z.ZodError,
  fieldPath: string
): string | undefined {
  const fieldErrors = error.errors.filter(
    (err) => err.path.join(".") === fieldPath
  );
  return fieldErrors.length > 0 ? fieldErrors[0].message : undefined;
}

/**
 * Utility function to create a partial update schema from a full schema
 * @param schema Original schema
 * @returns Partial schema where all fields are optional
 */
export function createPartialSchema<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>
): z.ZodObject<{ [K in keyof T]: z.ZodOptional<T[K]> }> {
  return schema.partial();
}

/**
 * Type helper for extracting the TypeScript type from a Zod schema
 */
export type InferSchema<T extends z.ZodType> = z.infer<T>;
export const ErrorResponseSchema = z.object({
  statusCode: z.number().int(),
  error: z.string().nullable(),
  timeStamp: z.string(), // date-time
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export const PagedMetaSchema = z.object({
  totalCount: z.number().int(),
  pageNumber: z.number().int(),
  pageSize: z.number().int(),
  totalPages: z.number().int().optional(), // readOnly
  hasPreviousPage: z.boolean().optional(),
  hasNextPage: z.boolean().optional(),
});
export type PagedMeta = z.infer<typeof PagedMetaSchema>;
