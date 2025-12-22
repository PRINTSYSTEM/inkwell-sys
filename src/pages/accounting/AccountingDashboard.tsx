import { Helmet } from "react-helmet-async";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  CreditCard,
  FileText,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { PaymentList, InvoiceList } from "@/components/accounting";
import { useOrdersForAccounting } from "@/hooks/use-order";
import { useMemo } from "react";

// Helper to calculate summary stats from orders
const calculateSummaryStats = (orders: any[]) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const payment = {
    pending: 0,
    pendingAmount: 0,
    overdueCount: 0,
  };

  const invoice = {
    notIssued: 0,
    issuedToday: 0,
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

    // Invoice stats
    if (order.invoiceStatus === "not_issued") {
      invoice.notIssued++;
    } else if (order.invoiceStatus === "issued" && order.updatedAt) {
      try {
        const updatedDate = new Date(order.updatedAt);
        if (updatedDate >= today) {
          invoice.issuedToday++;
        }
      } catch (e) {
        // Invalid date, skip
      }
    }
  });

  return { payment, invoice };
};

export default function Accounting() {
  // Fetch all orders for accounting to calculate summary stats
  const { data: allOrdersData } = useOrdersForAccounting({
    pageNumber: 1,
    pageSize: 1000, // Get all orders for stats calculation
  });

  // Calculate summary stats from orders
  const summaryStats = useMemo(() => {
    if (!allOrdersData?.items) {
      return {
        payment: { pending: 0, pendingAmount: 0, overdueCount: 0 },
        invoice: { notIssued: 0, issuedToday: 0 },
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
        <title>Kế toán | Print Production ERP</title>
        <meta
          name="description"
          content="Quản lý thanh toán và hóa đơn cho đơn hàng in ấn"
        />
      </Helmet>

      <div className="container mx-auto py-6 px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Kế toán</h1>
          <p className="text-muted-foreground">
            Quản lý thanh toán và xuất hóa đơn cho đơn hàng
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="payment" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="payment" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Thanh toán
            </TabsTrigger>
            <TabsTrigger value="invoice" className="gap-2">
              <FileText className="h-4 w-4" />
              Hóa đơn
            </TabsTrigger>
          </TabsList>

          {/* Payment Tab */}
          <TabsContent value="payment" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-warning/10">
                    <Clock className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Chờ thanh toán
                    </p>
                    <p className="text-2xl font-bold">
                      {summaryStats.payment.pending}
                    </p>
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
                      {formatCurrency(summaryStats.payment.pendingAmount)}
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
                      {summaryStats.payment.overdueCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <PaymentList />
          </TabsContent>

          {/* Invoice Tab */}
          <TabsContent value="invoice" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-warning/10">
                    <FileText className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Chưa xuất HĐ
                    </p>
                    <p className="text-2xl font-bold">
                      {summaryStats.invoice.notIssued}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <CheckCircle className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Xuất hôm nay
                    </p>
                    <p className="text-2xl font-bold">
                      {summaryStats.invoice.issuedToday}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <InvoiceList />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
