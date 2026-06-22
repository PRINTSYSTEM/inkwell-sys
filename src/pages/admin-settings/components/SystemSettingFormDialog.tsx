import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Info, Check, ShieldAlert } from "lucide-react";
import type { SystemSettingResponse } from "@/Schema";

interface SystemSettingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setting: SystemSettingResponse | null;
  onSubmit: (key: string, value: string, description: string) => Promise<void> | void;
  isPending: boolean;
}

export function SystemSettingFormDialog({
  open,
  onOpenChange,
  setting,
  onSubmit,
  isPending,
}: SystemSettingFormDialogProps) {
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (setting) {
      setValue(setting.value);
      setDescription(setting.description);
      setError(null);
    }
  }, [setting, open]);

  if (!setting) return null;

  const isVatRate = setting.key === "DefaultVatRate";
  const isPrefix =
    setting.key === "OrderCode_Prefix" || setting.key === "ProofingOrder_Prefix";

  const handleValidate = (): boolean => {
    setError(null);

    if (!value.trim()) {
      setError("Giá trị thiết lập không được để trống.");
      return false;
    }

    if (isVatRate) {
      const num = Number(value);
      if (isNaN(num) || num < 0 || num > 1) {
        setError("Tỷ lệ VAT bắt buộc phải là số nằm trong khoảng từ 0 đến 1 (Ví dụ: 0.08 cho 8%).");
        return false;
      }
    }

    if (isPrefix) {
      const val = value.trim();
      const prefixRegex = /^[A-Z0-9]+$/;
      if (!prefixRegex.test(val)) {
        setError("Tiền tố mã chỉ được phép chứa chữ hoa và số (A-Z0-9).");
        return false;
      }
      if (val.length > 10) {
        setError("Tiền tố mã có độ dài tối đa là 10 ký tự.");
        return false;
      }
    }

    return true;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handleValidate()) return;

    // Normalize prefix input by trimming whitespace
    const finalValue = isPrefix ? value.trim() : value;
    await onSubmit(setting.key, finalValue, description);
    onOpenChange(false);
  };

  // Helper VAT display
  const getVatDisplay = () => {
    const num = Number(value);
    if (!isNaN(num) && num >= 0 && num <= 1) {
      return `Tương đương ${(num * 100).toFixed(0)}% VAT`;
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border border-border bg-card shadow-lg rounded-xl">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
            Cập nhật thiết lập
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Thay đổi giá trị cấu hình của hệ thống.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-6 py-2">
          {/* VAT Warning Banner */}
          {isVatRate && (
            <Alert className="border-amber-200 bg-amber-50/50 text-amber-900 dark:border-amber-950 dark:bg-amber-950/20 dark:text-amber-300 rounded-lg p-3.5">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <div className="ml-3 space-y-1">
                <AlertTitle className="text-sm font-semibold flex items-center gap-1.5">
                  Lưu ý thay đổi VAT
                </AlertTitle>
                <AlertDescription className="text-xs leading-relaxed text-amber-800 dark:text-amber-400">
                  Thay đổi VAT mặc định chỉ áp dụng cho các đơn mới được tạo sau khi lưu.
                  Tránh hiểu nhầm rằng các hóa đơn cũ sẽ tự động thay đổi.
                </AlertDescription>
              </div>
            </Alert>
          )}

          <div className="space-y-4">
            {/* Display setting key (disabled) */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-muted-foreground">Mã cấu hình (Key)</Label>
              <div className="font-mono text-xs bg-muted border border-border px-3 py-2 rounded-md select-all text-foreground/80">
                {setting.key}
              </div>
            </div>

            {/* Input field depending on type */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="value" className="text-sm font-bold text-foreground">
                  Giá trị thiết lập <span className="text-destructive">*</span>
                </Label>
                {isVatRate && getVatDisplay() && (
                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900">
                    {getVatDisplay()}
                  </span>
                )}
              </div>
              <Input
                id="value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={
                  isVatRate
                    ? "Ví dụ: 0.08 cho 8%"
                    : isPrefix
                    ? "Ví dụ: DH, BB"
                    : "Nhập giá trị cấu hình..."
                }
                className={`focus:ring-primary ${
                  error ? "border-destructive focus-visible:ring-destructive" : ""
                }`}
                disabled={isPending}
                autoFocus
              />
              {isPrefix && (
                <p className="text-[11px] text-muted-foreground leading-tight">
                  * Chỉ chứa chữ in hoa và số (A-Z0-9), tối đa 10 ký tự.
                </p>
              )}
            </div>

            {/* Description textarea */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm font-bold text-foreground">
                Mô tả thiết lập
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả chức năng của cấu hình này..."
                className="min-h-[80px] focus:ring-primary text-sm"
                disabled={isPending}
              />
            </div>
          </div>

          {/* Validation error display */}
          {error && (
            <Alert variant="destructive" className="p-3 rounded-lg">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <AlertDescription className="text-xs font-medium ml-2">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2 sm:gap-0 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="w-full sm:w-auto"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-1.5"
            >
              {isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
