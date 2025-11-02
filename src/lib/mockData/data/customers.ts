import { Customer } from '@/types';

export const mockCustomers: Customer[] = [
  {
    id: 'c1',
    code: '0001MP',
    companyName: 'Công ty TNHH ABC Technology',
    representativeName: 'Nguyễn Minh Phúc',
    taxCode: '0123456789',
    phone: '0901234567',
    address: '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM',
    folder: '0001MP',
    maxDebt: 50000000, // 50 triệu VNĐ
    currentDebt: 15000000, // 15 triệu VNĐ hiện tại
    debtStatus: 'good', // Tình trạng tốt
    createdAt: '2024-01-15',
    createdBy: 'Trần Thị CSKH',
  },
  {
    id: 'c2',
    code: '0002XQ',
    companyName: 'Cửa hàng XYZ Fashion',
    representativeName: 'Ngô Xuân Quý',
    taxCode: '0234567890',
    phone: '0912345678',
    address: '456 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM',
    folder: '0002XQ',
    maxDebt: 30000000, // 30 triệu VNĐ
    currentDebt: 25000000, // 25 triệu VNĐ - gần đạt giới hạn
    debtStatus: 'warning', // Cảnh báo
    createdAt: '2024-02-20',
    createdBy: 'Trần Thị CSKH',
  },
  {
    id: 'c3',
    code: '0003VD',
    companyName: 'Tập đoàn DEF Corporation',
    representativeName: 'Lê Văn Đức',
    taxCode: '0345678901',
    phone: '0923456789',
    address: '789 Trần Hưng Đạo, Phường Cầu Ông Lãnh, Quận 1, TP.HCM',
    folder: '0003VD',
    maxDebt: 100000000, // 100 triệu VNĐ - khách hàng lớn
    currentDebt: 5000000, // 5 triệu VNĐ
    debtStatus: 'good',
    createdAt: '2024-03-10',
    createdBy: 'Trần Thị CSKH',
  },
  {
    id: 'c4',
    code: '0004TH',
    companyName: 'Nhà hàng Golden Star',
    representativeName: 'Phạm Thị Hương',
    taxCode: '0456789012',
    phone: '0934567890',
    address: '321 Nguyễn Văn Cừ, Phường Nguyễn Cư Trinh, Quận 1, TP.HCM',
    folder: '0004TH',
    maxDebt: 20000000, // 20 triệu VNĐ
    currentDebt: 8000000, // 8 triệu VNĐ
    debtStatus: 'good',
    createdAt: '2024-03-25',
    createdBy: 'Trần Thị CSKH',
  },
  {
    id: 'c5',
    code: '0005HA',
    companyName: 'Trường THPT Nguyễn Du',
    representativeName: 'Trần Hồng Anh',
    taxCode: '0567890123',
    phone: '0945678901',
    address: '654 Điện Biên Phủ, Phường 25, Quận Bình Thạnh, TP.HCM',
    folder: '0005HA',
    maxDebt: 40000000, // 40 triệu VNĐ - trường học
    currentDebt: 42000000, // 42 triệu VNĐ - vượt mức!
    debtStatus: 'blocked', // Bị chặn
    createdAt: '2024-04-05',
    createdBy: 'Trần Thị CSKH',
  },
  {
    id: 'c6',
    code: '0006BL',
    companyName: 'Phòng khám Đa khoa An Khang',
    representativeName: 'Võ Bảo Long',
    taxCode: '0678901234',
    phone: '0956789012',
    address: '987 Cách Mạng Tháng Tám, Phường 5, Quận Tân Bình, TP.HCM',
    folder: '0006BL',
    maxDebt: 35000000, // 35 triệu VNĐ
    currentDebt: 12000000, // 12 triệu VNĐ
    debtStatus: 'good',
    createdAt: '2024-04-20',
    createdBy: 'Trần Thị CSKH',
  },
  {
    id: 'c7',
    code: '0007QT',
    companyName: 'Công ty CP Kiến trúc Xanh',
    representativeName: 'Hoàng Quốc Tuấn',
    taxCode: '0789012345',
    phone: '0967890123',
    address: '147 Lý Tự Trọng, Phường Bến Nghé, Quận 1, TP.HCM',
    folder: '0007QT',
    maxDebt: 60000000, // 60 triệu VNĐ
    currentDebt: 55000000, // 55 triệu VNĐ - gần đạt giới hạn
    debtStatus: 'warning',
    createdAt: '2024-05-10',
    createdBy: 'Trần Thị CSKH',
  },
  {
    id: 'c8',
    code: '0008TL',
    representativeName: 'Đặng Thùy Linh', // Cá nhân (không có tên công ty)
    phone: '0978901234',
    address: '258 Pasteur, Phường 8, Quận 3, TP.HCM',
    folder: '0008TL',
    maxDebt: 10000000, // 10 triệu VNĐ - khách lẻ
    currentDebt: 2000000, // 2 triệu VNĐ
    debtStatus: 'good',
    createdAt: '2024-05-25',
    createdBy: 'Trần Thị CSKH',
  },
  {
    id: 'c9',
    code: '0009NL',
    companyName: 'Doanh nghiệp tư nhân Minh Châu',
    representativeName: 'Nguyễn Thanh Long',
    taxCode: '0890123456',
    phone: '0989012345',
    address: '159 Võ Văn Tần, Phường 6, Quận 3, TP.HCM',
    folder: '0009NL',
    maxDebt: 25000000, // 25 triệu VNĐ
    currentDebt: 0, // Không nợ
    debtStatus: 'good',
    createdAt: '2024-06-01',
    createdBy: 'Trần Thị CSKH',
  },
];