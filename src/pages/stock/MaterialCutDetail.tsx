import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Scissors,
  Calendar,
  FileText,
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
      title: "Xác nhận hoàn thành phiếu cắt",
      description: "Bạn có chắc chắn muốn hoàn thành phiếu cắt này? Tồn kho sẽ được trừ ở nguyên liệu đầu vào và cộng vào các sản phẩm đầu ra.",
      confirmText: "Hoàn thành",
      confirmVariant: "default",
    });
  };

  const handleCancel = () => {
    setConfirmDialog({
      open: true,
      type: "cancel",
      title: "Xác nhận hủy phiếu cắt",
      description: "Bạn có chắc chắn muốn hủy phiếu cắt này? Hành động này không thể hoàn tác.",
      confirmText: "Hủy phiếu",
      confirmVariant: "destructive",
    });
  };

  const handleConfirm = () => {
    if (!materialCut?.id || !confirmDialog.type) return;

    if (confirmDialog.type === "complete") {
      completeMaterialCut(materialCut.id, {
        onSuccess: () => {
          setConfirmDialog({ ...confirmDialog, open: false });
        },
      });
    } else if (confirmDialog.type === "cancel") {
      cancelMaterialCut(materialCut.id, {
        onSuccess: () => {
          setConfirmDialog({ ...confirmDialog, open: false });
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-slate-600 font-medium">Đang tải phiếu cắt...</p>
        </div>
      </div>
    );
  }

  if (isError || !materialCut) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
            <h1 className="text-xl font-semibold text-slate-900">Không tìm thấy phiếu cắt</h1>
            <p className="text-slate-600">Phiếu cắt không tồn tại hoặc đã bị xóa</p>
            <Button onClick={() => navigate("/stock/material-cuts")}>Quay lại danh sách</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = materialCut.status?.toLowerCase() || "pending";
  const outputs = materialCut.outputs || [];

  return (
    <>
      <Helmet>
        <title>Phiếu cắt nguyên liệu #{materialCut.code || materialCut.id} | Inkwell System</title>
      </Helmet>
      
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Sticky Header */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/stock/material-cuts")} className="rounded-full">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="h-6 w-px bg-slate-200" />
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                    <Scissors className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-slate-900">
                      Phiếu cắt #{materialCut.code || materialCut.id}
                    </h1>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={status} label={status === 'pending' ? 'Chờ xử lý' : status === 'completed' ? 'Hoàn thành' : 'Đã hủy'} />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {status === "pending" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isCancelling}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      {isCancelling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                      Hủy phiếu
                    </Button>
                    <Button
                      onClick={handleComplete}
                      disabled={isCompleting}
                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
                    >
                      {isCompleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                      Hoàn thành cắt
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* General Information Card */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-200 py-3 px-4">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Thông tin chung</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-slate-400">Nguyên liệu đầu vào</Label>
                    <div className="flex items-center gap-2 text-slate-900 font-semibold">
                      <Package className="h-4 w-4 text-blue-500" />
                      {materialCut.inputMaterialName}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase font-bold text-slate-400">Số lượng sử dụng</Label>
                      <div className="text-lg font-bold text-slate-900">{materialCut.quantityUsed?.toLocaleString()}</div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase font-bold text-slate-400">Số lượng hao hụt</Label>
                      <div className="text-lg font-bold text-red-600">{materialCut.quantityWasted?.toLocaleString()}</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1">Ngày thực hiện</p>
                        <p className="text-sm font-medium">{formatDateTime(materialCut.cutAt || materialCut.createdAt)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1">Người lập phiếu</p>
                        <p className="text-sm font-medium">
                          {typeof materialCut.createdBy === 'object' 
                            ? materialCut.createdBy.fullName 
                            : (materialCut.createdBy || "Hệ thống")}
                        </p>
                      </div>
                    </div>

                    {materialCut.inputStockBefore !== null && materialCut.inputStockBefore !== undefined && (
                      <div className="flex items-center gap-3">
                        <Hash className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1">Tồn kho trước khi cắt</p>
                          <p className="text-sm font-medium">{materialCut.inputStockBefore?.toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {materialCut.notes && (
                    <div className="pt-2">
                      <Label className="text-[10px] uppercase font-bold text-slate-400">Ghi chú</Label>
                      <div className="mt-1 p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-600 italic">
                        {materialCut.notes}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Outputs List Card */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-slate-200 shadow-sm overflow-hidden h-full">
                <CardHeader className="bg-slate-50/50 border-b border-slate-200 py-3 px-4 flex flex-row items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Sản phẩm đầu ra ({outputs.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/30">
                        <TableHead className="w-[60px] text-center">STT</TableHead>
                        <TableHead>Tên sản phẩm</TableHead>
                        <TableHead className="text-right">Số lượng thành phẩm</TableHead>
                        {status === 'completed' && <TableHead className="text-right">Tồn trước cắt</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {outputs.map((output: any, index: number) => (
                        <TableRow key={output.id || index}>
                          <TableCell className="text-center font-medium text-slate-400">{index + 1}</TableCell>
                          <TableCell className="font-semibold text-slate-900">{output.outputMaterialName}</TableCell>
                          <TableCell className="text-right text-lg font-bold text-blue-600">{output.quantityProduced?.toLocaleString()}</TableCell>
                          {status === 'completed' && (
                            <TableCell className="text-right text-slate-500 font-medium italic">
                              {output.outputStockBefore?.toLocaleString() || 0}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Hiệu suất sản lượng</p>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-32 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: `${Math.min(100, (outputs.reduce((sum: number, o: any) => sum + (o.quantityProduced || 0), 0) / (materialCut.quantityUsed || 1) * 100))}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-slate-700">
                          {(outputs.reduce((sum: number, o: any) => sum + (o.quantityProduced || 0), 0) / (materialCut.quantityUsed || 1) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Tổng sản phẩm</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {outputs.reduce((sum: number, o: any) => sum + (o.quantityProduced || 0), 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                confirmDialog.confirmVariant === "destructive" ? "bg-red-100" : "bg-blue-100"
              }`}>
                {confirmDialog.confirmVariant === "destructive" ? (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <DialogTitle className="text-lg font-semibold">{confirmDialog.title}</DialogTitle>
            </div>
            <DialogDescription className="text-sm text-slate-600 pt-2">{confirmDialog.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>Hủy</Button>
            <Button
              variant={confirmDialog.confirmVariant || "default"}
              onClick={handleConfirm}
              className={confirmDialog.confirmVariant === "destructive" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}
            >
              {(isCompleting || isCancelling) ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {confirmDialog.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
