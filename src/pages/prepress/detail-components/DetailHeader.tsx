import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Box, Edit, Upload, AlertCircle, Trash2, History } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { proofingStatusLabels } from "@/lib/status-utils";

interface DetailHeaderProps {
  order: any;
  isEmptyOrder: boolean;
  hasDieCutDesigns: boolean;
  onBack: () => void;
  onOpenDieList: () => void;
  onOpenHistory?: () => void;
  onStatusChangeClick: () => void;
  onOldStatusChangeClick: () => void;
  onUploadClick: () => void;
  onCancelClick?: () => void;
  canMarkCompleted: boolean;
  completionMissingItems: string[];
  nextStatusInfo: {
    nextStatus: string;
    buttonLabel: string;
    confirmMessage: string;
  } | null;
  isProofer?: boolean;
  editingField: string | null;
  inlineCode: string;
  setInlineCode: (val: string) => void;
  isUpdatingInfo: boolean;
  handleStartEditField: (
    field: "totalQuantity" | "paperSize" | "notes" | "basisWeight" | "rollWidth" | "code"
  ) => void;
  handleCancelEditField: () => void;
  handleSaveField: () => void;
  onDeleteClick?: () => void;
  isDeleting?: boolean;
  onUpdateCompletedAt?: (completedAt: string | null) => Promise<void>;
  isAuthorizedForVisibility?: boolean;
  isTogglingVisibility?: boolean;
  onToggleDeliveryVisibility?: () => void;
}

export function DetailHeader({
  order,
  isEmptyOrder,
  hasDieCutDesigns,
  onBack,
  onOpenDieList,
  onOpenHistory,
  onStatusChangeClick,
  onOldStatusChangeClick,
  onUploadClick,
  onCancelClick,
  canMarkCompleted,
  completionMissingItems,
  nextStatusInfo,
  isProofer = true,
  editingField,
  inlineCode,
  setInlineCode,
  isUpdatingInfo,
  handleStartEditField,
  handleCancelEditField,
  handleSaveField,
  onDeleteClick,
  isDeleting = false,
  onUpdateCompletedAt,
  isAuthorizedForVisibility = false,
  isTogglingVisibility = false,
  onToggleDeliveryVisibility,
}: DetailHeaderProps) {
  const [isEditingCompletedAt, setIsEditingCompletedAt] = useState(false);
  const [tempCompletedAt, setTempCompletedAt] = useState("");
  const [isSavingCompletedAt, setIsSavingCompletedAt] = useState(false);

  const handleSaveCompletedAt = async () => {
    if (!onUpdateCompletedAt) return;
    setIsSavingCompletedAt(true);
    try {
      const dateVal = tempCompletedAt ? new Date(tempCompletedAt).toISOString() : null;
      await onUpdateCompletedAt(dateVal);
      setIsEditingCompletedAt(false);
    } catch (e) {
      // Error is handled in parent
    } finally {
      setIsSavingCompletedAt(false);
    }
  };

  if (!order) return null;

  return (
    <div className="relative mb-4 shrink-0 p-2 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex flex-col">
          {(editingField === "code" || editingField === "all") ? (
            <div className="flex items-center gap-1.5 mt-0.5">
              <Input
                value={inlineCode}
                onChange={(e) => setInlineCode(e.target.value)}
                className="h-8 text-sm font-semibold px-2 w-48 bg-slate-50/50"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveField();
                  else if (e.key === "Escape") handleCancelEditField();
                }}
                autoFocus={editingField === "code"}
                disabled={isUpdatingInfo}
                placeholder="Nhập mã bài..."
              />
              {editingField !== "all" && (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-[11px] font-bold"
                    onClick={handleSaveField}
                    disabled={isUpdatingInfo}
                  >
                    Lưu
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-[11px]"
                    onClick={handleCancelEditField}
                    disabled={isUpdatingInfo}
                  >
                    Hủy
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <h1 className="text-xl font-semibold">{order.code ?? "—"}</h1>
              {isProofer && (
                <button
                  onClick={() => handleStartEditField("code")}
                  className="text-muted-foreground hover:text-foreground p-0.5 rounded-md hover:bg-slate-100"
                  title="Chỉnh sửa mã bài"
                >
                  <Edit className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
          <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Chi tiết mã bài</p>
        </div>
      </div>
      {!isEmptyOrder && (
        <>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            {hasDieCutDesigns && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 mr-1"
                onClick={onOpenDieList}
              >
                <Box className="h-4 w-4" />
                Danh sách khuôn bế
              </Button>
            )}

            {/* Status Information Group: Primary status and unified secondary status line */}
            <div className="flex flex-col justify-center gap-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Trạng thái:
                </span>
                <StatusBadge
                  status={order.status ?? undefined}
                  label={
                    proofingStatusLabels[order.status ?? ""] ?? order.status ?? ""
                  }
                />
                {order.isHiddenFromDelivery && (
                  <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200 text-xs font-semibold py-0.5 px-2">
                    Đã ẩn giao hàng
                  </Badge>
                )}
              </div>

              {/* Secondary status info line: single unified prominent tag */}
              {order.status === "production_returned" && (order.returnTypeDisplayName || order.returnType || order.returnReason) && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-100/90 text-red-800 border border-red-300/80 shadow-2xs">
                  <AlertCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                  <span>{order.returnTypeDisplayName || (order.returnType === "dispatch" ? "Điều lệnh trả về" : "Lệnh in trả về")}</span>
                  {order.returnReason && (
                    <>
                      <span className="text-red-400">•</span>
                      <span>Lý do: <span className="font-bold text-red-950">{order.returnReason}</span></span>
                    </>
                  )}
                </div>
              )}

              {/* Completion Time / Thời gian hoàn thành */}
              {order.status === "completed" && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Thời gian bình bài:</span>
                  {isEditingCompletedAt ? (
                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border rounded px-1.5 py-0.5 shadow-sm">
                      <input
                        type="datetime-local"
                        value={tempCompletedAt}
                        onChange={(e) => setTempCompletedAt(e.target.value)}
                        className="h-7 text-xs border rounded px-1.5 bg-white dark:bg-slate-950 font-medium"
                        disabled={isSavingCompletedAt}
                      />
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 px-2 text-xs font-bold"
                        onClick={handleSaveCompletedAt}
                        disabled={isSavingCompletedAt}
                      >
                        {isSavingCompletedAt ? "Lưu..." : "Lưu"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-1.5 text-xs"
                        onClick={() => setIsEditingCompletedAt(false)}
                        disabled={isSavingCompletedAt}
                      >
                        Hủy
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-foreground">
                        {order.completedAt
                          ? format(new Date(order.completedAt), "dd/MM/yyyy HH:mm")
                          : order.updatedAt
                            ? format(new Date(order.updatedAt), "dd/MM/yyyy HH:mm")
                            : "—"}
                      </span>
                      {isProofer && (
                        <button
                          onClick={() => {
                            const defaultDate = order.completedAt
                              ? new Date(order.completedAt)
                              : order.updatedAt
                                ? new Date(order.updatedAt)
                                : new Date();
                            const offset = defaultDate.getTimezoneOffset();
                            const localDate = new Date(defaultDate.getTime() - offset * 60 * 1000);
                            setTempCompletedAt(localDate.toISOString().slice(0, 16));
                            setIsEditingCompletedAt(true);
                          }}
                          className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Chỉnh sửa thời gian hoàn thành"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Divider line between Status info & Action Buttons */}
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {onOpenHistory && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50/50 hover:bg-blue-100/80 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900"
                  onClick={onOpenHistory}
                >
                  <History className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  Lịch sử bài bình
                </Button>
              )}

              {nextStatusInfo && isProofer && (
                <TooltipProvider>
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-block">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 h-8 text-xs"
                            onClick={onStatusChangeClick}
                          >
                            <Edit className="h-3.5 w-3.5" />
                            {nextStatusInfo.buttonLabel}
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {(order?.status === "not_completed" || order?.status === "production_returned") &&
                        !canMarkCompleted && (
                          <TooltipContent className="max-w-xs">
                            <div className="space-y-1">
                              <p className="font-semibold">
                                Chưa thể hoàn thành vì còn thiếu:
                              </p>
                              <ul className="list-disc pl-4 space-y-0.5">
                                {completionMissingItems.map((item) => (
                                  <li key={item} className="text-sm">
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </TooltipContent>
                        )}
                    </Tooltip>
                  </div>
                </TooltipProvider>
              )}

              {/* Always visible "Hủy bình bài" button */}
              {isProofer && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                  onClick={() => {
                    if (onCancelClick) onCancelClick();
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Hủy bình bài
                </Button>
              )}

              {isProofer && order.status === "waiting_for_file" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8 text-xs"
                  onClick={onOldStatusChangeClick}
                  title={
                    !order.proofingFileUrl
                      ? "Vui lòng tải lên file bình bài trước"
                      : "Chuyển sang chờ sản xuất"
                  }
                >
                  <Edit className="h-3.5 w-3.5" />
                  Chuyển trạng thái
                </Button>
              )}

              {isProofer && order.status !== "completed" && (
                <Button
                  size="sm"
                  className="gap-1.5 h-8 text-xs"
                  onClick={onUploadClick}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {order.proofingFileUrl ? "Thay đổi file " : "Tải lên file"}
                </Button>
              )}

              {/* "Ẩn giao hàng" button placed at the end of action buttons */}
              {isAuthorizedForVisibility && onToggleDeliveryVisibility && (
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "gap-1.5 h-8 text-xs font-medium transition-colors",
                    order.isHiddenFromDelivery
                      ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                      : "text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200"
                  )}
                  onClick={onToggleDeliveryVisibility}
                  disabled={isTogglingVisibility}
                >
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {order.isHiddenFromDelivery ? "Hiện giao hàng" : "Ẩn giao hàng"}
                </Button>
              )}

              {order.isPlateExported && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-1">
                  <AlertCircle className="h-3.5 w-3.5 text-yellow-600" />
                  <span>Đã xuất kẽm</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      {isEmptyOrder && isProofer && (
        <Button
          variant="destructive"
          size="sm"
          className="gap-1.5 h-8 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm"
          onClick={onDeleteClick}
          disabled={isDeleting}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Xóa bình bài
        </Button>
      )}
    </div>
  );
}
