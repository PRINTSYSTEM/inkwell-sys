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
  companyName?: string; // Tên công ty (optional)
  representativeName: string; // Tên người đại diện (bắt buộc)
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

// Inventory Management Types
export type ProductCategory = 'bag' | 'decal' | 'box' | 'paper' | 'label';

export interface ProductCategoryInfo {
  id: ProductCategory;
  name: string;
  description: string;
  defaultMaterials: string[]; // Danh sách mã nguyên liệu thường dùng
}

export type MaterialType = 'paper' | 'plastic' | 'ink' | 'glue' | 'coating' | 'foil' | 'ribbon' | 'hardware' | 'packaging';

export interface Material {
  id: string;
  code: string; // Mã nguyên liệu
  name: string;
  type: MaterialType;
  category: string; // Phân loại chi tiết (VD: "Giấy couche", "Mực offset")
  specification: string; // Thông số kỹ thuật (VD: "250gsm", "C0 size")
  unit: string; // Đơn vị tính (tờ, kg, lít, cuộn, m2)
  unitPrice: number; // Giá đơn vị
  supplier: string; // Nhà cung cấp
  minStock: number; // Mức tồn kho tối thiểu
  currentStock: number; // Tồn kho hiện tại
  location: string; // Vị trí trong kho
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockTransaction {
  id: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  type: 'import' | 'export' | 'adjust'; // Nhập, xuất, điều chỉnh
  quantity: number;
  unit: string;
  unitPrice?: number;
  totalValue?: number;
  reason: string; // Lý do (đơn hàng, nhập kho, kiểm kê...)
  relatedOrderId?: string;
  performedBy: string;
  performedAt: string;
  notes?: string;
}

export interface MaterialRequirement {
  materialId: string;
  materialCode: string;
  materialName: string;
  quantity: number;
  unit: string;
  estimatedCost: number;
}

export interface ProductTemplate {
  id: string;
  category: ProductCategory;
  name: string; // VD: "Túi giấy kraft size nhỏ"
  description: string;
  specifications: Record<string, string | number>; // Thông số kỹ thuật linh hoạt
  materialRequirements: MaterialRequirement[]; // Nguyên liệu cần thiết
  baseQuantity: number; // Số lượng cơ sở để tính nguyên liệu
  createdAt: string;
  updatedAt: string;
}

// Material Type Management
export interface MaterialTypeCategory {
  id: string;
  name: string; // VD: "Giấy Kraft", "Decal PP", "Mực UV Đen"
  description: string;
  materialType: MaterialType; // Loại nguyên liệu chính (paper, plastic, ink...)
  specifications: string[]; // Danh sách thông số kỹ thuật cần thiết
  units: string[]; // Danh sách đơn vị tính phù hợp
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
