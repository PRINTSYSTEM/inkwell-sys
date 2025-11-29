import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  orderStatusLabels,
  customerTypeLabels,
  formatCurrency,
  formatDate,
} from "@/lib/status-utils";
import { Plus, Search, Building2, User, Eye } from "lucide-react";
// Mock data for the order management system
import type {
  CustomerResponse,
  OrderResponse,
  DesignResponse,
  ProofingOrderResponse,
  ProductionResponse,
  UserResponse,
  DesignTypeResponse,
  MaterialTypeResponse,
} from "@/Schema";
import { Link } from "react-router-dom";

// Users
export const mockUsers: UserResponse[] = [
  {
    id: 1,
    username: "admin",
    fullName: "Nguyễn Văn An",
    role: "admin",
    email: "admin@company.com",
    phone: "0901234567",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    username: "designer1",
    fullName: "Trần Thị Bình",
    role: "design",
    email: "designer@company.com",
    phone: "0902345678",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 3,
    username: "production1",
    fullName: "Lê Văn Công",
    role: "production",
    email: "production@company.com",
    phone: "0903456789",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 4,
    username: "accounting1",
    fullName: "Phạm Thị Dung",
    role: "accounting",
    email: "accounting@company.com",
    phone: "0904567890",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

// Design Types
export const mockDesignTypes: DesignTypeResponse[] = [
  {
    id: 1,
    code: "NAMECARD",
    name: "Name Card",
    displayOrder: 1,
    description: "Thiết kế danh thiếp",
    status: "active",
    statusType: "active",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    createdBy: {
      id: 1,
      fullName: "Nguyễn Văn An",
      role: "admin",
    },
  },
  {
    id: 2,
    code: "BROCHURE",
    name: "Brochure",
    displayOrder: 2,
    description: "Thiết kế brochure quảng cáo",
    status: "active",
    statusType: "active",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    createdBy: {
      id: 1,
      fullName: "Nguyễn Văn An",
      role: "admin",
    },
  },
  {
    id: 3,
    code: "POSTER",
    name: "Poster",
    displayOrder: 3,
    description: "Thiết kế poster",
    status: "active",
    statusType: "active",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    createdBy: {
      id: 1,
      fullName: "Nguyễn Văn An",
      role: "admin",
    },
  },
];

// Material Types
export const mockMaterialTypes: MaterialTypeResponse[] = [
  {
    id: 1,
    code: "COUCHE250",
    name: "Couche 250gsm",
    displayOrder: 1,
    description: "Giấy couche 250gsm",
    price: 50000,
    pricePerCm2: 5,
    designTypeId: 1,
    status: "active",
    statusType: "active",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    createdBy: {
      id: 1,
      fullName: "Nguyễn Văn An",
      role: "admin",
    },
  },
  {
    id: 2,
    code: "COUCHE300",
    name: "Couche 300gsm",
    displayOrder: 2,
    description: "Giấy couche 300gsm cao cấp",
    price: 70000,
    pricePerCm2: 7,
    designTypeId: 1,
    status: "active",
    statusType: "active",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    createdBy: {
      id: 1,
      fullName: "Nguyễn Văn An",
      role: "admin",
    },
  },
  {
    id: 3,
    code: "ARTPAPER",
    name: "Art Paper 150gsm",
    displayOrder: 3,
    description: "Giấy art paper cho brochure",
    price: 120000,
    pricePerCm2: 8,
    designTypeId: 2,
    status: "active",
    statusType: "active",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    createdBy: {
      id: 1,
      fullName: "Nguyễn Văn An",
      role: "admin",
    },
  },
];

// Customers
export const mockCustomers: CustomerResponse[] = [
  {
    id: 1,
    code: "KH001",
    name: "Nguyễn Thị Mai",
    companyName: null,
    representativeName: null,
    phone: "0912345678",
    taxCode: null,
    address: "123 Đường ABC, Quận 1, TP.HCM",
    type: "retail",
    typeStatusType: "retail",
    currentDebt: 0,
    maxDebt: 10000000,
    debtStatus: "normal",
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
    createdBy: {
      id: 1,
      fullName: "Nguyễn Văn An",
      role: "admin",
    },
  },
  {
    id: 2,
    code: "KH002",
    name: "Công Ty TNHH ABC",
    companyName: "Công Ty TNHH ABC",
    representativeName: "Trần Văn B",
    phone: "0923456789",
    taxCode: "0123456789",
    address: "456 Đường XYZ, Quận 3, TP.HCM",
    type: "company",
    typeStatusType: "company",
    currentDebt: 5000000,
    maxDebt: 50000000,
    debtStatus: "normal",
    createdAt: "2024-01-10T00:00:00Z",
    updatedAt: "2024-01-10T00:00:00Z",
    createdBy: {
      id: 1,
      fullName: "Nguyễn Văn An",
      role: "admin",
    },
  },
  {
    id: 3,
    code: "KH003",
    name: "Lê Văn Dũng",
    companyName: null,
    representativeName: null,
    phone: "0934567890",
    taxCode: null,
    address: "789 Đường DEF, Quận 7, TP.HCM",
    type: "retail",
    typeStatusType: "retail",
    currentDebt: 2000000,
    maxDebt: 10000000,
    debtStatus: "normal",
    createdAt: "2024-02-01T00:00:00Z",
    updatedAt: "2024-02-01T00:00:00Z",
    createdBy: {
      id: 1,
      fullName: "Nguyễn Văn An",
      role: "admin",
    },
  },
];

// Designs
export const mockDesigns: DesignResponse[] = [
  {
    id: 1,
    code: "DES-001",
    orderId: 1,
    designStatus: "confirmed_for_printing",
    statusType: "confirmed_for_printing",
    designerId: 2,
    designer: {
      id: 2,
      fullName: "Trần Thị Bình",
      role: "design",
    },
    designTypeId: 1,
    designType: mockDesignTypes[0],
    materialTypeId: 1,
    materialType: mockMaterialTypes[0],
    quantity: 500,
    dimensions: "9x5.5cm",
    width: 9,
    height: 5.5,
    areaCm2: 49.5,
    unitPrice: 5,
    totalPrice: 247500,
    requirements: "In 2 mặt, cán màng bóng",
    additionalNotes: null,
    designFileUrl: "/designs/namecard-001.pdf",
    excelFileUrl: null,
    notes: null,
    createdAt: "2024-02-15T10:00:00Z",
    updatedAt: "2024-02-20T14:30:00Z",
    timelineEntries: [
      {
        id: 1,
        fileUrl: "/designs/namecard-001-v1.png",
        description: "Bản thiết kế đầu tiên",
        createdAt: "2024-02-15T10:00:00Z",
        createdBy: {
          id: 2,
          fullName: "Trần Thị Bình",
          role: "design",
        },
      },
      {
        id: 2,
        fileUrl: "/designs/namecard-001-v2.png",
        description: "Chỉnh sửa theo yêu cầu khách hàng",
        createdAt: "2024-02-18T15:00:00Z",
        createdBy: {
          id: 2,
          fullName: "Trần Thị Bình",
          role: "design",
        },
      },
      {
        id: 3,
        fileUrl: "/designs/namecard-001-final.pdf",
        description: "File in cuối cùng",
        createdAt: "2024-02-20T14:30:00Z",
        createdBy: {
          id: 2,
          fullName: "Trần Thị Bình",
          role: "design",
        },
      },
    ],
  },
  {
    id: 2,
    code: "DES-002",
    orderId: 2,
    designStatus: "designing",
    statusType: "designing",
    designerId: 2,
    designer: {
      id: 2,
      fullName: "Trần Thị Bình",
      role: "design",
    },
    designTypeId: 2,
    designType: mockDesignTypes[1],
    materialTypeId: 3,
    materialType: mockMaterialTypes[2],
    quantity: 1000,
    dimensions: "A4",
    width: 21,
    height: 29.7,
    areaCm2: 623.7,
    unitPrice: 8,
    totalPrice: 4989600,
    requirements: "Brochure gấp 3, in màu 2 mặt",
    additionalNotes: "Cần hoàn thành trước ngày 25/02",
    designFileUrl: null,
    excelFileUrl: null,
    notes: null,
    createdAt: "2024-02-18T09:00:00Z",
    updatedAt: "2024-02-18T09:00:00Z",
    timelineEntries: [],
  },
  {
    id: 3,
    code: "DES-003",
    orderId: 1,
    designStatus: "confirmed_for_printing",
    statusType: "confirmed_for_printing",
    designerId: 2,
    designer: {
      id: 2,
      fullName: "Trần Thị Bình",
      role: "design",
    },
    designTypeId: 1,
    designType: mockDesignTypes[0],
    materialTypeId: 2,
    materialType: mockMaterialTypes[1],
    quantity: 300,
    dimensions: "9x5.5cm",
    width: 9,
    height: 5.5,
    areaCm2: 49.5,
    unitPrice: 7,
    totalPrice: 346500,
    requirements: "In 2 mặt, cán màng nhám",
    additionalNotes: null,
    designFileUrl: "/designs/namecard-003.pdf",
    excelFileUrl: null,
    notes: null,
    createdAt: "2024-02-15T11:00:00Z",
    updatedAt: "2024-02-20T16:00:00Z",
    timelineEntries: [
      {
        id: 4,
        fileUrl: "/designs/namecard-003-final.pdf",
        description: "File in cuối cùng",
        createdAt: "2024-02-20T16:00:00Z",
        createdBy: {
          id: 2,
          fullName: "Trần Thị Bình",
          role: "design",
        },
      },
    ],
  },
];

// Orders
export const mockOrders: OrderResponse[] = [
  {
    id: 1,
    code: "ORD-001",
    customerId: 1,
    customer: {
      id: 1,
      code: "KH001",
      name: "Nguyễn Thị Mai",
      companyName: null,
      debtStatus: "normal",
      currentDebt: 0,
      maxDebt: 10000000,
    },
    createdBy: 1,
    creator: {
      id: 1,
      fullName: "Nguyễn Văn An",
      role: "admin",
    },
    assignedTo: 2,
    assignedUser: {
      id: 2,
      fullName: "Trần Thị Bình",
      role: "design",
    },
    status: "proofed",
    statusType: "proofed",
    deliveryAddress: "123 Đường ABC, Quận 1, TP.HCM",
    totalAmount: 594000,
    depositAmount: 300000,
    deliveryDate: "2024-02-28T00:00:00Z",
    excelFileUrl: null,
    note: "Khách lẻ - Đã nhận cọc",
    createdAt: "2024-02-15T09:00:00Z",
    updatedAt: "2024-02-21T10:00:00Z",
    designs: [mockDesigns[0], mockDesigns[2]],
  },
  {
    id: 2,
    code: "ORD-002",
    customerId: 2,
    customer: {
      id: 2,
      code: "KH002",
      name: "Công Ty TNHH ABC",
      companyName: "Công Ty TNHH ABC",
      debtStatus: "normal",
      currentDebt: 5000000,
      maxDebt: 50000000,
    },
    createdBy: 1,
    creator: {
      id: 1,
      fullName: "Nguyễn Văn An",
      role: "admin",
    },
    assignedTo: 2,
    assignedUser: {
      id: 2,
      fullName: "Trần Thị Bình",
      role: "design",
    },
    status: "waiting_for_customer_approval",
    statusType: "waiting_for_customer_approval",
    deliveryAddress: "456 Đường XYZ, Quận 3, TP.HCM",
    totalAmount: 4989600,
    depositAmount: 0,
    deliveryDate: "2024-03-05T00:00:00Z",
    excelFileUrl: null,
    note: "Khách công ty - Chưa cần cọc",
    createdAt: "2024-02-18T09:00:00Z",
    updatedAt: "2024-02-18T09:00:00Z",
    designs: [mockDesigns[1]],
  },
  {
    id: 3,
    code: "ORD-003",
    customerId: 3,
    customer: {
      id: 3,
      code: "KH003",
      name: "Lê Văn Dũng",
      companyName: null,
      debtStatus: "normal",
      currentDebt: 2000000,
      maxDebt: 10000000,
    },
    createdBy: 1,
    creator: {
      id: 1,
      fullName: "Nguyễn Văn An",
      role: "admin",
    },
    assignedTo: null,
    assignedUser: {
      id: 1,
      fullName: "Nguyễn Văn An",
      role: "admin",
    },
    status: "pending",
    statusType: "pending",
    deliveryAddress: "789 Đường DEF, Quận 7, TP.HCM",
    totalAmount: 850000,
    depositAmount: 0,
    deliveryDate: "2024-03-10T00:00:00Z",
    excelFileUrl: null,
    note: "Chưa nhận cọc",
    createdAt: "2024-02-20T14:00:00Z",
    updatedAt: "2024-02-20T14:00:00Z",
    designs: [],
  },
];

// Proofing Orders
export const mockProofingOrders: ProofingOrderResponse[] = [
  {
    id: 1,
    code: "PROOF-001",
    materialTypeId: 1,
    materialType: mockMaterialTypes[0],
    createdById: 1,
    createdBy: {
      id: 1,
      fullName: "Nguyễn Văn An",
      role: "admin",
    },
    totalQuantity: 800,
    status: "completed",
    statusType: "completed",
    notes: "Bình bài cho đơn hàng ORD-001",
    createdAt: "2024-02-21T10:00:00Z",
    updatedAt: "2024-02-22T16:00:00Z",
    proofingOrderDesigns: [
      {
        id: 1,
        proofingOrderId: 1,
        designId: 1,
        design: mockDesigns[0],
        quantity: 500,
        createdAt: "2024-02-21T10:00:00Z",
      },
      {
        id: 2,
        proofingOrderId: 1,
        designId: 3,
        design: mockDesigns[2],
        quantity: 300,
        createdAt: "2024-02-21T10:00:00Z",
      },
    ],
    productions: [],
  },
];

// Productions
export const mockProductions: ProductionResponse[] = [
  {
    id: 1,
    proofingOrderId: 1,
    productionLeadId: 3,
    productionLead: {
      id: 3,
      fullName: "Lê Văn Công",
      role: "production",
    },
    status: "waiting_for_production",
    statusType: "waiting_for_production",
    progressPercent: 0,
    defectNotes: null,
    wastage: 0,
    startedAt: null,
    completedAt: null,
    createdAt: "2024-02-22T16:30:00Z",
    updatedAt: "2024-02-22T16:30:00Z",
  },
];

// Update proofing order with production
mockProofingOrders[0].productions = [mockProductions[0]];

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredOrders = mockOrders.filter((order) => {
    const matchesSearch =
      order.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-balance mb-2">
              Quản lý đơn hàng
            </h1>
            <p className="text-muted-foreground">
              Theo dõi và quản lý quy trình đơn hàng từ thiết kế đến sản xuất
            </p>
          </div>
          <Link to="/orders/new">
            <Button size="lg" className="gap-2">
              <Plus className="w-5 h-5" />
              Tạo đơn mới
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo mã đơn hoặc khách hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              {Object.entries(orderStatusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="border rounded-lg overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="border-b">
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Mã đơn
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Khách hàng
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Loại
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Thiết kế
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Ngày giao
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">
                    Tổng tiền
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">
                    Còn lại
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const customerType = order.customer.companyName
                    ? "company"
                    : "retail";
                  const remaining = order.totalAmount - order.depositAmount;

                  return (
                    <tr
                      key={order.id}
                      className="border-b hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <Link
                          to={`/orders/${order.id}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          {order.code}
                        </Link>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {customerType === "company" ? (
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <User className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className="font-medium">
                            {order.customer.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="outline">
                          {customerTypeLabels[customerType]}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge
                          status={order.status}
                          label={orderStatusLabels[order.status || ""] || "N/A"}
                        />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-medium">
                          {order.designs?.length || 0}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {formatDate(order.deliveryDate)}
                      </td>
                      <td className="px-4 py-4 text-right font-semibold">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span
                          className={
                            remaining > 0
                              ? "text-orange-600 font-medium"
                              : "text-muted-foreground"
                          }
                        >
                          {formatCurrency(remaining)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Link to={`/orders/${order.id}`}>
                          <Button variant="ghost" size="sm" className="gap-2">
                            <Eye className="w-4 h-4" />
                            Xem
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                Không tìm thấy đơn hàng nào
              </p>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {filteredOrders.length > 0 && (
          <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
            <span>Hiển thị {filteredOrders.length} đơn hàng</span>
            <span>
              Tổng giá trị:{" "}
              <span className="font-semibold text-foreground">
                {formatCurrency(
                  filteredOrders.reduce(
                    (sum, order) => sum + order.totalAmount,
                    0
                  )
                )}
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
