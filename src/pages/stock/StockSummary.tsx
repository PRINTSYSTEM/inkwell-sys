import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Search,
  Loader2,
  Boxes,
  Download,
  Eye,
  RefreshCw,
  Package,
} from "lucide-react";
import { useMaterials } from "@/hooks/use-material";
import { useActiveVendors } from "@/hooks/use-vendor";
import { toast } from "sonner";
import { DateRangePicker } from "@/components/forms/DateRangePicker";
import { addDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import { downloadBlob } from "@/lib/download-utils";
import { buildFilename, formatDateForFilename } from "@/utils/file-name";
import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "@/apis";

export default function StockSummary() {
  const navigate = useNavigate();

  // Query Parameters & Filter States
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [materialSearchQuery, setMaterialSearchQuery] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Fetch Vendors
  const { data: vendorsData } = useActiveVendors();

  // Fetch Materials
  const {
    data: materialsData,
    isLoading: isLoadingMaterials,
    refetch,
  } = useMaterials({
    page: 1,
    size: 1000,
    search: materialSearchQuery || undefined,
    vendorId: selectedVendorId === "all" ? undefined : Number(selectedVendorId),
  });

  const allMaterials = materialsData?.items || [];

  // Paginated Materials
  const paginatedMaterials = useMemo(() => {
    const start = (page - 1) * pageSize;
    return allMaterials.slice(start, start + pageSize);
  }, [allMaterials, page, pageSize]);

  const totalPages = Math.ceil(allMaterials.length / pageSize) || 1;

  // Export Excel for Stock Summary
  const handleExportSummaryExcel = async () => {
    try {
      setIsExportingExcel(true);
      const res = await apiRequest.get(API_SUFFIX.INVENTORY_SUMMARY_EXCEL, {
        responseType: "blob",
      });
      const filename = buildFilename(
        ["Bang_Tong_Hop_Nhap_Xuat_Ton", formatDateForFilename(new Date())],
        "xlsx"
      );
      downloadBlob(res.data, filename);
      toast.success("Xuất file báo cáo tồn kho tổng hợp thành công");
    } catch (err: any) {
      toast.error("Không thể xuất file báo cáo tồn kho tổng hợp");
    } finally {
      setIsExportingExcel(false);
    }
  };

  const formatNumber = (val: number | null | undefined) => {
    if (val === null || val === undefined || isNaN(val)) return "0";
    return val.toLocaleString("vi-VN");
  };

  const handleRowClick = (materialId: number | undefined) => {
    if (materialId) {
      navigate(`/stock/materials/${materialId}/history`);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-2.5 overflow-hidden">
      <Helmet>
        <title>Bảng tồn kho tổng hợp | Print Production ERP</title>
      </Helmet>

      {/* Page Header */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100/80 flex items-center justify-center text-amber-700 font-bold">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Bảng tồn kho tổng hợp
            </h1>
            <p className="text-xs text-slate-500">
              Bảng tổng hợp nhập xuất tồn nguyên vật liệu và sản phẩm
            </p>
          </div>
        </div>
      </div>

      {/* COMPACT TOOLBAR FILTERS ROW */}
      <div className="shrink-0 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-2.5 text-xs">
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full xl:w-auto flex-1">
          {/* Search Text */}
          <div className="relative w-full sm:w-[260px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <Input
              placeholder="Tìm kiếm mã, tên vật tư..."
              value={materialSearchQuery}
              onChange={(e) => {
                setMaterialSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-8 h-9 text-xs border-slate-200 focus-visible:ring-[#93631F] rounded-lg"
            />
          </div>

          {/* Date Range Picker */}
          <div className="w-full sm:w-[260px] [&_button]:h-9 [&_button]:text-xs [&_button]:rounded-lg [&_button]:border-slate-200">
            <DateRangePicker
              value={dateRange}
              onValueChange={(r) => {
                setDateRange(r);
                setPage(1);
              }}
            />
          </div>

          {/* Vendor Selector */}
          <div className="w-full sm:w-[180px]">
            <Select
              value={selectedVendorId}
              onValueChange={(v) => {
                setSelectedVendorId(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs border-slate-200 rounded-lg cursor-pointer">
                <SelectValue placeholder="Tất cả nhà cung cấp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả nhà cung cấp</SelectItem>
                {vendorsData?.map((v) => (
                  <SelectItem key={v.id} value={v.id.toString()}>
                    {v.name || v.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full xl:w-auto shrink-0 justify-end">
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoadingMaterials}
            className="cursor-pointer border-slate-200 text-xs h-9 rounded-lg hover:bg-slate-50 text-slate-700 font-semibold"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 mr-1.5 ${isLoadingMaterials ? "animate-spin" : ""}`}
            />
            Làm mới
          </Button>

          {/* Export Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSummaryExcel}
            disabled={isExportingExcel}
            className="h-9 text-xs gap-1.5 border-slate-200 font-semibold rounded-lg hover:bg-slate-50 text-slate-700"
          >
            {isExportingExcel ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            Xuất Excel
          </Button>
        </div>
      </div>

      {/* Table Card */}
      <Card className="flex-1 min-h-0 flex flex-col border-slate-200/60 shadow-md rounded-xl overflow-hidden bg-white">
        <CardContent className="p-0 flex-1 min-h-0 flex flex-col overflow-hidden">
          {isLoadingMaterials ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#93631F]" />
              <span className="ml-3 text-slate-600">Đang tải dữ liệu...</span>
            </div>
          ) : allMaterials.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-16 w-16 rounded-full bg-[#93631F]/10 flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-[#93631F]" />
              </div>
              <p className="text-slate-600 font-medium">
                Không tìm thấy vật tư / sản phẩm nào
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Thử thay đổi từ khóa hoặc bộ lọc tìm kiếm
              </p>
            </div>
          ) : (
            <>
              <div className="flex-1 min-h-0 overflow-auto">
                <Table className="text-xs">
                  <TableHeader className="sticky top-0 bg-slate-100/90 backdrop-blur-sm z-10">
                    <TableRow className="border-b border-slate-200/60 whitespace-nowrap">
                      <TableHead className="min-w-[220px] font-semibold text-slate-700">
                        Tên hàng
                      </TableHead>
                      <TableHead className="w-[140px] font-semibold text-slate-700">
                        Mã hàng
                      </TableHead>
                      <TableHead className="w-[120px] text-right font-semibold text-slate-700">
                        Tồn đầu kỳ
                      </TableHead>
                      <TableHead className="w-[120px] text-right font-semibold text-slate-700">
                        Nhập trong kỳ
                      </TableHead>
                      <TableHead className="w-[120px] text-right font-semibold text-slate-700">
                        Xuất trong kỳ
                      </TableHead>
                      <TableHead className="w-[120px] text-right font-semibold text-slate-700">
                        Cuối kỳ
                      </TableHead>
                      <TableHead className="min-w-[160px] font-semibold text-slate-700">
                        Ghi chú
                      </TableHead>
                      <TableHead className="w-[100px] text-right font-semibold text-slate-700">
                        Thao tác
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedMaterials.map((item: any) => {
                      const openingQty =
                        item.openingStock ??
                        item.openingQuantity ??
                        item.beginningBalance ??
                        0;
                      const inQty =
                        item.totalIn ??
                        item.inQuantity ??
                        item.inboundQuantity ??
                        0;
                      const outQty =
                        item.totalOut ??
                        item.outQuantity ??
                        item.outboundQuantity ??
                        0;
                      const closingQty =
                        item.quantityOnHand ??
                        item.closingQuantity ??
                        item.stock ??
                        0;

                      return (
                        <TableRow
                          key={item.id}
                          onClick={() => handleRowClick(item.id)}
                          className="group cursor-pointer hover:bg-[#93631F]/5 transition-colors duration-200 border-b border-slate-100"
                        >
                          <TableCell className="font-semibold text-slate-800">
                            <div>{item.name || item.materialName || "—"}</div>
                            {item.unit && (
                              <span className="text-[10px] text-slate-400 font-normal">
                                ĐVT: {item.unit}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-600">
                            {item.code || item.materialCode || `#${item.id}`}
                          </TableCell>
                          <TableCell className="text-right text-slate-700 tabular-nums font-medium">
                            {formatNumber(openingQty)}
                          </TableCell>
                          <TableCell className="text-right text-emerald-600 tabular-nums font-semibold">
                            {formatNumber(inQty)}
                          </TableCell>
                          <TableCell className="text-right text-amber-600 tabular-nums font-semibold">
                            {formatNumber(outQty)}
                          </TableCell>
                          <TableCell className="text-right text-slate-900 tabular-nums font-bold">
                            {formatNumber(closingQty)}
                          </TableCell>
                          <TableCell className="text-slate-600 text-xs break-words whitespace-normal">
                            {item.notes || item.description || item.note || "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-[#93631F] hover:text-[#7a5118] hover:bg-[#93631F]/10 gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRowClick(item.id);
                              }}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Chi tiết
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination footer */}
              <div className="shrink-0 flex items-center justify-between p-2.5 border-t border-slate-200/60 bg-slate-50/50">
                <div className="text-xs text-slate-600 flex items-center gap-2">
                  <span>
                    Trang <span className="font-semibold">{page}</span> /{" "}
                    <span className="font-semibold">{totalPages}</span>
                  </span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-500">
                    Tổng: {allMaterials.length} sản phẩm / vật tư
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(v) => {
                      setPageSize(Number(v));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[110px] text-xs border-slate-200 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 dòng</SelectItem>
                      <SelectItem value="20">20 dòng</SelectItem>
                      <SelectItem value="50">50 dòng</SelectItem>
                      <SelectItem value="100">100 dòng</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="h-8 text-xs cursor-pointer transition-colors duration-200"
                    >
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="h-8 text-xs cursor-pointer transition-colors duration-200"
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
