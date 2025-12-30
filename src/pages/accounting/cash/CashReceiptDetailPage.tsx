import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  User,
  DollarSign,
  Building2,
  CreditCard,
  Loader2,
  AlertCircle,
  Trash2,
  Download,
  Printer,
} from "lucide-react";
import { Helmet } from "react-helmet-async";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { StatusBadge } from "@/components/ui/status-badge";
import {
  useCashReceipt,
  useCreateCashReceipt,
  useUpdateCashReceipt,
  useDeleteCashReceipt,
  useApproveCashReceipt,
  useCancelCashReceipt,
  usePostCashReceipt,
} from "@/hooks/use-cash";
import { usePaymentMethods } from "@/hooks/use-expense";
import { useCashFunds } from "@/hooks/use-cash";
import {
  formatCurrency,
  getPaymentMethodLabel,
  getCashTransactionStatusLabel,
} from "@/lib/status-utils";
import { toast } from "sonner";
import type {
  CreateCashReceiptRequest,
  UpdateCashReceiptRequest,
} from "@/Schema/accounting.schema";

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
};

const formatDateTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: vi });
};

const formatDateForInput = (dateStr: string | null | undefined) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getStatusBadge = (status: string | null | undefined) => {
  if (!status) return <StatusBadge status="unknown" label="—" />;

  const statusLower = status.toLowerCase();
  if (statusLower.includes("draft") || statusLower === "draft") {
    return <StatusBadge status="draft" label="Nháp" />;
  }
  if (statusLower.includes("approved") || statusLower === "approved") {
    return <StatusBadge status="approved" label="Đã duyệt" />;
  }
  if (statusLower.includes("posted") || statusLower === "posted") {
    return <StatusBadge status="posted" label="Đã hạch toán" />;
  }
  if (statusLower.includes("cancelled") || statusLower === "cancelled") {
    return <StatusBadge status="cancelled" label="Đã hủy" />;
  }
  return <StatusBadge status={status} label={status} />;
};

export default function CashReceiptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Handle "new" case - redirect to create modal or show create form
  const isNew = id === "new";
  const receiptId = isNew ? null : id ? Number.parseInt(id, 10) : null;

  // If receiptId is NaN (invalid), treat as null
  const validReceiptId =
    receiptId && !Number.isNaN(receiptId) ? receiptId : null;

  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [cardEditValues, setCardEditValues] = useState<
    Record<string, string | number | null>
  >({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Form state for creating new receipt
  const [createFormValues, setCreateFormValues] =
    useState<CreateCashReceiptRequest>({
      voucherDate: new Date().toISOString().split("T")[0],
      postingDate: new Date().toISOString().split("T")[0],
      payerName: "",
      reason: "",
      amount: 0,
      notes: null,
      paymentMethodId: null,
      cashFundId: null,
      customerId: null,
    });

  const {
    data: receipt,
    isLoading,
    isError,
    error,
    refetch,
  } = useCashReceipt(validReceiptId, !!validReceiptId && !isNew);

  const { data: paymentMethodsData } = usePaymentMethods({
    pageNumber: 1,
    pageSize: 100,
    isActive: true,
  });

  const { data: cashFundsData } = useCashFunds({
    pageNumber: 1,
    pageSize: 100,
    isActive: true,
  });

  const createMutation = useCreateCashReceipt();
  const updateMutation = useUpdateCashReceipt();
  const deleteMutation = useDeleteCashReceipt();
  const approveMutation = useApproveCashReceipt();
  const cancelMutation = useCancelCashReceipt();
  const postMutation = usePostCashReceipt();

  const isDraft = receipt?.status?.toLowerCase() === "draft";
  const isApproved = receipt?.status?.toLowerCase() === "approved";
  const isPosted = receipt?.status?.toLowerCase() === "posted";
  const isCancelled = receipt?.status?.toLowerCase() === "cancelled";
  const canEdit = isDraft;
  const canApprove = isDraft;
  const canCancel = isDraft || isApproved;
  const canPost = isApproved;
  const canDelete = isDraft;

  const startEditingCard = (cardName: string) => {
    if (!receipt) return;
    setEditingCard(cardName);
    setCardEditValues({
      voucherDate: receipt.voucherDate || null,
      postingDate: receipt.postingDate || null,
      payerName: receipt.payerName || "",
      reason: receipt.reason || "",
      amount: receipt.amount || 0,
      notes: receipt.notes || "",
      paymentMethodId: receipt.paymentMethodId || null,
      cashFundId: receipt.cashFundId || null,
    });
  };

  const cancelEditingCard = () => {
    setEditingCard(null);
    setCardEditValues({});
  };

  const handleSaveCard = () => {
    if (!receipt || !editingCard) return;

    const payload: UpdateCashReceiptRequest = {
      voucherDate: cardEditValues.voucherDate as string,
      postingDate: cardEditValues.postingDate as string,
      payerName: cardEditValues.payerName as string,
      reason: cardEditValues.reason as string,
      amount: cardEditValues.amount as number,
      notes: (cardEditValues.notes as string) || null,
      paymentMethodId: cardEditValues.paymentMethodId as number | null,
      cashFundId: cardEditValues.cashFundId as number | null,
    };

    updateMutation.mutate(
      { id: receipt.id!, data: payload },
      {
        onSuccess: () => {
          setEditingCard(null);
          setCardEditValues({});
          refetch();
        },
      }
    );
  };

  const handleApprove = () => {
    if (!receipt?.id) return;
    approveMutation.mutate(receipt.id, {
      onSuccess: () => {
        refetch();
      },
    });
  };

  const handleCancel = () => {
    if (!receipt?.id) return;
    cancelMutation.mutate(receipt.id, {
      onSuccess: () => {
        refetch();
      },
    });
  };

  const handlePost = () => {
    if (!receipt?.id) return;
    postMutation.mutate(receipt.id, {
      onSuccess: () => {
        refetch();
      },
    });
  };

  const handleDelete = () => {
    if (!receipt?.id) return;
    deleteMutation.mutate(receipt.id, {
      onSuccess: () => {
        navigate("/accounting/cash-receipts");
      },
    });
  };

  const handleCreate = () => {
    createMutation.mutate(createFormValues, {
      onSuccess: (data) => {
        if (data?.id) {
          navigate(`/accounting/cash-receipts/${data.id}`);
        }
      },
    });
  };

  // Handle "new" case - show create form
  if (isNew) {
    return (
      <>
        <Helmet>
          <title>Tạo phiếu thu mới | Print Production ERP</title>
        </Helmet>

        <div className="container mx-auto py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/accounting/cash-receipts")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Tạo phiếu thu mới
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Nhập thông tin phiếu thu
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => navigate("/accounting/cash-receipts")}
              >
                Hủy
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Tạo phiếu thu
              </Button>
            </div>
          </div>

          {/* Create Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin cơ bản</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="voucherDate">Ngày chứng từ *</Label>
                  <Input
                    id="voucherDate"
                    type="date"
                    value={createFormValues.voucherDate || ""}
                    onChange={(e) =>
                      setCreateFormValues({
                        ...createFormValues,
                        voucherDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postingDate">Ngày hạch toán *</Label>
                  <Input
                    id="postingDate"
                    type="date"
                    value={createFormValues.postingDate || ""}
                    onChange={(e) =>
                      setCreateFormValues({
                        ...createFormValues,
                        postingDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payerName">Người nộp *</Label>
                  <Input
                    id="payerName"
                    value={createFormValues.payerName || ""}
                    onChange={(e) =>
                      setCreateFormValues({
                        ...createFormValues,
                        payerName: e.target.value,
                      })
                    }
                    placeholder="Nhập tên người nộp"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Lý do thu *</Label>
                  <Input
                    id="reason"
                    value={createFormValues.reason || ""}
                    onChange={(e) =>
                      setCreateFormValues({
                        ...createFormValues,
                        reason: e.target.value,
                      })
                    }
                    placeholder="Nhập lý do thu"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Số tiền *</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={createFormValues.amount || 0}
                    onChange={(e) =>
                      setCreateFormValues({
                        ...createFormValues,
                        amount: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Thông tin bổ sung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentMethodId">
                    Phương thức thanh toán
                  </Label>
                  <Select
                    value={
                      createFormValues.paymentMethodId?.toString() || "all"
                    }
                    onValueChange={(value) =>
                      setCreateFormValues({
                        ...createFormValues,
                        paymentMethodId:
                          value === "all" ? null : Number.parseInt(value, 10),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn phương thức" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Không chọn</SelectItem>
                      {paymentMethodsData?.items?.map((method) => (
                        <SelectItem
                          key={method.id}
                          value={method.id?.toString() || ""}
                        >
                          {method.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cashFundId">Quỹ tiền mặt</Label>
                  <Select
                    value={createFormValues.cashFundId?.toString() || "all"}
                    onValueChange={(value) =>
                      setCreateFormValues({
                        ...createFormValues,
                        cashFundId:
                          value === "all" ? null : Number.parseInt(value, 10),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn quỹ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Không chọn</SelectItem>
                      {cashFundsData?.items?.map((fund) => (
                        <SelectItem
                          key={fund.id}
                          value={fund.id?.toString() || ""}
                        >
                          {fund.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Ghi chú</Label>
                  <Textarea
                    id="notes"
                    value={createFormValues.notes || ""}
                    onChange={(e) =>
                      setCreateFormValues({
                        ...createFormValues,
                        notes: e.target.value || null,
                      })
                    }
                    placeholder="Nhập ghi chú (nếu có)"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (isError || !receipt) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : "Không thể tải thông tin phiếu thu"}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => navigate("/accounting/cash-receipts")}>
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Phiếu thu {receipt.code} | Print Production ERP</title>
      </Helmet>

      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/accounting/cash-receipts")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  Phiếu thu {receipt.code}
                </h1>
                {getStatusBadge(receipt.status)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Chi tiết phiếu thu
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && editingCard === null && (
              <>
                <Button
                  variant="outline"
                  onClick={() => startEditingCard("main")}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Sửa
                </Button>
              </>
            )}
            {editingCard === "main" && (
              <>
                <Button
                  variant="default"
                  onClick={handleSaveCard}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Lưu
                </Button>
                <Button variant="outline" onClick={cancelEditingCard}>
                  <X className="h-4 w-4 mr-2" />
                  Hủy
                </Button>
              </>
            )}
            {canApprove && (
              <Button variant="default" onClick={handleApprove}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Duyệt
              </Button>
            )}
            {canPost && (
              <Button variant="default" onClick={handlePost}>
                <FileText className="h-4 w-4 mr-2" />
                Ghi sổ
              </Button>
            )}
            {canCancel && (
              <Button variant="destructive" onClick={handleCancel}>
                <XCircle className="h-4 w-4 mr-2" />
                Hủy phiếu
              </Button>
            )}
            {canDelete && (
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Xóa
              </Button>
            )}
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Xuất Excel
            </Button>
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              In
            </Button>
          </div>
        </div>

        {/* Main Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Thông tin phiếu thu</CardTitle>
              {editingCard === "main" && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveCard}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Lưu
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={cancelEditingCard}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Hủy
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Số phiếu</Label>
                <div className="font-mono text-sm">{receipt.code || "—"}</div>
              </div>
              <div className="space-y-2">
                <Label>Ngày chứng từ</Label>
                {editingCard === "main" ? (
                  <Input
                    type="date"
                    value={formatDateForInput(
                      cardEditValues.voucherDate as string
                    )}
                    onChange={(e) =>
                      setCardEditValues({
                        ...cardEditValues,
                        voucherDate: e.target.value
                          ? `${e.target.value}T00:00:00+07:00`
                          : null,
                      })
                    }
                  />
                ) : (
                  <div className="text-sm">
                    {formatDate(receipt.voucherDate)}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Ngày hạch toán</Label>
                {editingCard === "main" ? (
                  <Input
                    type="date"
                    value={formatDateForInput(
                      cardEditValues.postingDate as string
                    )}
                    onChange={(e) =>
                      setCardEditValues({
                        ...cardEditValues,
                        postingDate: e.target.value
                          ? `${e.target.value}T00:00:00+07:00`
                          : null,
                      })
                    }
                  />
                ) : (
                  <div className="text-sm">
                    {formatDate(receipt.postingDate)}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Người nộp</Label>
                {editingCard === "main" ? (
                  <Input
                    value={(cardEditValues.payerName as string) || ""}
                    onChange={(e) =>
                      setCardEditValues({
                        ...cardEditValues,
                        payerName: e.target.value,
                      })
                    }
                  />
                ) : (
                  <div className="text-sm">{receipt.payerName || "—"}</div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Lý do thu</Label>
                {editingCard === "main" ? (
                  <Input
                    value={(cardEditValues.reason as string) || ""}
                    onChange={(e) =>
                      setCardEditValues({
                        ...cardEditValues,
                        reason: e.target.value,
                      })
                    }
                  />
                ) : (
                  <div className="text-sm">{receipt.reason || "—"}</div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Số tiền</Label>
                {editingCard === "main" ? (
                  <Input
                    type="number"
                    value={(cardEditValues.amount as number) || 0}
                    onChange={(e) =>
                      setCardEditValues({
                        ...cardEditValues,
                        amount: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                ) : (
                  <div className="text-lg font-semibold">
                    {formatCurrency(receipt.amount || 0)}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Phương thức thanh toán</Label>
                {editingCard === "main" ? (
                  <Select
                    value={
                      (cardEditValues.paymentMethodId as number)?.toString() ||
                      ""
                    }
                    onValueChange={(value) =>
                      setCardEditValues({
                        ...cardEditValues,
                        paymentMethodId: value
                          ? Number.parseInt(value, 10)
                          : null,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn phương thức" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethodsData?.items?.map((method) => (
                        <SelectItem
                          key={method.id}
                          value={method.id?.toString() || ""}
                        >
                          {getPaymentMethodLabel(
                            method.code || method.name,
                            method.name
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm">
                    {getPaymentMethodLabel(
                      receipt.paymentMethodName,
                      receipt.paymentMethodName
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Quỹ tiền mặt</Label>
                {editingCard === "main" ? (
                  <Select
                    value={
                      (cardEditValues.cashFundId as number)?.toString() || ""
                    }
                    onValueChange={(value) =>
                      setCardEditValues({
                        ...cardEditValues,
                        cashFundId: value ? Number.parseInt(value, 10) : null,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn quỹ" />
                    </SelectTrigger>
                    <SelectContent>
                      {cashFundsData?.items?.map((fund) => (
                        <SelectItem
                          key={fund.id}
                          value={fund.id?.toString() || ""}
                        >
                          {fund.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm">{receipt.cashFundName || "—"}</div>
                )}
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Ghi chú</Label>
              {editingCard === "main" ? (
                <Textarea
                  value={(cardEditValues.notes as string) || ""}
                  onChange={(e) =>
                    setCardEditValues({
                      ...cardEditValues,
                      notes: e.target.value,
                    })
                  }
                  rows={3}
                />
              ) : (
                <div className="text-sm text-muted-foreground">
                  {receipt.notes || "—"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Reference Info Card */}
        {(receipt.orderId || receipt.invoiceId || receipt.customerId) && (
          <Card>
            <CardHeader>
              <CardTitle>Tham chiếu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {receipt.orderId && (
                  <div className="space-y-2">
                    <Label>Đơn hàng</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {receipt.orderCode || "—"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/orders/${receipt.orderId}`)}
                      >
                        Xem chi tiết
                      </Button>
                    </div>
                  </div>
                )}
                {receipt.invoiceId && (
                  <div className="space-y-2">
                    <Label>Hóa đơn</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {receipt.invoiceNumber || "—"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          navigate(`/invoices/${receipt.invoiceId}`)
                        }
                      >
                        Xem chi tiết
                      </Button>
                    </div>
                  </div>
                )}
                {receipt.customerId && (
                  <div className="space-y-2">
                    <Label>Khách hàng</Label>
                    <div className="text-sm">{receipt.customerName || "—"}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Audit Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin theo dõi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Người tạo</Label>
                <div className="text-sm">{receipt.createdByName || "—"}</div>
                <div className="text-xs text-muted-foreground">
                  {formatDateTime(receipt.createdAt)}
                </div>
              </div>
              {receipt.approvedById && (
                <div className="space-y-2">
                  <Label>Người duyệt</Label>
                  <div className="text-sm">{receipt.approvedByName || "—"}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDateTime(receipt.approvedAt)}
                  </div>
                </div>
              )}
              {receipt.postedById && (
                <div className="space-y-2">
                  <Label>Người hạch toán</Label>
                  <div className="text-sm">{receipt.postedByName || "—"}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDateTime(receipt.postedAt)}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xác nhận xóa phiếu thu</DialogTitle>
              <DialogDescription>
                Bạn có chắc chắn muốn xóa phiếu thu {receipt.code}? Hành động
                này không thể hoàn tác.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Xóa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
