// src/components/accounting/IssueInvoiceDialog.tsx
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useIssueInvoice } from "@/hooks/use-invoice";
import { Loader2, FileCheck } from "lucide-react";
import { format } from "date-fns";

interface IssueInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: number;
  currentInvoiceNumber?: string | null;
}

export function IssueInvoiceDialog({
  open,
  onOpenChange,
  invoiceId,
  currentInvoiceNumber,
}: IssueInvoiceDialogProps) {
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [issuedAt, setIssuedAt] = useState<string>(
    format(new Date(), "yyyy-MM-dd'T'HH:mm")
  );

  const issueInvoiceMutation = useIssueInvoice();

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setInvoiceNumber(currentInvoiceNumber || "");
      setIssuedAt(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    }
  }, [open, currentInvoiceNumber]);

  const handleSubmit = async () => {
    if (!invoiceNumber.trim()) {
      return;
    }

    try {
      await issueInvoiceMutation.mutateAsync({
        id: invoiceId,
        data: {
          invoiceNumber: invoiceNumber.trim(),
          issuedAt: issuedAt || undefined,
        },
      });
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !issueInvoiceMutation.isPending) {
      setInvoiceNumber("");
      setIssuedAt(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5" />
            Phát hành hóa đơn
          </DialogTitle>
          <DialogDescription>
            Nhập số hóa đơn và ngày phát hành để phát hành hóa đơn này
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="invoiceNumber">
              Số hóa đơn <span className="text-destructive">*</span>
            </Label>
            <Input
              id="invoiceNumber"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="VD: HD/2024/001"
              maxLength={50}
              required
            />
            <p className="text-xs text-muted-foreground">
              Tối đa 50 ký tự
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="issuedAt">Ngày phát hành</Label>
            <Input
              id="issuedAt"
              type="datetime-local"
              value={issuedAt}
              onChange={(e) => setIssuedAt(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Để trống sẽ sử dụng thời gian hiện tại
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={issueInvoiceMutation.isPending}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              issueInvoiceMutation.isPending || !invoiceNumber.trim()
            }
          >
            {issueInvoiceMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang phát hành...
              </>
            ) : (
              "Phát hành"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

