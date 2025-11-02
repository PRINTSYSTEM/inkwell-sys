import { PrepressOrder } from '@/types';

export const mockPrepressOrders: PrepressOrder[] = [
  {
    id: 'pp1',
    prepressOrderNumber: 'PP001',
    orderIds: ['o4', 'o5'],
    orders: [], // Sẽ được populate khi cần
    paperType: 'Bristol 300gsm',
    printMachine: 'Máy in Offset 4 màu A1',
    quantity: 700, // Tổng của 2 đơn (500 + 200)
    priority: 'medium',
    notes: 'In name card và menu, cùng loại giấy nên ghép chung',
    status: 'completed',
    createdAt: '2024-10-27',
    createdBy: 'Nguyễn Văn Bình bài',
    assignedTo: 'Trần Thanh Sản xuất'
  },
  {
    id: 'pp2', 
    prepressOrderNumber: 'PP002',
    orderIds: ['o8'],
    orders: [],
    paperType: 'Art Paper 150gsm',
    printMachine: 'Máy in Digital A3',
    quantity: 300,
    priority: 'high',
    notes: 'Catalogue thời trang, cần chất lượng cao',
    status: 'in_progress',
    createdAt: '2024-10-30',
    createdBy: 'Nguyễn Văn Bình bài',
    assignedTo: 'Lê Minh Sản xuất'
  }
];