import React, { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Send,
  Search,
  CheckCircle2,
  Loader2,
  Eye,
  RefreshCw,
  Image as ImageIcon,
  Flame,
  Building2,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ImageViewerDialog } from "@/components/design/image-viewer-dialog";
import { useDispatchCandidates, useDispatchPrintOrders } from "@/hooks/use-print-order";
import { useDesignTypeList } from "@/hooks/use-design-type";

const getDesignTypeBadgeStyle = (code?: string) => {
  switch (code?.toUpperCase()) {
    case "H":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "N":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "D":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "T":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    default:
      return "bg-slate-100 text-slate-800 border-slate-200";
  }
};

const formatDateTime = (dateStr?: string | null) => {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: vi });
  } catch {
    return dateStr;
  }
};

export default function ProductionDispatch() {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDesignTypeId, setSelectedDesignTypeId] = useState<number | undefined>(undefined);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);

  // Queries & Mutations
  const { data: designTypesData } = useDesignTypeList();
  const designTypes = designTypesData?.items || [];

  const {
    data: candidatesData,
    isLoading,
    refetch,
  } = useDispatchCandidates({
    pageNumber: 1,
    pageSize: 200,
    search: searchQuery.trim() || undefined,
    designTypeId: selectedDesignTypeId,
  });

  const dispatchMutation = useDispatchPrintOrders();
  const candidateItems = candidatesData?.items || [];

  // Toggle selection
  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(candidateItems.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const isAllSelected =
    candidateItems.length > 0 && selectedIds.length === candidateItems.length;

  // Handle bulk dispatch
  const handleBulkDispatch = () => {
    if (selectedIds.length === 0) return;

    dispatchMutation.mutate(
      { printOrderIds: selectedIds },
      {
        onSuccess: () => {
          setSelectedIds([]);
          refetch();
        },
      }
    );
  };

  return (
    <div className="space-y-6 p-6 max-w-[1600px] mx-auto pb-24">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Send className="h-6 w-6 text-[#93631F]" />
            <h1 className="text-xl font-bold text-slate-900">Màn 1: Điều Lệnh Sản Xuất</h1>
            <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-bold">
              Trưởng kho / Bình bài
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Hàng chờ các bài bình đã hoàn tất và sẵn sàng để điều lệnh cho Thợ in.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-10 text-xs font-semibold"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Làm mới
          </Button>

          <Button
            onClick={handleBulkDispatch}
            disabled={selectedIds.length === 0 || dispatchMutation.isPending}
            className="h-10 bg-[#93631F] hover:bg-[#7a521a] text-white font-bold px-5 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            {dispatchMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Điều lệnh ({selectedIds.length} bài)
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Design Type Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <Button
              variant={selectedDesignTypeId === undefined ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDesignTypeId(undefined)}
              className={`h-8 text-xs font-semibold ${
                selectedDesignTypeId === undefined
                  ? "bg-[#93631F] hover:bg-[#7a521a] text-white"
                  : "text-slate-600"
              }`}
            >
              Tất cả loại ({candidateItems.length})
            </Button>
            {designTypes.map((dt) => (
              <Button
                key={dt.id}
                variant={selectedDesignTypeId === dt.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDesignTypeId(dt.id)}
                className={`h-8 text-xs font-semibold ${
                  selectedDesignTypeId === dt.id
                    ? "bg-[#93631F] hover:bg-[#7a521a] text-white"
                    : "text-slate-600"
                }`}
              >
                {dt.name} ({dt.code})
              </Button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tìm mã bình bài, mã thiết kế, tên khách..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Candidates List View (Table Format) */}
      {isLoading ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-slate-200">
          <Loader2 className="h-8 w-8 text-[#93631F] animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Đang tải danh sách bài chờ điều lệnh...</p>
        </div>
      ) : candidateItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-16 px-4 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3 opacity-80" />
          <h3 className="font-bold text-slate-800 text-base mb-1">Không có bài nào chờ điều lệnh</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Hàng chờ hiện tại đang rỗng. Tất cả các bài bình hoàn tất đã được điều lệnh cho Thợ in.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
            <div className="flex items-center gap-3">
              <Checkbox
                id="select-all-header"
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                className="h-4 w-4 text-[#93631F]"
              />
              <label htmlFor="select-all-header" className="cursor-pointer">
                Chọn tất cả ({candidateItems.length} bài)
              </label>
            </div>
            <span className="text-[#93631F]">
              Đã chọn: {selectedIds.length} bài
            </span>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100/60 hover:bg-slate-100/60">
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead className="w-14 text-center"></TableHead>
                  <TableHead className="w-[160px]">Mã Bình bài</TableHead>
                  <TableHead className="w-14 text-center">Ảnh</TableHead>
                  <TableHead className="w-[140px]">Loại bài</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead className="w-[130px] text-right">Số lượng</TableHead>
                  <TableHead className="w-[150px]">Ngày tạo</TableHead>
                  <TableHead className="w-[130px] text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidateItems.map((item, index) => {
                  const isSelected = selectedIds.includes(item.id);
                  const po = item.productionOrder;
                  const proofingCode = po?.proofingOrderCode || `PO-${item.productionOrderId}`;
                  const images = po?.proofingOrderImages || [];
                  const thumbnail = images[0]?.imageUrl || images[0]?.thumbnailUrl;
                  const designTypeCode = po?.designType?.code;
                  const designTypeName = po?.designType?.name;
                  const customerName = po?.customerName || "—";
                  const isUrgent = po?.isUrgent;
                  const totalQty = po?.proofingOrder?.totalQuantity || po?.items?.[0]?.inputQty || 0;

                  return (
                    <TableRow
                      key={item.id}
                      onClick={() => handleToggleSelect(item.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-amber-50/50 hover:bg-amber-50/80" : "hover:bg-slate-50/80"
                      }`}
                    >
                      <TableCell className="text-center font-medium text-slate-400 text-xs">
                        {index + 1}
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleSelect(item.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 text-[#93631F]"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {proofingCode}
                          </span>
                          {isUrgent && (
                            <Badge className="bg-red-500 text-white font-bold text-[9px] px-1 py-0 animate-pulse">
                              <Flame className="h-2.5 w-2.5 mr-0.5" /> Gấp
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div
                          className="h-10 w-10 bg-slate-100 rounded-lg border border-slate-200 mx-auto overflow-hidden relative group/img cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (thumbnail) setViewingImageUrl(thumbnail);
                          }}
                        >
                          {thumbnail ? (
                            <img
                              src={thumbnail}
                              alt={proofingCode}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-slate-400">
                              <ImageIcon className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {designTypeName && (
                          <Badge variant="outline" className={`text-[10px] font-bold ${getDesignTypeBadgeStyle(designTypeCode)}`}>
                            {designTypeName} ({designTypeCode})
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs font-semibold text-slate-800">
                          <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{customerName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs text-slate-900">
                        {totalQty.toLocaleString("vi-VN")} tờ
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 font-mono">
                        {formatDateTime(item.dispatchedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatchMutation.mutate(
                              { printOrderIds: [item.id] },
                              { onSuccess: () => refetch() }
                            );
                          }}
                          disabled={dispatchMutation.isPending}
                          className="h-8 text-xs bg-[#93631F] hover:bg-[#7a521a] text-white font-bold"
                        >
                          <Send className="h-3 w-3 mr-1" /> Điều lệnh
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Image Viewer Dialog */}
      <ImageViewerDialog
        open={!!viewingImageUrl}
        onOpenChange={(open) => !open && setViewingImageUrl(null)}
        imageUrl={viewingImageUrl || ""}
      />
    </div>
  );
}
