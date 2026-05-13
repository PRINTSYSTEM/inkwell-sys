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
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  ArrowRight,
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
import { AlertTriangle, AlertCircle } from "lucide-react";
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
      title: "Xác nhận hoàn thành phiếu cắt",
      description: "Bạn có chắc chắn muốn hoàn thành phiếu cắt này? Tồn kho sẽ được trừ ở nguyên liệu đầu vào và cộng vào các sản phẩm đầu ra.",
      confirmText: "Hoàn thành",
      confirmVariant: "default",
    });
  };

  const handleCancel = (id: number) => {
    setConfirmDialog({
      open: true,
      id,
      type: "cancel",
      title: "Xác nhận hủy phiếu cắt",
      description: "Bạn có chắc chắn muốn hủy phiếu cắt này? Hành động này không thể hoàn tác.",
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
      title: `Xác nhận hoàn thành ${selectedIds.length} phiếu đã chọn`,
      description: `Bạn có chắc chắn muốn hoàn thành đồng loạt ${selectedIds.length} phiếu cắt này? Tồn kho của tất cả vật liệu liên quan sẽ được cập nhật.`,
      confirmText: "Xác nhận hoàn thành tất cả",
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
        
        toast.success(`Đã xử lý xong ${successCount}/${ids.length} phiếu cắt`);
        setSelectedIds([]);
        setIsBulkProcessing(false);
      }
      setConfirmDialog({ ...confirmDialog, open: false });
    } catch (error) {
      // Errors are handled by mutate hooks toast
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
    if (statusLower === "pending") return <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">Chờ xử lý</Badge>;
    if (statusLower === "completed") return <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">Hoàn thành</Badge>;
    if (statusLower === "cancelled") return <Badge variant="secondary" className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200">Đã hủy</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <>
      <Helmet>
        <title>Cắt nguyên liệu | Inkwell System</title>
      </Helmet>

      <div className="min-h-screen bg-[#f8fafc]">
        {/* Premium Header Section */}
        <div className="bg-slate-900 text-white pb-24 pt-12">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 backdrop-blur-sm">
                    <Scissors className="h-6 w-6 text-indigo-400" />
                  </div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-white">Cắt nguyên liệu</h1>
                </div>
                <p className="text-slate-400 max-w-md">Quản lý quy trình chia nhỏ nguyên vật liệu và theo dõi biến động tồn kho chi tiết.</p>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => navigate("/stock/material-cuts/create")}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-lg shadow-indigo-900/20 px-6 py-6 h-auto text-base font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Tạo phiếu mới
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section - Overlapping with Header */}
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 pb-12 space-y-6">
          {/* Action Bar & Filters */}
          <div className="grid grid-cols-1 gap-6">
            <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white/80 backdrop-blur-md">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Selection & Bulk Actions */}
                  <div className="flex items-center gap-4">
                    {selectedIds.length > 0 ? (
                      <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100 animate-in fade-in slide-in-from-left-4 duration-300">
                        <span className="text-indigo-700 font-bold text-sm whitespace-nowrap">
                          Đã chọn {selectedIds.length} phiếu
                        </span>
                        <div className="h-4 w-px bg-indigo-200 mx-1" />
                        <Button 
                          size="sm" 
                          onClick={handleBulkComplete}
                          disabled={isBulkProcessing}
                          className="bg-indigo-600 hover:bg-indigo-700 h-8 text-xs font-bold"
                        >
                          {isBulkProcessing ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <CheckCircle2 className="h-3 w-3 mr-2" />}
                          Hoàn thành hàng loạt
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => setSelectedIds([])}
                          className="text-slate-500 hover:text-slate-700 h-8 px-2"
                        >
                          Hủy chọn
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 w-full lg:w-auto">
                        <div className="relative w-full lg:w-80 group">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                          <Input
                            placeholder="Tìm kiếm mã phiếu, nguyên liệu..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 h-11 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 bg-white shadow-sm transition-all"
                          />
                        </div>
                        <Select
                          value={statusFilter || "all"}
                          onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}
                        >
                          <SelectTrigger className="h-11 w-48 border-slate-200 bg-white shadow-sm">
                            <Filter className="h-4 w-4 mr-2 text-slate-400" />
                            <SelectValue placeholder="Trạng thái" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tất cả trạng thái</SelectItem>
                            <SelectItem value="pending">Chờ xử lý</SelectItem>
                            <SelectItem value="completed">Hoàn thành</SelectItem>
                            <SelectItem value="cancelled">Đã hủy</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end lg:self-auto">
                    <Button
                      variant="outline"
                      className="h-11 border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
                      onClick={() => refetch()}
                      disabled={isLoading}
                    >
                      <RefreshCw className={cn("h-4 w-4 mr-2 text-slate-500", isLoading && "animate-spin")} />
                      Làm mới
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Table Card */}
            <Card className="border-none shadow-2xl shadow-slate-200/60 overflow-hidden bg-white">
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className="relative h-16 w-16">
                      <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
                      <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
                    </div>
                    <span className="text-slate-500 font-medium animate-pulse">Đang truy xuất dữ liệu...</span>
                  </div>
                ) : materialCuts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 bg-slate-50/30">
                    <div className="h-20 w-20 rounded-3xl bg-indigo-50 flex items-center justify-center mb-6 border border-indigo-100 shadow-inner">
                      <Scissors className="h-10 w-10 text-indigo-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Không có kết quả</h3>
                    <p className="text-slate-500 mb-8 max-w-xs text-center">Không tìm thấy phiếu cắt nào khớp với tiêu chí tìm kiếm của bạn.</p>
                    <Button onClick={() => { setSearch(""); setStatusFilter(""); }} variant="outline" className="border-slate-300">Xóa tất cả bộ lọc</Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/50 border-b border-slate-100">
                          <TableHead className="w-[50px] px-6">
                            <Checkbox 
                              checked={materialCuts.filter(r => r.status.toLowerCase() === 'pending').length > 0 && selectedIds.length === materialCuts.filter(r => r.status.toLowerCase() === 'pending').length}
                              onCheckedChange={toggleSelectAll}
                              className="border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                            />
                          </TableHead>
                          <TableHead className="w-[140px] font-bold text-slate-700 py-4">Mã phiếu</TableHead>
                          <TableHead className="w-[160px] font-bold text-slate-700">Thời gian</TableHead>
                          <TableHead className="min-w-[220px] font-bold text-slate-700">Nguyên liệu đầu vào</TableHead>
                          <TableHead className="w-[120px] text-right font-bold text-slate-700">Số lượng</TableHead>
                          <TableHead className="min-w-[280px] font-bold text-slate-700 px-4">Thành phẩm đầu ra</TableHead>
                          <TableHead className="w-[140px] text-center font-bold text-slate-700">Trạng thái</TableHead>
                          <TableHead className="w-[80px] px-6"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {materialCuts.map((record) => {
                          const isPending = record.status.toLowerCase() === "pending";
                          const isSelected = selectedIds.includes(record.id);
                          
                          return (
                            <TableRow 
                              key={record.id} 
                              className={cn(
                                "group transition-all duration-200 border-b border-slate-50 hover:bg-indigo-50/30",
                                isSelected && "bg-indigo-50/50"
                              )}
                            >
                              <TableCell className="px-6">
                                <Checkbox 
                                  checked={isSelected}
                                  onCheckedChange={() => toggleSelect(record.id)}
                                  disabled={!isPending}
                                  className={cn(
                                    "border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600",
                                    !isPending && "opacity-0 cursor-default pointer-events-none"
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                                  {record.code || `CUT-${record.id}`}
                                </span>
                              </TableCell>
                              <TableCell className="text-sm text-slate-600">
                                {formatDate(record.cutAt || record.createdAt)}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                    {record.inputMaterialName}
                                  </span>
                                  {record.inputStockBefore !== undefined && record.inputStockBefore !== null && (
                                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">
                                      Tồn trước: {record.inputStockBefore.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex flex-col items-end">
                                  <span className="font-extrabold text-slate-900">{record.quantityUsed?.toLocaleString()}</span>
                                  {record.quantityWasted > 0 && (
                                    <span className="text-[10px] text-rose-500 font-bold">-{record.quantityWasted} hao hụt</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="px-4">
                                <div className="flex flex-wrap gap-1.5">
                                  {record.outputs?.slice(0, 3).map((output) => (
                                    <div key={output.id} className="inline-flex items-center bg-white border border-slate-200 rounded-full px-2.5 py-0.5 shadow-sm">
                                      <span className="text-[11px] font-semibold text-slate-700">{output.outputMaterialName}</span>
                                      <div className="h-2 w-px bg-slate-200 mx-1.5" />
                                      <span className="text-[11px] font-black text-indigo-600">{output.quantityProduced}</span>
                                    </div>
                                  ))}
                                  {record.outputs?.length > 3 && (
                                    <Badge variant="ghost" className="text-[10px] font-bold text-slate-400">+ {record.outputs.length - 3} khác</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                {getStatusBadge(record.status)}
                              </TableCell>
                              <TableCell className="px-6">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-white hover:shadow-md transition-all">
                                      <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48 p-1.5">
                                    <DropdownMenuItem onClick={() => navigate(`/stock/material-cuts/${record.id}`)} className="rounded-md">
                                      <Eye className="h-4 w-4 mr-2 text-slate-400" />
                                      Xem chi tiết
                                    </DropdownMenuItem>
                                    {isPending && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleComplete(record.id)} className="rounded-md text-emerald-600 font-semibold focus:text-emerald-700 focus:bg-emerald-50">
                                          <CheckCircle2 className="h-4 w-4 mr-2" />
                                          Hoàn thành
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleCancel(record.id)} className="rounded-md text-rose-600 font-semibold focus:text-rose-700 focus:bg-rose-50">
                                          <XCircle className="h-4 w-4 mr-2" />
                                          Hủy phiếu
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
                
                {/* Pagination Controls */}
                <div className="px-6 py-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="text-sm text-slate-500 font-medium">
                    Trang <span className="text-slate-900 font-bold">{page}</span> trên <span className="text-slate-900 font-bold">{totalPages}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setPage(p => Math.max(1, p - 1))} 
                      disabled={page === 1}
                      className="h-9 border-slate-200 hover:bg-white"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Trước
                    </Button>
                    <div className="flex items-center gap-1">
                      {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        if (totalPages > 5 && Math.abs(pageNum - page) > 2 && pageNum !== 1 && pageNum !== totalPages) return null;
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? "default" : "ghost"}
                            size="icon"
                            className={cn(
                              "h-9 w-9 text-xs font-bold transition-all",
                              page === pageNum ? "bg-indigo-600 shadow-md shadow-indigo-200" : "text-slate-500"
                            )}
                            onClick={() => setPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                      disabled={page === totalPages}
                      className="h-9 border-slate-200 hover:bg-white"
                    >
                      Sau
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={confirmDialog.open} onOpenChange={(open) => !isBulkProcessing && setConfirmDialog({ ...confirmDialog, open })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-12 w-12 rounded-full flex items-center justify-center shadow-inner",
                confirmDialog.confirmVariant === "destructive" ? "bg-rose-100 text-rose-600" : "bg-indigo-100 text-indigo-600"
              )}>
                {confirmDialog.confirmVariant === "destructive" ? (
                  <AlertTriangle className="h-6 w-6" />
                ) : (
                  <CheckCircle2 className="h-6 w-6" />
                )}
              </div>
              <DialogTitle className="text-xl font-extrabold text-slate-900">{confirmDialog.title}</DialogTitle>
            </div>
            <DialogDescription className="text-base text-slate-600 pt-3 leading-relaxed">{confirmDialog.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
              disabled={isBulkProcessing}
              className="px-6"
            >
              Hủy bỏ
            </Button>
            <Button
              variant={confirmDialog.confirmVariant || "default"}
              onClick={handleConfirm}
              disabled={isBulkProcessing}
              className={cn(
                "px-6 font-bold shadow-lg",
                confirmDialog.confirmVariant === "destructive" 
                  ? "bg-rose-600 hover:bg-rose-700 shadow-rose-200" 
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
              )}
            >
              {isBulkProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {confirmDialog.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
