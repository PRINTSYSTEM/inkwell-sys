import React, { useState } from "react";
import { FileText, Package, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import DeliveryLineRow from "./DeliveryLineRow";
import AddItemsToDeliveryNoteDialog from "./AddItemsToDeliveryNoteDialog";
import type { DeliveryNoteLineResponse } from "@/Schema/delivery-note.schema";

interface DeliveryLinesCardProps {
  lines: DeliveryNoteLineResponse[] | null;
  currentStatus: string;
  isDelivered: boolean;
  returnableLinesMap: Record<number, any>;
  openReturnDialog: (line: any) => void;
  deliveryNoteId?: number;
  deliveryNoteCode?: string;
  canEditLines?: boolean;
  totalDeliveryQty?: number;
  totalPendingLines?: number;
  totalDeliveredLines?: number;
  totalFailedLines?: number;
}

export default function DeliveryLinesCard({
  lines,
  currentStatus,
  isDelivered,
  returnableLinesMap,
  openReturnDialog,
  deliveryNoteId,
  deliveryNoteCode,
  canEditLines = false,
  totalDeliveryQty,
  totalPendingLines,
  totalDeliveredLines,
  totalFailedLines,
}: DeliveryLinesCardProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const hasLines = lines && lines.length > 0;
  const statusLower = (currentStatus || "").toLowerCase();

  const canAddLines =
    canEditLines &&
    !!deliveryNoteId &&
    ![
      "cancelled",
      "failed_reschedule",
      "failed",
    ].includes(statusLower);

  const isTransit = statusLower === "in_transit" || statusLower === "delivering";
  const isCompleted =
    statusLower === "completed" ||
    statusLower === "delivered" ||
    statusLower === "partially_completed";

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <FileText className="w-5 h-5 text-stone-600 dark:text-stone-400" />
                Chi tiết phiếu giao hàng
                {hasLines && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {lines.length} đơn
                  </Badge>
                )}
              </CardTitle>

              {/* Integrated Summary Stats Badges on title row */}
              {typeof totalDeliveryQty === "number" && (
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                    <Package className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Tổng SL:</span>
                    <span className="font-bold">{totalDeliveryQty.toLocaleString("vi-VN")}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
                    <span>Chờ giao:</span>
                    <span className="font-bold">{totalPendingLines ?? 0}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 font-semibold border border-green-200 dark:border-green-800">
                    <span>Đã giao:</span>
                    <span className="font-bold">{totalDeliveredLines ?? 0}</span>
                  </div>
                  {totalFailedLines != null && totalFailedLines > 0 && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-semibold border border-red-200 dark:border-red-800">
                      <span>Thất bại:</span>
                      <span className="font-bold">{totalFailedLines}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {canAddLines && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs font-semibold border-primary/40 text-primary hover:bg-primary/10 hover:border-primary transition-all"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm hàng vào phiếu
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {hasLines ? (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 text-xs">
                    <TableHead className="pl-4 w-[170px]">Mã hàng / Đơn</TableHead>
                    <TableHead className="min-w-[180px]">Sản phẩm</TableHead>
                    <TableHead className="w-[85px]">Mã bài</TableHead>
                    <TableHead className="w-[120px]">Ghi chú</TableHead>
                    <TableHead className="w-[85px] text-right whitespace-nowrap">SL đặt hàng</TableHead>
                    <TableHead className="w-[90px] text-right whitespace-nowrap">SL giao</TableHead>
                    <TableHead className="w-[70px] text-right whitespace-nowrap">Phụ hao</TableHead>
                    <TableHead className="w-[90px] text-right whitespace-nowrap">SL thực tính</TableHead>
                    <TableHead className="w-[95px] text-right whitespace-nowrap">Thành tiền</TableHead>
                    <TableHead className="w-[100px] text-center whitespace-nowrap">Trạng thái</TableHead>
                    <TableHead className="w-[110px] text-center whitespace-nowrap">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line, idx) => {
                    const rl = returnableLinesMap[line.id];
                    const maxQty = rl?.maxReturnableQty ?? 0;
                    const canReturn = isDelivered && maxQty > 0;
                    return (
                      <DeliveryLineRow
                        key={line.id ?? idx}
                        line={line}
                        noteStatus={currentStatus}
                        totalLines={lines.length}
                        canEditLines={canEditLines}
                        onReturn={canReturn ? openReturnDialog : undefined}
                      />
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
              Không có dòng hàng nào
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Items Dialog */}
      {deliveryNoteId && (
        <AddItemsToDeliveryNoteDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          deliveryNoteId={deliveryNoteId}
          deliveryNoteCode={deliveryNoteCode}
          isTransit={isTransit}
          isCompleted={isCompleted}
        />
      )}
    </>
  );
}
