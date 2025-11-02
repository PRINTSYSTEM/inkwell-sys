import { Payment } from '@/types';

export const mockPayments: Payment[] = [
  {
    id: 'pay1',
    orderId: 'o1',
    orderNumber: 'DH001',
    customerName: 'Công ty TNHH ABC',
    amount: 7500000,
    type: 'deposit',
    status: 'paid',
    paidAt: '2024-10-17',
    notes: 'Đã thanh toán tiền cọc 50%',
    createdAt: '2024-10-17',
  },
  {
    id: 'pay2',
    orderId: 'o2',
    orderNumber: 'DH002',
    customerName: 'Cửa hàng XYZ',
    amount: 4000000,
    type: 'deposit',
    status: 'pending',
    notes: 'Chờ khách thanh toán tiền cọc',
    createdAt: '2024-10-22',
  },
  {
    id: 'pay3',
    orderId: 'o1',
    orderNumber: 'DH001',
    customerName: 'Công ty TNHH ABC',
    amount: 7500000,
    type: 'final',
    status: 'pending',
    notes: 'Thanh toán phần còn lại khi giao hàng',
    createdAt: '2024-10-19',
  },
];

// Aliased export for backward compatibility
export const payments = mockPayments;