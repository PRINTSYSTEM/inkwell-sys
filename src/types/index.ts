export type UserRole = 'admin' | 'cskh' | 'design' | 'production_manager' | 'production' | 'accounting' | 'hr';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  taxCode?: string;
  phone: string;
  address: string;
  folder: string;
  createdAt: string;
  createdBy: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  description: string;
  quantity: number;
  status: 'new' | 'designing' | 'waiting_approval' | 'waiting_deposit' | 'in_production' | 'completed' | 'cancelled';
  designStatus?: 'pending' | 'in_progress' | 'waiting_approval' | 'approved';
  totalAmount?: number;
  depositAmount?: number;
  depositPaid: boolean;
  deliveryAddress: string;
  deliveryDate?: string;
  createdAt: string;
  createdBy: string;
}

export interface Design {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  files: DesignFile[];
  status: 'pending' | 'in_progress' | 'waiting_approval' | 'approved';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DesignFile {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface Production {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  assignedTo?: string;
  status: 'pending' | 'in_progress' | 'completed';
  progress: number;
  notes?: string;
  issues?: ProductionIssue[];
  startedAt?: string;
  completedAt?: string;
}

export interface ProductionIssue {
  id: string;
  description: string;
  reportedAt: string;
  reportedBy: string;
  resolved: boolean;
}

export interface Payment {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  amount: number;
  type: 'deposit' | 'final' | 'refund';
  status: 'pending' | 'paid' | 'overdue';
  paidAt?: string;
  notes?: string;
  createdAt: string;
}

export interface Attendance {
  id: string;
  userId: string;
  userName: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'late' | 'absent' | 'overtime';
  workHours: number;
  overtimeHours: number;
  notes?: string;
}

export interface Notification {
  id: string;
  type: 'warning' | 'info' | 'error' | 'success';
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: 'order' | 'production' | 'payment';
  read: boolean;
  createdAt: string;
}
