import { Design, DesignProgressImage, DesignComment } from '@/types';

// Mock progress images
export const mockProgressImages: DesignProgressImage[] = [
  {
    id: '1',
    designId: '1',
    imageUrl: 'https://picsum.photos/400/300?random=1',
    description: 'Bản phác thảo ban đầu',
    status: 'drafting',
    uploadedBy: 'designer1',
    uploadedAt: '2024-11-01T09:00:00Z',
    isVisibleToCustomer: false,
  },
  {
    id: '2',
    designId: '1',
    imageUrl: 'https://picsum.photos/400/300?random=2',
    description: 'Đang hoàn thiện chi tiết',
    status: 'in_progress',
    uploadedBy: 'designer1',
    uploadedAt: '2024-11-01T14:30:00Z',
    isVisibleToCustomer: false,
  },
  {
    id: '3',
    designId: '1',
    imageUrl: 'https://picsum.photos/400/300?random=3',
    description: 'Bản hoàn chỉnh sẵn sàng review',
    status: 'review_ready',
    uploadedBy: 'designer1',
    uploadedAt: '2024-11-02T16:45:00Z',
    isVisibleToCustomer: true,
  },
  {
    id: '4',
    designId: '3',
    imageUrl: 'https://picsum.photos/400/300?random=4',
    description: 'Thiết kế hoàn chỉnh',
    status: 'final',
    uploadedBy: 'designer2',
    uploadedAt: '2024-10-31T15:00:00Z',
    isVisibleToCustomer: true,
  }
];

// Mock comments
export const mockComments: DesignComment[] = [
  {
    id: '1',
    designId: '1',
    authorId: 'designer1',
    authorName: 'Nguyễn Văn Thiết kế',
    content: 'Đã hoàn thành bản phác thảo ban đầu theo yêu cầu.',
    type: 'internal',
    createdAt: '2024-11-01T09:15:00Z',
  },
  {
    id: '2',
    designId: '1',
    authorId: 'manager1',
    authorName: 'Trưởng phòng Thiết kế',
    content: 'Cần điều chỉnh màu sắc để phù hợp với brand của khách hàng.',
    type: 'revision_request',
    createdAt: '2024-11-01T15:00:00Z',
  },
  {
    id: '3',
    designId: '3',
    authorId: 'customer2',
    authorName: 'Khách hàng XYZ',
    content: 'Thiết kế rất đẹp, approve luôn!',
    type: 'customer_feedback',
    createdAt: '2024-10-31T14:00:00Z',
  }
];

// Mock designs
export const mockDesigns: Design[] = [
  {
    id: '1',
    designCode: '021OSG-H-001-241101',
    orderId: 'order1',
    orderNumber: 'DH001',
    customerId: 'customer1',
    customerName: 'Công ty TNHH Phân bón OSG',
    designType: 'H',
    designName: 'Hộp giấy phân bón kali',
    dimensions: '280x153mm',
    quantity: 1000,
    requirements: 'Thiết kế hộp giấy cao cấp, màu xanh lá chủ đạo, có logo công ty',
    notes: 'Khách hàng muốn có sample trong 3 ngày',
    
    assignedTo: 'designer1',
    assignedBy: 'manager1',
    assignedAt: '2024-11-01T08:00:00Z',
    status: 'in_progress',
    priority: 'high',
    
    progressImages: mockProgressImages.filter(img => img.designId === '1'),
    
    files: [
      {
        id: '1',
        name: 'hop-giay-phan-bon-v1.ai',
        url: '/files/designs/hop-giay-phan-bon-v1.ai',
        uploadedAt: '2024-11-01T10:00:00Z',
        uploadedBy: 'designer1',
      }
    ],
    finalFiles: [],
    
    createdAt: '2024-11-01T08:00:00Z',
    updatedAt: '2024-11-02T16:45:00Z',
    dueDate: '2024-11-04T17:00:00Z',
    
    comments: mockComments.filter(comment => comment.designId === '1'),
    revisionCount: 1,
  },
  {
    id: '2',
    designCode: '021OSG-T-002-241101',
    orderId: 'order1',
    orderNumber: 'DH001',
    customerId: 'customer1',
    customerName: 'Công ty TNHH Phân bón OSG',
    designType: 'T',
    designName: 'Túi giấy kraft đựng phân bón',
    dimensions: '200x300mm',
    quantity: 500,
    requirements: 'Túi giấy kraft tự nhiên, in logo đơn giản',
    
    assignedTo: 'designer1',
    assignedBy: 'manager1',
    assignedAt: '2024-11-01T08:30:00Z',
    status: 'pending',
    priority: 'medium',
    
    progressImages: [],
    files: [],
    finalFiles: [],
    
    createdAt: '2024-11-01T08:30:00Z',
    updatedAt: '2024-11-01T08:30:00Z',
    dueDate: '2024-11-05T17:00:00Z',
    
    comments: [],
    revisionCount: 0,
  },
  {
    id: '3',
    designCode: 'ABC123-C-003-241030',
    orderId: 'order2',
    orderNumber: 'DH002',
    customerId: 'customer2',
    customerName: 'Công ty XYZ',
    designType: 'C',
    designName: 'Nhãn dán sản phẩm',
    dimensions: '50x80mm',
    quantity: 2000,
    requirements: 'Nhãn dán chống nước, màu đỏ',
    
    assignedTo: 'designer2',
    assignedBy: 'manager1',
    assignedAt: '2024-10-30T09:00:00Z',
    status: 'approved',
    priority: 'low',
    
    progressImages: [
      {
        id: '4',
        designId: '3',
        imageUrl: 'https://picsum.photos/400/300?random=4',
        description: 'Thiết kế hoàn chỉnh',
        status: 'final',
        uploadedBy: 'designer2',
        uploadedAt: '2024-10-31T15:00:00Z',
        isVisibleToCustomer: true,
      }
    ],
    
    files: [
      {
        id: '2',
        name: 'nhan-dan-san-pham-final.ai',
        url: '/files/designs/nhan-dan-san-pham-final.ai',
        uploadedAt: '2024-10-31T15:00:00Z',
        uploadedBy: 'designer2',
      }
    ],
    finalFiles: [
      {
        id: '3',
        name: 'nhan-dan-san-pham-print-ready.pdf',
        url: '/files/designs/nhan-dan-san-pham-print-ready.pdf',
        uploadedAt: '2024-10-31T16:00:00Z',
        uploadedBy: 'designer2',
      }
    ],
    
    createdAt: '2024-10-30T09:00:00Z',
    updatedAt: '2024-10-31T16:00:00Z',
    dueDate: '2024-11-02T17:00:00Z',
    completedAt: '2024-10-31T16:00:00Z',
    
    comments: [
      {
        id: '3',
        designId: '3',
        authorId: 'customer2',
        authorName: 'Khách hàng XYZ',
        content: 'Thiết kế rất đẹp, approve luôn!',
        type: 'customer_feedback',
        createdAt: '2024-10-31T14:00:00Z',
      }
    ],
    revisionCount: 0,
  },
];