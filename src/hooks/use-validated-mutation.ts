import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { z, ZodSchema } from "zod";
import { validateSchema, formatValidationErrorsFlat } from "@/Schema";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook to wrap a mutation with schema validation
 * @param mutation Original mutation hook result
 * @param schema Zod schema to validate against
 * @param options Configuration options
 */
export function useValidatedMutation<
  TData,
  TError,
  TVariables,
  TContext = unknown
>(
  mutation: UseMutationResult<TData, TError, TVariables, TContext>,
  schema: ZodSchema<TVariables> | null,
  options?: {
    validateBeforeMutate?: boolean;
    showValidationErrors?: boolean;
  }
) {
  const { toast } = useToast();
  const { validateBeforeMutate = true, showValidationErrors = true } =
    options ?? {};

  const validatedMutate = async (variables: TVariables) => {
    // Validate if schema is provided and validation is enabled
    if (schema && validateBeforeMutate) {
      const result = validateSchema(schema, variables);
      if (!result.success) {
        const formattedErrors = formatValidationErrorsFlat(result.errors);
        const errorMessages = Object.values(formattedErrors);

        if (showValidationErrors) {
          toast({
            title: "Dữ liệu không hợp lệ",
            description:
              errorMessages.length > 0
                ? errorMessages[0]
                : "Vui lòng kiểm tra lại thông tin",
            variant: "destructive",
          });
        }

        // Throw validation error
        throw new Error(
          `Validation failed: ${errorMessages.join(", ")}`
        ) as TError;
      }

      // Use validated data
      return mutation.mutateAsync(result.data);
    }

    // No validation, use original mutation
    return mutation.mutateAsync(variables);
  };

  return {
    ...mutation,
    mutateAsync: validatedMutate,
    mutate: (variables: TVariables) => {
      if (schema && validateBeforeMutate) {
        const result = validateSchema(schema, variables);
        if (!result.success) {
          const formattedErrors = formatValidationErrorsFlat(result.errors);
          const errorMessages = Object.values(formattedErrors);

          if (showValidationErrors) {
            toast({
              title: "Dữ liệu không hợp lệ",
              description:
                errorMessages.length > 0
                  ? errorMessages[0]
                  : "Vui lòng kiểm tra lại thông tin",
              variant: "destructive",
            });
          }
          return;
        }
        mutation.mutate(result.data);
      } else {
        mutation.mutate(variables);
      }
    },
  };
}
