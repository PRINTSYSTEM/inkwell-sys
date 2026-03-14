import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface FilterNoticeBannerProps {
  materialTypeName: string;
  onClear: () => void;
}

export function FilterNoticeBanner({
  materialTypeName,
  onClear,
}: FilterNoticeBannerProps) {
  return (
    <Alert className="bg-primary/5 border-primary/20 relative">
      <div className="absolute -top-2 right-1 bg-pink-600 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm z-[100] font-mono pointer-events-none opacity-80">
        FilterNoticeBanner.tsx
      </div>
      <Search className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between w-full">
        <span>
          Đang hiển thị thiết kế với Chất liệu:{" "}
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
