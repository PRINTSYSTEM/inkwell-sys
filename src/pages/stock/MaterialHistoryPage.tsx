import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, addDays, startOfMonth } from "date-fns";
import { vi } from "date-fns/locale";
import {
  RefreshCw,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Maximize2,
  Layers,
  Boxes,
  Tag,
  User,
  ChevronLeft,
  ChevronRight,
  Search,
  History,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Scissors,
  Plus,
  Minus,
  Pencil,
  Check,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useMaterial, useMaterialHistory, useMaterials } from "@/hooks/use-material";
import {
  useCompleteMaterialCut,
  useCancelMaterialCut,
  useCompleteStockIn,
  useCancelStockIn,
  useCompleteStockOut,
  useCancelStockOut,
  useStockIns,
  useStockOuts,
  useMaterialCuts,
} from "@/hooks/use-stock";
import { DateRangePicker } from "@/components/forms/DateRangePicker";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import { MaterialCutDialog } from "./components/MaterialCutDialog";
import { StockInDialog } from "./components/StockInDialog";
import { StockOutDialog } from "./components/StockOutDialog";

const formatDateTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: vi });
};

const isImport = (type: string | null | undefined) => {
  if (!type) return false;
  const t = type.toLowerCase();
  return t === "stockin" || t === "stock_in" || t === "cut_in";
};

const isExport = (type: string | null | undefined) => {
  if (!type) return false;
  const t = type.toLowerCase();
  return t === "stockout" || t === "stock_out" || t === "cut_out" || t === "return_vendor" || t === "transfer";
};

const isWaste = (type: string | null | undefined) => {
  if (!type) return false;
  const t = type.toLowerCase();
  return t === "waste";
};

export default function MaterialHistoryPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const materialId = id ? parseInt(id, 10) : null;
  const isNumericId = materialId !== null && !isNaN(materialId);

  // States
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [transactionType, setTransactionType] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Dialog States
  const [isCutOpen, setIsCutOpen] = useState(false);
  const [isStockInOpen, setIsStockInOpen] = useState(false);
  const [isStockOutOpen, setIsStockOutOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // Form States
  const [stockInForm, setStockInForm] = useState({
    quantity: 0,
    documentCode: "",
    notes: "",
    laborCost: 0,
  });

  const [stockOutForm, setStockOutForm] = useState({
    quantity: 0,
    documentCode: "",
    notes: "",
    purpose: "manual",
  });

  // API Queries
  const { 
    data: materialDetail, 
    isLoading: isLoadingMaterial,
    isError: isErrorMaterial,
    error: errorMaterial,
  } = useMaterial(
    isNumericId ? materialId : null,
    isNumericId
  );

  const {
    data: historyData,
    isLoading: isLoadingHistory,
    isError: isErrorHistory,
    error: errorHistory,
    refetch: refetchHistory,
  } = useMaterialHistory(
    isNumericId ? materialId : null,
    {
      pageNumber: currentPage,
      pageSize: 10,
      fromDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
      toDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
      transactionType: transactionType === "all" ? undefined : transactionType,
    },
    isNumericId
  );

  // Fetch pending vouchers
  const { data: pendingCutsData, refetch: refetchPendingCuts } = useMaterialCuts({ status: "pending" });
  const { data: pendingStockInsData, refetch: refetchPendingStockIns } = useStockIns({ status: "pending" });
  const { data: pendingStockOutsData, refetch: refetchPendingStockOuts } = useStockOuts({ status: "pending" });

  // Get all materials for vendor matching
  const { data: allMaterialsData } = useMaterials({ pageSize: 1000 });

  // Mutations
  const { mutateAsync: completeMaterialCut } = useCompleteMaterialCut();
  const { mutateAsync: cancelMaterialCut } = useCancelMaterialCut();
  
  const { mutateAsync: completeStockIn } = useCompleteStockIn();
  const { mutateAsync: cancelStockIn } = useCancelStockIn();

  const { mutateAsync: completeStockOut } = useCompleteStockOut();
  const { mutateAsync: cancelStockOut } = useCancelStockOut();

  const refetchAll = async () => {
    await Promise.all([
      refetchHistory(),
      refetchPendingCuts(),
      refetchPendingStockIns(),
      refetchPendingStockOuts(),
    ]);
  };

  const isLoading = isLoadingMaterial || isLoadingHistory;
  const isError = isErrorMaterial || isErrorHistory;
  const error = errorMaterial || errorHistory;

  // Local Client-side Filtering for search query
  const filteredItems = useMemo(() => {
    if (!historyData?.items) return [];
    if (!searchQuery) return historyData.items;
    const query = searchQuery.toLowerCase();
    return historyData.items.filter(
      (entry) =>
        (entry.referenceCode || "").toLowerCase().includes(query) ||
        (entry.note || "").toLowerCase().includes(query) ||
        (entry.createdByName || "").toLowerCase().includes(query) ||
        (entry.referenceType || "").toLowerCase().includes(query)
    );
  }, [historyData?.items, searchQuery]);

  // Total summary statistics computed from returned data
  const summaryStats = useMemo(() => {
    const defaultStats = {
      openingBalance: materialDetail?.quantity || 0,
      totalIn: 0,
      totalOut: 0,
      totalWaste: 0,
      closingBalance: materialDetail?.quantity || 0,
    };

    if (!historyData?.items || historyData.items.length === 0) {
      return defaultStats;
    }

    // Sort items chronologically (oldest first) to find opening and closing balances
    const sortedItems = [...historyData.items].sort((a, b) => {
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    });

    const oldestTxn = sortedItems[0];
    const newestTxn = sortedItems[sortedItems.length - 1];

    const openingBalance = oldestTxn.previousQuantity !== undefined && oldestTxn.previousQuantity !== null
      ? oldestTxn.previousQuantity
      : 0;
    const closingBalance = newestTxn.newQuantity !== undefined && newestTxn.newQuantity !== null
      ? newestTxn.newQuantity
      : 0;

    let totalIn = 0;
    let totalOut = 0;
    let totalWaste = 0;

    historyData.items.forEach((item) => {
      const qty = item.quantity || 0;
      if (isImport(item.transactionType)) {
        totalIn += qty;
      } else if (isExport(item.transactionType)) {
        totalOut += qty;
      } else if (isWaste(item.transactionType)) {
        totalWaste += qty;
      }
    });

    return {
      openingBalance,
      totalIn,
      totalOut,
      totalWaste,
      closingBalance,
    };
  }, [historyData?.items, materialDetail?.quantity]);

  // Client-side calculations for Cut Dialog & Actionable Pending List
  const vendorRolls = useMemo(() => {
    if (!allMaterialsData?.items || !materialDetail) return [];
    return allMaterialsData.items.filter(
      (m: any) => m.vendorId === materialDetail.vendorId && (m.type === "cuon" || m.materialTypeName?.toLowerCase()?.includes("cuộn") || m.materialTypeName?.toLowerCase()?.includes("cuon"))
    );
  }, [allMaterialsData?.items, materialDetail]);

  const relevantPendingCuts = useMemo(() => {
    return (pendingCutsData?.items || []).filter(
      (cut: any) => cut.inputMaterialId === materialId
    );
  }, [pendingCutsData?.items, materialId]);

  const relevantPendingStockIns = useMemo(() => {
    return (pendingStockInsData?.items || []).filter((stockIn: any) =>
      (stockIn.items || []).some((item: any) => item.materialId === materialId)
    );
  }, [pendingStockInsData?.items, materialId]);

  const relevantPendingStockOuts = useMemo(() => {
    return (pendingStockOutsData?.items || []).filter((stockOut: any) =>
      (stockOut.items || []).some((item: any) => item.materialId === materialId)
    );
  }, [pendingStockOutsData?.items, materialId]);

  const combinedPendingItems = useMemo(() => {
    const list: any[] = [];
    
    relevantPendingCuts.forEach((cut: any) => {
      list.push({
        id: cut.id,
        type: "cut",
        code: cut.code || `CUT-${cut.id}`,
        createdAt: cut.createdAt || cut.cutAt,
        jobCode: cut.jobCode || "—",
        notes: cut.notes || "—",
        quantity: cut.quantityUsed,
        wasted: cut.quantityWasted,
        outputs: cut.outputs,
        raw: cut,
      });
    });

    relevantPendingStockIns.forEach((stockIn: any) => {
      const item = (stockIn.items || []).find((i: any) => i.materialId === materialId);
      list.push({
        id: stockIn.id,
        type: "stock_in",
        code: stockIn.code || `PNK-${stockIn.id}`,
        createdAt: stockIn.createdAt || stockIn.stockInDate,
        jobCode: item?.jobCode || "—",
        notes: stockIn.notes || "—",
        quantity: item?.quantity || 0,
        raw: stockIn,
      });
    });

    relevantPendingStockOuts.forEach((stockOut: any) => {
      const item = (stockOut.items || []).find((i: any) => i.materialId === materialId);
      list.push({
        id: stockOut.id,
        type: "stock_out",
        code: stockOut.code || `PXK-${stockOut.id}`,
        createdAt: stockOut.createdAt || stockOut.stockOutDate,
        jobCode: item?.jobCode || "",
        notes: stockOut.notes || "",
        quantity: item?.quantity || 0,
        raw: stockOut,
      });
    });

    // Sort newest first
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [relevantPendingCuts, relevantPendingStockIns, relevantPendingStockOuts, materialId]);

  const handleVoucherClick = (
    voucherType: string | null | undefined,
    voucherId: number | null | undefined
  ) => {
    if (!voucherId) return;

    const voucherTypeLower = voucherType?.toLowerCase() || "";
    if (
      voucherTypeLower.includes("stockin") ||
      voucherTypeLower === "stockin" ||
      voucherTypeLower.includes("nhap")
    ) {
      navigate(`/stock/stock-ins/${voucherId}`);
    } else if (
      voucherTypeLower.includes("stockout") ||
      voucherTypeLower === "stockout" ||
      voucherTypeLower.includes("xuat")
    ) {
      navigate(`/stock/stock-outs/${voucherId}`);
    }
  };



  return (
    <>
      <Helmet>
        <title>Lịch sử vật tư | Print Production ERP</title>
        <meta name="description" content="Chi tiết lịch sử nhập xuất nguyên vật liệu" />
      </Helmet>

      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/stock/summary")}
              className="shrink-0 border-slate-200 h-9 w-9 rounded-xl hover:bg-slate-50 cursor-pointer"
            >
              <ArrowLeft className="h-4.5 w-4.5 text-slate-600" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-800">
                  {materialDetail?.vendorName ? `${materialDetail.vendorName} : ` : ""}{materialDetail?.name || "—"}
                </h1>
                <Badge variant="outline" className="font-mono text-xs rounded-lg border-slate-200 bg-slate-50/50">
                  ID: #{materialId}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Kho: Chính | Đơn vị tính: {materialDetail?.unit || "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DateRangePicker
              value={dateRange}
              onValueChange={(val) => {
                setDateRange(val);
                setCurrentPage(1);
              }}
              className="w-[280px]"
            />
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl border-slate-200 hover:bg-slate-50 cursor-pointer"
              onClick={() => {
                refetchHistory();
              }}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 text-slate-600 ${isLoadingHistory ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Action Buttons Bar */}
        {materialDetail && (
          <div className="flex items-center gap-2 flex-wrap justify-end pb-1">
            {/* 1. Cắt cuộn button (only for rolls) */}
            {(materialDetail.type === "cuon" || materialDetail.materialTypeName?.toLowerCase()?.includes("cuộn") || materialDetail.materialTypeName?.toLowerCase()?.includes("cuon")) && (
              <Button
                onClick={() => {
                  setIsCutOpen(true);
                }}
                className="h-9 px-4 rounded-lg border border-[#93631F] bg-transparent hover:bg-[#93631F]/5 text-[#93631F] hover:text-[#7a521a] font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-all duration-200"
              >
                <Scissors className="h-4 w-4" />
                Cắt nguyên liệu
              </Button>
            )}

            {/* 2. Nhập kho button */}
            <Button
              onClick={() => {
                setIsEditMode(false);
                setEditId(null);
                setStockInForm({
                  quantity: 0,
                  documentCode: "",
                  notes: "",
                  laborCost: 0,
                });
                setIsStockInOpen(true);
              }}
              className="h-9 px-4 rounded-lg bg-[#93631F] hover:bg-[#7a521a] text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition-all duration-200 hover:shadow-[#93631F]/20"
            >
              <Plus className="h-4 w-4" />
              Nhập kho
            </Button>

            {/* 3. Xuất kho button */}
            <Button
              onClick={() => {
                setIsEditMode(false);
                setEditId(null);
                setStockOutForm({
                  quantity: 0,
                  documentCode: "",
                  notes: "",
                  purpose: "manual",
                });
                setIsStockOutOpen(true);
              }}
              className="h-9 px-4 rounded-lg border border-rose-200 bg-rose-50/30 hover:bg-rose-50 text-rose-700 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-all duration-200 hover:shadow-rose-550/10"
            >
              <Minus className="h-4 w-4" />
              Xuất kho
            </Button>
          </div>
        )}

        {/* Error Alert */}
        {isError && (
          <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-955 rounded-2xl py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="font-bold">Lỗi tải dữ liệu</AlertTitle>
            <AlertDescription className="text-xs mt-0.5">
              {error instanceof Error
                ? error.message
                : "Không thể lấy thông tin lịch sử từ máy chủ. Vui lòng kiểm tra lại kết nối mạng."}
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Stats Overview (Vertically Compact & Premium 5-Column Ledger Indicators) */}
        {historyData && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* 1. Số dư đầu kỳ */}
            <div className="bg-slate-50/60 p-2.5 rounded-lg border border-slate-200/50 flex items-center gap-2.5 transition-all duration-300 hover:shadow-sm hover:bg-slate-50">
               <div className="p-1.5 rounded-md bg-slate-100 text-slate-600">
                <History className="h-4.5 w-4.5 shrink-0" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">Số dư đầu kỳ</p>
                <p className="text-sm font-bold text-slate-700 mt-0.5 truncate tabular-nums">
                  {summaryStats.openingBalance.toLocaleString()}{" "}
                  <span className="text-[10px] text-slate-400 font-normal">{(materialDetail?.unit || "").toLowerCase()}</span>
                </p>
              </div>
            </div>

            {/* 2. Tổng nhập */}
            <div className="bg-emerald-50/[0.3] p-2.5 rounded-lg border border-emerald-500/10 flex items-center gap-2.5 transition-all duration-300 hover:shadow-sm hover:bg-emerald-50/50">
               <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600">
                <ArrowUpRight className="h-4.5 w-4.5 shrink-0" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/80 truncate">Tổng nhập</p>
                <p className="text-sm font-bold text-emerald-700 mt-0.5 truncate tabular-nums">
                  {summaryStats.totalIn.toLocaleString()}{" "}
                  <span className="text-[10px] text-emerald-600/70 font-normal">{(materialDetail?.unit || "").toLowerCase()}</span>
                </p>
              </div>
            </div>

            {/* 3. Tổng xuất */}
            <div className="bg-rose-50/[0.3] p-2.5 rounded-lg border border-rose-500/10 flex items-center gap-2.5 transition-all duration-300 hover:shadow-sm hover:bg-rose-50/50">
               <div className="p-1.5 rounded-md bg-rose-50 text-rose-600">
                <ArrowDownRight className="h-4.5 w-4.5 shrink-0" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600/80 truncate">Tổng xuất</p>
                <p className="text-sm font-bold text-rose-700 mt-0.5 truncate tabular-nums">
                  {summaryStats.totalOut.toLocaleString()}{" "}
                  <span className="text-[10px] text-rose-600/70 font-normal">{(materialDetail?.unit || "").toLowerCase()}</span>
                </p>
              </div>
            </div>

            {/* 4. Tổng hao hụt */}
            <div className="bg-amber-50/[0.3] p-2.5 rounded-lg border border-amber-500/10 flex items-center gap-2.5 transition-all duration-300 hover:shadow-sm hover:bg-amber-50/50">
               <div className="p-1.5 rounded-md bg-amber-50 text-amber-600">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600/80 truncate">Hao hụt</p>
                <p className="text-sm font-bold text-amber-700 mt-0.5 truncate tabular-nums">
                  {summaryStats.totalWaste.toLocaleString()}{" "}
                  <span className="text-[10px] text-amber-600/70 font-normal">{(materialDetail?.unit || "").toLowerCase()}</span>
                </p>
              </div>
            </div>

            {/* 5. Tồn */}
            <div className="bg-blue-50/[0.3] p-2.5 rounded-lg border border-blue-500/10 flex items-center gap-2.5 transition-all duration-300 hover:shadow-sm hover:bg-blue-50/50">
               <div className="p-1.5 rounded-md bg-blue-50 text-blue-600">
                <Boxes className="h-4.5 w-4.5 shrink-0" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600/80 truncate">Tồn</p>
                <p className="text-sm font-bold text-blue-700 mt-0.5 truncate tabular-nums">
                  {summaryStats.closingBalance.toLocaleString()}{" "}
                  <span className="text-[10px] text-blue-600/70 font-normal">{(materialDetail?.unit || "").toLowerCase()}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pending Transactions Section */}
        {combinedPendingItems.length > 0 && (
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-1.5 px-1">
              <AlertTriangle className="h-4 w-4 text-[#93631F] shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Giao dịch chờ xử lý ({combinedPendingItems.length})
              </h3>
            </div>
            <Card className="border border-slate-200/60 shadow-sm rounded-xl overflow-hidden bg-white">
              <div className="overflow-x-auto w-full">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-200/60 text-xs font-bold uppercase tracking-wider">
                      <TableHead className="font-bold py-2 pl-4 text-left w-[130px]">Thời gian</TableHead>
                      <TableHead className="font-bold py-2 text-left w-[140px]">Loại phiếu</TableHead>
                      <TableHead className="font-bold py-2 text-left w-[100px]">Mã bài</TableHead>
                      <TableHead className="font-bold py-2 text-left w-[100px]">kích thước</TableHead>
                      <TableHead className="text-right font-bold py-2 w-[130px] whitespace-nowrap">Số lượng tờ ra</TableHead>
                      <TableHead className="text-right font-bold py-2 w-[110px]">Số lượng</TableHead>
                      <TableHead className="font-bold py-2 text-left w-[200px]">Ghi chú</TableHead>
                      <TableHead className="font-bold py-2 pr-4 text-right w-[200px]">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {combinedPendingItems.map((item) => (
                      <TableRow key={`${item.type}-${item.id}`} className="hover:bg-slate-50 border-b border-slate-100 text-xs transition-colors duration-150">
                        {/* 1. Thời gian */}
                        <TableCell className="py-2 pl-4 font-medium text-slate-600 w-[130px]">
                          {item.createdAt ? formatDateTime(item.createdAt) : ""}
                        </TableCell>

                        {/* 2. Loại phiếu */}
                        <TableCell className="py-2 w-[140px]">
                          <div className="flex items-center gap-1.5">
                            {item.type === "cut" ? (
                              <Badge className="bg-[#93631F]/10 text-[#93631F] hover:bg-[#93631F]/10 rounded-md border-none px-1.5 py-0.5 font-semibold text-[10px] shrink-0">
                                Phiếu cắt
                              </Badge>
                            ) : item.type === "stock_in" ? (
                              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 rounded-md border-none px-1.5 py-0.5 font-semibold text-[10px] shrink-0">
                                Phiếu nhập
                              </Badge>
                            ) : (
                              <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 rounded-md border-none px-1.5 py-0.5 font-semibold text-[10px] shrink-0">
                                Phiếu xuất
                              </Badge>
                            )}
                            <span className="font-mono font-bold text-slate-800 text-[10px]">{item.code}</span>
                          </div>
                        </TableCell>

                        {/* 3. Mã bài */}
                        <TableCell className="py-2 text-slate-700 font-medium w-[100px]">
                          {item.jobCode || ""}
                        </TableCell>

                        {/* 4. Kích thước */}
                        <TableCell className="py-2 font-mono text-slate-600 w-[100px]">
                          {item.type === "cut" && item.outputs?.[0]
                            ? `${item.outputs[0].cutLength}x${item.outputs[0].cutWidth}`
                            : ""}
                        </TableCell>

                        {/* 5. Số lượng tờ ra */}
                        <TableCell className="text-right py-2 font-bold tabular-nums text-slate-800 w-[130px] whitespace-nowrap">
                          {item.type === "cut" && item.outputs?.[0]?.quantityProduced !== undefined
                            ? item.outputs[0].quantityProduced.toLocaleString()
                            : ""}
                        </TableCell>

                        {/* 6. Số lượng */}
                        <TableCell className="text-right py-2 font-bold tabular-nums w-[110px]">
                          <span className={item.type === "stock_in" ? "text-emerald-600" : item.type === "stock_out" ? "text-rose-600" : "text-[#93631F]"}>
                            {item.quantity.toLocaleString()}
                          </span>{" "}
                          <span className="text-[10px] text-slate-400 font-normal">{(materialDetail?.unit || "").toLowerCase()}</span>
                        </TableCell>

                        {/* 7. Ghi chú */}
                        <TableCell className="py-2 text-slate-500 italic max-w-[200px] truncate w-[200px]" title={item.notes || ""}>
                          {item.notes || ""}
                        </TableCell>

                        {/* 8. Thao tác */}
                        <TableCell className="py-2 pr-4 text-right w-[200px]">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Pencil Edit button */}
                            {(item.type === "stock_in" || item.type === "stock_out") && (
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 rounded-md border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                                onClick={() => {
                                  setIsEditMode(true);
                                  setEditId(item.id);
                                  if (item.type === "stock_in") {
                                    setStockInForm({
                                      quantity: item.quantity,
                                      documentCode: item.raw.code || "",
                                      notes: item.notes || "",
                                      laborCost: item.raw.laborCost || 0,
                                    });
                                    setIsStockInOpen(true);
                                  } else {
                                    setStockOutForm({
                                      quantity: item.quantity,
                                      documentCode: item.raw.code || "",
                                      notes: item.notes || "",
                                      purpose: item.raw.purpose || "manual"
                                    });
                                    setIsStockOutOpen(true);
                                  }
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            )}

                            {/* Complete Button */}
                            <Button
                              className="h-7 px-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-sm flex items-center gap-1 cursor-pointer border-none"
                              onClick={async () => {
                                let toastId: string | number | undefined;
                                try {
                                  toastId = toast.loading("Đang hoàn thành giao dịch...");
                                  const actionPromise = 
                                    item.type === "cut" ? completeMaterialCut(item.id) :
                                    item.type === "stock_in" ? completeStockIn(item.id) :
                                    completeStockOut(item.id);
                                  
                                  await actionPromise;
                                  refetchAll();
                                } catch (error) {
                                  console.error(error);
                                } finally {
                                  if (toastId) toast.dismiss(toastId);
                                }
                              }}
                            >
                              <Check className="h-3.5 w-3.5" />
                              Hoàn thành
                            </Button>

                            {/* Cancel Button */}
                            <Button
                              variant="outline"
                              className="h-7 px-2.5 rounded-md border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-rose-600 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                              onClick={async () => {
                                let toastId: string | number | undefined;
                                try {
                                  toastId = toast.loading("Đang hủy giao dịch...");
                                  const actionPromise = 
                                    item.type === "cut" ? cancelMaterialCut(item.id) :
                                    item.type === "stock_in" ? cancelStockIn(item.id) :
                                    cancelStockOut(item.id);
                                  
                                  await actionPromise;
                                  refetchAll();
                                } catch (error) {
                                  console.error(error);
                                } finally {
                                  if (toastId) toast.dismiss(toastId);
                                }
                              }}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Hủy
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        )}

        {/* Search & Transaction Type Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tìm kiếm theo mã chứng từ, ghi chú diễn giải..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 rounded-xl border-slate-200/80 h-10 text-xs focus-visible:ring-emerald-500"
            />
          </div>

          <Select
            value={transactionType}
            onValueChange={(val) => {
              setTransactionType(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[200px] rounded-xl border-slate-200/80 h-10 text-xs focus:ring-emerald-500 cursor-pointer">
              <SelectValue placeholder="Chọn loại giao dịch" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="text-xs cursor-pointer">Tất cả giao dịch</SelectItem>
              <SelectItem value="StockIn" className="text-xs cursor-pointer text-emerald-600 font-semibold">Nhập kho (Stock In)</SelectItem>
              <SelectItem value="StockOut" className="text-xs cursor-pointer text-rose-600 font-semibold">Xuất kho (Stock Out)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Transaction History Ledger Table */}
        <Card className="border-slate-200/60 shadow-sm rounded-2xl overflow-hidden">
          <div className="overflow-x-auto w-full">
            <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-200/60 text-xs font-bold uppercase tracking-wider">
                <TableHead className="font-bold py-2 pl-4 text-left w-[130px]">Thời gian</TableHead>
                <TableHead className="font-bold py-2 text-left w-[100px]">Mã bài</TableHead>
                <TableHead className="font-bold py-2 text-left w-[100px]">kích thước</TableHead>
                <TableHead className="text-right font-bold py-2 w-[130px] whitespace-nowrap">Số lượng tờ ra</TableHead>
                <TableHead className="text-right font-bold py-2 w-[100px]">Số dư đầu</TableHead>
                <TableHead className="text-right font-bold py-2 w-[110px]">Nhập({materialDetail?.unit || "m"})</TableHead>
                <TableHead className="text-right font-bold py-2 w-[110px]">Xuất({materialDetail?.unit || "m"})</TableHead>
                <TableHead className="text-right font-bold py-2 w-[110px]">Hao hụt({materialDetail?.unit || "m"})</TableHead>
                <TableHead className="text-right font-bold py-2 w-[100px]">Tồn</TableHead>
                <TableHead className="font-bold py-2 pr-4 text-left w-[300px]">Ghi chú</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-slate-100">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <TableCell key={j} className="py-4">
                        <Skeleton className="h-5 w-full rounded-md" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="h-32 text-center text-slate-400 text-xs font-semibold py-8"
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <TrendingUp className="h-8 w-8 text-slate-300" />
                      <p>Không có giao dịch nào được ghi nhận trong thời gian này.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((entry, index) => {
                  const txnTypeLower = entry.transactionType?.toLowerCase() || "";
                  const refTypeLower = entry.referenceType?.toLowerCase() || "";
                  const anyEntry = entry as any;

                  const isImp = isImport(entry.transactionType);
                  const isExp = isExport(entry.transactionType);
                  let rowBgClass = "hover:bg-slate-50/80";
                  if (isImp) {
                    rowBgClass = "bg-emerald-50/60 hover:bg-emerald-100/80";
                  } else if (isExp) {
                    rowBgClass = "bg-rose-50/60 hover:bg-rose-100/80";
                  }

                  return (
                    <TableRow
                      key={entry.id || index}
                      className={`cursor-pointer border-b border-slate-100 text-xs transition-colors duration-150 ${rowBgClass}`}
                      onClick={() =>
                        handleVoucherClick(entry.referenceType, entry.referenceId)
                      }
                    >
                      {/* 1. Thời gian */}
                      <TableCell className="py-2 pl-4 font-medium text-slate-600 w-[130px]">
                        {entry.createdAt ? formatDateTime(entry.createdAt) : ""}
                      </TableCell>

                      {/* 2. Mã bài */}
                      <TableCell className="py-2 text-slate-700 font-medium w-[100px]">
                        {anyEntry.jobCode || ""}
                      </TableCell>

                      {/* 3. Kích thước */}
                      <TableCell className="py-2 font-mono text-slate-600 w-[100px]">
                        {anyEntry.dimensions || (anyEntry.cutLength && anyEntry.cutWidth ? `${anyEntry.cutLength}x${anyEntry.cutWidth}` : "")}
                      </TableCell>

                      {/* 4. Số lượng tờ ra */}
                      <TableCell className="text-right py-2 font-bold tabular-nums text-slate-800 w-[130px] whitespace-nowrap">
                        {anyEntry.quantityProduced !== undefined && anyEntry.quantityProduced !== null
                          ? anyEntry.quantityProduced.toLocaleString()
                          : ""}
                      </TableCell>

                      {/* 5. Số dư đầu */}
                      <TableCell className="text-right py-2 font-bold tabular-nums text-slate-500 w-[100px]">
                        {entry.previousQuantity !== undefined ? entry.previousQuantity.toLocaleString() : ""}
                      </TableCell>

                      {/* 6. Nhập */}
                      <TableCell className="text-right py-2 font-bold tabular-nums text-emerald-600 w-[110px]">
                        {isImport(entry.transactionType) && entry.quantity !== undefined
                          ? entry.quantity.toLocaleString()
                          : ""}
                      </TableCell>

                      {/* 7. Xuất */}
                      <TableCell className="text-right py-2 font-bold tabular-nums text-rose-600 w-[110px]">
                        {isExport(entry.transactionType) && entry.quantity !== undefined
                          ? entry.quantity.toLocaleString()
                          : ""}
                      </TableCell>

                      {/* 8. Hao hụt */}
                      <TableCell className="text-right py-2 font-bold tabular-nums text-amber-600 w-[110px]">
                        {isWaste(entry.transactionType) && entry.quantity !== undefined
                          ? entry.quantity.toLocaleString()
                          : ""}
                      </TableCell>

                      {/* 9. Tồn */}
                      <TableCell className="text-right py-2 font-extrabold tabular-nums text-slate-800 w-[100px]">
                        {entry.newQuantity !== undefined ? entry.newQuantity.toLocaleString() : ""}
                      </TableCell>

                      {/* 10. Ghi chú */}
                      <TableCell className="py-2 pr-4 text-slate-600 leading-normal w-[300px] truncate" title={entry.note || ""}>
                        {entry.note || ""}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          </div>
        </Card>

        {/* Pagination */}
        {historyData && historyData.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs font-semibold text-slate-400">
              Trang {currentPage} / {historyData.totalPages} (Tổng số {historyData.total} giao dịch)
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 rounded-lg border-slate-200 hover:bg-slate-50 cursor-pointer font-bold text-xs"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4 mr-1 shrink-0" />
                Trước
              </Button>
              <span className="text-xs font-bold text-slate-700 px-2.5">
                {currentPage}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 rounded-lg border-slate-200 hover:bg-slate-50 cursor-pointer font-bold text-xs"
                onClick={() =>
                  setCurrentPage((p) =>
                    Math.min(historyData.totalPages, p + 1)
                  )
                }
                disabled={currentPage === historyData.totalPages || isLoading}
              >
                Sau
                <ChevronRight className="h-4 w-4 ml-1 shrink-0" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 1. Dialog Cắt nguyên liệu */}
      <MaterialCutDialog
        open={isCutOpen}
        onOpenChange={setIsCutOpen}
        materialId={materialId}
        materialDetail={materialDetail}
        vendorRolls={vendorRolls}
        refetchAll={refetchAll}
      />

      {/* 2. Dialog Nhập kho */}
      <StockInDialog
        open={isStockInOpen}
        onOpenChange={setIsStockInOpen}
        materialId={materialId}
        materialDetail={materialDetail}
        isEditMode={isEditMode}
        editId={editId}
        stockInForm={stockInForm}
        setStockInForm={setStockInForm}
        refetchAll={refetchAll}
      />

      {/* 3. Dialog Xuất kho */}
      <StockOutDialog
        open={isStockOutOpen}
        onOpenChange={setIsStockOutOpen}
        materialId={materialId}
        materialDetail={materialDetail}
        isEditMode={isEditMode}
        editId={editId}
        stockOutForm={stockOutForm}
        setStockOutForm={setStockOutForm}
        refetchAll={refetchAll}
      />
    </>
  );
}
