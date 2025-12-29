import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Truck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Plus,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { StatusBadge } from "@/components/ui/status-badge";
import { useOrdersForAccounting } from "@/hooks/use-order";
import {
  useDeliveryNotes,
  useCreateDeliveryNote,
  useExportDeliveryNotePDF,
} from "@/hooks/use-delivery-note";
import type { OrderResponse } from "@/Schema";
import type { DeliveryNoteResponse } from "@/Schema/delivery-note.schema";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
};

const formatDateTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: vi });
};

export default function DeliveryNoteListPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"orders" | "delivery-notes">(
    "orders"
  );

  // Orders tab state
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<number>>(
    new Set()
  );
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");

  // Delivery notes tab state
  const [deliveryNoteStatusFilter, setDeliveryNoteStatusFilter] =
    useState<string>("all");
  const [deliveryNotePage, setDeliveryNotePage] = useState(1);

  const itemsPerPage = 10;

  // Fetch orders
  const {
    data: ordersData,
    isLoading: ordersLoading,
    isError: ordersError,
    error: ordersErrorObj,
    refetch: refetchOrders,
  } = useOrdersForAccounting({
    pageNumber: currentPage,
    pageSize: itemsPerPage,
    filterType: "delivery",
  });

  // Fetch delivery notes
  const {
    data: deliveryNotesData,
    isLoading: deliveryNotesLoading,
    isError: deliveryNotesError,
    error: deliveryNotesErrorObj,
    refetch: refetchDeliveryNotes,
  } = useDeliveryNotes({
    pageNumber: deliveryNotePage,
    pageSize: itemsPerPage,
    status:
      deliveryNoteStatusFilter === "all" ? undefined : deliveryNoteStatusFilter,
  });

  const createDeliveryNoteMutation = useCreateDeliveryNote();
  const exportDeliveryNotePDFMutation = useExportDeliveryNotePDF();

  // Filter orders
  const filteredOrders = useMemo(() => {
    if (!ordersData?.items) return [];
    return ordersData.items.filter((order) => {
      const matchesSearch =
        !searchQuery ||
        order.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer?.name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        order.customer?.companyName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        order.customer?.phone?.includes(searchQuery);
      return matchesSearch;
    });
  }, [ordersData?.items, searchQuery]);

  const handleToggleOrder = (orderId: number) => {
    setSelectedOrderIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedOrderIds.size === filteredOrders.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(
        new Set(
          filteredOrders.map((o) => o.id).filter((id): id is number => !!id)
        )
      );
    }
  };

  const handleCreateDeliveryNote = () => {
    if (selectedOrderIds.size === 0) {
      toast.error("Vui lòng chọn ít nhất một đơn hàng");
      return;
    }

    // Lấy thông tin người nhận từ đơn hàng đã chọn
    // Ưu tiên lấy từ order đầu tiên có đầy đủ thông tin
    const firstOrderWithRecipient = selectedOrders.find(
      (order) =>
        order.recipientName ||
        order.recipientPhone ||
        order.recipientAddress ||
        order.deliveryAddress
    );

    if (firstOrderWithRecipient) {
      // Chỉ điền vào form nếu form đang trống
      if (!recipientName && firstOrderWithRecipient.recipientName) {
        setRecipientName(firstOrderWithRecipient.recipientName);
      }
      if (!recipientPhone && firstOrderWithRecipient.recipientPhone) {
        setRecipientPhone(firstOrderWithRecipient.recipientPhone);
      }
      // Ưu tiên recipientAddress, nếu không có thì dùng deliveryAddress
      if (!deliveryAddress) {
        const address =
          firstOrderWithRecipient.recipientAddress ||
          firstOrderWithRecipient.deliveryAddress;
        if (address) {
          setDeliveryAddress(address);
        }
      }
    }

    setIsCreateDialogOpen(true);
  };

  const handleConfirmCreate = async () => {
    if (selectedOrderIds.size === 0) return;

    // Lấy thông tin người nhận từ đơn hàng nếu form trống
    const firstOrderWithRecipient = selectedOrders.find(
      (order) =>
        order.recipientName ||
        order.recipientPhone ||
        order.recipientAddress ||
        order.deliveryAddress
    );

    // Ưu tiên giá trị từ form, nếu không có thì lấy từ order
    const finalRecipientName =
      recipientName || firstOrderWithRecipient?.recipientName || undefined;
    const finalRecipientPhone =
      recipientPhone || firstOrderWithRecipient?.recipientPhone || undefined;
    // Ưu tiên recipientAddress, nếu không có thì dùng deliveryAddress
    const finalDeliveryAddress =
      deliveryAddress ||
      firstOrderWithRecipient?.recipientAddress ||
      firstOrderWithRecipient?.deliveryAddress ||
      undefined;

    try {
      await createDeliveryNoteMutation.mutateAsync({
        orderIds: Array.from(selectedOrderIds),
        recipientName: finalRecipientName || undefined,
        recipientPhone: finalRecipientPhone || undefined,
        deliveryAddress: finalDeliveryAddress || undefined,
        notes: notes || undefined,
      });
      setSelectedOrderIds(new Set());
      setRecipientName("");
      setRecipientPhone("");
      setDeliveryAddress("");
      setNotes("");
      setIsCreateDialogOpen(false);
      refetchOrders();
      refetchDeliveryNotes();
      setActiveTab("delivery-notes");
      toast.success("Tạo phiếu giao hàng thành công");
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleViewDeliveryNote = (id: number | undefined) => {
    if (id) {
      navigate(`/delivery-notes/${id}`);
    }
  };

  const handleExportPDF = async (id: number | undefined) => {
    if (!id) return;
    try {
      await exportDeliveryNotePDFMutation.mutateAsync(id);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const selectedOrders = useMemo(() => {
    return filteredOrders.filter((o) => o.id && selectedOrderIds.has(o.id));
  }, [filteredOrders, selectedOrderIds]);

  const totalSelectedAmount = useMemo(() => {
    return selectedOrders.reduce(
      (sum, order) => sum + (order.totalAmount || 0),
      0
    );
  }, [selectedOrders]);

  const getStatusBadge = (status: string | null | undefined) => {
    if (!status) return <Badge variant="secondary">—</Badge>;

    const statusLower = status.toLowerCase();
    if (statusLower.includes("success") || statusLower.includes("completed")) {
      return (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Thành công
        </Badge>
      );
    }
    if (statusLower.includes("fail") || statusLower.includes("failed")) {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Thất bại
        </Badge>
      );
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Phiếu giao hàng</h1>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
      >
        <TabsList>
          <TabsTrigger value="orders">Đơn hàng</TabsTrigger>
          <TabsTrigger value="delivery-notes">Phiếu giao hàng</TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          {ordersError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Lỗi kết nối</AlertTitle>
              <AlertDescription>
                {ordersErrorObj instanceof Error
                  ? ordersErrorObj.message
                  : "Không thể tải dữ liệu. Vui lòng thử lại."}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo mã đơn, tên khách, SĐT..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => refetchOrders()}
                  disabled={ordersLoading}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${ordersLoading ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>
            </div>

            {selectedOrderIds.size > 0 && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">
                    Đã chọn {selectedOrderIds.size} đơn hàng
                  </span>
                  <Badge variant="secondary">
                    Tổng: {formatCurrency(totalSelectedAmount)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedOrderIds(new Set())}
                  >
                    Bỏ chọn
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreateDeliveryNote}
                    className="gap-2"
                  >
                    <Truck className="h-4 w-4" />
                    Tạo phiếu giao hàng ({selectedOrderIds.size})
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={
                        filteredOrders.length > 0 &&
                        selectedOrderIds.size === filteredOrders.length
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-[140px]">Mã đơn</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead className="text-right">Tổng tiền</TableHead>
                  <TableHead className="text-center">Ngày giao</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Không tìm thấy đơn hàng nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => {
                    const isSelected = order.id
                      ? selectedOrderIds.has(order.id)
                      : false;
                    return (
                      <TableRow
                        key={order.id}
                        className={`group ${isSelected ? "bg-muted/50" : ""}`}
                      >
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() =>
                              order.id && handleToggleOrder(order.id)
                            }
                          />
                        </TableCell>
                        <TableCell className="font-medium font-mono text-sm">
                          {order.code}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-sm">
                              {order.customer?.companyName ||
                                order.customer?.name ||
                                "—"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {order.customer?.phone || "—"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatCurrency(order.totalAmount || 0)}
                        </TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">
                          {formatDate(order.deliveryDate)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => navigate(`/orders/${order.id}`)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Xem chi tiết
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {ordersData && ordersData.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Trang {currentPage} / {ordersData.totalPages} (
                {ordersData.total} đơn hàng)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || ordersLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium px-2">
                  {currentPage} / {ordersData.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(ordersData.totalPages, p + 1)
                    )
                  }
                  disabled={
                    currentPage === ordersData.totalPages || ordersLoading
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Delivery Notes Tab */}
        <TabsContent value="delivery-notes" className="space-y-4">
          {deliveryNotesError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Lỗi kết nối</AlertTitle>
              <AlertDescription>
                {deliveryNotesErrorObj instanceof Error
                  ? deliveryNotesErrorObj.message
                  : "Không thể tải dữ liệu. Vui lòng thử lại."}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2">
              <Select
                value={deliveryNoteStatusFilter}
                onValueChange={setDeliveryNoteStatusFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="pending">Chờ giao</SelectItem>
                  <SelectItem value="delivered">Đã giao</SelectItem>
                  <SelectItem value="failed">Thất bại</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetchDeliveryNotes()}
                disabled={deliveryNotesLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${deliveryNotesLoading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[140px]">Mã phiếu</TableHead>
                  <TableHead>Đơn hàng</TableHead>
                  <TableHead>Người nhận</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                  <TableHead className="text-center">Ngày tạo</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveryNotesLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !deliveryNotesData?.items ||
                  deliveryNotesData.items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Không tìm thấy phiếu giao hàng nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  deliveryNotesData.items.map((deliveryNote) => (
                    <TableRow key={deliveryNote.id} className="group">
                      <TableCell className="font-medium font-mono text-sm">
                        {deliveryNote.code || `#${deliveryNote.id}`}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {deliveryNote.orders?.slice(0, 2).map((order) => (
                            <div key={order.orderId} className="text-sm">
                              {order.orderCode}
                            </div>
                          ))}
                          {deliveryNote.orders &&
                            deliveryNote.orders.length > 2 && (
                              <div className="text-xs text-muted-foreground">
                                +{deliveryNote.orders.length - 2} đơn hàng khác
                              </div>
                            )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            {deliveryNote.recipientName || "—"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {deliveryNote.recipientPhone || "—"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(deliveryNote.status)}
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {formatDate(deliveryNote.createdAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                handleViewDeliveryNote(deliveryNote.id)
                              }
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleExportPDF(deliveryNote.id)}
                            >
                              <Truck className="h-4 w-4 mr-2" />
                              Xuất PDF
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {deliveryNotesData && deliveryNotesData.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Trang {deliveryNotePage} / {deliveryNotesData.totalPages} (
                {deliveryNotesData.total} phiếu giao hàng)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeliveryNotePage((p) => Math.max(1, p - 1))}
                  disabled={deliveryNotePage === 1 || deliveryNotesLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium px-2">
                  {deliveryNotePage} / {deliveryNotesData.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setDeliveryNotePage((p) =>
                      Math.min(deliveryNotesData.totalPages, p + 1)
                    )
                  }
                  disabled={
                    deliveryNotePage === deliveryNotesData.totalPages ||
                    deliveryNotesLoading
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Delivery Note Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Tạo phiếu giao hàng cho {selectedOrderIds.size} đơn hàng
            </DialogTitle>
            <DialogDescription>
              Nhập thông tin giao hàng cho các đơn hàng đã chọn.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[40vh] pr-4 mb-4">
            <div className="space-y-3">
              {selectedOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{order.code}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {order.customer?.companyName ||
                        order.customer?.name ||
                        "—"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-sm">
                      {formatCurrency(order.totalAmount || 0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipientName">Tên người nhận</Label>
                <Input
                  id="recipientName"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Tên người nhận"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipientPhone">Số điện thoại</Label>
                <Input
                  id="recipientPhone"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="Số điện thoại"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryAddress">Địa chỉ giao hàng</Label>
              <Input
                id="deliveryAddress"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Địa chỉ giao hàng"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú (tùy chọn)"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={createDeliveryNoteMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmCreate}
              disabled={createDeliveryNoteMutation.isPending}
              className="gap-2"
            >
              <Truck className="h-4 w-4" />
              {createDeliveryNoteMutation.isPending
                ? "Đang tạo..."
                : "Xác nhận tạo phiếu giao hàng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
