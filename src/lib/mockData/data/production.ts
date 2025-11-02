import { Production } from '@/types';

export const mockProductions: Production[] = [
  {
    id: 'p1',
    orderId: 'o1',
    orderNumber: 'DH001',
    customerName: 'Công ty TNHH ABC',
    assignedTo: 'Phạm Thị Sản xuất',
    status: 'in_progress',
    progress: 60,
    notes: 'Đang in đợt 2/3',
    startedAt: '2024-10-19',
  },
  {
    id: 'p2',
    orderId: 'o2',
    orderNumber: 'DH002',
    customerName: 'Cửa hàng XYZ',
    status: 'pending',
    progress: 0,
    notes: 'Chờ kế toán xác nhận tiền cọc',
    startedAt: undefined,
  },
];

// Aliased export for backward compatibility
export const productions = mockProductions;