import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Package, Edit, History, Loader2, Info } from "lucide-react";
import { format } from "date-fns";

interface DetailPlateExportCardProps {
  order: any;
  setEditingPlateExport: (plate: any) => void;
  setIsPlateExportDialogOpen: (val: boolean) => void;
  handleHandToProduction: () => void;
  isHandingToProduction: boolean;
}

export function DetailPlateExportCard({
  order,
  setEditingPlateExport,
  setIsPlateExportDialogOpen,
  handleHandToProduction,
  isHandingToProduction,
}: DetailPlateExportCardProps) {
  if (!order) return null;

  const plateExport = order.plateExport;

  return (
    <Card className="relative h-full flex flex-col">
      <div className="absolute top-1 right-1 bg-orange-600 text-white text-[11px] px-1.5 py-0.5 rounded shadow-sm z-[100] font-mono pointer-events-none opacity-80">
        DetailPlateExportCard.tsx
      </div>

      <CardHeader className="pb-1.5 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Package className="h-3.5 w-3.5" />
            Xuất bản kẽm
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 flex-1 flex flex-col">
        {!order.isPlateExported ? (
          <div className="flex flex-col items-center py-6 space-y-4 bg-muted/20 rounded-lg border border-dashed border-muted-foreground/20">
            <div className="text-center space-y-1">
              <p className="font-bold text-sm text-muted-foreground">Chưa có thông tin xuất kẽm</p>
              <p className="text-[11px] text-muted-foreground/60">Ghi nhận thông tin để tiếp tục</p>
            </div>
            {order.status !== "completed" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPlateExportDialogOpen(true)}
                className="h-8 px-4 text-xs font-bold rounded-full"
              >
                Ghi nhận ngay
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2 flex-1 flex flex-col">
            <div className="flex items-center gap-2 px-1 mb-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
              <span className="font-bold text-green-600 uppercase tracking-tight text-[10px]">Đã xuất kẽm</span>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground text-[10px] font-normal uppercase tracking-tight shrink-0">NCC</Label>
                <p className="font-bold text-[12px] truncate">
                  {plateExport?.vendorName || plateExport?.plateVendor?.name || "Tâm An"}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground text-[10px] font-normal uppercase tracking-tight shrink-0">Số lượng</Label>
                <div className="flex items-center gap-1">
                  <p className="font-bold text-[12px]">
                    {plateExport?.plateCount || 0}
                  </p>
                  <span className="text-[10px] text-muted-foreground font-medium">bản</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground text-[10px] font-normal uppercase tracking-tight shrink-0">Ngày tạo</Label>
                <p className="font-bold text-[11px]">
                  {plateExport?.createdAt || plateExport?.exportedAt
                    ? format(new Date(plateExport.createdAt || plateExport.exportedAt), "dd/MM/yyyy HH:mm")
                    : "—"}
                </p>
              </div>
            </div>

            {/* Ghi chú */}
            <div className="p-2 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded text-xs mt-0.5">
              <div className="flex items-start gap-1.5">
                <Info className="h-3 w-3 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-blue-900 dark:text-blue-100 text-[10px] mb-0.5 uppercase tracking-wider">
                    Ghi chú
                  </p>
                  <p className="text-foreground/80 leading-relaxed text-[12px] italic">
                    {plateExport?.notes || "Không có ghi chú"}
                  </p>
                </div>
              </div>
            </div>

            {/* Centered Action Buttons at bottom */}
            {order.isPlateExported && (
              <div className="flex items-center justify-center gap-2 pt-3 border-t border-muted-foreground/5 mt-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-[11px] font-semibold px-3 border-primary/20 hover:bg-primary/5 text-primary rounded-full"
                  onClick={() => setIsPlateExportDialogOpen(true)}
                >
                  <History className="h-3 w-3" />
                  Xuất kẽm lại
                </Button>
                {order.status !== "completed" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 text-[11px] font-semibold px-3 border-primary/20 hover:bg-primary/5 text-primary rounded-full"
                    onClick={() => {
                      if (plateExport) {
                        setEditingPlateExport(plateExport);
                        setIsPlateExportDialogOpen(true);
                      }
                    }}
                  >
                    <Edit className="h-3 w-3" />
                    Sửa thông tin
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {order.isPlateExported &&
          order.status === "completed" &&
          !order.isHandedToProduction && (
            <div className="pt-2 border-t mt-auto">
              <Button
                className="w-full gap-2 font-bold h-10 text-sm shadow-md"
                onClick={handleHandToProduction}
                disabled={isHandingToProduction}
              >
                {isHandingToProduction ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Package className="h-4 w-4" />
                )}
                Chuyển xuống sản xuất
              </Button>
            </div>
          )}

        {order.isHandedToProduction && (
          <div className="pt-2 border-t mt-auto">
            <div className="bg-green-50 dark:bg-green-950/10 border border-green-200/50 rounded-lg p-3 flex items-center gap-3">
              <div className="bg-green-100 dark:bg-green-900/50 p-1.5 rounded-full">
                <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[12px] font-bold text-green-800 dark:text-green-300 uppercase tracking-tight">
                  Đã chuyển sản xuất
                </p>
                <p className="text-[11px] text-green-700/70 font-medium italic">
                  {order.handedToProductionAt
                    ? format(new Date(order.handedToProductionAt), "HH:mm dd/MM/yyyy")
                    : ""}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
