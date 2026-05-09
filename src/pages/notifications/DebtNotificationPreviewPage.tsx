import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Mail, 
  FileText, 
  Loader2, 
  AlertCircle,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useDebtNotificationPreview } from "@/hooks/use-debt-notification";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function DebtNotificationPreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notificationId = id ? parseInt(id) : null;

  const { data: previewData, isLoading, isError, error } = useDebtNotificationPreview(notificationId);

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "—";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: vi });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Đang tải nội dung thông báo...</p>
      </div>
    );
  }

  if (isError || !previewData) {
    return (
      <div className="container mx-auto p-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold text-destructive mb-2">Không thể tải thông báo</h2>
            <p className="text-muted-foreground">
              {error instanceof Error ? error.message : "Đã xảy ra lỗi khi lấy dữ liệu thông báo."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>
        <Badge variant="outline" className="px-3 py-1">
          ID: #{notificationId}
        </Badge>
      </div>

      <Card className="shadow-lg border-primary/10">
        <CardHeader className="bg-muted/30 pb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <Badge className="mb-2">{previewData.type === "AR" ? "Công nợ phải thu" : "Công nợ phải trả"}</Badge>
              <CardTitle className="text-2xl font-bold text-foreground">
                {previewData.subject || "Không có tiêu đề"}
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(previewData.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-8">
          <div className="prose prose-slate max-w-none">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800 whitespace-pre-wrap leading-relaxed text-lg">
              {previewData.body}
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2 text-primary">
                <User className="h-4 w-4" />
                Thông tin khách hàng
              </h3>
              <div className="bg-muted/20 p-4 rounded-lg space-y-2 border border-muted">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tên:</span>
                  <span className="text-sm font-medium">{previewData.customerName || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Công ty:</span>
                  <span className="text-sm font-medium">{previewData.customerCompanyName || "—"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2 text-primary">
                <Mail className="h-4 w-4" />
                Chi tiết gửi
              </h3>
              <div className="bg-muted/20 p-4 rounded-lg space-y-2 border border-muted">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Trạng thái:</span>
                  <Badge variant={previewData.sentAt ? "default" : "secondary"}>
                    {previewData.sentAt ? "Đã gửi" : "Chưa gửi"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Ngày gửi:</span>
                  <span className="text-sm font-medium">{formatDate(previewData.sentAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
