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
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Chi tiết phiếu giao hàng
              {hasLines && (
                <Badge variant="secondary" className="ml-2">
                  {lines.length} đơn
                </Badge>
              )}
            </CardTitle>

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
                  <TableRow className="bg-muted/30">
                    <TableHead className="pl-4">Mã hàng / Đơn</TableHead>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Mã bài</TableHead>
                    <TableHead>Ghi chú</TableHead>
                    <TableHead className="text-right">SL đặt hàng</TableHead>
                    <TableHead className="text-right">SL giao</TableHead>
                    <TableHead className="text-right">Phụ hao</TableHead>
                    <TableHead className="text-right">SL thực tính</TableHead>
                    <TableHead className="text-right">Thành tiền</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Thao tác</TableHead>
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
