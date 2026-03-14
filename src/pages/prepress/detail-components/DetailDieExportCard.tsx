import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Settings2,
  Edit,
  Trash2,
  Plus,
  Search,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { formatDieSize } from "@/utils/format-die-size";
import { dieLocationLabels, dieStatusLabels } from "@/lib/status-utils";

interface DetailDieExportCardProps {
  hasDieCutDesigns: boolean;
  isDieExported: boolean;
  order: any;
  setIsDieExportDialogOpen: (val: boolean) => void;
  handleOpenReplaceDieDialog: (dieExport: any) => void;
  assignDieMutate: any;
  isAssigningDie: boolean;
  removeDieMutate: any;
  isRemovingDie: boolean;
  setIsDieListDialogOpen: (val: boolean) => void;
}

export function DetailDieExportCard({
  hasDieCutDesigns,
  isDieExported,
  order,
  setIsDieExportDialogOpen,
  handleOpenReplaceDieDialog,
  assignDieMutate,
  isAssigningDie,
  removeDieMutate,
  isRemovingDie,
  setIsDieListDialogOpen,
}: DetailDieExportCardProps) {
  if (!hasDieCutDesigns) return null;

  return (
    <Card className="border-2 border-primary/10 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative">
      <div className="absolute top-1 right-1 bg-teal-600 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm z-[100] font-mono pointer-events-none opacity-80">
        DetailDieExportCard.tsx
      </div>
      <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
      <CardHeader className="pb-2 px-4 pt-4 relative">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-muted-foreground">
            <Settings2 className="h-4 w-4" />
            Khuôn bế
          </CardTitle>
          {isDieExported && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 font-semibold"
                onClick={() => setIsDieListDialogOpen(true)}
              >
                <Search className="h-3.5 w-3.5" />
                Duyệt khuôn
              </Button>
              {order.status !== "completed" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 font-semibold text-primary"
                  onClick={() => setIsDieExportDialogOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Thêm khuôn
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-1 flex flex-col relative">
        <div className="space-y-4">
          {!isDieExported ? (
            <div className="flex flex-col items-center py-2 space-y-4">
              <div className="flex flex-col items-center gap-1 w-full">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]" />
                  <span className="font-bold text-[13px] text-muted-foreground uppercase tracking-tight">Xuất khuôn bế</span>
                </div>
                <p className="text-[11px] italic text-muted-foreground font-medium">
                  Chưa ghi nhận thông tin khuôn bế
                </p>
              </div>
              
              {order.status !== "completed" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-4 text-xs font-bold border-muted-foreground/20 hover:bg-muted/50 text-muted-foreground transition-all rounded-full"
                  onClick={() => setIsDieExportDialogOpen(true)}
                >
                  Ghi nhận
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {order.dieExports?.map((dieExport: any) => (
                <div
                  key={dieExport.dieId}
                  className="p-4 bg-muted/30 rounded-xl border border-muted-foreground/10 group hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 bg-blue-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-blue-500/10 transition-colors" />

                  <div className="flex items-start justify-between mb-3 relative">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 font-bold"
                        >
                          {dieExport.die?.code || "—"}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-bold uppercase tracking-tighter"
                        >
                          {dieStatusLabels[dieExport.die?.status || ""] ||
                            dieExport.die?.status ||
                            "—"}
                        </Badge>
                      </div>
                      <p className="font-bold text-sm text-foreground">
                        {dieExport.die?.name || "—"}
                      </p>
                    </div>

                    {order.status !== "completed" && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-primary hover:bg-primary/10"
                                onClick={() =>
                                  handleOpenReplaceDieDialog(dieExport)
                                }
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Thay thế khuôn</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      "Bạn có chắc muốn xóa khuôn này khỏi bài bình?"
                                    )
                                  ) {
                                    removeDieMutate({
                                      proofingOrderId: order.id,
                                      dieId: dieExport.dieId!,
                                    });
                                  }
                                }}
                                disabled={isRemovingDie}
                              >
                                {isRemovingDie ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Gỡ khuôn</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 relative">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                        Kích thước khuôn
                      </p>
                      <p className="text-xs font-semibold">
                        {formatDieSize(dieExport.die)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                        Vị trí
                      </p>
                      <p className="text-xs font-semibold">
                        {dieLocationLabels[dieExport.die?.location || ""] ||
                          dieExport.die?.location ||
                          "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                        Ngày tạo khuôn
                      </p>
                      <p className="text-xs font-semibold">
                        {dieExport.die?.createdAt
                          ? format(new Date(dieExport.die.createdAt), "dd/MM/yyyy")
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                        Người gán
                      </p>
                      <p className="text-xs font-semibold">
                        {dieExport.exporter?.fullName || "—"}
                      </p>
                    </div>
                  </div>

                  {dieExport.notes && (
                    <div className="mt-3 p-2 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded text-[11px] italic text-blue-800 dark:text-blue-300">
                      <span className="font-bold not-italic mr-1">Ghi chú:</span>
                      {dieExport.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
