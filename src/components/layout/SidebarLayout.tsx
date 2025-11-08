import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  X,
  Home,
  User,
  Settings
} from 'lucide-react';

export interface SidebarItem {
  id: string;
  label: string;
  icon?: React.ElementType;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  children?: SidebarItem[];
  disabled?: boolean;
}

export interface SidebarGroup {
  id: string;
  label: string;
  items: SidebarItem[];
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export interface SidebarLayoutProps {
  children: React.ReactNode;
  
  // Sidebar configuration
  items?: SidebarItem[];
  groups?: SidebarGroup[];
  
  // Layout options
  position?: 'left' | 'right';
  variant?: 'default' | 'floating' | 'bordered';
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  
  // Sizing
  width?: 'sm' | 'md' | 'lg' | 'xl';
  collapsedWidth?: 'xs' | 'sm';
  
  // Header/Footer
  header?: React.ReactNode;
  footer?: React.ReactNode;
  
  // Mobile behavior
  overlay?: boolean;
  
  // Styling
  className?: string;
  sidebarClassName?: string;
  contentClassName?: string;
  
  // Callbacks
  onItemClick?: (item: SidebarItem) => void;
  onToggle?: (collapsed: boolean) => void;
}

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({
  children,
  
  items = [],
  groups = [],
  
  position = 'left',
  variant = 'default',
  collapsible = true,
  defaultCollapsed = false,
  
  width = 'md',
  collapsedWidth = 'xs',
  
  header,
  footer,
  
  overlay = false,
  
  className,
  sidebarClassName,
  contentClassName,
  
  onItemClick,
  onToggle
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const widthClasses = {
    sm: 'w-48',
    md: 'w-64',
    lg: 'w-80',
    xl: 'w-96'
  };

  const collapsedWidthClasses = {
    xs: 'w-12',
    sm: 'w-16'
  };

  const handleToggle = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onToggle?.(newCollapsed);
  };

  const handleItemClick = (item: SidebarItem) => {
    if (item.disabled) return;
    
    if (item.onClick) {
      item.onClick();
    }
    
    onItemClick?.(item);
    
    // Close mobile sidebar after click
    if (overlay) {
      setIsMobileOpen(false);
    }
  };

  const toggleGroup = (groupId: string) => {
    const newCollapsedGroups = new Set(collapsedGroups);
    if (newCollapsedGroups.has(groupId)) {
      newCollapsedGroups.delete(groupId);
    } else {
      newCollapsedGroups.add(groupId);
    }
    setCollapsedGroups(newCollapsedGroups);
  };

  const renderItem = (item: SidebarItem, level: number = 0) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    
    return (
      <div key={item.id}>
        <button
          onClick={() => handleItemClick(item)}
          disabled={item.disabled}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors',
            'hover:bg-muted/50 focus:bg-muted focus:outline-none',
            item.active && 'bg-primary text-primary-foreground',
            item.disabled && 'opacity-50 cursor-not-allowed',
            level > 0 && 'ml-4',
            isCollapsed && !overlay && 'justify-center px-2'
          )}
        >
          <div className="flex items-center space-x-2">
            {Icon && (
              <Icon className={cn(
                'h-4 w-4 flex-shrink-0',
                item.active ? 'text-primary-foreground' : 'text-muted-foreground'
              )} />
            )}
            {(!isCollapsed || overlay) && (
              <span className="truncate">{item.label}</span>
            )}
          </div>
          
          {(!isCollapsed || overlay) && (
            <div className="flex items-center space-x-1">
              {item.badge && (
                <Badge variant={item.badge.variant || 'secondary'} className="text-xs">
                  {item.badge.text}
                </Badge>
              )}
              {hasChildren && (
                <ChevronRight className="h-3 w-3" />
              )}
            </div>
          )}
        </button>
        
        {hasChildren && (!isCollapsed || overlay) && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderGroup = (group: SidebarGroup) => {
    const isGroupCollapsed = collapsedGroups.has(group.id);
    
    return (
      <div key={group.id} className="space-y-2">
        {(!isCollapsed || overlay) && (
          <>
            <button
              onClick={() => group.collapsible && toggleGroup(group.id)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider',
                group.collapsible && 'hover:text-foreground'
              )}
            >
              <span>{group.label}</span>
              {group.collapsible && (
                isGroupCollapsed ? (
                  <ChevronRight className="h-3 w-3" />
                ) : (
                  <ChevronLeft className="h-3 w-3 rotate-90" />
                )
              )}
            </button>
            <Separator />
          </>
        )}
        
        {!isGroupCollapsed && (
          <div className="space-y-1">
            {group.items.map(item => renderItem(item))}
          </div>
        )}
      </div>
    );
  };

  const sidebarContent = (
    <div className={cn(
      'flex flex-col h-full bg-background',
      variant === 'bordered' && 'border-r',
      variant === 'floating' && 'bg-card border rounded-lg shadow-sm m-2',
      sidebarClassName
    )}>
      {/* Header */}
      {header && (
        <div className={cn(
          'flex-shrink-0 p-4',
          variant === 'floating' && 'pt-2'
        )}>
          {header}
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-4 py-2">
          {/* Direct items */}
          {items.length > 0 && (
            <div className="space-y-1">
              {items.map(item => renderItem(item))}
            </div>
          )}

          {/* Grouped items */}
          {groups.map(group => renderGroup(group))}
        </div>
      </ScrollArea>

      {/* Toggle button */}
      {collapsible && !overlay && (
        <div className="flex-shrink-0 p-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggle}
            className="w-full justify-center"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      {/* Footer */}
      {footer && (!isCollapsed || overlay) && (
        <div className="flex-shrink-0 p-4 border-t">
          {footer}
        </div>
      )}
    </div>
  );

  // Mobile overlay sidebar
  if (overlay) {
    return (
      <div className={cn('flex h-screen', className)}>
        {/* Mobile menu button */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
          >
            {isMobileOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Overlay */}
        {isMobileOpen && (
          <div 
            className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={cn(
          'fixed lg:static inset-y-0 z-50 flex-shrink-0 transition-transform lg:translate-x-0',
          widthClasses[width],
          position === 'left' ? 'left-0' : 'right-0',
          isMobileOpen ? 'translate-x-0' : position === 'left' ? '-translate-x-full' : 'translate-x-full'
        )}>
          {sidebarContent}
        </div>

        {/* Main content */}
        <main className={cn('flex-1 overflow-hidden', contentClassName)}>
          {children}
        </main>
      </div>
    );
  }

  // Desktop sidebar
  return (
    <div className={cn('flex h-screen', className)}>
      {position === 'left' && (
        <div className={cn(
          'flex-shrink-0 transition-all duration-300',
          isCollapsed ? collapsedWidthClasses[collapsedWidth] : widthClasses[width]
        )}>
          {sidebarContent}
        </div>
      )}

      <main className={cn('flex-1 overflow-hidden', contentClassName)}>
        {children}
      </main>

      {position === 'right' && (
        <div className={cn(
          'flex-shrink-0 transition-all duration-300',
          isCollapsed ? collapsedWidthClasses[collapsedWidth] : widthClasses[width]
        )}>
          {sidebarContent}
        </div>
      )}
    </div>
  );
};