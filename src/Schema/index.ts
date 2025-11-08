// Common Schemas
export * from './Common/enums';
export * from './Common/base';

// Entity Schemas
export * from './user.schema';
export * from './role.schema';
export * from './employee.schema';
export * from './report.schema';
export * from './department.schema';
export * from './notification.schema';
export * from './design-code.schema';
export * from './design-assignment.schema';
export * from './design-type.schema';
export * from './material.schema';
export * from './order.schema';

// Re-export zod for convenience
import { z } from 'zod';
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
export function formatValidationErrors(error: z.ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(err.message);
  });
  
  return errors;
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