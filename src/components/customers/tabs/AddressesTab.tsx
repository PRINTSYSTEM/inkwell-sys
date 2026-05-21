import { useState, useMemo } from "react";
import {
  MapPin,
  Star,
  Edit2,
  Trash2,
  Plus,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useCustomerAddresses,
  useCreateCustomerAddress,
  useUpdateCustomerAddress,
  useDeleteCustomerAddress,
  useSetDefaultCustomerAddress,
} from "@/hooks/use-customer";
import type { CustomerAddress } from "@/Schema/customer.schema";

interface AddressesTabProps {
  customerId: number;
  isActive?: boolean;
}

export function AddressesTab({ customerId, isActive = true }: AddressesTabProps) {
  const { data: addresses, isLoading } = useCustomerAddresses(customerId, isActive);
  const createMutation = useCreateCustomerAddress(customerId);
  const updateMutation = useUpdateCustomerAddress(customerId);
  const deleteMutation = useDeleteCustomerAddress(customerId);
  const setDefaultMutation = useSetDefaultCustomerAddress(customerId);

  // Address dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [label, setLabel] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  // Delete dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<number | null>(null);

  const sortedAddresses = useMemo(() => {
    if (!addresses) return [];
    return [...addresses].sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return 0;
    });
  }, [addresses]);

  const handleOpenAdd = () => {
    setEditingAddress(null);
    setLabel("");
    setRecipientName("");
    setRecipientPhone("");
    setAddress("");
    setIsDefault(false);
    setDialogOpen(true);
  };

  const handleOpenEdit = (addr: CustomerAddress) => {
    setEditingAddress(addr);
    setLabel(addr.label || "");
    setRecipientName(addr.recipientName || "");
    setRecipientPhone(addr.recipientPhone || "");
    setAddress(addr.address || "");
    setIsDefault(addr.isDefault || false);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!label.trim()) {
      return;
    }
    if (!address.trim()) {
      return;
    }

    const payload = {
      label: label.trim(),
      recipientName: recipientName.trim() || null,
      recipientPhone: recipientPhone.trim() || null,
      address: address.trim(),
      isDefault,
    };

    try {
      if (editingAddress) {
        await updateMutation.mutateAsync({
          addressId: editingAddress.id,
          data: {
            ...payload,
            isActive: true,
          },
        });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setDialogOpen(false);
    } catch (error) {
      // Handled in hooks toast notification
    }
  };

  const handleOpenDelete = (id: number) => {
    setAddressToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (addressToDelete === null) return;
    try {
      await deleteMutation.mutateAsync(addressToDelete);
      setDeleteConfirmOpen(false);
      setAddressToDelete(null);
    } catch (error) {
      // Handled in hooks toast notification
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await setDefaultMutation.mutateAsync(id);
    } catch (error) {
      // Handled in hooks toast notification
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Filters placeholder */}
        <div className="flex items-center justify-end">
          <Skeleton className="h-9 w-32" />
        </div>
        {/* Table skeleton */}
        <div className="border rounded-lg p-4 space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-end">
        <Button
          size="sm"
          onClick={handleOpenAdd}
          className="h-9 text-sm font-medium gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Thêm địa chỉ
        </Button>
      </div>

      {/* Table of Addresses */}
      {!sortedAddresses || sortedAddresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border border-dashed rounded-xl bg-slate-50/30 dark:bg-slate-900/10">
          <MapPin className="h-12 w-12 mb-3 opacity-40 text-primary" />
          <p className="text-sm font-semibold">Không tìm thấy địa chỉ giao hàng nào</p>
          <p className="text-xs mt-1 text-slate-400">
            Thêm địa chỉ giao hàng trước để sử dụng khi lập phiếu xuất kho.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <div className="max-h-[400px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="text-xs w-[180px]">Nhãn</TableHead>
                  <TableHead className="text-xs w-[150px]">Người nhận</TableHead>
                  <TableHead className="text-xs w-[120px]">Số điện thoại</TableHead>
                  <TableHead className="text-xs">Địa chỉ chi tiết</TableHead>
                  <TableHead className="text-xs w-[110px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAddresses.map((addr) => (
                  <TableRow
                    key={addr.id}
                    className="hover:bg-muted/50"
                  >
                    <TableCell className="text-xs font-medium">
                      <div className="flex items-center gap-2">
                        <span>{addr.label}</span>
                        {addr.isDefault && (
                          <Badge
                            variant="secondary"
                            className="px-1.5 py-0 text-[10px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50 shrink-0"
                          >
                            Mặc định
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {addr.recipientName || "—"}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {addr.recipientPhone || "—"}
                    </TableCell>
                    <TableCell className="text-xs max-w-[300px] truncate" title={addr.address}>
                      {addr.address}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {!addr.isDefault && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-amber-600"
                            onClick={() => handleSetDefault(addr.id)}
                            disabled={setDefaultMutation.isPending}
                            title="Đặt làm mặc định"
                          >
                            <Star className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary"
                          onClick={() => handleOpenEdit(addr)}
                          title="Sửa"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleOpenDelete(addr.id)}
                          title="Xóa"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
            </DialogTitle>
            <DialogDescription>
              {editingAddress
                ? "Cập nhật thông tin địa chỉ giao hàng của khách hàng"
                : "Tạo địa chỉ giao hàng mới cho khách hàng"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="label">
                Nhãn địa chỉ <span className="text-destructive">*</span>
              </Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="VD: Kho hàng 1, Văn phòng chính..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="recipientName">Người nhận</Label>
                <Input
                  id="recipientName"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Họ tên người nhận"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="recipientPhone">Số điện thoại</Label>
                <Input
                  id="recipientPhone"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="Số điện thoại nhận"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">
                Địa chỉ chi tiết <span className="text-destructive">*</span>
              </Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Số nhà, tên đường, phường/xã..."
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <Checkbox
                id="isDefault"
                checked={isDefault}
                onCheckedChange={(checked) => setIsDefault(!!checked)}
              />
              <label
                htmlFor="isDefault"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none"
              >
                Đặt địa chỉ này làm mặc định
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                createMutation.isPending ||
                updateMutation.isPending ||
                !label.trim() ||
                !address.trim()
              }
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Lưu địa chỉ"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa địa chỉ</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa địa chỉ này không? Thao tác này sẽ không
              thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/95 text-destructive-foreground"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                "Xóa"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
