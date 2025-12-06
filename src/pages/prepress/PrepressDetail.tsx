import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Printer,
  Factory,
  Clock,
  User,
  Layers,
  Box,
  FileText,
  Edit,
  CheckCircle,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import type { ProofingOrderResponse, DesignResponse } from "@/Schema";

// ===== mock chung với list =====
const mockDesigns: DesignResponse[] = [
  {
    id: 1,
    code: "DES-001",
    designName: "Bao bì NPK 16-16-8",
    designStatus: "waiting_for_prepress",
    quantity: 10000,
    dimensions: "500x700mm",
    designType: {
      id: 1,
      name: "Bao bì phân bón",
      code: "PKG",
    } as any,
    materialType: {
      id: 1,
      name: "Giấy couche 150gsm",
      code: "C150",
    } as any,
    orderId: 101,
  } as any,
  {
    id: 2,
    code: "DES-002",
    designName: "Túi đựng thức ăn chăn nuôi 25kg",
    designStatus: "waiting_for_production",
    quantity: 8000,
    dimensions: "600x900mm",
    designType: {
      id: 1,
      name: "Bao bì phân bón",
      code: "PKG",
    } as any,
    materialType: {
      id: 2,
      name: "Bao dệt PP tráng PE",
      code: "PPPE",
    } as any,
    orderId: 102,
  } as any,
];

const mockProofingOrderDetail: ProofingOrderResponse = {
  id: 1,
  code: "PP-2025-001",
  status: "pending",
  totalQuantity: 18000,
  materialType: {
    id: 1,
    name: "Giấy couche 150gsm",
    code: "C150",
  } as any,
  createdAt: "2025-12-01T08:30:00.000Z",
  // giả sử có updatedAt, note, orderCode...
  updatedAt: "2025-12-02T09:45:00.000Z",
  note: "Bình bài cho đợt in NPK và bao thức ăn chăn nuôi.",
  createdBy: {
    id: 10,
    fullName: "Nguyễn Văn Bình",
    username: "binh.prepress",
  } as any,
  proofingOrderDesigns: [
    {
      id: 11,
      designId: 1,
      design: mockDesigns[0],
    } as any,
    {
      id: 12,
      designId: 2,
      design: mockDesigns[1],
    } as any,
  ],
} as any;

const proofStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
};

const proofStatusLabels: Record<string, string> = {
  pending: "Chờ xử lý",
  in_progress: "Đang thực hiện",
  completed: "Hoàn thành",
};

function getStatusBadge(status?: string | null) {
  const s = status ?? "pending";
  const colorClass =
    proofStatusColors[s] ?? "bg-gray-100 text-gray-800 border-gray-200";
  const label = proofStatusLabels[s] ?? s;

  return (
    <Badge variant="outline" className={colorClass}>
      {label}
    </Badge>
  );
}

export default function ProofingOrderDetailPage() {
  const navigate = useNavigate();
  const params = useParams();

  const [order, setOrder] = useState<ProofingOrderResponse | null>(
    mockProofingOrderDetail
  );
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>(
    mockProofingOrderDetail.status ?? "pending"
  );

  if (!order) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 gap-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>
        <Card>
          <CardContent className="py-10 text-center space-y-2">
            <p className="text-lg font-semibold">
              Không tìm thấy lệnh bình bài
            </p>
            <p className="text-sm text-muted-foreground">
              ID: {params.id ?? "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleUpdateStatus = () => {
    // sau này thay bằng call API PATCH /proofing-orders/{id}/status
    setOrder((prev) =>
      prev ? ({ ...prev, status: newStatus } as ProofingOrderResponse) : prev
    );
    toast.success("Đã cập nhật trạng thái lệnh bình bài");
    setStatusDialogOpen(false);
  };

  const handleSendToProduction = () => {
    toast.success("Đã gửi lệnh bình bài sang sản xuất");
  };

  const handlePrint = () => {
    toast.info("Đang in lệnh bình bài (mock)");
  };

  const handleExportPdf = () => {
    toast.info("Đang xuất PDF (mock)");
  };

  const createdAtText = order.createdAt
    ? new Date(order.createdAt).toLocaleString("vi-VN")
    : "-";

  const updatedAtText = (order as any).updatedAt
    ? new Date((order as any).updatedAt).toLocaleString("vi-VN")
    : "-";

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <div className="border-b bg-muted/30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => navigate("/prepress")}
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight">
                  Lệnh bình bài {order.code ?? `PP-${order.id}`}
                </h1>
                {getStatusBadge(order.status)}
              </div>
              <p className="text-sm text-muted-foreground">
                Lệnh bình bài cho nhiều thiết kế / đơn hàng. Quản lý trạng thái
                và gửi sang sản xuất.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4" />
              In
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={handleExportPdf}
            >
              <FileText className="h-4 w-4" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => setStatusDialogOpen(true)}
            >
              <Edit className="h-4 w-4" />
              Cập nhật trạng thái
            </Button>
            <Button
              size="sm"
              className="gap-1"
              onClick={handleSendToProduction}
            >
              <Factory className="h-4 w-4" />
              Gửi sản xuất
            </Button>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* Thông tin chung */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Printer className="h-4 w-4 text-primary" />
              Thông tin lệnh bình bài
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Mã lệnh</p>
                <p className="font-semibold">
                  {order.code ?? `PP-${order.id}`}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Loại giấy</p>
                <p className="font-semibold flex items-center gap-1.5">
                  <Box className="h-3.5 w-3.5 text-muted-foreground" />
                  {order.materialType?.name ??
                    order.materialType?.code ??
                    "Chưa chọn"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Tổng số lượng sản phẩm
                </p>
                <p className="font-semibold">
                  {(order.totalQuantity ?? 0).toLocaleString("vi-VN")}
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Thời gian</p>
                  <p className="text-sm">
                    <span className="font-medium">Tạo:</span> {createdAtText}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Cập nhật:</span>{" "}
                    {updatedAtText}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Người tạo</p>
                  {order.createdBy ? (
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-semibold">
                          {order.createdBy.fullName?.charAt(0) ?? "U"}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {order.createdBy.fullName}
                        </span>
                        {order.createdBy.username && (
                          <span className="text-xs text-muted-foreground">
                            @{order.createdBy.username}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">-</p>
                  )}
                </div>
              </div>
            </div>

            {order.notes && (
              <>
                <Separator />
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Ghi chú</p>
                  <p className="text-sm leading-relaxed">{order.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Danh sách thiết kế trong lệnh */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Thiết kế trong lệnh bình bài
              <Badge variant="secondary" className="ml-1">
                {(order.proofingOrderDesigns?.length ?? 0).toString()} thiết kế
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!order.proofingOrderDesigns ||
              order.proofingOrderDesigns.length === 0) && (
              <div className="text-center py-10 text-sm text-muted-foreground">
                Chưa gắn thiết kế nào vào lệnh bình bài này.
              </div>
            )}

            {order.proofingOrderDesigns &&
              order.proofingOrderDesigns.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã thiết kế</TableHead>
                      <TableHead>Tên thiết kế</TableHead>
                      <TableHead>Loại thiết kế</TableHead>
                      <TableHead>Chất liệu</TableHead>
                      <TableHead>Đơn hàng</TableHead>
                      <TableHead>Số lượng</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.proofingOrderDesigns.map((pod) => {
                      const d = pod.design as DesignResponse | undefined;
                      return (
                        <TableRow key={pod.id ?? pod.designId}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" />
                              {d?.code ?? `DES-${pod.designId}`}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-medium">
                                {d?.designName ?? "Không tên"}
                              </span>
                              {d?.dimensions && (
                                <span className="text-xs text-muted-foreground">
                                  Kích thước: {d.dimensions}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm">
                              <Layers className="h-4 w-4 text-muted-foreground" />
                              <span>{d?.designType?.name ?? "-"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm">
                              <Box className="h-4 w-4 text-muted-foreground" />
                              <span>{d?.materialType?.name ?? "-"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {d?.orderId ? (
                              <span className="text-sm text-primary">
                                ĐH #{d.orderId}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                -
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {(d?.quantity ?? 0).toLocaleString("vi-VN")}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1"
                              onClick={() =>
                                toast.info(
                                  `Xem chi tiết thiết kế ${d?.code ?? ""}`
                                )
                              }
                            >
                              <Eye className="h-4 w-4" />
                              Xem
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
          </CardContent>
        </Card>
      </div>

      {/* POPUP: Cập nhật trạng thái */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Cập nhật trạng thái lệnh bình bài
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2 text-sm">
            <p>
              Lệnh:{" "}
              <span className="font-semibold">
                {order.code ?? `PP-${order.id}`}
              </span>
            </p>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Chọn trạng thái mới
              </p>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="proof-status"
                    className="h-3 w-3"
                    value="pending"
                    checked={newStatus === "pending"}
                    onChange={(e) => setNewStatus(e.target.value)}
                  />
                  <span>Chờ xử lý</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="proof-status"
                    className="h-3 w-3"
                    value="in_progress"
                    checked={newStatus === "in_progress"}
                    onChange={(e) => setNewStatus(e.target.value)}
                  />
                  <span>Đang thực hiện</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="proof-status"
                    className="h-3 w-3"
                    value="completed"
                    checked={newStatus === "completed"}
                    onChange={(e) => setNewStatus(e.target.value)}
                  />
                  <span>Hoàn thành</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button size="sm" onClick={handleUpdateStatus}>
              Lưu trạng thái
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
