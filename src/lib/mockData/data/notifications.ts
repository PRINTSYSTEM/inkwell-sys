import { Notification } from '@/types';

export const mockNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'warning',
    title: 'Đơn hàng sắp đến hạn giao',
    message: 'Đơn hàng DH001 sẽ đến hạn giao vào ngày 30/12/2024',
    relatedId: 'o1',
    relatedType: 'order',
    read: false,
    createdAt: '2024-10-26T08:00:00',
  },
  {
    id: 'n2',
    type: 'error',
    title: 'Đơn hàng chờ thanh toán quá lâu',
    message: 'Đơn hàng DH002 đã chờ thanh toán tiền cọc 4 ngày',
    relatedId: 'o2',
    relatedType: 'order',
    read: false,
    createdAt: '2024-10-26T09:00:00',
  },
  {
    id: 'n3',
    type: 'success',
    title: 'Thiết kế đã được duyệt',
    message: 'Thiết kế đơn hàng DH001 đã được khách hàng duyệt',
    relatedId: 'o1',
    relatedType: 'order',
    read: true,
    createdAt: '2024-10-25T14:30:00',
  },
];