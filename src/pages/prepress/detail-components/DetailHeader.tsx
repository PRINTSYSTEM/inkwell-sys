import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Box, Edit, Upload, AlertCircle, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
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
}

export function DetailHeader({
  order,
  isEmptyOrder,
  hasDieCutDesigns,
  onBack,
  onOpenDieList,
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
}: DetailHeaderProps) {
  if (!order) return null;

  return (
    <div className="relative mb-4 shrink-0 p-2">
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
                {order.status !== "completed" && isProofer && (
                  <button
                    onClick={() => handleStartEditField("code")}
                    className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-md hover:bg-slate-100"
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
            <div className="flex items-center gap-2">
              {hasDieCutDesigns && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 mr-2"
                  onClick={onOpenDieList}
                >
                  <Box className="h-4 w-4" />
                  Danh sách khuôn bế
                </Button>
              )}
              <span className="text-sm text-muted-foreground">
                Trạng thái hiện tại:
              </span>{" "}
              <StatusBadge
                status={order.status ?? undefined}
                label={
                  proofingStatusLabels[order.status ?? ""] ?? order.status ?? ""
                }
              />
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

                    {/* Move Cancel Button outside the Tooltip if you want it always visible or inside if it depends on status */}
                  </div>
                </TooltipProvider>
              )}

              {/* Always visible "Hủy hình bài" button */}
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
                  Hủy hình bài
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
              {order.isPlateExported && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <AlertCircle className="h-3.5 w-3.5 text-yellow-600" />
                  <span>Đã xuất kẽm</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
  );
}
