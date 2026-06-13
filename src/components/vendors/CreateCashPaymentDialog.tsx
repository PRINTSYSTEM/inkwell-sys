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
import { useCreateCashPayment } from "@/hooks/use-cash";
import { usePaymentMethods, useExpenseCategories } from "@/hooks/use-expense";
import { useBankAccounts } from "@/hooks/use-bank";
import { useVendors } from "@/hooks/use-vendor";
import type { CreateCashPaymentRequest } from "@/Schema/accounting.schema";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CreateCashPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId?: number;
  vendorName?: string;
}

export function CreateCashPaymentDialog({
  open,
  onOpenChange,
  vendorId,
  vendorName,
}: CreateCashPaymentDialogProps) {
  const navigate = useNavigate();
  const [amount, setAmount] = useState<string>("");
  const [paymentMethodId, setPaymentMethodId] = useState<string>("");
  const [bankAccountId, setBankAccountId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [receiverName, setReceiverName] = useState<string>(vendorName || "");
  const [reason, setReason] = useState<string>("");
  const [expenseCategoryId, setExpenseCategoryId] = useState<string>("");
  const [vendorSearchOpen, setVendorSearchOpen] = useState(false);

  const { mutateAsync: createCashPayment, isPending } = useCreateCashPayment();
  const { data: paymentMethodsData } = usePaymentMethods({
    isActive: true,
    pageSize: 100,
  });
  const { data: bankAccountsData } = useBankAccounts({
    isActive: true,
    pageSize: 100,
  });
  const { data: expenseCategoriesData } = useExpenseCategories({
    isActive: true,
    pageSize: 100,
  });
  const { data: vendorsData } = useVendors({
    pageSize: 1000,
  });

  const paymentMethods = paymentMethodsData?.items || [];
  const bankAccounts = bankAccountsData?.items || [];
  const expenseCategories = expenseCategoriesData?.items || [];
  const vendors = vendorsData?.items || [];

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
      setSelectedVendorId(vendorId || null);
      setReceiverName(vendorName || "");
      setReason("Thanh toán tiền nhà cung cấp");
      setExpenseCategoryId("");
    }
  }, [open, vendorId, vendorName]);

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

  // Auto-select first expense category once loaded
  useEffect(() => {
    if (open && expenseCategories.length > 0 && !expenseCategoryId) {
      // Find "Chi phí vật tư" or similar
      const defaultCat = expenseCategories.find(
        (c) => c.code === "CPVT" || c.name?.toLowerCase().includes("vật tư")
      );
      if (defaultCat?.id) {
        setExpenseCategoryId(defaultCat.id.toString());
      } else if (expenseCategories[0]?.id) {
        setExpenseCategoryId(expenseCategories[0].id.toString());
      }
    }
  }, [open, expenseCategories, expenseCategoryId]);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Lỗi", {
        description: "Vui lòng nhập số tiền hợp lệ",
      });
      return;
    }

    if (!receiverName.trim()) {
      toast.error("Lỗi", {
        description: "Vui lòng nhập tên người nhận",
      });
      return;
    }

    if (!reason.trim()) {
      toast.error("Lỗi", {
        description: "Vui lòng nhập lý do chi",
      });
      return;
    }

    if (!expenseCategoryId) {
      toast.error("Lỗi", {
        description: "Vui lòng chọn khoản mục chi",
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
        description: "Vui lòng chọn tài khoản ngân hàng chuyển tiền",
      });
      return;
    }

    const now = new Date();
    const voucherDate = now.toISOString();
    const postingDate = now.toISOString();

    const request: CreateCashPaymentRequest = {
      voucherDate,
      postingDate,
      receiverName: receiverName.trim(),
      reason: reason.trim(),
      amount: parseFloat(amount),
      expenseCategoryId: parseInt(expenseCategoryId, 10),
      paymentMethodId: parseInt(paymentMethodId, 10),
      vendorId: selectedVendorId || undefined,
      notes: notes.trim() || undefined,
      bankAccountId: isBankTransfer && bankAccountId ? parseInt(bankAccountId, 10) : undefined,
    };

    try {
      const response = await createCashPayment(request);
      onOpenChange(false);
      // Navigate to cash payment detail page
      if (response?.id) {
        navigate(`/accounting/cash-payments/${response.id}`);
      }
    } catch (error) {
      // Error is handled by the hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Tạo phiếu chi</DialogTitle>
          <DialogDescription>
            {vendorId ? `Tạo phiếu chi cho nhà cung cấp ${vendorName}` : "Tạo phiếu chi mới trong hệ thống"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 py-1 space-y-4">
          {/* Vendor Selection - Optional */}
          {!vendorId && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Nhà cung cấp</Label>
              <Popover open={vendorSearchOpen} onOpenChange={setVendorSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={vendorSearchOpen}
                    className="w-full justify-between text-left font-normal h-9 bg-white border-slate-200"
                  >
                    <span className="truncate">
                      {selectedVendorId
                        ? vendors.find((v: any) => v.id === selectedVendorId)?.companyName ||
                          vendors.find((v: any) => v.id === selectedVendorId)?.name ||
                          "Nhà cung cấp đã chọn"
                        : "Chọn nhà cung cấp (tùy chọn)..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-slate-500" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[380px] p-0" align="start">
                  <Command className="w-full">
                    <CommandInput placeholder="Tìm nhà cung cấp..." className="h-9" />
                    <CommandList className="max-h-[200px]">
                      <CommandEmpty>Không tìm thấy nhà cung cấp.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="none"
                          onSelect={() => {
                            setSelectedVendorId(null);
                            setVendorSearchOpen(false);
                          }}
                          className="cursor-pointer text-xs"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 text-primary",
                              selectedVendorId === null ? "opacity-100" : "opacity-0"
                            )}
                          />
                          Không chọn nhà cung cấp
                        </CommandItem>
                        {vendors.map((v: any) => {
                          const displayName = v.companyName 
                            ? `${v.companyName} (${v.name || ""})` 
                            : v.name || "";
                          return (
                            <CommandItem
                              key={v.id}
                              value={displayName}
                              onSelect={() => {
                                setSelectedVendorId(v.id);
                                setReceiverName(v.companyName || v.name || "");
                                setVendorSearchOpen(false);
                              }}
                              className="cursor-pointer text-xs py-2"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 text-primary",
                                  selectedVendorId === v.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-700">{v.companyName || v.name}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  MST: {v.taxCode || "N/A"} - SĐT: {v.phone || "N/A"}
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
            <Label htmlFor="receiverName" className="text-sm font-medium">
              Người nhận <span className="text-destructive">*</span>
            </Label>
            <Input
              id="receiverName"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              placeholder="Nhập tên người nhận"
              className="h-9 bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium">
              Lý do chi <span className="text-destructive">*</span>
            </Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Chi tiền mua vật tư in ấn"
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
            <Label htmlFor="expenseCategoryId" className="text-sm font-medium">
              Khoản mục chi <span className="text-destructive">*</span>
            </Label>
            <Select value={expenseCategoryId} onValueChange={setExpenseCategoryId}>
              <SelectTrigger id="expenseCategoryId" className="h-9 bg-white">
                <SelectValue placeholder="Chọn khoản mục chi" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id?.toString() || ""}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            disabled={isPending || !amount || !receiverName.trim() || !reason.trim() || !expenseCategoryId || !paymentMethodId || (isBankTransfer && !bankAccountId)}
            className="h-9"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang tạo...
              </>
            ) : (
              "Tạo phiếu chi"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
