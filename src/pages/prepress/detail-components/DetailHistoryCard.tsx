import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  History,
  Plus,
  Trash2,
  Edit,
  Loader2,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { useProofingOrderHistory } from "@/hooks/use-proofing-order";

interface DetailHistoryCardProps {
  proofingOrderId: number;
}

const formatHistoryDate = (dateStr?: string | null) => {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "dd/MM/yyyy HH:mm");
  } catch (e) {
    return dateStr;
  }
};

const getActionBadge = (action: string, displayName?: string | null) => {
  const text = displayName || action;
  switch (action) {
    case "added":
      return (
        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 flex items-center gap-1 w-fit text-xs font-semibold px-2 py-0.5"
        >
          <Plus className="h-3 w-3 shrink-0" />
          {text}
        </Badge>
      );
    case "removed":
      return (
        <Badge
          variant="outline"
          className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800 flex items-center gap-1 w-fit text-xs font-semibold px-2 py-0.5"
        >
          <Trash2 className="h-3 w-3 shrink-0" />
          {text}
        </Badge>
      );
    case "quantity_updated":
      return (
        <Badge
          variant="outline"
          className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800 flex items-center gap-1 w-fit text-xs font-semibold px-2 py-0.5"
        >
          <Edit className="h-3 w-3 shrink-0" />
          {text}
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="w-fit text-xs px-2 py-0.5">
          {text}
        </Badge>
      );
  }
};

const formatSideLabel = (side?: string | null) => {
  if (!side) return null;
  if (side === "both") return "2 mặt";
  if (side === "front") return "Mặt trước";
  if (side === "back") return "Mặt sau";
  return side;
};

export function DetailHistoryCard({ proofingOrderId }: DetailHistoryCardProps) {
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 15;

  const { data, isLoading, error } = useProofingOrderHistory(proofingOrderId, {
    pageNumber,
    pageSize,
    sortColumn: "createdAt",
    sortOrder: "desc",
  });

  const historyItems = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.totalItems ?? 0;

  return (
    <Card className="relative flex flex-col min-h-[400px]">
      <CardHeader className="pb-3 px-6 shrink-0 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            Lịch sử thao tác bài bình ({totalItems})
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            Mới nhất xếp trước
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col min-h-0">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm font-medium">Đang tải lịch sử bài bình...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 gap-2 text-destructive">
            <AlertCircle className="h-8 w-8" />
            <p className="text-sm font-medium">Không thể tải dữ liệu lịch sử</p>
          </div>
        ) : historyItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <History className="h-10 w-10 text-muted-foreground/30 mb-2" />
            <p className="text-sm font-semibold text-foreground">Chưa có lịch sử thao tác</p>
            <p className="text-xs max-w-sm text-muted-foreground mt-1">
              Các thao tác thêm, xóa hoặc cập nhật số lượng thiết kế sẽ được lưu vết đầy đủ tại đây.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="h-10 bg-muted/30">
                  <TableHead className="w-12 text-center text-xs">STT</TableHead>
                  <TableHead className="w-36 text-xs">Thời gian</TableHead>
                  <TableHead className="w-40 text-xs">Người thực hiện</TableHead>
                  <TableHead className="w-36 text-xs">Hành động</TableHead>
                  <TableHead className="w-36 text-xs">Mã thiết kế</TableHead>
                  <TableHead className="w-48 text-xs">Tên thiết kế</TableHead>
                  <TableHead className="w-36 text-xs text-right">Số lượng</TableHead>
                  <TableHead className="text-xs">Chi tiết / Ghi chú</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyItems.map((item, index) => {
                  const itemIndex = (pageNumber - 1) * pageSize + index + 1;
                  const userName =
                    item.createdBy?.fullName ||
                    item.createdBy?.userName ||
                    (item.createdById ? `ID: ${item.createdById}` : "Hệ thống");

                  const sideLabel = formatSideLabel(item.side);

                  return (
                    <TableRow key={item.id || index} className="hover:bg-muted/20 text-xs">
                      <TableCell className="text-center font-medium text-muted-foreground">
                        {itemIndex}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-[11px]">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="h-3 w-3 shrink-0" />
                          <span>{formatHistoryDate(item.createdAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-1.5">
                          <UserIcon className="h-3 w-3 shrink-0 text-muted-foreground" />
                          <span className="truncate max-w-[140px]" title={userName}>
                            {userName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getActionBadge(item.action, item.actionDisplayName)}
                      </TableCell>
                      <TableCell className="font-mono font-semibold text-foreground">
                        {item.designCode || "—"}
                      </TableCell>
                      <TableCell className="truncate max-w-[180px]" title={item.designName || ""}>
                        {item.designName || "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.action === "quantity_updated" ? (
                          <div className="space-y-0.5">
                            <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                              {item.oldQuantity != null ? item.oldQuantity.toLocaleString() : "—"}{" "}
                              → {item.quantity != null ? item.quantity.toLocaleString() : "—"}
                            </span>
                            {item.quantityTaken != null && (
                              <div className="text-[10px] text-muted-foreground">
                                Khóa: {item.quantityTaken.toLocaleString()}
                              </div>
                            )}
                          </div>
                        ) : item.action === "added" ? (
                          <div className="space-y-0.5">
                            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                              +{item.quantity != null ? item.quantity.toLocaleString() : "0"}
                            </span>
                            {item.quantityTaken != null && (
                              <div className="text-[10px] text-muted-foreground">
                                Khóa: {item.quantityTaken.toLocaleString()}
                              </div>
                            )}
                          </div>
                        ) : item.action === "removed" ? (
                          <div className="space-y-0.5">
                            <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">
                              -{item.quantity != null ? item.quantity.toLocaleString() : "0"}
                            </span>
                          </div>
                        ) : (
                          <span>{item.quantity != null ? item.quantity.toLocaleString() : "—"}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5 max-w-xs">
                          {item.notes && (
                            <p className="text-muted-foreground break-words line-clamp-2">
                              {item.notes}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                            {sideLabel && (
                              <span className="bg-muted px-1.5 py-0.5 rounded">
                                {sideLabel}
                              </span>
                            )}
                            {item.itemsPerSheet != null && item.itemsPerSheet > 0 && (
                              <span className="bg-muted px-1.5 py-0.5 rounded">
                                {item.itemsPerSheet} con/tờ
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t bg-muted/20 flex items-center justify-between shrink-0">
            <p className="text-xs text-muted-foreground">
              Trang {pageNumber} / {totalPages} (Tổng {totalItems} dòng)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={pageNumber <= 1}
                onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={pageNumber >= totalPages}
                onClick={() => setPageNumber((prev) => Math.min(totalPages, prev + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
