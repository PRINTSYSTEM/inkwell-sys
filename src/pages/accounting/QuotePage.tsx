import { Helmet } from "react-helmet-async";
import { CreditCard, Clock, AlertCircle, Layers, TrendingUp } from "lucide-react";
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
        <div className="w-full h-full flex flex-col min-h-0 space-y-2.5">
          {/* Header & Inline Stats */}
          <div className="shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight">{pageTitle}</h1>
              <p className="text-muted-foreground text-xs">
                Quản lý {pageTitle.toLowerCase()} cho đơn hàng
              </p>
            </div>

            {/* Inline Stats Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-lg border bg-card px-3 py-1.5 shadow-sm flex items-center gap-2">
                <div className="p-1 rounded-md bg-info/10">
                  <Layers className="h-3.5 w-3.5 text-info" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-semibold leading-none">Đang xử lý</p>
                  <p className="text-sm font-bold leading-tight mt-0.5">{dashboardData?.totalProcessing ?? 0}</p>
                </div>
              </div>

              <div className="rounded-lg border bg-card px-3 py-1.5 shadow-sm flex items-center gap-2">
                <div className="p-1 rounded-md bg-primary/10">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-semibold leading-none">Tạo hôm nay</p>
                  <p className="text-sm font-bold leading-tight mt-0.5">{dashboardData?.createdToday ?? 0}</p>
                </div>
              </div>

              <div className="rounded-lg border bg-card px-3 py-1.5 shadow-sm flex items-center gap-2">
                <div className="p-1 rounded-md bg-warning/10">
                  <CreditCard className="h-3.5 w-3.5 text-warning" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-semibold leading-none">Chờ đặt cọc</p>
                  <p className="text-sm font-bold leading-tight mt-0.5">{dashboardData?.awaitingDeposit ?? 0}</p>
                </div>
              </div>

              <div className="rounded-lg border bg-card px-3 py-1.5 shadow-sm flex items-center gap-2">
                <div className="p-1 rounded-md bg-success/10">
                  <Clock className="h-3.5 w-3.5 text-success" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-semibold leading-none">Hoàn thành</p>
                  <p className="text-sm font-bold leading-tight mt-0.5">{(dashboardData as any)?.completed ?? 0}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <PaymentList listFilterType="" />
          </div>
        </div>
      </div>
    </>
  );
}
