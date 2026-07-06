import { useState } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Download, Loader2, Calendar as CalendarIcon, FileText } from "lucide-react";
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
import { DateRangePicker } from "@/components/forms/DateRangePicker";
import { useExportAPDetailLedger } from "@/hooks/use-ar-ap";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface APVendorExportButtonProps {
  vendorId: number;
  vendorName: string;
  defaultDateRange?: DateRange;
}

export function APVendorExportButton({ vendorId, vendorName, defaultDateRange }: APVendorExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultDateRange);
  const { mutate: exportDetail, loading: isExporting } = useExportAPDetailLedger();

  const handleExport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await exportDetail(vendorId, {
      fromDate: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
      toDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
      vendorName,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="h-4 w-4" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Xuất sổ chi tiết NCC</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="sm:max-w-[400px]" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <FileText className="h-5 w-5" />
            Xuất sổ chi tiết
          </DialogTitle>
          <DialogDescription className="text-sm">
            Nhà cung cấp: <span className="font-bold text-foreground">{vendorName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Khoảng thời gian
            </Label>
            <DateRangePicker
              value={dateRange}
              onValueChange={setDateRange}
              className="w-full"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isExporting}
          >
            Hủy
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xuất...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Xuất Excel
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
