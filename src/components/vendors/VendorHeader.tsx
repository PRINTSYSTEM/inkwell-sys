import { ArrowLeft, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VendorResponse } from "@/Schema";
import { getVendorTypeLabel } from "@/lib/status-utils";

interface VendorHeaderProps {
  vendor: VendorResponse;
  onEdit: () => void;
}

export function VendorHeader({ vendor, onEdit }: VendorHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-10 bg-background border-b shrink-0">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/vendors")}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">
                  {vendor.name || "Chưa có tên"}
                </h1>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary">
                  {getVendorTypeLabel(vendor.vendorType)}
                </div>
                <div
                  className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    vendor.isActive
                      ? "border-transparent bg-green-100 text-green-700"
                      : "border-transparent bg-secondary text-secondary-foreground"
                  )}
                >
                  {vendor.isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-1.5" />
              Cập nhật thông tin
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
