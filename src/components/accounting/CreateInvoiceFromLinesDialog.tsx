// src/components/accounting/CreateInvoiceFromLinesDialog.tsx
import { useState, useMemo, useEffect } from "react";
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
import { useCustomers } from "@/hooks/use-customer";
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
import { formatCurrency } from "@/lib/status-utils";
import type {
  BillableItemResponse,
  InvoiceLineInput,
  CreateInvoiceFromLinesRequest,
} from "@/Schema/invoice.schema";
import { Loader2, ShoppingCart, Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

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

  // Load customer data
  const { data: customersData } = useCustomers({ pageSize: 1000 });
  const customers = (customersData as any)?.items || [];

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [billToCustomerId, setBillToCustomerId] = useState<number | null>(customerId || null);

  const [selectedLines, setSelectedLines] = useState<
    Map<number, InvoiceLineInput>
  >(new Map());
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
      setSearchQuery("");
      setCustomerSearchOpen(false);
      setBillToCustomerId(customerId || null);
      setNotes("");
      setBuyerName("");
      setBuyerCompanyName("");
      setBuyerTaxCode("");
      setBuyerAddress("");
      setBuyerEmail("");
    }
    onOpenChange(open);
  };

  // Prefill when open and customerId prop is available
  useEffect(() => {
    if (open && customerId && customers.length > 0) {
      const cust = customers.find((c: any) => c.id === customerId);
      if (cust) {
        setBillToCustomerId(customerId);
        setBuyerCompanyName(cust.companyName || "");
        setBuyerName(cust.name || "");
        setBuyerTaxCode(cust.taxCode || "");
        setBuyerAddress(cust.address || "");
        setBuyerEmail(cust.email || "");
      }
    }
  }, [open, customerId, customers]);

  const handleSelectCustomer = (cust: any) => {
    if (cust.id !== billToCustomerId) {
      setSelectedLines(new Map());
    }
    setBillToCustomerId(cust.id);
    setBuyerCompanyName(cust.companyName || "");
    setBuyerName(cust.name || "");
    setBuyerTaxCode(cust.taxCode || "");
    setBuyerAddress(cust.address || "");
    setBuyerEmail(cust.email || "");
    setCustomerSearchOpen(false);
  };

  const toggleLine = (item: BillableItemResponse) => {
    if (!item.deliveryLineId) return;

    const newSelected = new Map(selectedLines);
    if (newSelected.has(item.deliveryLineId)) {
      newSelected.delete(item.deliveryLineId);
      // Clear customer selection if no items are selected anymore
      if (newSelected.size === 0) {
        setBillToCustomerId(null);
        setBuyerCompanyName("");
        setBuyerName("");
        setBuyerTaxCode("");
        setBuyerAddress("");
        setBuyerEmail("");
      }
    } else {
      // If no customer selected yet, auto-select this item's customer
      if (!billToCustomerId && item.customerId) {
        const cust = customers.find((c: any) => c.id === item.customerId);
        if (cust) {
          setBillToCustomerId(item.customerId);
          setBuyerCompanyName(cust.companyName || "");
          setBuyerName(cust.name || "");
          setBuyerTaxCode(cust.taxCode || "");
          setBuyerAddress(cust.address || "");
          setBuyerEmail(cust.email || "");
        }
      }

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

  // Filter billable items
  const filteredItems = useMemo(() => {
    if (!billableItems) return [];
    
    let items = billableItems;
    // Auto-filter by selected customer
    if (billToCustomerId) {
      items = items.filter((item) => item.customerId === billToCustomerId);
    }
    
    const query = searchQuery.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => {
      return (
        (item.customerName || "").toLowerCase().includes(query) ||
        (item.designName || "").toLowerCase().includes(query) ||
        (item.designCode || "").toLowerCase().includes(query) ||
        (item.orderCode || "").toLowerCase().includes(query)
      );
    });
  }, [billableItems, billToCustomerId, searchQuery]);

  // Calculate totals
  const totals = useMemo(() => {
    let subTotal = 0;

    selectedLines.forEach((line, deliveryLineId) => {
      const item = billableItems?.find(
        (i) => i.deliveryLineId === deliveryLineId
      );
      if (item && item.unitPrice) {
        const lineTotal = (item.unitPrice || 0) * (line.invoiceQty || 1);
        subTotal += lineTotal;
      }
    });

    return {
      subTotal,
    };
  }, [selectedLines, billableItems]);

  const handleSubmit = async () => {
    if (selectedLines.size === 0) {
      return;
    }

    const requestData: CreateInvoiceFromLinesRequest = {
      lines: Array.from(selectedLines.values()),
      billToCustomerId: billToCustomerId || null,
      discountPercent: null,
      discountAmount: null,
      discountReason: null,
      taxRate: undefined,
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
            <div className="mb-2 space-y-2">
              <h3 className="text-sm font-semibold">
                Dòng hàng có thể xuất hóa đơn ({filteredItems.length})
              </h3>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo khách hàng, sản phẩm, mã đơn..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs rounded-lg bg-white"
                />
              </div>
            </div>
            <ScrollArea className="flex-1 border rounded-lg p-2 bg-slate-50/30">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  {billToCustomerId 
                    ? "Không có dòng hàng nào cho khách hàng này." 
                    : "Không có dòng hàng nào có thể xuất hóa đơn."}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredItems.map((item) => {
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
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => toggleLine(item)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2.5">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleLine(item)}
                              onClick={(e) => e.stopPropagation()}
                              className="mt-1"
                            />
                            <div className="flex-1 space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="font-bold text-sm text-foreground leading-snug">
                                  {item.designName || item.designCode || "—"}
                                </div>
                                <Badge variant="secondary" className="text-[10px] font-bold shrink-0">
                                  {item.orderCode}
                                </Badge>
                              </div>
                              
                              {item.customerName && (
                                <div className="text-xs text-blue-600 font-semibold uppercase tracking-tight">
                                  Khách: {item.customerName}
                                </div>
                              )}
                              
                              <div className="grid grid-cols-2 gap-1 text-[11px] text-muted-foreground pt-1 border-t border-dashed mt-1.5">
                                <div>Đơn giá: <span className="font-semibold text-foreground">{formatCurrency(item.unitPrice || 0)}</span></div>
                                <div>Còn lại: <span className="font-semibold text-foreground">{item.remainingToInvoice || 0} {item.unit || "Tờ"}</span></div>
                              </div>
                              
                              {isSelected && lineData && (
                                <div className="mt-2 pt-2 border-t flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                  <Label className="text-xs shrink-0 text-muted-foreground">Số lượng HĐ:</Label>
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
                                    className="h-7 text-xs font-bold w-24 text-right bg-white"
                                  />
                                  <span className="text-xs text-muted-foreground">{item.unit || "Tờ"}</span>
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
            <ScrollArea className="flex-1 border rounded-lg p-3 bg-slate-50/20">
              <div className="space-y-3 pr-1">
                {/* Customer Select & Buyer Info */}
                <div className="space-y-2.5">
                  {/* Customer Selector */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-slate-700">Khách hàng xuất hóa đơn <span className="text-red-500">*</span></Label>
                      {billToCustomerId && (
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto p-0 text-[11px] text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            setBillToCustomerId(null);
                            setSelectedLines(new Map());
                            setBuyerCompanyName("");
                            setBuyerName("");
                            setBuyerTaxCode("");
                            setBuyerAddress("");
                            setBuyerEmail("");
                          }}
                        >
                          Xóa chọn
                        </Button>
                      )}
                    </div>
                    <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          aria-expanded={customerSearchOpen}
                          className="h-9 w-full justify-between text-xs font-normal border-slate-200 hover:bg-slate-50 cursor-pointer bg-white"
                        >
                          <span className="truncate">
                            {billToCustomerId 
                              ? customers.find((c: any) => c.id === billToCustomerId)?.companyName || 
                                customers.find((c: any) => c.id === billToCustomerId)?.name || 
                                "Khách hàng đã chọn"
                              : "Nhấn để chọn khách hàng..."}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-slate-500" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[450px] p-0" align="start">
                        <Command className="w-full">
                          <CommandInput placeholder="Tìm khách hàng..." className="h-9" />
                          <CommandList className="max-h-[220px]">
                            <CommandEmpty>Không tìm thấy khách hàng.</CommandEmpty>
                            <CommandGroup>
                              {customers.map((c: any) => {
                                const isSelected = billToCustomerId === c.id;
                                const displayName = c.companyName 
                                  ? `${c.companyName} (${c.name || ""})` 
                                  : c.name || "";
                                return (
                                  <CommandItem
                                    key={c.id}
                                    value={displayName}
                                    onSelect={() => handleSelectCustomer(c)}
                                    className="text-xs cursor-pointer py-2"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4 text-primary",
                                        isSelected ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div className="flex flex-col">
                                      <span className="font-semibold text-slate-700">{c.companyName || c.name}</span>
                                      <span className="text-[10px] text-muted-foreground">
                                        MST: {c.taxCode || "N/A"} - Điện thoại: {c.phone || "N/A"}
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

                  {/* Auto-loaded / Editable Buyer Fields */}
                  <div className="space-y-2 border-t pt-2.5 mt-2">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground font-medium">Tên đơn vị mua hàng</Label>
                      <Input
                        value={buyerCompanyName}
                        onChange={(e) => setBuyerCompanyName(e.target.value)}
                        placeholder="Tên công ty xuất hóa đơn..."
                        className="h-8 text-xs font-semibold bg-white"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground font-medium">Họ tên người mua</Label>
                      <Input
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        placeholder="Tên người mua..."
                        className="h-8 text-xs bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground font-medium">Mã số thuế</Label>
                        <Input
                          value={buyerTaxCode}
                          onChange={(e) => setBuyerTaxCode(e.target.value)}
                          placeholder="MST..."
                          className="h-8 text-xs font-mono bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground font-medium">Email nhận hóa đơn</Label>
                        <Input
                          type="email"
                          value={buyerEmail}
                          onChange={(e) => setBuyerEmail(e.target.value)}
                          placeholder="email@..."
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground font-medium">Địa chỉ xuất hóa đơn</Label>
                      <Textarea
                        value={buyerAddress}
                        onChange={(e) => setBuyerAddress(e.target.value)}
                        placeholder="Địa chỉ công ty..."
                        className="text-xs p-2 min-h-[50px] resize-none bg-white"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1 border-t pt-2 mt-2">
                  <Label className="text-[11px] font-bold text-slate-700">Ghi chú hóa đơn</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Nhập ghi chú xuất hóa đơn nếu có..."
                    className="text-xs p-2 min-h-[50px] resize-none bg-white"
                    rows={2}
                  />
                </div>

                {/* Summary Card */}
                <Card className="shadow-sm bg-slate-50 border-slate-200 mt-2">
                  <CardHeader className="py-2 px-3 border-b bg-slate-100/50">
                    <CardTitle className="text-[11px] font-bold uppercase text-slate-700">Tổng kết thông tin</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Số dòng hàng đã chọn:</span>
                      <span className="font-bold text-slate-800">{selectedLines.size} dòng</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tổng số lượng sản phẩm:</span>
                      <span className="font-bold text-slate-800">
                        {Array.from(selectedLines.values())
                          .reduce((sum, line) => sum + (line.invoiceQty || 0), 0)
                          .toLocaleString()}{" "}
                        SP
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm font-bold text-blue-600">
                      <span>Tổng tiền thanh toán:</span>
                      <span>{formatCurrency(totals.subTotal)}</span>
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
