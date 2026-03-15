import { Button } from "@/components/ui/button";
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
  onCancelClick?: () => void; // Added onCancelClick
  canMarkCompleted: boolean;
  completionMissingItems: string[];
  nextStatusInfo: {
    nextStatus: string;
    buttonLabel: string;
    confirmMessage: string;
  } | null;
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
  onCancelClick, // Added onCancelClick
  canMarkCompleted,
  completionMissingItems,
  nextStatusInfo,
}: DetailHeaderProps) {
  if (!order) return null;

  return (
    <div className="flex items-center justify-between shrink-0 mb-4 relative">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">{order.code ?? ""}</h1>
          <p className="text-xs text-muted-foreground">Chi tiết mã bài</p>
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
            {nextStatusInfo && (
              <TooltipProvider>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className={cn(
                          "inline-block",
                          order?.status === "not_completed" &&
                            !canMarkCompleted &&
                            "cursor-not-allowed"
                        )}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 h-8 text-xs"
                          onClick={onStatusChangeClick}
                          disabled={
                            order?.status === "not_completed" &&
                            !canMarkCompleted
                          }
                        >
                          <Edit className="h-3.5 w-3.5" />
                          {nextStatusInfo.buttonLabel}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {order?.status === "not_completed" && !canMarkCompleted && (
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

                  {/* Add Cancel Design button here */}
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
                </div>
              </TooltipProvider>
            )}
            {order.status === "waiting_for_file" && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-xs"
                onClick={onOldStatusChangeClick}
                disabled={!order.proofingFileUrl}
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
            {order.status !== "completed" && (
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
