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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Loader2, DollarSign, CreditCard, Landmark, Check, ChevronsUpDown } from "lucide-react";
import { useCreateCashReceipt } from "@/hooks/use-cash";
import { usePaymentMethods } from "@/hooks/use-expense";
import { useBankAccounts } from "@/hooks/use-bank";
import { useCustomers } from "@/hooks/use-customer";
import type { CreateCashReceiptRequest } from "@/Schema/accounting.schema";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CreateCashReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId?: number;
  customerName?: string;
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
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [payerName, setPayerName] = useState<string>(customerName || "");
  const [address, setAddress] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);

  const { mutateAsync: createCashReceipt, isPending } = useCreateCashReceipt();
  const { data: paymentMethodsData } = usePaymentMethods({
    isActive: true,
    pageSize: 100,
  });
  const { data: bankAccountsData } = useBankAccounts({
    isActive: true,
    pageSize: 100,
  });
  const { data: customersData } = useCustomers({
    pageSize: 1000,
  });

  const paymentMethods = paymentMethodsData?.items || [];
  const bankAccounts = bankAccountsData?.items || [];
  const customers = (customersData as any)?.items || [];

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
      setSelectedCustomerId(customerId || null);
      setPayerName(customerName || "");
      setAddress("");
      setReason("Thu tiền khách hàng");
    }
  }, [open, customerId, customerName]);

  // Pre-fill address when customers data is loaded
  useEffect(() => {
    if (open && selectedCustomerId && customers.length > 0 && !address) {
      const cust = customers.find((c: any) => c.id === selectedCustomerId);
      if (cust?.address) {
        setAddress(cust.address);
      }
    }
  }, [open, selectedCustomerId, customers, address]);

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

    if (!payerName.trim()) {
      toast.error("Lỗi", {
        description: "Vui lòng nhập tên người nộp",
      });
      return;
    }

    if (!reason.trim()) {
      toast.error("Lỗi", {
        description: "Vui lòng nhập lý do thu",
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

    const finalNotes = [notes.trim(), address.trim() ? `Địa chỉ: ${address.trim()}` : ""].filter(Boolean).join("\n");

    const request: CreateCashReceiptRequest = {
      voucherDate,
      postingDate,
      payerName: payerName.trim(),
      reason: reason.trim(),
      amount: parseFloat(amount),
      paymentMethodId: parseInt(paymentMethodId, 10),
      customerId: selectedCustomerId || undefined,
      notes: finalNotes || undefined,
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
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Tạo phiếu thu</DialogTitle>
          <DialogDescription>
            {customerId ? `Tạo phiếu thu cho khách hàng ${customerName}` : "Tạo phiếu thu mới trong hệ thống"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 py-1 space-y-4">
          {/* Customer Selection - Optional */}
          {!customerId && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Khách hàng</Label>
              <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={customerSearchOpen}
                    className="w-full justify-between text-left font-normal h-9 bg-white border-slate-200"
                  >
                    <span className="truncate">
                      {selectedCustomerId
                        ? customers.find((c: any) => c.id === selectedCustomerId)?.companyName ||
                          customers.find((c: any) => c.id === selectedCustomerId)?.name ||
                          "Khách hàng đã chọn"
                        : "Chọn khách hàng (tùy chọn)..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-slate-500" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[380px] p-0" align="start">
                  <Command className="w-full">
                    <CommandInput placeholder="Tìm khách hàng..." className="h-9" />
                    <CommandList className="max-h-[200px]">
                      <CommandEmpty>Không tìm thấy khách hàng.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="none"
                          onSelect={() => {
                            setSelectedCustomerId(null);
                            setCustomerSearchOpen(false);
                          }}
                          className="cursor-pointer text-xs"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 text-primary",
                              selectedCustomerId === null ? "opacity-100" : "opacity-0"
                            )}
                          />
                          Không chọn khách hàng
                        </CommandItem>
                        {customers.map((c: any) => {
                          const displayName = c.companyName 
                            ? `${c.companyName} (${c.name || ""})` 
                            : c.name || "";
                          return (
                            <CommandItem
                              key={c.id}
                              value={displayName}
                              onSelect={() => {
                                setSelectedCustomerId(c.id);
                                setPayerName(c.companyName || c.name || "");
                                setAddress(c.address || "");
                                setCustomerSearchOpen(false);
                              }}
                              className="cursor-pointer text-xs py-2"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 text-primary",
                                  selectedCustomerId === c.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-700">{c.companyName || c.name}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  MST: {c.taxCode || "N/A"} - SĐT: {c.phone || "N/A"}
                                </span>
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="payerName" className="text-sm font-medium">
              Người nộp <span className="text-destructive">*</span>
            </Label>
            <Input
              id="payerName"
              value={payerName}
              onChange={(e) => setPayerName(e.target.value)}
              placeholder="Nhập tên người nộp"
              className="h-9 bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium">
              Địa chỉ
            </Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Địa chỉ người nộp"
              className="h-9 bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium">
              Lý do thu <span className="text-destructive">*</span>
            </Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Thu tiền công nợ đơn hàng"
              className="h-9 bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">
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
                className="pl-9 h-9 bg-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethodId" className="text-sm font-medium">
              Phương thức thanh toán <span className="text-destructive">*</span>
            </Label>
            <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
              <SelectTrigger id="paymentMethodId" className="h-9 bg-white">
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Chọn phương thức thanh toán" />
                </div>
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
            <div className="space-y-2 animate-in fade-in-50 slide-in-from-top-1 duration-150">
              <Label htmlFor="bankAccountId" className="text-sm font-medium">
                Tài khoản ngân hàng <span className="text-destructive">*</span>
              </Label>
              <Select value={bankAccountId} onValueChange={setBankAccountId}>
                <SelectTrigger id="bankAccountId" className="h-9 bg-white">
                  <div className="flex items-center">
                    <Landmark className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Chọn tài khoản ngân hàng" />
                  </div>
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
            <Label htmlFor="notes" className="text-sm font-medium">Ghi chú</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nhập ghi chú (tùy chọn)"
              className="h-9 bg-white"
            />
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 pt-2 border-t mt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="h-9"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !amount || !payerName.trim() || !reason.trim() || !paymentMethodId || (isBankTransfer && !bankAccountId)}
            className="h-9"
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
