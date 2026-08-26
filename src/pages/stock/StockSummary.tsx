import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Search,
  RefreshCw,
  Loader2,
  Building2,
  Filter,
  ChevronLeft,
  ChevronRight,
  Info,
  FileText,
  AlertCircle,
  Plus,
  Minus,
  Scissors,
  Boxes,
  Download,
  Eye,
  Layers,
  Droplets,
  Wrench,
} from "lucide-react";
import { useMaterials } from "@/hooks/use-material";
import { useActiveVendors } from "@/hooks/use-vendor";
import { useStockOuts } from "@/hooks/use-stock";
import { formatCurrency, formatDate } from "@/lib/status-utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "sonner";
import { SearchableSelect } from "@/components/forms";
import { CreateMaterialDirectDialog } from "./components/CreateMaterialDirectDialog";
import { StockOutByVendorDialog } from "./components/StockOutByVendorDialog";
import { PendingExportsDialog } from "./components/PendingExportsDialog";
import { RecentStockOutsDialog } from "./components/RecentStockOutsDialog";
import { StockOutByProductionOrderDialog } from "./components/StockOutByProductionOrderDialog";
import { downloadBlob } from "@/lib/download-utils";
import { buildFilename, formatDateForFilename } from "@/utils/file-name";
import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "@/apis";

export default function StockSummary() {
  const navigate = useNavigate();

  // API Query Parameters States
  const [pageSize, setPageSize] = useState(10);
  const [materialSearchQuery, setMaterialSearchQuery] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState<string>("all");
  const sortColumn = "id";
  const sortOrder = "desc";

  // Independent Client-side Pagination States for the two columns
  const [rollPage, setRollPage] = useState(1);
  const [sheetPage, setSheetPage] = useState(1);
  const [inkChemPage, setInkChemPage] = useState(1);
  const [accessoryPage, setAccessoryPage] = useState(1);
  const [stockOutPage, setStockOutPage] = useState(1);

  // Fetch Vendors (All active suppliers)
  const { data: vendorsData, isLoading: isLoadingVendors } = useActiveVendors();

  const filteredVendors = useMemo(() => {
    if (!vendorsData) return [];
    return vendorsData.filter((v) => {
      const type = v.vendorType?.toUpperCase();
      return type !== "PLATE" && type !== "DIE" && type !== "PRINTING";
    });
  }, [vendorsData]);

  // Fetch ALL materials for the selected query (up to 1000 items)
  const {
    data: materialsData,
    isLoading: isLoadingMaterials,
    isError,
    error,
    refetch
  } = useMaterials({
    page: 1,
    size: 1000, // Fetch up to 1000 items to get complete dataset
    search: materialSearchQuery || undefined,
    vendorId: selectedVendorId === "all" ? undefined : Number(selectedVendorId),
    sortColumn: sortColumn || undefined,
    sortOrder: sortOrder || undefined,
  });

  const materials = materialsData?.items || [];

  // Date filter for recent stock-outs
  const [stockOutDate, setStockOutDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));

  const stockOutDateParams = useMemo(() => {
    if (!stockOutDate) return { fromDate: undefined, toDate: undefined };
    const start = new Date(stockOutDate + "T00:00:00");
    const end = new Date(stockOutDate + "T23:59:59.999");
    return {
      fromDate: start.toISOString(),
      toDate: end.toISOString(),
    };
  }, [stockOutDate]);

  // Fetch recent stock-out vouchers
  const {
    data: stockOutsData,
    isLoading: isLoadingStockOuts,
    refetch: refetchStockOuts,
  } = useStockOuts({
    pageNumber: stockOutPage,
    pageSize: 10,
    fromDate: stockOutDateParams.fromDate,
    toDate: stockOutDateParams.toDate,
  });

  const totalStockOutPages = stockOutsData?.totalPages || 1;

  const stockOuts = stockOutsData?.items || [];

  const handleRefreshAll = () => {
    refetch();
    refetchStockOuts();
  };

  // Reset independent page counters when query parameters or pageSize changes
  useEffect(() => {
    setRollPage(1);
    setSheetPage(1);
    setInkChemPage(1);
    setAccessoryPage(1);
  }, [selectedVendorId, materialSearchQuery, pageSize]);

  // Create Material Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Stock Out Dialog States
  const [isStockOutOpen, setIsStockOutOpen] = useState(false);

  // Pending Production Exports Dialog States
  const [isPendingExportsOpen, setIsPendingExportsOpen] = useState(false);
  const [prefillStockOutItems, setPrefillStockOutItems] = useState<any[] | undefined>(undefined);

  // Stock Out by Production Order Dialog State
  const [isProductionOrderStockOutOpen, setIsProductionOrderStockOutOpen] = useState(false);

  // Recent Stock Outs Dialog States
  const [isRecentStockOutsOpen, setIsRecentStockOutsOpen] = useState(false);

  // Vendor Reconciliation Excel Export States
  const [isExportingReconciliation, setIsExportingReconciliation] = useState(false);
  const [isExportingStockOutByVendor, setIsExportingStockOutByVendor] = useState(false);
  const [exportMonth, setExportMonth] = useState<string>(format(new Date(), "yyyy-MM"));
  const [isExportMonthDialogOpen, setIsExportMonthDialogOpen] = useState(false);



  // Handle exporting stock-out history by vendor
  const handleExportStockOutByVendor = async () => {
    if (selectedVendorId === "all") {
      toast.error("Vui lòng chọn một Nhà cung cấp ở bộ lọc trước khi xuất lịch sử xuất!");
      return;
    }

    setIsExportingStockOutByVendor(true);
    const vendorId = Number(selectedVendorId);
    const foundVendor = vendorsData?.find((v) => v.id === vendorId);
    const vendorName = foundVendor?.name || `NCC-${vendorId}`;

    try {
      const params: Record<string, string> = {};
      if (exportMonth) {
        const [year, month] = exportMonth.split("-").map(Number);
        const lastDay = new Date(year, month, 0).getDate();
        const lastDayStr = String(lastDay).padStart(2, "0");
        params.fromDate = `${exportMonth}-01`;
        params.toDate = `${exportMonth}-${lastDayStr}`;
      }

      const response = await apiRequest.get(
        API_SUFFIX.STOCK_OUT_BY_VENDOR_EXCEL(vendorId),
        { responseType: "blob", params: Object.keys(params).length > 0 ? params : undefined }
      );

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const monthLabel = exportMonth ? `_${exportMonth}` : "";
      const excelName = buildFilename(
        ["Lịch sử xuất NCC", vendorName + monthLabel, formatDateForFilename(new Date())],
        "xlsx"
      );
      downloadBlob(blob, excelName);
      toast.success(`Đã xuất file lịch sử xuất kho cho ${vendorName} thành công!`);
    } catch (err: any) {
      console.error(err);
      toast.error("Không thể xuất file lịch sử xuất kho. Vui lòng thử lại!");
    } finally {
      setIsExportingStockOutByVendor(false);
    }
  };

  // Handle exporting Vendor Reconciliation Excel
  const handleExportVendorReconciliation = async () => {
    if (selectedVendorId === "all") {
      toast.error("Vui lòng chọn một Nhà cung cấp ở bộ lọc trước khi xuất đối soát!");
      return;
    }

    setIsExportingReconciliation(true);
    const vendorId = Number(selectedVendorId);
    const foundVendor = vendorsData?.find(v => v.id === vendorId);
    const vendorName = foundVendor?.name || `NCC-${vendorId}`;

    try {
      const response = await apiRequest.get(
        API_SUFFIX.VENDOR_RECONCILIATION_EXCEL(vendorId),
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const excelName = buildFilename(["Đối soát nhà cung cấp", vendorName, formatDateForFilename(new Date())], "xlsx");
      downloadBlob(blob, excelName);
      toast.success(`Đã xuất file đối soát cho ${vendorName} thành công!`);
    } catch (err: any) {
      console.error(err);
      toast.error("Không thể xuất file đối soát NCC. Vui lòng thử lại!");
    } finally {
      setIsExportingReconciliation(false);
    }
  };



  // Classify materials: Ink & Chemical (Mực & Hóa chất)
  const INK_CHEM_FAMILY_IDS = [5, 6, 9, 10];
  const allInkChemMaterials = useMemo(() => {
    return materials.filter(item => INK_CHEM_FAMILY_IDS.includes(item.materialFamilyId));
  }, [materials]);

  // Classify materials: Accessories (Phụ tùng)
  const ACCESSORY_FAMILY_IDS = [7, 8, 11];
  const allAccessoryMaterials = useMemo(() => {
    return materials.filter(item => ACCESSORY_FAMILY_IDS.includes(item.materialFamilyId));
  }, [materials]);

  // Classify materials: Roll (Cuộn) vs Sheet (Tờ) - excluding ink/chem and accessories
  const allRollMaterials = useMemo(() => {
    return materials.filter(item => {
      if (INK_CHEM_FAMILY_IDS.includes(item.materialFamilyId) || ACCESSORY_FAMILY_IDS.includes(item.materialFamilyId)) {
        return false;
      }
      const type = (item.type || "").toLowerCase().trim();
      return type === "cuon";
    });
  }, [materials]);

  const allSheetMaterials = useMemo(() => {
    return materials.filter(item => {
      if (INK_CHEM_FAMILY_IDS.includes(item.materialFamilyId) || ACCESSORY_FAMILY_IDS.includes(item.materialFamilyId)) {
        return false;
      }
      const type = (item.type || "").toLowerCase().trim();
      const isRoll = type === "cuon";
      return !isRoll;
    });
  }, [materials]);

  // Paginated Slices for Rolls
  const totalRollPages = Math.ceil(allRollMaterials.length / pageSize) || 1;
  const paginatedRollMaterials = useMemo(() => {
    const startIndex = (rollPage - 1) * pageSize;
    return allRollMaterials.slice(startIndex, startIndex + pageSize);
  }, [allRollMaterials, rollPage, pageSize]);

  // Paginated Slices for Sheets
  const totalSheetPages = Math.ceil(allSheetMaterials.length / pageSize) || 1;
  const paginatedSheetMaterials = useMemo(() => {
    const startIndex = (sheetPage - 1) * pageSize;
    return allSheetMaterials.slice(startIndex, startIndex + pageSize);
  }, [allSheetMaterials, sheetPage, pageSize]);

  // Paginated Slices for Ink & Chemical
  const totalInkChemPages = Math.ceil(allInkChemMaterials.length / pageSize) || 1;
  const paginatedInkChemMaterials = useMemo(() => {
    const startIndex = (inkChemPage - 1) * pageSize;
    return allInkChemMaterials.slice(startIndex, startIndex + pageSize);
  }, [allInkChemMaterials, inkChemPage, pageSize]);

  // Paginated Slices for Accessories
  const totalAccessoryPages = Math.ceil(allAccessoryMaterials.length / pageSize) || 1;
  const paginatedAccessoryMaterials = useMemo(() => {
    const startIndex = (accessoryPage - 1) * pageSize;
    return allAccessoryMaterials.slice(startIndex, startIndex + pageSize);
  }, [allAccessoryMaterials, accessoryPage, pageSize]);

  // Helper to find vendor name by ID
  const getVendorName = (vendorId: number | null | undefined, defaultName: string | null | undefined) => {
    if (!vendorId) return defaultName || "—";
    const foundVendor = vendorsData?.find(v => v.id === vendorId);
    return foundVendor?.name || defaultName || `NCC #${vendorId}`;
  };

  const handleResetFilters = () => {
    setMaterialSearchQuery("");
    setSelectedVendorId("all");
  };

  return (
    <>
      <Helmet>
        <title>Tồn kho tổng hợp | Print Production ERP</title>
        <meta name="description" content="Danh sách tồn kho tổng hợp vật tư cuộn và tờ" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Tồn kho tổng hợp
              </h1>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => {
                  const url = selectedVendorId !== "all"
                    ? `/stock/stock-ins/create?vendorId=${selectedVendorId}`
                    : `/stock/stock-ins/create`;
                  navigate(url);
                }}
                size="sm"
                className="cursor-pointer text-xs h-9 rounded-lg bg-[#93631F] hover:bg-[#7a521a] text-white font-semibold shadow-sm"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Tạo phiếu nhập kho
              </Button>
              <Button
                onClick={() => {
                  setIsStockOutOpen(true);
                }}
                variant="outline"
                size="sm"
                className="cursor-pointer border-slate-200 text-xs h-9 rounded-lg hover:bg-slate-50 text-foreground"
              >
                Tạo phiếu xuất kho
              </Button>
              <Button
                onClick={() => setIsPendingExportsOpen(true)}
                variant="outline"
                size="sm"
                className="cursor-pointer border-rose-200 text-xs h-9 rounded-lg hover:bg-rose-50 text-rose-700 font-semibold"
              >
                <Layers className="h-3.5 w-3.5 mr-1.5 text-rose-500" />
                Bài chưa xuất kho
              </Button>

              <Button
                onClick={() => setIsRecentStockOutsOpen(true)}
                variant="outline"
                size="sm"
                className="cursor-pointer border-slate-200 text-xs h-9 rounded-lg hover:bg-slate-50 text-foreground"
              >
                <FileText className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                Danh sách xuất
              </Button>
              <Button
                onClick={handleExportVendorReconciliation}
                disabled={isExportingReconciliation}
                variant="outline"
                size="sm"
                className="cursor-pointer border-slate-200 text-xs h-9 rounded-lg hover:bg-slate-50 text-foreground"
              >
                {isExportingReconciliation ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                )}
                Đối soát NCC (Excel)
              </Button>
              <Button
                onClick={() => {
                  if (selectedVendorId === "all") {
                    toast.error("Vui lòng chọn một Nhà cung cấp ở bộ lọc trước khi xuất lịch sử xuất!");
                    return;
                  }
                  setIsExportMonthDialogOpen(true);
                }}
                disabled={isExportingStockOutByVendor}
                variant="outline"
                size="sm"
                className="cursor-pointer border-slate-200 text-xs h-9 rounded-lg hover:bg-slate-50 text-foreground"
              >
                {isExportingStockOutByVendor ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                )}
                Lịch sử xuất (Excel)
              </Button>

            </div>
          </div>

          {/* Connection Error Alert */}
          {isError && (
            <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-955 rounded-xl">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <AlertTitle className="font-bold text-red-955">Lỗi gọi API /api/materials</AlertTitle>
              <AlertDescription className="text-red-750 mt-1">
                {error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định."}
              </AlertDescription>
            </Alert>
          )}

          {/* COMPACT TOOLBAR FILTERS ROW */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-2.5 bg-slate-50/60 p-2 rounded-xl border border-slate-200/50 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto flex-1">
              {/* Search Text */}
              <div className="relative w-full sm:w-[280px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Tìm kiếm mã, tên vật tư..."
                  value={materialSearchQuery}
                  onChange={(e) => setMaterialSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs bg-white border-slate-200 focus-visible:ring-primary rounded-lg"
                />
              </div>

              {/* Vendor Selector */}
              <div className="w-full sm:w-[220px]">
                <SearchableSelect
                  value={selectedVendorId}
                  onValueChange={setSelectedVendorId}
                  options={[
                    { value: "all", label: "Tất cả nhà cung cấp" },
                    ...(filteredVendors || []).map((vendor) => ({
                      value: String(vendor.id),
                      label: vendor.name || vendor.code || "",
                    })),
                  ]}
                  placeholder="Chọn nhà cung cấp..."
                  searchPlaceholder="Tìm nhà cung cấp..."
                  disabled={isLoadingVendors}
                  className="h-9 text-xs w-full"
                  popoverWidth="w-[220px]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
              {/* Page Size */}
              <div className="w-[130px]">
                <Select value={String(pageSize)} onValueChange={(val) => setPageSize(Number(val))}>
                  <SelectTrigger className="h-9 text-xs bg-white border-slate-200 rounded-lg cursor-pointer">
                    <SelectValue placeholder="Số dòng hiển thị" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 dòng / trang</SelectItem>
                    <SelectItem value="10">10 dòng / trang</SelectItem>
                    <SelectItem value="20">20 dòng / trang</SelectItem>
                    <SelectItem value="50">50 dòng / trang</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reset Button */}
              {(materialSearchQuery || selectedVendorId !== "all") && (
                <Button
                  onClick={handleResetFilters}
                  variant="ghost"
                  size="sm"
                  className="h-9 text-muted-foreground hover:text-foreground hover:bg-accent text-xs font-semibold px-3 rounded-lg cursor-pointer transition-colors"
                >
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          </div>

          {/* TWO COLUMNS DISPLAY SIDE-BY-SIDE (Cuộn vs Tờ) */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

            {/* COLUMN 1: ROLL MATERIALS (CUỘN) */}
            <Card className="border-slate-200/60 shadow-sm rounded-xl overflow-hidden flex flex-col">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3.5 px-4 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7.5 w-7.5 rounded-md bg-slate-100 flex items-center justify-center text-slate-600">
                    <RefreshCw className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground">
                      VẬT TƯ DẠNG CUỘN
                    </CardTitle>
                    {/* <CardDescription className="text-[10px]">Giấy cuộn, decal cuộn, màng phủ, màng lót...</CardDescription> */}
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full font-semibold border-none">
                  {allRollMaterials.length} loại
                </Badge>
              </CardHeader>

              <CardContent className="p-0 flex-1">
                {isLoadingMaterials ? (
                  <TableSkeletonRows cols={3} />
                ) : paginatedRollMaterials.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-xs">
                    <Info className="h-6 w-6 mb-2 text-slate-300" />
                    <p className="font-medium">Không tìm thấy vật tư dạng cuộn nào</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/50 whitespace-nowrap text-xs border-b border-slate-200/60">
                          <TableHead className="w-[50px] font-bold py-2.5 pl-4">ID</TableHead>
                          <TableHead className="min-w-[120px] font-bold py-2.5">Tên vật tư / Quy cách</TableHead>
                          <TableHead className="w-[80px] text-right font-bold py-2.5 pr-4">Tồn kho</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedRollMaterials.map((item, idx) => (
                          <TableRow
                            key={`${item.id}-${idx}`}
                            className="hover:bg-slate-50 border-b border-slate-100 text-xs cursor-pointer transition-colors duration-150"
                            onClick={() => navigate(`/stock/materials/${item.id}/history`)}
                          >
                            <TableCell className="font-mono font-semibold py-3 pl-4 text-slate-500">
                              #{item.id}
                            </TableCell>
                            <TableCell className="py-3">
                              <div className="font-bold text-slate-800 leading-tight">
                                {item.name}
                              </div>
                              {/* <div className="text-[10px] text-slate-400 mt-1">
                                Khổ: {item.length || "—"}{item.width ? `x${item.width}` : ""} ({item.unit || "cuộn"})
                              </div> */}
                            </TableCell>
                            <TableCell className="text-right py-3 pr-4 font-bold tabular-nums text-slate-800">
                              {(item.currentStock || 0).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Column Specific Pagination */}
                {totalRollPages > 1 && (
                  <div className="flex items-center justify-between p-3 border-t border-slate-100 bg-slate-50/50">
                    <span className="text-[11px] font-medium text-slate-500">
                      Trang {rollPage} / {totalRollPages}
                    </span>
                    <div className="flex gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] px-2.5 cursor-pointer font-semibold"
                        onClick={() => setRollPage(p => Math.max(1, p - 1))}
                        disabled={rollPage === 1 || isLoadingMaterials}
                      >
                        Trước
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] px-2.5 cursor-pointer font-semibold"
                        onClick={() => setRollPage(p => Math.min(totalRollPages, p + 1))}
                        disabled={rollPage === totalRollPages || isLoadingMaterials}
                      >
                        Sau
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* COLUMN 2: SHEET MATERIALS (TỜ / KHÁC) */}
            <Card className="border-slate-200/60 shadow-sm rounded-xl overflow-hidden flex flex-col">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3.5 px-4 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7.5 w-7.5 rounded-md bg-slate-100 flex items-center justify-center text-slate-600">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground">
                      VẬT TƯ DẠNG TỜ
                    </CardTitle>
                    {/* <CardDescription className="text-[10px]">Giấy tờ, decal phẳng, bản kẽm, khuôn mẫu...</CardDescription> */}
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full font-semibold border-none">
                  {allSheetMaterials.length} loại
                </Badge>
              </CardHeader>

              <CardContent className="p-0 flex-1">
                {isLoadingMaterials ? (
                  <TableSkeletonRows cols={3} />
                ) : paginatedSheetMaterials.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-xs">
                    <Info className="h-6 w-6 mb-2 text-slate-300" />
                    <p className="font-medium">Không tìm thấy vật tư dạng tờ nào</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/50 whitespace-nowrap text-xs border-b border-slate-200/60">
                          <TableHead className="w-[50px] font-bold py-2.5 pl-4">ID</TableHead>
                          <TableHead className="min-w-[120px] font-bold py-2.5">Tên vật tư / Quy cách</TableHead>
                          <TableHead className="w-[80px] text-right font-bold py-2.5 pr-4">Tồn kho</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedSheetMaterials.map((item, idx) => (
                          <TableRow
                            key={`${item.id}-${idx}`}
                            className="hover:bg-slate-50 border-b border-slate-100 text-xs cursor-pointer transition-colors duration-150"
                            onClick={() => navigate(`/stock/materials/${item.id}/history`)}
                          >
                            <TableCell className="font-mono font-semibold py-3 pl-4 text-slate-500">
                              #{item.id}
                            </TableCell>
                            <TableCell className="py-3">
                              <div className="font-bold text-slate-800 leading-tight">
                                {item.name}
                              </div>
                              {/* <div className="text-[10px] text-slate-400 mt-1">
                                Khổ: {item.length || "—"}{item.width ? `x${item.width}` : ""} ({item.unit || "tờ"})
                              </div> */}
                            </TableCell>
                            <TableCell className="text-right py-3 pr-4 font-bold tabular-nums text-slate-800">
                              {(item.currentStock || 0).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Column Specific Pagination */}
                {totalSheetPages > 1 && (
                  <div className="flex items-center justify-between p-3 border-t border-slate-100 bg-slate-50/50">
                    <span className="text-[11px] font-medium text-slate-500">
                      Trang {sheetPage} / {totalSheetPages}
                    </span>
                    <div className="flex gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] px-2.5 cursor-pointer font-semibold"
                        onClick={() => setSheetPage(p => Math.max(1, p - 1))}
                        disabled={sheetPage === 1 || isLoadingMaterials}
                      >
                        Trước
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] px-2.5 cursor-pointer font-semibold"
                        onClick={() => setSheetPage(p => Math.min(totalSheetPages, p + 1))}
                        disabled={sheetPage === totalSheetPages || isLoadingMaterials}
                      >
                        Sau
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* TWO COLUMNS: Mực & Hóa chất + Phụ tùng */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

            {/* COLUMN 3: MỰC & HÓA CHẤT */}
            <Card className="border-slate-200/60 shadow-sm rounded-xl overflow-hidden flex flex-col">
              <CardHeader className="bg-blue-50/50 border-b border-blue-100 py-3.5 px-4 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7.5 w-7.5 rounded-md bg-blue-100 flex items-center justify-center text-blue-600">
                    <Droplets className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground">
                      MỰC & HÓA CHẤT
                    </CardTitle>
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full font-semibold border-none">
                  {allInkChemMaterials.length} loại
                </Badge>
              </CardHeader>

              <CardContent className="p-0 flex-1">
                {isLoadingMaterials ? (
                  <TableSkeletonRows cols={4} />
                ) : paginatedInkChemMaterials.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-xs">
                    <Info className="h-6 w-6 mb-2 text-slate-300" />
                    <p className="font-medium">Không tìm thấy mực / hóa chất nào</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-blue-50/30 whitespace-nowrap text-xs border-b border-slate-200/60">
                          <TableHead className="w-[50px] font-bold py-2.5 pl-4">Mã</TableHead>
                          <TableHead className="min-w-[120px] font-bold py-2.5">Tên</TableHead>
                          <TableHead className="font-bold py-2.5">NCC</TableHead>
                          <TableHead className="w-[80px] text-right font-bold py-2.5 pr-4">Tồn kho</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedInkChemMaterials.map((item, idx) => (
                          <TableRow
                            key={`${item.id}-${idx}`}
                            className="hover:bg-blue-50/30 border-b border-slate-100 text-xs cursor-pointer transition-colors duration-150"
                            onClick={() => navigate(`/stock/materials/${item.id}/history`)}
                          >
                            <TableCell className="font-mono font-semibold py-3 pl-4 text-slate-500">
                              #{item.id}
                            </TableCell>
                            <TableCell className="py-3">
                              <div className="font-bold text-slate-800 leading-tight">
                                {item.name}
                              </div>
                              {item.materialTypeName && (
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  {item.materialTypeName}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="py-3 text-slate-600">
                              {getVendorName(item.vendorId, item.vendorName)}
                            </TableCell>
                            <TableCell className="text-right py-3 pr-4 font-bold tabular-nums text-slate-800">
                              {(item.currentStock || 0).toLocaleString()} {item.unit || ""}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {totalInkChemPages > 1 && (
                  <div className="flex items-center justify-between p-3 border-t border-slate-100 bg-slate-50/50">
                    <span className="text-[11px] font-medium text-slate-500">
                      Trang {inkChemPage} / {totalInkChemPages}
                    </span>
                    <div className="flex gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] px-2.5 cursor-pointer font-semibold"
                        onClick={() => setInkChemPage(p => Math.max(1, p - 1))}
                        disabled={inkChemPage === 1 || isLoadingMaterials}
                      >
                        Trước
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] px-2.5 cursor-pointer font-semibold"
                        onClick={() => setInkChemPage(p => Math.min(totalInkChemPages, p + 1))}
                        disabled={inkChemPage === totalInkChemPages || isLoadingMaterials}
                      >
                        Sau
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* COLUMN 4: PHỤ TÙNG */}
            <Card className="border-slate-200/60 shadow-sm rounded-xl overflow-hidden flex flex-col">
              <CardHeader className="bg-amber-50/50 border-b border-amber-100 py-3.5 px-4 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7.5 w-7.5 rounded-md bg-amber-100 flex items-center justify-center text-amber-600">
                    <Wrench className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground">
                      PHỤ TÙNG & VẬT TƯ TIÊU HAO
                    </CardTitle>
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full font-semibold border-none">
                  {allAccessoryMaterials.length} loại
                </Badge>
              </CardHeader>

              <CardContent className="p-0 flex-1">
                {isLoadingMaterials ? (
                  <TableSkeletonRows cols={4} />
                ) : paginatedAccessoryMaterials.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-xs">
                    <Info className="h-6 w-6 mb-2 text-slate-300" />
                    <p className="font-medium">Không tìm thấy phụ tùng / vật tư tiêu hao nào</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-amber-50/30 whitespace-nowrap text-xs border-b border-slate-200/60">
                          <TableHead className="w-[50px] font-bold py-2.5 pl-4">Mã</TableHead>
                          <TableHead className="min-w-[120px] font-bold py-2.5">Tên</TableHead>
                          <TableHead className="font-bold py-2.5">NCC</TableHead>
                          <TableHead className="w-[80px] text-right font-bold py-2.5 pr-4">Tồn kho</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedAccessoryMaterials.map((item, idx) => (
                          <TableRow
                            key={`${item.id}-${idx}`}
                            className="hover:bg-amber-50/30 border-b border-slate-100 text-xs cursor-pointer transition-colors duration-150"
                            onClick={() => navigate(`/stock/materials/${item.id}/history`)}
                          >
                            <TableCell className="font-mono font-semibold py-3 pl-4 text-slate-500">
                              #{item.id}
                            </TableCell>
                            <TableCell className="py-3">
                              <div className="font-bold text-slate-800 leading-tight">
                                {item.name}
                              </div>
                              {item.materialTypeName && (
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  {item.materialTypeName}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="py-3 text-slate-600">
                              {getVendorName(item.vendorId, item.vendorName)}
                            </TableCell>
                            <TableCell className="text-right py-3 pr-4 font-bold tabular-nums text-slate-800">
                              {(item.currentStock || 0).toLocaleString()} {item.unit || ""}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {totalAccessoryPages > 1 && (
                  <div className="flex items-center justify-between p-3 border-t border-slate-100 bg-slate-50/50">
                    <span className="text-[11px] font-medium text-slate-500">
                      Trang {accessoryPage} / {totalAccessoryPages}
                    </span>
                    <div className="flex gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] px-2.5 cursor-pointer font-semibold"
                        onClick={() => setAccessoryPage(p => Math.max(1, p - 1))}
                        disabled={accessoryPage === 1 || isLoadingMaterials}
                      >
                        Trước
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] px-2.5 cursor-pointer font-semibold"
                        onClick={() => setAccessoryPage(p => Math.min(totalAccessoryPages, p + 1))}
                        disabled={accessoryPage === totalAccessoryPages || isLoadingMaterials}
                      >
                        Sau
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </div>

      {/* Dialog Nhập vật tư mới */}
      <CreateMaterialDirectDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        selectedVendorId={selectedVendorId}
        vendorsData={vendorsData}
        refetch={refetch}
      />

      {/* Dialog Xuất kho NCC */}
      <StockOutByVendorDialog
        open={isStockOutOpen}
        onOpenChange={(val) => {
          setIsStockOutOpen(val);
          if (!val) {
            setPrefillStockOutItems(undefined);
          }
        }}
        selectedVendorId={selectedVendorId !== "all" ? Number(selectedVendorId) : null}
        vendors={vendorsData || []}
        refetch={refetch}
        prefillItems={prefillStockOutItems}
      />

      {/* Dialog Bài chưa xuất kho */}
      <PendingExportsDialog
        open={isPendingExportsOpen}
        onOpenChange={setIsPendingExportsOpen}
        vendors={vendorsData || []}
        onInitiateStockOut={(vendorId, jobCode, quantity, paperName, isBoxCarton) => {
          const prefillItems = [];

          // Row 1: The paper (e.g. Duplex/D)
          prefillItems.push({
            materialId: null,
            jobCode,
            quantity,
            notes: jobCode,
            prefillPaperName: paperName,
          });

          // Row 2: Carton if it's Box-Carton
          if (isBoxCarton) {
            prefillItems.push({
              materialId: null,
              jobCode,
              quantity,
              notes: jobCode,
              prefillPaperName: "Carton",
            });
          }

          setPrefillStockOutItems(prefillItems);
          setSelectedVendorId(String(vendorId));
          setIsPendingExportsOpen(false);
          setIsStockOutOpen(true);
        }}
      />

      {/* Dialog Danh sách phiếu xuất kho theo ngày */}
      <RecentStockOutsDialog
        open={isRecentStockOutsOpen}
        onOpenChange={setIsRecentStockOutsOpen}
        stockOuts={stockOuts}
        isLoading={isLoadingStockOuts}
        stockOutDate={stockOutDate}
        onStockOutDateChange={setStockOutDate}
        stockOutPage={stockOutPage}
        onStockOutPageChange={setStockOutPage}
        totalStockOutPages={totalStockOutPages}
        totalCount={stockOutsData?.total || 0}
        onViewDetails={(id) => {
          setIsRecentStockOutsOpen(false);
          navigate(`/stock/stock-outs/${id}`);
        }}
        onViewAll={() => {
          setIsRecentStockOutsOpen(false);
          navigate("/stock/stock-outs");
        }}
        translatePurpose={translatePurpose}
        getStatusBadge={getStatusBadge}
      />

      {/* Dialog Xuất kho theo lệnh SX */}
      <StockOutByProductionOrderDialog
        open={isProductionOrderStockOutOpen}
        onOpenChange={setIsProductionOrderStockOutOpen}
        refetch={refetch}
      />

      {/* Month Selection Dialog for Export */}
      <Dialog open={isExportMonthDialogOpen} onOpenChange={setIsExportMonthDialogOpen}>
        <DialogContent className="max-w-md w-[95vw] rounded-xl border-slate-200 shadow-xl p-5 bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-800">
              Chọn tháng xuất lịch sử
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Vui lòng chọn tháng cần xuất lịch sử xuất kho của nhà cung cấp.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label className="text-xs font-bold text-slate-700">Chọn tháng</Label>
            <Input
              type="month"
              value={exportMonth}
              onChange={(e) => setExportMonth(e.target.value)}
              className="h-10 text-xs border-slate-200 rounded-lg focus-visible:ring-rose-500 w-full bg-white"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExportMonthDialogOpen(false)}
              className="text-xs h-9 rounded-lg cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setIsExportMonthDialogOpen(false);
                handleExportStockOutByVendor();
              }}
              className="text-xs h-9 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
            >
              Xuất Excel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
}

const translatePurpose = (purpose: string | null | undefined) => {
  if (!purpose) return "—";
  const p = purpose.toLowerCase();
  switch (p) {
    case "sale":
      return "Bán hàng";
    case "production":
      return "Sản xuất";
    case "adjustment":
    case "manual":
      return "Điều chỉnh";
    case "outsource":
    case "outsource_print":
      return "In gia công";
    case "return_vendor":
      return "Trả hàng NCC";
    default:
      return purpose;
  }
};

const getStatusBadge = (status: string | null | undefined) => {
  if (!status) return <StatusBadge status="unknown" label="—" />;
  const statusLower = status.toLowerCase();
  if (statusLower === "draft" || statusLower.includes("draft")) {
    return <StatusBadge status="draft" label="Nháp" />;
  }
  if (statusLower === "pending" || statusLower.includes("pending")) {
    return <StatusBadge status="pending" label="Chờ xử lý" />;
  }
  if (statusLower === "completed" || statusLower.includes("completed")) {
    return <StatusBadge status="completed" label="Hoàn thành" />;
  }
  if (statusLower === "cancelled" || statusLower.includes("cancelled")) {
    return <StatusBadge status="cancelled" label="Đã hủy" />;
  }
  return <StatusBadge status={status} label={status} />;
};

// Skeletal loading helper for tables
function TableSkeletonRows({ cols }: { cols: number }) {
  return (
    <div className="p-4 space-y-2.5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
