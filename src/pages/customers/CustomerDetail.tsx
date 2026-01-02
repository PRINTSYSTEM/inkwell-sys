import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useCustomer, useCustomerOrders } from "@/hooks/use-customer";
import { useAuth } from "@/hooks";
import { ROLE } from "@/constants";
import {
  CustomerHeader,
  CustomerSummary,
  CustomerProfile,
  DebtTab,
  OrdersTab,
  FavoritesTab,
  EditCustomerModal,
  ExportDebtModal,
} from "@/components/customers";

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const userRole = user?.role;

  // Validate and parse customer ID
  const customerId =
    id && !isNaN(Number(id)) && Number(id) > 0 ? Number(id) : null;

  const [activeTab, setActiveTab] = useState("debt");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Chỉ role accounting và admin mới thấy các section khác
  // Role design và proofer (bình bài) chỉ thấy thông tin khách hàng, công ty, hệ thống
  const canViewFinancialInfo =
    userRole === ROLE.ACCOUNTING ||
    userRole === ROLE.ACCOUNTING_LEAD ||
    userRole === ROLE.ADMIN;

  // Only fetch when customerId is valid
  const {
    data: customer,
    isLoading,
    error,
  } = useCustomer(customerId, !!customerId);

  // Only fetch orders for summary stats, not for the orders tab (which fetches its own)
  const { data: ordersData } = useCustomerOrders({
    customerId: customerId || 0, // Will be disabled if customerId is null
    pageSize: 10, // Reduced from 100 since we only need summary stats
    pageNumber: 1,
    enabled: !!customerId, // Only fetch when customerId is valid
  });

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    if (!ordersData || !ordersData.items || ordersData.items.length === 0) {
      return {
        totalOrders: 0,
        ordersThisMonth: 0,
        totalRevenue: 0,
        lastOrderDate: null,
      };
    }

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const ordersThisMonth = ordersData.items.filter((o) => {
      if (!o.createdAt) return false;
      const d = new Date(o.createdAt);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).length;

    const totalRevenue = ordersData.items.reduce(
      (sum, o) => sum + (o.totalAmount || 0),
      0
    );
    const lastOrderDate = ordersData.items[0]?.createdAt || null;

    return {
      totalOrders: ordersData.total || 0,
      ordersThisMonth,
      totalRevenue,
      lastOrderDate,
    };
  }, [ordersData]);

  if (isLoading) {
    return (
      <div className="h-full bg-background">
        <div className="p-6 space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-[380px_1fr] gap-6">
            <Skeleton className="h-[400px]" />
            <Skeleton className="h-[400px]" />
          </div>
        </div>
      </div>
    );
  }

  // Show error early if ID is invalid
  if (!customerId) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-foreground">
            ID khách hàng không hợp lệ
          </p>
          <p className="text-sm text-muted-foreground">
            Vui lòng kiểm tra lại đường dẫn URL
          </p>
        </div>
      </div>
    );
  }

  if (error || (!isLoading && !customer)) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-foreground">
            Không tìm thấy khách hàng
          </p>
          <p className="text-sm text-muted-foreground">
            Khách hàng với ID {customerId} không tồn tại hoặc đã bị xóa
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {customer.name || customer.code} - Khách hàng | Print System
        </title>
      </Helmet>

      <div className="h-full bg-background flex flex-col overflow-hidden">
        {/* Sticky Header */}
        <CustomerHeader
          customer={customer}
          onEdit={() => setEditModalOpen(true)}
          onExportDebt={() => setExportModalOpen(true)}
          canViewFinancialInfo={canViewFinancialInfo}
        />

        {/* Summary Strip - chỉ hiển thị cho accounting và admin */}
        {canViewFinancialInfo && (
          <CustomerSummary
            customer={customer}
            totalOrders={summaryStats.totalOrders}
            ordersThisMonth={summaryStats.ordersThisMonth}
            totalRevenue={summaryStats.totalRevenue}
            lastOrderDate={summaryStats.lastOrderDate}
            onTabChange={setActiveTab}
          />
        )}

        {/* Body */}
        <div
          className={cn(
            "flex-1 overflow-hidden",
            canViewFinancialInfo ? "p-6" : "p-6 overflow-y-auto"
          )}
        >
          {canViewFinancialInfo ? (
            /* Layout 2 cột cho accounting và admin */
            <div className="grid grid-cols-[380px_1fr] gap-6 h-full">
              {/* Left Column: Profile */}
              <CustomerProfile customer={customer} />

              {/* Right Column: Tabs */}
              <div className="flex flex-col min-w-0 overflow-hidden">
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="flex-1 flex flex-col min-w-0 overflow-hidden"
                >
                  <TabsList className="w-fit mb-3 flex-shrink-0">
                    <TabsTrigger value="debt" className="text-sm">
                      Công nợ
                    </TabsTrigger>
                    <TabsTrigger value="orders" className="text-sm">
                      Đơn hàng
                    </TabsTrigger>
                    <TabsTrigger value="favorites" className="text-sm">
                      Ưa thích
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="debt"
                    className="flex-1 mt-0 overflow-hidden"
                  >
                    <DebtTab
                      customerId={customerId}
                      isActive={activeTab === "debt"}
                    />
                  </TabsContent>

                  <TabsContent
                    value="orders"
                    className="flex-1 mt-0 min-w-0 overflow-hidden"
                  >
                    <OrdersTab customerId={customerId} />
                  </TabsContent>

                  <TabsContent
                    value="favorites"
                    className="flex-1 mt-0 overflow-hidden"
                  >
                    <FavoritesTab
                      customerId={customerId}
                      isActive={activeTab === "favorites"}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          ) : (
            /* Layout 1 cột cho design và prepress - chỉ hiển thị profile */
            <div className="max-w-4xl mx-auto w-full h-full flex flex-col">
              <CustomerProfile customer={customer} isDesignRole={true} />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <EditCustomerModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        customer={customer}
      />
      <ExportDebtModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        customerId={customerId}
      />
    </>
  );
}
