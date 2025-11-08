import React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { AlertCircle, HelpCircle, CheckCircle } from 'lucide-react';

export interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  description?: string;
  error?: string;
  success?: string;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  labelClassName?: string;
  helperText?: string;
  showOptional?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  description,
  error,
  success,
  required = false,
  disabled = false,
  loading = false,
  children,
  className,
  labelClassName,
  helperText,
  showOptional = true
}) => {
  const fieldId = htmlFor || `field-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      {label && (
        <Label 
          htmlFor={fieldId}
          className={cn(
            'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
            disabled && 'opacity-50',
            error && 'text-red-600',
            success && 'text-green-600',
            labelClassName
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {!required && showOptional && (
            <span className="text-muted-foreground ml-1 font-normal">(Tùy chọn)</span>
          )}
        </Label>
      )}

      {/* Description */}
      {description && (
        <p className={cn(
          'text-sm text-muted-foreground',
          disabled && 'opacity-50'
        )}>
          {description}
        </p>
      )}

      {/* Input Field */}
      <div className="relative">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              id: fieldId,
              disabled: disabled || loading,
              'aria-invalid': !!error,
              'aria-describedby': error ? `${fieldId}-error` : success ? `${fieldId}-success` : helperText ? `${fieldId}-helper` : undefined,
              className: cn(
                child.props.className,
                error && 'border-red-500 focus-visible:ring-red-500',
                success && 'border-green-500 focus-visible:ring-green-500',
                disabled && 'opacity-50'
              ),
              ...child.props
            });
          }
          return child;
        })}

        {/* Loading indicator */}
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
          </div>
        )}
      </div>

      {/* Helper Text */}
      {helperText && !error && !success && (
        <div className="flex items-start space-x-1">
          <HelpCircle className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p 
            id={`${fieldId}-helper`}
            className={cn(
              'text-xs text-muted-foreground',
              disabled && 'opacity-50'
            )}
          >
            {helperText}
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-start space-x-1">
          <AlertCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
          <p 
            id={`${fieldId}-error`}
            className="text-xs text-red-600"
            role="alert"
          >
            {error}
          </p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-start space-x-1">
          <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
          <p 
            id={`${fieldId}-success`}
            className="text-xs text-green-600"
          >
            {success}
          </p>
        </div>
      )}
    </div>
  );
};