import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  Download,
  Edit,
  FileText,
  Filter,
  Layers,
  Loader2,
  RefreshCw,
  Trash2,
  User,
  X,
} from "lucide-react";
import {
  useDefectRecords,
  useUpdateDefectRecord,
  useDeleteDefectRecord,
} from "@/hooks/use-defect-record";
import { useProductionOrder } from "@/hooks/use-production";
import { useProofingOrder } from "@/hooks/use-proofing-order";
import { useAuth } from "@/hooks/use-auth";
import { ROLE } from "@/constants";
import { AsyncSelect } from "@/components/forms/AsyncSelect";
import { apiRequest } from "@/lib/http";
import { productionStepTypeLabels } from "@/lib/status-utils";
import type {
  DefectRecordResponse,
  UserResponsePaginate,
  DefectRecordListParams,
} from "@/Schema";

const DEFECT_SOURCES = [
  { value: "design", label: "Lỗi do thiết kế" },
  { value: "proofing", label: "Lỗi do bình bài" },
  { value: "production", label: "Lỗi do sản xuất" },
  { value: "management_decision", label: "Quyết định quản lý" },
];

export default function DefectRecordListPage() {
  const { user } = useAuth();

  // Table state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [pageInput, setPageInput] = useState("1");

  // Filters state
  const [assignedToUserId, setAssignedToUserId] = useState<string | number>("");
  const [defectSource, setDefectSource] = useState<string>("all");
  const [productionOrderId, setProductionOrderId] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // Edit / Delete dialog states
  const [editingRecord, setEditingRecord] = useState<DefectRecordResponse | null>(null);
  const [deletingRecordId, setDeletingRecordId] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Role permissions
  const userRole = user?.role;
  const canEdit =
    userRole === ROLE.ADMIN ||
    userRole === ROLE.MANAGER ||
    userRole === ROLE.PRODUCTION_LEAD;
  const canDelete = userRole === ROLE.ADMIN || userRole === ROLE.MANAGER;

  // Build API query parameters
  const queryParams = useMemo<DefectRecordListParams>(() => {
    const params: DefectRecordListParams = {
      pageNumber: currentPage,
      pageSize: itemsPerPage,
      sortColumn: "defectOccurredAt",
      sortOrder: "desc",
    };

    if (assignedToUserId) {
      params.assignedToUserId = Number(assignedToUserId);
    }
    if (defectSource && defectSource !== "all") {
      params.defectSource = defectSource;
    }
    if (productionOrderId) {
      params.productionOrderId = Number(productionOrderId);
    }
    if (fromDate) {
      params.fromDate = new Date(fromDate).toISOString();
    }
    if (toDate) {
      params.toDate = new Date(toDate).toISOString();
    }

    return params;
  }, [currentPage, itemsPerPage, assignedToUserId, defectSource, productionOrderId, fromDate, toDate]);

  // Fetch defect records
  const {
    data: defectRecordsResp,
    isLoading,
    isRefetching,
    refetch,
  } = useDefectRecords(queryParams);

  const deleteMutation = useDeleteDefectRecord();

  const items = defectRecordsResp?.items ?? [];
  const totalCount = defectRecordsResp?.total ?? 0;
  const totalPages = defectRecordsResp?.totalPages ?? 1;

  // Sync pageInput with currentPage
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  // Clear filters handler
  const handleClearFilters = () => {
    setAssignedToUserId("");
    setDefectSource("all");
    setProductionOrderId("");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  };

  // Export Excel handler
  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const params: Record<string, any> = {};
      if (assignedToUserId) params.assignedToUserId = assignedToUserId;
      if (defectSource && defectSource !== "all") params.defectSource = defectSource;
      if (productionOrderId) params.productionOrderId = parseInt(productionOrderId, 10);
      if (fromDate) params.fromDate = new Date(fromDate).toISOString();
      if (toDate) params.toDate = new Date(toDate).toISOString();

      const response = await apiRequest.get<ArrayBuffer>("/defect-records/export-excel", {
        params,
        responseType: "arraybuffer",
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `nhat-ky-loi-san-xuat-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Xuất báo cáo Excel thành công");
    } catch (err) {
      console.error("Export Excel error:", err);
      toast.error("Không thể xuất báo cáo Excel");
    } finally {
      setIsExporting(false);
    }
  };

  // Delete handler
  const handleDeleteConfirm = () => {
    if (!deletingRecordId) return;
    deleteMutation.mutate(deletingRecordId, {
      onSuccess: () => {
        setDeletingRecordId(null);
        refetch();
      },
    });
  };

  // Helper: load users for AsyncSelect autocomplete
  const loadUsersOptions = async (search?: string) => {
    try {
      const res = await apiRequest.get<UserResponsePaginate>("/users", {
        params: {
          pageNumber: 1,
          pageSize: 100,
          isActive: true,
          search: search || undefined,
        },
      });
      return (res.data?.items ?? []).map((u) => ({
        value: u.id,
        label: u.fullName || u.username || `User #${u.id}`,
        description: u.role ? `Vai trò: ${u.role}` : undefined,
      }));
    } catch (err) {
      console.error("loadUsersOptions error:", err);
      return [];
    }
  };

  // Formatter helpers
  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour12: false,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSourceBadge = (source?: string | null) => {
    switch (source) {
      case "design":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Thiết kế</Badge>;
      case "proofing":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">Bình bài</Badge>;
      case "production":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">Sản xuất</Badge>;
      case "management_decision":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Quyết định QL</Badge>;
      default:
        return <Badge variant="outline">Chưa xác định</Badge>;
    }
  };

  const getProductionStatusBadge = (status?: string | null, display?: string | null) => {
    if (!status) return null;
    const label = display || status;
    switch (status) {
      case "waiting_for_production":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100 text-[10px] py-0 px-1.5 h-5">{label}</Badge>;
      case "in_production":
        return <Badge variant="outline" className="bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100 text-[10px] py-0 px-1.5 h-5">{label}</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200 hover:bg-green-100 text-[10px] py-0 px-1.5 h-5">{label}</Badge>;
      case "paused":
        return <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200 hover:bg-red-100 text-[10px] py-0 px-1.5 h-5">{label}</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-5">{label}</Badge>;
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-4 py-4 space-y-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between shrink-0 gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Nhật ký lỗi sản xuất</h1>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={isExporting}
              className="gap-2"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Xuất Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
              Tải lại
            </Button>
          </div>
        </div>

        {/* Filters Card */}
        <Card className="shrink-0 shadow-sm border bg-card">
          <CardHeader className="py-3 px-4 flex flex-row items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">Bộ lọc tìm kiếm</CardTitle>
          </CardHeader>
          <CardContent className="py-3 px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              {/* Người chịu trách nhiệm */}
              <div className="space-y-1.5 flex flex-col justify-end">
                <Label className="text-xs font-semibold text-muted-foreground">Nhân viên chịu trách nhiệm</Label>
                <AsyncSelect
                  value={assignedToUserId}
                  onValueChange={(val) => {
                    setAssignedToUserId(val as string | number);
                    setCurrentPage(1);
                  }}
                  loadOptions={loadUsersOptions}
                  placeholder="Chọn nhân viên..."
                  emptyMessage="Không tìm thấy nhân viên"
                  className="w-full h-9 bg-background"
                />
              </div>

              {/* Nguồn lỗi */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Nguồn lỗi</Label>
                <Select
                  value={defectSource}
                  onValueChange={(val) => {
                    setDefectSource(val);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả nguồn lỗi</SelectItem>
                    {DEFECT_SOURCES.map((source) => (
                      <SelectItem key={source.value} value={source.value}>
                        {source.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Lệnh sản xuất ID */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">ID Lệnh sản xuất</Label>
                <Input
                  type="number"
                  placeholder="Ví dụ: 12"
                  value={productionOrderId}
                  onChange={(e) => {
                    setProductionOrderId(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 bg-background"
                />
              </div>

              {/* Từ ngày */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Từ ngày</Label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 bg-background"
                />
              </div>

              {/* Đến ngày */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Đến ngày</Label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 bg-background"
                />
              </div>
            </div>

            {/* Clear filters trigger */}
            {(assignedToUserId || defectSource !== "all" || productionOrderId || fromDate || toDate) && (
              <div className="flex justify-end mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-7 text-xs px-2 text-destructive hover:bg-destructive/10 gap-1.5"
                >
                  <X className="h-3 w.5" />
                  Xóa bộ lọc
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="flex-1 min-h-0 flex flex-col shadow-sm border overflow-hidden">
          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Đang tải danh sách nhật ký lỗi...</span>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center bg-muted/10">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm font-semibold text-foreground mb-1">Không tìm thấy bản ghi lỗi nào</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Hãy thử thay đổi bộ lọc tìm kiếm hoặc ghi nhận lỗi từ các công đoạn sản xuất.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-[120px] font-bold">Lệnh sản xuất</TableHead>
                    <TableHead className="font-bold">Mã hàng/Thiết kế</TableHead>
                    <TableHead className="w-[140px] font-bold">Công đoạn lỗi</TableHead>
                    <TableHead className="w-[130px] font-bold">Nguồn lỗi</TableHead>
                    <TableHead className="font-bold">Người chịu trách nhiệm</TableHead>
                    <TableHead className="w-[90px] text-center font-bold">Số lượng</TableHead>
                    <TableHead className="w-[150px] font-bold">Thời gian xảy ra</TableHead>
                    <TableHead className="min-w-[150px] font-bold">Mô tả lỗi</TableHead>
                    {(canEdit || canDelete) && (
                      <TableHead className="w-[100px] text-center font-bold">Hành động</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((record) => (
                    <TableRow key={record.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {record.productionOrderId ? (
                            <Link
                              to={`/productions/${record.productionOrderId}`}
                              className="text-primary hover:underline font-semibold"
                            >
                              {record.productionOrderCode || `#${record.productionOrderId}`}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                          {record.productionOrderStatus && (
                            <div className="flex">
                              {getProductionStatusBadge(
                                record.productionOrderStatus,
                                record.productionOrderStatusDisplay
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-xs sm:text-sm">
                          {record.designName || "Chưa có tên"}
                        </div>
                        {record.designCode && (
                          <div className="text-[10px] text-muted-foreground font-mono">
                            Mã: {record.designCode}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {record.productionStepType ? (
                          <span className="text-xs font-medium">
                            {productionStepTypeLabels[record.productionStepType] || record.productionStepType}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Khác / QC</span>
                        )}
                      </TableCell>
                      <TableCell>{getSourceBadge(record.defectSource)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                            <User className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-sm font-medium">
                            {record.assignedToUserName || `ID: ${record.assignedToUserId}`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold text-orange-600">
                        {record.defectQuantity}
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatDateTime(record.defectOccurredAt)}
                      </TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate" title={record.description}>
                        {record.description}
                      </TableCell>
                      {(canEdit || canDelete) && (
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => setEditingRecord(record)}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => setDeletingRecordId(record.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="shrink-0 py-3 px-4 border-t bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                Hiển thị bản ghi từ {itemsPerPage * (currentPage - 1) + 1} đến{" "}
                {Math.min(itemsPerPage * currentPage, totalCount)} trên tổng số {totalCount} bản ghi
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 text-xs"
                >
                  Trước
                </Button>
                <div className="flex items-center space-x-1">
                  <Input
                    className="h-8 w-12 text-center text-xs px-1"
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    onBlur={() => {
                      const val = parseInt(pageInput, 10);
                      if (val >= 1 && val <= totalPages) {
                        setCurrentPage(val);
                      } else {
                        setPageInput(currentPage.toString());
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const val = parseInt(pageInput, 10);
                        if (val >= 1 && val <= totalPages) {
                          setCurrentPage(val);
                        } else {
                          setPageInput(currentPage.toString());
                        }
                      }
                    }}
                  />
                  <span className="text-xs text-muted-foreground">/ {totalPages}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 text-xs"
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Edit Dialog */}
      {editingRecord && (
        <EditDefectRecordDialog
          open={!!editingRecord}
          onOpenChange={(open) => !open && setEditingRecord(null)}
          record={editingRecord}
          onSuccess={() => {
            setEditingRecord(null);
            refetch();
          }}
        />
      )}

      {/* Delete Dialog */}
      <Dialog open={deletingRecordId !== null} onOpenChange={(open) => !open && setDeletingRecordId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Xác nhận xóa bản ghi lỗi
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa bản ghi lỗi này không? Hành động này sẽ không thể hoàn tác và số tiền khấu trừ lương tương ứng (nếu có) sẽ bị hủy bỏ.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setDeletingRecordId(null)}
              disabled={deleteMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Đang xóa..." : "Xác nhận xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Inner Edit dialog component
interface EditDefectRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: DefectRecordResponse;
  onSuccess: () => void;
}

function EditDefectRecordDialog({
  open,
  onOpenChange,
  record,
  onSuccess,
}: EditDefectRecordDialogProps) {
  const [defectQuantity, setDefectQuantity] = useState(record.defectQuantity.toString());
  const [defectSource, setDefectSource] = useState(record.defectSource);
  const [assignedToUserId, setAssignedToUserId] = useState<string | number>(record.assignedToUserId);
  const [defectOccurredAt, setDefectOccurredAt] = useState("");
  const [description, setDescription] = useState(record.description || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateMutation = useUpdateDefectRecord();

  // Load production order step & design details
  const { data: productionOrder, isLoading: loadingProduction } = useProductionOrder(
    record.productionOrderId || null,
    open && !!record.productionOrderId
  );

  const { data: proofingOrder, isLoading: loadingProofing } = useProofingOrder(
    productionOrder?.proofingOrderId || null,
    open && !!productionOrder?.proofingOrderId
  );

  // Initialize date
  useEffect(() => {
    if (open && record.defectOccurredAt) {
      const date = new Date(record.defectOccurredAt);
      const localISO = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setDefectOccurredAt(localISO);
    }
  }, [open, record.defectOccurredAt]);

  const loadUsersOptions = async (search?: string) => {
    try {
      const res = await apiRequest.get<UserResponsePaginate>("/users", {
        params: {
          pageNumber: 1,
          pageSize: 100,
          isActive: true,
          search: search || undefined,
        },
      });
      return (res.data?.items ?? []).map((u) => ({
        value: u.id,
        label: u.fullName || u.username || `User #${u.id}`,
        description: u.role ? `Vai trò: ${u.role}` : undefined,
      }));
    } catch (err) {
      console.error("loadUsersOptions error:", err);
      return [];
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const qty = Number(defectQuantity);
    if (!defectQuantity || isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
      newErrors.defectQuantity = "Số lượng lỗi phải là số nguyên dương lớn hơn 0";
    }

    if (!assignedToUserId) {
      newErrors.assignedToUserId = "Vui lòng chọn người chịu trách nhiệm";
    }

    if (!defectOccurredAt) {
      newErrors.defectOccurredAt = "Vui lòng chọn thời gian xảy ra lỗi";
    } else {
      const selectedDate = new Date(defectOccurredAt);
      if (selectedDate > new Date()) {
        newErrors.defectOccurredAt = "Thời gian xảy ra lỗi không được ở tương lai";
      }
    }

    if (!description.trim()) {
      newErrors.description = "Vui lòng nhập mô tả chi tiết lỗi";
    } else if (description.length > 1000) {
      newErrors.description = "Mô tả không được vượt quá 1000 ký tự";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const payload = {
      defectQuantity: Number(defectQuantity),
      description: description.trim(),
      defectSource: defectSource,
      assignedToUserId: Number(assignedToUserId),
      defectOccurredAt: new Date(defectOccurredAt).toISOString(),
    };

    updateMutation.mutate(
      {
        id: record.id,
        data: payload,
      },
      {
        onSuccess: () => {
          onSuccess();
        },
      }
    );
  };

  const isMutating = updateMutation.isPending;
  const isDataLoading = loadingProduction || loadingProofing;

  return (
    <Dialog open={open} onOpenChange={(v) => !isMutating && onOpenChange(v)}>
      <DialogContent className="max-w-xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Chỉnh sửa ghi nhận lỗi sản xuất</DialogTitle>
          <DialogDescription>
            Cập nhật chi tiết bản ghi lỗi phát sinh trong công việc của nhân viên.
          </DialogDescription>
        </DialogHeader>

        {isDataLoading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Đang tải thông tin...</span>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Lệnh sản xuất & Thiết kế (Read-only khi sửa) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase">Lệnh sản xuất</Label>
                <Input
                  value={
                    productionOrder?.proofingOrderCode ||
                    (record.productionOrderId ? `#${record.productionOrderId}` : "")
                  }
                  readOnly
                  className="bg-muted text-muted-foreground h-9 text-xs font-semibold"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase">Thiết kế / Mã hàng</Label>
                <Input
                  value={
                    record.designName
                      ? `${record.designName} (${record.designCode || "Chưa có mã"})`
                      : "N/A"
                  }
                  readOnly
                  className="bg-muted text-muted-foreground h-9 text-xs font-semibold"
                />
              </div>
            </div>

            {/* Công đoạn (Read-only) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Công đoạn lỗi</Label>
              <Input
                value={record.productionStepType || "Khác / QC"}
                readOnly
                className="bg-muted text-muted-foreground h-9 text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Nguồn lỗi */}
              <div className="space-y-1">
                <Label htmlFor="edit-source-select" className="text-sm font-medium">
                  Nguồn lỗi <span className="text-red-500">*</span>
                </Label>
                <Select value={defectSource} onValueChange={setDefectSource} disabled={isMutating}>
                  <SelectTrigger id="edit-source-select" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFECT_SOURCES.map((source) => (
                      <SelectItem key={source.value} value={source.value}>
                        {source.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Số lượng lỗi */}
              <div className="space-y-1">
                <Label htmlFor="edit-quantity-input" className="text-sm font-medium">
                  Số lượng lỗi <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-quantity-input"
                  type="number"
                  min="1"
                  step="1"
                  value={defectQuantity}
                  onChange={(e) => setDefectQuantity(e.target.value)}
                  disabled={isMutating}
                  className="h-9"
                />
                {errors.defectQuantity && (
                  <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.defectQuantity}
                  </p>
                )}
              </div>
            </div>

            {/* Người chịu trách nhiệm (Autocomplete) */}
            <div className="space-y-1 flex flex-col">
              <Label className="text-sm font-medium mb-1">
                Người chịu trách nhiệm <span className="text-red-500">*</span>
              </Label>
              <AsyncSelect
                value={assignedToUserId}
                onValueChange={(val) => setAssignedToUserId(val as string | number)}
                loadOptions={loadUsersOptions}
                placeholder="Tìm kiếm nhân viên..."
                emptyMessage="Không tìm thấy nhân viên"
                disabled={isMutating}
                className="w-full h-9"
              />
              {errors.assignedToUserId && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.assignedToUserId}
                </p>
              )}
            </div>

            {/* Thời gian xảy ra lỗi */}
            <div className="space-y-1">
              <Label htmlFor="edit-occurred-input" className="text-sm font-medium">
                Thời gian xảy ra lỗi <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-occurred-input"
                type="datetime-local"
                value={defectOccurredAt}
                onChange={(e) => setDefectOccurredAt(e.target.value)}
                disabled={isMutating}
                className="h-9"
              />
              {errors.defectOccurredAt && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.defectOccurredAt}
                </p>
              )}
            </div>

            {/* Mô tả lỗi */}
            <div className="space-y-1">
              <Label htmlFor="edit-description-input" className="text-sm font-medium">
                Mô tả chi tiết lỗi <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="edit-description-input"
                placeholder="Ví dụ: Cán màng nhăn mép, In lệch màu nhạt hơn bài mẫu..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isMutating}
                rows={3}
                className="resize-none"
              />
              <div className="flex justify-between items-center mt-1">
                {errors.description ? (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.description}
                  </p>
                ) : (
                  <div />
                )}
                <span className="text-[10px] text-muted-foreground">
                  {description.length}/1000 ký tự
                </span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isMutating}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isMutating || isDataLoading}>
            {isMutating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Đang lưu...
              </>
            ) : (
              "Lưu thay đổi"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
