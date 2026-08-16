import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Printer,
  Search,
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
  Flame,
  User,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageViewerDialog } from "@/components/design/image-viewer-dialog";
import {
  usePrintOrders,
  usePrintOrderCounts,
  useStartPrintOrder,
  useCompletePrintOrder,
  useReturnPrintOrder,
} from "@/hooks/use-print-order";
import { useDesignTypeList } from "@/hooks/use-design-type";
import type { PrintOrderResponse } from "@/Schema/print-order.schema";

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
    return format(new Date(dateStr), "HH:mm dd/MM", { locale: vi });
  } catch {
    return dateStr;
  }
};

export default function PrintOrdersPage() {
  // Main view tab: "active" (waiting + printing combined), "returned", "completed"
  const [viewTab, setViewTab] = useState<"active" | "returned" | "completed">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDesignTypeId, setSelectedDesignTypeId] = useState<number | undefined>(undefined);
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);

  // Return dialog state
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returningItem, setReturningItem] = useState<PrintOrderResponse | null>(null);
  const [returnReason, setReturnReason] = useState("");

  // Queries & Mutations
  const { data: counts } = usePrintOrderCounts();
  const { data: designTypesData } = useDesignTypeList();
  const designTypes = designTypesData?.items || [];

  // Fetch items based on viewTab
  const queryStatus = viewTab === "active" ? undefined : viewTab;

  const {
    data: printOrdersData,
    isLoading,
    refetch,
  } = usePrintOrders({
    pageNumber: 1,
    pageSize: 200,
    status: queryStatus,
    designTypeId: selectedDesignTypeId,
    search: searchQuery.trim() || undefined,
  });

  const startMutation = useStartPrintOrder();
  const completeMutation = useCompletePrintOrder();
  const returnMutation = useReturnPrintOrder();

  const printOrdersList = printOrdersData?.items || [];

  // Filter items:
  // For "active": show status === "waiting" || status === "printing"
  // For "completed": show completed today
  const filteredItems = useMemo(() => {
    if (viewTab === "active") {
      return printOrdersList.filter(
        (item) => item.status === "waiting" || item.status === "printing"
      );
    }
    if (viewTab === "completed") {
      const todayStr = new Date().toDateString();
      return printOrdersList.filter((item) => {
        if (item.status !== "completed") return false;
        if (!item.completedAt) return true;
        return new Date(item.completedAt).toDateString() === todayStr;
      });
    }
    return printOrdersList;
  }, [printOrdersList, viewTab]);

  // Group by DesignType (Hộp -> Nhãn -> Decal -> Túi)
  const groupedSections = useMemo(() => {
    const map = new Map<string, { typeName: string; typeCode: string; items: PrintOrderResponse[] }>();

    filteredItems.forEach((item) => {
      const dtCode = item.productionOrder?.designType?.code || "K";
      const dtName = item.productionOrder?.designType?.name || "Khác";

      if (!map.has(dtCode)) {
        map.set(dtCode, { typeName: dtName, typeCode: dtCode, items: [] });
      }
      map.get(dtCode)!.items.push(item);
    });

    return Array.from(map.values());
  }, [filteredItems]);

  // Action Handlers
  const handleStart = (id: number) => {
    startMutation.mutate(id, { onSuccess: () => refetch() });
  };

  // Direct One-click Complete Action (No Popup!)
  const handleDirectComplete = (id: number) => {
    completeMutation.mutate(
      { id },
      { onSuccess: () => refetch() }
    );
  };

  const handleOpenReturnDialog = (item: PrintOrderResponse) => {
    setReturningItem(item);
    setReturnReason("");
    setReturnDialogOpen(true);
  };

  const handleConfirmReturn = () => {
    if (!returningItem || !returnReason.trim()) return;
    returnMutation.mutate(
      {
        id: returningItem.id,
        data: { reason: returnReason.trim() },
      },
      {
        onSuccess: () => {
          setReturnDialogOpen(false);
          setReturningItem(null);
          setReturnReason("");
          refetch();
        },
      }
    );
  };

  const activeTotalCount = (counts?.waiting || 0) + (counts?.printing || 0);

  return (
    <div className="space-y-6 p-6 max-w-[1600px] mx-auto pb-24">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Printer className="h-6 w-6 text-[#93631F]" />
            <h1 className="text-xl font-bold text-slate-900">Màn 2: Quản Lý Lệnh In</h1>
            <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-bold">
              Thợ in
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Màn hình tập trung công việc in ấn dành cho Thợ in: Theo dõi trạng thái, bấm Bắt đầu in và 1-click Hoàn thành.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="h-10 text-xs font-semibold"
        >
          <RefreshCw className="h-4 w-4 mr-2" /> Làm mới
        </Button>
      </div>

      {/* Main Tabs (Unified active print orders view) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          onClick={() => setViewTab("active")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            viewTab === "active"
              ? "bg-[#93631F] text-white shadow-md shadow-amber-900/10"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Printer className="h-4 w-4" />
          <span>Tất cả lệnh in đang thực hiện</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
            viewTab === "active" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
          }`}>
            {activeTotalCount}
          </span>
        </button>

        <button
          onClick={() => setViewTab("returned")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            viewTab === "returned"
              ? "bg-red-600 text-white shadow-md shadow-red-900/10"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <RotateCcw className="h-4 w-4" />
          <span>Bài bị trả về</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
            viewTab === "returned" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
          }`}>
            {counts?.returned || 0}
          </span>
        </button>

        <button
          onClick={() => setViewTab("completed")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            viewTab === "completed"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/10"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Hoàn thành hôm nay</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
            viewTab === "completed" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
          }`}>
            {counts?.completedToday || 0}
          </span>
        </button>
      </div>

      {/* Toolbar & Category Filter */}
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
              Tất cả loại ({filteredItems.length})
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

          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tìm mã bình bài, mã bài..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Main List Render (Table View Format) */}
      {isLoading ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-slate-200">
          <Loader2 className="h-8 w-8 text-[#93631F] animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Đang tải danh sách lệnh in...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-16 px-4 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3 opacity-80" />
          <h3 className="font-bold text-slate-800 text-base mb-1">Không tìm thấy lệnh in nào</h3>
          <p className="text-xs text-slate-500">
            Hiện tại không có lệnh in nào phù hợp với bộ lọc.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedSections.map((section) => (
            <div key={section.typeCode} className="space-y-3">
              {/* Section Header */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <div className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getDesignTypeBadgeStyle(section.typeCode)}`}>
                  {section.typeName} ({section.typeCode})
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {section.items.length} lệnh in
                </span>
              </div>

              {/* Table List View */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-100/60 hover:bg-slate-100/60">
                        <TableHead className="w-12 text-center">#</TableHead>
                        <TableHead className="w-14 text-center">Ảnh</TableHead>
                        <TableHead className="w-[180px]">Mã Bình bài</TableHead>
                        <TableHead className="w-[130px]">Loại bài</TableHead>
                        <TableHead className="w-[140px] text-right">Số lượng (tờ)</TableHead>
                        <TableHead className="w-[200px]">Trạng thái in</TableHead>
                        <TableHead className="w-[170px]">Thời gian điều lệnh</TableHead>
                        <TableHead className="w-[220px] text-right">Thao tác Thợ in</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {section.items.map((item, index) => {
                        const po = item.productionOrder;
                        const proofingCode = po?.proofingOrderCode || `PO-${item.productionOrderId}`;
                        const images = po?.proofingOrderImages || [];
                        const thumbnail = images[0]?.imageUrl || images[0]?.thumbnailUrl;
                        const isUrgent = po?.isUrgent;
                        const totalQty = po?.proofingOrder?.totalQuantity || po?.items?.[0]?.inputQty || 0;

                        const isReturned = item.status === "returned";
                        const isWaiting = item.status === "waiting";
                        const isPrinting = item.status === "printing";
                        const isCompleted = item.status === "completed";

                        return (
                          <React.Fragment key={item.id}>
                            <TableRow
                              className={`transition-colors ${
                                isReturned
                                  ? "bg-red-50/40 hover:bg-red-50/70 border-l-4 border-l-red-500"
                                  : isPrinting
                                  ? "bg-amber-50/30 hover:bg-amber-50/60 border-l-4 border-l-amber-500"
                                  : "hover:bg-slate-50/80"
                              }`}
                            >
                              <TableCell className="text-center font-medium text-slate-400 text-xs">
                                {index + 1}
                              </TableCell>
                              <TableCell className="text-center">
                                <div
                                  className="h-10 w-10 bg-slate-100 rounded-lg border border-slate-200 mx-auto overflow-hidden relative group/img cursor-pointer"
                                  onClick={() => thumbnail && setViewingImageUrl(thumbnail)}
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
                              <TableCell>
                                <Badge variant="outline" className={`text-[10px] font-bold ${getDesignTypeBadgeStyle(po?.designType?.code)}`}>
                                  {po?.designType?.name} ({po?.designType?.code})
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono font-bold text-xs text-slate-900">
                                {totalQty.toLocaleString("vi-VN")} tờ
                              </TableCell>
                              <TableCell>
                                {/* Progress Bar / Status Indicator */}
                                {isWaiting && (
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3 text-slate-400" /> Chưa in
                                      </span>
                                      <span className="text-slate-400 font-mono">0%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-slate-300 w-0"></div>
                                    </div>
                                  </div>
                                )}

                                {isPrinting && (
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-700">
                                      <span className="flex items-center gap-1 animate-pulse">
                                        <Printer className="h-3 w-3 text-amber-600" /> Đang in...
                                      </span>
                                      <span className="font-mono">50%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-amber-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-amber-500 rounded-full w-1/2 animate-pulse"></div>
                                    </div>
                                  </div>
                                )}

                                {isCompleted && (
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700">
                                      <span className="flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Đã xong
                                      </span>
                                      <span className="font-mono">100%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-emerald-500 rounded-full w-full"></div>
                                    </div>
                                  </div>
                                )}

                                {isReturned && (
                                  <Badge className="bg-red-100 text-red-800 border-red-200 font-bold text-[10px]">
                                    <AlertTriangle className="h-3 w-3 mr-1 text-red-600" /> Trả về
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-slate-600">
                                {item.dispatchedByName ? (
                                  <div className="space-y-0.5">
                                    <div className="font-semibold text-slate-800 flex items-center gap-1">
                                      <User className="h-3 w-3 text-slate-400 shrink-0" />
                                      {item.dispatchedByName}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono">
                                      {formatDateTime(item.dispatchedAt)}
                                    </div>
                                  </div>
                                ) : (
                                  "—"
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {isWaiting && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleStart(item.id)}
                                      disabled={startMutation.isPending}
                                      className="h-8 bg-[#93631F] hover:bg-[#7a521a] text-white font-bold text-xs px-3"
                                    >
                                      {startMutation.isPending ? (
                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                      ) : (
                                        <Play className="h-3 w-3 mr-1 fill-current" />
                                      )}
                                      Bắt đầu in
                                    </Button>
                                  )}

                                  {isPrinting && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleDirectComplete(item.id)}
                                      disabled={completeMutation.isPending}
                                      className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 shadow-sm active:scale-95"
                                    >
                                      {completeMutation.isPending ? (
                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                      ) : (
                                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                      )}
                                      Hoàn thành
                                    </Button>
                                  )}

                                  {(isWaiting || isPrinting) && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleOpenReturnDialog(item)}
                                      disabled={returnMutation.isPending}
                                      className="h-8 border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold px-2.5"
                                    >
                                      <RotateCcw className="h-3 w-3 mr-1" /> Trả về
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>

                            {/* Red Return Banner Sub-row */}
                            {isReturned && (
                              <TableRow className="bg-red-100/60 hover:bg-red-100/60 border-b-2 border-b-red-200">
                                <TableCell colSpan={8} className="py-2 px-4 text-xs font-bold text-red-800">
                                  <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                                    <span>LÝ DO TRẢ VỀ BÌNH BÀI: {item.returnReason || "Chưa nhập lý do chi tiết"}</span>
                                    <span className="text-[10px] text-red-600 font-mono ml-auto">
                                      {formatDateTime(item.returnedAt)}
                                    </span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog Trả về bình bài */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-700 flex items-center gap-2">
              <RotateCcw className="h-5 w-5" /> Trả về bộ phận Bình bài
            </DialogTitle>
            <DialogDescription>
              Bộ phận Bình bài sẽ nhận được lý do này để xử lý và điều chỉnh lại file bài.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label htmlFor="returnReason" className="text-xs font-bold text-slate-700 block">
              Lý do trả về <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="returnReason"
              rows={4}
              maxLength={1000}
              placeholder="Nhập chi tiết lý do trả về bài in (ví dụ: file bị tràn lề, hỏng kẽm, nhầm kích thước...)"
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              className="text-xs"
            />
            <div className="text-[10px] text-slate-400 text-right">
              {returnReason.length}/1000 ký tự
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleConfirmReturn}
              disabled={!returnReason.trim() || returnMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {returnMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Xác nhận Trả về
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Viewer Dialog */}
      <ImageViewerDialog
        open={!!viewingImageUrl}
        onOpenChange={(open) => !open && setViewingImageUrl(null)}
        imageUrl={viewingImageUrl || ""}
      />
    </div>
  );
}
