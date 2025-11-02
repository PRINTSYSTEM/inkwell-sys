import { DesignTypeEntity, DesignTypeCreateRequest, DesignTypeUpdateRequest } from '@/types';

// Mock data cho Design Types
export const mockDesignTypes: DesignTypeEntity[] = [
  {
    id: '1',
    code: 'T',
    name: 'Túi giấy',
    description: 'Túi giấy các loại',
    codeFormat: '{customerCode}-{designType}-{number:3}-{date:YYMMDD}',
    isActive: true,
    sortOrder: 1,
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:00:00Z',
    createdBy: 'admin',
    updatedBy: 'admin',
  },
  {
    id: '2',
    code: 'C',
    name: 'Nhãn giấy',
    description: 'Nhãn giấy, sticker',
    codeFormat: '{customerCode}-{designType}-{number:3}-{date:YYMMDD}',
    isActive: true,
    sortOrder: 2,
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:00:00Z',
    createdBy: 'admin',
    updatedBy: 'admin',
  },
  {
    id: '3',
    code: 'D',
    name: 'Decal',
    description: 'Decal bế các loại',
    codeFormat: '{customerCode}-{designType}-{number:3}-{date:YYMMDD}',
    isActive: true,
    sortOrder: 3,
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:00:00Z',
    createdBy: 'admin',
    updatedBy: 'admin',
  },
  {
    id: '4',
    code: 'H',
    name: 'Hộp giấy',
    description: 'Hộp giấy, bao bì',
    codeFormat: '{customerCode}-{designType}-{number:3}-{date:YYMMDD}',
    isActive: true,
    sortOrder: 4,
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:00:00Z',
    createdBy: 'admin',
    updatedBy: 'admin',
  },
  {
    id: '5',
    code: 'R',
    name: 'Decal cuộn',
    description: 'Decal cuộn kích thước lớn',
    codeFormat: '{customerCode}-{designType}-{number:3}-{date:YYMMDD}',
    isActive: true,
    sortOrder: 5,
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:00:00Z',
    createdBy: 'admin',
    updatedBy: 'admin',
  },
];

export class DesignTypesService {
  private data: DesignTypeEntity[] = [...mockDesignTypes];

  // Lấy tất cả design types
  async getAll(): Promise<DesignTypeEntity[]> {
    await this.delay(500); // Simulate API call
    return this.data.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  // Lấy chỉ design types đang active
  async getActive(): Promise<DesignTypeEntity[]> {
    await this.delay(200);
    return this.data
      .filter(item => item.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  // Lấy design type theo ID
  async getById(id: string): Promise<DesignTypeEntity | null> {
    await this.delay(200);
    return this.data.find(item => item.id === id) || null;
  }

  // Lấy design type theo code
  async getByCode(code: string): Promise<DesignTypeEntity | null> {
    await this.delay(200);
    return this.data.find(item => item.code === code) || null;
  }

  // Tạo design type mới
  async create(request: DesignTypeCreateRequest): Promise<DesignTypeEntity> {
    await this.delay(500);

    // Validate code unique
    if (this.data.some(item => item.code === request.code)) {
      throw new Error(`Mã thiết kế "${request.code}" đã tồn tại`);
    }

    const now = new Date().toISOString();
    const newItem: DesignTypeEntity = {
      id: Math.random().toString(36).substring(2, 15),
      code: request.code.toUpperCase(),
      name: request.name,
      description: request.description,
      codeFormat: request.codeFormat || '{customerCode}-{designType}-{number:3}-{date:YYMMDD}',
      isActive: request.isActive ?? true,
      sortOrder: request.sortOrder ?? this.data.length + 1,
      createdAt: now,
      updatedAt: now,
      createdBy: 'current-user', // Replace with actual user
      updatedBy: 'current-user',
    };

    this.data.push(newItem);
    return newItem;
  }

  // Cập nhật design type
  async update(id: string, request: Partial<DesignTypeUpdateRequest>): Promise<DesignTypeEntity> {
    await this.delay(500);

    const index = this.data.findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error('Không tìm thấy loại thiết kế');
    }

    // Validate code unique (if code is being changed)
    if (request.code && request.code !== this.data[index].code) {
      if (this.data.some(item => item.code === request.code && item.id !== id)) {
        throw new Error(`Mã thiết kế "${request.code}" đã tồn tại`);
      }
    }

    const updatedItem: DesignTypeEntity = {
      ...this.data[index],
      ...request,
      code: request.code?.toUpperCase() || this.data[index].code,
      updatedAt: new Date().toISOString(),
      updatedBy: 'current-user', // Replace with actual user
    };

    this.data[index] = updatedItem;
    return updatedItem;
  }

  // Xóa design type
  async delete(id: string): Promise<void> {
    await this.delay(500);

    const index = this.data.findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error('Không tìm thấy loại thiết kế');
    }

    // Check if design type is being used (in real app, check with backend)
    // For now, just prevent deletion of the first few items
    if (['1', '2', '3', '4', '5'].includes(id)) {
      throw new Error('Không thể xóa loại thiết kế đang được sử dụng');
    }

    this.data.splice(index, 1);
  }

  // Generate design code based on format
  generateDesignCode(
    designTypeCode: string, 
    customerCode: string, 
    designNumber: number,
    date: Date = new Date()
  ): string {
    const designType = this.data.find(item => item.code === designTypeCode);
    if (!designType) {
      throw new Error(`Không tìm thấy loại thiết kế với mã: ${designTypeCode}`);
    }

    const format = designType.codeFormat;
    const dateStr = date.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD

    return format
      .replace('{customerCode}', customerCode)
      .replace('{designType}', designTypeCode)
      .replace('{number:3}', designNumber.toString().padStart(3, '0'))
      .replace('{date:YYMMDD}', dateStr);
  }

  // Utility function to simulate API delay
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Reset data to default (for testing)
  reset(): void {
    this.data = [...mockDesignTypes];
  }
}

// Export singleton instance
export const designTypesService = new DesignTypesService();