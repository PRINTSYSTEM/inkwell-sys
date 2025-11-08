import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  ChevronDown, 
  ChevronRight, 
  MoreHorizontal,
  Loader2,
  AlertTriangle,
  Info
} from 'lucide-react';

export interface SectionAction {
  id: string;
  label: string;
  icon?: React.ElementType;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
  disabled?: boolean;
}

export interface SectionLayoutProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  
  // Layout variants
  variant?: 'default' | 'card' | 'bordered' | 'minimal';
  
  // Header elements
  actions?: SectionAction[];
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  icon?: React.ElementType;
  
  // Behavior
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  
  // Spacing and styling
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  
  // Status
  loading?: boolean;
  error?: boolean;
  warning?: boolean;
  
  // Callbacks
  onToggle?: (collapsed: boolean) => void;
}

export const SectionLayout: React.FC<SectionLayoutProps> = ({
  title,
  description,
  children,
  
  variant = 'default',
  
  actions = [],
  badge,
  icon: Icon,
  
  collapsible = false,
  defaultCollapsed = false,
  
  spacing = 'md',
  className,
  headerClassName,
  contentClassName,
  
  loading = false,
  error = false,
  warning = false,
  
  onToggle
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  const spacingClasses = {
    none: 'space-y-0',
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6'
  };

  const handleToggle = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onToggle?.(newCollapsed);
  };

  const renderActions = () => {
    if (actions.length === 0) return null;

    const primaryActions = actions.slice(0, 2);
    const moreActions = actions.slice(2);

    return (
      <div className="flex items-center space-x-2">
        {primaryActions.map((action) => {
          const ActionIcon = action.icon;
          return (
            <Button
              key={action.id}
              variant={action.variant || 'outline'}
              size={action.size || 'sm'}
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {ActionIcon && <ActionIcon className="h-3 w-3 mr-1" />}
              {action.label}
            </Button>
          );
        })}
        
        {moreActions.length > 0 && (
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  };

  const renderHeader = () => {
    if (!title && !description && actions.length === 0) return null;

    const headerContent = (
      <div className={cn('flex items-start justify-between', headerClassName)}>
        <div className="flex-1">
          {title && (
            <div className="flex items-center space-x-2 mb-1">
              {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
              
              <h3 className={cn(
                'font-semibold leading-none tracking-tight',
                variant === 'minimal' ? 'text-base' : 'text-lg'
              )}>
                {title}
              </h3>
              
              {badge && (
                <Badge variant={badge.variant || 'secondary'} className="text-xs">
                  {badge.text}
                </Badge>
              )}

              {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
              {error && <AlertTriangle className="h-3 w-3 text-red-500" />}
              {warning && <AlertTriangle className="h-3 w-3 text-orange-500" />}

              {collapsible && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={handleToggle}
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
          )}
          
          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>

        {renderActions()}
      </div>
    );

    if (collapsible) {
      return (
        <button
          onClick={handleToggle}
          className="w-full text-left hover:bg-muted/50 transition-colors rounded-md p-2 -m-2"
        >
          {headerContent}
        </button>
      );
    }

    return headerContent;
  };

  const renderContent = () => {
    if (collapsible && isCollapsed) return null;

    return (
      <div className={cn(
        spacingClasses[spacing],
        contentClassName
      )}>
        {children}
      </div>
    );
  };

  // Card variant
  if (variant === 'card') {
    return (
      <Card className={cn(
        error && 'border-red-200',
        warning && 'border-orange-200',
        className
      )}>
        {(title || description) && (
          <CardHeader className="pb-4">
            {title && (
              <CardTitle className="flex items-center space-x-2">
                {Icon && <Icon className="h-4 w-4" />}
                <span>{title}</span>
                {badge && (
                  <Badge variant={badge.variant || 'secondary'}>
                    {badge.text}
                  </Badge>
                )}
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              </CardTitle>
            )}
            {description && <CardDescription>{description}</CardDescription>}
            {actions.length > 0 && (
              <div className="pt-2">
                {renderActions()}
              </div>
            )}
          </CardHeader>
        )}
        <CardContent className={contentClassName}>
          {children}
        </CardContent>
      </Card>
    );
  }

  // Bordered variant
  if (variant === 'bordered') {
    return (
      <div className={cn(
        'border rounded-lg p-4',
        error && 'border-red-200 bg-red-50',
        warning && 'border-orange-200 bg-orange-50',
        className
      )}>
        {renderHeader()}
        {(title || description) && <Separator className="my-4" />}
        {renderContent()}
      </div>
    );
  }

  // Minimal variant
  if (variant === 'minimal') {
    return (
      <div className={className}>
        {renderHeader()}
        {renderContent()}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn('space-y-4', className)}>
      {renderHeader()}
      {(title || description) && <Separator />}
      {renderContent()}
    </div>
  );
};