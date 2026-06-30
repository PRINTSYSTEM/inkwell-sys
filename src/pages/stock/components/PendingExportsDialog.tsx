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
  onInitiateStockOut: (vendorId: number, jobCode: string, quantity: number, paperName: string) => void;
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

      const suggestedSupplierNames = getSuggestedVendorsForMaterial(paperName, isRoll);

      return {
        ...po,
        paperName,
        totalQuantity,
        isRoll,
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

    onInitiateStockOut(match.id, po.proofingOrderCode || `BB${po.proofingOrderId}`, po.totalQuantity, po.paperName);
  };

  const isLoading = isLoadingPending || isLoadingProofing;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl rounded-2xl border-slate-200 p-0 overflow-hidden shadow-2xl bg-slate-50/50">
        <DialogHeader className="bg-gradient-to-r from-rose-600 to-rose-700 text-white p-5">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Layers className="h-5.5 w-5.5" />
            Danh sách bài chưa xuất kho vật tư
          </DialogTitle>
          <DialogDescription className="text-white/80 text-xs mt-1">
            Hiển thị các lệnh sản xuất đang chờ xuất nguyên vật liệu / giấy từ kho. Nhấn xuất kho để làm phiếu nhanh theo NCC được gợi ý.
          </DialogDescription>
        </DialogHeader>

        <div className="p-5 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tìm theo mã bài, khách hàng, loại giấy hoặc tên thiết kế..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10.5 text-xs bg-white border-slate-200 focus-visible:ring-rose-500 rounded-xl"
            />
          </div>

          {/* List/Table */}
          <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm bg-white max-h-[420px] overflow-y-auto">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
                <p className="text-xs text-slate-500 font-medium">Đang tải thông tin các bài in chờ xuất kho...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-16 text-center">
                <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-600">Không tìm thấy bài chờ xuất kho nào</p>
                <p className="text-xs text-slate-400 mt-1">Hệ thống hiện không có lệnh sản xuất nào ở trạng thái chờ xuất vật tư.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-100 font-bold uppercase tracking-wider sticky top-0 z-10">
                    <th className="py-3 px-4 w-[110px]">Mã bài</th>
                    <th className="py-3 px-4 w-[130px]">Khách hàng</th>
                    <th className="py-3 px-4 min-w-[150px]">Loại vật tư (Giấy)</th>
                    <th className="py-3 px-4 w-[100px] text-right">Số lượng tờ</th>
                    <th className="py-3 px-4 min-w-[160px]">Sản phẩm của bài</th>
                    <th className="py-3 px-4 w-[180px] text-center">Nhà cung cấp gợi ý</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((po, index) => (
                    <tr key={po.id || index} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        {po.proofingOrderCode || `BB${po.proofingOrderId}`}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-600 truncate max-w-[130px]">
                        {po.customerName || "—"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{po.paperName}</div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {po.isRoll ? "Dạng cuộn" : "Dạng tờ"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                        {po.totalQuantity ? po.totalQuantity.toLocaleString() : "—"}
                      </td>
                      <td className="py-3 px-4">
                        {po.items && po.items.length > 0 ? (
                          <div className="space-y-1">
                            {po.items.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between gap-2 text-[10px]">
                                <span className="text-slate-500 truncate max-w-[110px]">
                                  {item.designCode ? `[${item.designCode}] ` : ""}{item.designName}
                                </span>
                                <span className="font-semibold text-slate-600 shrink-0">
                                  {item.inputQty?.toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Không có thiết kế</span>
                        )}
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
                                className="w-full h-7 text-[10px] font-bold border-rose-200 hover:border-rose-300 hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-lg cursor-pointer px-2 flex items-center justify-between"
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
            )}
          </div>
        </div>

        <div className="bg-slate-50 border-t border-slate-100 p-4 flex justify-end">
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
