import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Package, Edit, History, Loader2, Info } from "lucide-react";
import { format } from "date-fns";
import { productionMethodLabels, formatCurrency } from "@/lib/status-utils";

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
  if (!order) return null;

  const plateExport = order.plateExport;
  const plateExportsList =
    order.plateExports?.length > 0
      ? order.plateExports
      : plateExport
        ? [plateExport]
        : [];

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
                Ghi nhận ngay
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
            <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-4 max-h-[400px]">
              {plateExportsList.map((exportItem: any, index: number) => (
                <div
                  key={exportItem.id || index}
                  className="p-2.5 bg-muted/30 rounded-md border border-muted-foreground/10 space-y-1.5 relative group text-[11px] leading-tight"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-muted-foreground uppercase tracking-widest text-[9px]">
                        Lần {index + 1}
                      </span>
                      {exportItem.isActive && (
                        <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1 py-0.5 rounded uppercase tracking-tighter border border-green-200">
                          Mới nhất
                        </span>
                      )}
                    </div>
                    {(exportItem.isActive ||
                      index === plateExportsList.length - 1) && (
                      <div className="flex items-center gap-1">
                        {/* Edit button moved to bottom of item card */}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                    <div className="flex items-center gap-1 col-span-2">
                      <span className="text-muted-foreground">NCC:</span>
                      <span className="font-semibold text-foreground">
                        {exportItem?.vendorName ||
                          exportItem?.plateVendor?.name ||
                          "—"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 col-span-2">
                      <span className="text-muted-foreground">Số lượng:</span>
                      <span className="font-semibold text-foreground">
                        {exportItem?.plateCount || 0} bản
                      </span>
                    </div>

                    <div className="flex items-center gap-1 col-span-2">
                      <span className="text-muted-foreground">Hình thức:</span>
                      <span className="font-semibold text-foreground">
                        {exportItem?.productionMethod === "outsource" ? (
                          <span className="text-orange-600 dark:text-orange-400">
                            {exportItem?.printingVendorName || exportItem?.printingVendor?.name || exportItem?.productionMethodName || "In ngoài"}
                          </span>
                        ) : (
                          <span className="text-blue-600 dark:text-blue-400">
                            {exportItem?.productionMethodName || productionMethodLabels.in_house || "In tại xưởng"}
                          </span>
                        )}
                      </span>
                    </div>

                    {exportItem?.productionMethod === "outsource" && (exportItem?.outsourceCost > 0) && (
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Chi phí:</span>
                        <span className="font-semibold text-orange-600">
                          {formatCurrency(exportItem.outsourceCost)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1 col-span-2">
                      <span className="text-muted-foreground">Ngày tạo:</span>
                      <span className="font-medium text-foreground">
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
                  </div>

                  {exportItem?.notes && (
                    <div className="pt-2 mt-2 border-t border-muted-foreground/10 flex flex-col gap-1">
                      <span className="font-bold text-amber-600 dark:text-amber-400 uppercase tracking-tighter text-[9px]">
                        Ghi chú:
                      </span>
                      <p className="text-foreground/90 font-medium break-words leading-normal text-xs bg-amber-50/30 dark:bg-amber-900/10 p-2 rounded border border-amber-100/50 dark:border-amber-800/30">
                        {exportItem.notes}
                      </p>
                    </div>
                  )}

                  {(exportItem.isActive || index === plateExportsList.length - 1) && isProofer && (
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
              ))}
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
