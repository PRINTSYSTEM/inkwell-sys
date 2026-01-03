import { Helmet } from "react-helmet-async";
import { useMemo } from "react";
import { FileText, CheckCircle } from "lucide-react";
import { InvoiceList } from "@/components/accounting";
import { useOrdersForAccounting } from "@/hooks/use-order";
import type { OrderResponse } from "@/Schema/order.schema";

// Helper to calculate summary stats from orders
const calculateInvoiceStats = (orders: OrderResponse[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const invoice = {
    notIssued: 0,
    issuedToday: 0,
  };

  orders.forEach((order) => {
    // Invoice stats
    if (order.invoiceStatus === "not_issued") {
      invoice.notIssued++;
    } else if (order.invoiceStatus === "issued" && order.updatedAt) {
      try {
        const updatedDate = new Date(order.updatedAt);
        updatedDate.setHours(0, 0, 0, 0);
        if (updatedDate.getTime() === today.getTime()) {
          invoice.issuedToday++;
        }
      } catch (e) {
        // Invalid date, skip
      }
    }
  });

  return invoice;
};

export default function InvoicePage() {
  // Fetch all orders for accounting to calculate summary stats
  const { data: allOrdersData } = useOrdersForAccounting({
    pageNumber: 1,
    pageSize: 1000, // Get all orders for stats calculation
    filterType: "invoice",
  });

  // Calculate summary stats from orders
  const summaryStats = useMemo(() => {
    if (!allOrdersData?.items) {
      return {
        notIssued: 0,
        issuedToday: 0,
      };
    }
    return calculateInvoiceStats(allOrdersData.items);
  }, [allOrdersData]);

  return (
    <>
      <Helmet>
        <title>Hóa đơn | Print Production ERP</title>
        <meta
          name="description"
          content="Quản lý xuất hóa đơn cho đơn hàng in ấn"
        />
      </Helmet>

      <div className="h-full flex flex-col overflow-hidden">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="mb-4 shrink-0 pt-6">
            <h1 className="text-2xl font-bold tracking-tight">Hóa đơn</h1>
            <p className="text-muted-foreground">
              Quản lý xuất hóa đơn cho đơn hàng
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mb-4 shrink-0">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <FileText className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Chưa xuất HĐ</p>
                  <p className="text-2xl font-bold">{summaryStats.notIssued}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Xuất hôm nay</p>
                  <p className="text-2xl font-bold">
                    {summaryStats.issuedToday}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 pb-6">
            <InvoiceList />
          </div>
        </div>
      </div>
    </>
  );
}
