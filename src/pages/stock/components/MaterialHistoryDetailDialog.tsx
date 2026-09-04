import { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMaterial, useMaterialHistory } from "@/hooks/use-material";
import { formatDate, formatCurrency } from "@/lib/status-utils";
import {
  Package,
  Calendar,
  Building2,
  FileText,
  Loader2,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Boxes,
  Tag,
} from "lucide-react";

interface MaterialHistoryDetailDialogProps {
  materialId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MaterialHistoryDetailDialog({
  materialId,
  open,
  onOpenChange,
}: MaterialHistoryDetailDialogProps) {
  const { data: material, isLoading: isLoadingMaterial } = useMaterial(materialId || 0, open && !!materialId);
  const { data: historyData, isLoading: isLoadingHistory } = useMaterialHistory(
    materialId || 0,
    undefined,
    open && !!materialId
  );

  const historyList = Array.isArray(historyData) ? historyData : historyData?.items || [];
  const isLoading = isLoadingMaterial || isLoadingHistory;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 bg-white border border-slate-200 shadow-2xl rounded-xl">
        <DialogHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Boxes className="w-5 h-5 text-amber-600" />
              Chi tiết thẻ kho & Lịch sử biến động vật tư
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5">
              Theo dõi nhập, xuất và số dư tồn kho chi tiết theo thời gian
            </DialogDescription>
          </div>
          {material && (
            <div className="mr-6">
              <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 font-semibold px-2.5 py-1">
                Tồn: {(material.quantityOnHand ?? 0).toLocaleString("vi-VN")} {material.defaultUnit || material.unit || "đv"}
              </Badge>
            </div>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-500 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            <span className="text-xs">Đang tải lịch sử tồn kho vật tư...</span>
          </div>
        ) : !material ? (
          <div className="p-8 text-center text-red-500 text-xs">
            Không tìm thấy thông tin vật tư.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Thông tin vật tư */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-500 flex items-center gap-1 mb-0.5">
                  <Package className="w-3.5 h-3.5 text-slate-400" /> Tên vật tư / Mã
                </span>
                <p className="font-bold text-slate-900">{material.materialName || material.name || "Chưa đặt tên"}</p>
                <span className="text-[10px] text-slate-500 font-mono">Code: {material.code || material.materialCode || "—"}</span>
              </div>

              <div>
                <span className="text-slate-500 flex items-center gap-1 mb-0.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" /> Quy cách & ĐVT
                </span>
                <p className="font-semibold text-slate-800">
                  {material.specName || material.basisWeight ? `${material.basisWeight || ""} gsm` : "Tiêu chuẩn"}
                </p>
                <span className="text-[10px] text-slate-500">
                  Đơn vị tính: {material.defaultUnit || material.unit || "Cái"}
                </span>
              </div>

              <div>
                <span className="text-slate-500 flex items-center gap-1 mb-0.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" /> Nhà cung cấp
                </span>
                <p className="font-semibold text-slate-800">
                  {material.vendorName || material.vendor?.name || "Không rõ"}
                </p>
              </div>

              <div>
                <span className="text-slate-500 flex items-center gap-1 mb-0.5">
                  <TrendingUp className="w-3.5 h-3.5 text-slate-400" /> Đơn giá tham chiếu
                </span>
                <p className="font-bold text-amber-700">
                  {material.price ? `${formatCurrency(material.price)} ₫` : "—"}
                </p>
              </div>
            </div>

            {/* Bảng Lịch Sử Biến Động */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" /> Nhật ký thẻ kho ({historyList.length})
              </h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <Table className="text-xs">
                  <TableHeader className="bg-slate-100/80">
                    <TableRow>
                      <TableHead className="w-12 text-center">STT</TableHead>
                      <TableHead>Ngày giao dịch</TableHead>
                      <TableHead>Loại giao dịch / Mã phiếu</TableHead>
                      <TableHead className="text-right">Thay đổi</TableHead>
                      <TableHead className="text-right font-bold">Số dư kho</TableHead>
                      <TableHead>Diễn giải / Ghi chú</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-slate-400">
                          Chưa có phát sinh giao dịch nhập xuất nào cho vật tư này.
                        </TableCell>
                      </TableRow>
                    ) : (
                      historyList.map((item: any, idx: number) => {
                        const isIncrease = (item.changeQuantity ?? item.quantity ?? 0) > 0;
                        const changeQty = Math.abs(item.changeQuantity ?? item.quantity ?? 0);

                        return (
                          <TableRow key={item.id || idx} className="hover:bg-slate-50/50">
                            <TableCell className="text-center font-medium text-slate-500">{idx + 1}</TableCell>
                            <TableCell className="text-slate-700 whitespace-nowrap">
                              {formatDate(item.createdAt || item.date || item.createdDate)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                {isIncrease ? (
                                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px] gap-1 px-1.5">
                                    <ArrowUpRight className="w-3 h-3" /> Nhập kho
                                  </Badge>
                                ) : (
                                  <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 text-[10px] gap-1 px-1.5">
                                    <ArrowDownRight className="w-3 h-3" /> Xuất kho
                                  </Badge>
                                )}
                                {item.referenceCode && (
                                  <span className="font-mono text-[11px] text-slate-600 font-semibold">
                                    #{item.referenceCode}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              <span className={isIncrease ? "text-emerald-600" : "text-rose-600"}>
                                {isIncrease ? "+" : "-"}{changeQty.toLocaleString("vi-VN")}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-bold text-slate-900">
                              {(item.endingQuantity ?? item.quantityAfter ?? 0).toLocaleString("vi-VN")}
                            </TableCell>
                            <TableCell className="text-slate-600 italic text-[11px]">
                              {item.notes || item.description || item.reason || "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs"
          >
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
