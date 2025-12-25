import { ArrowLeft, Pencil, Download, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { CustomerResponse } from "@/Schema";
import {
  CustomerTypeBadge,
  DebtStatusBadge,
} from "@/components/accounting/StatusBadges";

interface CustomerHeaderProps {
  customer: CustomerResponse;
  onEdit: () => void;
  onExportDebt: () => void;
}

export function CustomerHeader({
  customer,
  onEdit,
  onExportDebt,
}: CustomerHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-10 bg-background border-b">
      <div className="px-6 py-3">
        {/* Breadcrumb */}

        {/* Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">
                  {customer.name || customer.companyName || "Chưa có tên"}
                </h1>
                {customer.code && (
                  <span className="text-sm text-muted-foreground">
                    ({customer.code})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <CustomerTypeBadge type={customer.type} />
                <DebtStatusBadge status={customer.debtStatus} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-1.5" />
              Sửa
            </Button>
            <Button variant="outline" size="sm" onClick={onExportDebt}>
              <Download className="h-4 w-4 mr-1.5" />
              Xuất công nợ
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/orders/new?customerId=" + customer.id)}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Tạo đơn hàng
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
