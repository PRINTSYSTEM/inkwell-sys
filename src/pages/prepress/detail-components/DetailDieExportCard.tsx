import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Box,
  Plus,
  Trash2,
  Search,
  Info,
  FileImage,
  Maximize2,
  RefreshCcw,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { formatDieSize } from "@/utils/format-die-size";
import { dieLocationLabels } from "@/lib/status-utils";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDieExportHistory } from "@/hooks/use-die";

interface DetailDieExportCardProps {
  hasDieCutDesigns: boolean;
  isDieExported: boolean;
  order: any;
  setIsDieExportDialogOpen: (val: boolean) => void;
  handleOpenReplaceDieDialog: (dieExport: any) => void;
  handleRemoveDie: (dieId: number) => void;
  isRemovingDie: boolean;
  onEditDie: (die: any) => void;
  setIsDieListDialogOpen: (val: boolean) => void;
  setImageViewerOpen: (val: boolean) => void;
  setViewingImageUrl: (val: string | null) => void;
  isProofer?: boolean;
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
  setImageViewerOpen,
  setViewingImageUrl,
  isProofer = true,
}: DetailDieExportCardProps) {
  const [showDebug, setShowDebug] = useState(false);

  const { data: dieHistory, isLoading: isLoadingHistory } = useDieExportHistory(
    order?.id,
    isDieExported
  );

  const activeDies = useMemo(() => {
    return order?.proofingOrderDies || [];
  }, [order?.proofingOrderDies]);

  const allExports = useMemo(() => {
    return (order?.dieExports && order.dieExports.length > 0)
      ? order.dieExports
      : activeDies;
  }, [order?.dieExports, activeDies]);

  const activeExportIds = useMemo(() => {
    return new Set(activeDies.map((d: any) => d.id).filter(Boolean));
  }, [activeDies]);

  if (!order) return null;

  return (
    <Card className="relative h-full flex flex-col">
        <CardHeader className="pb-1.5 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Box className="h-3.5 w-3.5" />
              Xuất khuôn bế (Sử dụng: {activeDies.length} / Tổng: {allExports.length})
            </CardTitle>
            <div className="flex items-center gap-1.5">
              {isDieExported && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 gap-1 text-[10px] font-semibold px-2 border-primary/20 hover:bg-primary/5 text-primary rounded-md"
                  onClick={() => setIsDieListDialogOpen(true)}
                >
                  <Search className="h-2.5 w-2.5" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4 flex-1 flex flex-col overflow-hidden">
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
              {order.status !== "completed" && isProofer && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDieExportDialogOpen(true)}
                  className="h-8 px-4 text-xs font-bold rounded-md"
                >
                  Xuất khuôn
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2 flex-1 flex flex-col overflow-hidden">
              <Tabs defaultValue="active" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="grid grid-cols-2 h-7 p-0.5 bg-muted/60 shrink-0">
                  <TabsTrigger value="active" className="text-[10px] h-6 py-0 font-semibold">
                    Khuôn sử dụng ({activeDies.length})
                  </TabsTrigger>
                  <TabsTrigger value="history" className="text-[10px] h-6 py-0 font-semibold">
                    Lịch sử xuất ({allExports.length})
                  </TabsTrigger>
                </TabsList>

                {/* ACTIVE DIES TAB */}
                <TabsContent value="active" className="flex-1 overflow-y-auto mt-2 space-y-2 pr-1 -mr-1 max-h-[350px]">
                  {activeDies.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-[11px] text-muted-foreground bg-muted/10 rounded-md border border-dashed">
                      <p>Không có khuôn bế nào đang sử dụng</p>
                    </div>
                  ) : (
                    activeDies.map((dieExport: any, index: number) => {
                      const dieCode = (dieExport.die?.code || "").trim();
                      const orderCode = (order?.code || "").trim();
                      const isNewDie = !!(dieCode && orderCode && dieCode.toLowerCase() === orderCode.toLowerCase());

                      return (
                        <div
                          key={dieExport.id || index}
                          className="p-2.5 rounded-md border text-[11px] leading-tight space-y-1.5 relative group bg-emerald-50/20 dark:bg-emerald-950/5 border-emerald-200/80 shadow-sm"
                        >
                          {/* Header: Code & Action Buttons */}
                          <div className="flex items-center justify-between border-b border-muted-foreground/5 pb-1.5 mb-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-tighter border border-emerald-200">
                                Đang dùng
                              </span>
                              <p className="font-bold text-xs uppercase tracking-tight text-foreground">
                                {dieExport.die?.code || `Khuôn #${dieExport.dieId}`}
                              </p>
                            </div>

                            {order.status !== "completed" && isProofer && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive hover:bg-destructive/5 animate-in fade-in duration-200"
                                  onClick={() => handleRemoveDie(dieExport.dieId!)}
                                  disabled={isRemovingDie}
                                  title="Gỡ khuôn khỏi bài"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* Image and Info Section */}
                          <div className="flex gap-3">
                            {/* Image Thumbnail */}
                            <div
                              className="w-12 h-12 shrink-0 rounded border bg-muted flex items-center justify-center overflow-hidden relative group/img cursor-zoom-in"
                              onClick={() => {
                                if (dieExport.die?.imageUrl) {
                                  setViewingImageUrl(dieExport.die.imageUrl);
                                  setImageViewerOpen(true);
                                }
                              }}
                            >
                              {dieExport.die?.imageUrl ? (
                                <>
                                  <img
                                    src={dieExport.die.imageUrl}
                                    alt={dieExport.die?.code || "Khuôn bế"}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-110"
                                  />
                                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                    <Maximize2 className="h-3.5 w-3.5 text-white" />
                                  </div>
                                </>
                              ) : (
                                <FileImage className="h-4.5 w-4.5 text-muted-foreground/40" />
                              )}
                            </div>

                            {/* Info list */}
                            <div className="flex-1 flex flex-col gap-1.5 min-w-0 text-[10px]">
                              <div className="flex items-center justify-between gap-1 text-[10px]">
                                <span className="text-slate-400 dark:text-slate-500">Kích thước:</span>
                                <p className="font-semibold truncate ml-2 text-foreground max-w-[125px]" title={formatDieSize(dieExport.die)}>
                                  {formatDieSize(dieExport.die)}
                                </p>
                              </div>
                              <div className="flex items-center justify-between gap-1 text-[10px]">
                                <span className="text-slate-400 dark:text-slate-500">Vị trí:</span>
                                <p className="font-semibold truncate ml-2 text-green-600 max-w-[125px]">
                                  {dieLocationLabels[dieExport.die?.location || ""] ||
                                    dieExport.die?.location ||
                                    "Đang sử dụng"}
                                </p>
                              </div>
                              <div className="flex items-center justify-between gap-2 flex-wrap text-[10px]">
                                <div className="flex items-center gap-1">
                                  <span className="text-slate-400 dark:text-slate-500">NCC:</span>
                                  <span className="font-semibold truncate max-w-[55px]">
                                    {dieExport.die?.vendorName ||
                                      dieExport.die?.vendor?.name ||
                                      "An Tâm"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 ml-auto">
                                  <span className="text-slate-400 dark:text-slate-500">Xuất:</span>
                                  <span className="text-slate-500 font-medium">
                                    {dieExport.createdAt
                                      ? format(new Date(dieExport.createdAt), "dd/MM HH:mm")
                                      : "—"}
                                  </span>
                                </div>
                              </div>
                              {isNewDie && (
                                <div className="flex items-center justify-between gap-2 flex-wrap border-t border-dashed pt-1 mt-0.5 text-[10px]">
                                  <div className="flex items-center gap-1">
                                    <span className="text-slate-400 dark:text-slate-500">Nhận:</span>
                                    <span className={cn(
                                      "font-semibold",
                                      dieExport.isReceived ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"
                                    )}>
                                      {dieExport.isReceived ? "Đã nhận" : "Chưa nhận"}
                                    </span>
                                  </div>
                                  <div className="text-[9px] text-slate-500 ml-auto font-medium">
                                    {dieExport.isReceived
                                      ? dieExport.receivedAt && `${format(new Date(dieExport.receivedAt), "dd/MM HH:mm")}`
                                      : dieExport.estimatedReceiveAt && `Hẹn: ${format(new Date(dieExport.estimatedReceiveAt), "dd/MM HH:mm")}`}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {dieExport.notes && (
                            <div className="p-2 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded text-xs mt-0.5">
                              <div className="flex items-start gap-1.5">
                                <Info className="h-3 w-3 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-blue-900 dark:text-blue-100 text-[9px] mb-0.5 uppercase tracking-wider">
                                    Ghi chú
                                  </p>
                                  <p className="leading-relaxed text-[11px] italic text-foreground/80">
                                    {dieExport.notes}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {isProofer && order.status !== "completed" && (
                             <div className="flex flex-wrap items-center justify-center gap-2 pt-2 mt-2 border-t border-muted-foreground/10">
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 className="h-7 gap-1.5 text-amber-600 bg-amber-50 hover:bg-amber-100/50 text-[11px] px-3 font-semibold rounded-md border border-amber-200 flex-1 transition-all"
                                 onClick={() => handleOpenReplaceDieDialog(dieExport)}
                                >
                                 <RefreshCcw className="h-3 w-3" />
                                 Xuất lại khuôn
                               </Button>
                             </div>
                           )}
                        </div>
                      );
                    })
                  )}
                </TabsContent>

                {/* HISTORY EXPORTS TAB */}
                <TabsContent value="history" className="flex-1 overflow-y-auto mt-2 space-y-2 pr-1 -mr-1 max-h-[350px]">
                  {isLoadingHistory ? (
                    <div className="flex h-32 items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : !dieHistory || dieHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-[11px] text-muted-foreground bg-muted/10 rounded-md border border-dashed">
                      <p>Chưa có lịch sử xuất khuôn</p>
                    </div>
                  ) : (
                    [...dieHistory].reverse().map((item: any, index: number) => {
                      const eventType = item.eventType;
                      let label = eventType || "Không xác định";
                      let badgeClass = "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950/30 dark:text-slate-400 dark:border-slate-800";

                      if (eventType === "exported") {
                        label = "Xuất khuôn";
                        badgeClass = "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800";
                      } else if (eventType === "replaced") {
                        label = "Xuất lại khuôn";
                        badgeClass = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800";
                      } else if (eventType === "removed") {
                        label = "Gỡ khuôn";
                        badgeClass = "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800";
                      } else if (eventType === "taken_out") {
                        label = "Lấy khuôn bế";
                        badgeClass = "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800";
                      } else if (eventType === "returned") {
                        label = "Trả khuôn bế";
                        badgeClass = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800";
                      }

                      return (
                        <div
                          key={item.id || index}
                          className="p-2.5 rounded-md border text-[11px] leading-tight space-y-1.5 bg-background border-border hover:shadow-sm transition-all duration-200"
                        >
                          {/* Event Header */}
                          <div className="flex items-center justify-between border-b border-muted-foreground/5 pb-1.5 mb-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={cn(
                                "text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-tighter",
                                badgeClass
                              )}>
                                {label}
                              </span>
                              <span className="text-slate-400 dark:text-slate-500 font-medium">
                                {item.createdAt
                                  ? format(new Date(item.createdAt), "dd/MM/yyyy HH:mm")
                                  : "—"}
                              </span>
                            </div>
                            <span className="text-slate-500 dark:text-slate-400 font-semibold truncate max-w-[120px]" title={item.createdBy?.fullName || item.createdBy?.username || "Hệ thống"}>
                              {item.createdBy?.fullName || item.createdBy?.username || "Hệ thống"}
                            </span>
                          </div>

                          {/* Event Content */}
                          <div className="space-y-1.5">
                            {eventType === "replaced" ? (
                              <div className="space-y-1.5">
                                {/* Compare line */}
                                <div className="flex items-center gap-2 font-semibold text-xs text-foreground bg-muted/30 p-1.5 rounded border">
                                  <span className="text-destructive line-through shrink-0">
                                    {item.previousDie?.code || `Khuôn #${item.previousDieId}`}
                                  </span>
                                  <span className="text-muted-foreground">➔</span>
                                  <span className="text-emerald-600 font-bold shrink-0">
                                    {item.newDie?.code || `Khuôn #${item.newDieId}`}
                                  </span>
                                </div>
                                
                                {/* Info for the new die */}
                                {item.newDie && (
                                  <div className="flex gap-2 pt-1">
                                    {/* Image Thumbnail */}
                                    <div
                                      className="w-10 h-10 shrink-0 rounded border bg-muted flex items-center justify-center overflow-hidden relative group/img cursor-zoom-in"
                                      onClick={() => {
                                        if (item.newDie?.imageUrl) {
                                          setViewingImageUrl(item.newDie.imageUrl);
                                          setImageViewerOpen(true);
                                        }
                                      }}
                                    >
                                      {item.newDie.imageUrl ? (
                                        <>
                                          <img
                                            src={item.newDie.imageUrl}
                                            alt={item.newDie.code || "Khuôn mới"}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-110"
                                          />
                                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                            <Maximize2 className="h-3 w-3 text-white" />
                                          </div>
                                        </>
                                      ) : (
                                        <FileImage className="h-4.5 w-4.5 text-muted-foreground/35" />
                                      )}
                                    </div>
                                    
                                    <div className="flex-1 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                                      <div>Kích thước: <span className="font-semibold text-foreground">{formatDieSize(item.newDie)}</span></div>
                                      <div>NCC: <span className="font-semibold text-foreground">{item.newDie.vendorName || "—"}</span></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              /* Standard single die details */
                              item.newDie && (
                                <div className="flex gap-2">
                                  {/* Image Thumbnail */}
                                  <div
                                    className="w-10 h-10 shrink-0 rounded border bg-muted flex items-center justify-center overflow-hidden relative group/img cursor-zoom-in"
                                    onClick={() => {
                                      if (item.newDie?.imageUrl) {
                                        setViewingImageUrl(item.newDie.imageUrl);
                                        setImageViewerOpen(true);
                                      }
                                    }}
                                  >
                                    {item.newDie.imageUrl ? (
                                      <>
                                        <img
                                          src={item.newDie.imageUrl}
                                          alt={item.newDie.code || "Khuôn bế"}
                                          className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                          <Maximize2 className="h-3 w-3 text-white" />
                                        </div>
                                      </>
                                    ) : (
                                      <FileImage className="h-4.5 w-4.5 text-muted-foreground/35" />
                                    )}
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="font-bold text-xs text-foreground uppercase mb-0.5">
                                      {item.newDie.code || `Khuôn #${item.newDieId}`}
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                                      <div>Kích thước: <span className="font-semibold text-foreground">{formatDieSize(item.newDie)}</span></div>
                                      <div>NCC: <span className="font-semibold text-foreground">{item.newDie.vendorName || "—"}</span></div>
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                          </div>

                          {/* Notes */}
                          {item.notes && (
                            <div className="p-2 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded text-xs mt-1">
                              <div className="flex items-start gap-1.5">
                                <Info className="h-3 w-3 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-blue-900 dark:text-blue-100 text-[9px] mb-0.5 uppercase tracking-wider">
                                    Ghi chú
                                  </p>
                                  <p className="leading-relaxed text-[11px] italic text-foreground/80">
                                    {item.notes}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </TabsContent>
              </Tabs>

              {/* Centered Action Buttons at bottom */}
              {isProofer && (
                <div className="flex items-center justify-center gap-2 pt-2 border-t border-muted-foreground/5 mt-auto flex-wrap shrink-0">
                  {order.status !== "completed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1.5 text-[11px] font-semibold px-3 flex-1 border-primary/20 hover:bg-primary/5 text-primary rounded-md whitespace-nowrap transition-colors"
                      onClick={() => setIsDieExportDialogOpen(true)}
                    >
                      <Plus className="h-3 w-3" />
                      Thêm khuôn
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
  );
}
