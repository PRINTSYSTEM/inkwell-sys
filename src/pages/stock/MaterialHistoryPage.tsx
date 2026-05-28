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
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });
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
        jobCode: "—",
        notes: stockOut.notes || "—",
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
                  Lịch sử vật tư: {materialDetail?.name || "—"}
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

        {/* Material Detail Specifications Card (Vertically Compact Strip) */}
        {materialDetail && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50/70 border border-slate-200/50 rounded-2xl text-xs bg-gradient-to-r from-blue-600/[0.015] to-indigo-600/[0.015]">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Boxes className="h-4.5 w-4.5 text-blue-600 shrink-0" />
              <span className="font-bold text-slate-800">{materialDetail.name || "—"}</span>
              <Badge variant="secondary" className="font-medium text-[10px] bg-slate-100 text-slate-700 hover:bg-slate-100 rounded-md border-none px-2 py-0.5">
                {materialDetail.materialTypeName || "—"}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 font-medium">
              <span>Kích thước: <strong className="font-mono text-slate-800">{materialDetail.length || "—"}{materialDetail.width ? `x${materialDetail.width}` : ""}{materialDetail.height ? `x${materialDetail.height}` : ""}</strong></span>
              <span>Người tạo: <strong className="text-slate-700">{materialDetail.createdBy || "—"}</strong></span>
              <span>Ngày tạo: <strong className="text-slate-700">{materialDetail.createdAt ? new Date(materialDetail.createdAt).toLocaleDateString("vi-VN") : "—"}</strong></span>
            </div>
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
            <div className="bg-slate-50/60 p-2.5 rounded-2xl border border-slate-200/50 flex items-center gap-2.5 transition-all duration-300 hover:shadow-sm hover:bg-slate-50">
              <div className="p-1.5 rounded-xl bg-slate-100 text-slate-600">
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
            <div className="bg-emerald-50/[0.3] p-2.5 rounded-2xl border border-emerald-500/10 flex items-center gap-2.5 transition-all duration-300 hover:shadow-sm hover:bg-emerald-50/50">
              <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600">
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
            <div className="bg-rose-50/[0.3] p-2.5 rounded-2xl border border-rose-500/10 flex items-center gap-2.5 transition-all duration-300 hover:shadow-sm hover:bg-rose-50/50">
              <div className="p-1.5 rounded-xl bg-rose-50 text-rose-600">
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
            <div className="bg-amber-50/[0.3] p-2.5 rounded-2xl border border-amber-500/10 flex items-center gap-2.5 transition-all duration-300 hover:shadow-sm hover:bg-amber-50/50">
              <div className="p-1.5 rounded-xl bg-amber-50 text-amber-600">
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
            <div className="bg-blue-50/[0.3] p-2.5 rounded-2xl border border-blue-500/10 flex items-center gap-2.5 transition-all duration-300 hover:shadow-sm hover:bg-blue-50/50">
              <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600">
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
          <div className="space-y-2 bg-[#93631F]/5 border border-[#93631F]/20 p-4 rounded-xl">
            <div className="flex items-center gap-2 pb-2 border-b border-[#93631F]/20">
              <AlertTriangle className="h-4.5 w-4.5 text-[#93631F] shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#93631F]">
                Giao dịch chờ xử lý ({combinedPendingItems.length})
              </h3>
            </div>
            <div className="space-y-2.5">
              {combinedPendingItems.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="bg-white p-3 rounded-lg border border-slate-200/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    {/* Badge */}
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

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800 text-[11px]">{item.code}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {formatDateTime(item.createdAt)}
                        </span>
                      </div>
                      <div className="text-slate-600 mt-1 flex flex-wrap gap-x-4 gap-y-0.5 leading-normal">
                        <span>Số lượng: <strong className="text-slate-800 font-bold tabular-nums">{item.quantity.toLocaleString()}</strong> {(materialDetail?.unit || "").toLowerCase()}</span>
                        {item.type === "cut" && (
                          <>
                            <span>Hao hụt: <strong className="text-slate-800 font-bold tabular-nums">{item.wasted.toLocaleString()}</strong> {(materialDetail?.unit || "").toLowerCase()}</span>
                            <span>Kích thước ra: <strong className="text-slate-800 font-bold font-mono">
                              {item.outputs?.[0]?.outputMaterialName || (item.outputs?.[0] ? `${item.outputs[0].cutLength}x${item.outputs[0].cutWidth}` : "—")}
                            </strong></span>
                          </>
                        )}
                        <span>Mã bài: <strong className="text-slate-700">{item.jobCode}</strong></span>
                      </div>
                      <div className="text-slate-500 italic mt-0.5 truncate max-w-[500px]" title={item.notes}>
                        Ghi chú: {item.notes}
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons for pending voucher */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {/* Pencil Edit button */}
                    {(item.type === "stock_in" || item.type === "stock_out") && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-md border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                        onClick={() => {
                          setIsEditMode(true);
                          setEditId(item.id);
                          if (item.type === "stock_in") {
                            setStockInForm({
                              quantity: item.quantity,
                              documentCode: item.raw.code || "",
                              notes: item.notes || ""
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
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}

                    {/* Complete Button */}
                    <Button
                      className="h-8 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-sm flex items-center gap-1 cursor-pointer border-none"
                      onClick={async () => {
                        try {
                          const actionPromise = 
                            item.type === "cut" ? completeMaterialCut(item.id) :
                            item.type === "stock_in" ? completeStockIn(item.id) :
                            completeStockOut(item.id);
                          
                          toast.promise(actionPromise, {
                            loading: "Đang hoàn thành giao dịch...",
                            success: "Hoàn thành giao dịch thành công!",
                            error: (err) => err?.response?.data?.message || err?.message || "Hoàn thành giao dịch thất bại!"
                          });
                          
                          await actionPromise;
                          refetchAll();
                        } catch (error) {
                          console.error(error);
                        }
                      }}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Hoàn thành
                    </Button>

                    {/* Cancel Button */}
                    <Button
                      variant="outline"
                      className="h-8 px-3 rounded-md border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-rose-600 font-medium text-xs flex items-center gap-1 cursor-pointer"
                      onClick={async () => {
                        try {
                          const actionPromise = 
                            item.type === "cut" ? cancelMaterialCut(item.id) :
                            item.type === "stock_in" ? cancelStockIn(item.id) :
                            cancelStockOut(item.id);
                          
                          toast.promise(actionPromise, {
                            loading: "Đang hủy giao dịch...",
                            success: "Hủy giao dịch thành công!",
                            error: (err) => err?.response?.data?.message || err?.message || "Hủy giao dịch thất bại!"
                          });
                          
                          await actionPromise;
                          refetchAll();
                        } catch (error) {
                          console.error(error);
                        }
                      }}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Hủy
                    </Button>
                  </div>
                </div>
              ))}
            </div>
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
                <TableHead className="font-bold py-2 pl-4 text-left">Thời gian</TableHead>
                <TableHead className="font-bold py-2 text-left">Mã bài</TableHead>
                <TableHead className="font-bold py-2 text-left">Kích thước</TableHead>
                <TableHead className="text-right font-bold py-2">Số lượng tờ ra</TableHead>
                <TableHead className="text-right font-bold py-2">Số dư đầu</TableHead>
                <TableHead className="text-right font-bold py-2">Nhập(m)</TableHead>
                <TableHead className="text-right font-bold py-2">Xuất(m)</TableHead>
                <TableHead className="text-right font-bold py-2">Hao hụt(m)</TableHead>
                <TableHead className="text-right font-bold py-2">Tồn</TableHead>
                <TableHead className="font-bold py-2 pr-4 text-left">Ghi chú</TableHead>
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

                  return (
                    <TableRow
                      key={entry.id || index}
                      className="cursor-pointer hover:bg-emerald-100/50 border-b border-slate-100 text-xs transition-colors duration-150"
                      onClick={() =>
                        handleVoucherClick(entry.referenceType, entry.referenceId)
                      }
                    >
                      {/* 1. Thời gian */}
                      <TableCell className="py-2 pl-4 font-medium text-slate-600">
                        {entry.createdAt ? formatDateTime(entry.createdAt) : "—"}
                      </TableCell>

                      {/* 2. Mã bài */}
                      <TableCell className="py-2 text-slate-700 font-medium">
                        {anyEntry.jobCode || "—"}
                      </TableCell>

                      {/* 3. Kích thước */}
                      <TableCell className="py-2 font-mono text-slate-600">
                        {anyEntry.dimensions || (anyEntry.cutLength && anyEntry.cutWidth ? `${anyEntry.cutLength}x${anyEntry.cutWidth}` : "—")}
                      </TableCell>

                      {/* 4. Số lượng tờ ra */}
                      <TableCell className="text-right py-2 font-bold tabular-nums text-slate-800">
                        {anyEntry.quantityProduced !== undefined && anyEntry.quantityProduced !== null
                          ? anyEntry.quantityProduced.toLocaleString()
                          : "—"}
                      </TableCell>

                      {/* 5. Số dư đầu */}
                      <TableCell className="text-right py-2 font-bold tabular-nums text-slate-500">
                        {entry.previousQuantity !== undefined ? entry.previousQuantity.toLocaleString() : "—"}
                      </TableCell>

                      {/* 6. Nhập(m) */}
                      <TableCell className="text-right py-2 font-bold tabular-nums text-emerald-600">
                        {isImport(entry.transactionType) && entry.quantity !== undefined
                          ? entry.quantity.toLocaleString()
                          : "—"}
                      </TableCell>

                      {/* 7. Xuất(m) */}
                      <TableCell className="text-right py-2 font-bold tabular-nums text-rose-600">
                        {isExport(entry.transactionType) && entry.quantity !== undefined
                          ? entry.quantity.toLocaleString()
                          : "—"}
                      </TableCell>

                      {/* 8. Hao hụt(m) */}
                      <TableCell className="text-right py-2 font-bold tabular-nums text-amber-600">
                        {isWaste(entry.transactionType) && entry.quantity !== undefined
                          ? entry.quantity.toLocaleString()
                          : "—"}
                      </TableCell>

                      {/* 9. Tồn */}
                      <TableCell className="text-right py-2 font-extrabold tabular-nums text-slate-800">
                        {entry.newQuantity !== undefined ? entry.newQuantity.toLocaleString() : "—"}
                      </TableCell>

                      {/* 10. Ghi chú */}
                      <TableCell className="max-w-[280px] py-2 pr-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-50/50 px-1 py-0.5 rounded border border-blue-100/50">
                              {entry.referenceCode || `GD #${entry.id}`}
                            </span>
                            {refTypeLower === "stockin" || txnTypeLower === "stockin" || txnTypeLower === "stock_in" ? (
                              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 rounded-md border-none px-1.5 py-0 font-semibold text-[10px]">
                                Phiếu nhập
                              </Badge>
                            ) : refTypeLower === "stockout" || txnTypeLower === "stockout" || txnTypeLower === "stock_out" ? (
                              <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 rounded-md border-none px-1.5 py-0 font-semibold text-[10px]">
                                Phiếu xuất
                              </Badge>
                            ) : txnTypeLower === "cut_out" ? (
                              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 rounded-md border-none px-1.5 py-0 font-semibold text-[10px]">
                                Xuất cắt
                              </Badge>
                            ) : txnTypeLower === "cut_in" ? (
                              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 rounded-md border-none px-1.5 py-0 font-semibold text-[10px]">
                                Nhập cắt
                              </Badge>
                            ) : txnTypeLower === "waste" ? (
                              <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 rounded-md border-none px-1.5 py-0 font-semibold text-[10px]">
                                Hao hụt
                              </Badge>
                            ) : txnTypeLower === "return_vendor" ? (
                              <Badge className="bg-red-100 text-red-700 hover:bg-red-100 rounded-md border-none px-1.5 py-0 font-semibold text-[10px]">
                                Trả NCC
                              </Badge>
                            ) : txnTypeLower === "transfer" ? (
                              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 rounded-md border-none px-1.5 py-0 font-semibold text-[10px]">
                                Xuất xưởng
                              </Badge>
                            ) : (
                              <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 rounded-md border-none px-1.5 py-0 font-semibold text-[10px]">
                                {entry.referenceType || entry.transactionType || "Điều chỉnh"}
                              </Badge>
                            )}
                          </div>
                          <div className="font-semibold text-slate-850 leading-normal text-xs truncate" title={entry.note || ""}>
                            {entry.note || "—"}
                            {entry.createdByName && (
                              <span className="text-[10px] text-slate-400 ml-2 font-normal">
                                ({entry.createdByName})
                              </span>
                            )}
                          </div>
                        </div>
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
