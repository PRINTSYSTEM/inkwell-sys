import { Phone, MapPin, Building2, FileText, Copy, ExternalLink, User, Clock, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import type { CustomerResponse } from '@/Schema';

interface CustomerProfileProps {
  customer: CustomerResponse;
}

export function CustomerProfile({ customer }: CustomerProfileProps) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}`);
  };

  const openMap = (address: string) => {
    window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank');
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Chưa có';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Không hợp lệ';
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Thông tin khách hàng</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contact Info */}
        <div className="space-y-2.5">
          {customer.phone ? (
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{customer.phone}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => copyToClipboard(customer.phone!, 'số điện thoại')}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              <span>Chưa có số điện thoại</span>
            </div>
          )}

          {customer.email ? (
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{customer.email}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => {
                  window.location.href = `mailto:${customer.email}`;
                }}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              <span>Chưa có email</span>
            </div>
          )}

          {customer.address ? (
            <div className="flex items-start justify-between group">
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                <span className="flex-1">{customer.address}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                onClick={() => openMap(customer.address!)}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 mt-0.5" />
              <span>Chưa có địa chỉ</span>
            </div>
          )}
        </div>

        {/* Company Info - only for company type */}
        {customer.type === 'company' && (
          <>
            <Separator />
            <div className="space-y-2.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Thông tin công ty
              </p>
              
              {customer.companyName ? (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{customer.companyName}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Chưa có tên công ty</span>
                </div>
              )}

              {customer.representativeName ? (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Đại diện: {customer.representativeName}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  <span>Chưa có người đại diện</span>
                </div>
              )}

              {customer.taxCode ? (
                <div className="flex items-center justify-between group">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>MST: {customer.taxCode}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => copyToClipboard(customer.taxCode!, 'mã số thuế')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Chưa có mã số thuế</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Meta Info */}
        <Separator />
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Thông tin hệ thống
          </p>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Tạo: {formatDate(customer.createdAt)}</span>
          </div>
          
          {customer.updatedAt && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Cập nhật: {formatDate(customer.updatedAt)}</span>
            </div>
          )}

          {customer.createdBy ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span>Người tạo: {customer.createdBy.fullName || customer.createdBy.username || 'N/A'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span>Người tạo: Chưa có thông tin</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
