import { ArrowLeft, Pencil, Download, Plus, RefreshCw, Loader2 } from "lucide-react";
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
import { StatusBadge } from "../ui/status-badge";
import { debtStatusLabels } from "@/lib/status-utils";

interface CustomerHeaderProps {
  customer: CustomerResponse;
  onEdit: () => void;
  onExportDebt: () => void;
  onCreateCashReceipt?: () => void;
  onRecalculateDebt?: () => void;
  isRecalculatingDebt?: boolean;
  canViewFinancialInfo?: boolean;
}

export function CustomerHeader({
  customer,
  onEdit,
  onExportDebt,
  onCreateCashReceipt,
  onRecalculateDebt,
  isRecalculatingDebt = false,
  canViewFinancialInfo = true,
}: CustomerHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-10 bg-background border-b shrink-0">
      <div className="px-6 py-1.5">
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
                <h1 className="text-base font-semibold">
                  {customer.name ?? customer.companyName ?? "Chưa có tên"}
                </h1>
                {customer.code && (
                  <span className="text-xs text-muted-foreground">
                    ({customer.code})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <CustomerTypeBadge type={customer.type ?? undefined} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-1.5" />
              Cập nhật thông tin
            </Button>
            {canViewFinancialInfo && (
              <>
                {onRecalculateDebt && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRecalculateDebt}
                    disabled={isRecalculatingDebt}
                    title="Đồng bộ lại công nợ chính xác từ sổ chi tiết"
                  >
                    {isRecalculatingDebt ? (
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-1.5" />
                    )}
                    Đồng bộ công nợ
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={onExportDebt}>
                  <Download className="h-4 w-4 mr-1.5" />
                  Xuất công nợ
                </Button>
                {onCreateCashReceipt && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onCreateCashReceipt}
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Tạo phiếu thu
                  </Button>
                )}
              </>
            )}
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
