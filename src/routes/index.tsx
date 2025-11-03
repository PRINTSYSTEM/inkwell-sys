import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthGuard } from '../guards/AuthGuard';
import DashboardLayout from '../components/layout/DashboardLayout';
import { lazy, Suspense } from 'react';

const Login = lazy(() => import('@/pages/Login'));
const Dashboard = lazy(() => import('@/pages/dashboard'));
const Production = lazy(() => import('@/pages/production/index'));
const Design = lazy(() => import('@/pages/Design'));
const CreateDesign = lazy(() => import('@/pages/design/create'));
const AllDesigns = lazy(() => import('@/pages/design/all'));
const MyWork = lazy(() => import('@/pages/design/my-work.tsx'));
const DesignDetail = lazy(() => import('@/pages/design/detail/[id].tsx'));
const DesignCodeGenerator = lazy(() => import('@/pages/design/code-generator'));
const Orders = lazy(() => import('@/pages/orders/index'));
const OrderDetail = lazy(() => import('@/pages/orders/[id]'));
const CreateOrder = lazy(() => import('@/pages/orders/create'));
const Accounting = lazy(() => import('@/pages/accounting/index'));
const DebtReport = lazy(() => import('@/pages/accounting/debt-report'));
const Attendance = lazy(() => import('@/pages/Attendance'));
const Customers = lazy(() => import('@/pages/customers/index'));
const CustomerDetail = lazy(() => import('@/pages/customers/[id]'));
const CreateCustomer = lazy(() => import('@/pages/customers/create'));
const Inventory = lazy(() => import('@/pages/inventory/index'));
const InventoryDetail = lazy(() => import('@/pages/inventory/[id]'));
const CreateMaterial = lazy(() => import('@/pages/inventory/create'));
const ProductTemplates = lazy(() => import('@/pages/inventory/templates'));
const MaterialTypes = lazy(() => import('@/pages/material-types/index'));
const MaterialTypeDetail = lazy(() => import('@/pages/material-types/[id]'));
const CreateMaterialType = lazy(() => import('@/pages/material-types/create'));
const DesignTypes = lazy(() => import('@/pages/design-types/index'));
const DesignTypeDetail = lazy(() => import('@/pages/design-types/[id]'));
const CreateDesignType = lazy(() => import('@/pages/design-types/create'));
const PrepressCreatePrintOrder = lazy(() => import('@/pages/prepress/create-print-order.tsx'));
const PrepressIndex = lazy(() => import('@/pages/prepress/index'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const NotFound = lazy(() => import('@/pages/NotFound'));

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <Login />
      </Suspense>
    )
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <DashboardLayout />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />
      },
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<div>Loading...</div>}>
            <Dashboard />
          </Suspense>
        )
      },
      {
        path: 'production',
        element: (
          <Suspense fallback={<div>Loading...</div>}>
            <Production />
          </Suspense>
        )
      },
      {
        path: 'design',
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <Design />
              </Suspense>
            )
          },
          {
            path: 'all',
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <AllDesigns />
              </Suspense>
            )
          },
          {
            path: 'my-work',
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <MyWork />
              </Suspense>
            )
          },
          {
            path: 'detail/:id',
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <DesignDetail />
              </Suspense>
            )
          },
          {
            path: 'create',
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <CreateDesign />
              </Suspense>
            )
          },
          {
            path: 'code-generator',
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <DesignCodeGenerator />
              </Suspense>
            )
          }
        ]
      },
      {
        path: 'orders',
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <Orders />
              </Suspense>
            )
          },
          {
            path: 'create',
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <CreateOrder />
              </Suspense>
            )
          },
          {
            path: ':id',
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <OrderDetail />
              </Suspense>
            )
          }
        ]
      },
      {
        path: 'accounting',
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <Accounting />
              </Suspense>
            )
          },
          {
            path: 'debt-report',
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <DebtReport />
              </Suspense>
            )
          }
        ]
      },
      {
        path: 'attendance',
        element: (
          <Suspense fallback={<div>Loading...</div>}>
            <Attendance />
          </Suspense>
        )
      },
      {
        path: 'customers',
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <Customers />
              </Suspense>
            )
          },
          {
            path: 'create',
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <CreateCustomer />
              </Suspense>
            )
          },
          {
            path: ':id',
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <CustomerDetail />
              </Suspense>
            )
          }
        ]
      },
      {
        path: 'inventory',
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <Inventory />
              </Suspense>
            )
          },
          {
            path: 'create',
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <CreateMaterial />
              </Suspense>
            )
          },
          {
            path: 'templates',
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <ProductTemplates />
              </Suspense>
            )
          },
          {
            path: ':id',
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <InventoryDetail />
              </Suspense>
            )
          }
        ]
      },
      {
        path: 'material-types',
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <MaterialTypes />
              </Suspense>
            )
          },
          {
            path: 'create',
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <CreateMaterialType />
              </Suspense>
            )
          },
          {
            path: ':id',
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <MaterialTypeDetail />
              </Suspense>
            )
          }
        ]
      },
      {
        path: 'design-types',
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <DesignTypes />
              </Suspense>
            )
          },
          {
            path: 'create',
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <CreateDesignType />
              </Suspense>
            )
          },
          {
            path: ':id',
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <DesignTypeDetail />
              </Suspense>
            )
          }
        ]
      },
      {
        path: 'prepress',
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <PrepressIndex />
              </Suspense>
            )
          },
          {
            path: 'create-print-order',
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <PrepressCreatePrintOrder />
              </Suspense>
            )
          }
        ]
      },
      {
        path: 'notifications',
        element: (
          <Suspense fallback={<div>Loading...</div>}>
            <Notifications />
          </Suspense>
        )
      }
    ]
  },
  {
    path: '*',
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <NotFound />
      </Suspense>
    )
  }
]);