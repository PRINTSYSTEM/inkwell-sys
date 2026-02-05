import { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  RefreshCw,
  Download,
  FileText,
  Loader2,
  AlertCircle,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useCreateDebtReconciliationAR,
  useDownloadDebtReconciliationAR,
} from "@/hooks/use-ar-ap";
import { formatCurrency } from "@/lib/status-utils";
import { DebtReconciliationARModal } from "@/components/accounting/debt-reconciliations/DebtReconciliationARModal";
import { useCustomers } from "@/hooks/use-customer";
import { toast } from "sonner";

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: vi });
};

export default function DebtReconciliationARPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const { mutate: download, loading: downloading } =
    useDownloadDebtReconciliationAR();

  // Mock data - replace with actual hook when available
  const reconciliations: Array<{
    id: number;
    code: string;
    customerName: string;
    fromDate: string;
    toDate: string;
    status: string;
    createdAt: string;
  }> = [];

  const handleDownload = async (id: number, format: "pdf" | "docx" = "pdf") => {
    try {
      setDownloadingId(id);
      await download(id, { format });
    } catch (error) {
      // Error handled by hook
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="h-auto flex flex-col overflow-hidden">
      {/* Header with Create Button */}
      <div className="flex-shrink-0 px-6 py-3 border-b bg-background flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Biên bản đối chiếu công nợ phải thu
          </h1>
          <p className="text-xs text-muted-foreground">
            Tạo và tải xuống biên bản đối chiếu công nợ với khách hàng
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo biên bản
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {reconciliations.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-center">
                  Chưa có biên bản đối chiếu
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                <p className="mb-4">
                  Tạo biên bản đối chiếu công nợ phải thu với khách hàng
                </p>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo biên bản đầu tiên
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex-1 overflow-auto border-t">
            <Table className="min-w-full">
              <TableHeader className="sticky top-0 bg-muted/50 z-10">
                <TableRow>
                  <TableHead className="w-[140px] font-semibold">Mã biên bản</TableHead>
                  <TableHead className="font-semibold">Khách hàng</TableHead>
                  <TableHead className="text-center font-semibold">Từ ngày</TableHead>
                  <TableHead className="text-center font-semibold">Đến ngày</TableHead>
                  <TableHead className="text-center font-semibold">Ngày tạo</TableHead>
                  <TableHead className="text-center font-semibold">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reconciliations.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-semibold font-mono text-sm">
                      {item.code}
                    </TableCell>
                    <TableCell className="font-semibold text-sm">
                      {item.customerName}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {formatDate(item.fromDate)}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {formatDate(item.toDate)}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {formatDate(item.createdAt)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(item.id, "pdf")}
                          disabled={downloading && downloadingId === item.id}
                        >
                          {downloading && downloadingId === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FileText className="h-4 w-4 mr-1" />
                          )}
                          PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(item.id, "docx")}
                          disabled={downloading && downloadingId === item.id}
                        >
                          {downloading && downloadingId === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FileText className="h-4 w-4 mr-1" />
                          )}
                          Word
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <DebtReconciliationARModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          toast.success("Đã tạo biên bản đối chiếu thành công");
        }}
      />
    </div>
  );
}
