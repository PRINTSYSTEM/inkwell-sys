import { Attendance } from '@/types';

export const mockAttendance: Attendance[] = [
  {
    id: 'a1',
    userId: '4',
    userName: 'Phạm Thị Sản xuất',
    date: '2024-10-26',
    checkIn: '08:00',
    checkOut: '17:30',
    status: 'present',
    workHours: 8.5,
    overtimeHours: 0.5,
  },
  {
    id: 'a2',
    userId: '3',
    userName: 'Lê Văn Thiết kế',
    date: '2024-10-26',
    checkIn: '08:15',
    checkOut: '17:00',
    status: 'late',
    workHours: 8,
    overtimeHours: 0,
    notes: 'Đến trễ 15 phút',
  },
  {
    id: 'a3',
    userId: '2',
    userName: 'Trần Thị CSKH',
    date: '2024-10-26',
    checkIn: '08:00',
    checkOut: '17:00',
    status: 'present',
    workHours: 8,
    overtimeHours: 0,
  },
];