import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Eye
} from "lucide-react";
import { useMaterials } from "@/hooks/use-material";
import { useActiveVendors } from "@/hooks/use-vendor";
import { useStockOuts } from "@/hooks/use-stock";
import { formatCurrency, formatDate } from "@/lib/status-utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "sonner";
import { CreateMaterialDirectDialog } from "./components/CreateMaterialDirectDialog";
import { StockOutByVendorDialog } from "./components/StockOutByVendorDialog";
import { downloadBlob } from "@/lib/download-utils";
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
  const [stockOutPage, setStockOutPage] = useState(1);

  // Fetch Vendors (Material suppliers only)
  const { data: vendorsData, isLoading: isLoadingVendors } = useActiveVendors("material");

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
  }, [selectedVendorId, materialSearchQuery, pageSize]);

  // Create Material Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Stock Out Dialog States
  const [isStockOutOpen, setIsStockOutOpen] = useState(false);

  // Vendor Reconciliation Excel Export States
  const [isExportingReconciliation, setIsExportingReconciliation] = useState(false);



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
      
      downloadBlob(blob, `doi-soat-${vendorName}-${new Date().getTime()}.xlsx`);
      toast.success(`Đã xuất file đối soát cho ${vendorName} thành công!`);
    } catch (err: any) {
      console.error(err);
      toast.error("Không thể xuất file đối soát NCC. Vui lòng thử lại!");
    } finally {
      setIsExportingReconciliation(false);
    }
  };



  // Classify materials: Roll (Cuộn) vs Sheet (Tờ / Khác)
  const allRollMaterials = useMemo(() => {
    return materials.filter(item => {
      const unit = (item.unit || "").toLowerCase();
      const name = (item.name || "").toLowerCase();
      return unit.includes("cuộn") || unit.includes("cuon") || name.includes("cuộn") || name.includes("cuon");
    });
  }, [materials]);

  const allSheetMaterials = useMemo(() => {
    return materials.filter(item => {
      const unit = (item.unit || "").toLowerCase();
      const name = (item.name || "").toLowerCase();
      const isRoll = unit.includes("cuộn") || unit.includes("cuon") || name.includes("cuộn") || name.includes("cuon");
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
              <p className="text-xs text-muted-foreground mt-0.5">
                Danh sách tổng hợp tồn kho vật tư cuộn và tờ
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={() => {
                  if (selectedVendorId === "all") {
                    toast.error("Vui lòng chọn một Nhà cung cấp ở bộ lọc trước khi nhập vật tư mới!");
                    return;
                  }
                  setIsCreateOpen(true);
                }}
                variant="outline"
                size="sm"
                className="cursor-pointer border-slate-200 text-xs h-9 rounded-lg hover:bg-slate-50 text-foreground"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Nhập vật tư mới
              </Button>
              <Button 
                onClick={() => {
                  if (selectedVendorId === "all") {
                    toast.error("Vui lòng chọn một Nhà cung cấp ở bộ lọc trước khi thực hiện xuất kho!");
                    return;
                  }
                  setIsStockOutOpen(true);
                }}
                variant="outline"
                size="sm"
                className="cursor-pointer border-slate-200 text-xs h-9 rounded-lg hover:bg-slate-50 text-foreground"
              >
                <Minus className="h-3.5 w-3.5 mr-1.5 text-rose-600" />
                Xuất kho NCC
              </Button>
              <Button 
                onClick={handleRefreshAll}
                disabled={isLoadingMaterials || isLoadingStockOuts}
                variant="outline"
                size="sm"
                className="cursor-pointer border-slate-200 text-xs h-9 rounded-lg"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoadingMaterials || isLoadingStockOuts ? "animate-spin" : ""}`} />
                Làm mới
              </Button>

              <Button 
                onClick={() => navigate("/stock/stock-outs")}
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
                <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                  <SelectTrigger className="h-9 text-xs bg-white border-slate-200 rounded-lg cursor-pointer">
                    <SelectValue placeholder="Chọn nhà cung cấp" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả nhà cung cấp</SelectItem>
                    {isLoadingVendors ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      </div>
                    ) : (
                      vendorsData?.map((vendor) => (
                        <SelectItem key={vendor.id} value={String(vendor.id)}>
                          {vendor.name || vendor.code}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
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
                          <TableHead className="min-w-[120px] font-bold py-2.5">Tên vật tư</TableHead>
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
                      VẬT TƯ DẠNG TỜ / KHÁC
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
                          <TableHead className="min-w-[120px] font-bold py-2.5">Tên vật tư</TableHead>
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

          {/* Recent Stock-Outs List (Vertical Layout) */}
          <Card className="border-slate-200/60 shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3.5 px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="h-7.5 w-7.5 rounded-md bg-slate-100 flex items-center justify-center text-slate-600">
                  <FileText className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm font-bold text-foreground">
                  PHIẾU XUẤT KHO THEO NGÀY
                </CardTitle>
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto self-stretch sm:self-auto justify-end">
                <div className="relative">
                  <Input
                    type="date"
                    value={stockOutDate}
                    onChange={(e) => {
                      setStockOutDate(e.target.value);
                      setStockOutPage(1);
                    }}
                    className="h-8 text-xs bg-white border-slate-200 rounded-lg pr-2 cursor-pointer focus-visible:ring-[#93631F]"
                  />
                </div>
                {stockOutDate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStockOutDate("");
                      setStockOutPage(1);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground cursor-pointer h-8 rounded-lg px-2"
                  >
                    Xóa ngày
                  </Button>
                )}
                <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/stock/stock-outs")}
                  className="text-xs text-[#93631F] font-semibold hover:bg-slate-100 cursor-pointer h-8 rounded-lg"
                >
                  Xem tất cả
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {isLoadingStockOuts ? (
                <TableSkeletonRows cols={7} />
              ) : stockOuts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-xs">
                  <Info className="h-6 w-6 mb-2 text-slate-300" />
                  <p className="font-medium">Chưa có phiếu xuất kho nào được ghi nhận</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/50 whitespace-nowrap text-xs border-b border-slate-200/60">
                          <TableHead className="w-[120px] font-bold py-2.5 pl-4">Số phiếu</TableHead>
                          <TableHead className="w-[120px] font-bold py-2.5">Ngày xuất</TableHead>
                          <TableHead className="min-w-[140px] font-bold py-2.5">Loại Phiếu</TableHead>
                          <TableHead className="min-w-[200px] font-bold py-2.5">Khách hàng / Đối tác</TableHead>
                          <TableHead className="w-[150px] font-bold py-2.5">Kho xuất</TableHead>
                          <TableHead className="w-[120px] text-center font-bold py-2.5">Trạng thái</TableHead>
                          <TableHead className="w-[60px] text-center font-bold py-2.5 pr-4">Xem</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stockOuts.map((item: any) => (
                          <TableRow
                            key={item.id}
                            className="hover:bg-slate-50 border-b border-slate-100 text-xs cursor-pointer transition-colors duration-150"
                            onClick={() => navigate(`/stock/stock-outs/${item.id}`)}
                          >
                            <TableCell className="font-mono font-bold py-3 pl-4 text-slate-800">
                              {item.code || `PXK-${item.id}`}
                            </TableCell>
                            <TableCell className="py-3 text-slate-600">
                              {item.stockOutDate ? formatDate(item.stockOutDate) : "—"}
                            </TableCell>
                            <TableCell className="py-3 font-semibold text-slate-700">
                              {translatePurpose(item.purposeName || item.purpose || item.type)}
                            </TableCell>
                            <TableCell className="py-3 text-slate-600 truncate max-w-[200px]" title={item.customer?.name || item.vendorName || item.vendor?.name || item.supplier?.name || "—"}>
                              {item.customer?.name || item.vendorName || item.vendor?.name || item.supplier?.name || "—"}
                            </TableCell>
                            <TableCell className="py-3 text-slate-600">
                              {item.warehouse || item.warehouseName || "—"}
                            </TableCell>
                            <TableCell className="py-3 text-center">
                              <div className="inline-flex justify-center w-full">
                                {getStatusBadge(item.status)}
                              </div>
                            </TableCell>
                            <TableCell className="py-3 text-center pr-4" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                                onClick={() => navigate(`/stock/stock-outs/${item.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Stock Out Specific Pagination */}
                  {totalStockOutPages > 1 && (
                    <div className="flex items-center justify-between p-3 border-t border-slate-100 bg-slate-50/50">
                      <span className="text-[11px] font-medium text-slate-500">
                        Trang {stockOutPage} / {totalStockOutPages} ({stockOutsData?.total || 0} phiếu)
                      </span>
                      <div className="flex gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[10px] px-2.5 cursor-pointer font-semibold"
                          onClick={() => setStockOutPage(p => Math.max(1, p - 1))}
                          disabled={stockOutPage === 1 || isLoadingStockOuts}
                        >
                          Trước
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[10px] px-2.5 cursor-pointer font-semibold"
                          onClick={() => setStockOutPage(p => Math.min(totalStockOutPages, p + 1))}
                          disabled={stockOutPage === totalStockOutPages || isLoadingStockOuts}
                        >
                          Sau
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

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
        onOpenChange={setIsStockOutOpen}
        selectedVendorId={selectedVendorId !== "all" ? Number(selectedVendorId) : null}
        vendors={vendorsData || []}
        refetch={refetch}
      />


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
