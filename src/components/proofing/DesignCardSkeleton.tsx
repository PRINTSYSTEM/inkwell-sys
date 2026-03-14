import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function DesignCardSkeleton() {
  return (
    <Card className="relative">
      <div className="absolute top-1 right-1 bg-gray-600 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm z-[100] font-mono pointer-events-none opacity-80">
        DesignCardSkeleton.tsx
      </div>
      <Skeleton className="aspect-square rounded-t-lg" />
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
  );
}
