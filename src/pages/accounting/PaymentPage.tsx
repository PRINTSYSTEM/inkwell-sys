import { Helmet } from "react-helmet-async";
import { useMemo } from "react";
import { CreditCard, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { PaymentList } from "@/components/accounting";
import { useOrdersForAccounting } from "@/hooks/use-order";
import type { OrderResponse } from "@/Schema/order.schema";

// Helper to calculate summary stats from orders
const calculateSummaryStats = (orders: OrderResponse[]) => {
  const now = new Date();

  const payment = {
    pending: 0,
    pendingAmount: 0,
    overdueCount: 0,
  };

  orders.forEach((order) => {
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
  // Fetch all orders for accounting to calculate summary stats
  const { data: allOrdersData } = useOrdersForAccounting({
    pageNumber: 1,
    pageSize: 1000, // Get all orders for stats calculation
    filterType: "payment",
  });

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
        <title>Thanh toán | Print Production ERP</title>
        <meta
          name="description"
          content="Quản lý thanh toán cho đơn hàng in ấn"
        />
      </Helmet>

      <div className="container mx-auto py-6 px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Thanh toán</h1>
          <p className="text-muted-foreground">
            Quản lý thanh toán cho đơn hàng
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Chờ thanh toán</p>
                <p className="text-2xl font-bold">{summaryStats.pending}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <TrendingUp className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng còn nợ</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(summaryStats.pendingAmount)}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quá hạn</p>
                <p className="text-2xl font-bold">
                  {summaryStats.overdueCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        <PaymentList />
      </div>
    </>
  );
}
