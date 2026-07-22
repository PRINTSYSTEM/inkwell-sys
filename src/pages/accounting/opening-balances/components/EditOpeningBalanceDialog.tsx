import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCustomers } from "@/hooks/use-customer";
import { useVendors } from "@/hooks/use-vendor";
import {
  useUpdateCustomerOpeningBalance,
  useUpdateVendorOpeningBalance,
} from "@/hooks/use-opening-balance";
import { Loader2 } from "lucide-react";

interface EditOpeningBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "customer" | "vendor";
  item: any | null; // Null if adding new
}

export function EditOpeningBalanceDialog({
  open,
  onOpenChange,
  type,
  item,
}: EditOpeningBalanceDialogProps) {
  const isEdit = !!item;

  const [partnerId, setPartnerId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [asOfDate, setAsOfDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  const [note, setNote] = useState<string>("");

  // Load partners list
  const { data: customerData, isLoading: loadingCustomers } = useCustomers({
    pageNumber: 1,
    pageSize: 10000,
  });

  const { data: vendorData, isLoading: loadingVendors } = useVendors({
    pageNumber: 1,
    pageSize: 10000,
  });

  const updateCustomerBalance = useUpdateCustomerOpeningBalance();
  const updateVendorBalance = useUpdateVendorOpeningBalance();

  const isSaving = updateCustomerBalance.isPending || updateVendorBalance.isPending;

  // Initialize form fields when item changes
  useEffect(() => {
    if (open) {
      if (item) {
        setPartnerId(type === "customer" ? item.customerId?.toString() : item.vendorId?.toString());
        setAmount(item.amount?.toString() || "");
        setAsOfDate(
          item.asOfDate ? item.asOfDate.substring(0, 10) : new Date().toISOString().substring(0, 10)
        );
        setNote(item.note || "");
      } else {
        setPartnerId("");
        setAmount("");
        setAsOfDate(new Date().toISOString().substring(0, 10));
        setNote("");
      }
    }
  }, [open, item, type]);

  // Format currency display helper
  const formatCurrencyPreview = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return "";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const handleSave = async () => {
    if (!partnerId) {
      return;
    }
    const numAmount = parseFloat(amount || "0");

    // Convert date to standard ISO datetime
    const formattedDate = `${asOfDate}T00:00:00`;

    if (type === "customer") {
      await updateCustomerBalance.mutateAsync({
        customerId: parseInt(partnerId, 10),
        amount: numAmount,
        asOfDate: formattedDate,
        note: note || null,
      });
    } else {
      await updateVendorBalance.mutateAsync({
        vendorId: parseInt(partnerId, 10),
        amount: numAmount,
        asOfDate: formattedDate,
        note: note || null,
      });
    }
    onOpenChange(false);
  };

  const partners = type === "customer" 
    ? (customerData?.items || []) 
    : (vendorData?.items || []);

  const selectedPartner = partners.find(
    (p: any) => p.id?.toString() === partnerId
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? `Chỉnh sửa số dư đầu kỳ ${type === "customer" ? "khách hàng" : "nhà cung cấp"}`
              : `Thêm số dư đầu kỳ ${type === "customer" ? "khách hàng" : "nhà cung cấp"}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Partner Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">
              {type === "customer" ? "Khách hàng" : "Nhà cung cấp"}
            </Label>
            {isEdit ? (
              <Input
                value={
                  item.customerName ||
                  item.vendorName ||
                  `Mã: ${item.customerCode || item.vendorCode || item.customerId || item.vendorId}`
                }
                disabled
                className="bg-muted text-muted-foreground"
              />
            ) : (
              <select
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                disabled={loadingCustomers || loadingVendors}
              >
                <option value="">-- Chọn {type === "customer" ? "khách hàng" : "nhà cung cấp"} --</option>
                {partners.map((p: any) => (
                  <option key={p.id} value={p.id?.toString()}>
                    {p.code ? `[${p.code}] ` : ""}{p.name || p.companyName}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Amount input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-semibold">Số dư nợ đầu kỳ (VNĐ)</Label>
              {amount && (
                <span className="text-xs text-orange-600 font-semibold">
                  {formatCurrencyPreview(amount)}
                </span>
              )}
            </div>
            <Input
              type="number"
              placeholder="Ví dụ: 15000000 (Dư nợ) hoặc -2000000 (Trả trước)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">
              Nhập số dương nếu đối tác đang nợ ta, nhập số âm (-) nếu đối tác đã trả trước/ta đang nợ họ.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Ngày hiệu lực</Label>
            <Input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">
              Mẹo: Để số dư đầu kỳ hiển thị chính xác trong báo cáo của một tháng (ví dụ: tháng 7/2026), bạn nên đặt ngày hiệu lực là ngày cuối của tháng trước (ví dụ: 30/06/2026).
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Ghi chú</Label>
            <Textarea
              placeholder="Ghi chú điều chỉnh số dư..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="resize-none h-20"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !partnerId}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              "Lưu lại"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
