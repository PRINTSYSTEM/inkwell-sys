import { useState } from "react";
import { Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useExportDebt } from "@/hooks/use-accounting";
import type { ExportDebtRequest } from "@/Schema/accounting.schema";

type DebtFilterType = "payment" | "invoice";

interface ExportDebtModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: number;
}

export function ExportDebtModal({
  open,
  onOpenChange,
  customerId,
}: ExportDebtModalProps) {
  const [filterType, setFilterType] = useState<DebtFilterType>("payment");
  const [startDate, setStartDate] = useState<Date>(
    new Date(new Date().getFullYear(), 0, 1) // First day of current year
  );
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [includeMonthly, setIncludeMonthly] = useState(true);

  const exportDebt = useExportDebt();

  const handleExport = async () => {
    await exportDebt.mutate({
      customerId,
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Xuất công nợ</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Filter Type */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Loại công nợ</Label>
            <div className="flex bg-muted rounded-lg p-1">
              <Button
                variant={filterType === "payment" ? "secondary" : "ghost"}
                size="sm"
                className="flex-1 h-8"
                onClick={() => setFilterType("payment")}
              >
                Thanh toán
              </Button>
              <Button
                variant={filterType === "invoice" ? "secondary" : "ghost"}
                size="sm"
                className="flex-1 h-8"
                onClick={() => setFilterType("invoice")}
              >
                Hóa đơn
              </Button>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Từ ngày</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-9",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate
                      ? format(startDate, "dd/MM/yyyy", { locale: vi })
                      : "Chọn ngày"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    locale={vi}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Đến ngày</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-9",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate
                      ? format(endDate, "dd/MM/yyyy", { locale: vi })
                      : "Chọn ngày"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    locale={vi}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Include Monthly */}
          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label className="text-sm">Bao gồm so sánh theo tháng</Label>
              <p className="text-xs text-muted-foreground">
                Thêm bảng tổng hợp công nợ theo từng tháng
              </p>
            </div>
            <Switch
              checked={includeMonthly}
              onCheckedChange={setIncludeMonthly}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button onClick={handleExport} disabled={exportDebt.loading}>
              <Download className="h-4 w-4 mr-1.5" />
              {exportDebt.loading ? "Đang xuất..." : "Tải xuống"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
