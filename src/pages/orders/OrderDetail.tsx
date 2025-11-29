import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/ui/status-badge";
import { OrderFlowDiagram } from "@/components/orders/order-flow-diagram";
import { DepositDialog } from "@/components/orders/deposit-dialog";
import { CreateProofingDialog } from "@/components/orders/create-proofing-dialog";
import { ProductionDialog } from "@/components/orders/production-dialog";
import { InvoiceDialog } from "@/components/orders/invoice-dialog";
import { EditOrderSheet } from "@/components/orders/edit-order-sheet";
import { StatusUpdateDialog } from "@/components/orders/status-update-dialog";
import { PrintOrderDialog } from "@/components/orders/print-order-dialog";
import {
  mockOrders,
  mockProofingOrders,
  mockProductions,
} from "@/lib/mockData";
import {
  orderStatusLabels,
  designStatusLabels,
  customerTypeLabels,
  formatCurrency,
  formatDate,
  formatDateTime,
} from "@/lib/status-utils";
import {
  ArrowLeft,
  User,
  Building2,
  MapPin,
  Calendar,
  FileText,
  Package,
  Briefcase,
  Download,
  Wallet,
  Printer,
  Edit,
  Receipt,
  Play,
  CheckCircle,
  CreditCard,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

export default function OrderDetailPage() {
  const { id } = useParams();
  const order = mockOrders.find((o) => o.id === Number.parseInt(id || "1"));

  // Dialog states
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [proofingDialogOpen, setProofingDialogOpen] = useState(false);
  const [productionDialogOpen, setProductionDialogOpen] = useState(false);
  const [productionType, setProductionType] = useState<"start" | "complete">(
    "start"
  );
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Không tìm thấy đơn hàng</h1>
          <Link to="/">
            <Button>Quay lại danh sách</Button>
          </Link>
        </div>
      </div>
    );
  }

  const customerType = order.customer.companyName ? "company" : "retail";
  const hasDeposit = order.depositAmount > 0;

  const hasConfirmedDesign = order.designs?.some((d) =>
    ["confirmed_for_printing", "pdf_exported"].includes(d.designStatus || "")
  );

  const relatedProofing = mockProofingOrders.filter((po) =>
    po.proofingOrderDesigns?.some((pod) =>
      order.designs?.some((d) => d.id === pod.designId)
    )
  );

  const relatedProductions = mockProductions.filter((p) =>
    relatedProofing.some((po) => po.id === p.proofingOrderId)
  );

  const hasCompletedProofing = relatedProofing.some(
    (po) => po.status === "completed"
  );

  // production đang chờ start / đang chạy
  const productionToStart = relatedProductions.find((p) =>
    ["waiting_for_production", "pending"].includes(p.status || "")
  );
  const productionInProgress = relatedProductions.find(
    (p) => p.status === "in_production"
  );
  const hasProductionInProgress = !!productionInProgress;
  const hasProductionCompleted = relatedProductions.some(
    (p) => p.status === "completed"
  );

  const remainingAmount = order.totalAmount - order.depositAmount;

  // material options cho bình bài – lấy từ các thiết kế của đơn
  const materialOptions = useMemo(() => {
    if (!order.designs || order.designs.length === 0) return [];
    const map = new Map<
      number,
      (typeof order.designs)[number]["materialType"]
    >();
    order.designs.forEach((d) => {
      if (d.materialType) {
        map.set(d.materialType.id, d.materialType);
      }
    });
    return Array.from(map.values());
  }, [order.designs]);

  // điều kiện flow
  const canTakeDeposit =
    customerType === "retail" &&
    !hasDeposit &&
    hasConfirmedDesign &&
    order.status === "pending";

  const canCreateProofing =
    hasConfirmedDesign &&
    (customerType === "company" || hasDeposit) &&
    ["pending", "waiting_for_proofing"].includes(order.status || "") &&
    relatedProofing.length === 0;

  const canStartProduction = !!productionToStart && hasCompletedProofing;

  const canCompleteProduction = !!productionInProgress;

  const canIssueInvoice =
    order.status === "completed" &&
    hasProductionCompleted &&
    (customerType === "company" || remainingAmount <= 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Link to="/">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 mb-4 -ml-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </Button>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{order.code}</h1>
                <StatusBadge
                  status={order.status}
                  label={orderStatusLabels[order.status || ""] || "N/A"}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Tạo ngày {formatDateTime(order.createdAt)} •{" "}
                {order.creator.fullName}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setPrintDialogOpen(true)}
              >
                <Printer className="w-4 h-4" />
                In đơn
              </Button>
              <Button size="sm" onClick={() => setStatusDialogOpen(true)}>
                Cập nhật
              </Button>
            </div>
          </div>
        </div>

        {/* Flow Diagram */}
        <div className="mb-6">
          <OrderFlowDiagram
            currentStatus={order.status}
            customerType={customerType}
            hasDeposit={hasDeposit}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Info */}
            <Card className="shadow-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  {customerType === "company" ? (
                    <Building2 className="w-4 h-4 text-primary" />
                  ) : (
                    <User className="w-4 h-4 text-primary" />
                  )}
                  Thông tin khách hàng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <InfoItem label="Mã KH" value={order.customer.code} />
                  <InfoItem label="Tên" value={order.customer.name} />
                  {order.customer.companyName && (
                    <InfoItem
                      label="Công ty"
                      value={order.customer.companyName}
                      className="col-span-2"
                    />
                  )}
                  <div className="col-span-2 md:col-span-1">
                    <span className="text-xs text-muted-foreground block mb-1">
                      Loại KH
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {customerTypeLabels[customerType]}
                    </Badge>
                  </div>
                  {order.deliveryAddress && (
                    <div className="col-span-2 md:col-span-3">
                      <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <MapPin className="w-3 h-3" /> Địa chỉ giao hàng
                      </span>
                      <span className="text-sm font-medium">
                        {order.deliveryAddress}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Designs */}
            <Card className="shadow-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="w-4 h-4 text-primary" />
                  Thiết kế
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {order.designs?.length || 0}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {order.designs && order.designs.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                            Mã
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                            Loại / Chất liệu
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                            Trạng thái
                          </th>
                          <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                            SL
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                            Designer
                          </th>
                          <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                            Giá
                          </th>
                          <th className="px-4 py-3 text-center font-medium text-muted-foreground w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {order.designs.map((design) => (
                          <tr
                            key={design.id}
                            className="hover:bg-muted/20 transition-colors"
                          >
                            <td className="px-4 py-3 font-medium">
                              {design.code}
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-xs text-muted-foreground">
                                {design.designType.name}
                              </div>
                              <div className="font-medium">
                                {design.materialType.name}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge
                                status={design.designStatus}
                                label={
                                  designStatusLabels[
                                    design.designStatus || ""
                                  ] || "N/A"
                                }
                              />
                            </td>
                            <td className="px-4 py-3 text-center font-medium">
                              {design.quantity}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {design.designer.fullName}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold">
                              {formatCurrency(design.totalPrice || 0)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {design.designFileUrl && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Chưa có thiết kế nào
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Proofing Orders */}
            {relatedProofing.length > 0 && (
              <Card className="shadow-card">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Package className="w-4 h-4 text-primary" />
                    Bình bài
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                            Mã
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                            Chất liệu
                          </th>
                          <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                            Số lượng
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                            Trạng thái
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {relatedProofing.map((proof) => (
                          <tr
                            key={proof.id}
                            className="hover:bg-muted/20 transition-colors"
                          >
                            <td className="px-4 py-3 font-medium">
                              {proof.code}
                            </td>
                            <td className="px-4 py-3">
                              {proof.materialType.name}
                            </td>
                            <td className="px-4 py-3 text-center font-medium">
                              {proof.totalQuantity}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge
                                status={proof.status}
                                label={
                                  orderStatusLabels[proof.status || ""] || "N/A"
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Production */}
            {relatedProductions.length > 0 && (
              <Card className="shadow-card">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Briefcase className="w-4 h-4 text-primary" />
                    Sản xuất
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                            Mã
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                            Phụ trách
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                            Tiến độ
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                            Trạng thái
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                            Thời gian
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {relatedProductions.map((prod) => (
                          <tr
                            key={prod.id}
                            className="hover:bg-muted/20 transition-colors"
                          >
                            <td className="px-4 py-3 font-medium">
                              SP-{prod.id}
                            </td>
                            <td className="px-4 py-3">
                              {prod.productionLead.fullName}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-muted rounded-full h-2 w-24 overflow-hidden">
                                  <div
                                    className="bg-primary h-2 rounded-full transition-all duration-500"
                                    style={{
                                      width: `${prod.progressPercent}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-xs font-medium w-10">
                                  {prod.progressPercent}%
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge
                                status={prod.status}
                                label={
                                  orderStatusLabels[prod.status || ""] || "N/A"
                                }
                              />
                            </td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">
                              {prod.completedAt
                                ? formatDate(prod.completedAt)
                                : prod.startedAt
                                ? formatDate(prod.startedAt)
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Summary */}
            <Card className="shadow-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wallet className="w-4 h-4 text-primary" />
                  Tổng quan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Tổng tiền
                    </span>
                    <span className="text-lg font-bold">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                  {hasDeposit && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Đã cọc
                      </span>
                      <span className="font-medium text-success">
                        {formatCurrency(order.depositAmount)}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Còn lại
                    </span>
                    <span className="font-semibold text-warning">
                      {formatCurrency(remainingAmount)}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Ngày giao:</span>
                  <span className="font-medium">
                    {formatDate(order.deliveryDate)}
                  </span>
                </div>

                <Separator />

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Người phụ trách
                  </p>
                  <p className="text-sm font-medium">
                    {order.assignedUser.fullName}
                  </p>
                </div>

                {order.note && (
                  <>
                    <Separator />
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Ghi chú</p>
                      <p className="text-sm bg-muted/50 p-2 rounded-md">
                        {order.note}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="shadow-card border-primary/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Hành động</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {canTakeDeposit && (
                  <Button
                    className="w-full gap-2"
                    size="sm"
                    onClick={() => setDepositDialogOpen(true)}
                  >
                    <CreditCard className="w-4 h-4" />
                    Nhận cọc
                  </Button>
                )}

                {canCreateProofing && (
                  <Button
                    className="w-full gap-2"
                    size="sm"
                    onClick={() => setProofingDialogOpen(true)}
                  >
                    <Package className="w-4 h-4" />
                    Tạo bình bài
                  </Button>
                )}

                {canStartProduction && productionToStart && (
                  <Button
                    className="w-full gap-2"
                    size="sm"
                    onClick={() => {
                      setProductionType("start");
                      setProductionDialogOpen(true);
                    }}
                  >
                    <Play className="w-4 h-4" />
                    Bắt đầu sản xuất
                  </Button>
                )}

                {canCompleteProduction && productionInProgress && (
                  <Button
                    className="w-full gap-2"
                    size="sm"
                    onClick={() => {
                      setProductionType("complete");
                      setProductionDialogOpen(true);
                    }}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Hoàn thành sản xuất
                  </Button>
                )}

                {canIssueInvoice && (
                  <Button
                    className="w-full gap-2"
                    size="sm"
                    onClick={() => setInvoiceDialogOpen(true)}
                  >
                    <Receipt className="w-4 h-4" />
                    Xuất hoá đơn
                  </Button>
                )}

                <Separator className="my-3" />

                <Button
                  variant="outline"
                  className="w-full gap-2"
                  size="sm"
                  onClick={() => setEditSheetOpen(true)}
                >
                  <Edit className="w-4 h-4" />
                  Chỉnh sửa
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  size="sm"
                  onClick={() => setPrintDialogOpen(true)}
                >
                  <Printer className="w-4 h-4" />
                  In đơn hàng
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialogs – dùng version có hooks bên trong */}
      <DepositDialog
        open={depositDialogOpen}
        onOpenChange={setDepositDialogOpen}
        orderId={order.id}
        totalAmount={order.totalAmount}
        currentDeposit={order.depositAmount}
      />

      <CreateProofingDialog
        open={proofingDialogOpen}
        onOpenChange={setProofingDialogOpen}
        orderId={order.id}
        designs={order.designs || []}
        materialOptions={materialOptions}
      />

      <ProductionDialog
        open={productionDialogOpen}
        onOpenChange={setProductionDialogOpen}
        productionId={
          productionType === "start"
            ? productionToStart?.id ?? 0
            : productionInProgress?.id ?? 0
        }
        mode={productionType}
      />

      <InvoiceDialog
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        orderId={order.id}
      />

      <EditOrderSheet
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        order={order}
      />

      <StatusUpdateDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        orderId={order.id}
        currentStatus={(order.status || "pending") as any}
      />

      <PrintOrderDialog
        open={printDialogOpen}
        onOpenChange={setPrintDialogOpen}
        orderId={order.id}
      />
    </div>
  );
}

function InfoItem({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <span className="text-xs text-muted-foreground block mb-1">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
