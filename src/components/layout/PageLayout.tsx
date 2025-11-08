import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  MoreHorizontal, 
  Loader2,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';

export interface PageAction {
  id: string;
  label: string;
  icon?: React.ElementType;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
  disabled?: boolean;
  loading?: boolean;
}

export interface PageBreadcrumb {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface PageLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  
  // Header elements
  breadcrumbs?: PageBreadcrumb[];
  actions?: PageAction[];
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  
  // Navigation
  showBack?: boolean;
  onBack?: () => void;
  backLabel?: string;
  
  // Layout options
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
  padding?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  
  // Status indicators
  loading?: boolean;
  error?: string;
  success?: string;
  info?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  description,
  children,
  
  breadcrumbs = [],
  actions = [],
  badge,
  
  showBack = false,
  onBack,
  backLabel = 'Quay lại',
  
  maxWidth = '7xl',
  padding = true,
  className,
  headerClassName,
  contentClassName,
  
  loading = false,
  error,
  success,
  info
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full'
  };

  const renderStatusMessage = () => {
    if (error) {
      return (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      );
    }

    if (success) {
      return (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-sm text-green-700">{success}</span>
        </div>
      );
    }

    if (info) {
      return (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center space-x-2">
          <Info className="h-4 w-4 text-blue-500" />
          <span className="text-sm text-blue-700">{info}</span>
        </div>
      );
    }

    return null;
  };

  const renderBreadcrumbs = () => {
    if (breadcrumbs.length === 0) return null;

    return (
      <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-2">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            {index > 0 && <span>/</span>}
            {crumb.href || crumb.onClick ? (
              <button
                onClick={crumb.onClick}
                className="hover:text-foreground transition-colors"
              >
                {crumb.label}
              </button>
            ) : (
              <span className="text-foreground">{crumb.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>
    );
  };

  const renderActions = () => {
    if (actions.length === 0) return null;

    const primaryActions = actions.slice(0, 2);
    const moreActions = actions.slice(2);

    return (
      <div className="flex items-center space-x-2">
        {primaryActions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              variant={action.variant || 'default'}
              size={action.size || 'default'}
              onClick={action.onClick}
              disabled={action.disabled || action.loading}
            >
              {action.loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : Icon ? (
                <Icon className="h-4 w-4 mr-2" />
              ) : null}
              {action.label}
            </Button>
          );
        })}
        
        {moreActions.length > 0 && (
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className={cn(
      'min-h-screen bg-background',
      className
    )}>
      <div className={cn(
        'mx-auto',
        maxWidthClasses[maxWidth],
        padding && 'px-4 sm:px-6 lg:px-8 py-6'
      )}>
        {/* Header */}
        <div className={cn(
          'mb-6',
          headerClassName
        )}>
          {/* Back navigation */}
          {showBack && (
            <div className="mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {backLabel}
              </Button>
            </div>
          )}

          {/* Breadcrumbs */}
          {renderBreadcrumbs()}

          {/* Title section */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {title}
                </h1>
                {badge && (
                  <Badge variant={badge.variant || 'secondary'}>
                    {badge.text}
                  </Badge>
                )}
                {loading && (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                )}
              </div>
              {description && (
                <p className="text-muted-foreground max-w-2xl">
                  {description}
                </p>
              )}
            </div>

            {/* Actions */}
            {renderActions()}
          </div>

          <Separator className="mt-4" />
        </div>

        {/* Status messages */}
        {renderStatusMessage()}

        {/* Content */}
        <div className={cn(
          'min-h-[400px]',
          contentClassName
        )}>
          {children}
        </div>
      </div>
    </div>
  );
};