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
  CustomerProfile,
  DebtTab,
  OrdersTab,
  FavoritesTab,
  InvoicesTab,
  AddressesTab,
  EditCustomerModal,
  ExportDebtModal,
} from "@/components/customers";
import { CreateCashReceiptDialog } from "@/components/customers/CreateCashReceiptDialog";

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
  const [cashReceiptModalOpen, setCashReceiptModalOpen] = useState(false);

  // Chỉ role accounting và admin mới thấy các section khác
  // Role design và proofer (bình bài) chỉ thấy thông tin khách hàng, công ty, hệ thống
  const canViewFinancialInfo =
    userRole === ROLE.ACCOUNTING ||
    userRole === ROLE.ACCOUNTING_LEAD ||
    userRole === ROLE.SALE ||
    userRole === ROLE.ADMIN;

  // Only fetch when customerId is valid
  const {
    data: customer,
    isLoading,
    error,
  } = useCustomer(customerId, !!customerId);

  if (isLoading) {
    return (
      <div className="h-full bg-background">
        <div className="p-6 space-y-4">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-[300px_1fr] gap-6">
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
          onCreateCashReceipt={
            canViewFinancialInfo
              ? () => setCashReceiptModalOpen(true)
              : undefined
          }
          canViewFinancialInfo={canViewFinancialInfo}
        />

        {/* Body */}
        <div
          className={cn(
            "flex-1 overflow-hidden",
            canViewFinancialInfo ? "pt-1 px-3 pb-3" : "pt-1 px-3 pb-3 overflow-y-auto"
          )}
        >
          {canViewFinancialInfo ? (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col min-w-0 overflow-hidden h-full"
            >
              {/* Tab Triggers */}
              <TabsList className="w-fit mb-2 flex-shrink-0">
                <TabsTrigger
                  value="overview"
                  className="text-sm data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-colors"
                >
                  Tổng quan
                </TabsTrigger>
                <TabsTrigger
                  value="debt"
                  className="text-sm data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-colors"
                >
                  Công nợ
                </TabsTrigger>
                <TabsTrigger
                  value="invoices"
                  className="text-sm data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-colors"
                >
                  Hóa đơn
                </TabsTrigger>
                <TabsTrigger
                  value="orders"
                  className="text-sm data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-colors"
                >
                  Đơn hàng
                </TabsTrigger>
                <TabsTrigger
                  value="favorites"
                  className="text-sm data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-colors"
                >
                  Ưa thích
                </TabsTrigger>
              </TabsList>

              {/* Tab Contents */}
              {activeTab === "overview" ? (
                /* Layout 2 cột cho tab Tổng quan: Left: Profile, Right: Addresses */
                <div className="grid grid-cols-[370px_1fr] gap-3 flex-1 min-h-0 overflow-hidden">
                  {/* Left Column: Profile */}
                  <CustomerProfile customer={customer} isExpanded={true} />

                  {/* Right Column: Addresses */}
                  <div className="flex flex-col min-w-0 overflow-hidden h-full">
                    <TabsContent
                      value="overview"
                      className="flex-1 mt-0 overflow-hidden h-full animate-none"
                    >
                      <AddressesTab
                        customerId={customerId}
                        isActive={activeTab === "overview"}
                      />
                    </TabsContent>
                  </div>
                </div>
              ) : (
                /* Layout 1 cột full width cho các tab khác */
                <div className="flex-1 min-h-0 overflow-hidden w-full h-full">
                  <TabsContent
                    value="debt"
                    className="flex-1 mt-0 overflow-hidden h-full"
                  >
                    <DebtTab
                      customerId={customerId}
                      isActive={activeTab === "debt"}
                    />
                  </TabsContent>

                  <TabsContent
                    value="invoices"
                    className="flex-1 mt-0 min-w-0 overflow-hidden h-full"
                  >
                    <InvoicesTab
                      customerId={customerId}
                      isActive={activeTab === "invoices"}
                    />
                  </TabsContent>

                  <TabsContent
                    value="orders"
                    className="flex-1 mt-0 min-w-0 overflow-hidden h-full"
                  >
                    {customerId && (
                      <OrdersTab
                        customerId={customerId}
                        isActive={activeTab === "orders"}
                      />
                    )}
                  </TabsContent>

                  <TabsContent
                    value="favorites"
                    className="flex-1 mt-0 overflow-hidden h-full"
                  >
                    <FavoritesTab
                      customerId={customerId}
                      isActive={activeTab === "favorites"}
                    />
                  </TabsContent>
                </div>
              )}
            </Tabs>
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
      {canViewFinancialInfo && (
        <CreateCashReceiptDialog
          open={cashReceiptModalOpen}
          onOpenChange={setCashReceiptModalOpen}
          customerId={customerId}
          customerName={customer.name || customer.companyName || "Khách hàng"}
        />
      )}
    </>
  );
}
