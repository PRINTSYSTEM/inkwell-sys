import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthGuard } from '../guards/AuthGuard';
import DashboardLayout from '../components/layout/DashboardLayout';
import { lazy, Suspense } from 'react';

const Login = lazy(() => import('@/pages/Login'));
const Dashboard = lazy(() => import('@/pages/dashboard'));
const Production = lazy(() => import('@/pages/production/index'));
const Design = lazy(() => import('@/pages/Design'));
const CreateDesign = lazy(() => import('@/pages/design/create'));
const Orders = lazy(() => import('@/pages/orders/index'));
const OrderDetail = lazy(() => import('@/pages/orders/[id]'));
const CreateOrder = lazy(() => import('@/pages/orders/create'));
const Accounting = lazy(() => import('@/pages/accounting/index'));
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
            path: 'create',
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <CreateDesign />
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
        element: (
          <Suspense fallback={<div>Loading...</div>}>
            <Accounting />
          </Suspense>
        )
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