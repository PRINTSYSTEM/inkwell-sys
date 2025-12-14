import { useState, useCallback } from "react";
import { z, ZodSchema } from "zod";
import {
  validateSchema,
  formatValidationErrorsFlat,
  getFieldError,
} from "@/Schema";

/**
 * Hook for form validation with Zod schemas
 * @param schema Zod schema to validate against
 * @returns Validation utilities and error state
 */
export function useFormValidation<T extends z.ZodType>(
  schema: ZodSchema<z.infer<T>>
) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  /**
   * Validate a single field
   */
  const validateField = useCallback(
    (fieldPath: string, value: unknown): string | undefined => {
      const result = schema.safeParse({ [fieldPath]: value });
      if (!result.success) {
        const error = getFieldError(result.error, fieldPath);
        return error;
      }
      return undefined;
    },
    [schema]
  );

  /**
   * Touch all fields that have errors
   */
  const touchAllErrorFields = useCallback((errorFields: string[]) => {
    setTouched((prev) => {
      const newTouched = { ...prev };
      errorFields.forEach((field) => {
        newTouched[field] = true;
      });
      return newTouched;
    });
  }, []);

  /**
   * Validate entire form data
   */
  const validateForm = useCallback(
    (data: unknown, touchErrors = true): boolean => {
      const result = validateSchema(schema, data);
      if (!result.success) {
        const formattedErrors = formatValidationErrorsFlat(result.errors);
        setErrors(formattedErrors);

        // Touch all fields with errors so they display
        if (touchErrors) {
          touchAllErrorFields(Object.keys(formattedErrors));
        }

        return false;
      }
      setErrors({});
      return true;
    },
    [schema, touchAllErrorFields]
  );

  /**
   * Validate and return parsed data or null
   */
  const validateAndParse = useCallback(
    (data: unknown, touchErrors = true): z.infer<T> | null => {
      const result = validateSchema(schema, data);
      if (!result.success) {
        const formattedErrors = formatValidationErrorsFlat(result.errors);
        setErrors(formattedErrors);

        // Touch all fields with errors so they display
        if (touchErrors) {
          touchAllErrorFields(Object.keys(formattedErrors));
        }

        return null;
      }
      setErrors({});
      return result.data;
    },
    [schema, touchAllErrorFields]
  );

  /**
   * Set error for a specific field
   */
  const setFieldError = useCallback((fieldPath: string, message: string) => {
    setErrors((prev) => ({ ...prev, [fieldPath]: message }));
  }, []);

  /**
   * Clear error for a specific field
   */
  const clearFieldError = useCallback((fieldPath: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldPath];
      return newErrors;
    });
  }, []);

  /**
   * Clear all errors
   */
  const clearAllErrors = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  /**
   * Mark a field as touched
   */
  const touchField = useCallback((fieldPath: string) => {
    setTouched((prev) => ({ ...prev, [fieldPath]: true }));
  }, []);

  /**
   * Check if a field has been touched
   */
  const isFieldTouched = useCallback(
    (fieldPath: string): boolean => {
      return touched[fieldPath] ?? false;
    },
    [touched]
  );

  /**
   * Get error for a specific field
   */
  const getError = useCallback(
    (fieldPath: string): string | undefined => {
      return errors[fieldPath];
    },
    [errors]
  );

  /**
   * Check if a field has an error
   */
  const hasError = useCallback(
    (fieldPath: string): boolean => {
      return !!errors[fieldPath];
    },
    [errors]
  );

  /**
   * Check if form has any errors
   */
  const hasAnyError = useCallback((): boolean => {
    return Object.keys(errors).length > 0;
  }, [errors]);

  /**
   * Get the first field with an error (for scrolling)
   */
  const getFirstErrorField = useCallback((): string | undefined => {
    const errorFields = Object.keys(errors);
    return errorFields.length > 0 ? errorFields[0] : undefined;
  }, [errors]);

  /**
   * Scroll to first error field
   */
  const scrollToFirstError = useCallback(() => {
    const firstErrorField = getFirstErrorField();
    if (firstErrorField) {
      // Try to find element by id or name
      const element =
        document.getElementById(firstErrorField) ||
        document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        // Focus the element if it's focusable
        if (element instanceof HTMLElement && "focus" in element) {
          (element as HTMLElement).focus();
        }
      }
    }
  }, [getFirstErrorField]);

  return {
    // Error state
    errors,
    touched,

    // Validation functions
    validateForm,
    validateField,
    validateAndParse,

    // Error management
    setFieldError,
    clearFieldError,
    clearAllErrors,
    getError,
    hasError,
    hasAnyError,
    getFirstErrorField,
    scrollToFirstError,

    // Touch management
    touchField,
    isFieldTouched,
  };
}
