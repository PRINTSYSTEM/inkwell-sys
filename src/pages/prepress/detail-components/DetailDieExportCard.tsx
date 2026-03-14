import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Box, Plus, Edit2, Trash2, Search, Info } from "lucide-react";
import { format } from "date-fns";
import { formatDieSize } from "@/utils/format-die-size";
import { dieLocationLabels } from "@/lib/status-utils";

interface DetailDieExportCardProps {
  hasDieCutDesigns: boolean;
  isDieExported: boolean;
  order: any;
  setIsDieExportDialogOpen: (val: boolean) => void;
  handleOpenReplaceDieDialog: (dieExport: any) => void;
  handleRemoveDie: (dieId: number) => void;
  isRemovingDie: boolean;
  setIsDieListDialogOpen: (val: boolean) => void;
}

export function DetailDieExportCard({
  hasDieCutDesigns,
  isDieExported,
  order,
  setIsDieExportDialogOpen,
  handleOpenReplaceDieDialog,
  handleRemoveDie,
  isRemovingDie,
  setIsDieListDialogOpen,
}: DetailDieExportCardProps) {
  if (!order) return null;

  const dieExports = order.dieExports || [];

  return (
    <Card className="relative h-full flex flex-col">
      <div className="absolute top-1 right-1 bg-purple-600 text-white text-[11px] px-1.5 py-0.5 rounded shadow-sm z-[100] font-mono pointer-events-none opacity-80">
        DetailDieExportCard.tsx
      </div>

      <CardHeader className="pb-1.5 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Box className="h-3.5 w-3.5" />
            Xuất khuôn bế ({dieExports.length})
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 flex-1 flex flex-col">
        {!isDieExported ? (
          <div className="flex flex-col items-center py-6 space-y-4 bg-muted/20 rounded-lg border border-dashed border-muted-foreground/20">
            <div className="text-center space-y-1">
              <p className="font-bold text-sm text-muted-foreground">Chưa có thông tin xuất khuôn</p>
              <p className="text-[11px] text-muted-foreground/60">Bài này có bế, cần xuất khuôn</p>
            </div>
            {order.status !== "completed" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDieExportDialogOpen(true)}
                className="h-8 px-4 text-xs font-bold rounded-full"
              >
                Ghi nhận ngay
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2 flex-1 flex flex-col">
            {/* Status indicator like Plate card */}
            <div className="flex items-center gap-2 px-1 mb-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
              <span className="font-bold text-green-600 uppercase tracking-tight text-[10px]">Đã xuất khuôn</span>
            </div>

            {dieExports.map((dieExport: any, index: number) => (
              <div 
                key={dieExport.id || index}
                className="space-y-4 relative group"
              >
                {/* Die Code Header - Clean, no inner card border */}
                <div className="flex items-center justify-between border-b border-muted-foreground/5 pb-1.5">
                  <p className="font-bold text-[14px] text-foreground uppercase tracking-tight">
                    {dieExport.die?.code || "Khuôn bế"}
                  </p>
                  {order.status !== "completed" && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-primary hover:bg-primary/5"
                        onClick={() => handleOpenReplaceDieDialog(dieExport)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:bg-destructive/5"
                        onClick={() => handleRemoveDie(dieExport.dieId!)}
                        disabled={isRemovingDie}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Info Grid - Change to stack */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground text-[10px] font-normal uppercase tracking-tight shrink-0">Kích thước</Label>
                    <p className="text-[12px] font-bold">
                      {formatDieSize(dieExport.die)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground text-[10px] font-normal uppercase tracking-tight shrink-0">Vị trí</Label>
                    <p className="text-[12px] font-bold text-green-600">
                      {dieLocationLabels[dieExport.die?.location || ""] || dieExport.die?.location || "Đang sử dụng"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground text-[10px] font-normal uppercase tracking-tight shrink-0">NCC</Label>
                    <p className="text-[12px] font-medium truncate">
                      {dieExport.die?.vendorName || dieExport.die?.vendor?.name || "An Tâm"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground text-[10px] font-normal uppercase tracking-tight shrink-0">Ngày xuất</Label>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      {dieExport.createdAt ? format(new Date(dieExport.createdAt), "dd/MM/yyyy") : "—"}
                    </p>
                  </div>
                </div>

                {dieExport.notes && (
                  <div className="p-2 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded text-xs mt-0.5">
                    <div className="flex items-start gap-1.5">
                      <Info className="h-3 w-3 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-blue-900 dark:text-blue-100 text-[10px] mb-0.5 uppercase tracking-wider">
                          Ghi chú
                        </p>
                        <p className="text-foreground/80 leading-relaxed text-[12px] italic">
                          {dieExport.notes}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {index < dieExports.length - 1 && (
                  <div className="h-px bg-muted-foreground/10 my-4" />
                )}
              </div>
            ))}

            {/* Centered Action Buttons at bottom */}
            <div className="flex items-center justify-center gap-2 pt-3 border-t border-muted-foreground/5 mt-auto">
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 text-[11px] font-semibold px-3 border-primary/20 hover:bg-primary/5 text-primary rounded-full"
                onClick={() => setIsDieListDialogOpen(true)}
              >
                <Search className="h-3 w-3" />
                Duyệt khuôn
              </Button>
              {order.status !== "completed" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-[11px] font-semibold px-3 border-primary/20 hover:bg-primary/5 text-primary rounded-full"
                  onClick={() => setIsDieExportDialogOpen(true)}
                >
                  <Plus className="h-3 w-3" />
                  Thêm khuôn
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
