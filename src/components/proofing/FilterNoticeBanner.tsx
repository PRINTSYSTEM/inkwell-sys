import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

interface FilterNoticeBannerProps {
  materialTypeName: string;
  onClear: () => void;
}

export function FilterNoticeBanner({
  materialTypeName,
  onClear,
}: FilterNoticeBannerProps) {
  return (
    <Alert className="bg-primary/5 border-primary/20">
      <Search className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between w-full">
        <span>
          Đang hiển thị designs với vật liệu:{' '}
          <strong>{materialTypeName}</strong>
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="gap-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
          Xem tất cả
        </Button>
      </AlertDescription>
    </Alert>
  );
}
