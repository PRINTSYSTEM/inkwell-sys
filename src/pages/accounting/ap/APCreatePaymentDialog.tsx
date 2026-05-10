import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Loader2, Plus, X, Wallet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { useCreateCashPayment, useCashFunds } from "@/hooks/use-cash";
import { usePaymentMethods, useExpenseCategories } from "@/hooks/use-expense";
import { useBankAccounts } from "@/hooks/use-bank";
import { formatCurrency } from "@/lib/status-utils";
import { toast } from "sonner";
import type { CreateCashPaymentRequest } from "@/Schema/accounting.schema";

interface APCreatePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOrders: Map<number, any>;
  onSuccess?: () => void;
}

export function APCreatePaymentDialog({
  open,
  onOpenChange,
  selectedOrders,
  onSuccess,
}: APCreatePaymentDialogProps) {
  const orders = Array.from(selectedOrders.values());
  const firstOrder = orders[0];
  const totalAmount = orders.reduce((sum, order) => sum + (order.outstanding || 0), 0);

  const [formValues, setFormValues] = useState<any>({
    voucherDate: new Date().toISOString().split("T")[0],
    postingDate: new Date().toISOString().split("T")[0],
    receiverName: "",
    reason: "",
    amount: totalAmount,
    notes: null,
    paymentMethodId: 0,
    expenseCategoryId: 0,
    financeAccountId: "all",
    bankAccountId: "all",
    vendorId: null,
  });

  useEffect(() => {
    if (orders.length > 0) {
      const orderCodes = orders.map(o => o.documentNumber).join(", ");
      const newTotal = orders.reduce((sum, order) => sum + (order.outstanding || 0), 0);
      
      setFormValues(prev => ({
        ...prev,
        receiverName: firstOrder.vendorName || "",
        reason: `Thanh toán đơn hàng: ${orderCodes}`,
        amount: newTotal,
        vendorId: firstOrder.vendorId,
      }));
    }
  }, [open, selectedOrders, totalAmount]);

  const { data: paymentMethodsData } = usePaymentMethods({
    pageNumber: 1,
    pageSize: 100,
    isActive: true,
  });

  const { data: expenseCategoriesData } = useExpenseCategories({
    pageNumber: 1,
    pageSize: 100,
    isActive: true,
  });

  const { data: cashFundsData } = useCashFunds();
  const { data: bankAccountsData } = useBankAccounts({ isActive: true });

  const createMutation = useCreateCashPayment();

  const selectedPaymentMethod = paymentMethodsData?.items?.find(
    (m) => m.id === formValues.paymentMethodId
  );
  const isBankTransfer = selectedPaymentMethod?.name?.toLowerCase().includes("chuyển khoản") || 
                         selectedPaymentMethod?.description?.toLowerCase().includes("chuyển khoản");

  const handleCreate = () => {
    if (!formValues.receiverName) {
      toast.error("Vui lòng nhập tên người nhận");
      return;
    }
    if (!formValues.paymentMethodId || formValues.paymentMethodId === 0) {
      toast.error("Vui lòng chọn phương thức thanh toán");
      return;
    }
    if (isBankTransfer && (formValues.bankAccountId === "all" || !formValues.bankAccountId)) {
      toast.error("Vui lòng chọn tài khoản ngân hàng");
      return;
    }
    if (!formValues.expenseCategoryId || formValues.expenseCategoryId === 0 || formValues.expenseCategoryId === "all") {
      toast.error("Vui lòng chọn khoản mục chi");
      return;
    }
    if (formValues.amount <= 0) {
      toast.error("Số tiền phải lớn hơn 0");
      return;
    }

    // Build payload exactly like CashPaymentDetailPage:
    // - Do NOT include bankAccountId if null (backend .NET can't parse null as int)
    // - financeAccountId can be null (backend accepts nullable int)
    // - Only include orderId and vendorId if they have real values
    const payload: any = {
      voucherDate: new Date(formValues.voucherDate).toISOString(),
      postingDate: new Date(formValues.postingDate).toISOString(),
      receiverName: formValues.receiverName,
      expenseCategoryId: Number(formValues.expenseCategoryId),
      reason: formValues.reason,
      amount: formValues.amount,
      paymentMethodId: Number(formValues.paymentMethodId),
      financeAccountId: (formValues.financeAccountId && formValues.financeAccountId !== "all")
        ? Number(formValues.financeAccountId)
        : null,
      vendorId: firstOrder.vendorId || null,
      notes: formValues.notes || null,
    };

    // Only add bankAccountId if a real account is selected (never send null)
    if (formValues.bankAccountId && formValues.bankAccountId !== "all") {
      payload.bankAccountId = Number(formValues.bankAccountId);
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        onOpenChange(false);
        if (onSuccess) onSuccess();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-orange-600" />
            Tạo phiếu chi
          </DialogTitle>
          <DialogDescription>
            Tạo phiếu chi cho {orders.length} đơn hàng đã chọn
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="voucherDate">Ngày chứng từ *</Label>
                <Input
                  id="voucherDate"
                  type="date"
                  value={formValues.voucherDate || ""}
                  onChange={(e) =>
                    setFormValues({
                      ...formValues,
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
                  value={formValues.postingDate || ""}
                  onChange={(e) =>
                    setFormValues({
                      ...formValues,
                      postingDate: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="receiverName">Người nhận *</Label>
              <Input
                id="receiverName"
                value={formValues.receiverName || ""}
                onChange={(e) =>
                  setFormValues({
                    ...formValues,
                    receiverName: e.target.value,
                  })
                }
                placeholder="Tên nhà cung cấp"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Lý do chi *</Label>
              <Input
                id="reason"
                value={formValues.reason || ""}
                onChange={(e) =>
                  setFormValues({
                    ...formValues,
                    reason: e.target.value,
                  })
                }
                placeholder="Nhập lý do chi"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Tổng số tiền *</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  value={formValues.amount}
                  onChange={(e) =>
                    setFormValues({
                      ...formValues,
                      amount: Number.parseFloat(e.target.value) || 0,
                    })
                  }
                  className="pr-12 font-bold text-orange-700"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                  VNĐ
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground italic">
                Tổng nợ gốc: {formatCurrency(totalAmount)}
              </p>
            </div>
            
            <div className="p-3 bg-muted/50 rounded-lg border border-dashed text-xs space-y-1 max-h-[120px] overflow-auto">
              <p className="font-bold text-muted-foreground uppercase">Danh sách đơn hàng:</p>
              {orders.map(order => (
                <div key={order.documentId} className="flex justify-between items-center py-1 border-b border-muted last:border-0">
                  <span className="font-medium">{order.documentNumber}</span>
                  <span className="text-orange-600 font-bold">{formatCurrency(order.outstanding)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="financeAccountId">Quỹ tiền mặt / Ngân hàng</Label>
              <Select
                value={formValues.financeAccountId?.toString() || "all"}
                onValueChange={(value) =>
                  setFormValues({
                    ...formValues,
                    financeAccountId: value === "all" ? null : Number.parseInt(value, 10),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn quỹ (tùy chọn)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Không chọn</SelectItem>
                  {cashFundsData?.items?.map((fund) => (
                    <SelectItem key={fund.id} value={fund.id?.toString() || ""}>
                      {fund.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethodId">Phương thức thanh toán *</Label>
              <Select
                value={formValues.paymentMethodId?.toString() || "0"}
                onValueChange={(value) =>
                  setFormValues({
                    ...formValues,
                    paymentMethodId: Number.parseInt(value, 10),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn phương thức" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethodsData?.items?.map((method) => (
                    <SelectItem key={method.id} value={method.id?.toString() || ""}>
                      {method.description || method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isBankTransfer && (
              <div className="space-y-2">
                <Label htmlFor="bankAccountId">Ngân hàng *</Label>
                <Select
                  value={formValues.bankAccountId?.toString() || "all"}
                  onValueChange={(value) =>
                    setFormValues({
                      ...formValues,
                      bankAccountId: value === "all" ? null : Number.parseInt(value, 10),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn tài khoản ngân hàng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Không chọn</SelectItem>
                    {bankAccountsData?.items?.map((account) => (
                      <SelectItem key={account.id} value={account.id?.toString() || ""}>
                        {account.bankName} - {account.accountNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="expenseCategoryId">Khoản mục chi *</Label>
              <Select
                value={formValues.expenseCategoryId?.toString() || "all"}
                onValueChange={(value) =>
                  setFormValues({
                    ...formValues,
                    expenseCategoryId: value === "all" ? null : Number.parseInt(value, 10),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn khoản mục chi" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategoriesData?.items?.map((category) => (
                    <SelectItem key={category.id} value={category.id?.toString() || ""}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea
                id="notes"
                value={formValues.notes || ""}
                onChange={(e) =>
                  setFormValues({
                    ...formValues,
                    notes: e.target.value,
                  })
                }
                placeholder="Nhập ghi chú (nếu có)"
                rows={2}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button 
            className="bg-orange-600 hover:bg-orange-700" 
            onClick={handleCreate}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Xác nhận tạo phiếu chi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
