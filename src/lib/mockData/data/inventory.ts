import { 
  Material, 
  MaterialType, 
  ProductCategory, 
  ProductCategoryInfo, 
  ProductTemplate, 
  StockTransaction,
  MaterialRequirement,
  MaterialTypeCategory
} from '@/types';

// Thông tin các loại sản phẩm chính
export const productCategories: ProductCategoryInfo[] = [
  {
    id: 'bag',
    name: 'Túi giấy',
    description: 'Các loại túi giấy kraft, couche, duplex',
    defaultMaterials: ['MAT001', 'MAT002', 'MAT010', 'MAT011']
  },
  {
    id: 'decal',
    name: 'Decal - Nhãn dán',
    description: 'Decal vinyl, PP, PVC, nhãn trong suốt',
    defaultMaterials: ['MAT003', 'MAT004', 'MAT008', 'MAT009']
  },
  {
    id: 'box',
    name: 'Hộp carton',
    description: 'Hộp carton đựng sản phẩm, hộp quà tặng',
    defaultMaterials: ['MAT005', 'MAT006', 'MAT010', 'MAT012']
  },
  {
    id: 'paper',
    name: 'In ấn giấy',
    description: 'Brochure, catalog, tờ rơi, card visit',
    defaultMaterials: ['MAT001', 'MAT002', 'MAT007', 'MAT010']
  },
  {
    id: 'label',
    name: 'Nhãn giấy',
    description: 'Nhãn giấy thường, nhãn chống nước, tem bảo hành',
    defaultMaterials: ['MAT007', 'MAT008', 'MAT009', 'MAT010']
  }
];

// Mock data nguyên liệu
export const mockMaterials: Material[] = [
  // Giấy
  {
    id: '1',
    code: 'MAT001',
    name: 'Giấy Kraft nâu',
    type: 'paper',
    category: 'Giấy kraft',
    specification: '120gsm, khổ 70x100cm',
    unit: 'tờ',
    unitPrice: 850,
    supplier: 'Công ty Giấy Sài Gòn',
    minStock: 500,
    currentStock: 1200,
    location: 'Kho A-01',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-10-28T00:00:00Z'
  },
  {
    id: '2',
    code: 'MAT002',
    name: 'Giấy Couche 1 mặt',
    type: 'paper',
    category: 'Giấy couche',
    specification: '250gsm, khổ 65x92cm',
    unit: 'tờ',
    unitPrice: 1200,
    supplier: 'Công ty Giấy Sài Gòn',
    minStock: 300,
    currentStock: 800,
    location: 'Kho A-02',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-10-28T00:00:00Z'
  },
  // Nhựa
  {
    id: '3',
    code: 'MAT003',
    name: 'Decal PP trắng',
    type: 'plastic',
    category: 'Decal PP',
    specification: 'Dày 80mic, khổ 1.37m',
    unit: 'm',
    unitPrice: 15000,
    supplier: 'Công ty TNHH Hoàng Gia',
    minStock: 100,
    currentStock: 250,
    location: 'Kho B-01',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-10-28T00:00:00Z'
  },
  {
    id: '4',
    code: 'MAT004',
    name: 'Decal Vinyl trong suốt',
    type: 'plastic',
    category: 'Decal vinyl',
    specification: 'Dày 100mic, khổ 1.27m',
    unit: 'm',
    unitPrice: 18000,
    supplier: 'Công ty TNHH Hoàng Gia',
    minStock: 50,
    currentStock: 120,
    location: 'Kho B-02',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-10-28T00:00:00Z'
  },
  // Carton
  {
    id: '5',
    code: 'MAT005',
    name: 'Carton 3 lớp E-Flute',
    type: 'paper',
    category: 'Carton sóng',
    specification: 'Dày 3mm, khổ 70x100cm',
    unit: 'tờ',
    unitPrice: 2500,
    supplier: 'Công ty Carton Đông Nam',
    minStock: 200,
    currentStock: 450,
    location: 'Kho A-03',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-10-28T00:00:00Z'
  },
  {
    id: '6',
    code: 'MAT006',
    name: 'Carton 5 lớp BC-Flute',
    type: 'paper',
    category: 'Carton sóng',
    specification: 'Dày 6mm, khổ 100x140cm',
    unit: 'tờ',
    unitPrice: 4200,
    supplier: 'Công ty Carton Đông Nam',
    minStock: 100,
    currentStock: 280,
    location: 'Kho A-04',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-10-28T00:00:00Z'
  },
  // Giấy nhãn
  {
    id: '7',
    code: 'MAT007',
    name: 'Giấy nhãn trắng',
    type: 'paper',
    category: 'Giấy nhãn',
    specification: '80gsm, cuộn 320mm',
    unit: 'm',
    unitPrice: 12000,
    supplier: 'Công ty In Nhãn Việt',
    minStock: 200,
    currentStock: 350,
    location: 'Kho A-05',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-10-28T00:00:00Z'
  },
  // Mực in
  {
    id: '8',
    code: 'MAT008',
    name: 'Mực UV đen',
    type: 'ink',
    category: 'Mực UV',
    specification: 'Lon 1kg',
    unit: 'kg',
    unitPrice: 180000,
    supplier: 'Công ty Mực In Á Châu',
    minStock: 10,
    currentStock: 25,
    location: 'Kho C-01',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-10-28T00:00:00Z'
  },
  {
    id: '9',
    code: 'MAT009',
    name: 'Mức UV trắng',
    type: 'ink',
    category: 'Mực UV',
    specification: 'Lon 1kg',
    unit: 'kg',
    unitPrice: 220000,
    supplier: 'Công ty Mực In Á Châu',
    minStock: 5,
    currentStock: 15,
    location: 'Kho C-02',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-10-28T00:00:00Z'
  },
  // Keo dán
  {
    id: '10',
    code: 'MAT010',
    name: 'Keo dán PVA',
    type: 'glue',
    category: 'Keo dán',
    specification: 'Can 5kg',
    unit: 'kg',
    unitPrice: 45000,
    supplier: 'Công ty Hóa Chất Sài Gòn',
    minStock: 20,
    currentStock: 55,
    location: 'Kho C-03',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-10-28T00:00:00Z'
  },
  // Dây cột
  {
    id: '11',
    code: 'MAT011',
    name: 'Dây PP cột túi',
    type: 'ribbon',
    category: 'Dây cột',
    specification: 'Rộng 8mm, cuộn 100m',
    unit: 'm',
    unitPrice: 180,
    supplier: 'Công ty Phụ Kiện Bao Bì',
    minStock: 500,
    currentStock: 850,
    location: 'Kho D-01',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-10-28T00:00:00Z'
  },
  // Gia công
  {
    id: '12',
    code: 'MAT012',
    name: 'Ép kim tuyến vàng',
    type: 'foil',
    category: 'Kim tuyến',
    specification: 'Cuộn 320mm x 120m',
    unit: 'm',
    unitPrice: 8500,
    supplier: 'Công ty Gia Công Kim Tuyến',
    minStock: 50,
    currentStock: 180,
    location: 'Kho D-02',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-10-28T00:00:00Z'
  }
];

// Templates cho các loại sản phẩm
export const mockProductTemplates: ProductTemplate[] = [
  {
    id: '1',
    category: 'bag',
    name: 'Túi kraft size nhỏ',
    description: 'Túi giấy kraft nâu cơ bản 20x15x8cm',
    specifications: {
      width: 20,
      height: 15,
      depth: 8,
      unit: 'cm',
      handleType: 'twisted_paper'
    },
    materialRequirements: [
      {
        materialId: '1',
        materialCode: 'MAT001',
        materialName: 'Giấy Kraft nâu',
        quantity: 1.2,
        unit: 'tờ',
        estimatedCost: 1020
      },
      {
        materialId: '10',
        materialCode: 'MAT010',
        materialName: 'Keo dán PVA',
        quantity: 0.02,
        unit: 'kg',
        estimatedCost: 900
      },
      {
        materialId: '11',
        materialCode: 'MAT011',
        materialName: 'Dây PP cột túi',
        quantity: 0.5,
        unit: 'm',
        estimatedCost: 90
      }
    ],
    baseQuantity: 100,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-10-28T00:00:00Z'
  },
  {
    id: '2',
    category: 'decal',
    name: 'Decal cuộn KING A7',
    description: 'Decal in cuộn như attachment - size 325x80mm',
    specifications: {
      width: 325,
      height: 80,
      unit: 'mm',
      material: 'PP',
      finishing: 'lamination_15mm'
    },
    materialRequirements: [
      {
        materialId: '3',
        materialCode: 'MAT003',
        materialName: 'Decal PP trắng',
        quantity: 0.4,
        unit: 'm',
        estimatedCost: 6000
      },
      {
        materialId: '8',
        materialCode: 'MAT008',
        materialName: 'Mực UV đen',
        quantity: 0.05,
        unit: 'kg',
        estimatedCost: 9000
      }
    ],
    baseQuantity: 500,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-10-28T00:00:00Z'
  },
  {
    id: '3',
    category: 'box',
    name: 'Hộp giấy D350',
    description: 'Hộp giấy như attachment - size 180x77x55mm',
    specifications: {
      width: 180,
      height: 77,
      depth: 55,
      unit: 'mm',
      style: 'folding_box'
    },
    materialRequirements: [
      {
        materialId: '2',
        materialCode: 'MAT002',
        materialName: 'Giấy Couche 1 mặt',
        quantity: 1.5,
        unit: 'tờ',
        estimatedCost: 1800
      },
      {
        materialId: '10',
        materialCode: 'MAT010',
        materialName: 'Keo dán PVA',
        quantity: 0.015,
        unit: 'kg',
        estimatedCost: 675
      }
    ],
    baseQuantity: 100,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-10-28T00:00:00Z'
  }
];

// Lịch sử giao dịch kho
export const mockStockTransactions: StockTransaction[] = [
  {
    id: '1',
    materialId: '1',
    materialCode: 'MAT001',
    materialName: 'Giấy Kraft nâu',
    type: 'import',
    quantity: 1000,
    unit: 'tờ',
    unitPrice: 850,
    totalValue: 850000,
    reason: 'Nhập kho từ nhà cung cấp - PO#2025001',
    performedBy: 'Nguyễn Văn Kho',
    performedAt: '2025-10-25T08:30:00Z',
    notes: 'Hàng mới, chất lượng tốt'
  },
  {
    id: '2',
    materialId: '1',
    materialCode: 'MAT001',
    materialName: 'Giấy Kraft nâu',
    type: 'export',
    quantity: 120,
    unit: 'tờ',
    reason: 'Xuất kho cho đơn hàng #ORD-2025-001',
    relatedOrderId: 'ORD-2025-001',
    performedBy: 'Trần Thị Sản Xuất',
    performedAt: '2025-10-26T14:15:00Z'
  },
  {
    id: '3',
    materialId: '3',
    materialCode: 'MAT003',
    materialName: 'Decal PP trắng',
    type: 'import',
    quantity: 100,
    unit: 'm',
    unitPrice: 15000,
    totalValue: 1500000,
    reason: 'Nhập kho từ nhà cung cấp - PO#2025002',
    performedBy: 'Nguyễn Văn Kho',
    performedAt: '2025-10-27T10:00:00Z'
  },
  {
    id: '4',
    materialId: '8',
    materialCode: 'MAT008',
    materialName: 'Mực UV đen',
    type: 'export',
    quantity: 2,
    unit: 'kg',
    reason: 'Xuất kho cho đơn hàng #ORD-2025-002',
    relatedOrderId: 'ORD-2025-002',
    performedBy: 'Lê Văn In',
    performedAt: '2025-10-28T09:20:00Z'
  },
  {
    id: '5',
    materialId: '2',
    materialCode: 'MAT002',
    materialName: 'Giấy Couche 1 mặt',
    type: 'adjust',
    quantity: -5,
    unit: 'tờ',
    reason: 'Điều chỉnh tồn kho sau kiểm kê - hàng lỗi',
    performedBy: 'Nguyễn Văn Kho',
    performedAt: '2025-10-28T16:30:00Z',
    notes: 'Phát hiện 5 tờ bị ướt do mưa dột'
  }
];

// Material Type Categories - Quản lý loại nguyên liệu thô (khác với loại sản phẩm)
export const mockMaterialTypeCategories: MaterialTypeCategory[] = [
  // NHÓM GIẤY
  {
    id: '1',
    name: 'Giấy Kraft Nâu',
    description: 'Giấy kraft nâu dùng làm túi giấy, bao bì thân thiện môi trường',
    materialType: 'paper',
    specifications: ['Định lượng (gsm)', 'Kích thước (cm)', 'Độ bền kéo (N)', 'Độ ẩm (%)'],
    units: ['tờ', 'kg', 'm2', 'cuộn'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-10-28T00:00:00Z'
  },
  {
    id: '2',
    name: 'Giấy Couche Một Mặt',
    description: 'Giấy couche 1 mặt cho in offset chất lượng cao, brochure, catalog',
    materialType: 'paper',
    specifications: ['Định lượng (gsm)', 'Kích thước (cm)', 'Độ trắng (%)', 'Độ bóng'],
    units: ['tờ', 'kg', 'm2'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-10-28T00:00:00Z'
  },
  {
    id: '3',
    name: 'Giấy Couche Hai Mặt',
    description: 'Giấy couche 2 mặt cao cấp cho in ấn chất lượng cao',
    materialType: 'paper',
    specifications: ['Định lượng (gsm)', 'Kích thước (cm)', 'Độ trắng (%)', 'Độ bóng 2 mặt'],
    units: ['tờ', 'kg', 'm2'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-10-28T00:00:00Z'
  },
  
  // NHÓM NHỰA/DECAL
  {
    id: '4',
    name: 'Decal PP Trắng',
    description: 'Decal polypropylene trắng cho nhãn dán, tem bảo hành chống nước',
    materialType: 'plastic',
    specifications: ['Độ dày (mic)', 'Khổ rộng (mm)', 'Loại keo', 'Nhiệt độ chịu đựng'],
    units: ['m', 'cuộn', 'm2'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-10-28T00:00:00Z'
  },
  {
    id: '5',
    name: 'Decal PP Trong Suốt',
    description: 'Decal PP trong suốt cho nhãn dán cao cấp, hiệu ứng trong suốt',
    materialType: 'plastic',
    specifications: ['Độ dày (mic)', 'Khổ rộng (mm)', 'Độ trong suốt (%)', 'Loại keo'],
    units: ['m', 'cuộn', 'm2'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-10-28T00:00:00Z'
  },
  {
    id: '6',
    name: 'Decal Vinyl Cao Cấp',
    description: 'Decal vinyl chống UV, chống nước dùng ngoài trời',
    materialType: 'plastic',
    specifications: ['Độ dày (mic)', 'Khổ rộng (mm)', 'Khả năng chống UV', 'Thời gian bền (năm)'],
    units: ['m', 'cuộn', 'm2'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-10-28T00:00:00Z'
  },
  
  // NHÓM CARTON
  {
    id: '7',
    name: 'Carton Sóng 3 Lớp',
    description: 'Carton sóng 3 lớp E-Flute cho hộp nhỏ, đóng gói sản phẩm',
    materialType: 'paper',
    specifications: ['Độ dày (mm)', 'Kích thước (cm)', 'Cường độ nén (kN/m)', 'Độ ẩm (%)'],
    units: ['tờ', 'm2', 'kg'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-10-28T00:00:00Z'
  },
  {
    id: '8',
    name: 'Carton Sóng 5 Lớp',
    description: 'Carton sóng 5 lớp BC-Flute cho hộp lớn, vận chuyển nặng',
    materialType: 'paper',
    specifications: ['Độ dày (mm)', 'Kích thước (cm)', 'Cường độ nén (kN/m)', 'Khối lượng riêng'],
    units: ['tờ', 'm2', 'kg'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-10-28T00:00:00Z'
  },
  
  // NHÓM MỰC IN
  {
    id: '9',
    name: 'Mực UV Đen',
    description: 'Mực UV màu đen cho in kỹ thuật số, khô nhanh, bám dính tốt',
    materialType: 'ink',
    specifications: ['Loại màu', 'Độ bám dính', 'Thời gian khô (s)', 'Nhiệt độ sử dụng'],
    units: ['kg', 'lít', 'lon', 'chai'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-10-28T00:00:00Z'
  },
  {
    id: '10',
    name: 'Mực UV Trắng',
    description: 'Mực UV màu trắng cho in trên nền đen hoặc trong suốt',
    materialType: 'ink',
    specifications: ['Độ che phủ', 'Độ bám dính', 'Thời gian khô (s)', 'Khả năng chống UV'],
    units: ['kg', 'lít', 'lon', 'chai'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-10-28T00:00:00Z'
  },
  
  // NHÓM KEO DÁN & PHỤ KIỆN
  {
    id: '11',
    name: 'Keo PVA Lạnh',
    description: 'Keo PVA dùng lạnh để dán túi giấy, hộp carton',
    materialType: 'glue',
    specifications: ['Độ nhớt', 'Thời gian mở (min)', 'Nhiệt độ sử dụng', 'Độ bền dính'],
    units: ['kg', 'thùng', 'lon'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-10-28T00:00:00Z'
  },
  {
    id: '12',
    name: 'Keo Hotmelt',
    description: 'Keo nóng chảy cho máy dán tự động, khô nhanh',
    materialType: 'glue',
    specifications: ['Nhiệt độ nóng chảy', 'Thời gian mở (s)', 'Độ bền nhiệt', 'Màu sắc'],
    units: ['kg', 'thùng', 'thanh'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-10-28T00:00:00Z'
  },
  
  // NHÓM KIM TUYẾN & TRANG TRÍ
  {
    id: '13',
    name: 'Kim Tuyến Vàng',
    description: 'Kim tuyến màu vàng để ép nóng trang trí, logo cao cấp',
    materialType: 'foil',
    specifications: ['Màu sắc', 'Khổ rộng (mm)', 'Nhiệt độ ép (°C)', 'Áp lực ép'],
    units: ['m', 'cuộn'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-10-28T00:00:00Z'
  },
  {
    id: '14',
    name: 'Kim Tuyến Bạc',
    description: 'Kim tuyến màu bạc cho hiệu ứng sang trọng, hiện đại',
    materialType: 'foil',
    specifications: ['Màu sắc', 'Khổ rộng (mm)', 'Nhiệt độ ép (°C)', 'Độ bền màu'],
    units: ['m', 'cuộn'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-10-28T00:00:00Z'
  },
  
  // NHÓM DÂY CỘT & QUAI TÚI
  {
    id: '15',
    name: 'Dây PP Cột Túi',
    description: 'Dây polypropylene làm quai túi giấy, bền chắc',
    materialType: 'ribbon',
    specifications: ['Chất liệu', 'Rộng (mm)', 'Độ bền kéo (kg)', 'Màu sắc'],
    units: ['m', 'cuộn', 'kg'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-10-28T00:00:00Z'
  },
  {
    id: '16',
    name: 'Dây Giấy Xoắn',
    description: 'Dây giấy xoắn tự nhiên cho túi giấy thân thiện môi trường',
    materialType: 'ribbon',
    specifications: ['Đường kính (mm)', 'Độ bền kéo (kg)', 'Màu sắc', 'Khả năng phân hủy'],
    units: ['m', 'cuộn', 'kg'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-10-28T00:00:00Z'
  }
];