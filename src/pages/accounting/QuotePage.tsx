import { Helmet } from "react-helmet-async";
import { CreditCard, Clock, AlertCircle, Layers } from "lucide-react";
import { PaymentList } from "@/components/accounting";
import { useSalesDashboard } from "@/hooks/use-order";

// Quote page for Sales
export default function QuotePage() {
  const pageTitle = "Báo giá";

  // Fetch sales dashboard statistics from API
  const { data: dashboardData } = useSalesDashboard();

  return (
    <>
      <Helmet>
        <title>{pageTitle} | Print Production ERP</title>
        <meta
          name="description"
          content={`Quản lý ${pageTitle.toLowerCase()} cho đơn hàng in ấn`}
        />
      </Helmet>

      <div className="h-full flex flex-col overflow-hidden">
        <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
          {/* Header */}
          <div className="mb-3 shrink-0">
            <h1 className="text-2xl font-bold tracking-tight">{pageTitle}</h1>
            <p className="text-muted-foreground text-sm">
              Quản lý {pageTitle.toLowerCase()} cho đơn hàng
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3 shrink-0">
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-info/10">
                  <Layers className="h-4 w-4 text-info" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Tổng đơn đang xử lý</p>
                  <p className="text-xl font-bold">{dashboardData?.totalProcessing ?? 0}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Đơn tạo hôm nay</p>
                  <p className="text-xl font-bold">{dashboardData?.createdToday ?? 0}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-warning/10">
                  <CreditCard className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Đơn chờ đặt cọc</p>
                  <p className="text-xl font-bold">{dashboardData?.awaitingDeposit ?? 0}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-success/10">
                  <Clock className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Tổng đơn hoàn thành</p>
                  <p className="text-xl font-bold">{dashboardData?.completed ?? 0}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <PaymentList listFilterType="" />
          </div>
        </div>
      </div>
    </>
  );
}
