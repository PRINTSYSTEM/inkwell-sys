import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  MoreHorizontal,
  Scissors,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Helmet } from "react-helmet-async";
import {
  useMaterialCuts,
  useCompleteMaterialCut,
  useCancelMaterialCut,
} from "@/hooks/use-stock";
import { formatDate } from "@/lib/status-utils";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MaterialCutOutput {
  id: number;
  outputMaterialId: number;
  outputMaterialName: string;
  quantityProduced: number;
  outputStockBefore?: number;
}

interface MaterialCutRecord {
  id: number;
  code: string;
  inputMaterialId: number;
  inputMaterialName: string;
  quantityUsed: number;
  quantityWasted: number;
  inputStockBefore?: number;
  cutAt: string;
  status: string;
  notes: string;
  createdBy: any;
  createdAt: string;
  updatedAt: string;
  outputs: MaterialCutOutput[];
}

export default function MaterialCutListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const { data, isLoading, refetch } = useMaterialCuts({
    pageNumber: page,
    pageSize,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const { mutateAsync: completeMaterialCut } = useCompleteMaterialCut();
  const { mutateAsync: cancelMaterialCut } = useCancelMaterialCut();

  const materialCuts = (data?.items || []) as MaterialCutRecord[];
  const totalPages = data?.totalPages || 1;

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    id: number | number[] | null;
    type: "complete" | "cancel" | "bulk-complete" | null;
    title: string;
    description: string;
    confirmText: string;
    confirmVariant?: "default" | "destructive";
  }>({
    open: false,
    id: null,
    type: null,
    title: "",
    description: "",
    confirmText: "",
    confirmVariant: "default",
  });

  const handleComplete = (id: number) => {
    setConfirmDialog({
      open: true,
      id,
      type: "complete",
      title: "Hoàn thành phiếu cắt",
      description: "Xác nhận hoàn thành phiếu cắt này và cập nhật tồn kho?",
      confirmText: "Hoàn thành",
      confirmVariant: "default",
    });
  };

  const handleCancel = (id: number) => {
    setConfirmDialog({
      open: true,
      id,
      type: "cancel",
      title: "Hủy phiếu cắt",
      description: "Bạn có chắc chắn muốn hủy phiếu cắt này?",
      confirmText: "Hủy phiếu",
      confirmVariant: "destructive",
    });
  };

  const handleBulkComplete = () => {
    if (selectedIds.length === 0) return;
    setConfirmDialog({
      open: true,
      id: selectedIds,
      type: "bulk-complete",
      title: `Hoàn thành ${selectedIds.length} phiếu`,
      description: `Xác nhận hoàn thành đồng loạt ${selectedIds.length} phiếu cắt đã chọn?`,
      confirmText: "Xác nhận",
      confirmVariant: "default",
    });
  };

  const handleConfirm = async () => {
    if (!confirmDialog.id || !confirmDialog.type) return;

    try {
      if (confirmDialog.type === "complete") {
        await completeMaterialCut(confirmDialog.id as number);
      } else if (confirmDialog.type === "cancel") {
        await cancelMaterialCut(confirmDialog.id as number);
      } else if (confirmDialog.type === "bulk-complete") {
        setIsBulkProcessing(true);
        const ids = confirmDialog.id as number[];
        let successCount = 0;
        
        for (const id of ids) {
          try {
            await completeMaterialCut(id);
            successCount++;
          } catch (error) {
            console.error(`Failed to complete record ${id}`, error);
          }
        }
        
        toast.success(`Đã xử lý xong ${successCount}/${ids.length} phiếu`);
        setSelectedIds([]);
        setIsBulkProcessing(false);
      }
      setConfirmDialog({ ...confirmDialog, open: false });
    } catch (error) {
      // Errors are handled by mutate hooks
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const pendings = materialCuts.filter(r => r.status.toLowerCase() === 'pending').map(r => r.id);
    if (selectedIds.length === pendings.length && pendings.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendings);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === "pending") return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Chờ xử lý</Badge>;
    if (statusLower === "completed") return <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Hoàn thành</Badge>;
    if (statusLower === "cancelled") return <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50">Đã hủy</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <>
      <Helmet>
        <title>Cắt nguyên liệu | Inkwell System</title>
      </Helmet>

      <div className="min-h-screen bg-slate-50">
        {/* Simple Header */}
        <div className="bg-white border-b border-slate-200 py-6">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Cắt nguyên liệu</h1>
                <p className="text-sm text-slate-500 mt-1">Quản lý quy trình chia nhỏ nguyên vật liệu</p>
              </div>
              <Button
                onClick={() => navigate("/stock/material-cuts/create")}
                className="bg-primary hover:bg-primary/90 text-white font-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tạo phiếu mới
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Filters & Actions */}
          <Card className="shadow-sm border-slate-200">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-1 items-center gap-4 w-full md:w-auto">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Tìm kiếm phiếu, vật liệu..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select
                    value={statusFilter || "all"}
                    onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="pending">Chờ xử lý</SelectItem>
                      <SelectItem value="completed">Hoàn thành</SelectItem>
                      <SelectItem value="cancelled">Đã hủy</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => refetch()}
                    disabled={isLoading}
                    size="icon"
                  >
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                  </Button>
                </div>

                {selectedIds.length > 0 && (
                  <div className="flex items-center gap-3 bg-blue-50 px-3 py-1.5 rounded border border-blue-100">
                    <span className="text-sm font-medium text-blue-700">Đã chọn {selectedIds.length}</span>
                    <Button 
                      size="sm" 
                      onClick={handleBulkComplete}
                      disabled={isBulkProcessing}
                      className="h-8 bg-emerald-600 hover:bg-emerald-700"
                    >
                      Hoàn thành
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])} className="h-8 text-slate-500">Hủy</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : materialCuts.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-slate-500">Không tìm thấy dữ liệu</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="w-[50px] text-center">
                          <Checkbox 
                            checked={materialCuts.filter(r => r.status.toLowerCase() === 'pending').length > 0 && selectedIds.length === materialCuts.filter(r => r.status.toLowerCase() === 'pending').length}
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">Mã phiếu</TableHead>
                        <TableHead className="font-semibold text-slate-700">Ngày cắt</TableHead>
                        <TableHead className="font-semibold text-slate-700">Nguyên liệu đầu vào</TableHead>
                        <TableHead className="text-right font-semibold text-slate-700">Số lượng</TableHead>
                        <TableHead className="font-semibold text-slate-700">Thành phẩm</TableHead>
                        <TableHead className="text-center font-semibold text-slate-700">Trạng thái</TableHead>
                        <TableHead className="w-[60px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materialCuts.map((record) => {
                        const isPending = record.status.toLowerCase() === "pending";
                        const isSelected = selectedIds.includes(record.id);
                        return (
                          <TableRow key={record.id} className={cn(isSelected && "bg-blue-50/30")}>
                            <TableCell className="text-center">
                              <Checkbox 
                                checked={isSelected}
                                onCheckedChange={() => toggleSelect(record.id)}
                                disabled={!isPending}
                                className={!isPending ? "opacity-0 pointer-events-none" : ""}
                              />
                            </TableCell>
                            <TableCell className="font-medium text-blue-600">{record.code || `CUT-${record.id}`}</TableCell>
                            <TableCell className="text-sm text-slate-600">{formatDate(record.cutAt || record.createdAt)}</TableCell>
                            <TableCell>
                              <div className="font-medium">{record.inputMaterialName}</div>
                              {record.inputStockBefore != null && (
                                <span className="text-[10px] text-slate-400">Tồn: {record.inputStockBefore.toLocaleString()}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium">{record.quantityUsed?.toLocaleString()}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {record.outputs?.slice(0, 2).map((output) => (
                                  <Badge key={output.id} variant="secondary" className="text-[10px] font-normal py-0">
                                    {output.outputMaterialName}: {output.quantityProduced}
                                  </Badge>
                                ))}
                                {record.outputs?.length > 2 && <span className="text-[10px] text-slate-400">+{record.outputs.length - 2}</span>}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">{getStatusBadge(record.status)}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => navigate(`/stock/material-cuts/${record.id}`)}>
                                    <Eye className="h-4 w-4 mr-2" /> Chi tiết
                                  </DropdownMenuItem>
                                  {isPending && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => handleComplete(record.id)} className="text-emerald-600">
                                        <CheckCircle2 className="h-4 w-4 mr-2" /> Hoàn thành
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleCancel(record.id)} className="text-rose-600">
                                        <XCircle className="h-4 w-4 mr-2" /> Hủy phiếu
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Trang {page} / {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogDescription>{confirmDialog.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>Đóng</Button>
              <Button
                variant={confirmDialog.confirmVariant || "default"}
                onClick={handleConfirm}
                disabled={isBulkProcessing}
                className={confirmDialog.confirmVariant === "destructive" ? "bg-rose-600 hover:bg-rose-700" : (confirmDialog.type?.includes("complete") ? "bg-emerald-600 hover:bg-emerald-700" : "bg-primary hover:bg-primary/90")}
              >
              {isBulkProcessing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {confirmDialog.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
