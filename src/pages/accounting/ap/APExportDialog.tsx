import { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { Download, Loader2, Calendar as CalendarIcon, Search, Building2, ListFilter, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DateRangePicker } from "@/components/forms/DateRangePicker";
import { useExportAPSummary, useExportAPDetailLedger } from "@/hooks/use-ar-ap";
import { useActiveVendors } from "@/hooks/use-vendor";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function APExportDialog() {
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState<"summary" | "detail">("summary");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { mutate: exportSummary, loading: isExportingSummary } = useExportAPSummary();
  const { mutate: exportDetail, loading: isExportingDetail } = useExportAPDetailLedger();
  const { data: vendors, isLoading: isLoadingVendors } = useActiveVendors();

  const isExporting = isExportingSummary || isExportingDetail;

  const handleExport = async () => {
    if (reportType === "detail" && selectedVendorId === "all") {
      toast.error("Vui lòng chọn một nhà cung cấp cụ thể để xuất sổ chi tiết.");
      return;
    }

    const fromDate = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined;
    const toDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined;

    if (reportType === "summary") {
      await exportSummary({
        fromDate,
        toDate,
        vendorId: selectedVendorId !== "all" ? parseInt(selectedVendorId) : undefined,
        searchTerm: searchTerm || undefined,
      });
    } else {
      await exportDetail(parseInt(selectedVendorId), {
        fromDate,
        toDate,
      });
    }
    
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-600 to-indigo-600 border-none">
          <Download className="h-4 w-4" />
          Xuất báo cáo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] border-none shadow-2xl overflow-hidden p-0">
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        
        <div className="p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              Xuất báo cáo công nợ
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Cấu hình các bộ lọc bên dưới để tải file báo cáo Excel.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Report Type Selection */}
            <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <Label className="text-sm font-bold flex items-center gap-2 text-slate-700 uppercase tracking-wider">
                <ListFilter className="h-4 w-4 text-blue-500" />
                Loại báo cáo
              </Label>
              <RadioGroup 
                value={reportType} 
                onValueChange={(v) => setReportType(v as "summary" | "detail")}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="summary" id="summary" className="peer sr-only" />
                  <Label
                    htmlFor="summary"
                    className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-white p-4 hover:bg-slate-50 peer-data-[state=checked]:border-blue-500 [&:has([data-state=checked])]:border-blue-500 cursor-pointer transition-all"
                  >
                    <FileText className="mb-2 h-6 w-6 text-slate-500" />
                    <span className="text-xs font-bold">Báo cáo tổng hợp</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="detail" id="detail" className="peer sr-only" />
                  <Label
                    htmlFor="detail"
                    className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-white p-4 hover:bg-slate-50 peer-data-[state=checked]:border-blue-500 [&:has([data-state=checked])]:border-blue-500 cursor-pointer transition-all"
                  >
                    <ListFilter className="mb-2 h-6 w-6 text-slate-500" />
                    <span className="text-xs font-bold">Sổ chi tiết NCC</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                <CalendarIcon className="h-4 w-4 text-blue-500" />
                Khoảng thời gian
              </Label>
              <DateRangePicker
                date={dateRange}
                onDateChange={setDateRange}
                className="w-full"
              />
            </div>

            {/* Vendor Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                <Building2 className="h-4 w-4 text-indigo-500" />
                Nhà cung cấp {reportType === "detail" && <span className="text-red-500">*</span>}
              </Label>
              <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                <SelectTrigger className="w-full h-10 bg-white border-slate-200 focus:ring-blue-500">
                  <SelectValue placeholder="Chọn nhà cung cấp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" disabled={reportType === "detail"}>
                    {reportType === "detail" ? "Vui lòng chọn nhà cung cấp" : "Tất cả nhà cung cấp"}
                  </SelectItem>
                  {isLoadingVendors ? (
                    <div className="p-2 text-center text-xs text-slate-500 italic">
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
            </div>

            {/* Search Term - Only for Summary */}
            {reportType === "summary" && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                  <Search className="h-4 w-4 text-purple-500" />
                  Từ khóa tìm kiếm
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Nhập mã hoặc tên nhà cung cấp..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 bg-white border-slate-200"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="bg-slate-50 p-6 border-t flex items-center justify-between sm:justify-between">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            className="hover:bg-slate-200 text-slate-600"
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || (reportType === "detail" && selectedVendorId === "all")}
            className="min-w-[140px] bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-blue-500/25 transition-all"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xuất...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Tải file Excel
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
