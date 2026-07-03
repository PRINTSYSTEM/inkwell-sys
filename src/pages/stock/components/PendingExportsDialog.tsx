// src/pages/stock/components/PendingExportsDialog.tsx
import React, { useState, useMemo } from "react";
import { Search, Loader2, AlertCircle, Play, ArrowRight, Layers, FileText, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { usePendingMaterialProductionOrders } from "@/hooks/use-production";
import { useProofingOrders } from "@/hooks/use-proofing-order";

interface PendingExportsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendors: any[];
  onInitiateStockOut: (vendorId: number, jobCode: string, quantity: number, paperName: string, isBoxCarton: boolean) => void;
}

// Vendor recommendation helper based on business rules
const getSuggestedVendorsForMaterial = (materialName: string, isRoll: boolean): string[] => {
  const name = materialName.toLowerCase().trim();
  const suggestions: string[] = [];

  if (name.includes("duplex") || name.includes("ivory")) {
    suggestions.push("Thuận Tuyền");
  }
  if (name.includes("couche")) {
    if (name.includes("nhãn") || name.includes("nhan")) {
      suggestions.push("Minh Kim Long", "CP");
    } else {
      suggestions.push("Thuận Phát");
    }
  }
  if (name.includes("metaline") || name.includes("metalize")) {
    if (name.includes("decal")) {
      suggestions.push("Vũ Hoàng Minh");
    } else if (name.includes("bạc") || name.includes("bac") || name.includes("giấy") || name.includes("giay")) {
      suggestions.push("Cường Metaline");
    } else {
      suggestions.push("Hộp Metaline", "Cường Metaline", "Vũ Hoàng Minh");
    }
  } else if (name.includes("decal")) {
    suggestions.push("Linh Hiếu", "Vũ Hoàng Minh");
  }
  if (name.includes("carton") || name.includes("sóng") || name.includes("song") || name.includes("bồi") || name.includes("boi")) {
    suggestions.push("Phúc Hảo");
  }
  if (name.includes("pe")) {
    if (isRoll || name.includes("cuộn") || name.includes("cuon")) {
      suggestions.push("Tân Hiệp Thành");
    } else {
      suggestions.push("Anh Đồng", "Minh Ngọc");
    }
  }
  if (name.includes("pa")) {
    suggestions.push("Hiện Đại");
  }
  if (name.includes("túi") || name.includes("tui")) {
    suggestions.push("Tân Hiệp Thành");
  }

  return suggestions;
};

export function PendingExportsDialog({
  open,
  onOpenChange,
  vendors,
  onInitiateStockOut,
}: PendingExportsDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Load pending production orders
  const { data: pendingResp, isLoading: isLoadingPending } = usePendingMaterialProductionOrders({
    pageSize: 1000,
  });
  const pendingOrders = pendingResp?.items || [];

  // Load proofing orders to match paper specifications
  const { data: proofingResp, isLoading: isLoadingProofing } = useProofingOrders({
    pageSize: 1000,
  });
  const proofingOrders = proofingResp?.items || [];

  // Map proofing orders by ID for fast lookup
  const proofingMap = useMemo(() => {
    const map = new Map<number, any>();
    proofingOrders.forEach((po) => {
      if (po.id) {
        map.set(po.id, po);
      }
    });
    return map;
  }, [proofingOrders]);

  // Combine production orders with proofing order details
  const enrichedOrders = useMemo(() => {
    return pendingOrders.map((po) => {
      const proofing = po.proofingOrderId ? proofingMap.get(po.proofingOrderId) : null;
      const paperName = proofing?.materialType?.name || "Giấy in";
      const totalQuantity = proofing?.totalQuantity || 0;
      
      const unitLower = (proofing?.materialType?.unit || "").toLowerCase();
      const isRoll = unitLower.includes("cuộn") || unitLower.includes("cuon") || unitLower.includes("mét") || unitLower.includes("m");

      const paperSizeName = proofing?.rollWidth 
        ? `Cuộn (Rộng: ${proofing.rollWidth} mm)` 
        : (proofing?.paperSize?.name || proofing?.customPaperSize || "—");

      const designTypeName = (proofing?.designType?.name || "").toLowerCase();
      const isBoxCarton = designTypeName.includes("hộp") && designTypeName.includes("carton");

      const suggestedSupplierNames = getSuggestedVendorsForMaterial(paperName, isRoll);

      return {
        ...po,
        paperName,
        totalQuantity,
        isRoll,
        paperSizeName,
        isBoxCarton,
        suggestedSupplierNames,
      };
    });
  }, [pendingOrders, proofingMap]);

  // Filter based on search query
  const filteredOrders = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return enrichedOrders;

    return enrichedOrders.filter((po) => {
      return (
        (po.proofingOrderCode || "").toLowerCase().includes(query) ||
        (po.customerName || "").toLowerCase().includes(query) ||
        (po.paperName || "").toLowerCase().includes(query) ||
        (po.items || []).some((item: any) => 
          (item.designCode || "").toLowerCase().includes(query) ||
          (item.designName || "").toLowerCase().includes(query)
        )
      );
    });
  }, [enrichedOrders, searchQuery]);

  const handleExportClick = (po: any, supplierName: string) => {
    // Find vendor from active vendors by name (fuzzy match)
    const match = vendors.find((v) => {
      const vName = (v.name || "").toLowerCase();
      const sName = supplierName.toLowerCase();
      return vName.includes(sName) || sName.includes(vName);
    });

    if (!match) {
      toast.error(`Không tìm thấy Nhà cung cấp "${supplierName}" trong danh sách hệ thống. Vui lòng tạo NCC này trước!`);
      return;
    }

    onInitiateStockOut(match.id, po.proofingOrderCode || `BB${po.proofingOrderId}`, po.totalQuantity, po.paperName, !!po.isBoxCarton);
  };

  const isLoading = isLoadingPending || isLoadingProofing;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] h-[80vh] max-h-[85vh] rounded-2xl border-none p-0 overflow-hidden shadow-2xl bg-slate-50 flex flex-col [&>button]:text-white [&>button]:hover:text-white/80 [&>button]:opacity-90 [&>button]:h-7 [&>button]:w-7 [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button]:bg-white/15 [&>button]:hover:bg-white/25 [&>button]:rounded-full [&>button]:transition-all">
        <DialogHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-5 shrink-0">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Layers className="h-5.5 w-5.5" />
            Danh sách bài chưa xuất kho vật tư
          </DialogTitle>
          <DialogDescription className="text-white/80 text-xs mt-1">
            Hiển thị các lệnh sản xuất đang chờ xuất nguyên vật liệu / giấy từ kho. Nhấn xuất kho để làm phiếu nhanh theo NCC được gợi ý.
          </DialogDescription>
        </DialogHeader>

        <div className="p-5 flex-1 flex flex-col min-h-0 space-y-4 overflow-hidden">
          {/* Search bar */}
          <div className="relative shrink-0">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tìm theo mã bài, loại giấy hoặc tên thiết kế..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10.5 text-xs bg-white border-slate-200 focus-visible:ring-amber-500 rounded-xl"
            />
          </div>

          {/* List/Table */}
          <div className="flex-1 min-h-0 border border-slate-100 rounded-xl overflow-hidden shadow-sm bg-white flex flex-col">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 flex-1">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                <p className="text-xs text-slate-500 font-medium">Đang tải thông tin các bài in chờ xuất kho...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-16 text-center flex-1 flex flex-col items-center justify-center">
                <AlertCircle className="h-10 w-10 text-slate-300 mb-3" />
                <p className="text-sm font-semibold text-slate-600">Không tìm thấy bài chờ xuất kho nào</p>
                <p className="text-xs text-slate-400 mt-1">Hệ thống hiện không có lệnh sản xuất nào ở trạng thái chờ xuất vật tư.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-100 font-bold uppercase tracking-wider sticky top-0 z-10">
                      <th className="py-3 px-4 w-[120px]">Mã bài</th>
                      <th className="py-3 px-4 min-w-[200px]">Loại vật tư</th>
                      <th className="py-3 px-4 w-[180px]">Kích thước</th>
                      <th className="py-3 px-4 w-[120px] text-right">Số lượng tờ</th>
                      <th className="py-3 px-4 w-[220px] text-center">Nhà cung cấp gợi ý</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map((po, index) => (
                      <tr key={po.id || index} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">
                          {po.proofingOrderCode || `BB${po.proofingOrderId}`}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900">{po.paperName}</div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {po.isRoll ? "Dạng cuộn" : "Dạng tờ"}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-600">
                          {po.paperSizeName || "—"}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-amber-600">
                          {po.totalQuantity ? po.totalQuantity.toLocaleString() : "—"}
                        </td>
                        <td className="py-3 px-4">
                          {po.suggestedSupplierNames && po.suggestedSupplierNames.length > 0 ? (
                            <div className="flex flex-col gap-1.5 items-center justify-center">
                              {po.suggestedSupplierNames.map((supplier) => (
                                <Button
                                  key={supplier}
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleExportClick(po, supplier)}
                                  className="w-full h-7 text-[10px] font-bold border-amber-200 hover:border-amber-300 hover:bg-amber-50 text-amber-700 hover:text-amber-800 rounded-lg cursor-pointer px-2 flex items-center justify-between"
                                >
                                  <span>{supplier}</span>
                                  <ArrowRight className="h-3 w-3 shrink-0 ml-1.5" />
                                </Button>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center">
                              <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-normal hover:bg-slate-100 py-0.5 text-[10px] rounded">
                                Tự chọn NCC
                              </Badge>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-50 border-t border-slate-100 p-4 flex justify-end shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 text-xs rounded-xl font-bold border-slate-200 bg-white hover:bg-slate-50 cursor-pointer px-5"
          >
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
