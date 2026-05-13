import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Scissors,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Hash,
  User,
  Package,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useMaterialCut,
  useCompleteMaterialCut,
  useCancelMaterialCut,
} from "@/hooks/use-stock";
import { formatDate, formatDateTime } from "@/lib/status-utils";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";

export default function MaterialCutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const cutId = Number.parseInt(id || "0", 10);

  const {
    data: materialCut,
    isLoading,
    isError,
  } = useMaterialCut(cutId || null, !!cutId);

  const { mutate: completeMaterialCut, isPending: isCompleting } = useCompleteMaterialCut();
  const { mutate: cancelMaterialCut, isPending: isCancelling } = useCancelMaterialCut();

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: "complete" | "cancel" | null;
    title: string;
    description: string;
    confirmText: string;
    confirmVariant?: "default" | "destructive";
  }>({
    open: false,
    type: null,
    title: "",
    description: "",
    confirmText: "",
    confirmVariant: "default",
  });

  const handleComplete = () => {
    setConfirmDialog({
      open: true,
      type: "complete",
      title: "Hoàn thành phiếu cắt",
      description: "Xác nhận hoàn thành phiếu cắt này?",
      confirmText: "Hoàn thành",
      confirmVariant: "default",
    });
  };

  const handleCancel = () => {
    setConfirmDialog({
      open: true,
      type: "cancel",
      title: "Hủy phiếu cắt",
      description: "Bạn có chắc chắn muốn hủy phiếu cắt này?",
      confirmText: "Hủy phiếu",
      confirmVariant: "destructive",
    });
  };

  const handleConfirm = () => {
    if (!materialCut?.id || !confirmDialog.type) return;

    if (confirmDialog.type === "complete") {
      completeMaterialCut(materialCut.id, {
        onSuccess: () => setConfirmDialog({ ...confirmDialog, open: false }),
      });
    } else if (confirmDialog.type === "cancel") {
      cancelMaterialCut(materialCut.id, {
        onSuccess: () => setConfirmDialog({ ...confirmDialog, open: false }),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (isError || !materialCut) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-slate-500">Không tìm thấy phiếu cắt</p>
          <Button onClick={() => navigate("/stock/material-cuts")}>Quay lại</Button>
        </div>
      </div>
    );
  }

  const status = materialCut.status?.toLowerCase() || "pending";
  const outputs = materialCut.outputs || [];

  return (
    <>
      <Helmet>
        <title>Chi tiết phiếu cắt | Inkwell System</title>
      </Helmet>
      
      <div className="min-h-screen bg-slate-50">
        {/* Simple Header */}
        <div className="bg-white border-b border-slate-200 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigate("/stock/material-cuts")}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Danh sách
                </Button>
                <div className="h-6 w-px bg-slate-200" />
                <h1 className="text-lg font-bold">Phiếu #{materialCut.code || materialCut.id}</h1>
                <StatusBadge status={status} label={status === 'pending' ? 'Chờ xử lý' : status === 'completed' ? 'Hoàn thành' : 'Đã hủy'} />
              </div>
              
              <div className="flex items-center gap-2">
                {status === "pending" && (
                  <>
                    <Button variant="outline" onClick={handleCancel} disabled={isCancelling} className="text-rose-600 border-rose-200">Hủy</Button>
                    <Button onClick={handleComplete} disabled={isCompleting} className="bg-emerald-600 hover:bg-emerald-700">Hoàn thành</Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="py-3 border-b border-slate-100">
                  <CardTitle className="text-sm font-semibold">Thông tin chung</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label className="text-[10px] text-slate-400 uppercase">Nguyên liệu đầu vào</Label>
                    <p className="font-semibold">{materialCut.inputMaterialName}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-[10px] text-slate-400 uppercase">Sử dụng</Label>
                      <p className="font-bold">{materialCut.quantityUsed?.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-[10px] text-slate-400 uppercase">Hao hụt</Label>
                      <p className="font-bold text-rose-600">{materialCut.quantityWasted?.toLocaleString()}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>{formatDateTime(materialCut.cutAt || materialCut.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-slate-400" />
                      <span>{typeof materialCut.createdBy === 'object' ? materialCut.createdBy.fullName : (materialCut.createdBy || "Hệ thống")}</span>
                    </div>
                  </div>

                  {materialCut.notes && (
                    <div className="bg-slate-50 p-3 rounded border border-slate-100 text-sm italic text-slate-600">
                      {materialCut.notes}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="py-3 border-b border-slate-100">
                  <CardTitle className="text-sm font-semibold">Sản phẩm đầu ra</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="w-[50px] text-center">STT</TableHead>
                        <TableHead>Vật liệu</TableHead>
                        <TableHead className="text-right">Số lượng</TableHead>
                        {status === 'completed' && <TableHead className="text-right">Tồn trước</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {outputs.map((output: any, index: number) => (
                        <TableRow key={output.id || index}>
                          <TableCell className="text-center text-slate-400">{index + 1}</TableCell>
                          <TableCell className="font-medium">{output.outputMaterialName}</TableCell>
                          <TableCell className="text-right font-bold text-blue-600">{output.quantityProduced?.toLocaleString()}</TableCell>
                          {status === 'completed' && <TableCell className="text-right text-slate-500 italic">{output.outputStockBefore?.toLocaleString() || 0}</TableCell>}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-sm">
                    <span className="font-medium text-slate-600">Tổng sản lượng:</span>
                    <span className="font-bold text-blue-600 text-lg">
                      {outputs.reduce((sum: number, o: any) => sum + (o.quantityProduced || 0), 0).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">{confirmDialog.title}</DialogTitle>
            <DialogDescription className="text-sm">{confirmDialog.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>Hủy</Button>
            <Button
              variant={confirmDialog.confirmVariant || "default"}
              size="sm"
              onClick={handleConfirm}
              className={confirmDialog.confirmVariant === "destructive" ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"}
            >
              {confirmDialog.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
