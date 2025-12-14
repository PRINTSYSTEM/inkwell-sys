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

// Accounting
const AccountingDashboard = lazy(
  () => import("@/pages/accounting/AccountingDashboard")
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

// Attendance
const Attendance = lazy(() => import("@/pages/Attendance"));
const AttendanceReports = lazy(
  () => import("@/pages/attendance/AttendanceReports")
);

// Admin
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminPermissions = lazy(() => import("@/pages/admin/AdminPermissions"));
const AdminSettings = lazy(() => import("@/pages/admin/AdminSettings"));

// Reports / Notifications
const Reports = lazy(() => import("@/pages/Reports"));
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

      // ===== ACCOUNTING =====
      {
        path: lastSegment(ROUTE_PATHS.ACCOUNTING.ROOT), // "accounting"
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <AccountingDashboard />
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

      // ===== ADMIN =====
      {
        path: lastSegment(ROUTE_PATHS.ADMIN.ROOT), // "admin"
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <AdminDashboard />
              </Suspense>
            ),
          },
          {
            path: lastSegment(ROUTE_PATHS.ADMIN.USERS), // "users"
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <AdminDashboard />
              </Suspense>
            ),
          },
          {
            path: lastSegment(ROUTE_PATHS.ADMIN.ROLES), // "roles"
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <AdminPermissions />
              </Suspense>
            ),
          },
          {
            path: lastSegment(ROUTE_PATHS.ADMIN.ANALYTICS), // "analytics"
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <AdminSettings />
              </Suspense>
            ),
          },
        ],
      },

      // ===== REPORTS =====
      {
        path: lastSegment(ROUTE_PATHS.REPORTS), // "reports"
        element: (
          <Suspense fallback={<div>Loading...</div>}>
            <Reports />
          </Suspense>
        ),
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
