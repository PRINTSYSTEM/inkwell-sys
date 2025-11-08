import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Users, 
  FileText, 
  Settings, 
  Download,
  Upload,
  Search,
  Filter,
  Calendar,
  Mail,
  Phone,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal
} from 'lucide-react';

export interface QuickAction {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  disabled?: boolean;
  loading?: boolean;
}

interface QuickActionsWidgetProps {
  title?: string;
  description?: string;
  actions: QuickAction[];
  columns?: number;
  showDescriptions?: boolean;
  className?: string;
}

export const QuickActionsWidget: React.FC<QuickActionsWidgetProps> = ({
  title = 'Thao tác nhanh',
  description = 'Các chức năng thường dùng',
  actions,
  columns = 2,
  showDescriptions = true,
  className
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4'
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className={`grid gap-3 ${gridCols[columns as keyof typeof gridCols]}`}>
          {actions.map((action) => {
            const Icon = action.icon;
            
            return (
              <Button
                key={action.id}
                variant={action.variant || 'outline'}
                size={action.size || 'default'}
                onClick={action.onClick}
                disabled={action.disabled || action.loading}
                className="flex items-center justify-start space-x-2 h-auto p-4"
              >
                <div className="flex items-center space-x-2 flex-1">
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <div className="flex-1 text-left">
                    <div className="font-medium">{action.label}</div>
                    {showDescriptions && action.description && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {action.description}
                      </div>
                    )}
                  </div>
                  {action.badge && (
                    <Badge 
                      variant={action.badge.variant || 'secondary'}
                      className="ml-2"
                    >
                      {action.badge.text}
                    </Badge>
                  )}
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};