import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Package, Edit, History, Loader2, Info } from "lucide-react";
import { format } from "date-fns";
import { productionMethodLabels, formatCurrency } from "@/lib/status-utils";
import { cn } from "@/lib/utils";

interface DetailPlateExportCardProps {
  order: any;
  setEditingPlateExport: (plate: any) => void;
  setIsPlateExportDialogOpen: (val: boolean) => void;
  handleHandToProduction: () => void;
  isHandingToProduction: boolean;
  isProofer?: boolean;
}

export function DetailPlateExportCard({
  order,
  setEditingPlateExport,
  setIsPlateExportDialogOpen,
  handleHandToProduction,
  isHandingToProduction,
  isProofer = true,
}: DetailPlateExportCardProps) {
  const plateExport = order?.plateExport;
  const plateExportsList =
    order?.plateExports?.length > 0
      ? order.plateExports
      : plateExport
        ? [plateExport]
        : [];

  const plateExportsWithIndex = useMemo(() => {
    return plateExportsList.map((item: any, i: number) => ({
      ...item,
      originalIndex: i,
    }));
  }, [plateExportsList]);

  const sortedPlateExports = useMemo(() => {
    return [...plateExportsWithIndex].reverse();
  }, [plateExportsWithIndex]);

  if (!order) return null;

  return (
    <Card className="relative h-full flex flex-col">
      <CardHeader className="pb-1.5 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Package className="h-3.5 w-3.5" />
            Xuất bản kẽm{" "}
            {plateExportsList.length > 0 ? `(${plateExportsList.length})` : ""}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 flex-1 flex flex-col">
        {!order.isPlateExported ? (
          <div className="flex flex-col items-center py-6 space-y-4 bg-muted/20 rounded-lg border border-dashed border-muted-foreground/20">
            <div className="text-center space-y-1">
              <p className="font-bold text-sm text-muted-foreground">
                Chưa có thông tin xuất kẽm
              </p>
              <p className="text-[11px] text-muted-foreground/60">
                Ghi nhận thông tin để tiếp tục
              </p>
            </div>
            {order.status !== "completed" && isProofer && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPlateExportDialogOpen(true)}
                className="h-8 px-4 text-xs font-bold rounded-md"
              >
                Xuất kẽm
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2 flex-1 flex flex-col">
            <div className="flex items-center justify-between px-1 mb-1">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                <span className="font-bold text-green-600 uppercase tracking-tight text-[10px]">
                  Đã xuất kẽm
                </span>
              </div>
            </div>

            {/* Scrollable list of exports */}
            <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-2 max-h-[400px]">
              {sortedPlateExports.map((exportItem: any) => {
                const isLatest = exportItem.originalIndex === plateExportsList.length - 1;

                return (
                  <div
                    key={exportItem.id || exportItem.originalIndex}
                    className={cn(
                      "p-2.5 rounded-md border text-[11px] leading-tight space-y-1.5 relative group transition-all duration-200",
                      isLatest
                        ? "bg-emerald-50/20 dark:bg-emerald-950/5 border-emerald-200/80 shadow-sm"
                        : "bg-slate-50/50 dark:bg-slate-900/10 border-slate-200 hover:bg-slate-50 hover:shadow-sm"
                    )}
                  >
                    {/* Compact View for Old Exports (hidden on hover) */}
                    {!isLatest && (
                      <div className="flex items-center justify-between text-[10px] text-slate-500 group-hover:hidden py-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-600">Lần {exportItem.originalIndex + 1}</span>
                          <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1 py-0.5 rounded uppercase tracking-tighter border border-slate-200">
                            Kẽm cũ
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span>NCC: <span className="font-semibold text-slate-700">{exportItem?.vendorName || exportItem?.plateVendor?.name || "—"}</span></span>
                          <span>SL: <span className="font-semibold text-slate-700">{exportItem?.plateCount || 0}</span></span>
                          <span className="text-[9px] text-slate-400">
                            {exportItem?.createdAt || exportItem?.exportedAt
                              ? format(new Date(exportItem.createdAt || exportItem.exportedAt), "dd/MM")
                              : ""}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Full View for Latest Export, or Old Export on Hover */}
                    <div className={cn(
                      isLatest ? "block space-y-1.5" : "hidden group-hover:block space-y-1.5"
                    )}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "font-bold uppercase tracking-widest text-[9px]",
                            isLatest ? "text-emerald-700" : "text-slate-500"
                          )}>
                            Lần {exportItem.originalIndex + 1}
                          </span>
                          {isLatest ? (
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded uppercase tracking-tighter border border-emerald-200">
                              Mới nhất
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1 py-0.5 rounded uppercase tracking-tighter border border-slate-200">
                              Kẽm cũ
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                        <div className="flex items-center gap-1 col-span-2">
                          <span className="text-slate-400 dark:text-slate-500">NCC:</span>
                          <span className={cn(
                            "font-semibold",
                            isLatest ? "text-foreground" : "text-slate-600"
                          )}>
                            {exportItem?.vendorName ||
                              exportItem?.plateVendor?.name ||
                              "—"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 col-span-2">
                          <span className="text-slate-400 dark:text-slate-500">Số lượng:</span>
                          <span className={cn(
                            "font-semibold",
                            isLatest ? "text-foreground" : "text-slate-600"
                          )}>
                            {exportItem?.plateCount || 0} bản
                          </span>
                        </div>

                        <div className="flex items-center gap-1 col-span-2">
                          <span className="text-slate-400 dark:text-slate-500">Hình thức:</span>
                          <span className="font-semibold">
                            {exportItem?.productionMethod === "outsource" ? (
                              <span className={isLatest ? "text-orange-600 dark:text-orange-400" : "text-orange-600/80"}>
                                {exportItem?.printingVendorName || exportItem?.printingVendor?.name || exportItem?.productionMethodName || "In gia công ngoài"}
                              </span>
                            ) : (
                              <span className={isLatest ? "text-blue-600 dark:text-blue-400" : "text-blue-600/80"}>
                                {exportItem?.productionMethodName || productionMethodLabels.in_house || "In tại xưởng"}
                              </span>
                            )}
                          </span>
                        </div>

                        {exportItem?.productionMethod === "outsource" && (exportItem?.outsourceCost > 0) && (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 dark:text-slate-500">Chi phí:</span>
                            <span className={cn(
                              "font-semibold",
                              isLatest ? "text-orange-600" : "text-orange-600/85"
                            )}>
                              {formatCurrency(exportItem.outsourceCost)}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-1 col-span-2">
                          <span className="text-slate-400 dark:text-slate-500">Ngày tạo:</span>
                          <span className={cn(
                            "font-medium",
                            isLatest ? "text-foreground" : "text-slate-600"
                          )}>
                            {exportItem?.createdAt || exportItem?.exportedAt
                              ? format(
                                new Date(
                                  exportItem.createdAt || exportItem.exportedAt,
                                ),
                                "dd/MM/yyyy HH:mm",
                              )
                              : "—"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 col-span-2">
                          <span className="text-slate-400 dark:text-slate-500">Nhận kẽm:</span>
                          <span className={cn(
                            "font-semibold",
                            exportItem.isReceived ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"
                          )}>
                            {exportItem.isReceived ? (
                              `Đã nhận${exportItem.receivedAt ? ` lúc ${format(new Date(exportItem.receivedAt), "dd/MM/yyyy HH:mm")}` : ""}`
                            ) : (
                              `Chưa nhận${exportItem.estimatedReceiveAt ? ` (Hẹn: ${format(new Date(exportItem.estimatedReceiveAt), "dd/MM/yyyy HH:mm")})` : ""}`
                            )}
                          </span>
                        </div>
                      </div>

                      {exportItem?.notes && (
                        <div className="pt-2 mt-2 border-t border-muted-foreground/10 flex flex-col gap-1">
                          <span className="font-bold text-amber-600 dark:text-amber-400 uppercase tracking-tighter text-[9px]">
                            Ghi chú:
                          </span>
                          <p className={cn(
                            "font-medium break-words leading-normal text-xs p-2 rounded border",
                            isLatest
                              ? "bg-amber-50/30 dark:bg-amber-900/10 border-amber-100/50 text-foreground/90"
                              : "bg-slate-100/30 border-slate-200 text-slate-600"
                          )}>
                            {exportItem.notes}
                          </p>
                        </div>
                      )}

                      {isLatest && isProofer && (
                        <div className="pt-2 flex flex-wrap items-center justify-center gap-2 mt-2 border-t border-muted-foreground/10">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1.5 text-primary bg-primary/5 hover:bg-primary/10 text-[11px] px-3 font-semibold rounded-md border border-primary/20 flex-1"
                            onClick={() => {
                              setEditingPlateExport(exportItem);
                              setIsPlateExportDialogOpen(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                            Chỉnh sửa
                          </Button>

                          {order.status !== "completed" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 gap-1.5 text-amber-600 bg-amber-50 hover:bg-amber-100/50 text-[11px] px-3 font-semibold rounded-md border border-amber-200 flex-1"
                              onClick={() => setIsPlateExportDialogOpen(true)}
                            >
                              <History className="h-3 w-3" />
                              Xuất kẽm lại
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>


          </div>
        )}

        {/* order.isPlateExported &&
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
          ) */}

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
                    ? format(
                      new Date(order.handedToProductionAt),
                      "HH:mm dd/MM/yyyy",
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
