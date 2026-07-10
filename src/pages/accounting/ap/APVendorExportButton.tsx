import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useExportAPReconciliation } from "@/hooks/use-ar-ap";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface APVendorExportButtonProps {
  vendorId: number;
  vendorName: string;
  defaultDateRange?: DateRange;
}

export function APVendorExportButton({ vendorId, vendorName, defaultDateRange }: APVendorExportButtonProps) {
  const { mutate: exportRecon, loading: isExporting } = useExportAPReconciliation();

  const handleExport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await exportRecon(vendorId, {
      fromDate: defaultDateRange?.from ? format(defaultDateRange.from, "yyyy-MM-dd") : undefined,
      toDate: defaultDateRange?.to ? format(defaultDateRange.to, "yyyy-MM-dd") : undefined,
      vendorName,
    });
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10 transition-colors"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Xuất đối chiếu công nợ NCC</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
