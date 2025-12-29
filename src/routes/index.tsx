// src/router/index.tsx
import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import { AuthGuard } from "@/guards/AuthGuard";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ROUTE_PATHS } from "@/constants";
import CreateCustomer from "@/pages/customers/CreateCustomer";
import ProductionDetailPage from "@/pages/production/ProductionDetail";

// ================== Lazy imports ==================
const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/dashboard/DashboardPage"));

// Design
const AllDesigns = lazy(() => import("@/pages/design/AllDesignsPage"));
const MyWorkPage = lazy(() => import("@/pages/design/MyWorkPage"));
const DesignDetailPage = lazy(
  () => import("@/pages/design/detail/DesignDetailPage")
);
const DesignManagement = lazy(() => import("@/pages/design/Designers"));
const DesignerDetailPage = lazy(
  () => import("@/pages/design/DesignerDetailView")
);

// Orders
const Orders = lazy(() => import("@/pages/orders/OrderList"));
const OrderDetail = lazy(() => import("@/pages/orders/OrderDetail"));
const CreateOrder = lazy(() => import("@/pages/orders/OrderCreate"));

// Customers
const Customers = lazy(() => import("@/pages/customers/CustomerList"));
const CustomerDetail = lazy(() => import("@/pages/customers/CustomerDetail"));

// Design types
const DesignTypes = lazy(() => import("@/pages/design-types/DesignTypeList"));

// Proofing (prepress)
const ProofingList = lazy(() => import("@/pages/prepress/PrepressList"));
const ProofingCreate = lazy(() => import("@/pages/prepress/ProofingCreate"));
const ProofingCreatePrintOrder = lazy(
  () => import("@/pages/prepress/CreatePrintOrder")
);

// Proofing
const ProofingDetail = lazy(() => import("@/pages/prepress/PrepressDetail"));

const ProofingCheck = lazy(() => import("@/pages/prepress/PrepressCheck"));
const ProofingOutput = lazy(() => import("@/pages/prepress/PrepressOutput"));

// Production
const Production = lazy(() => import("@/pages/production/ProductionList"));

// Inventory / Materials
const Inventory = lazy(() => import("@/pages/inventory/InventoryPage"));
const InventoryDetail = lazy(
  () => import("@/pages/inventory/InventoryDetailPage")
);
const CreateMaterial = lazy(
  () => import("@/pages/inventory/CreateInventoryPage")
);
const ProductTemplates = lazy(
  () => import("@/pages/inventory/ProductTemplatesPage")
);

// Stock Management
const StockInList = lazy(() => import("@/pages/stock/StockInList"));
const StockInCreate = lazy(() => import("@/pages/stock/StockInCreate"));
const StockOutList = lazy(() => import("@/pages/stock/StockOutList"));
const StockOutCreate = lazy(() => import("@/pages/stock/StockOutCreate"));

// Vendors
const VendorList = lazy(() => import("@/pages/vendors/VendorList"));

const PaymentPage = lazy(() => import("@/pages/accounting/PaymentPage"));
const InvoicePage = lazy(() => import("@/pages/accounting/InvoicePage"));
const DeliveryPage = lazy(() => import("@/pages/accounting/DeliveryPage"));
const AccountingOrderDetail = lazy(
  () => import("@/pages/accounting/AccountingOrderDetail")
);
const AccountingDebtReport = lazy(
  () => import("@/pages/accounting/AccountingDebtReport")
);
const AccountingRevenue = lazy(
  () => import("@/pages/accounting/AccountingRevenue")
);
const AccountingExpenses = lazy(
  () => import("@/pages/accounting/AccountingExpenses")
);

// Cash Management
const CashPaymentList = lazy(
  () => import("@/pages/accounting/cash/CashPaymentListPage")
);
const CashPaymentDetail = lazy(
  () => import("@/pages/accounting/cash/CashPaymentDetailPage")
);
const CashFundList = lazy(
  () => import("@/pages/accounting/cash/CashFundListPage")
);
const CashReceiptList = lazy(
  () => import("@/pages/accounting/cash/CashReceiptListPage")
);
const CashReceiptDetail = lazy(
  () => import("@/pages/accounting/cash/CashReceiptDetailPage")
);
const CashBook = lazy(() => import("@/pages/accounting/cash/CashBookPage"));

// Bank Management
const BankAccountList = lazy(
  () => import("@/pages/accounting/bank/BankAccountListPage")
);
const BankLedger = lazy(() => import("@/pages/accounting/bank/BankLedgerPage"));

// AR/AP
const ARSummary = lazy(() => import("@/pages/accounting/ar/ARSummaryPage"));
const ARDetail = lazy(() => import("@/pages/accounting/ar/ARDetailPage"));
const ARAging = lazy(() => import("@/pages/accounting/ar/ARAgingPage"));
const APSummary = lazy(() => import("@/pages/accounting/ap/APSummaryPage"));
const APDetail = lazy(() => import("@/pages/accounting/ap/APDetailPage"));
const APAging = lazy(() => import("@/pages/accounting/ap/APAgingPage"));
const CollectionSchedule = lazy(
  () => import("@/pages/accounting/CollectionSchedulePage")
);

// Expense & Payment Method
const ExpenseCategoryList = lazy(
  () => import("@/pages/accounting/expense/ExpenseCategoryListPage")
);
const PaymentMethodList = lazy(
  () => import("@/pages/accounting/payment-method/PaymentMethodListPage")
);

// Inventory Reports
const CurrentStock = lazy(
  () => import("@/pages/reports/inventory/CurrentStockPage")
);
const InventorySummary = lazy(
  () => import("@/pages/reports/inventory/InventorySummaryPage")
);
const LowStock = lazy(() => import("@/pages/reports/inventory/LowStockPage"));
const SlowMoving = lazy(
  () => import("@/pages/reports/inventory/SlowMovingPage")
);
const StockCard = lazy(() => import("@/pages/reports/inventory/StockCardPage"));

// Sales Reports
const SalesByPeriod = lazy(
  () => import("@/pages/reports/sales/SalesByPeriodPage")
);
const SalesByCustomer = lazy(
  () => import("@/pages/reports/sales/SalesByCustomerPage")
);
const SalesByDimension = lazy(
  () => import("@/pages/reports/sales/SalesByDimensionPage")
);
const TopProducts = lazy(() => import("@/pages/reports/sales/TopProductsPage"));
const ReturnsDiscounts = lazy(
  () => import("@/pages/reports/sales/ReturnsDiscountsPage")
);
const OrderDrillDown = lazy(
  () => import("@/pages/reports/sales/OrderDrillDownPage")
);

// Report Exports
const ReportExportList = lazy(
  () => import("@/pages/reports/ReportExportListPage")
);

// Delivery Notes
const DeliveryNoteList = lazy(
  () => import("@/pages/delivery-notes/DeliveryNoteList")
);
const DeliveryNoteDetail = lazy(
  () => import("@/pages/delivery-notes/DeliveryNoteDetail")
);

// Invoices
const InvoiceList = lazy(() => import("@/pages/invoices/InvoiceList"));
const InvoiceDetail = lazy(() => import("@/pages/invoices/InvoiceDetail"));

// Attendance
const Attendance = lazy(() => import("@/pages/Attendance"));
const AttendanceReports = lazy(
  () => import("@/pages/attendance/AttendanceReports")
);

// Reports / Notifications
const NotificationCenter = lazy(
  () => import("@/pages/notifications/NotificationCenter")
);

// Misc
const NotFound = lazy(() => import("@/pages/NotFound"));

// ================== Helpers ==================
const lastSegment = (path: string) =>
  path.replace(/\/+$/, "").split("/").pop() || "";

// ================== Router ==================
export const router = createBrowserRouter([
  // ---- Public / Auth ----
  {
    path: ROUTE_PATHS.AUTH.LOGIN,
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <Login />
      </Suspense>
    ),
  },

  // ---- Protected app ----
  {
    path: ROUTE_PATHS.ROOT,
    element: (
      <AuthGuard>
        <DashboardLayout />
      </AuthGuard>
    ),
    children: [
      // redirect "/" -> "/dashboard"
      {
        index: true,
        element: <Navigate to={ROUTE_PATHS.DASHBOARD} replace />,
      },

      // ===== DASHBOARD =====
      {
        path: lastSegment(ROUTE_PATHS.DASHBOARD), // "dashboard"
        element: (
          <Suspense fallback={<div>Loading...</div>}>
            <Dashboard />
          </Suspense>
        ),
      },

      // ===== DESIGN =====
      {
        path: lastSegment(ROUTE_PATHS.DESIGN.ROOT), // "design"
        children: [
          {
            path: lastSegment(ROUTE_PATHS.DESIGN.ALL), // "all"
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <AllDesigns />
              </Suspense>
            ),
          },
          {
            path: lastSegment(ROUTE_PATHS.DESIGN.MY_WORK), // "my-work"
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <MyWorkPage />
              </Suspense>
            ),
          },
          {
            // /design/detail/:id  (dùng ROUTE_BUILDERS khi navigate)
            path: "detail/:id",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <DesignDetailPage />
              </Suspense>
            ),
          },
          {
            path: lastSegment(ROUTE_PATHS.DESIGN.MANAGEMENT), // "management"
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <DesignManagement />
              </Suspense>
            ),
          },
          {
            // /design/designer/:id
            path: "designer/:id",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <DesignerDetailPage />
              </Suspense>
            ),
          },
        ],
      },

      // ===== ORDERS =====
      {
        path: lastSegment(ROUTE_PATHS.ORDERS.ROOT), // "orders"
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <Orders />
              </Suspense>
            ),
          },
          {
            path: lastSegment(ROUTE_PATHS.ORDERS.NEW), // "new"
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <CreateOrder />
              </Suspense>
            ),
          },
          {
            // /orders/:id
            path: ":id",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <OrderDetail />
              </Suspense>
            ),
          },
        ],
      },

      // ===== CUSTOMERS =====
      {
        path: lastSegment(ROUTE_PATHS.CUSTOMERS.ROOT), // "customers"
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <Customers />
              </Suspense>
            ),
          },
          {
            path: lastSegment(ROUTE_PATHS.CUSTOMERS.NEW), // "new"
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <CreateCustomer />
              </Suspense>
            ),
          },
          {
            // /customers/:id
            path: ":id",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <CustomerDetail />
              </Suspense>
            ),
          },
        ],
      },

      // ===== DESIGN TYPES =====
      {
        path: lastSegment(ROUTE_PATHS.DESIGN_TYPES.ROOT), // "design-types"
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <DesignTypes />
              </Suspense>
            ),
          },
        ],
      },

      // ===== PROOFING (PREPRESS) =====
      {
        path: lastSegment(ROUTE_PATHS.PROOFING.ROOT), // "proofing"
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <ProofingList />
              </Suspense>
            ),
          },
          {
            path: lastSegment(ROUTE_PATHS.PROOFING.CREATE),
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <ProofingCreate />
              </Suspense>
            ),
          },
          {
            path: lastSegment(ROUTE_PATHS.PROOFING.CREATE_PRINT_ORDER), // "create-print-order"
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <ProofingCreatePrintOrder />
              </Suspense>
            ),
          },
          {
            path: "check",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <ProofingCheck />
              </Suspense>
            ),
          },
          {
            path: "output",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <ProofingOutput />
              </Suspense>
            ),
          },
          {
            path: ":id",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <ProofingDetail />
              </Suspense>
            ),
          },
        ],
      },

      // ===== PRODUCTION =====
      {
        path: lastSegment(ROUTE_PATHS.PRODUCTION.ROOT), // "production"
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <Production />
              </Suspense>
            ),
          },
          {
            path: lastSegment(ROUTE_PATHS.PRODUCTION.DETAIL), // "detail"
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <ProductionDetailPage />
              </Suspense>
            ),
          },
        ],
      },

      // ===== INVENTORY =====
      {
        path: lastSegment(ROUTE_PATHS.INVENTORY.ROOT), // "inventory"
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <Inventory />
              </Suspense>
            ),
          },
          {
            path: "create",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <CreateMaterial />
              </Suspense>
            ),
          },
          {
            path: "templates",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <ProductTemplates />
              </Suspense>
            ),
          },
          {
            path: ":id",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <InventoryDetail />
              </Suspense>
            ),
          },
        ],
      },

      // ===== STOCK MANAGEMENT =====
      {
        path: "stock",
        children: [
          {
            path: "stock-ins",
            children: [
              {
                index: true,
                element: (
                  <Suspense fallback={<div>Loading...</div>}>
                    <StockInList />
                  </Suspense>
                ),
              },
              {
                path: "create",
                element: (
                  <Suspense fallback={<div>Loading...</div>}>
                    <StockInCreate />
                  </Suspense>
                ),
              },
            ],
          },
          {
            path: "stock-outs",
            children: [
              {
                index: true,
                element: (
                  <Suspense fallback={<div>Loading...</div>}>
                    <StockOutList />
                  </Suspense>
                ),
              },
              {
                path: "create",
                element: (
                  <Suspense fallback={<div>Loading...</div>}>
                    <StockOutCreate />
                  </Suspense>
                ),
              },
            ],
          },
        ],
      },

      // ===== VENDORS =====
      {
        path: "vendors",
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <VendorList />
              </Suspense>
            ),
          },
        ],
      },

      // ===== ACCOUNTING =====
      {
        path: lastSegment(ROUTE_PATHS.ACCOUNTING.ROOT), // "accounting"
        children: [
          {
            path: "payment",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <PaymentPage />
              </Suspense>
            ),
          },
          {
            path: "invoice",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <InvoicePage />
              </Suspense>
            ),
          },
          {
            path: "delivery",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <DeliveryPage />
              </Suspense>
            ),
          },
          {
            path: "orders/:id",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <AccountingOrderDetail />
              </Suspense>
            ),
          },
          {
            path: "debt-report",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <AccountingDebtReport />
              </Suspense>
            ),
          },
          {
            path: "revenue",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <AccountingRevenue />
              </Suspense>
            ),
          },
          {
            path: "expenses",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <AccountingExpenses />
              </Suspense>
            ),
          },
          // Cash Management
          {
            path: "cash-payments",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <CashPaymentList />
              </Suspense>
            ),
          },
          {
            path: "cash-payments/:id",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <CashPaymentDetail />
              </Suspense>
            ),
          },
          {
            path: "cash-funds",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <CashFundList />
              </Suspense>
            ),
          },
          {
            path: "cash-receipts",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <CashReceiptList />
              </Suspense>
            ),
          },
          {
            path: "cash-receipts/:id",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <CashReceiptDetail />
              </Suspense>
            ),
          },
          {
            path: "cash-book",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <CashBook />
              </Suspense>
            ),
          },
          // Bank Management
          {
            path: "bank-accounts",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <BankAccountList />
              </Suspense>
            ),
          },
          {
            path: "bank-ledger",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <BankLedger />
              </Suspense>
            ),
          },
          // AR
          {
            path: "ar",
            children: [
              {
                path: "summary",
                element: (
                  <Suspense fallback={<div>Loading...</div>}>
                    <ARSummary />
                  </Suspense>
                ),
              },
              {
                path: "detail",
                element: (
                  <Suspense fallback={<div>Loading...</div>}>
                    <ARDetail />
                  </Suspense>
                ),
              },
              {
                path: "aging",
                element: (
                  <Suspense fallback={<div>Loading...</div>}>
                    <ARAging />
                  </Suspense>
                ),
              },
            ],
          },
          // AP
          {
            path: "ap",
            children: [
              {
                path: "summary",
                element: (
                  <Suspense fallback={<div>Loading...</div>}>
                    <APSummary />
                  </Suspense>
                ),
              },
              {
                path: "detail",
                element: (
                  <Suspense fallback={<div>Loading...</div>}>
                    <APDetail />
                  </Suspense>
                ),
              },
              {
                path: "aging",
                element: (
                  <Suspense fallback={<div>Loading...</div>}>
                    <APAging />
                  </Suspense>
                ),
              },
            ],
          },
          {
            path: "collection-schedule",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <CollectionSchedule />
              </Suspense>
            ),
          },
          // Expense & Payment Method
          {
            path: "expense-categories",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <ExpenseCategoryList />
              </Suspense>
            ),
          },
          {
            path: "payment-methods",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <PaymentMethodList />
              </Suspense>
            ),
          },
        ],
      },

      // ===== DELIVERY NOTES =====
      {
        path: lastSegment(ROUTE_PATHS.DELIVERY_NOTES.ROOT), // "delivery-notes"
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <DeliveryNoteList />
              </Suspense>
            ),
          },
          {
            path: ":id",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <DeliveryNoteDetail />
              </Suspense>
            ),
          },
        ],
      },

      // ===== INVOICES =====
      {
        path: lastSegment(ROUTE_PATHS.INVOICES.ROOT), // "invoices"
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <InvoiceList />
              </Suspense>
            ),
          },
          {
            path: ":id",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <InvoiceDetail />
              </Suspense>
            ),
          },
        ],
      },

      // ===== ATTENDANCE =====
      {
        path: lastSegment(ROUTE_PATHS.ATTENDANCE.ROOT), // "attendance"
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <Attendance />
              </Suspense>
            ),
          },
          {
            path: "reports",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <AttendanceReports />
              </Suspense>
            ),
          },
        ],
      },

      // ===== MANAGER =====

      // ===== REPORTS =====
      {
        path: lastSegment(ROUTE_PATHS.REPORTS.ROOT), // "reports"
        children: [
          // Inventory Reports
          {
            path: "inventory",
            children: [
              {
                path: "current-stock",
                element: (
                  <Suspense fallback={<div>Loading...</div>}>
                    <CurrentStock />
                  </Suspense>
                ),
              },
              {
                path: "summary",
                element: (
                  <Suspense fallback={<div>Loading...</div>}>
                    <InventorySummary />
                  </Suspense>
                ),
              },
              {
                path: "low-stock",
                element: (
                  <Suspense fallback={<div>Loading...</div>}>
                    <LowStock />
                  </Suspense>
                ),
              },
              {
                path: "slow-moving",
                element: (
                  <Suspense fallback={<div>Loading...</div>}>
                    <SlowMoving />
                  </Suspense>
                ),
              },
              {
                path: "stock-card/:itemCode",
                element: (
                  <Suspense fallback={<div>Loading...</div>}>
                    <StockCard />
                  </Suspense>
                ),
              },
            ],
          },
          // Sales Reports
          {
            path: "sales",
            children: [
              {
                path: "by-period",
                element: (
                  <Suspense fallback={<div>Loading...</div>}>
                    <SalesByPeriod />
                  </Suspense>
                ),
              },
              {
                path: "by-customer",
                element: (
                  <Suspense fallback={<div>Loading...</div>}>
                    <SalesByCustomer />
                  </Suspense>
                ),
              },
              {
                path: "by-dimension",
                element: (
                  <Suspense fallback={<div>Loading...</div>}>
                    <SalesByDimension />
                  </Suspense>
                ),
              },
              {
                path: "top-products",
                element: (
                  <Suspense fallback={<div>Loading...</div>}>
                    <TopProducts />
                  </Suspense>
                ),
              },
              {
                path: "returns-discounts",
                element: (
                  <Suspense fallback={<div>Loading...</div>}>
                    <ReturnsDiscounts />
                  </Suspense>
                ),
              },
              {
                path: "order-drill-down",
                element: (
                  <Suspense fallback={<div>Loading...</div>}>
                    <OrderDrillDown />
                  </Suspense>
                ),
              },
            ],
          },
          // Report Exports
          {
            path: "exports",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <ReportExportList />
              </Suspense>
            ),
          },
        ],
      },

      // ===== NOTIFICATIONS =====
      {
        path: lastSegment(ROUTE_PATHS.NOTIFICATIONS), // "notifications"
        element: (
          <Suspense fallback={<div>Loading...</div>}>
            <NotificationCenter />
          </Suspense>
        ),
      },
    ],
  },

  // ===== 404 fallback =====
  {
    path: "*",
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <NotFound />
      </Suspense>
    ),
  },
]);
