// src/router/index.tsx
import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import { AuthGuard } from "@/guards/AuthGuard";
import {
  DashboardLayout,
  PageLoadingFallback,
} from "@/components/layout/DashboardLayout";
import { ROUTE_PATHS } from "@/constants";
import CreateCustomer from "@/pages/customers/CreateCustomer";
import ProductionDetailPage from "@/pages/production/ProductionDetail";
import Profile from "@/pages/Profile";
import EmployeeList from "@/pages/manager/EmployeeList";
import EmployeeCreate from "@/pages/manager/EmployeeCreate";
import EmployeeDetail from "@/pages/manager/EmployeeDetail";

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

//die management
const DieManagement = lazy(() => import("@/pages/dies/DieListPage"));

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
const AR = lazy(() => import("@/pages/accounting/ar/ARPage"));
const AP = lazy(() => import("@/pages/accounting/ap/APPage"));
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

// Expense Reports
const ExpenseByTime = lazy(
  () => import("@/pages/reports/expense/ExpenseByTimePage")
);
const ExpenseByCategory = lazy(
  () => import("@/pages/reports/expense/ExpenseByCategoryPage")
);
const ExpenseByVendor = lazy(
  () => import("@/pages/reports/expense/ExpenseByVendorPage")
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
      <Suspense fallback={<PageLoadingFallback />}>
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
          <Suspense fallback={<PageLoadingFallback />}>
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
              <Suspense fallback={<PageLoadingFallback />}>
                <AllDesigns />
              </Suspense>
            ),
          },
          {
            path: lastSegment(ROUTE_PATHS.DESIGN.MY_WORK), // "my-work"
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
                <MyWorkPage />
              </Suspense>
            ),
          },
          {
            // /design/detail/:id  (dùng ROUTE_BUILDERS khi navigate)
            path: "detail/:id",
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
                <DesignDetailPage />
              </Suspense>
            ),
          },
          {
            path: lastSegment(ROUTE_PATHS.DESIGN.MANAGEMENT), // "management"
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
                <DesignManagement />
              </Suspense>
            ),
          },
          {
            // /design/designer/:id
            path: "designer/:id",
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
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
              <Suspense fallback={<PageLoadingFallback />}>
                <Orders />
              </Suspense>
            ),
          },
          {
            path: lastSegment(ROUTE_PATHS.ORDERS.NEW), // "new"
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
                <CreateOrder />
              </Suspense>
            ),
          },
          {
            // /orders/:id
            path: ":id",
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
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
              <Suspense fallback={<PageLoadingFallback />}>
                <Customers />
              </Suspense>
            ),
          },
          {
            path: lastSegment(ROUTE_PATHS.CUSTOMERS.NEW), // "new"
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
                <CreateCustomer />
              </Suspense>
            ),
          },
          {
            // /customers/:id
            path: ":id",
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
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
              <Suspense fallback={<PageLoadingFallback />}>
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
              <Suspense fallback={<PageLoadingFallback />}>
                <ProofingList />
              </Suspense>
            ),
          },
          {
            path: lastSegment(ROUTE_PATHS.PROOFING.CREATE),
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
                <ProofingCreate />
              </Suspense>
            ),
          },
          {
            path: lastSegment(ROUTE_PATHS.PROOFING.CREATE_PRINT_ORDER), // "create-print-order"
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
                <ProofingCreatePrintOrder />
              </Suspense>
            ),
          },
          {
            path: lastSegment(ROUTE_PATHS.DIES.ROOT), // "dies"
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
                <DieManagement />
              </Suspense>
            ),
          },
          {
            path: "check",
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
                <ProofingCheck />
              </Suspense>
            ),
          },
          {
            path: "output",
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
                <ProofingOutput />
              </Suspense>
            ),
          },
          {
            path: ":id",
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
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
              <Suspense fallback={<PageLoadingFallback />}>
                <Production />
              </Suspense>
            ),
          },
          {
            path: lastSegment(ROUTE_PATHS.PRODUCTION.DETAIL), // "detail"
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
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
              <Suspense fallback={<PageLoadingFallback />}>
                <Inventory />
              </Suspense>
            ),
          },
          {
            path: "create",
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
                <CreateMaterial />
              </Suspense>
            ),
          },
          {
            path: "templates",
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
                <ProductTemplates />
              </Suspense>
            ),
          },
          {
            path: ":id",
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
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
                  <Suspense fallback={<PageLoadingFallback />}>
                    <StockInList />
                  </Suspense>
                ),
              },
              {
                path: "create",
                element: (
                  <Suspense fallback={<PageLoadingFallback />}>
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
                  <Suspense fallback={<PageLoadingFallback />}>
                    <StockOutList />
                  </Suspense>
                ),
              },
              {
                path: "create",
                element: (
                  <Suspense fallback={<PageLoadingFallback />}>
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
              <Suspense fallback={<PageLoadingFallback />}>
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
              <Suspense fallback={<PageLoadingFallback />}>
                <PaymentPage />
              </Suspense>
            ),
          },
          {
            path: "invoice",
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
                <InvoicePage />
              </Suspense>
            ),
          },
          {
            path: "delivery",
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
                <DeliveryPage />
              </Suspense>
            ),
          },
          {
            path: "orders/:id",
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
                <AccountingOrderDetail />
              </Suspense>
            ),
          },
          {
            path: "debt-report",
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
                <AccountingDebtReport />
              </Suspense>
            ),
          },
          {
            path: "revenue",
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
                <AccountingRevenue />
              </Suspense>
            ),
          },
          {
            path: "expenses",
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
                <AccountingExpenses />
              </Suspense>
            ),
          },
          // Cash Management
          {
            path: "cash-payments",
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
                <CashPaymentList />
              </Suspense>
            ),
          },
          {
            path: "cash-payments/:id",
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
                <CashPaymentDetail />
              </Suspense>
            ),
          },
          {
            path: "cash-funds",
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
                <CashFundList />
              </Suspense>
            ),
          },
          {
            path: "cash-receipts",
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
                <CashReceiptList />
              </Suspense>
            ),
          },
          {
            path: "cash-receipts/:id",
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
                <CashReceiptDetail />
              </Suspense>
            ),
          },
          {
            path: "cash-book",
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
                <CashBook />
              </Suspense>
            ),
          },
          // Bank Management
          {
            path: "bank-accounts",
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
                <BankAccountList />
              </Suspense>
            ),
          },
          {
            path: "bank-ledger",
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
                <BankLedger />
              </Suspense>
            ),
          },
          // AR
          {
            path: "ar",
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
                <AR />
              </Suspense>
            ),
          },
          // AP
          {
            path: "ap",
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
                <AP />
              </Suspense>
            ),
          },
          {
            path: "collection-schedule",
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
                <CollectionSchedule />
              </Suspense>
            ),
          },
          // Expense & Payment Method
          {
            path: "expense-categories",
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
                <ExpenseCategoryList />
              </Suspense>
            ),
          },
          {
            path: "payment-methods",
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
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
              <Suspense fallback={<PageLoadingFallback />}>
                <DeliveryNoteList />
              </Suspense>
            ),
          },
          {
            path: ":id",
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
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
              <Suspense fallback={<PageLoadingFallback />}>
                <InvoiceList />
              </Suspense>
            ),
          },
          {
            path: ":id",
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
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
              <Suspense fallback={<PageLoadingFallback />}>
                <Attendance />
              </Suspense>
            ),
          },
          {
            path: "reports",
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
                <AttendanceReports />
              </Suspense>
            ),
          },
        ],
      },

      // ===== ADMIN =====
      {
        path: lastSegment(ROUTE_PATHS.ADMIN.ROOT), // "admin"
        children: [
          {
            path: lastSegment(ROUTE_PATHS.ADMIN.USERS), // "users"
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
                <EmployeeList />
              </Suspense>
            ),
          },
          {
            path: "users/create", // /admin/users/create (must be before users/:id)
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
                <EmployeeCreate />
              </Suspense>
            ),
          },
          {
            path: "users/:id", // /admin/users/:id
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
                <EmployeeDetail />
              </Suspense>
            ),
          },
        ],
      },

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
                  <Suspense fallback={<PageLoadingFallback />}>
                    <CurrentStock />
                  </Suspense>
                ),
              },
              {
                path: "summary",
                element: (
                  <Suspense fallback={<PageLoadingFallback />}>
                    <InventorySummary />
                  </Suspense>
                ),
              },
              {
                path: "low-stock",
                element: (
                  <Suspense fallback={<PageLoadingFallback />}>
                    <LowStock />
                  </Suspense>
                ),
              },
              {
                path: "slow-moving",
                element: (
                  <Suspense fallback={<PageLoadingFallback />}>
                    <SlowMoving />
                  </Suspense>
                ),
              },
              {
                path: "stock-card/:itemCode",
                element: (
                  <Suspense fallback={<PageLoadingFallback />}>
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
                  <Suspense fallback={<PageLoadingFallback />}>
                    <SalesByPeriod />
                  </Suspense>
                ),
              },
              {
                path: "by-customer",
                element: (
                  <Suspense fallback={<PageLoadingFallback />}>
                    <SalesByCustomer />
                  </Suspense>
                ),
              },
              {
                path: "by-dimension",
                element: (
                  <Suspense fallback={<PageLoadingFallback />}>
                    <SalesByDimension />
                  </Suspense>
                ),
              },
              {
                path: "top-products",
                element: (
                  <Suspense fallback={<PageLoadingFallback />}>
                    <TopProducts />
                  </Suspense>
                ),
              },
              {
                path: "returns-discounts",
                element: (
                  <Suspense fallback={<PageLoadingFallback />}>
                    <ReturnsDiscounts />
                  </Suspense>
                ),
              },
              {
                path: "order-drill-down",
                element: (
                  <Suspense fallback={<PageLoadingFallback />}>
                    <OrderDrillDown />
                  </Suspense>
                ),
              },
            ],
          },
          // Expense Reports
          {
            path: "expense",
            children: [
              {
                path: "by-time",
                element: (
                  <Suspense fallback={<PageLoadingFallback />}>
                    <ExpenseByTime />
                  </Suspense>
                ),
              },
              {
                path: "by-category",
                element: (
                  <Suspense fallback={<PageLoadingFallback />}>
                    <ExpenseByCategory />
                  </Suspense>
                ),
              },
              {
                path: "by-vendor",
                element: (
                  <Suspense fallback={<PageLoadingFallback />}>
                    <ExpenseByVendor />
                  </Suspense>
                ),
              },
            ],
          },
          // Report Exports
          {
            path: "exports",
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
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
          <Suspense fallback={<PageLoadingFallback />}>
            <NotificationCenter />
          </Suspense>
        ),
      },

      // ===== PROFILE =====
      {
        path: lastSegment(ROUTE_PATHS.PROFILE), // "profile"
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <Profile />
          </Suspense>
        ),
      },
    ],
  },

  // ===== 404 fallback =====
  {
    path: "*",
    element: (
      <Suspense fallback={<PageLoadingFallback />}>
        <NotFound />
      </Suspense>
    ),
  },
]);
