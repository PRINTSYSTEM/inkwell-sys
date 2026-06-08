import { Helmet } from "react-helmet-async";
import { useMemo } from "react";
import { CreditCard, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { PaymentList } from "@/components/accounting";
import { useOrdersForAccounting } from "@/hooks/use-order";
import type { OrderResponse } from "@/Schema/order.schema";
// Note: This page is accounting-only (Thanh toán)

// Helper to calculate summary stats from orders
const calculateSummaryStats = (orders: OrderResponse[]) => {
  const now = new Date();

  const payment = {
    pending: 0,
    pendingAmount: 0,
    overdueCount: 0,
  };

  orders.forEach((order) => {
    if (order.isDebtApproved === true) return;

    const totalAmount = order.totalAmount || 0;
    const depositAmount = order.depositAmount || 0;
    const remaining = totalAmount - depositAmount;

    // Payment stats
    if (remaining > 0) {
      payment.pending++;
      payment.pendingAmount += remaining;

      // Check if overdue (delivery date passed)
      if (order.deliveryDate) {
        try {
          const deliveryDate = new Date(order.deliveryDate);
          if (deliveryDate < now) {
            payment.overdueCount++;
          }
        } catch (e) {
          // Invalid date, skip
        }
      }
    }
  });

  return payment;
};

export default function PaymentPage() {
  const pageTitle = "Thanh toán";

  // Build params for API
  const ordersParams = useMemo(() => {
    return {
      pageNumber: 1,
      pageSize: 100, // Get all orders for stats calculation
      filterType: "payment",
      status: "",
      orderCode: "",
      designCode: "",
      customerName: "",
      sortColumn: "",
      sortOrder: "",
    };
  }, []);

  // Fetch all orders for accounting to calculate summary stats
  const { data: allOrdersData } = useOrdersForAccounting(ordersParams);

  // Calculate summary stats from orders
  const summaryStats = useMemo(() => {
    if (!allOrdersData?.items) {
      return {
        pending: 0,
        pendingAmount: 0,
        overdueCount: 0,
      };
    }
    return calculateSummaryStats(allOrdersData.items);
  }, [allOrdersData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  };

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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 shrink-0">
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-warning/10">
                  <Clock className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Chờ thanh toán
                  </p>
                  <p className="text-xl font-bold">{summaryStats.pending}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-info/10">
                  <TrendingUp className="h-4 w-4 text-info" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tổng còn nợ</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(summaryStats.pendingAmount)}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-destructive/10">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Quá hạn</p>
                  <p className="text-xl font-bold">
                    {summaryStats.overdueCount}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <PaymentList />
          </div>
        </div>
      </div>
    </>
  );
}
