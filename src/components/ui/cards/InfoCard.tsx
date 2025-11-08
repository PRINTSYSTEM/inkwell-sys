import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LucideIcon } from 'lucide-react';

export interface InfoField {
  label: string;
  value: string | number | React.ReactNode;
  icon?: LucideIcon;
  type?: 'text' | 'badge' | 'avatar' | 'custom';
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  copyable?: boolean;
}

export interface InfoCardProps {
  title: string;
  subtitle?: string;
  avatar?: {
    src?: string;
    fallback: string;
    name?: string;
  };
  fields: InfoField[];
  layout?: 'vertical' | 'horizontal' | 'grid';
  columns?: 1 | 2 | 3;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost' | 'destructive';
    icon?: LucideIcon;
  }>;
  status?: {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  className?: string;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  subtitle,
  avatar,
  fields,
  layout = 'vertical',
  columns = 2,
  actions,
  status,
  className
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2', 
    3: 'grid-cols-3'
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderField = (field: InfoField) => {
    switch (field.type) {
      case 'badge':
        return (
          <Badge variant={field.badgeVariant || 'default'}>
            {field.value as string}
          </Badge>
        );
      case 'avatar':
        if (typeof field.value === 'object' && field.value !== null && 'fallback' in field.value) {
          const avatarData = field.value as { src?: string; fallback: string; name?: string };
          return (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={avatarData.src} />
                <AvatarFallback className="text-xs">{avatarData.fallback}</AvatarFallback>
              </Avatar>
              {avatarData.name && <span className="text-sm">{avatarData.name}</span>}
            </div>
          );
        }
        return <span className="text-sm">Invalid avatar data</span>;
      case 'custom':
        return field.value as React.ReactNode;
      default:
        return (
          <span className="text-sm font-medium">
            {field.value as string | number}
          </span>
        );
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {avatar && (
              <Avatar className="h-12 w-12">
                <AvatarImage src={avatar.src} />
                <AvatarFallback>{avatar.fallback}</AvatarFallback>
              </Avatar>
            )}
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{title}</CardTitle>
                {status && (
                  <Badge variant={status.variant}>
                    {status.label}
                  </Badge>
                )}
              </div>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
              )}
              {avatar?.name && (
                <p className="text-sm text-muted-foreground">{avatar.name}</p>
              )}
            </div>
          </div>
          {actions && actions.length > 0 && (
            <div className="flex gap-2">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'outline'}
                  size="sm"
                  onClick={action.onClick}
                  className="flex items-center gap-2"
                >
                  {action.icon && <action.icon className="h-4 w-4" />}
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={
            layout === 'grid'
              ? `grid ${gridCols[columns]} gap-4`
              : layout === 'horizontal'
              ? 'flex flex-wrap gap-4'
              : 'space-y-4'
          }
        >
          {fields.map((field, index) => (
            <div
              key={index}
              className={
                layout === 'horizontal'
                  ? 'flex items-center gap-2'
                  : 'flex flex-col space-y-1'
              }
            >
              <div className="flex items-center gap-2">
                {field.icon && (
                  <field.icon className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">
                  {field.label}:
                </span>
              </div>
              <div className="flex items-center gap-2">
                {renderField(field)}
                {field.copyable && typeof field.value === 'string' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(field.value as string)}
                    className="h-6 w-6 p-0"
                  >
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};