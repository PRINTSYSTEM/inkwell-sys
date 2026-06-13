import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, DollarSign, CreditCard, Landmark } from "lucide-react";
import { useCreateCashReceipt } from "@/hooks/use-cash";
import { usePaymentMethods } from "@/hooks/use-expense";
import { useBankAccounts } from "@/hooks/use-bank";
import type { CreateCashReceiptRequest } from "@/Schema/accounting.schema";
import { toast } from "sonner";
import { getPaymentMethodLabel } from "@/lib/status-utils";

interface CreateCashReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: number;
  customerName: string;
}

export function CreateCashReceiptDialog({
  open,
  onOpenChange,
  customerId,
  customerName,
}: CreateCashReceiptDialogProps) {
  const navigate = useNavigate();
  const [amount, setAmount] = useState<string>("");
  const [paymentMethodId, setPaymentMethodId] = useState<string>("");
  const [bankAccountId, setBankAccountId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const { mutateAsync: createCashReceipt, isPending } = useCreateCashReceipt();
  const { data: paymentMethodsData } = usePaymentMethods({
    isActive: true,
    pageSize: 100,
  });
  const { data: bankAccountsData } = useBankAccounts({
    isActive: true,
    pageSize: 100,
  });

  const paymentMethods = paymentMethodsData?.items || [];
  const bankAccounts = bankAccountsData?.items || [];

  const selectedMethod = paymentMethods.find(
    (m) => m.id?.toString() === paymentMethodId
  );
  const isBankTransfer =
    selectedMethod?.code === "CK" ||
    selectedMethod?.name?.toLowerCase().includes("chuyển khoản") ||
    selectedMethod?.description?.toLowerCase().includes("chuyển khoản");

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setAmount("");
      setNotes("");
      setBankAccountId("");
    }
  }, [open]);

  // Auto-set default payment method to cash (code: "TM")
  useEffect(() => {
    if (open && paymentMethods.length > 0) {
      const cashMethod = paymentMethods.find(
        (m) => m.code === "TM" || m.name?.toLowerCase().includes("tiền mặt")
      );
      if (cashMethod?.id) {
        setPaymentMethodId(cashMethod.id.toString());
      } else if (paymentMethods[0]?.id) {
        setPaymentMethodId(paymentMethods[0].id.toString());
      }
    }
  }, [open, paymentMethods]);

  // Auto-select first bank account when switching to bank transfer
  useEffect(() => {
    if (isBankTransfer && !bankAccountId && bankAccounts.length > 0) {
      setBankAccountId(bankAccounts[0].id?.toString() || "");
    }
  }, [isBankTransfer, bankAccountId, bankAccounts]);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Lỗi", {
        description: "Vui lòng nhập số tiền hợp lệ",
      });
      return;
    }

    if (!paymentMethodId) {
      toast.error("Lỗi", {
        description: "Vui lòng chọn phương thức thanh toán",
      });
      return;
    }

    if (isBankTransfer && !bankAccountId) {
      toast.error("Lỗi", {
        description: "Vui lòng chọn tài khoản ngân hàng nhận tiền",
      });
      return;
    }

    const now = new Date();
    const voucherDate = now.toISOString();
    const postingDate = now.toISOString();

    const request: CreateCashReceiptRequest = {
      voucherDate,
      postingDate,
      payerName: customerName,
      amount: parseFloat(amount),
      paymentMethodId: parseInt(paymentMethodId, 10),
      customerId: customerId,
      notes: notes.trim() || undefined,
      bankAccountId: isBankTransfer && bankAccountId ? parseInt(bankAccountId, 10) : undefined,
    };

    try {
      const response = await createCashReceipt(request);
      onOpenChange(false);
      // Navigate to cash receipt detail page
      if (response?.id) {
        navigate(`/accounting/cash-receipts/${response.id}`);
      }
    } catch (error) {
      // Error is handled by the hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo phiếu thu</DialogTitle>
          <DialogDescription>
            Tạo phiếu thu cho khách hàng {customerName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">
              Số tiền <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Nhập số tiền"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethodId">
              Phương thức thanh toán <span className="text-destructive">*</span>
            </Label>
            <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
              <SelectTrigger id="paymentMethodId">
                <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Chọn phương thức thanh toán" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
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

          {isBankTransfer && (
            <div className="space-y-2">
              <Label htmlFor="bankAccountId">
                Tài khoản ngân hàng <span className="text-destructive">*</span>
              </Label>
              <Select value={bankAccountId} onValueChange={setBankAccountId}>
                <SelectTrigger id="bankAccountId">
                  <Landmark className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Chọn tài khoản ngân hàng" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem
                      key={account.id}
                      value={account.id?.toString() || ""}
                    >
                      {account.bankName} - {account.accountNumber} ({account.accountHolder})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nhập ghi chú (tùy chọn)"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !amount || !paymentMethodId || (isBankTransfer && !bankAccountId)}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang tạo...
              </>
            ) : (
              "Tạo phiếu thu"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
