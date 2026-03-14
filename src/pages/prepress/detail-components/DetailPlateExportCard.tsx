import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Edit, Package, Loader2 } from "lucide-react";
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

  return (
    <Card className="h-full border-2 border-primary/10 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden relative">
      <div className="absolute top-1 right-1 bg-orange-600 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm z-[100] font-mono pointer-events-none opacity-80">
        DetailPlateExportCard.tsx
      </div>
      <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
      <CardHeader className="pb-4 px-6 relative">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2.5 text-primary">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="h-5 w-5" />
            </div>
            Xuất kẽm
          </CardTitle>
          {order.isPlateExported && order.status !== "completed" && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 font-semibold"
              onClick={() => {
                if (order.plateExport) {
                  setEditingPlateExport(order.plateExport);
                  setIsPlateExportDialogOpen(true);
                }
              }}
            >
              <Edit className="h-3.5 w-3.5" />
              Cập nhật
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-2 h-[calc(100%-80px)] flex flex-col justify-between relative">
        <div className="space-y-4">
          {!order.isPlateExported ? (
            <div className="flex flex-col items-center justify-center py-10 bg-muted/30 rounded-xl border border-dashed border-muted-foreground/20 group hover:border-primary/30 transition-colors">
              <div className="p-4 bg-muted/50 rounded-full mb-4 group-hover:bg-primary/5 transition-colors">
                <AlertCircle className="h-10 w-10 text-muted-foreground/40 group-hover:text-primary/40 transition-colors" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Chưa ghi nhận thông tin xuất kẽm
              </p>
              {order.status !== "completed" && (
                <Button
                  className="mt-6 gap-2 font-bold px-6 shadow-sm hover:shadow-md transition-all active:scale-95"
                  onClick={() => setIsPlateExportDialogOpen(true)}
                >
                  Ghi nhận xuất kẽm
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/30 rounded-lg border">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Ngày xuất
                  </p>
                  <p className="font-bold text-sm">
                    {order.plateExport?.exportedAt
                      ? format(new Date(order.plateExport.exportedAt), "dd/MM/yyyy")
                      : "—"}
                  </p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg border">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Người xuất
                  </p>
                  <p className="font-bold text-sm">
                    {order.plateExport?.exporter?.fullName || "—"}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                <p className="text-[11px] font-bold text-primary uppercase tracking-wider mb-2">
                  Ghi chú xuất kẽm
                </p>
                <p className="text-sm italic text-foreground leading-relaxed">
                  {order.plateExport?.notes || "Không có ghi chú"}
                </p>
              </div>
            </div>
          )}
        </div>

        {order.isPlateExported &&
          order.status === "completed" &&
          !order.isHandedToProduction && (
            <div className="pt-6 border-t mt-auto">
              <Button
                className="w-full gap-2 font-bold py-6 text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] transition-all bg-gradient-to-r from-primary to-primary/90"
                onClick={handleHandToProduction}
                disabled={isHandingToProduction}
              >
                {isHandingToProduction ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Package className="h-5 w-5" />
                )}
                Chuyển xuống sản xuất
              </Button>
              <p className="text-[10px] text-center text-muted-foreground mt-3 font-medium uppercase tracking-tighter">
                Click để bàn giao bài bình này cho xưởng sản xuất
              </p>
            </div>
          )}

        {order.isHandedToProduction && (
          <div className="pt-6 border-t mt-auto">
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-4">
              <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-full">
                <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-green-800 dark:text-green-300">
                  Đã chuyển xuống sản xuất
                </p>
                <p className="text-xs text-green-700/70 dark:text-green-400/70 font-medium">
                  {order.handedToProductionAt
                    ? format(
                        new Date(order.handedToProductionAt),
                        "HH:mm dd/MM/yyyy"
                      )
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
