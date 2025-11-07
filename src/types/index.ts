export type UserRole = 'admin' | 'cskh' | 'design' | 'production_manager' | 'production' | 'accounting' | 'hr';

// Export employee types
export * from './employee';

// Export role types selectively
export type { Role, RoleAssignment, RoleAnalytics, RoleConflict, RoleFormData } from './role';

// Export design code types
export * from './design-code';

// Export design monitoring types
export * from './design-monitoring';

// Export assignment types
export * from './assignment';

// Export department analytics types
export type { 
  DepartmentKPI, 
  DepartmentMetrics, 
  PerformanceTrend, 
  DepartmentComparison,
  ProjectStats,
  ResourceUtilization,
  DepartmentGoal,
  AnalyticsTimeframe,
  DepartmentAnalytics,
  AnalyticsInsight,
  AnalyticsFilter,
  AnalyticsReport,
  ChartConfig
} from './department-analytics';

// Permission types
export type Permission = 
  | 'users.view' | 'users.create' | 'users.edit' | 'users.delete'
  | 'materials.view' | 'materials.create' | 'materials.edit' | 'materials.delete'
  | 'designs.view' | 'designs.create' | 'designs.edit' | 'designs.delete' | 'designs.assign'
  | 'orders.view' | 'orders.create' | 'orders.edit' | 'orders.delete'
  | 'customers.view' | 'customers.create' | 'customers.edit' | 'customers.delete'
  | 'production.view' | 'production.create' | 'production.edit' | 'production.delete'
  | 'accounting.view' | 'accounting.create' | 'accounting.edit' | 'accounting.delete'
  | 'reports.view' | 'reports.export'
  | 'settings.view' | 'settings.edit';

// Role permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'users.view', 'users.create', 'users.edit', 'users.delete',
    'materials.view', 'materials.create', 'materials.edit', 'materials.delete',
    'designs.view', 'designs.create', 'designs.edit', 'designs.delete', 'designs.assign',
    'orders.view', 'orders.create', 'orders.edit', 'orders.delete',
    'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
    'production.view', 'production.create', 'production.edit', 'production.delete',
    'accounting.view', 'accounting.create', 'accounting.edit', 'accounting.delete',
    'reports.view', 'reports.export',
    'settings.view', 'settings.edit'
  ],
  cskh: [
    'customers.view', 'customers.create', 'customers.edit',
    'orders.view', 'orders.create', 'orders.edit',
    'designs.view',
    'reports.view'
  ],
  design: [
    'designs.view', 'designs.edit',
    'materials.view',
    'orders.view',
    'customers.view'
  ],
  production_manager: [
    'production.view', 'production.create', 'production.edit', 'production.delete',
    'designs.view', 'designs.assign',
    'materials.view',
    'orders.view',
    'users.view',
    'reports.view'
  ],
  production: [
    'production.view', 'production.edit',
    'designs.view',
    'materials.view',
    'orders.view'
  ],
  accounting: [
    'accounting.view', 'accounting.create', 'accounting.edit', 'accounting.delete',
    'orders.view', 'orders.edit',
    'customers.view', 'customers.edit',
    'reports.view', 'reports.export'
  ],
  hr: [
    'users.view', 'users.create', 'users.edit',
    'reports.view'
  ]
};

// Design material types
export const DESIGN_MATERIAL_TYPES = [
  'Nhãn Metaline',
  'Hộp Giấy Duplex',
  'Hộp Carton Sóng E',
  'Hộp Giấy Ivory',
  'Decal Giấy',
  'Decal Metaline'
] as const;

export type DesignMaterialType = typeof DESIGN_MATERIAL_TYPES[number];

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  department?: string;
  position?: string;
  employeeId?: string;
  joiningDate?: string;
  birthDate?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  bankInfo?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  salary?: {
    basic: number;
    allowances?: number;
    bonus?: number;
  };
  workSchedule?: {
    startTime: string;
    endTime: string;
    workDays: string[];
  };
  permissions: Permission[];
  status: 'active' | 'inactive' | 'suspended';
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  notes?: string;
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
  maxDebt: number; // Công nợ tối đa cho phép (VNĐ)
  currentDebt: number; // Công nợ hiện tại (VNĐ)
  debtStatus: 'good' | 'warning' | 'blocked'; // Trạng thái công nợ
  createdAt: string;
  createdBy: string;
}

// Design item trong đơn hàng - dành cho giai đoạn thiết kế
export interface OrderDesign {
  id: string;
  designCode?: string; // Mã thiết kế tự động sinh (VD: "0001VH-T-001-021124")
  designType: 'T' | 'C' | 'D' | 'H' | 'R' | 'brochure' | 'business_card' | 'flyer' | 'poster' | 'banner' | 'sticker' | 'menu' | 'catalog' | 'other';
  designName: string; // Tên thiết kế (VD: "Mẫu bìa túi phân bón kali")
  dimensions: string; // Kích thước (VD: "280x153mm")
  quantity: number; // Số lượng
  requirements: string; // Yêu cầu thiết kế chi tiết
  notes?: string; // Ghi chú thêm
  createdDate: string; // Ngày tạo yêu cầu
  // Giá sẽ được thêm ở giai đoạn kế toán
  unitPrice?: number; // Đơn giá (thêm ở giai đoạn kế toán)
  totalPrice?: number; // Thành tiền (thêm ở giai đoạn kế toán)
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  designs?: OrderDesign[]; // Multi-design support
  // Legacy fields for backward compatibility
  description?: string;
  designType?: 'T' | 'C' | 'D' | 'H' | 'R' | 'brochure' | 'business_card' | 'flyer' | 'poster' | 'banner' | 'sticker' | 'menu' | 'catalog' | 'other';
  quantity?: number;
  status: 'new' | 'designing' | 'design_approved' | 'waiting_quote' | 'quoted' | 'deposited' | 'prepress_ready' | 'in_production' | 'completed' | 'cancelled';
  designStatus?: 'pending' | 'in_progress' | 'waiting_approval' | 'approved';
  totalAmount?: number;
  depositAmount?: number;
  depositPaid: boolean;
  deliveryAddress: string;
  deliveryDate?: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export interface PrepressOrder {
  id: string;
  prepressOrderNumber: string; // Mã lệnh bình bài (VD: PP001)
  orderIds: string[]; // Danh sách ID đơn hàng
  orders: Order[]; // Chi tiết các đơn hàng
  paperType: string;
  printMachine: string;
  quantity: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
  createdBy: string;
  assignedTo?: string; // ID nhân viên sản xuất được giao
}

export interface Design {
  id: string;
  designCode: string; // Mã thiết kế tự động từ hệ thống
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  designType: string; // T, C, D, H, R...
  designName: string;
  dimensions: string;
  quantity: number;
  requirements: string;
  notes?: string;
  material?: string; // Chất liệu (nhãn metaline, hộp giấy Duplex, etc.)
  
  // Assignment & Status
  assignedTo: string; // ID của designer được assign
  assignedBy: string; // ID của người assign
  assignedAt: string;
  status: 'pending' | 'in_progress' | 'review' | 'revision' | 'approved' | 'delivered';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Progress Tracking với hình ảnh
  progressImages: DesignProgressImage[];
  
  // File management
  files: DesignFile[];
  finalFiles: DesignFile[]; // Files cuối cùng gửi khách
  designFile?: { // File bảng thiết kế chính
    url: string;
    fileName: string;
    uploadedAt: string;
    uploadedBy: string;
  };
  
  // Timeline
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  deliveryDate?: string; // Ngày gửi khách hàng
  completedAt?: string;
  
  // Comments & Feedback
  comments: DesignComment[];
  revisionCount: number;
}

export interface DesignProgressImage {
  id: string;
  designId: string;
  imageUrl: string;
  description: string;
  status: 'drafting' | 'in_progress' | 'review_ready' | 'final';
  uploadedBy: string;
  uploadedAt: string;
  isVisibleToCustomer: boolean; // Có hiển thị cho khách hàng không
}

export interface DesignComment {
  id: string;
  designId: string;
  authorId: string;
  authorName: string;
  content: string;
  type: 'internal' | 'customer_feedback' | 'revision_request';
  createdAt: string;
  attachments?: string[];
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

export const MATERIAL_TYPE_CATEGORIES: Omit<MaterialTypeCategory, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Giấy in ấn',
    description: 'Các loại giấy sử dụng trong in ấn',
    materialType: 'paper',
    specifications: ['80gsm', '120gsm', '150gsm', '200gsm', '250gsm', '300gsm', '350gsm'],
    units: ['tờ', 'kg', 'm2', 'cuộn'],
    isActive: true
  },
  {
    name: 'Nhựa và màng nhựa',
    description: 'Các loại nhựa và màng nhựa',
    materialType: 'plastic',
    specifications: ['0.1mm', '0.2mm', '0.3mm', '0.5mm', 'PVC', 'PP', 'PE'],
    units: ['m2', 'kg', 'cuộn', 'tờ'],
    isActive: true
  },
  {
    name: 'Mực in',
    description: 'Mực in offset, digital và UV',
    materialType: 'ink',
    specifications: ['CMYK', 'Pantone', 'UV', 'Metallic'],
    units: ['kg', 'lít', 'can'],
    isActive: true
  },
  {
    name: 'Phủ bóng và coating',
    description: 'Varnish, UV coating và các loại phủ bóng',
    materialType: 'coating',
    specifications: ['Gloss', 'Matt', 'Satin', 'UV'],
    units: ['lít', 'kg'],
    isActive: true
  },
  {
    name: 'Giấy bạc và foil',
    description: 'Giấy bạc ép kim và các loại foil',
    materialType: 'foil',
    specifications: ['Gold', 'Silver', 'Hologram', 'Color'],
    units: ['m2', 'cuộn'],
    isActive: true
  },
  {
    name: 'Phụ kiện',
    description: 'Dây, móc, khóa và các phụ kiện khác',
    materialType: 'hardware',
    specifications: ['Size S', 'Size M', 'Size L'],
    units: ['cái', 'bộ', 'kg'],
    isActive: true
  }
];

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

// Design Type Management Interface
export interface DesignTypeEntity {
  id: string;
  code: string; // VD: T, C, D, H, R
  name: string; // VD: Túi giấy, Nhãn giấy
  description?: string;
  codeFormat: string; // Template cho mã thiết kế VD: "{customerCode}-{designType}-{number:3}-{date:YYMMDD}"
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface DesignTypeCreateRequest {
  code: string;
  name: string;
  description?: string;
  codeFormat: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface DesignTypeUpdateRequest extends Partial<DesignTypeCreateRequest> {
  id: string;
}

// Keep the old DesignType as union type for backward compatibility
export type DesignType = 'T' | 'C' | 'D' | 'H' | 'R' | 'brochure' | 'business_card' | 'flyer' | 'poster' | 'banner' | 'sticker' | 'menu' | 'catalog' | 'other';
