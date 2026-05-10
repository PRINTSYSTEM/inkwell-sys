import {
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  Briefcase,
  Copy,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { VendorResponse } from "@/Schema";
import { getVendorTypeLabel } from "@/lib/status-utils";

interface VendorProfileProps {
  vendor: VendorResponse;
}

export function VendorProfile({ vendor }: VendorProfileProps) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}`);
  };

  const openMap = (address: string) => {
    window.open(
      `https://maps.google.com/?q=${encodeURIComponent(address)}`,
      "_blank"
    );
  };

  return (
    <Card className="h-fit shadow-sm border-0 bg-transparent sm:bg-card sm:border">
      <CardHeader className="pb-4 hidden sm:block">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            Thông tin nhà cung cấp
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 sm:pt-0 pt-6">
        {/* Thông tin cơ bản */}
        <div className="space-y-4">
          <p className="font-semibold text-foreground uppercase tracking-wide text-sm">
            Thông tin cơ bản
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-muted-foreground mb-0.5 text-xs">
                  Tên nhà cung cấp
                </p>
                <p className="font-semibold text-foreground text-base">
                  {vendor.name || "Chưa có tên"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-muted-foreground mb-0.5 text-xs">
                  Loại nhà cung cấp
                </p>
                <p className="font-semibold text-foreground text-base">
                  {getVendorTypeLabel(vendor.vendorType)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-muted-foreground mb-0.5 text-xs">
                  Công nợ hiện tại
                </p>
                <p
                  className={cn(
                    "font-semibold text-base",
                    (vendor.currentDebt ?? 0) > 0
                      ? "text-red-600"
                      : "text-green-600"
                  )}
                >
                  {(vendor.currentDebt ?? 0).toLocaleString("vi-VN")} ₫
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-2">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-muted-foreground mb-0.5 text-xs">Ghi chú</p>
                <p className="font-semibold text-foreground text-base whitespace-pre-wrap">
                  {vendor.note || "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Thông tin liên hệ */}
        <div className="space-y-4">
          <p className="font-semibold text-foreground uppercase tracking-wide text-sm">
            Thông tin liên hệ
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-3 flex-1">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <p className="text-muted-foreground mb-0.5 text-xs">
                    Số điện thoại
                  </p>
                  <p className="font-semibold text-foreground text-base">
                    {vendor.phone || "Chưa có số điện thoại"}
                  </p>
                </div>
              </div>
              {vendor.phone && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={() => copyToClipboard(vendor.phone!, "số điện thoại")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-3 flex-1">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <p className="text-muted-foreground mb-0.5 text-xs">Email</p>
                  <p className="font-semibold text-foreground text-base">
                    {vendor.email || "Chưa có email"}
                  </p>
                </div>
              </div>
              {vendor.email && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={() => {
                    window.location.href = `mailto:${vendor.email}`;
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="flex items-start justify-between group">
              <div className="flex items-start gap-3 flex-1">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-muted-foreground mb-0.5 text-xs">Địa chỉ</p>
                  <p className="font-semibold text-foreground text-base">
                    {vendor.address || "Chưa có địa chỉ"}
                  </p>
                </div>
              </div>
              {vendor.address && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={() => openMap(vendor.address!)}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
