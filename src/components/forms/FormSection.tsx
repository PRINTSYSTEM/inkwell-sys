import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  variant?: 'default' | 'card' | 'inline';
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  required?: boolean;
  icon?: React.ElementType;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  info?: string;
  showSeparator?: boolean;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  variant = 'default',
  collapsible = false,
  defaultCollapsed = false,
  required = false,
  icon: Icon,
  className,
  contentClassName,
  headerClassName,
  info,
  showSeparator = true
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  const renderHeader = () => {
    if (!title && !description) return null;

    const headerContent = (
      <div className={cn('space-y-1', headerClassName)}>
        {title && (
          <div className="flex items-center space-x-2">
            {Icon && <Icon className="h-4 w-4" />}
            <h3 className={cn(
              'text-lg font-semibold leading-none tracking-tight',
              variant === 'inline' && 'text-base'
            )}>
              {title}
              {required && <span className="text-red-500 ml-1">*</span>}
            </h3>
            {info && (
              <div className="relative group">
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  {info}
                </div>
              </div>
            )}
            {collapsible && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 ml-auto"
                onClick={() => setIsCollapsed(!isCollapsed)}
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
    );

    if (collapsible) {
      return (
        <CollapsibleTrigger asChild>
          <div className="cursor-pointer">
            {headerContent}
          </div>
        </CollapsibleTrigger>
      );
    }

    return headerContent;
  };

  const renderContent = () => {
    const content = (
      <div className={cn('space-y-4', contentClassName)}>
        {children}
      </div>
    );

    if (collapsible) {
      return (
        <CollapsibleContent className="space-y-4">
          {content}
        </CollapsibleContent>
      );
    }

    return content;
  };

  if (variant === 'card') {
    return (
      <Card className={className}>
        {(title || description) && (
          <CardHeader>
            {title && (
              <CardTitle className="flex items-center space-x-2">
                {Icon && <Icon className="h-5 w-5" />}
                <span>{title}</span>
                {required && <span className="text-red-500">*</span>}
                {info && (
                  <div className="relative group">
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {info}
                    </div>
                  </div>
                )}
              </CardTitle>
            )}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent className={contentClassName}>
          {children}
        </CardContent>
      </Card>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn('space-y-3', className)}>
        {renderHeader()}
        {renderContent()}
      </div>
    );
  }

  // Default variant
  if (collapsible) {
    return (
      <Collapsible
        open={!isCollapsed}
        onOpenChange={(open) => setIsCollapsed(!open)}
        className={cn('space-y-4', className)}
      >
        {renderHeader()}
        {showSeparator && (title || description) && <Separator />}
        {renderContent()}
      </Collapsible>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {renderHeader()}
      {showSeparator && (title || description) && <Separator />}
      {renderContent()}
    </div>
  );
};