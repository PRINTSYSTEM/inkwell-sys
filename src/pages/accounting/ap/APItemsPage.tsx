import { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Search,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  FileText,
  Building2,
  ListFilter,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAPItems } from "@/hooks/use-ar-ap";
import { useActiveVendors } from "@/hooks/use-vendor";
import { formatCurrency } from "@/lib/status-utils";
import { toast } from "sonner";

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
};

const translateDocType = (docType: string | null | undefined) => {
  if (!docType) return "Hóa đơn";
  switch (docType) {
    case "StockIn":
      return "Nhập kho vật tư";
    case "StockIn_Labor":
      return "Nhân công nhập kho";
    case "PlateExport":
      return "Xuất kẽm";
    case "PrintingExport":
      return "In gia công";
    case "DieExport":
      return "Xuất khuôn";
    default:
      return docType;
  }
};

const translateVendorType = (type: string | null | undefined) => {
  if (!type) return "—";
  switch (type) {
    case "plate":
      return "NCC Kẽm";
    case "die":
      return "NCC Khuôn";
    case "printing":
      return "NCC In";
    case "material":
      return "NCC Vật tư";
    default:
      return type;
  }
};

export default function APItemsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState<string>("all");
  const [selectedVendorType, setSelectedVendorType] = useState<string>("all");
  const [selectedDocType, setSelectedDocType] = useState<string>("all");
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch vendors for filter dropdown
  const { data: vendors, isLoading: isLoadingVendors } = useActiveVendors();

  // Fetch flat list of unpaid expenses (API #4)
  const {
    data: itemsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useAPItems({
    pageNumber: currentPage,
    pageSize: itemsPerPage,
    search: searchQuery || undefined,
    vendorId: selectedVendorId !== "all" ? Number(selectedVendorId) : undefined,
    vendorType: selectedVendorType !== "all" ? selectedVendorType : undefined,
    documentType: selectedDocType !== "all" ? selectedDocType : undefined,
  });

  const handleExportExcel = () => {
    toast.info("Chức năng xuất excel bảng kê chi phí đang được phát triển.");
  };

  // Calculate summary totals from fetched items
  const totalAmount = itemsData?.items?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
  const totalPaid = itemsData?.items?.reduce((sum, item) => sum + (item.paid || 0), 0) || 0;
  const totalOutstanding = itemsData?.items?.reduce((sum, item) => sum + (item.outstanding || 0), 0) || 0;

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedVendorId("all");
    setSelectedVendorType("all");
    setSelectedDocType("all");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm border-slate-100 bg-slate-50/20">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tổng tiền mua
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold text-slate-800">
              {formatCurrency(totalAmount)}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-green-100 bg-green-50/20">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold text-green-600 uppercase tracking-wider">
              Đã thanh toán
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold text-green-700">
              {formatCurrency(totalPaid)}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-red-100 bg-red-50/20">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold text-red-600 uppercase tracking-wider">
              Còn nợ phải trả
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold text-red-700">
              {formatCurrency(totalOutstanding)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Container */}
      <div className="flex flex-col min-h-0 bg-background rounded-xl border shadow-sm overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b bg-muted/5 flex flex-col xl:flex-row gap-3 items-center justify-between">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 w-full xl:flex-1">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm mã CT, tên khoản chi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>

            {/* Vendor Selector */}
            <Select value={selectedVendorId} onValueChange={(v) => { setSelectedVendorId(v); setCurrentPage(1); }}>
              <SelectTrigger className="h-9 text-sm bg-white border-slate-200">
                <SelectValue placeholder="Chọn nhà cung cấp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả NCC</SelectItem>
                {isLoadingVendors ? (
                  <div className="p-2 text-center text-xs text-muted-foreground italic">
                    Đang tải danh sách...
                  </div>
                ) : (
                  vendors?.map((v) => (
                    <SelectItem key={v.id} value={v.id.toString()}>
                      {v.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {/* Vendor Type Selector */}
            <Select value={selectedVendorType} onValueChange={(v) => { setSelectedVendorType(v); setCurrentPage(1); }}>
              <SelectTrigger className="h-9 text-sm bg-white border-slate-200">
                <SelectValue placeholder="Loại nhà cung cấp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại NCC</SelectItem>
                <SelectItem value="plate">NCC Kẽm (Plate)</SelectItem>
                <SelectItem value="die">NCC Khuôn (Die)</SelectItem>
                <SelectItem value="printing">NCC In (Printing)</SelectItem>
                <SelectItem value="material">NCC Vật tư (Material)</SelectItem>
              </SelectContent>
            </Select>

            {/* Document Type Selector */}
            <Select value={selectedDocType} onValueChange={(v) => { setSelectedDocType(v); setCurrentPage(1); }}>
              <SelectTrigger className="h-9 text-sm bg-white border-slate-200">
                <SelectValue placeholder="Loại chứng từ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả chứng từ</SelectItem>
                <SelectItem value="StockIn">Nhập kho vật tư</SelectItem>
                <SelectItem value="PlateExport">Xuất kẽm</SelectItem>
                <SelectItem value="DieExport">Xuất khuôn</SelectItem>
                <SelectItem value="PrintingExport">In gia công</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 justify-end w-full xl:w-auto">
            <Button variant="outline" size="sm" onClick={handleResetFilters} className="h-9">
              Xóa bộ lọc
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="h-9">
              <RefreshCw className="h-4 w-4 mr-2" /> Làm mới
            </Button>
            <Button variant="default" size="sm" onClick={handleExportExcel} className="h-9">
              <Download className="h-4 w-4 mr-2" /> Xuất Excel
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {isError && (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Lỗi tải dữ liệu</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : "Vui lòng thử lại sau."}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Table Container */}
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Nhà cung cấp</TableHead>
                <TableHead>Số chứng từ</TableHead>
                <TableHead>Tên khoản chi</TableHead>
                <TableHead>Loại chứng từ</TableHead>
                <TableHead className="text-center">Ngày CT</TableHead>
                <TableHead className="text-right">Số tiền</TableHead>
                <TableHead className="text-right">Đã trả</TableHead>
                <TableHead className="text-right font-bold text-red-600">Còn nợ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !itemsData?.items || itemsData.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground italic text-sm">
                    Không tìm thấy khoản chi phí nào phù hợp bộ lọc
                  </TableCell>
                </TableRow>
              ) : (
                itemsData.items.map((item, index) => (
                  <TableRow key={item.documentId || index} className="hover:bg-muted/10">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{item.vendorName || "—"}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Mã: {item.vendorCode || "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-primary">
                      {item.documentCode || "—"}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-slate-700">
                      {item.itemName || "—"}
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {translateDocType(item.documentType)}
                    </TableCell>
                    <TableCell className="text-center font-medium text-xs text-muted-foreground">
                      {item.documentDate ? formatDate(item.documentDate) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-xs">
                      {item.amount !== undefined ? formatCurrency(item.amount) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-green-600 text-xs">
                      {item.paid !== undefined ? formatCurrency(item.paid) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-bold tabular-nums text-red-600 text-xs bg-red-50/10">
                      {item.outstanding !== undefined ? formatCurrency(item.outstanding) : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Container */}
        {itemsData && itemsData.totalPages > 1 && (
          <div className="px-4 py-3 border-t bg-muted/5 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Hiển thị {itemsData.items?.length || 0} / {itemsData.total} dòng chi tiết
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-xs font-medium bg-background border px-3 py-1.5 rounded-md min-w-[80px] text-center">
                Trang {currentPage} / {itemsData.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setCurrentPage((p) => Math.min(itemsData.totalPages, p + 1))}
                disabled={currentPage === itemsData.totalPages || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
