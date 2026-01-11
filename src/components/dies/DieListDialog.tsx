import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Search,
  Package,
  Eye,
  Hash,
  User,
  Building2,
  Copy,
  Check,
} from "lucide-react";
import { useDebounce } from "use-debounce";
import { useSearchDies } from "@/hooks/use-die";
import { formatDieSize } from "@/utils/format-die-size";
import type { DieResponse } from "@/Schema";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ImageViewerDialog } from "@/components/design/image-viewer-dialog";
import { toast } from "sonner";

interface DieListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DieListDialog({ open, onOpenChange }: DieListDialogProps) {
  const [designCode, setDesignCode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [copiedDieId, setCopiedDieId] = useState<number | null>(null);

  const [debouncedDesignCode] = useDebounce(designCode, 300);
  const [debouncedCustomerName] = useDebounce(customerName, 300);

  // Search dies with design code and customer name
  // Hook uses 'q' parameter internally for general search, combining designName and customerName
  const searchParams = useMemo(() => {
    if (!open) return undefined;
    const hasSearch =
      debouncedDesignCode.trim() || debouncedCustomerName.trim();
    if (!hasSearch) return undefined;

    return {
      designName: debouncedDesignCode.trim() || undefined,
      customerName: debouncedCustomerName.trim() || undefined,
      isUsable: true,
      pageSize: 100,
    };
  }, [open, debouncedDesignCode, debouncedCustomerName]);

  const {
    data: searchData,
    isLoading: isLoadingDies,
    error: searchError,
  } = useSearchDies(searchParams);

  const dies = searchData?.items || [];
  const totalCount = searchData?.total ?? 0;

  const handleClearSearch = () => {
    setDesignCode("");
    setCustomerName("");
  };

  const handleCopyDieCode = async (dieCode: string, dieId: number) => {
    try {
      await navigator.clipboard.writeText(dieCode);
      setCopiedDieId(dieId);
      toast.success("Đã sao chép mã khuôn", {
        description: `Mã khuôn "${dieCode}" đã được sao chép vào clipboard`,
      });
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedDieId(null);
      }, 2000);
    } catch (error) {
      toast.error("Không thể sao chép mã khuôn", {
        description: "Đã xảy ra lỗi khi sao chép vào clipboard",
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Package className="h-5 w-5" />
              </div>
              Danh sách khuôn bế
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Tìm kiếm khuôn bế theo mã thiết kế hoặc tên khách hàng
            </DialogDescription>
          </DialogHeader>

          {/* Search Section */}
          <div className="shrink-0 space-y-4 pb-4 border-b">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Design Code Search */}
              <div className="space-y-2">
                <Label
                  htmlFor="design-code-search"
                  className="text-sm font-medium"
                >
                  Mã thiết kế
                </Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="design-code-search"
                    placeholder="Nhập mã thiết kế..."
                    value={designCode}
                    onChange={(e) => setDesignCode(e.target.value)}
                    className="pl-9 h-10 text-sm transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/20"
                  />
                </div>
              </div>

              {/* Customer Name Search */}
              <div className="space-y-2">
                <Label
                  htmlFor="customer-name-search"
                  className="text-sm font-medium"
                >
                  Tên khách hàng
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="customer-name-search"
                    placeholder="Nhập tên khách hàng..."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="pl-9 h-10 text-sm transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            {/* Search Actions */}
            {(designCode.trim() || customerName.trim()) && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {isLoadingDies ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Đang tìm kiếm...
                    </span>
                  ) : searchError ? (
                    <span className="text-destructive">
                      Đã xảy ra lỗi khi tìm kiếm
                    </span>
                  ) : totalCount > 0 ? (
                    <>
                      Tìm thấy{" "}
                      <span className="font-semibold text-foreground">
                        {totalCount}
                      </span>{" "}
                      khuôn bế
                    </>
                  ) : (
                    "Không tìm thấy khuôn bế nào"
                  )}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSearch}
                  className="h-8 text-xs"
                >
                  Xóa bộ lọc
                </Button>
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="flex-1 min-h-0 flex flex-col">
            {!designCode.trim() && !customerName.trim() ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  Nhập thông tin để tìm kiếm
                </p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Vui lòng nhập mã thiết kế hoặc tên khách hàng để tìm kiếm
                  khuôn bế
                </p>
              </div>
            ) : isLoadingDies ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                <p className="text-sm font-medium text-foreground">
                  Đang tải danh sách khuôn bế...
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Vui lòng đợi trong giây lát
                </p>
              </div>
            ) : searchError ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
                  <Package className="h-8 w-8" />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  Đã xảy ra lỗi
                </p>
                <p className="text-xs text-muted-foreground">
                  Không thể tải danh sách khuôn bế. Vui lòng thử lại sau.
                </p>
              </div>
            ) : dies.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  Không tìm thấy khuôn bế
                </p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Không có khuôn bế nào phù hợp với tiêu chí tìm kiếm của bạn
                </p>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="space-y-3 pr-4">
                  {dies.map((die: DieResponse) => (
                    <div
                      key={die.id}
                      className="group rounded-lg border border-border/60 bg-card p-4 transition-all duration-200 hover:border-primary/50 hover:shadow-md cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        {/* Die Image */}
                        <div
                          className="relative w-20 h-20 rounded-lg border bg-muted overflow-hidden shrink-0 cursor-pointer group/image"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (die.imageUrl) {
                              setViewingImageUrl(die.imageUrl);
                              setImageViewerOpen(true);
                            }
                          }}
                        >
                          {die.imageUrl ? (
                            <>
                              <img
                                src={die.imageUrl}
                                alt={die.code || `Die ${die.id}`}
                                className="w-full h-full object-contain"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-colors flex items-center justify-center">
                                <Eye className="h-4 w-4 text-white opacity-0 group-hover/image:opacity-100 transition-opacity" />
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Die Info */}
                        <div className="flex-1 min-w-0 space-y-2">
                          {/* Header: Code & Name */}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-base text-foreground font-mono">
                                {die.code || `Khuôn #${die.id}`}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-primary/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyDieCode(
                                    die.code || `Khuôn #${die.id}`,
                                    die.id
                                  );
                                }}
                                title="Sao chép mã khuôn"
                              >
                                {copiedDieId === die.id ? (
                                  <Check className="h-3.5 w-3.5 text-green-600" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                              </Button>
                              {die.isUsable ? (
                                <Badge
                                  variant="secondary"
                                  className="bg-green-100 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800 text-xs font-semibold"
                                >
                                  Sẵn sàng
                                </Badge>
                              ) : (
                                <Badge
                                  variant="secondary"
                                  className="bg-red-100 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800 text-xs font-semibold"
                                >
                                  Không dùng được
                                </Badge>
                              )}
                            </div>
                            {die.name && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {die.name}
                              </p>
                            )}
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1.5 text-xs">
                            {/* Size */}
                            {die && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-muted-foreground whitespace-nowrap">
                                  Kích thước:
                                </span>
                                <span className="font-medium text-foreground">
                                  {formatDieSize(die)}
                                </span>
                              </div>
                            )}

                            {/* Type */}
                            {die.type && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-muted-foreground whitespace-nowrap">
                                  Loại:
                                </span>
                                <span className="font-medium text-foreground truncate">
                                  {die.type}
                                </span>
                              </div>
                            )}

                            {/* Vendor */}
                            {die.vendorName && (
                              <div className="flex items-center gap-1.5">
                                <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="text-muted-foreground whitespace-nowrap">
                                  NCC:
                                </span>
                                <span className="font-medium text-foreground truncate">
                                  {die.vendorName}
                                </span>
                              </div>
                            )}

                            {/* Location */}
                            {die.location && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-muted-foreground whitespace-nowrap">
                                  Vị trí:
                                </span>
                                <span className="font-medium text-foreground">
                                  {die.location}
                                </span>
                              </div>
                            )}

                            {/* Price */}
                            {die.price != null && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-muted-foreground whitespace-nowrap">
                                  Giá:
                                </span>
                                <span className="font-medium text-foreground">
                                  {die.price.toLocaleString("vi-VN")} đ
                                </span>
                              </div>
                            )}

                            {/* Status - DieResponse has status field, not isReusable */}
                            {die.status && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-muted-foreground whitespace-nowrap">
                                  Trạng thái:
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {die.status}
                                </Badge>
                              </div>
                            )}
                          </div>

                          {/* Notes */}
                          {die.notes && (
                            <div className="pt-2 border-t border-border/60">
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                <span className="font-medium">Ghi chú: </span>
                                {die.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Viewer Dialog */}
      {viewingImageUrl && (
        <ImageViewerDialog
          imageUrl={viewingImageUrl}
          open={imageViewerOpen}
          onOpenChange={(open) => {
            setImageViewerOpen(open);
            if (!open) {
              setViewingImageUrl(null);
            }
          }}
        />
      )}
    </>
  );
}
