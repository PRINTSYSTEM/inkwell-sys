import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDebtNotificationPreview } from "@/hooks/use-debt-notification";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCurrency } from "@/lib/status-utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface DebtNotificationPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notificationId: number;
}

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: vi });
};

export function DebtNotificationPreviewDialog({
  open,
  onOpenChange,
  notificationId,
}: DebtNotificationPreviewDialogProps) {
  const { data: previewData, isLoading, isError } = useDebtNotificationPreview(
    notificationId,
    open
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Xem trước thông báo công nợ</DialogTitle>
          <DialogDescription>
            Nội dung thông báo công nợ
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : isError ? (
          <Alert variant="destructive">
            <AlertDescription>
              Không thể tải nội dung xem trước
            </AlertDescription>
          </Alert>
        ) : previewData ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Tiêu đề
              </p>
              <p className="text-sm font-semibold">{previewData.subject || "—"}</p>
            </div>

            {previewData.body && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Nội dung thông báo
                </p>
                <div className="p-4 bg-muted rounded-md">
                  <p className="text-sm whitespace-pre-wrap">{previewData.body}</p>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
