import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { Truck, Package, Clock } from "lucide-react";
import { DeliveryList } from "@/components/accounting";
import { useOrdersForAccounting } from "@/hooks/use-order";
import type { OrderResponse } from "@/Schema/order.schema";
import { useMemo } from "react";

// Helper to calculate summary stats from orders
const calculateDeliveryStats = (orders: OrderResponse[]) => {
  const delivery = {
    readyForDelivery: 0,
    delivering: 0,
    delivered: 0,
  };

  orders.forEach((order) => {
    const status = order.status || "";
    if (status === "production_completed") {
      delivery.readyForDelivery++;
    } else if (status === "delivering") {
      delivery.delivering++;
    } else if (status === "completed") {
      delivery.delivered++;
    }
  });

  return delivery;
};

export default function DeliveryPage() {
  // Fetch orders with reasonable page size for stats calculation
  // We only need enough data to get accurate stats, not all orders
  const { data: allOrdersData } = useOrdersForAccounting({
    pageNumber: 1,
    pageSize: 100, // Reduced from 1000 - enough for stats calculation
    filterType: "delivery",
  });

  // Calculate summary stats from orders
  const summaryStats = useMemo(() => {
    if (!allOrdersData?.items) {
      return {
        readyForDelivery: 0,
        delivering: 0,
        delivered: 0,
      };
    }
    return calculateDeliveryStats(allOrdersData.items);
  }, [allOrdersData]);

  return (
    <>
      <Helmet>
        <title>Giao hàng | Print Production ERP</title>
        <meta
          name="description"
          content="Quản lý giao hàng và xuất phiếu giao hàng cho đơn hàng in ấn"
        />
      </Helmet>

      <div className="container mx-auto py-6 px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Giao hàng</h1>
          <p className="text-muted-foreground">
            Quản lý giao hàng và xuất phiếu giao hàng cho đơn hàng đã hoàn thành
            sản xuất
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Package className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sẵn sàng giao</p>
                <p className="text-2xl font-bold">
                  {summaryStats.readyForDelivery}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <Truck className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đang giao</p>
                <p className="text-2xl font-bold">{summaryStats.delivering}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Clock className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đã giao</p>
                <p className="text-2xl font-bold">{summaryStats.delivered}</p>
              </div>
            </div>
          </div>
        </div>

        <DeliveryList />
      </div>
    </>
  );
}
