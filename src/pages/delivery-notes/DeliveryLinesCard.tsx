import React from "react";
import { FileText, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import DeliveryLineRow from "./DeliveryLineRow";
import type { DeliveryNoteLineResponse } from "@/Schema/delivery-note.schema";

interface DeliveryLinesCardProps {
  lines: DeliveryNoteLineResponse[] | null;
  currentStatus: string;
  isDelivered: boolean;
  returnableLinesMap: Record<number, any>;
  openReturnDialog: (line: any) => void;
}

export default function DeliveryLinesCard({
  lines,
  currentStatus,
  isDelivered,
  returnableLinesMap,
  openReturnDialog,
}: DeliveryLinesCardProps) {
  const hasLines = lines && lines.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Chi tiết phiếu giao hàng
          {hasLines && (
            <Badge variant="secondary" className="ml-auto">
              {lines.length} đơn
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {hasLines ? (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-4">Mã hàng / Đơn</TableHead>
                  <TableHead>Sản phẩm</TableHead>
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
  );
}
