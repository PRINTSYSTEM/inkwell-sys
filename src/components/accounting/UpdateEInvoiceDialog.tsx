// src/components/accounting/UpdateEInvoiceDialog.tsx
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
import { useUpdateEInvoiceInfo } from "@/hooks/use-invoice";
import { Loader2, FileText } from "lucide-react";
import { format } from "date-fns";
import type { InvoiceResponse } from "@/Schema/invoice.schema";

interface UpdateEInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: number;
  invoice?: InvoiceResponse | null;
}

export function UpdateEInvoiceDialog({
  open,
  onOpenChange,
  invoiceId,
  invoice,
}: UpdateEInvoiceDialogProps) {
  const [eInvoiceNumber, setEInvoiceNumber] = useState<string>("");
  const [eInvoiceSerial, setEInvoiceSerial] = useState<string>("");
  const [taxAuthorityCode, setTaxAuthorityCode] = useState<string>("");
  const [eInvoiceIssuedAt, setEInvoiceIssuedAt] = useState<string>("");

  const updateEInvoiceMutation = useUpdateEInvoiceInfo();

  // Initialize form with existing values
  useEffect(() => {
    if (open && invoice) {
      setEInvoiceNumber(invoice.eInvoiceNumber || "");
      setEInvoiceSerial(invoice.eInvoiceSerial || "");
      setTaxAuthorityCode(invoice.taxAuthorityCode || "");
      setEInvoiceIssuedAt(
        invoice.eInvoiceIssuedAt
          ? format(new Date(invoice.eInvoiceIssuedAt), "yyyy-MM-dd'T'HH:mm")
          : ""
      );
    }
  }, [open, invoice]);

  const handleSubmit = async () => {
    try {
      await updateEInvoiceMutation.mutateAsync({
        id: invoiceId,
        data: {
          eInvoiceNumber: eInvoiceNumber.trim() || null,
          eInvoiceSerial: eInvoiceSerial.trim() || null,
          taxAuthorityCode: taxAuthorityCode.trim() || null,
          eInvoiceIssuedAt: eInvoiceIssuedAt
            ? new Date(eInvoiceIssuedAt).toISOString()
            : null,
        },
      });
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !updateEInvoiceMutation.isPending) {
      setEInvoiceNumber("");
      setEInvoiceSerial("");
      setTaxAuthorityCode("");
      setEInvoiceIssuedAt("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Cập nhật thông tin hóa đơn điện tử
          </DialogTitle>
          <DialogDescription>
            Cập nhật thông tin hóa đơn điện tử từ cơ quan thuế
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="eInvoiceNumber">Số hóa đơn điện tử</Label>
            <Input
              id="eInvoiceNumber"
              value={eInvoiceNumber}
              onChange={(e) => setEInvoiceNumber(e.target.value)}
              placeholder="Số hóa đơn điện tử"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              Tối đa 50 ký tự
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="eInvoiceSerial">Số serial hóa đơn</Label>
            <Input
              id="eInvoiceSerial"
              value={eInvoiceSerial}
              onChange={(e) => setEInvoiceSerial(e.target.value)}
              placeholder="Số serial hóa đơn"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              Tối đa 50 ký tự
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxAuthorityCode">Mã cơ quan thuế</Label>
            <Input
              id="taxAuthorityCode"
              value={taxAuthorityCode}
              onChange={(e) => setTaxAuthorityCode(e.target.value)}
              placeholder="Mã cơ quan thuế"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              Tối đa 100 ký tự
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="eInvoiceIssuedAt">
              Ngày phát hành hóa đơn điện tử
            </Label>
            <Input
              id="eInvoiceIssuedAt"
              type="datetime-local"
              value={eInvoiceIssuedAt}
              onChange={(e) => setEInvoiceIssuedAt(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={updateEInvoiceMutation.isPending}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={updateEInvoiceMutation.isPending}
          >
            {updateEInvoiceMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang cập nhật...
              </>
            ) : (
              "Cập nhật"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

