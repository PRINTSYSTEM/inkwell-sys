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
import { useUpdateCustomer, useCustomer } from "@/hooks";
import type { CustomerSummaryResponse } from "@/Schema/customer.schema";
import { Loader2 } from "lucide-react";

type CustomerUpdateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: CustomerSummaryResponse | null;
  onSuccess?: () => void;
};

export function CustomerUpdateDialog({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: CustomerUpdateDialogProps) {
  const { mutateAsync: updateCustomer, isPending } = useUpdateCustomer();
  
  // Fetch full customer data if we only have summary
  const { data: fullCustomer, isLoading: loadingCustomer } = useCustomer(
    customer?.id || null,
    open && !!customer?.id
  );

  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    representativeName: "",
    phone: "",
    email: "",
    taxCode: "",
    address: "",
  });

  // Initialize form data when customer data is available
  useEffect(() => {
    if (open && (fullCustomer || customer)) {
      const data = fullCustomer || customer;
      setFormData({
        name: data?.name || "",
        companyName: data?.companyName || "",
        representativeName: data?.representativeName || "",
        phone: data?.phone || "",
        email: data?.email || "",
        taxCode: "taxCode" in (data || {}) && typeof data?.taxCode === "string" 
          ? data.taxCode 
          : "",
        address: data?.address || "",
      });
    }
  }, [open, fullCustomer, customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customer?.id) {
      return;
    }

    try {
      await updateCustomer({
        id: customer.id,
        data: {
          name: formData.name.trim() || null,
          companyName: formData.companyName.trim() || null,
          representativeName: formData.representativeName.trim() || null,
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          taxCode: formData.taxCode.trim() || null,
          address: formData.address.trim() || null,
        },
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const isCompany = !!formData.companyName;
  const isLoading = loadingCustomer || isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cập nhật thông tin khách hàng</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin khách hàng để có thể xuất hóa đơn. Các trường có dấu * là bắt buộc.
          </DialogDescription>
        </DialogHeader>

        {isLoading && !fullCustomer ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tên khách hàng */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Tên khách hàng <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Nhập tên khách hàng"
                required
                disabled={isPending}
              />
            </div>

            {/* Tên công ty */}
            <div className="space-y-2">
              <Label htmlFor="companyName">Tên công ty</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    companyName: e.target.value,
                  }))
                }
                placeholder="Nhập tên công ty (nếu có)"
                disabled={isPending}
              />
            </div>

            {/* Tên người đại diện */}
            {isCompany && (
              <div className="space-y-2">
                <Label htmlFor="representativeName">
                  Tên người đại diện
                </Label>
                <Input
                  id="representativeName"
                  value={formData.representativeName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      representativeName: e.target.value,
                    }))
                  }
                  placeholder="Nhập tên người đại diện"
                  disabled={isPending}
                />
              </div>
            )}

            {/* Số điện thoại */}
            <div className="space-y-2">
              <Label htmlFor="phone">
                Số điện thoại <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="Nhập số điện thoại"
                required
                disabled={isPending}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                Email {isCompany && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="Nhập email"
                required={isCompany}
                disabled={isPending}
              />
              {!isCompany && (
                <p className="text-xs text-muted-foreground">
                  Email không bắt buộc cho khách hàng lẻ
                </p>
              )}
            </div>

            {/* Mã số thuế */}
            {isCompany && (
              <div className="space-y-2">
                <Label htmlFor="taxCode">
                  Mã số thuế <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="taxCode"
                  value={formData.taxCode}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      taxCode: e.target.value,
                    }))
                  }
                  placeholder="Nhập mã số thuế"
                  required
                  disabled={isPending}
                />
              </div>
            )}

            {/* Địa chỉ */}
            <div className="space-y-2">
              <Label htmlFor="address">
                Địa chỉ <span className="text-destructive">*</span>
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder="Nhập địa chỉ"
                required
                disabled={isPending}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang cập nhật...
                  </>
                ) : (
                  "Cập nhật"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

