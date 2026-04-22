import { useState } from 'react';
import { Phone, MapPin, Building2, FileText, Copy, ExternalLink, User, Mail, Edit2, Check, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useUpdateCustomer } from '@/hooks/use-customer';
import type { CustomerResponse } from '@/Schema';

interface CustomerProfileProps {
  customer: CustomerResponse;
  isDesignRole?: boolean;
}

export function CustomerProfile({ customer, isDesignRole = false }: CustomerProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: customer.name || '',
    taxCode: customer.taxCode || '',
    companyName: customer.companyName || '',
    representativeName: customer.representativeName || '',
    phone: customer.phone || '',
    email: customer.email || '',
    address: customer.address || '',
  });

  const { mutateAsync: updateCustomer, loading: isUpdating } = useUpdateCustomer();

  const handleSave = async () => {
    try {
      await updateCustomer({
        id: customer.id,
        data: {
          name: formData.name,
          companyName: formData.companyName,
          representativeName: formData.representativeName,
          phone: formData.phone,
          email: formData.email,
          taxCode: formData.taxCode,
          address: formData.address,
          type: customer.type,
          scrapRate: customer.scrapRate ?? 0,
        }
      });
      setIsEditing(false);
      toast.success('Đã cập nhật thông tin khách hàng');
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleCancel = () => {
    setFormData({
      name: customer.name || '',
      taxCode: customer.taxCode || '',
      companyName: customer.companyName || '',
      representativeName: customer.representativeName || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
    });
    setIsEditing(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}`);
  };

  const openMap = (address: string) => {
    window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank');
  };

  return (
    <Card className={cn("h-fit", isDesignRole && "shadow-lg")}>
      <CardHeader className={cn("pb-4", isDesignRole && "pb-6")}>
        <div className="flex items-center justify-between">
          <CardTitle className={cn(
            "font-semibold",
            isDesignRole ? "text-2xl font-bold" : "text-base"
          )}>
            Thông tin khách hàng
          </CardTitle>
          {/* {!isDesignRole && (
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={handleSave}
                    disabled={isUpdating}
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleCancel}
                    disabled={isUpdating}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )} */}
        </div>
      </CardHeader>
      <CardContent className={cn("space-y-6", isDesignRole && "space-y-8")}>
        {/* Thông tin cơ bản */}
        <div className={cn("space-y-4", isDesignRole && "space-y-6")}>
          <p className={cn(
            "font-semibold text-foreground uppercase tracking-wide",
            isDesignRole ? "text-base font-bold" : "text-sm"
          )}>
            Thông tin cơ bản
          </p>
          
          <div className={cn("space-y-3", isDesignRole && "space-y-5")}>
            {/* Tên khách hàng */}
            <div className={cn("flex items-center gap-3", isDesignRole && "gap-4")}>
              <User className={cn(
                "text-muted-foreground shrink-0",
                isDesignRole ? "h-5 w-5" : "h-4 w-4"
              )} />
              <div className="flex-1">
                <p className={cn(
                  "text-muted-foreground mb-0.5",
                  isDesignRole ? "text-sm font-medium" : "text-xs"
                )}>
                  Tên khách hàng
                </p>
                {isEditing ? (
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-8 mt-1"
                    placeholder="Nhập tên khách hàng"
                  />
                ) : (
                  <p className={cn(
                    "font-semibold text-foreground",
                    isDesignRole ? "text-xl font-bold" : "text-base"
                  )}>
                    {customer.name || 'Chưa có tên'}
                  </p>
                )}
              </div>
            </div>

            {/* MST */}
            <div className={cn("flex items-center justify-between group", isDesignRole && "gap-4")}>
              <div className={cn("flex items-center gap-3 flex-1", isDesignRole && "gap-4")}>
                <FileText className={cn(
                  "text-muted-foreground shrink-0",
                  isDesignRole ? "h-5 w-5" : "h-4 w-4"
                )} />
                <div className="flex-1">
                  <p className={cn(
                    "text-muted-foreground mb-0.5",
                    isDesignRole ? "text-sm font-medium" : "text-xs"
                  )}>
                    Mã số thuế
                  </p>
                  {isEditing ? (
                    <Input
                      value={formData.taxCode}
                      onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
                      className="h-8 mt-1"
                      placeholder="Nhập mã số thuế"
                    />
                  ) : (
                    <p className={cn(
                      "font-semibold text-foreground",
                      isDesignRole ? "text-xl font-bold" : "text-base"
                    )}>
                      {customer.taxCode || 'Chưa có mã số thuế'}
                    </p>
                  )}
                </div>
              </div>
              {!isEditing && customer.taxCode && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "opacity-0 group-hover:opacity-100 transition-opacity shrink-0",
                    isDesignRole ? "h-8 w-8" : "h-7 w-7"
                  )}
                  onClick={() => copyToClipboard(customer.taxCode ?? '', 'mã số thuế')}
                >
                  <Copy className={cn(isDesignRole ? "h-5 w-5" : "h-4 w-4")} />
                </Button>
              )}
            </div>

            {/* Tên công ty - chỉ hiển thị nếu là công ty hoặc đang sửa */}
            {(customer.type === 'company' || isEditing) && (
              <div className={cn("flex items-center gap-3", isDesignRole && "gap-4")}>
                <Building2 className={cn(
                  "text-muted-foreground shrink-0",
                  isDesignRole ? "h-5 w-5" : "h-4 w-4"
                )} />
                <div className="flex-1">
                  <p className={cn(
                    "text-muted-foreground mb-0.5",
                    isDesignRole ? "text-sm font-medium" : "text-xs"
                  )}>
                    Tên công ty
                  </p>
                  {isEditing ? (
                    <Input
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="h-8 mt-1"
                      placeholder="Nhập tên công ty"
                    />
                  ) : (
                    <p className={cn(
                      "font-semibold text-foreground",
                      isDesignRole ? "text-xl font-bold" : "text-base"
                    )}>
                      {customer.companyName || '—'}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Người đại diện - chỉ hiển thị nếu là công ty hoặc đang sửa */}
            {(customer.type === 'company' || isEditing) && (
              <div className={cn("flex items-center gap-3", isDesignRole && "gap-4")}>
                <User className={cn(
                  "text-muted-foreground shrink-0",
                  isDesignRole ? "h-5 w-5" : "h-4 w-4"
                )} />
                <div className="flex-1">
                  <p className={cn(
                    "text-muted-foreground mb-0.5",
                    isDesignRole ? "text-sm font-medium" : "text-xs"
                  )}>
                    Người đại diện
                  </p>
                  {isEditing ? (
                    <Input
                      value={formData.representativeName}
                      onChange={(e) => setFormData({ ...formData, representativeName: e.target.value })}
                      className="h-8 mt-1"
                      placeholder="Nhập người đại diện"
                    />
                  ) : (
                    <p className={cn(
                      "font-semibold text-foreground",
                      isDesignRole ? "text-xl font-bold" : "text-base"
                    )}>
                      {customer.representativeName || '—'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Thông tin liên hệ */}
        <div className={cn("space-y-4", isDesignRole && "space-y-6")}>
          <p className={cn(
            "font-semibold text-foreground uppercase tracking-wide",
            isDesignRole ? "text-base font-bold" : "text-sm"
          )}>
            Thông tin liên hệ
          </p>
          
          <div className={cn("space-y-3", isDesignRole && "space-y-5")}>
            {/* Số điện thoại */}
            <div className={cn("flex items-center justify-between group", isDesignRole && "gap-4")}>
              <div className={cn("flex items-center gap-3 flex-1", isDesignRole && "gap-4")}>
                <Phone className={cn(
                  "text-muted-foreground shrink-0",
                  isDesignRole ? "h-5 w-5" : "h-4 w-4"
                )} />
                <div className="flex-1">
                  <p className={cn(
                    "text-muted-foreground mb-0.5",
                    isDesignRole ? "text-sm font-medium" : "text-xs"
                  )}>
                    Số điện thoại
                  </p>
                  {isEditing ? (
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="h-8 mt-1"
                      placeholder="Nhập số điện thoại"
                    />
                  ) : (
                    <p className={cn(
                      "font-semibold text-foreground",
                      isDesignRole ? "text-xl font-bold" : "text-base"
                    )}>
                      {customer.phone || 'Chưa có số điện thoại'}
                    </p>
                  )}
                </div>
              </div>
              {!isEditing && customer.phone && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "opacity-0 group-hover:opacity-100 transition-opacity shrink-0",
                    isDesignRole ? "h-8 w-8" : "h-7 w-7"
                  )}
                  onClick={() => copyToClipboard(customer.phone!, 'số điện thoại')}
                >
                  <Copy className={cn(isDesignRole ? "h-5 w-5" : "h-4 w-4")} />
                </Button>
              )}
            </div>

            {/* Email */}
            <div className={cn("flex items-center justify-between group", isDesignRole && "gap-4")}>
              <div className={cn("flex items-center gap-3 flex-1", isDesignRole && "gap-4")}>
                <Mail className={cn(
                  "text-muted-foreground shrink-0",
                  isDesignRole ? "h-5 w-5" : "h-4 w-4"
                )} />
                <div className="flex-1">
                  <p className={cn(
                    "text-muted-foreground mb-0.5",
                    isDesignRole ? "text-sm font-medium" : "text-xs"
                  )}>
                    Email
                  </p>
                  {isEditing ? (
                    <Input
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-8 mt-1"
                      placeholder="Nhập email"
                    />
                  ) : (
                    <p className={cn(
                      "font-semibold text-foreground",
                      isDesignRole ? "text-xl font-bold" : "text-base"
                    )}>
                      {customer.email || 'Chưa có email'}
                    </p>
                  )}
                </div>
              </div>
              {!isEditing && customer.email && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "opacity-0 group-hover:opacity-100 transition-opacity shrink-0",
                    isDesignRole ? "h-8 w-8" : "h-7 w-7"
                  )}
                  onClick={() => {
                    window.location.href = `mailto:${customer.email}`;
                  }}
                >
                  <ExternalLink className={cn(isDesignRole ? "h-5 w-5" : "h-4 w-4")} />
                </Button>
              )}
            </div>

            {/* Địa chỉ */}
            <div className={cn("flex items-start justify-between group", isDesignRole && "gap-4")}>
              <div className={cn("flex items-start gap-3 flex-1", isDesignRole && "gap-4")}>
                <MapPin className={cn(
                  "text-muted-foreground mt-0.5 shrink-0",
                  isDesignRole ? "h-5 w-5 mt-1" : "h-4 w-4"
                )} />
                <div className="flex-1">
                  <p className={cn(
                    "text-muted-foreground mb-0.5",
                    isDesignRole ? "text-sm font-medium" : "text-xs"
                  )}>
                    Địa chỉ
                  </p>
                  {isEditing ? (
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="h-8 mt-1"
                      placeholder="Nhập địa chỉ"
                    />
                  ) : (
                    <p className={cn(
                      "font-semibold text-foreground",
                      isDesignRole ? "text-xl font-bold" : "text-base"
                    )}>
                      {customer.address || 'Chưa có địa chỉ'}
                    </p>
                  )}
                </div>
              </div>
              {!isEditing && customer.address && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "opacity-0 group-hover:opacity-100 transition-opacity shrink-0",
                    isDesignRole ? "h-8 w-8" : "h-7 w-7"
                  )}
                  onClick={() => openMap(customer.address!)}
                >
                  <ExternalLink className={cn(isDesignRole ? "h-5 w-5" : "h-4 w-4")} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
