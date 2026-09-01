// src/components/accounting/CreateInvoiceFromLinesDialog.tsx
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/forms/DateRangePicker";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/status-utils";
import type {
  BillableItemResponse,
  InvoiceLineInput,
  CreateInvoiceFromLinesRequest,
} from "@/Schema/invoice.schema";
import { Loader2, ShoppingCart, Check, ChevronsUpDown, Search, X, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateInvoiceFromLinesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId?: number;
  onInvoiceCreated?: (invoiceId: number) => void;
}

export function CreateInvoiceFromLinesDialog({
  open,
  onOpenChange,
  customerId,
  onInvoiceCreated,
}: CreateInvoiceFromLinesDialogProps) {
  const navigate = useNavigate();
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

  // Filtering states
  const [filterType, setFilterType] = useState<"all" | "month" | "range">("month");
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(undefined);

  // Generate month options back to Jan 2025
  const monthOptions = useMemo(() => {
    const options = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const startYear = 2025;
    const startMonth = 1;

    let y = currentYear;
    let m = currentMonth;

    while (y > startYear || (y === startYear && m >= startMonth)) {
      const value = `${y}-${String(m).padStart(2, "0")}`;
      const label = `Tháng ${m}/${y}`;
      options.push({ value, label });

      m--;
      if (m === 0) {
        m = 12;
        y--;
      }
    }
    return options;
  }, []);

  const handleFilterTypeChange = (type: "all" | "month" | "range") => {
    setFilterType(type);
    if (type === "month" && monthOptions.length > 0 && !selectedMonth) {
      setSelectedMonth(monthOptions[0].value);
    }
  };

  useEffect(() => {
    if (filterType === "month" && monthOptions.length > 0 && !selectedMonth) {
      setSelectedMonth(monthOptions[0].value);
    }
  }, [monthOptions, filterType, selectedMonth]);

  // Compute fromDate / toDate for API
  const apiDateParams = useMemo(() => {
    if (filterType === "month" && selectedMonth) {
      const [year, month] = selectedMonth.split("-");
      const fromDate = `${year}-${month}-01`;
      const lastDay = new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();
      const toDate = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;
      return { fromDate, toDate };
    }

    if (filterType === "range" && selectedDateRange?.from) {
      const formatLocalISO = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      };
      const fromDate = formatLocalISO(selectedDateRange.from);
      const toDate = selectedDateRange.to ? formatLocalISO(selectedDateRange.to) : fromDate;
      return { fromDate, toDate };
    }

    return { fromDate: undefined, toDate: undefined };
  }, [filterType, selectedMonth, selectedDateRange]);

  // Use local selection billToCustomerId if available, otherwise fall back to customerId prop
  const { data: billableItems, isLoading, refetch } = useBillableItems(
    {
      customerId: billToCustomerId || customerId || undefined,
      fromDate: apiDateParams.fromDate,
      toDate: apiDateParams.toDate,
      sortColumn: "DeliveredAt",
      sortOrder: "desc",
      SortColumn: "DeliveredAt",
      SortOrder: "desc",
    }
  );

  // Refetch billable items when dialog opens & when customer or date-filters change
  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch, billToCustomerId, apiDateParams.fromDate, apiDateParams.toDate]);

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

      // Reset filter states
      setFilterType("month");
      const d = new Date();
      setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
      setSelectedDateRange(undefined);
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
    setBillToCustomerId(cust.id);
    setBuyerCompanyName(cust.companyName || "");
    setBuyerName(cust.name || "");
    setBuyerTaxCode(cust.taxCode || "");
    setBuyerAddress(cust.address || "");
    setBuyerEmail(cust.email || "");
    setCustomerSearchOpen(false);
  };

  const convertMmToCmDimensions = (dims: string | null | undefined): string => {
    if (!dims) return "";
    const clean = dims.replace(/^\(|\)$/g, "").trim();
    if (!clean) return "";

    const lowerClean = clean.toLowerCase();
    const hasCm = lowerClean.includes("cm");
    const hasDecimals = clean.split(/[xX*]/).some(part => part.includes("."));

    if (hasCm || hasDecimals) {
      const cleanNoCm = clean.replace(/cm/gi, "").trim();
      return `(${cleanNoCm}cm)`;
    }

    const parts = clean.split(/[xX*]/);
    const convertedParts = parts.map(part => {
      const trimmed = part.trim();
      const num = parseFloat(trimmed);
      if (!isNaN(num)) {
        return (num / 10).toString().replace(/\.0$/, "");
      }
      return trimmed;
    });

    return `(${convertedParts.join("x")}cm)`;
  };

  const getFormattedItemName = (item: BillableItemResponse) => {
    const name = item.designName || "";
    const code = item.designCode || "";
    const dimensions = (item as any).dimensions;

    let sizeStr = "";
    if (dimensions) {
      sizeStr = convertMmToCmDimensions(dimensions);
    }

    if (!name) {
      return item.designCode || "—";
    }

    if (code) {
      const escCode = code.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      const codeRegex = new RegExp(`\\s*\\(${escCode}\\)`);
      if (sizeStr) {
        if (codeRegex.test(name)) {
          return name.replace(codeRegex, ` ${sizeStr} (${code})`);
        }
        return `${name} ${sizeStr} (${code})`;
      }
      if (codeRegex.test(name)) {
        return name;
      }
      return `${name} (${code})`;
    }

    if (sizeStr) {
      return `${name} ${sizeStr}`;
    }
    return name;
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

    // Calculate unique customer IDs from currently selected items
    const uniqueCustomerIds = new Set<number>();
    newSelected.forEach((line, deliveryLineId) => {
      const bItem = billableItems?.find(
        (i) => i.deliveryLineId === deliveryLineId
      );
      if (bItem && bItem.customerId) {
        uniqueCustomerIds.add(bItem.customerId);
      }
    });

    if (uniqueCustomerIds.size === 1) {
      const singleCustId = Array.from(uniqueCustomerIds)[0];
      const cust = customers.find((c: any) => c.id === singleCustId);
      if (cust) {
        setBillToCustomerId(singleCustId);
        setBuyerCompanyName(cust.companyName || "");
        setBuyerName(cust.name || "");
        setBuyerTaxCode(cust.taxCode || "");
        setBuyerAddress(cust.address || "");
        setBuyerEmail(cust.email || "");
      }
    } else {
      // 0 or more than 1 customers selected -> do not map anything automatically
      setBillToCustomerId(null);
      setBuyerCompanyName("");
      setBuyerName("");
      setBuyerTaxCode("");
      setBuyerAddress("");
      setBuyerEmail("");
    }
  };


  // Filter billable items
  const filteredItems = useMemo(() => {
    if (!billableItems) return [];

    const sorted = [...billableItems].sort((a, b) => {
      const dateA = a.deliveredAt ? new Date(a.deliveredAt).getTime() : 0;
      const dateB = b.deliveredAt ? new Date(b.deliveredAt).getTime() : 0;
      return dateB - dateA;
    });

    const query = searchQuery.trim().toLowerCase();
    if (!query) return sorted;
    return sorted.filter((item) => {
      return (
        (item.customerName || "").toLowerCase().includes(query) ||
        (item.designName || "").toLowerCase().includes(query) ||
        (item.designCode || "").toLowerCase().includes(query) ||
        (item.orderCode || "").toLowerCase().includes(query) ||
        (item.deliveryNoteCode || "").toLowerCase().includes(query)
      );
    });
  }, [billableItems, searchQuery]);

  // Check if all filtered items are selected
  const isAllFilteredSelected = useMemo(() => {
    if (filteredItems.length === 0) return false;
    return filteredItems.every((item) => item.deliveryLineId && selectedLines.has(item.deliveryLineId));
  }, [filteredItems, selectedLines]);

  // Select/Deselect all filtered items
  const handleToggleSelectAll = () => {
    const newSelected = new Map(selectedLines);
    if (isAllFilteredSelected) {
      // Remove all filtered items
      filteredItems.forEach((item) => {
        if (item.deliveryLineId) {
          newSelected.delete(item.deliveryLineId);
        }
      });
    } else {
      // Add all filtered items
      filteredItems.forEach((item) => {
        if (item.deliveryLineId) {
          newSelected.set(item.deliveryLineId, {
            deliveryLineId: item.deliveryLineId,
            invoiceQty: item.remainingToInvoice || 1,
            discountPercent: null,
          });
        }
      });
    }
    setSelectedLines(newSelected);

    // Re-calculate customer mapping if needed
    const uniqueCustomerIds = new Set<number>();
    newSelected.forEach((line, deliveryLineId) => {
      const bItem = billableItems?.find(
        (i) => i.deliveryLineId === deliveryLineId
      );
      if (bItem && bItem.customerId) {
        uniqueCustomerIds.add(bItem.customerId);
      }
    });

    if (uniqueCustomerIds.size === 1) {
      const singleCustId = Array.from(uniqueCustomerIds)[0];
      const cust = customers.find((c: any) => c.id === singleCustId);
      if (cust) {
        setBillToCustomerId(singleCustId);
        setBuyerCompanyName(cust.companyName || "");
        setBuyerName(cust.name || "");
        setBuyerTaxCode(cust.taxCode || "");
        setBuyerAddress(cust.address || "");
        setBuyerEmail(cust.email || "");
      }
    } else {
      setBillToCustomerId(null);
      setBuyerCompanyName("");
      setBuyerName("");
      setBuyerTaxCode("");
      setBuyerAddress("");
      setBuyerEmail("");
    }
  };



  // Calculate totals
  const totals = useMemo(() => {
    let subTotal = 0;

    selectedLines.forEach((line, deliveryLineId) => {
      const item = billableItems?.find(
        (i) => i.deliveryLineId === deliveryLineId
      );
      if (item && item.unitPrice) {
        const linePrice = item.unitPrice || 0;
        const lineQty = line.invoiceQty || 0;
        let lineTotal = linePrice * lineQty;
        if (line.discountPercent != null && line.discountPercent > 0) {
          lineTotal = lineTotal * (1 - line.discountPercent / 100);
        }
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
      taxRate: 0.08,
      notes: notes || null,
      buyerName: buyerName || null,
      buyerCompanyName: buyerCompanyName || null,
      buyerTaxCode: buyerTaxCode || null,
      buyerAddress: buyerAddress || null,
      buyerEmail: buyerEmail || null,
      issuedAt: new Date().toISOString(),
    };

    try {
      const result = await createInvoiceMutation.mutateAsync(requestData);
      handleOpenChange(false);
      if (result && result.id) {
        if (onInvoiceCreated) {
          onInvoiceCreated(result.id);
        }
      }
    } catch (error) {
      // Error is handled by the hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-6xl h-[88vh] p-0 overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="px-5 py-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ShoppingCart className="w-5 h-5" />
            Tạo hóa đơn
          </DialogTitle>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 min-h-0 grid grid-cols-[1.05fr_0.95fr]">
          {/* LEFT */}
          <div className="min-h-0 flex flex-col border-r bg-muted/20">
            <div className="p-4 border-b bg-background">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="text-sm font-semibold">
                  Dòng hàng có thể xuất HĐ
                  <span className="ml-1 text-muted-foreground">
                    ({filteredItems.length})
                  </span>
                </h3>

                <div className="flex items-center gap-2">
                  {filteredItems.length > 0 && (
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0 text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                      onClick={handleToggleSelectAll}
                    >
                      {isAllFilteredSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                    </Button>
                  )}
                  <Badge
                    variant={selectedLines.size > 0 ? "default" : "outline"}
                    className={cn(
                      "text-xs transition-colors",
                      selectedLines.size > 0 && "bg-blue-600 hover:bg-blue-600 text-white font-bold"
                    )}
                  >
                    Đã chọn: {selectedLines.size}
                  </Badge>
                </div>
              </div>

              <div className="relative mb-2.5">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Tìm khách hàng, sản phẩm, mã đơn, mã phiếu (PGH)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-sm bg-white"
                />
              </div>

              <div className="mt-2.5 p-2.5 bg-slate-50 rounded-lg border border-slate-200/60 flex items-center gap-3">
                <div className="flex-1 min-w-[125px] space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Lọc ngày giao</span>
                  <Select value={filterType} onValueChange={(val: any) => handleFilterTypeChange(val)}>
                    <SelectTrigger className="h-8 text-xs bg-white border-slate-200 shadow-xs focus:ring-0">
                      <SelectValue placeholder="Kiểu lọc" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">Tất cả thời gian</SelectItem>
                      <SelectItem value="month" className="text-xs">Theo tháng</SelectItem>
                      <SelectItem value="range" className="text-xs">Khoảng ngày</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {filterType === "month" && (
                  <div className="flex-1 min-w-[125px] space-y-1 animate-in fade-in duration-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Chọn tháng</span>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger className="h-8 text-xs bg-white border-slate-200 shadow-xs focus:ring-0">
                        <SelectValue placeholder="Chọn tháng..." />
                      </SelectTrigger>
                      <SelectContent>
                        {monthOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="text-xs">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {filterType === "range" && (
                  <div className="flex-1 min-w-[180px] space-y-1 animate-in fade-in duration-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Khoảng ngày</span>
                    <DateRangePicker
                      value={selectedDateRange}
                      onValueChange={setSelectedDateRange}
                      className="h-8 text-xs w-full bg-white border border-slate-200 shadow-xs hover:bg-slate-50 focus:ring-0"
                      numberOfMonths={1}
                      showPresets={false}
                    />
                  </div>
                )}
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="text-center py-10 text-sm text-muted-foreground">
                    {billToCustomerId
                      ? "Không có dòng hàng nào cho khách hàng này."
                      : "Không có dòng hàng nào có thể xuất hóa đơn."}
                  </div>
                ) : (
                  filteredItems.map((item) => {
                    const lineId = item.deliveryLineId || 0;
                    const isSelected = selectedLines.has(lineId);

                    return (
                      <button
                        key={item.deliveryLineId}
                        type="button"
                        onClick={() => toggleLine(item)}
                        className={cn(
                          "w-full text-left rounded-lg border bg-background p-3 transition-all border-l-4 border-l-transparent",
                          "hover:border-primary/50 hover:bg-primary/5",
                          isSelected && "border-primary border-l-blue-600 bg-blue-50/20 shadow-sm"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleLine(item)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-0.5"
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="font-semibold text-sm leading-snug line-clamp-2">
                                  {getFormattedItemName(item)}
                                </div>

                                {item.customerName && (
                                  <div className="mt-0.5 text-xs font-medium text-blue-600 truncate">
                                    {item.customerName}
                                  </div>
                                )}

                                {item.deliveredAt && (
                                  <div className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-semibold border border-amber-200/50">
                                    <Calendar className="w-3 h-3 text-amber-600 shrink-0" />
                                    <span>Ngày giao: {format(new Date(item.deliveredAt), "dd/MM/yyyy")}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col items-end gap-1 shrink-0">
                                {item.deliveryNoteCode && (
                                  <Badge
                                    variant="outline"
                                    className="shrink-0 text-[10px] font-bold bg-emerald-50 text-emerald-700 border-emerald-300"
                                  >
                                    {item.deliveryNoteCode}
                                  </Badge>
                                )}
                                {item.orderCode && (
                                  <Badge
                                    variant="secondary"
                                    className="shrink-0 text-[10px] font-semibold"
                                  >
                                    {item.orderCode}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <div className="text-muted-foreground">Đơn giá</div>
                                <div className="font-semibold tabular-nums">
                                  {formatCurrency(item.unitPrice || 0)}
                                </div>
                              </div>

                              <div>
                                <div className="text-muted-foreground">SL</div>
                                <div className="font-semibold tabular-nums">
                                  {item.remainingToInvoice || 0}{" "}
                                  {(item.unit as string | undefined) || "Tờ"}
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-muted-foreground">Thành tiền</div>
                                <div className="font-bold tabular-nums">
                                  {formatCurrency(
                                    (item.unitPrice || 0) *
                                    (item.remainingToInvoice || 0)
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
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
                  <div className="space-y-2.5 border-t pt-3 mt-3 bg-slate-50/50 p-2.5 rounded-lg border border-slate-200/60">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-700">Tên đơn vị mua hàng</Label>
                      <Input
                        value={buyerCompanyName}
                        onChange={(e) => setBuyerCompanyName(e.target.value)}
                        placeholder="Tên công ty xuất hóa đơn..."
                        className="h-8 text-xs font-semibold bg-white border-slate-200"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-700">Họ tên người mua</Label>
                      <Input
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        placeholder="Tên người mua..."
                        className="h-8 text-xs bg-white border-slate-200"
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
                      <span className="text-muted-foreground">Số lượng mã hàng:</span>
                      <span className="font-bold text-slate-800">{selectedLines.size} mã</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Thành tiền:</span>
                      <span className="font-bold text-slate-800">{formatCurrency(totals.subTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">VAT (8%):</span>
                      <span className="font-bold text-slate-800">{formatCurrency(totals.subTotal * 0.08)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm font-bold text-blue-600">
                      <span>Tổng cộng:</span>
                      <span>{formatCurrency(totals.subTotal * 1.08)}</span>
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
            ) : selectedLines.size > 0 ? (
              `Tạo hóa đơn (${selectedLines.size} dòng)`
            ) : (
              "Tạo hóa đơn"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
