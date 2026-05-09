import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  CheckCircle2,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { useVendor, useUpdateVendor } from "@/hooks/use-vendor";
import type { UpdateVendorRequest } from "@/Schema/vendor.schema";
import { vendorTypeLabels } from "@/lib/status-utils";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function VendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const vendorId = id ? parseInt(id, 10) : null;
  const navigate = useNavigate();
  const { data: vendor, isLoading } = useVendor(vendorId, !!vendorId);



  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/vendors")}
              className="gap-2 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Quay lại</span>
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-balance">
                Chi tiết nhà cung cấp
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Xem thông tin hồ sơ nhà cung cấp
              </p>
            </div>
            <Sparkles className="h-6 w-6 text-accent hidden sm:block" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="border shadow-sm">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Thông tin nhà cung cấp</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Xem thông tin chi tiết của nhà cung cấp
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Tên nhà cung cấp</Label>
                <p className="font-medium text-base">{vendor?.name || "—"}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Loại nhà cung cấp</Label>
                <p className="font-medium text-base">
                  {vendor?.vendorType ? vendorTypeLabels[vendor.vendorType] || vendor.vendorType : "—"}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground flex items-center">
                  <Phone className="h-3.5 w-3.5 mr-1.5" />
                  Số điện thoại
                </Label>
                <p className="font-medium text-base">{vendor?.phone || "—"}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground flex items-center">
                  <Mail className="h-3.5 w-3.5 mr-1.5" />
                  Email
                </Label>
                <p className="font-medium text-base">{vendor?.email || "—"}</p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-muted-foreground flex items-center">
                  <MapPin className="h-3.5 w-3.5 mr-1.5" />
                  Địa chỉ
                </Label>
                <p className="font-medium text-base">{vendor?.address || "—"}</p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-muted-foreground flex items-center">
                  <FileText className="h-3.5 w-3.5 mr-1.5" />
                  Ghi chú
                </Label>
                <p className="font-medium text-base whitespace-pre-wrap">{vendor?.note || "—"}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/vendors")}
                className="cursor-pointer"
              >
                Quay lại
              </Button>
              <Button
                type="button"
                onClick={() => navigate(`/vendors/${vendorId}/edit`)}
                className="cursor-pointer min-w-[140px]"
              >
                Chỉnh sửa
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
