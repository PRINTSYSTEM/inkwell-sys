import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Box,
  Plus,
  Edit2,
  Trash2,
  Search,
  Info,
  FileImage,
  Bug,
} from "lucide-react";
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
  const [showDebug, setShowDebug] = useState(false);
  if (!order) return null;

  const dieExports = order.dieExports || [];

  return (
    <div className="border border-black relative h-full flex flex-col">
      <span className="absolute top-0 left-0 bg-black text-white text-[10px] px-1 z-50">
        DetailDieExportCard.tsx
      </span>
      <Card className="relative h-full flex flex-col">
        <CardHeader className="pb-1.5 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Box className="h-3.5 w-3.5" />
              Xuất khuôn bế ({dieExports.length})
            </CardTitle>
            <Dialog open={showDebug} onOpenChange={setShowDebug}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground/40 hover:text-primary"
                >
                  <Bug className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Bug className="h-4 w-4" />
                    Debug: Thông tin khuôn bế (Order #{order.id})
                  </DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-auto p-4 space-y-4 font-mono text-xs">
                  <div className="p-3 bg-muted rounded-md select-all">
                    <p className="font-bold text-primary mb-1 uppercase tracking-wider text-[10px]">
                      API Endpoint
                    </p>
                    <code className="text-[11px]">
                      GET /proofing-orders/{order.id}
                    </code>
                  </div>
                  <div className="bg-[#1e1e1e] p-4 rounded-md text-white overflow-auto max-h-[500px]">
                    <p className="text-[#888] mb-2">// JSON DATA (dieExports)</p>
                    <pre>{JSON.stringify(dieExports, null, 2)}</pre>
                  </div>
                  <div className="bg-[#1e1e1e] p-4 rounded-md text-white overflow-auto max-h-[500px]">
                    <p className="text-[#888] mb-2">// FULL ORDER OBJECT</p>
                    <pre>{JSON.stringify(order, null, 2)}</pre>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4 flex-1 flex flex-col">
          {!isDieExported ? (
            <div className="flex flex-col items-center py-6 space-y-4 bg-muted/20 rounded-lg border border-dashed border-muted-foreground/20">
              <div className="text-center space-y-1">
                <p className="font-bold text-sm text-muted-foreground">
                  Chưa có thông tin xuất khuôn
                </p>
                <p className="text-[11px] text-muted-foreground/60">
                  Bài này có bế, cần xuất khuôn
                </p>
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
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8_px_rgba(34,197,94,0.4)]" />
                <span className="font-bold text-green-600 uppercase tracking-tight text-[10px]">
                  Đã xuất khuôn
                </span>
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

                  {/* Image and Info Section */}
                  <div className="flex gap-3">
                    {/* Image Thumbnail */}
                    <div className="w-16 h-16 shrink-0 rounded border bg-muted flex items-center justify-center overflow-hidden">
                      {dieExport.die?.imageUrl ? (
                        <img
                          src={dieExport.die.imageUrl}
                          alt={dieExport.die?.code || "Khuôn bế"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileImage className="h-5 w-5 text-muted-foreground/40" />
                      )}
                    </div>

                    {/* Info Grid - Change to stack */}
                    <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                      <div className="flex items-center justify-between">
                        <Label className="text-muted-foreground text-[10px] font-normal uppercase tracking-tight shrink-0">
                          Kích thước
                        </Label>
                        <p className="text-[11px] font-bold truncate ml-2">
                          {formatDieSize(dieExport.die)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-muted-foreground text-[10px] font-normal uppercase tracking-tight shrink-0">
                          Vị trí
                        </Label>
                        <p className="text-[11px] font-bold text-green-600 truncate ml-2">
                          {dieLocationLabels[dieExport.die?.location || ""] ||
                            dieExport.die?.location ||
                            "Đang sử dụng"}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-muted-foreground text-[10px] font-normal uppercase tracking-tight shrink-0">
                          NCC
                        </Label>
                        <p className="text-[11px] font-medium truncate ml-2">
                          {dieExport.die?.vendorName ||
                            dieExport.die?.vendor?.name ||
                            "An Tâm"}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-muted-foreground text-[10px] font-normal uppercase tracking-tight shrink-0">
                          Ngày xuất
                        </Label>
                        <p className="text-[10px] text-muted-foreground font-medium truncate ml-2">
                          {dieExport.createdAt
                            ? format(new Date(dieExport.createdAt), "dd/MM/yyyy")
                            : "—"}
                        </p>
                      </div>
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
    </div>
  );
}
