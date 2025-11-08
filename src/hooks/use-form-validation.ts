import { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface FormState<T> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  submitCount: number;
}

export interface FormActions<T> {
  setValue: (field: keyof T, value: unknown) => void;
  setValues: (values: Partial<T>) => void;
  setError: (field: keyof T, message: string) => void;
  clearError: (field: keyof T) => void;
  clearErrors: () => void;
  setTouched: (field: keyof T, touched?: boolean) => void;
  setAllTouched: () => void;
  validate: (field?: keyof T) => boolean;
  validateAll: () => boolean;
  reset: (newValues?: Partial<T>) => void;
  handleSubmit: (onSubmit: (values: T) => Promise<void> | void) => Promise<void>;
}

export interface UseFormValidationOptions<T> {
  // Validation schema
  schema?: z.ZodSchema<T>;
  
  // Initial values
  initialValues: T;
  
  // Validation options
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  validateOnSubmit?: boolean;
  
  // Custom validation functions
  customValidators?: {
    [K in keyof T]?: (value: T[K], allValues: T) => string | null;
  };
  
  // Field dependencies (validate field when these change)
  fieldDependencies?: {
    [K in keyof T]?: (keyof T)[];
  };
  
  // Transform values before validation/submission
  transformValues?: (values: T) => T;
  
  // Callbacks
  onSubmit?: (values: T) => Promise<void> | void;
  onValidationError?: (errors: Record<string, string>) => void;
}

export function useFormValidation<T extends Record<string, unknown>>(
  options: UseFormValidationOptions<T>
): [FormState<T>, FormActions<T>] {
  const {
    schema,
    initialValues,
    validateOnChange = false,
    validateOnBlur = true,
    validateOnSubmit = true,
    customValidators = {},
    fieldDependencies = {},
    transformValues,
    onSubmit,
    onValidationError
  } = options;

  // State
  const [state, setState] = useState<FormState<T>>({
    values: { ...initialValues },
    errors: {},
    touched: {},
    isValid: true,
    isSubmitting: false,
    isDirty: false,
    submitCount: 0
  });

  // Validation function
  const validateField = useCallback((
    field: keyof T,
    value: unknown,
    allValues: T
  ): string | null => {
    // Custom validator first
    const customValidator = customValidators[field];
    if (customValidator) {
      const error = customValidator(value as T[typeof field], allValues);
      if (error) return error;
    }

    // Schema validation
    if (schema) {
      try {
        // Validate the entire object but only return error for specific field
        const result = schema.safeParse(allValues);
        if (!result.success) {
          const fieldError = result.error.issues.find(issue => 
            issue.path.length === 1 && issue.path[0] === field
          );
          if (fieldError) {
            return fieldError.message;
          }
        }
      } catch (error) {
        console.warn('Schema validation error:', error);
      }
    }

    return null;
  }, [schema, customValidators]);

  // Validate multiple fields
  const validateFields = useCallback((
    fields: (keyof T)[],
    values: T
  ): Record<string, string> => {
    const errors: Record<string, string> = {};

    fields.forEach(field => {
      const error = validateField(field, values[field], values);
      if (error) {
        errors[field as string] = error;
      }
    });

    return errors;
  }, [validateField]);

  // Actions
  const actions: FormActions<T> = useMemo(() => ({
    setValue: (field: keyof T, value: unknown) => {
      setState(prev => {
        const newValues = { ...prev.values, [field]: value };
        const newErrors = { ...prev.errors };
        
        // Check if value changed
        const isDifferent = prev.values[field] !== value;
        const isDirty = prev.isDirty || isDifferent;

        // Validate on change if enabled
        if (validateOnChange && isDifferent) {
          const error = validateField(field, value, newValues);
          if (error) {
            newErrors[field as string] = error;
          } else {
            delete newErrors[field as string];
          }

          // Validate dependent fields
          const dependentFields = fieldDependencies[field] || [];
          const dependentErrors = validateFields(dependentFields, newValues);
          Object.assign(newErrors, dependentErrors);
        }

        return {
          ...prev,
          values: newValues,
          errors: newErrors,
          isDirty,
          isValid: Object.keys(newErrors).length === 0
        };
      });
    },

    setValues: (values: Partial<T>) => {
      setState(prev => {
        const newValues = { ...prev.values, ...values };
        let newErrors = { ...prev.errors };

        if (validateOnChange) {
          // Validate changed fields
          const changedFields = Object.keys(values) as (keyof T)[];
          const validationErrors = validateFields(changedFields, newValues);
          
          // Clear old errors for changed fields and set new ones
          changedFields.forEach(field => {
            delete newErrors[field as string];
          });
          newErrors = { ...newErrors, ...validationErrors };
        }

        return {
          ...prev,
          values: newValues,
          errors: newErrors,
          isDirty: true,
          isValid: Object.keys(newErrors).length === 0
        };
      });
    },

    setError: (field: keyof T, message: string) => {
      setState(prev => ({
        ...prev,
        errors: { ...prev.errors, [field as string]: message },
        isValid: false
      }));
    },

    clearError: (field: keyof T) => {
      setState(prev => {
        const newErrors = { ...prev.errors };
        delete newErrors[field as string];
        
        return {
          ...prev,
          errors: newErrors,
          isValid: Object.keys(newErrors).length === 0
        };
      });
    },

    clearErrors: () => {
      setState(prev => ({
        ...prev,
        errors: {},
        isValid: true
      }));
    },

    setTouched: (field: keyof T, touched = true) => {
      setState(prev => {
        const newTouched = { ...prev.touched, [field as string]: touched };
        const newErrors = { ...prev.errors };

        // Validate on blur if enabled and field is being touched
        if (validateOnBlur && touched && !prev.touched[field as string]) {
          const error = validateField(field, prev.values[field], prev.values);
          if (error) {
            newErrors[field as string] = error;
          }
        }

        return {
          ...prev,
          touched: newTouched,
          errors: newErrors,
          isValid: Object.keys(newErrors).length === 0
        };
      });
    },

    setAllTouched: () => {
      setState(prev => {
        const newTouched: Record<string, boolean> = {};
        Object.keys(prev.values).forEach(key => {
          newTouched[key] = true;
        });

        const baseErrors = { ...prev.errors };
        let newErrors = baseErrors;

        // Validate all fields if validate on blur is enabled
        if (validateOnBlur) {
          const allFields = Object.keys(prev.values) as (keyof T)[];
          const validationErrors = validateFields(allFields, prev.values);
          newErrors = { ...baseErrors, ...validationErrors };
        }

        return {
          ...prev,
          touched: newTouched,
          errors: newErrors,
          isValid: Object.keys(newErrors).length === 0
        };
      });
    },

    validate: (field?: keyof T) => {
      if (field) {
        // Validate single field
        setState(prev => {
          const error = validateField(field, prev.values[field], prev.values);
          const newErrors = { ...prev.errors };
          
          if (error) {
            newErrors[field as string] = error;
          } else {
            delete newErrors[field as string];
          }

          const isValid = Object.keys(newErrors).length === 0;
          
          return {
            ...prev,
            errors: newErrors,
            isValid
          };
        });

        return !state.errors[field as string];
      } else {
        // Validate all fields
        return actions.validateAll();
      }
    },

    validateAll: () => {
      let isValid = true;

      setState(prev => {
        const allFields = Object.keys(prev.values) as (keyof T)[];
        const validationErrors = validateFields(allFields, prev.values);
        
        isValid = Object.keys(validationErrors).length === 0;

        if (!isValid && onValidationError) {
          onValidationError(validationErrors);
        }

        return {
          ...prev,
          errors: validationErrors,
          isValid
        };
      });

      return isValid;
    },

    reset: (newValues?: Partial<T>) => {
      const resetValues = newValues ? { ...initialValues, ...newValues } : initialValues;
      
      setState({
        values: resetValues,
        errors: {},
        touched: {},
        isValid: true,
        isSubmitting: false,
        isDirty: false,
        submitCount: 0
      });
    },

    handleSubmit: async (onSubmitFn?: (values: T) => Promise<void> | void) => {
      setState(prev => ({ ...prev, isSubmitting: true, submitCount: prev.submitCount + 1 }));

      try {
        // Validate on submit if enabled
        if (validateOnSubmit) {
          const isValid = actions.validateAll();
          if (!isValid) {
            setState(prev => ({ ...prev, isSubmitting: false }));
            return;
          }
        }

        // Transform values if needed
        const submitValues = transformValues ? transformValues(state.values) : state.values;

        // Call submit function
        const submitFn = onSubmitFn || onSubmit;
        if (submitFn) {
          await submitFn(submitValues);
        }

        setState(prev => ({ ...prev, isSubmitting: false }));
      } catch (error) {
        setState(prev => ({ ...prev, isSubmitting: false }));
        
        // Handle validation errors from server
        if (error && typeof error === 'object' && 'field' in error) {
          const validationError = error as ValidationError;
          actions.setError(validationError.field as keyof T, validationError.message);
        }
        
        throw error;
      }
    }
  }), [
    validateOnChange,
    validateOnBlur,
    validateOnSubmit,
    validateField,
    validateFields,
    fieldDependencies,
    transformValues,
    onSubmit,
    onValidationError,
    initialValues,
    state.values,
    state.errors
  ]);

  return [state, actions];
}

// Helper hook for simple form validation without complex features
export function useSimpleFormValidation<T extends Record<string, unknown>>(
  initialValues: T,
  schema?: z.ZodSchema<T>
): [FormState<T>, FormActions<T>] {
  return useFormValidation({
    initialValues,
    schema,
    validateOnBlur: true,
    validateOnSubmit: true
  });
}

// Helper function to create field props for form inputs
export function createFieldProps<T extends Record<string, unknown>>(
  field: keyof T,
  formState: FormState<T>,
  formActions: FormActions<T>
) {
  return {
    value: formState.values[field],
    onChange: (value: unknown) => formActions.setValue(field, value),
    onBlur: () => formActions.setTouched(field),
    error: formState.errors[field as string],
    touched: formState.touched[field as string]
  };
}