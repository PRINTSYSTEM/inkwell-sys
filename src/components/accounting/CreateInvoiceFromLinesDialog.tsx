// src/components/accounting/CreateInvoiceFromLinesDialog.tsx
import { useState, useMemo } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useBillableItems,
  useCreateInvoiceFromLines,
} from "@/hooks/use-invoice";
import { formatCurrency, formatDateTime } from "@/lib/status-utils";
import type {
  BillableItemResponse,
  InvoiceLineInput,
  CreateInvoiceFromLinesRequest,
} from "@/Schema/invoice.schema";
import { Loader2, ShoppingCart } from "lucide-react";

interface CreateInvoiceFromLinesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId?: number;
}

export function CreateInvoiceFromLinesDialog({
  open,
  onOpenChange,
  customerId,
}: CreateInvoiceFromLinesDialogProps) {
  const { data: billableItems, isLoading } = useBillableItems(
    customerId ? { customerId } : undefined
  );

  const [selectedLines, setSelectedLines] = useState<
    Map<number, InvoiceLineInput>
  >(new Map());
  const [discountPercent, setDiscountPercent] = useState<string>("");
  const [discountAmount, setDiscountAmount] = useState<string>("");
  const [discountReason, setDiscountReason] = useState<string>("");
  const [taxRate, setTaxRate] = useState<string>("0.1");
  const [notes, setNotes] = useState<string>("");
  const [buyerName, setBuyerName] = useState<string>("");
  const [buyerCompanyName, setBuyerCompanyName] = useState<string>("");
  const [buyerTaxCode, setBuyerTaxCode] = useState<string>("");
  const [buyerAddress, setBuyerAddress] = useState<string>("");
  const [buyerEmail, setBuyerEmail] = useState<string>("");

  const createInvoiceMutation = useCreateInvoiceFromLines();

  // Reset form when dialog closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedLines(new Map());
      setDiscountPercent("");
      setDiscountAmount("");
      setDiscountReason("");
      setTaxRate("0.1");
      setNotes("");
      setBuyerName("");
      setBuyerCompanyName("");
      setBuyerTaxCode("");
      setBuyerAddress("");
      setBuyerEmail("");
    }
    onOpenChange(open);
  };

  const toggleLine = (item: BillableItemResponse) => {
    if (!item.deliveryLineId) return;

    const newSelected = new Map(selectedLines);
    if (newSelected.has(item.deliveryLineId)) {
      newSelected.delete(item.deliveryLineId);
    } else {
      newSelected.set(item.deliveryLineId, {
        deliveryLineId: item.deliveryLineId,
        invoiceQty: item.remainingToInvoice || 1,
        discountPercent: null,
      });
    }
    setSelectedLines(newSelected);
  };

  const updateLineQuantity = (
    deliveryLineId: number,
    quantity: number
  ) => {
    const newSelected = new Map(selectedLines);
    const existing = newSelected.get(deliveryLineId);
    const item = billableItems?.find(
      (i) => i.deliveryLineId === deliveryLineId
    );
    if (existing && item) {
      const maxQty = item.remainingToInvoice || 1;
      newSelected.set(deliveryLineId, {
        ...existing,
        invoiceQty: Math.max(1, Math.min(quantity, maxQty)),
      });
    }
    setSelectedLines(newSelected);
  };

  const updateLineDiscount = (
    deliveryLineId: number,
    discount: number | null
  ) => {
    const newSelected = new Map(selectedLines);
    const existing = newSelected.get(deliveryLineId);
    if (existing) {
      newSelected.set(deliveryLineId, {
        ...existing,
        discountPercent: discount,
      });
    }
    setSelectedLines(newSelected);
  };

  // Calculate totals
  const totals = useMemo(() => {
    let subTotal = 0;

    selectedLines.forEach((line, deliveryLineId) => {
      const item = billableItems?.find(
        (i) => i.deliveryLineId === deliveryLineId
      );
      if (item && item.unitPrice) {
        const lineTotal = (item.unitPrice || 0) * (line.invoiceQty || 1);
        const discount = line.discountPercent
          ? lineTotal * (line.discountPercent / 100)
          : 0;
        subTotal += lineTotal - discount;
      }
    });

    const discountValue =
      discountPercent && parseFloat(discountPercent)
        ? subTotal * (parseFloat(discountPercent) / 100)
        : discountAmount && parseFloat(discountAmount)
        ? parseFloat(discountAmount)
        : 0;

    const totalAfterDiscount = subTotal - discountValue;
    const taxValue =
      taxRate && parseFloat(taxRate)
        ? totalAfterDiscount * parseFloat(taxRate)
        : 0;
    const grandTotal = totalAfterDiscount + taxValue;

    return {
      subTotal,
      discountValue,
      totalAfterDiscount,
      taxValue,
      grandTotal,
    };
  }, [selectedLines, billableItems, discountPercent, discountAmount, taxRate]);

  const handleSubmit = async () => {
    if (selectedLines.size === 0) {
      return;
    }

    const requestData: CreateInvoiceFromLinesRequest = {
      lines: Array.from(selectedLines.values()),
      discountPercent:
        discountPercent && parseFloat(discountPercent)
          ? parseFloat(discountPercent)
          : null,
      discountAmount:
        discountAmount && parseFloat(discountAmount)
          ? parseFloat(discountAmount)
          : null,
      discountReason: discountReason || null,
      taxRate: taxRate ? parseFloat(taxRate) : undefined,
      notes: notes || null,
      buyerName: buyerName || null,
      buyerCompanyName: buyerCompanyName || null,
      buyerTaxCode: buyerTaxCode || null,
      buyerAddress: buyerAddress || null,
      buyerEmail: buyerEmail || null,
    };

    try {
      await createInvoiceMutation.mutateAsync(requestData);
      handleOpenChange(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Tạo hóa đơn từ dòng hàng
          </DialogTitle>
          <DialogDescription>
            Chọn các dòng hàng có thể xuất hóa đơn và điền thông tin hóa đơn
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-2 gap-4">
          {/* Left: Billable Items List */}
          <div className="flex flex-col min-h-0">
            <div className="mb-2">
              <h3 className="text-sm font-semibold">
                Dòng hàng có thể xuất hóa đơn (
                {billableItems?.length || 0})
              </h3>
            </div>
            <ScrollArea className="flex-1 border rounded-lg p-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : !billableItems || billableItems.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Không có dòng hàng nào có thể xuất hóa đơn
                </div>
              ) : (
                <div className="space-y-2">
                  {billableItems.map((item) => {
                    const isSelected = selectedLines.has(
                      item.deliveryLineId || 0
                    );
                    const lineData = selectedLines.get(
                      item.deliveryLineId || 0
                    );

                    return (
                      <Card
                        key={item.deliveryLineId}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => toggleLine(item)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleLine(item)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <div className="font-medium text-sm">
                                  {item.designCode || item.designName || "—"}
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {item.orderCode}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Đơn giá: {formatCurrency(item.unitPrice || 0)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Đã xuất: {item.invoicedQty || 0} / Còn lại:{" "}
                                {item.remainingToInvoice || 0}
                              </div>
                              {isSelected && lineData && (
                                <div className="mt-2 space-y-1 pt-2 border-t">
                                  <div className="flex items-center gap-2">
                                    <Label className="text-xs w-16">
                                      Số lượng:
                                    </Label>
                                    <Input
                                      type="number"
                                      min={1}
                                      max={item.remainingToInvoice}
                                      value={lineData.invoiceQty}
                                      onChange={(e) =>
                                        updateLineQuantity(
                                          item.deliveryLineId || 0,
                                          parseInt(e.target.value) || 1
                                        )
                                      }
                                      onClick={(e) => e.stopPropagation()}
                                      className="h-7 text-xs"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Label className="text-xs w-16">
                                      Giảm giá (%):
                                    </Label>
                                    <Input
                                      type="number"
                                      min={0}
                                      max={100}
                                      value={
                                        lineData.discountPercent || ""
                                      }
                                      onChange={(e) =>
                                        updateLineDiscount(
                                          item.deliveryLineId || 0,
                                          e.target.value
                                            ? parseFloat(e.target.value)
                                            : null
                                        )
                                      }
                                      onClick={(e) => e.stopPropagation()}
                                      placeholder="0"
                                      className="h-7 text-xs"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Right: Invoice Details Form */}
          <div className="flex flex-col min-h-0">
            <ScrollArea className="flex-1">
              <div className="space-y-4 pr-4">
                {/* Buyer Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Thông tin người mua
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label>Tên công ty</Label>
                      <Input
                        value={buyerCompanyName}
                        onChange={(e) => setBuyerCompanyName(e.target.value)}
                        placeholder="Tên công ty"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tên người mua</Label>
                      <Input
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        placeholder="Tên người mua"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label>Mã số thuế</Label>
                        <Input
                          value={buyerTaxCode}
                          onChange={(e) => setBuyerTaxCode(e.target.value)}
                          placeholder="MST"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={buyerEmail}
                          onChange={(e) => setBuyerEmail(e.target.value)}
                          placeholder="email@example.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Địa chỉ</Label>
                      <Textarea
                        value={buyerAddress}
                        onChange={(e) => setBuyerAddress(e.target.value)}
                        placeholder="Địa chỉ"
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Discount & Tax */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Giảm giá & Thuế
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label>Giảm giá (%)</Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={discountPercent}
                          onChange={(e) => {
                            setDiscountPercent(e.target.value);
                            setDiscountAmount("");
                          }}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Giảm giá (VNĐ)</Label>
                        <Input
                          type="number"
                          min={0}
                          value={discountAmount}
                          onChange={(e) => {
                            setDiscountAmount(e.target.value);
                            setDiscountPercent("");
                          }}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Lý do giảm giá</Label>
                      <Input
                        value={discountReason}
                        onChange={(e) => setDiscountReason(e.target.value)}
                        placeholder="Lý do giảm giá"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Thuế suất (0-1)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={1}
                        step={0.01}
                        value={taxRate}
                        onChange={(e) => setTaxRate(e.target.value)}
                        placeholder="0.1"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Notes */}
                <div className="space-y-2">
                  <Label>Ghi chú</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ghi chú"
                    rows={3}
                  />
                </div>

                {/* Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Tổng kết</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Tổng tiền hàng:
                      </span>
                      <span className="font-medium">
                        {formatCurrency(totals.subTotal)}
                      </span>
                    </div>
                    {totals.discountValue > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Giảm giá:
                        </span>
                        <span className="font-medium text-red-600">
                          -{formatCurrency(totals.discountValue)}
                        </span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Tổng sau giảm:
                      </span>
                      <span className="font-medium">
                        {formatCurrency(totals.totalAfterDiscount)}
                      </span>
                    </div>
                    {totals.taxValue > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Thuế VAT:</span>
                        <span className="font-medium">
                          {formatCurrency(totals.taxValue)}
                        </span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-base font-bold">
                      <span>Tổng thanh toán:</span>
                      <span>{formatCurrency(totals.grandTotal)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </div>
        </div>

        <Separator />

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={createInvoiceMutation.isPending}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              createInvoiceMutation.isPending ||
              selectedLines.size === 0
            }
          >
            {createInvoiceMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang tạo...
              </>
            ) : (
              "Tạo hóa đơn"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

