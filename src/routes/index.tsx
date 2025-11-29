import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthGuard } from "../guards/AuthGuard";
import DashboardLayout from "../components/layout/DashboardLayout";
import { lazy, Suspense } from "react";
import MyWorkPage from "@/pages/design/MyWorkPage";
import DesignDetailPage from "@/pages/design/detail/DesignDetailPage";

const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/dashboard/DashboardPage"));
// const Production = lazy(() => import("@/pages/production/ProductionList.tsx"));
// const ProductionProgress = lazy(
//   () => import("@/pages/production/ProductionProgress")
// );
// const ProductionMachines = lazy(
//   () => import("@/pages/production/ProductionMachines.tsx")
// );
// const Design = lazy(() => import("@/pages/Design"));
// // const CreateDesign = lazy(() => import("@/pages/design/CreateDesignPage"));
const AllDesigns = lazy(() => import("@/pages/design/AllDesignsPage"));
const DesignManagement = lazy(() => import("@/pages/design/Designers"));
// const DesignAssignments = lazy(
//   () => import("@/pages/design/DesignAssignmentsPage")
// );
// const MyWork = lazy(() => import("@/pages/design/MyWorkPage"));
// const Employees = lazy(() => import("@/pages/design/Designers"));

// const DesignTestPage = lazy(() => import("@/pages/design/TestPage"));
// const CustomerServiceTest = lazy(
//   () => import("@/components/CustomerServiceTest")
// );
// const DesignDetail = lazy(
//   () => import("@/pages/design/detail/DesignDetailPage")
// );
// // const DesignCodeGenerator = lazy(
// //   () => import("@/pages/design/DesignCodeGenerator")
// // );
const Orders = lazy(() => import("@/pages/orders/OrderList.tsx"));
const OrderDetail = lazy(() => import("@/pages/orders/OrderDetail.tsx"));
// const CreateOrder = lazy(() => import("@/pages/orders/OrderCreate.tsx"));
// const OrderTracking = lazy(() => import("@/pages/orders/OrderTracking.tsx"));
// const Accounting = lazy(
//   () => import("@/pages/accounting/AccountingDashboard.tsx")
// );
// const DebtReport = lazy(
//   () => import("@/pages/accounting/AccountingDebtReport.tsx")
// );
// const AccountingRevenue = lazy(
//   () => import("@/pages/accounting/AccountingRevenue.tsx")
// );
// const AccountingExpenses = lazy(
//   () => import("@/pages/accounting/AccountingExpenses.tsx")
// );
// const Attendance = lazy(() => import("@/pages/Attendance"));
// const AttendanceReports = lazy(
//   () => import("@/pages/attendance/AttendanceReports.tsx")
// );
// const Customers = lazy(() => import("@/pages/customers/CustomerList.tsx"));
// const CustomerDetail = lazy(
//   () => import("@/pages/customers/CustomerDetail.tsx")
// );
// const CreateCustomer = lazy(
//   () => import("@/pages/customers/CustomerCreate.tsx")
// );
// const CustomerHistory = lazy(
//   () => import("@/pages/customers/CustomerHistory.tsx")
// );
// const Inventory = lazy(() => import("@/pages/inventory/InventoryPage"));
// const InventoryDetail = lazy(
//   () => import("@/pages/inventory/InventoryDetailPage.tsx")
// );
// const CreateMaterial = lazy(
//   () => import("@/pages/inventory/CreateInventoryPage")
// );
// const ProductTemplates = lazy(
//   () => import("@/pages/inventory/ProductTemplatesPage")
// );
// const Materials = lazy(() => import("@/pages/materials/MaterialList.tsx"));

// const MaterialTypeDetail = lazy(
//   () => import("@/pages/material-types/MaterialTypeDetail.tsx")
// );
// const CreateMaterialType = lazy(
//   () => import("@/pages/material-types/MaterialTypeCreate.tsx")
// );
const DesignTypes = lazy(
  () => import("@/pages/design-types/DesignTypeList.tsx")
);

// const PrepressCreatePrintOrder = lazy(
//   () => import("@/pages/prepress/CreatePrintOrder")
// );
// const PrepressIndex = lazy(() => import("@/pages/prepress/PrepressList.tsx"));
// const PrepressCheck = lazy(() => import("@/pages/prepress/PrepressCheck.tsx"));
// const PrepressOutput = lazy(
//   () => import("@/pages/prepress/PrepressOutput.tsx")
// );
// const Notifications = lazy(() => import("@/pages/Notifications"));
// const NotificationCenter = lazy(
//   () => import("@/pages/notifications/NotificationCenter")
// );
// const Reports = lazy(() => import("@/pages/Reports"));
// const AdminRoutes = lazy(() => import("@/pages/admin/AdminDashboard.tsx"));
// const ManagerRoutes = lazy(
//   () => import("@/pages/manager/ManagerDashboard.tsx")
// );
const NotFound = lazy(() => import("@/pages/NotFound"));

// // Additional lazy imports for new pages
// const AdminPermissions = lazy(
//   () => import("@/pages/admin/AdminPermissions.tsx")
// );
// const AdminSettings = lazy(() => import("@/pages/admin/AdminSettings.tsx"));
// const Profile = lazy(() => import("@/pages/UserProfile"));
// const ManagerReports = lazy(() => import("@/pages/manager/ManagerReports.tsx"));

export const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: "/",
    element: (
      <AuthGuard>
        <DashboardLayout />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: (
          <Suspense fallback={<div>Loading...</div>}>
            <Dashboard />
          </Suspense>
        ),
      },

      {
        path: "design",
        children: [
          {
            path: "all",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <AllDesigns />
              </Suspense>
            ),
          },
          {
            path: "my-work",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <MyWorkPage />
              </Suspense>
            ),
          },
          {
            path: "detail/:id",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <DesignDetailPage />
              </Suspense>
            ),
          },
          {
            path: "management",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <DesignManagement />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: "orders",
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <Orders />
              </Suspense>
            ),
          },
          //     {
          //       path: "create",
          //       element: (
          //         <Suspense fallback={<div>Loading...</div>}>
          //           <CreateOrder />
          //         </Suspense>
          //       ),
          //     },
          //     {
          //       path: "tracking",
          //       element: (
          //         <Suspense fallback={<div>Loading...</div>}>
          //           <OrderTracking />
          //         </Suspense>
          //       ),
          //     },
          {
            path: ":id",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <OrderDetail />
              </Suspense>
            ),
          },
        ],
      },
      // {
      //   path: "accounting",
      //   children: [
      //     {
      //       index: true,
      //       element: (
      //         <Suspense fallback={<div>Loading...</div>}>
      //           <Accounting />
      //         </Suspense>
      //       ),
      //     },
      //     {
      //       path: "debt-report",
      //       element: (
      //         <Suspense fallback={<div>Loading...</div>}>
      //           <DebtReport />
      //         </Suspense>
      //       ),
      //     },
      //     {
      //       path: "revenue",
      //       element: (
      //         <Suspense fallback={<div>Loading...</div>}>
      //           <AccountingRevenue />
      //         </Suspense>
      //       ),
      //     },
      //     {
      //       path: "expenses",
      //       element: (
      //         <Suspense fallback={<div>Loading...</div>}>
      //           <AccountingExpenses />
      //         </Suspense>
      //       ),
      //     },
      //   ],
      // },
      // {
      //   path: "attendance",
      //   children: [
      //     {
      //       index: true,
      //       element: (
      //         <Suspense fallback={<div>Loading...</div>}>
      //           <Attendance />
      //         </Suspense>
      //       ),
      //     },
      //     {
      //       path: "reports",
      //       element: (
      //         <Suspense fallback={<div>Loading...</div>}>
      //           <AttendanceReports />
      //         </Suspense>
      //       ),
      //     },
      //   ],
      // },
      // {
      //   path: "customers",
      //   children: [
      //     {
      //       index: true,
      //       element: (
      //         <Suspense fallback={<div>Loading...</div>}>
      //           <Customers />
      //         </Suspense>
      //       ),
      //     },
      //     {
      //       path: "create",
      //       element: (
      //         <Suspense fallback={<div>Loading...</div>}>
      //           <CreateCustomer />
      //         </Suspense>
      //       ),
      //     },
      //     {
      //       path: "history",
      //       element: (
      //         <Suspense fallback={<div>Loading...</div>}>
      //           <CustomerHistory />
      //         </Suspense>
      //       ),
      //     },
      //     {
      //       path: ":id",
      //       element: (
      //         <Suspense fallback={<div>Loading...</div>}>
      //           <CustomerDetail />
      //         </Suspense>
      //       ),
      //     },
      //   ],
      // },
      // {
      //   path: "inventory",
      //   children: [
      //     {
      //       index: true,
      //       element: (
      //         <Suspense fallback={<div>Loading...</div>}>
      //           <Inventory />
      //         </Suspense>
      //       ),
      //     },
      //     {
      //       path: "create",
      //       element: (
      //         <Suspense fallback={<div>Loading...</div>}>
      //           <CreateMaterial />
      //         </Suspense>
      //       ),
      //     },
      //     {
      //       path: "templates",
      //       element: (
      //         <Suspense fallback={<div>Loading...</div>}>
      //           <ProductTemplates />
      //         </Suspense>
      //       ),
      //     },
      //     {
      //       path: ":id",
      //       element: (
      //         <Suspense fallback={<div>Loading...</div>}>
      //           <InventoryDetail />
      //         </Suspense>
      //       ),
      //     },
      //   ],
      // },
      // {
      //   path: 'material-types',
      //   children: [
      //     {
      //       index: true,
      //       element: (
      //         <Suspense fallback={<div>Loading...</div>}>
      //           <MaterialTypes />
      //         </Suspense>
      //       )
      //     },
      //     {
      //       path: 'create',
      //       element: (
      //         <Suspense fallback={<div>Loading...</div>}>
      //           <CreateMaterialType />
      //         </Suspense>
      //       )
      //     },
      //     {
      //       path: ':id',
      //       element: (
      //         <Suspense fallback={<div>Loading...</div>}>
      //           <MaterialTypeDetail />
      //         </Suspense>
      //       )
      //     }
      //   ]
      // },
      // {
      //   path: "materials",
      //   children: [
      //     {
      //       index: true,
      //       element: (
      //         <Suspense fallback={<div>Loading...</div>}>
      //           <Materials />
      //         </Suspense>
      //       ),
      //     },
      //   ],
      // },
      {
        path: "design-types",
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
      // {
      //   path: "prepress",
      //   children: [
      //     {
      //       index: true,
      //       element: (
      //         <Suspense fallback={<div>Loading...</div>}>
      //           <PrepressIndex />
      //         </Suspense>
      //       ),
      //     },
      //     {
      //       path: "create-print-order",
      //       element: (
      //         <Suspense fallback={<div>Loading...</div>}>
      //           <PrepressCreatePrintOrder />
      //         </Suspense>
      //       ),
      //     },
      //     {
      //       path: "check",
      //       element: (
      //         <Suspense fallback={<div>Loading...</div>}>
      //           <PrepressCheck />
      //         </Suspense>
      //       ),
      //     },
      //     {
      //       path: "output",
      //       element: (
      //         <Suspense fallback={<div>Loading...</div>}>
      //           <PrepressOutput />
      //         </Suspense>
      //       ),
      //     },
      //   ],
      // },
      // {
      //   path: "notifications",
      //   element: (
      //     <Suspense fallback={<div>Loading...</div>}>
      //       <NotificationCenter />
      //     </Suspense>
      //   ),
      // },
      // {
      //   path: "profile",
      //   element: (
      //     <Suspense fallback={<div>Loading...</div>}>
      //       <Profile />
      //     </Suspense>
      //   ),
      // },
      // {
      //   path: "reports",
      //   element: (
      //     <Suspense fallback={<div>Loading...</div>}>
      //       <Reports />
      //     </Suspense>
      //   ),
      // },
      // {
      //   path: "admin/*",
      //   element: (
      //     <Suspense fallback={<div>Loading...</div>}>
      //       <AdminRoutes />
      //     </Suspense>
      //   ),
      // },
      // {
      //   path: "manager/*",
      //   element: (
      //     <Suspense fallback={<div>Loading...</div>}>
      //       <ManagerRoutes />
      //     </Suspense>
      //   ),
      // },
    ],
  },
  {
    path: "*",
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <NotFound />
      </Suspense>
    ),
  },
]);
