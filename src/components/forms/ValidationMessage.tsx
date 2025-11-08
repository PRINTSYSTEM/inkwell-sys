import React from 'react';
import { cn } from '@/lib/utils';
import { 
  AlertCircle, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  X
} from 'lucide-react';

export interface ValidationMessageProps {
  type: 'error' | 'success' | 'warning' | 'info';
  message: string;
  messages?: string[];
  className?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  showIcon?: boolean;
  compact?: boolean;
}

export const ValidationMessage: React.FC<ValidationMessageProps> = ({
  type,
  message,
  messages = [],
  className,
  dismissible = false,
  onDismiss,
  showIcon = true,
  compact = false
}) => {
  const getIcon = () => {
    switch (type) {
      case 'error':
        return AlertCircle;
      case 'success':
        return CheckCircle;
      case 'warning':
        return AlertTriangle;
      case 'info':
        return Info;
      default:
        return AlertCircle;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'error':
        return {
          container: 'bg-red-50 border-red-200 text-red-700',
          icon: 'text-red-500',
          text: 'text-red-700'
        };
      case 'success':
        return {
          container: 'bg-green-50 border-green-200 text-green-700',
          icon: 'text-green-500',
          text: 'text-green-700'
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200 text-yellow-700',
          icon: 'text-yellow-500',
          text: 'text-yellow-700'
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-700',
          icon: 'text-blue-500',
          text: 'text-blue-700'
        };
      default:
        return {
          container: 'bg-gray-50 border-gray-200 text-gray-700',
          icon: 'text-gray-500',
          text: 'text-gray-700'
        };
    }
  };

  const Icon = getIcon();
  const styles = getStyles();
  const allMessages = message ? [message, ...messages] : messages;

  if (!allMessages.length) return null;

  if (compact) {
    return (
      <div className={cn(
        'flex items-start space-x-1',
        className
      )}>
        {showIcon && (
          <Icon className={cn('h-3 w-3 mt-0.5 flex-shrink-0', styles.icon)} />
        )}
        <div className="space-y-1">
          {allMessages.map((msg, index) => (
            <p key={index} className={cn('text-xs', styles.text)}>
              {msg}
            </p>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'relative rounded-md border p-3',
      styles.container,
      className
    )}>
      <div className="flex items-start space-x-2">
        {showIcon && (
          <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', styles.icon)} />
        )}
        
        <div className="flex-1 space-y-1">
          {allMessages.length === 1 ? (
            <p className={cn('text-sm', styles.text)}>
              {allMessages[0]}
            </p>
          ) : (
            <ul className={cn('text-sm list-disc list-inside space-y-1', styles.text)}>
              {allMessages.map((msg, index) => (
                <li key={index}>{msg}</li>
              ))}
            </ul>
          )}
        </div>

        {dismissible && onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className={cn(
              'flex-shrink-0 rounded-md p-1 hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2',
              type === 'error' && 'focus:ring-red-500',
              type === 'success' && 'focus:ring-green-500',
              type === 'warning' && 'focus:ring-yellow-500',
              type === 'info' && 'focus:ring-blue-500'
            )}
          >
            <X className={cn('h-3 w-3', styles.icon)} />
          </button>
        )}
      </div>
    </div>
  );
};