import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

export interface ContentLayoutProps {
  children: React.ReactNode;
  
  // Grid layout options
  columns?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  
  // Responsive behavior
  responsive?: {
    sm?: 1 | 2 | 3;
    md?: 1 | 2 | 3 | 4;
    lg?: 1 | 2 | 3 | 4 | 6;
    xl?: 1 | 2 | 3 | 4 | 6 | 12;
  };
  
  // Layout variants
  variant?: 'grid' | 'flex' | 'stack' | 'sidebar' | 'split';
  
  // Sidebar layout options (when variant = 'sidebar')
  sidebarPosition?: 'left' | 'right';
  sidebarWidth?: 'sm' | 'md' | 'lg' | 'xl';
  sidebar?: React.ReactNode;
  
  // Split layout options (when variant = 'split')
  splitRatio?: '1:1' | '1:2' | '2:1' | '1:3' | '3:1';
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  
  // Styling
  className?: string;
  contentClassName?: string;
  
  // Behavior
  equalHeight?: boolean;
  centered?: boolean;
  fullHeight?: boolean;
}

export const ContentLayout: React.FC<ContentLayoutProps> = ({
  children,
  
  columns = 1,
  gap = 'md',
  responsive,
  
  variant = 'stack',
  
  sidebarPosition = 'left',
  sidebarWidth = 'md',
  sidebar,
  
  splitRatio = '1:1',
  leftContent,
  rightContent,
  
  className,
  contentClassName,
  
  equalHeight = false,
  centered = false,
  fullHeight = false
}) => {
  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    6: 'grid-cols-6',
    12: 'grid-cols-12'
  };

  const sidebarWidthClasses = {
    sm: 'w-48',
    md: 'w-64',
    lg: 'w-80',
    xl: 'w-96'
  };

  const splitRatioClasses = {
    '1:1': 'grid-cols-2',
    '1:2': 'grid-cols-3',
    '2:1': 'grid-cols-3',
    '1:3': 'grid-cols-4',
    '3:1': 'grid-cols-4'
  };

  const splitItemClasses = {
    '1:1': { left: 'col-span-1', right: 'col-span-1' },
    '1:2': { left: 'col-span-1', right: 'col-span-2' },
    '2:1': { left: 'col-span-2', right: 'col-span-1' },
    '1:3': { left: 'col-span-1', right: 'col-span-3' },
    '3:1': { left: 'col-span-3', right: 'col-span-1' }
  };

  const getResponsiveClasses = () => {
    if (!responsive) return '';
    
    const classes = [];
    if (responsive.sm) classes.push(`sm:grid-cols-${responsive.sm}`);
    if (responsive.md) classes.push(`md:grid-cols-${responsive.md}`);
    if (responsive.lg) classes.push(`lg:grid-cols-${responsive.lg}`);
    if (responsive.xl) classes.push(`xl:grid-cols-${responsive.xl}`);
    
    return classes.join(' ');
  };

  // Grid variant
  if (variant === 'grid') {
    return (
      <div className={cn(
        'grid',
        columnClasses[columns],
        gapClasses[gap],
        responsive ? getResponsiveClasses() : '',
        equalHeight && 'items-stretch',
        centered && 'place-items-center',
        fullHeight && 'min-h-full',
        className
      )}>
        {children}
      </div>
    );
  }

  // Flex variant
  if (variant === 'flex') {
    return (
      <div className={cn(
        'flex',
        gapClasses[gap],
        centered && 'justify-center items-center',
        fullHeight && 'min-h-full',
        className
      )}>
        {children}
      </div>
    );
  }

  // Sidebar variant
  if (variant === 'sidebar') {
    return (
      <div className={cn(
        'flex',
        gapClasses[gap],
        fullHeight && 'min-h-full',
        className
      )}>
        {sidebarPosition === 'left' && sidebar && (
          <aside className={cn(
            'flex-shrink-0',
            sidebarWidthClasses[sidebarWidth]
          )}>
            {sidebar}
          </aside>
        )}
        
        <main className={cn(
          'flex-1 min-w-0',
          contentClassName
        )}>
          {children}
        </main>
        
        {sidebarPosition === 'right' && sidebar && (
          <aside className={cn(
            'flex-shrink-0',
            sidebarWidthClasses[sidebarWidth]
          )}>
            {sidebar}
          </aside>
        )}
      </div>
    );
  }

  // Split variant
  if (variant === 'split') {
    return (
      <div className={cn(
        'grid',
        splitRatioClasses[splitRatio],
        gapClasses[gap],
        equalHeight && 'items-stretch',
        fullHeight && 'min-h-full',
        className
      )}>
        <div className={splitItemClasses[splitRatio].left}>
          {leftContent}
        </div>
        <div className={splitItemClasses[splitRatio].right}>
          {rightContent}
        </div>
      </div>
    );
  }

  // Stack variant (default)
  return (
    <div className={cn(
      'space-y-4',
      gap === 'none' && 'space-y-0',
      gap === 'sm' && 'space-y-2',
      gap === 'md' && 'space-y-4',
      gap === 'lg' && 'space-y-6',
      gap === 'xl' && 'space-y-8',
      centered && 'flex flex-col items-center',
      fullHeight && 'min-h-full',
      className
    )}>
      {children}
    </div>
  );
};

// Helper component cho grid items
export interface GridItemProps {
  children: React.ReactNode;
  span?: 1 | 2 | 3 | 4 | 6 | 12;
  offset?: 1 | 2 | 3 | 4 | 6;
  className?: string;
  card?: boolean;
}

export const GridItem: React.FC<GridItemProps> = ({
  children,
  span = 1,
  offset = 0,
  className,
  card = false
}) => {
  const spanClasses = {
    1: 'col-span-1',
    2: 'col-span-2', 
    3: 'col-span-3',
    4: 'col-span-4',
    6: 'col-span-6',
    12: 'col-span-12'
  };

  const offsetClasses = {
    0: '',
    1: 'col-start-2',
    2: 'col-start-3',
    3: 'col-start-4',
    4: 'col-start-5',
    6: 'col-start-7'
  };

  const content = card ? (
    <Card>
      <CardContent className="p-6">
        {children}
      </CardContent>
    </Card>
  ) : children;

  return (
    <div className={cn(
      spanClasses[span],
      offsetClasses[offset],
      className
    )}>
      {content}
    </div>
  );
};