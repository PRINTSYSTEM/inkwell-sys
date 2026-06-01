import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
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
  Layers,
  FileText,
  AlertCircle,
  Plus,
  Scissors,
  Boxes,
  Download
} from "lucide-react";
import { useMaterials } from "@/hooks/use-material";
import { useActiveVendors } from "@/hooks/use-vendor";
import { formatCurrency } from "@/lib/status-utils";
import { toast } from "sonner";
import { CreateMaterialDirectDialog } from "./components/CreateMaterialDirectDialog";
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

  // Reset independent page counters when query parameters or pageSize changes
  useEffect(() => {
    setRollPage(1);
    setSheetPage(1);
  }, [selectedVendorId, materialSearchQuery, pageSize]);

  // Create Material Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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
              <h1 className="text-2xl font-bold tracking-tight text-slate-800">
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
                size="sm"
                className="cursor-pointer border border-[#93631F] bg-transparent hover:bg-[#93631F]/5 text-[#93631F] hover:text-[#7a521a] font-semibold text-xs h-9 rounded-lg transition-all duration-200"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Nhập vật tư mới
              </Button>
              <Button 
                onClick={() => refetch()}
                disabled={isLoadingMaterials}
                variant="outline"
                size="sm"
                className="cursor-pointer border-slate-200 text-xs h-9 rounded-lg"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoadingMaterials ? "animate-spin" : ""}`} />
                Làm mới
              </Button>
              <Button 
                onClick={() => navigate("/stock/stock-ins")}
                size="sm"
                className="cursor-pointer transition-all duration-200 bg-[#93631F] hover:bg-[#7a521a] text-white shadow-sm text-xs h-9 border-none rounded-lg"
              >
                Quản lý nhập kho
              </Button>
              <Button 
                onClick={handleExportVendorReconciliation}
                disabled={isExportingReconciliation}
                size="sm"
                className="cursor-pointer border border-[#93631F]/40 bg-transparent hover:bg-[#93631F]/5 text-[#93631F] font-semibold text-xs h-9 rounded-lg transition-all duration-200"
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

          {/* FILTERS PANEL AT THE TOP */}
          <Card className="border-slate-200/60 shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="bg-[#93631F]/5 border-b border-slate-200/60 py-1.5 px-6 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2 text-[#93631F]">
                <Filter className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Bộ lọc</span>
              </div>
              <Button
                onClick={handleResetFilters}
                variant="ghost"
                size="sm"
                className="text-[#93631F] hover:text-[#7a521a] hover:bg-[#93631F]/10 text-[10px] font-bold cursor-pointer h-7 px-2.5 rounded-md transition-colors"
              >
                Xóa bộ lọc (Reset)
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              
              {/* Primary Filters Grid with items-end to ensure perfect alignment */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
                
                {/* Search Text */}
                <div className="space-y-1.5 w-full">
                  <label className="text-xs font-bold text-slate-600 block">Từ khóa tìm kiếm</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      placeholder="Mã, tên chất vật tư..."
                      value={materialSearchQuery}
                      onChange={(e) => {
                        setMaterialSearchQuery(e.target.value);
                      }}
                      className="pl-9 h-10 text-xs border-slate-200 focus-visible:ring-[#93631F]"
                    />
                  </div>
                </div>

                {/* Vendor Dropdown Selector */}
                <div className="space-y-1.5 w-full">
                  <label className="text-xs font-bold text-slate-600 block">Nhà cung cấp</label>
                  <Select
                    value={selectedVendorId}
                    onValueChange={(val) => {
                      setSelectedVendorId(val);
                    }}
                  >
                    <SelectTrigger className="h-10 text-xs cursor-pointer border-slate-200">
                      <SelectValue placeholder="Chọn nhà cung cấp" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả nhà cung cấp</SelectItem>
                      {isLoadingVendors ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin text-[#93631F]" />
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

                {/* Page Size (Hiển thị) */}
                <div className="space-y-1.5 w-full">
                  <label className="text-xs font-bold text-slate-600 block">Hiển thị</label>
                  <Select value={String(pageSize)} onValueChange={(val) => {
                    setPageSize(Number(val));
                  }}>
                    <SelectTrigger className="h-10 text-xs cursor-pointer border-slate-200">
                      <SelectValue placeholder="Số dòng" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 dòng / trang</SelectItem>
                      <SelectItem value="10">10 dòng / trang</SelectItem>
                      <SelectItem value="20">20 dòng / trang</SelectItem>
                      <SelectItem value="50">50 dòng / trang</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

              </div>

            </CardContent>
          </Card>

          {/* TWO COLUMNS DISPLAY SIDE-BY-SIDE (Cuộn vs Tờ) */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
            
            {/* COLUMN 1: ROLL MATERIALS (CUỘN) */}
            <Card className="border-slate-200/60 shadow-sm rounded-xl overflow-hidden flex flex-col">
              <CardHeader className="bg-[#93631F]/5 border-b border-slate-200/60 py-3.5 px-4 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7.5 w-7.5 rounded-md bg-[#93631F]/15 flex items-center justify-center text-[#93631F]">
                    <RefreshCw className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-800">
                      VẬT TƯ DẠNG CUỘN
                    </CardTitle>
                    <CardDescription className="text-[10px]">Giấy cuộn, decal cuộn, màng phủ, màng lót...</CardDescription>
                  </div>
                </div>
                <Badge className="bg-[#93631F] hover:bg-[#7a521a] text-white text-[10px] px-2 py-0.5 rounded-full font-semibold border-none">
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
                            className="hover:bg-emerald-100/80 border-b border-slate-100 text-xs cursor-pointer transition-colors duration-150"
                            onClick={() => navigate(`/stock/materials/${item.id}/history`)}
                          >
                            <TableCell className="font-mono font-bold py-3 pl-4 text-[#93631F]">
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
              <CardHeader className="bg-blue-500/5 border-b border-slate-200/60 py-3.5 px-4 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7.5 w-7.5 rounded-md bg-blue-100 flex items-center justify-center text-blue-600">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-800">
                      VẬT TƯ DẠNG TỜ / KHÁC
                    </CardTitle>
                    <CardDescription className="text-[10px]">Giấy tờ, decal phẳng, bản kẽm, khuôn mẫu...</CardDescription>
                  </div>
                </div>
                <Badge className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold border-none">
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
                            className="hover:bg-emerald-100/80 border-b border-slate-100 text-xs cursor-pointer transition-colors duration-150"
                            onClick={() => navigate(`/stock/materials/${item.id}/history`)}
                          >
                            <TableCell className="font-mono font-bold py-3 pl-4 text-blue-600">
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


    </>
  );
}

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
