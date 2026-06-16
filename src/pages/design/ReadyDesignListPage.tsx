import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronsUpDown, Loader2, Package, Search, Plus, Trash2, Calendar, FileText, User, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { TableSkeleton } from "@/components/ui/skeleton-components";
import { ImageViewerDialog } from "@/components/design/image-viewer-dialog";
import {
  useReadyDesigns,
  useCustomers,
  useCustomerAddresses,
  useCustomer,
  useCreateCustomerAddress,
  useCreateOrderFromReadyDesigns,
  useDesign,
} from "@/hooks";
import type { ReadyDesignResponse } from "@/Schema";

// Component to fetch and render image thumbnail for each ready design
function DesignImageThumbnail({ designId }: { designId: number }) {
  const { data: design, isLoading } = useDesign(designId, !!designId);
  const [hasError, setHasError] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  if (isLoading) {
    return <div className="w-10 h-10 rounded-lg bg-muted animate-pulse border border-border/40" />;
  }

  if (design?.designImageUrl && !hasError) {
    return (
      <>
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsPreviewOpen(true);
          }}
          className="relative group w-10 h-10 rounded-lg overflow-hidden border border-border/80 shadow-sm transition-all hover:scale-110 hover:shadow-md cursor-zoom-in bg-white dark:bg-zinc-900 flex items-center justify-center"
        >
          <img
            src={design.designImageUrl}
            alt={design.designName || ""}
            className="w-full h-full object-cover"
            onError={() => setHasError(true)}
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Search className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        <ImageViewerDialog
          open={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
          imageUrl={design.designImageUrl}
          title={design.designName || ""}
        />
      </>
    );
  }

  return (
    <div className="w-10 h-10 rounded-lg bg-muted/60 flex items-center justify-center border border-border/40">
      <ImageIcon className="w-4 h-4 text-muted-foreground/50" />
    </div>
  );
}

export default function ReadyDesignListPage() {
  const navigate = useNavigate();

  // Filter & Search states
  const [customerSearch, setCustomerSearch] = useState("");
  const [debouncedCustomerSearch] = useDebounce(customerSearch, 300);
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: number; name: string } | null>(null);
  const [customerComboOpen, setCustomerComboOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Selected designs
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Order dialog state
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [notes, setNotes] = useState("");

  // Fetch customers
  const { data: customersData, isLoading: loadingCustomers } = useCustomers({
    pageNumber: 1,
    pageSize: 50,
    search: debouncedCustomerSearch || undefined,
  });
  const customers = customersData?.items || [];

  // Fetch ready designs
  const readyDesignsParams = useMemo(() => {
    return {
      pageNumber: currentPage,
      pageSize: itemsPerPage,
      customerId: selectedCustomer?.id || undefined,
      search: debouncedSearchQuery.trim() || undefined,
    };
  }, [currentPage, selectedCustomer, debouncedSearchQuery]);

  const { data: readyDesignsData, isLoading: loadingDesigns, refetch: refetchDesigns } = useReadyDesigns(
    readyDesignsParams
  );
  const designs = readyDesignsData?.items || [];
  const totalCount = readyDesignsData?.total || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;


  // Fetch customer addresses for the selected design's customer
  const targetCustomerIdForAddresses = useMemo(() => {
    if (selectedIds.length === 0) return null;
    const firstSelected = designs.find((d) => d.id === selectedIds[0]);
    return firstSelected?.customerId || null;
  }, [selectedIds, designs]);

  const { data: addresses = [], isLoading: loadingAddresses } = useCustomerAddresses(
    targetCustomerIdForAddresses,
    !!targetCustomerIdForAddresses
  );

  const { data: customerDetail } = useCustomer(
    targetCustomerIdForAddresses,
    !!targetCustomerIdForAddresses
  );

  const createAddressMutation = useCreateCustomerAddress(
    targetCustomerIdForAddresses || 0
  );

  const handleCreateAddressFromProfile = async () => {
    if (!targetCustomerIdForAddresses || !customerDetail?.address) return;
    try {
      await createAddressMutation.mutateAsync({
        label: "Địa chỉ hồ sơ",
        address: customerDetail.address,
        isDefault: true,
        recipientName: customerDetail.representativeName || customerDetail.name || "Khách hàng",
        recipientPhone: customerDetail.phone || undefined,
      });
    } catch (err) {
      // Error handled by mutation hook toast
    }
  };

  // Order Creation Mutation
  const { mutate: createOrderFromReadyDesigns, loading: isCreatingOrder } =
    useCreateOrderFromReadyDesigns();

  // Reset selected checkboxes if the page or customer filter changes
  useEffect(() => {
    setSelectedIds([]);
  }, [currentPage, selectedCustomer]);

  // Determine if a row should be disabled for selection
  // Rules: Only allow selecting designs from the SAME customer
  const currentCustomerId = useMemo(() => {
    if (selectedIds.length === 0) return null;
    const firstSelected = designs.find((d) => d.id === selectedIds[0]);
    return firstSelected?.customerId || null;
  }, [selectedIds, designs]);

  const isRowSelectionDisabled = (design: ReadyDesignResponse) => {
    if (currentCustomerId === null) return false;
    return design.customerId !== currentCustomerId;
  };

  const handleSelectRow = (id: number, design: ReadyDesignResponse) => {
    if (isRowSelectionDisabled(design)) {
      toast.error("Chỉ được phép chọn thiết kế của cùng một khách hàng trong một đơn hàng.");
      return;
    }

    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (!checked) {
      setSelectedIds([]);
      return;
    }

    // Select all items belonging to the same customer as the first item
    if (designs.length === 0) return;

    // Use the first item's customerId as the rule
    const targetCustId = designs[0].customerId;
    const validIdsOnPage = designs
      .filter((d) => d.customerId === targetCustId && d.id !== undefined)
      .map((d) => d.id as number);

    setSelectedIds(validIdsOnPage);
  };

  const isAllSelected = useMemo(() => {
    if (designs.length === 0) return false;
    const targetCustId = currentCustomerId || designs[0].customerId;
    const validPageIds = designs
      .filter((d) => d.customerId === targetCustId && d.id !== undefined)
      .map((d) => d.id as number);
    
    return validPageIds.length > 0 && validPageIds.every((id) => selectedIds.includes(id));
  }, [designs, selectedIds, currentCustomerId]);

  const selectedDesignsDetails = useMemo(() => {
    return designs.filter((d) => d.id !== undefined && selectedIds.includes(d.id));
  }, [designs, selectedIds]);

  const handleOpenOrderDialog = () => {
    if (selectedIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một thiết kế");
      return;
    }
    // Set default values
    setDeliveryDate("");
    setSelectedAddressId("");
    setNotes("");

    // Try to auto-select default address if available
    const defaultAddr = addresses.find((a) => a.isDefault);
    if (defaultAddr?.id) {
      setSelectedAddressId(defaultAddr.id.toString());
    } else if (addresses.length > 0 && addresses[0].id) {
      setSelectedAddressId(addresses[0].id.toString());
    }

    setOrderDialogOpen(true);
  };

  // Auto-select address when list becomes available or changes while the dialog is open
  useEffect(() => {
    if (orderDialogOpen && addresses.length > 0) {
      const isValid = addresses.some((a) => a.id?.toString() === selectedAddressId);
      if (!selectedAddressId || !isValid) {
        const defaultAddr = addresses.find((a) => a.isDefault);
        if (defaultAddr?.id) {
          setSelectedAddressId(defaultAddr.id.toString());
        } else if (addresses[0]?.id) {
          setSelectedAddressId(addresses[0].id.toString());
        }
      }
    }
  }, [addresses, orderDialogOpen, selectedAddressId]);

  const handleCreateOrder = async () => {
    if (selectedIds.length === 0) return;

    const payload = {
      readyDesignIds: selectedIds,
      customerAddressId: selectedAddressId ? Number(selectedAddressId) : undefined,
      deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
      note: notes.trim() || undefined,
    };

    try {
      const result = await createOrderFromReadyDesigns(payload);
      setOrderDialogOpen(false);
      setSelectedIds([]);
      if (result?.id) {
        navigate(`/orders/${result.id}`);
      } else {
        navigate("/orders");
      }
    } catch (err) {
      // Error handled by mutation hook
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Kho thiết kế sẵn sàng
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Chọn các thiết kế đã chốt in của khách hàng để tạo đơn hàng mới.
          </p>
        </div>

        {selectedIds.length > 0 && (
          <Button
            onClick={handleOpenOrderDialog}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-primary/20 animate-in fade-in duration-300"
          >
            Lên đơn hàng ({selectedIds.length})
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="p-3 mb-3 shrink-0 border-border/40">
        <CardContent className="p-0">
          <div className="grid gap-3 md:grid-cols-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Tìm theo mã, tên thiết kế..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 h-9 text-sm"
              />
            </div>

            {/* Customer filter combo */}
            <Popover open={customerComboOpen} onOpenChange={setCustomerComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="justify-between bg-background border-border/80 h-9 px-3 text-sm font-normal w-full"
                >
                  <span className="truncate">
                    {selectedCustomer
                      ? `Khách hàng: ${selectedCustomer.name}`
                      : "Lọc theo khách hàng..."}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0 bg-popover border border-border" align="start">
                <Command shouldFilter={false} className="w-full">
                  <CommandInput
                    placeholder="Tìm khách hàng..."
                    className="h-9 text-sm w-full"
                    value={customerSearch}
                    onValueChange={setCustomerSearch}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {loadingCustomers ? "Đang tải..." : "Không tìm thấy khách hàng"}
                    </CommandEmpty>
                    <CommandGroup>
                      {selectedCustomer && (
                        <CommandItem
                          onSelect={() => {
                            setSelectedCustomer(null);
                            setCustomerComboOpen(false);
                            setCurrentPage(1);
                          }}
                          className="py-2 text-sm text-destructive cursor-pointer hover:bg-destructive/10"
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Xóa bộ lọc khách hàng
                        </CommandItem>
                      )}
                      {customers.map((customer) => (
                        <CommandItem
                          key={customer.id}
                          value={customer.id.toString()}
                          onSelect={() => {
                            setSelectedCustomer({ id: customer.id!, name: customer.name! });
                            setCustomerComboOpen(false);
                            setCurrentPage(1);
                          }}
                          className="py-2 text-sm cursor-pointer hover:bg-accent"
                        >
                          <Check
                            className={`mr-2 h-4 w-4 shrink-0 ${
                              selectedCustomer?.id === customer.id ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{customer.name}</span>
                            <span className="text-xs text-muted-foreground">Mã: {customer.code}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Clear Filters Button */}
            {(selectedCustomer || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCustomer(null);
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="h-9 text-xs text-muted-foreground hover:text-foreground"
              >
                Xóa tất cả bộ lọc
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pool Table */}
      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden border-border/40">
        <CardContent className="p-0 flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="overflow-auto flex-1">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10 border-b">
                <TableRow>
                  <TableHead className="w-[50px] text-center">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      disabled={designs.length === 0}
                    />
                  </TableHead>
                  <TableHead className="h-9 text-sm font-bold w-[75px] text-center">Hình ảnh</TableHead>
                  <TableHead className="h-9 text-sm font-bold">Mã thiết kế</TableHead>
                  <TableHead className="h-9 text-sm font-bold">Tên thiết kế</TableHead>
                  <TableHead className="h-9 text-sm font-bold">Khách hàng</TableHead>
                  <TableHead className="h-9 text-sm font-bold">Số lượng sẵn sàng</TableHead>
                  <TableHead className="h-9 text-sm font-bold">Kích thước</TableHead>
                  <TableHead className="h-9 text-sm font-bold">Chất liệu</TableHead>
                  <TableHead className="h-9 text-sm font-bold">Ngày cập nhật</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingDesigns ? (
                  <TableSkeleton cols={9} rows={8} rowHeight="h-12" />
                ) : designs.length > 0 ? (
                  designs.map((design) => {
                    const isSelected = selectedIds.includes(design.id!);
                    const isDisabled = isRowSelectionDisabled(design);
                    return (
                      <TableRow
                        key={design.id}
                        className={`hover:bg-muted/50 h-12 transition-colors ${
                          isSelected ? "bg-primary/5 hover:bg-primary/10" : ""
                        } ${isDisabled ? "opacity-45" : ""}`}
                      >
                        <TableCell className="text-center py-2">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleSelectRow(design.id!, design)}
                            disabled={isDisabled}
                          />
                        </TableCell>
                        <TableCell className="py-1 flex items-center justify-center">
                          <DesignImageThumbnail designId={design.designId!} />
                        </TableCell>
                        <TableCell className="py-2 font-mono font-semibold text-sm">
                          {design.designCode}
                        </TableCell>
                        <TableCell className="py-2 text-sm font-semibold truncate max-w-[200px]" title={design.designName || ""}>
                          {design.designName}
                        </TableCell>
                        <TableCell className="py-2 text-sm font-medium">
                          {design.customerName}
                          <Badge variant="outline" className="ml-1.5 font-mono text-[9px] scale-95">
                            {design.customerId}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                          {design.quantity?.toLocaleString("vi-VN")}
                        </TableCell>
                        <TableCell className="py-2 font-mono text-xs text-muted-foreground">
                          {design.dimensions || "—"}
                        </TableCell>
                        <TableCell className="py-2 text-xs font-medium text-muted-foreground truncate max-w-[150px]" title={design.materialTypeName || ""}>
                          {design.materialTypeName}
                        </TableCell>
                        <TableCell className="py-2 text-xs text-muted-foreground">
                          {design.updatedAt
                            ? new Date(design.updatedAt).toLocaleDateString("vi-VN")
                            : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Package className="h-10 w-10 mb-2 opacity-50" />
                        <p className="text-sm">Không có thiết kế nào sẵn sàng trong kho</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalCount > 0 && (
            <div className="flex items-center justify-between px-3 py-2 border-t shrink-0 bg-background">
              <div className="text-xs text-muted-foreground">
                Hiển thị{" "}
                <span className="font-medium text-foreground">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                -{" "}
                <span className="font-medium text-foreground">
                  {Math.min(currentPage * itemsPerPage, totalCount)}
                </span>{" "}
                trong tổng số <span className="font-medium text-foreground">{totalCount}</span> dòng
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || loadingDesigns}
                >
                  Trang trước
                </Button>
                <div className="text-xs font-medium">
                  Trang {currentPage} / {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || loadingDesigns}
                >
                  Trang sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Creation Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="max-w-lg bg-background border border-border shadow-2xl rounded-2xl p-6">
          <DialogHeader className="pb-3 border-b border-border/40">
            <DialogTitle className="text-lg font-bold text-foreground">
              Lên đơn hàng từ kho thiết kế
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Bạn đang tạo đơn hàng cho khách hàng: <span className="font-bold text-foreground">{selectedDesignsDetails[0]?.customerName}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 text-sm max-h-[60vh] overflow-y-auto pr-1">
            {/* Selected designs summary */}
            <div className="space-y-2">
              <Label className="font-semibold text-foreground">Các thiết kế đã chọn ({selectedDesignsDetails.length})</Label>
              <div className="bg-muted/40 border rounded-lg p-2.5 space-y-1.5 max-h-[140px] overflow-y-auto">
                {selectedDesignsDetails.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-xs border-b border-border/40 pb-1.5 last:border-0 last:pb-0">
                    <span className="font-mono font-bold text-muted-foreground">{item.designCode}</span>
                    <span className="font-medium truncate max-w-[200px]">{item.designName}</span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">SL: {item.quantity?.toLocaleString("vi-VN")}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery address */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="font-semibold text-foreground flex items-center gap-1">
                  Địa chỉ giao hàng
                </Label>
                {addresses.length > 0 && customerDetail?.address && !addresses.some(a => a.address === customerDetail.address) && (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-semibold"
                    disabled={createAddressMutation.isPending}
                    onClick={handleCreateAddressFromProfile}
                  >
                    {createAddressMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Plus className="h-3 w-3 mr-1" />
                    )}
                    Thêm địa chỉ từ hồ sơ
                  </Button>
                )}
              </div>
              {loadingAddresses ? (
                <div className="flex items-center text-xs text-muted-foreground gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" /> Đang tải sổ địa chỉ...
                </div>
              ) : addresses.length === 0 ? (
                <div className="space-y-2">
                  <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 p-2.5 rounded-lg">
                    Khách hàng chưa đăng ký địa chỉ giao hàng nào. Vui lòng vào trang khách hàng để bổ sung.
                  </div>
                  {customerDetail?.address ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full text-xs gap-1.5 py-2.5 h-auto border-indigo-200 dark:border-indigo-900 bg-indigo-50/30 dark:bg-indigo-950/10 hover:bg-indigo-50/50 hover:text-indigo-600 dark:hover:text-indigo-400 text-indigo-600 dark:text-indigo-400 font-semibold transition-all shadow-sm"
                      disabled={createAddressMutation.isPending}
                      onClick={handleCreateAddressFromProfile}
                    >
                      {createAddressMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                      Sử dụng địa chỉ hồ sơ: <span className="underline truncate max-w-[200px]" title={customerDetail.address}>{customerDetail.address}</span>
                    </Button>
                  ) : (
                    <div className="text-xs text-muted-foreground italic pl-1">
                      (Hồ sơ khách hàng cũng chưa đăng ký địa chỉ liên hệ)
                    </div>
                  )}
                </div>
              ) : (
                <Select value={selectedAddressId} onValueChange={setSelectedAddressId}>
                  <SelectTrigger className="h-11 bg-background border-border/80">
                    <SelectValue placeholder="Chọn địa chỉ giao hàng..." />
                  </SelectTrigger>
                  <SelectContent>
                    {addresses.map((addr) => (
                      <SelectItem key={addr.id} value={addr.id!.toString()} className="text-sm">
                        <div className="flex flex-col text-left">
                          <span className="font-medium">
                            {addr.label} {addr.isDefault && <Badge className="ml-1 py-0 scale-90">Mặc định</Badge>}
                          </span>
                          {addr.address && (
                            <span className="text-xs text-muted-foreground truncate max-w-[350px]">{addr.address}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Delivery Date */}
            <div className="space-y-2">
              <Label className="font-semibold text-foreground flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Ngày giao hàng
              </Label>
              <Input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="h-11 bg-background"
              />
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label className="font-semibold text-foreground flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Ghi chú đơn hàng
              </Label>
              <Textarea
                placeholder="Ghi chú yêu cầu giao nhận, tiến độ..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px] bg-background resize-none border-border/80"
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-border/40 gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={() => setOrderDialogOpen(false)}
              disabled={isCreatingOrder}
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={handleCreateOrder}
              disabled={isCreatingOrder || selectedIds.length === 0}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {isCreatingOrder ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tạo đơn...
                </>
              ) : (
                "Xác nhận tạo đơn"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
