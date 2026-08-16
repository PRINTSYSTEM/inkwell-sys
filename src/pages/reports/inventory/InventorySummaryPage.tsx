import { useState, useMemo } from "react";
import {
  Search,
  RefreshCw,
  Download,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Truck,
} from "lucide-react";
import { Helmet } from "react-helmet-async";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import {
  useInventorySummary,
  useExportInventorySummary,
  useExportInventorySummaryPDF,
} from "@/hooks/use-inventory-report";
import { formatCurrency } from "@/lib/status-utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { DateRangePicker } from "@/components/forms/DateRangePicker";
import { addDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import { useDebounce } from "use-debounce";

import { useAvailableOrdersForDelivery, useCreateDeliveryNote } from "@/hooks/use-delivery-note";
import { useCreateStockOutForDelivery } from "@/hooks/use-stock";
import { apiRequest } from "@/lib/http";
import { CreateDeliveryNoteDialog, getDefaultLineNote, SelectedOrderDetail } from "@/pages/delivery-notes/DeliveryNoteList";

export default function InventorySummaryPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const [hideEmpty, setHideEmpty] = useState<boolean>(true);
  const [sortColumn, setSortColumn] = useState<string>("ClosingQuantity");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  const renderSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-3.5 w-3.5 ml-1 text-slate-400 opacity-60 shrink-0 inline-block align-middle" />;
    }
    if (sortOrder === "asc") {
      return <ArrowUp className="h-3.5 w-3.5 ml-1 text-primary font-bold shrink-0 inline-block align-middle" />;
    }
    return <ArrowDown className="h-3.5 w-3.5 ml-1 text-primary font-bold shrink-0 inline-block align-middle" />;
  };

  const {
    data: summaryData,
    isLoading,
    isError,
    error,
    refetch,
  } = useInventorySummary({
    pageNumber: currentPage,
    pageSize: itemsPerPage,
    search: debouncedSearch || undefined,
    fromDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
    toDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
    itemType: "product",
    hideEmpty: hideEmpty || undefined,
    sortColumn: sortColumn || undefined,
    sortOrder: sortOrder || undefined,
  });

  const filteredItems = useMemo(() => {
    if (!summaryData?.items) return [];

    // Deduplicate items by itemCode / materialTypeCode to prevent backend SQL join duplicates
    const seenKeys = new Set<string>();
    const uniqueItems = summaryData.items.filter((item) => {
      const key = (item.itemCode || item.materialTypeCode || "").trim();
      if (!key) return true;
      if (seenKeys.has(key)) return false;
      seenKeys.add(key);
      return true;
    });

    if (!searchQuery.trim()) return uniqueItems;

    const q = searchQuery.toLowerCase().trim();
    return uniqueItems.filter((item) => {
      const code = (item.itemCode || item.materialTypeCode || "").toLowerCase();
      const name = (item.itemName || item.materialTypeName || "").toLowerCase();
      return code.includes(q) || name.includes(q);
    });
  }, [summaryData?.items, searchQuery]);

  const exportMutation = useExportInventorySummary();
  const exportPdfMutation = useExportInventorySummaryPDF();

  const handleExportExcel = async () => {
    exportMutation.mutate({
      search: searchQuery || undefined,
      fromDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
      toDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
      itemType: "product",
      hideEmpty: hideEmpty || undefined,
      sortColumn: sortColumn || undefined,
      sortOrder: sortOrder || undefined,
    });
  };

  const handleExportPdf = async () => {
    exportPdfMutation.mutate({
      fromDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
      toDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
      itemType: "product",
      hideEmpty: hideEmpty || undefined,
      sortColumn: sortColumn || undefined,
      sortOrder: sortOrder || undefined,
    });
  };

  // Delivery Note Dialog & Selection States
  const [selectedItemCodes, setSelectedItemCodes] = useState<Set<string>>(new Set());
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>("");

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deliveryQtys, setDeliveryQtys] = useState<Record<number, number>>({});
  const [lineNotes, setLineNotes] = useState<Record<number, string>>({});
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [selectedAddressIds, setSelectedAddressIds] = useState<Record<number, number | null>>({});
  const [deliveryNotes, setDeliveryNotes] = useState("");

  const createDeliveryNoteMutation = useCreateDeliveryNote();
  const { mutateAsync: createStockOutForDelivery } = useCreateStockOutForDelivery();

  const { data: allOrders } = useAvailableOrdersForDelivery();
  const availableOrdersRaw = useMemo(() => {
    if (!allOrders) return [];
    if (Array.isArray(allOrders)) return allOrders;
    if (typeof allOrders === "object" && "items" in (allOrders as any)) {
      return ((allOrders as any).items || []);
    }
    return [];
  }, [allOrders]);

  const getOrderDetailsForItem = (itemCode: string) => {
    const results: any[] = [];
    availableOrdersRaw.forEach((order: any) => {
      (order.details || []).forEach((detail: any) => {
        if (detail.designCode === itemCode) {
          results.push({
            ...detail,
            orderCode: order.orderCode,
            customerName: order.customerName,
            orderId: order.orderId,
            customerId: order.customerId,
            deliveryAddress: order.deliveryAddress,
          });
        }
      });
    });
    return results;
  };

  const selectedOrdersForDialog = useMemo(() => {
    const results: SelectedOrderDetail[] = [];
    selectedItemCodes.forEach((code) => {
      const invItem = summaryData?.items?.find(
        (item) => (item.itemCode || item.materialTypeCode) === code
      );
      const closingQty = invItem?.closingQuantity ?? 0;

      const details = getOrderDetailsForItem(code);
      details.forEach((det) => {
        results.push({
          ...det,
          maxDeliveryQty: closingQty,
        });
      });
    });
    return results;
  }, [selectedItemCodes, availableOrdersRaw, summaryData]);

  const handleToggleSelectItem = (itemCode: string) => {
    setSelectedItemCodes((prev) => {
      const next = new Set(prev);
      if (next.has(itemCode)) {
        next.delete(itemCode);
        if (next.size === 0) {
          setSelectedCustomerId(null);
          setSelectedCustomerName("");
        }
      } else {
        const details = getOrderDetailsForItem(itemCode);
        if (details.length === 0) {
          toast.error("Không tìm thấy thông tin đơn hàng/khách hàng cho sản phẩm này trong danh sách có thể giao!");
          return prev;
        }
        
        const firstDetail = details[0];
        const custId = firstDetail.customerId;
        const custName = firstDetail.customerName;
        
        if (selectedCustomerId !== null && selectedCustomerId !== custId) {
          toast.error("Chỉ được phép chọn các sản phẩm của cùng một khách hàng!");
          return prev;
        }
        
        next.add(itemCode);
        setSelectedCustomerId(custId);
        setSelectedCustomerName(custName);
      }
      return next;
    });
  };

  const isCheckboxDisabled = (itemCode: string) => {
    const details = getOrderDetailsForItem(itemCode);
    if (details.length === 0) return true;

    if (selectedCustomerId === null) {
      return false;
    }
    
    return details[0].customerId !== selectedCustomerId;
  };

  const getRemainingQty = (od: SelectedOrderDetail) => {
    return od.remainingToDeliver || 0;
  };

  const handleOpenCreateDialog = () => {
    if (selectedOrdersForDialog.length === 0) {
      toast.error("Vui lòng chọn ít nhất một sản phẩm.");
      return;
    }
    
    const qtys: Record<number, number> = {};
    const rNotes: Record<number, string> = {};
    selectedOrdersForDialog.forEach((od) => {
      if (od.orderDetailId != null) {
        const maxQty = (od as any).maxDeliveryQty !== undefined ? (od as any).maxDeliveryQty : Infinity;
        qtys[od.orderDetailId] = Math.min(od.remainingToDeliver || 0, maxQty);
        rNotes[od.orderDetailId] = getDefaultLineNote(od.designName);
      }
    });
    
    setDeliveryQtys(qtys);
    setLineNotes(rNotes);
    setSelectedAddressId(null);
    setSelectedAddressIds({});
    setDeliveryNotes("");
    setIsCreateDialogOpen(true);
  };

  const handleConfirmCreateDeliveryNote = async () => {
    const lines = selectedOrdersForDialog
      .map((od) => ({
        orderDetailId: od.orderDetailId!,
        deliveryQty: deliveryQtys[od.orderDetailId!] || 0,
        note: lineNotes[od.orderDetailId!] || "",
      }))
      .filter((l) => l.deliveryQty > 0);

    if (lines.length === 0) {
      toast.error("Vui lòng nhập số lượng giao");
      return;
    }

    const overStockLimit = selectedOrdersForDialog.filter((od) => {
      const qty = deliveryQtys[od.orderDetailId!] || 0;
      const closingQty = (od as any).maxDeliveryQty !== undefined ? (od as any).maxDeliveryQty : Infinity;
      return qty > closingQty;
    });
    if (overStockLimit.length > 0) {
      toast.error("Số lượng giao vượt quá số lượng tồn kho khả dụng.");
      return;
    }

    const overLimit = selectedOrdersForDialog.filter((od) => {
      const qty = deliveryQtys[od.orderDetailId!] || 0;
      return qty > (od.remainingToDeliver || 0);
    });
    if (overLimit.length > 0) {
      toast.error("Số lượng giao vượt quá số còn lại của đơn hàng. Vui lòng kiểm tra lại.");
      return;
    }

    try {
      const payload = {
        customerAddressId: selectedAddressId,
        notes: deliveryNotes || undefined,
        lines,
      };

      const res = await createDeliveryNoteMutation.mutateAsync(payload as any);

      if (res && res.id) {
        const validOrders = selectedOrdersForDialog.filter(
          (od) => od.orderDetailId && (deliveryQtys[od.orderDetailId] || 0) > 0
        );

        const ordersGrouped = validOrders.reduce((acc, od) => {
          if (!od.orderId) return acc;
          if (!acc[od.orderId]) acc[od.orderId] = [];
          acc[od.orderId].push(od);
          return acc;
        }, {} as Record<number, SelectedOrderDetail[]>);

        for (const [orderIdStr, ods] of Object.entries(ordersGrouped)) {
          const orderId = Number(orderIdStr);
          await createStockOutForDelivery({
            deliveryNoteId: res.id,
            customerId: ods[0].customerId || 0,
            orderId: orderId,
            itemType: "product",
            notes: "Xuất kho tự động khi tạo phiếu giao hàng",
            stockOutDate: new Date().toISOString(),
            items: ods.map((od) => ({
              itemName: od.designName || "Thành phẩm",
              itemCode: od.designCode || "SP",
              unit: "Cái",
              quantity: deliveryQtys[od.orderDetailId!] || 0,
              notes: lineNotes[od.orderDetailId!] || "",
              materialId: 0,
              orderDetailId: od.orderDetailId || 0,
            })),
          }).catch((err: any) => console.error("Lỗi xuất kho tự động:", err));
        }
      }

      setSelectedItemCodes(new Set());
      setSelectedCustomerId(null);
      setSelectedCustomerName("");
      setDeliveryQtys({});
      setLineNotes({});
      setSelectedAddressIds({});
      setSelectedAddressId(null);
      setDeliveryNotes("");
      setIsCreateDialogOpen(false);
      refetch();
      
      if (res && res.id) {
        try {
          await apiRequest.put(`/delivery-notes/${res.id}/status`, {
            status: "in_transit",
            cancelReason: null,
            failureReason: null,
            failureType: null,
            affectsDebt: false,
            notes: null,
          });
        } catch (statusErr) {
          console.error("Lỗi tự động cập nhật trạng thái Đang giao:", statusErr);
        }
        navigate(`/delivery-notes/${res.id}`);
      }
    } catch (error) {
      // Handled by hook
    }
  };

  const handleItemClick = (itemCode: string | null | undefined) => {
    if (itemCode) {
      navigate(`/reports/inventory/stock-card/${itemCode}?type=finished_product`);
    }
  };

  return (
    <>
      <Helmet>
        <title>Tồn kho thành phẩm | Print Production ERP</title>
        <meta
          name="description"
          content="Tồn kho thành phẩm theo nhóm vật tư"
        />
      </Helmet>

      <div className="pt-0 -mt-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Tồn kho thành phẩm
            </h1>
            <p className="text-muted-foreground">
              Tồn kho thành phẩm theo nhóm vật tư
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedItemCodes.size > 0 && (
              <Button
                onClick={handleOpenCreateDialog}
                className="gap-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Truck className="h-4 w-4" />
                Tạo phiếu giao hàng ({selectedItemCodes.size})
              </Button>
            )}
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportExcel}
              disabled={exportMutation.isPending}
            >
              {exportMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Xuất Excel
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportPdf}
              disabled={exportPdfMutation.isPending}
            >
              {exportPdfMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Xuất PDF
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Lỗi kết nối</AlertTitle>
            <AlertDescription>
              {error instanceof Error
                ? error.message
                : "Không thể tải dữ liệu. Vui lòng thử lại."}
            </AlertDescription>
          </Alert>
        )}


        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo mã hàng, tên hàng..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-10 sm:h-9 text-sm"
            />
          </div>
          <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm h-10 sm:h-9">
            <Checkbox
              id="hide-empty"
              checked={hideEmpty}
              onCheckedChange={(checked) => {
                setHideEmpty(!!checked);
                setCurrentPage(1);
              }}
            />
            <Label htmlFor="hide-empty" className="text-xs font-semibold cursor-pointer text-slate-700 select-none">
              Ẩn sản phẩm hết hàng (0 tồn)
            </Label>
          </div>
          <DateRangePicker value={dateRange} onValueChange={setDateRange} />
        </div>

        {/* Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[50px]"></TableHead>
                <TableHead 
                  className="w-[150px] cursor-pointer select-none hover:text-slate-800 transition-colors"
                  onClick={() => handleSort("ItemCode")}
                >
                  <div className="flex items-center gap-1">
                    Mã hàng {renderSortIcon("ItemCode")}
                  </div>
                </TableHead>
                <TableHead>Tên hàng</TableHead>
                <TableHead className="text-right">Đầu kỳ</TableHead>
                <TableHead className="text-right">Nhập</TableHead>
                <TableHead className="text-right">Xuất</TableHead>
                <TableHead 
                  className="w-[160px] text-right cursor-pointer select-none hover:text-slate-800 transition-colors"
                  onClick={() => handleSort("ClosingQuantity")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Cuối kỳ {renderSortIcon("ClosingQuantity")}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Không tìm thấy dữ liệu tổng hợp nào.
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => {
                  const itemCodeStr = item.itemCode || item.materialTypeCode || "";
                  const isDisabled = isCheckboxDisabled(itemCodeStr);
                  const isChecked = selectedItemCodes.has(itemCodeStr);

                  return (
                    <TableRow
                      key={item.itemCode || item.materialTypeCode || item.materialTypeId || item.categoryId}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleItemClick(item.itemCode || item.materialTypeCode)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {itemCodeStr && (
                          <Checkbox 
                            checked={isChecked}
                            onCheckedChange={() => handleToggleSelectItem(itemCodeStr)}
                            disabled={isDisabled}
                          />
                        )}
                      </TableCell>
                      <TableCell className="font-medium font-mono text-sm">
                        {item.itemCode || item.materialTypeCode || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-sm">
                            {item.itemName || item.materialTypeName || "—"}
                          </div>
                          {item.unit && (
                            <div className="text-xs text-muted-foreground">
                              ĐVT: {item.unit}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        <div>
                          {item.openingQuantity !== undefined
                            ? item.openingQuantity.toLocaleString("vi-VN")
                            : "—"}
                        </div>
                        <div className="text-xs text-muted-foreground font-normal">
                          {item.openingValue !== undefined
                            ? formatCurrency(item.openingValue)
                            : "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums text-green-600">
                        <div>
                          {item.inQuantity !== undefined
                            ? item.inQuantity.toLocaleString("vi-VN")
                            : "—"}
                        </div>
                        <div className="text-xs text-muted-foreground font-normal">
                          {item.inValue !== undefined
                            ? formatCurrency(item.inValue)
                            : "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums text-red-600">
                        <div>
                          {item.outQuantity !== undefined
                            ? item.outQuantity.toLocaleString("vi-VN")
                            : "—"}
                        </div>
                        <div className="text-xs text-muted-foreground font-normal">
                          {item.outValue !== undefined
                            ? formatCurrency(item.outValue)
                            : "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold tabular-nums">
                        <div>
                          {item.closingQuantity !== undefined
                            ? item.closingQuantity.toLocaleString("vi-VN")
                            : "—"}
                        </div>
                        <div className="text-xs text-muted-foreground font-normal">
                          {item.closingValue !== undefined
                            ? formatCurrency(item.closingValue)
                            : "—"}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {summaryData && summaryData.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Trang {currentPage} / {summaryData.totalPages} (
              {summaryData.total} nhóm)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium px-2">
                {currentPage} / {summaryData.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(summaryData.totalPages, p + 1))
                }
                disabled={currentPage === summaryData.totalPages || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Delivery Note Dialog */}
      <CreateDeliveryNoteDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        selectedOrders={selectedOrdersForDialog}
        deliveryQtys={deliveryQtys}
        setDeliveryQtys={setDeliveryQtys}
        lineNotes={lineNotes}
        setLineNotes={setLineNotes}
        selectedAddressId={selectedAddressId}
        setSelectedAddressId={setSelectedAddressId}
        selectedAddressIds={selectedAddressIds}
        setSelectedAddressIds={setSelectedAddressIds}
        customerId={selectedCustomerId}
        notes={deliveryNotes}
        setNotes={setDeliveryNotes}
        onCreate={handleConfirmCreateDeliveryNote}
        isPending={createDeliveryNoteMutation.isPending}
        onImageClick={() => {}}
      />
    </>
  );
}

