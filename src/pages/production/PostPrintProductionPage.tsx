import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Scissors,
  Search,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
  Flame,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImageViewerDialog } from "@/components/design/image-viewer-dialog";
import {
  usePostPrintProductionOrders,
  usePostPrintCounts,
  useUpdateProductionStep,
} from "@/hooks/use-production";
import { useDesignTypeList } from "@/hooks/use-design-type";
import type { ProductionOrderResponse, ProductionStepResponse } from "@/Schema/production.schema";

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

// Post-Print Process Definitions with multi-keyword matching
const POST_PRINT_PROCESSES = [
  { key: "lamination", label: "CÁN MÀNG", keywords: ["lamination", "cán màng", "cán"] },
  { key: "mounting", label: "BỒI", keywords: ["mounting", "bồi"] },
  { key: "foiling", label: "ÉP KIM", keywords: ["foiling", "pressing", "ép kim", "ép"] },
  { key: "die_cut", label: "BẾ", keywords: ["die_cut", "diecut", "bế"] },
  { key: "cutting", label: "CẮT", keywords: ["cut", "cutting", "cắt"] },
  { key: "gluing", label: "DÁN", keywords: ["glue", "gluing", "dán"] },
];

const findStepForProcess = (steps: ProductionStepResponse[], keywords: string[]) => {
  return steps.find((s) => {
    const typeStr = (s.stepType || "").toLowerCase();
    const nameStr = (s.stepTypeName || "").toLowerCase();
    return keywords.some((k) => typeStr.includes(k) || nameStr.includes(k));
  }) || null;
};

const getStepButtonClass = (status?: string) => {
  switch (status?.toLowerCase()) {
    case "completed":
    case "done":
      return "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200";
    case "in_progress":
    case "running":
      return "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200 animate-pulse";
    case "ready":
    case "pending":
      return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200";
  }
};

const getStepStatusLabel = (status?: string) => {
  switch (status?.toLowerCase()) {
    case "completed":
    case "done":
      return "Hoàn thành";
    case "in_progress":
    case "running":
      return "Đang làm";
    case "ready":
    case "pending":
      return "Sẵn sàng";
    default:
      return "Chờ";
  }
};

export default function PostPrintProductionPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDesignTypeId, setSelectedDesignTypeId] = useState<number | undefined>(undefined);
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);

  // Queries & Mutations
  const { data: counts } = usePostPrintCounts();
  const { data: designTypesData } = useDesignTypeList();
  const designTypes = designTypesData?.items || [];

  const {
    data: postPrintData,
    isLoading,
    refetch,
  } = usePostPrintProductionOrders({
    pageNumber: 1,
    pageSize: 200,
    designTypeId: selectedDesignTypeId,
    search: searchQuery.trim() || undefined,
  });

  const updateStepMutation = useUpdateProductionStep();

  const postPrintList = postPrintData?.items || [];

  // Group by DesignType
  const groupedSections = useMemo(() => {
    const map = new Map<string, { typeName: string; typeCode: string; items: ProductionOrderResponse[] }>();

    postPrintList.forEach((item) => {
      const dtCode = item.designType?.code || "K";
      const dtName = item.designType?.name || "Khác";

      if (!map.has(dtCode)) {
        map.set(dtCode, { typeName: dtName, typeCode: dtCode, items: [] });
      }
      map.get(dtCode)!.items.push(item);
    });

    return Array.from(map.values());
  }, [postPrintList]);

  // Handle Step Status Update
  const handleUpdateStepStatus = async (stepId: number, status: string) => {
    try {
      await updateStepMutation.mutate({ stepId, data: { status } });
      refetch();
    } catch {
      // Toast error handled in hook
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-[1600px] mx-auto pb-24">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Scissors className="h-6 w-6 text-[#93631F]" />
            <h1 className="text-xl font-bold text-slate-900">Màn 3: Sản Xuất Sau In</h1>
            <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-bold">
              Trưởng phòng SX
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Bảng Ma trận Sản xuất Sau In: Cập nhật trạng thái từng quy trình (Cán màng, Bồi, Ép kim, Bế, Cắt, Dán) khớp 100% Lệnh Sản Xuất.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge className="bg-amber-500 text-white font-bold text-xs px-3 py-1.5 shadow-sm">
            Đang sản xuất: {counts?.active || 0} bài
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-10 text-xs font-semibold"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Làm mới
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
              Tất cả loại ({postPrintList.length})
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

      {/* Main List Render (Matrix Table View Format matching Quản Lý Sản Xuất) */}
      {isLoading ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-slate-200">
          <Loader2 className="h-8 w-8 text-[#93631F] animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Đang tải danh sách bài gia công sau in...</p>
        </div>
      ) : postPrintList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-16 px-4 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3 opacity-80" />
          <h3 className="font-bold text-slate-800 text-base mb-1">Không có bài nào đang gia công sau in</h3>
          <p className="text-xs text-slate-500">
            Tất cả các công đoạn sau in đã hoàn tất hoặc chưa có bài in hoàn thành mới.
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
                  {section.items.length} bài gia công
                </span>
              </div>

              {/* Matrix Table View */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#fbf8f3] hover:bg-[#fbf8f3] border-b border-slate-200 uppercase text-[11px] font-bold text-slate-700">
                        <TableHead className="w-[170px]">MÃ BB</TableHead>
                        <TableHead className="w-[110px]">LOẠI BÀI</TableHead>
                        <TableHead className="w-[110px] text-right">SỐ LƯỢNG</TableHead>
                        <TableHead className="w-[120px] text-center">LỆNH IN</TableHead>
                        {POST_PRINT_PROCESSES.map((proc) => (
                          <TableHead key={proc.key} className="w-[130px] text-center font-bold text-slate-800">
                            {proc.label}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {section.items.map((item) => {
                        const proofingCode = item.proofingOrderCode || `PO-${item.id}`;
                        const images = item.proofingOrderImages || [];
                        const thumbnail = images[0]?.imageUrl || images[0]?.thumbnailUrl;
                        const isUrgent = item.isUrgent;
                        const totalQty = item.proofingOrder?.totalQuantity || item.items?.[0]?.inputQty || 0;
                        const steps: ProductionStepResponse[] = item.steps || [];

                        return (
                          <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                            {/* Combined MÃ BB + Thumbnail Column (matching Quản lý sản xuất) */}
                            <TableCell className="py-2.5">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className="h-10 w-10 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden relative shrink-0 cursor-pointer"
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
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1">
                                    <span className="font-mono text-xs font-bold text-slate-900">
                                      {proofingCode}
                                    </span>
                                    {isUrgent && (
                                      <Badge className="bg-red-500 text-white font-bold text-[8px] px-1 py-0 animate-pulse">
                                        <Flame className="h-2 w-2 mr-0.5" /> GẤP
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="py-2.5">
                              <Badge variant="outline" className={`text-[10px] font-bold ${getDesignTypeBadgeStyle(item.designType?.code)}`}>
                                {item.designType?.name} ({item.designType?.code})
                              </Badge>
                            </TableCell>

                            <TableCell className="text-right font-mono font-bold text-xs text-slate-900 py-2.5">
                              {totalQty.toLocaleString("vi-VN")} tờ
                            </TableCell>

                            <TableCell className="text-center py-2.5">
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-[10px] px-2 py-1">
                                Hoàn thành
                              </Badge>
                            </TableCell>

                            {/* Dynamic Post-Print Process Columns */}
                            {POST_PRINT_PROCESSES.map((proc) => {
                              const step = findStepForProcess(steps, proc.keywords);

                              if (!step) {
                                return (
                                  <TableCell key={proc.key} className="text-center text-slate-300 font-mono text-xs py-2.5">
                                    —
                                  </TableCell>
                                );
                              }

                              return (
                                <TableCell key={proc.key} className="text-center py-2">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={updateStepMutation.isPending}
                                        className={`h-8 px-2 text-xs font-bold border rounded-lg shadow-2xs flex items-center justify-between w-full ${getStepButtonClass(
                                          step.status
                                        )}`}
                                      >
                                        <span className="truncate">{getStepStatusLabel(step.status)}</span>
                                        <ChevronDown className="h-3 w-3 opacity-60 ml-1 shrink-0" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="center" className="w-36">
                                      <DropdownMenuItem
                                        onClick={() => handleUpdateStepStatus(step.id, "ready")}
                                        className="text-xs font-semibold text-blue-700"
                                      >
                                        Sẵn sàng
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleUpdateStepStatus(step.id, "in_progress")}
                                        className="text-xs font-semibold text-amber-700"
                                      >
                                        Đang làm
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleUpdateStepStatus(step.id, "done")}
                                        className="text-xs font-semibold text-emerald-700"
                                      >
                                        Hoàn thành
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              );
                            })}
                          </TableRow>
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

      {/* Image Viewer Dialog */}
      <ImageViewerDialog
        open={!!viewingImageUrl}
        onOpenChange={(open) => !open && setViewingImageUrl(null)}
        imageUrl={viewingImageUrl || ""}
      />
    </div>
  );
}
