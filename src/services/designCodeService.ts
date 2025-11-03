import { 
  DesignCodeTemplate, 
  DesignCodeField, 
  GeneratedDesignCode,
  DESIGN_TYPES,
  PAPER_TYPES,
  PRINT_TECHNIQUES,
  FINISHING_OPTIONS 
} from '@/types/design-code';

// Predefined templates for different design types
export const designCodeTemplates: DesignCodeTemplate[] = [
  {
    id: 'package-box',
    name: 'Hộp đóng gói',
    pattern: '{orderCode}-{designType}{sequence}: {productType} - {material} - {volume} - KT: {dimensions} - Ngày: {date}',
    description: 'Template cho thiết kế hộp đóng gói sản phẩm',
    example: '0210SG-H013: Hộp Cáp Đôi CÁP SỮA BO TRÍ 200ml - KT: 123x62x145mm - Ngày: 11/10/2025',
    fields: [
      {
        key: 'orderCode',
        label: 'Mã đơn hàng',
        type: 'text',
        required: true,
        placeholder: 'VD: 0210SG',
        defaultValue: ''
      },
      {
        key: 'designType',
        label: 'Loại thiết kế',
        type: 'select',
        required: true,
        options: ['H', 'T', 'N', 'C', 'B', 'P', 'D'],
        defaultValue: 'H'
      },
      {
        key: 'sequence',
        label: 'Số thứ tự',
        type: 'auto',
        required: true,
        defaultValue: '001'
      },
      {
        key: 'productType',
        label: 'Tên sản phẩm',
        type: 'text',
        required: true,
        placeholder: 'VD: Hộp Cáp Đôi CÁP SỮA BO TRÍ',
        defaultValue: ''
      },
      {
        key: 'material',
        label: 'Chất liệu',
        type: 'select',
        required: false,
        options: PAPER_TYPES,
        defaultValue: ''
      },
      {
        key: 'volume',
        label: 'Dung tích/Trọng lượng',
        type: 'text',
        required: false,
        placeholder: 'VD: 200ml, 1kg',
        defaultValue: ''
      },
      {
        key: 'dimensions',
        label: 'Kích thước (mm)',
        type: 'text',
        required: true,
        placeholder: 'VD: 123x62x145mm',
        defaultValue: ''
      },
      {
        key: 'date',
        label: 'Ngày gửi khách',
        type: 'date',
        required: true,
        defaultValue: new Date().toLocaleDateString('vi-VN')
      }
    ]
  },
  {
    id: 'decal-label',
    name: 'Decal/Nhãn dán',
    pattern: '{orderCode}-{designType}{sequence} {productName} - {specifications} - KT: {dimensions} - Ngày: {date}',
    description: 'Template cho thiết kế decal và nhãn dán',
    example: '0208DH-D039 Decal bé CREEK 2.1EC - KT: 60 x 97 mm - Ngày: 09/10/2025',
    fields: [
      {
        key: 'orderCode',
        label: 'Mã đơn hàng',
        type: 'text',
        required: true,
        placeholder: 'VD: 0208DH',
        defaultValue: ''
      },
      {
        key: 'designType',
        label: 'Loại thiết kế',
        type: 'select',
        required: true,
        options: ['D', 'N', 'T'],
        defaultValue: 'D'
      },
      {
        key: 'sequence',
        label: 'Số thứ tự',
        type: 'auto',
        required: true,
        defaultValue: '001'
      },
      {
        key: 'productName',
        label: 'Tên sản phẩm',
        type: 'text',
        required: true,
        placeholder: 'VD: Decal bé CREEK 2.1EC',
        defaultValue: ''
      },
      {
        key: 'specifications',
        label: 'Thông số kỹ thuật',
        type: 'text',
        required: false,
        placeholder: 'VD: 2.1EC, chống nước',
        defaultValue: ''
      },
      {
        key: 'dimensions',
        label: 'Kích thước (mm)',
        type: 'text',
        required: true,
        placeholder: 'VD: 60 x 97 mm',
        defaultValue: ''
      },
      {
        key: 'date',
        label: 'Ngày gửi khách',
        type: 'date',
        required: true,
        defaultValue: new Date().toLocaleDateString('vi-VN')
      }
    ]
  },
  {
    id: 'label-paper',
    name: 'Nhãn giấy',
    pattern: '{orderCode}-{designType}{sequence} {productName} - {weight} - Kích thước: {dimensions} ({note}) - Ngày: {date}',
    description: 'Template cho thiết kế nhãn giấy sản phẩm',
    example: '0208DH-C165 Nhãn giấy Dr.Stop - 1 kg - Kích thước: 280 x 153 mm (đã tính mép dán 10mm) - Ngày: 14/10/2025',
    fields: [
      {
        key: 'orderCode',
        label: 'Mã đơn hàng',
        type: 'text',
        required: true,
        placeholder: 'VD: 0208DH',
        defaultValue: ''
      },
      {
        key: 'designType',
        label: 'Loại thiết kế',
        type: 'select',
        required: true,
        options: ['C', 'N', 'L'],
        defaultValue: 'C'
      },
      {
        key: 'sequence',
        label: 'Số thứ tự',
        type: 'auto',
        required: true,
        defaultValue: '001'
      },
      {
        key: 'productName',
        label: 'Tên sản phẩm',
        type: 'text',
        required: true,
        placeholder: 'VD: Nhãn giấy Dr.Stop',
        defaultValue: ''
      },
      {
        key: 'weight',
        label: 'Trọng lượng/Dung tích',
        type: 'text',
        required: true,
        placeholder: 'VD: 1 kg, 500ml',
        defaultValue: ''
      },
      {
        key: 'dimensions',
        label: 'Kích thước (mm)',
        type: 'text',
        required: true,
        placeholder: 'VD: 280 x 153 mm',
        defaultValue: ''
      },
      {
        key: 'note',
        label: 'Ghi chú kỹ thuật',
        type: 'text',
        required: false,
        placeholder: 'VD: đã tính mép dán 10mm',
        defaultValue: ''
      },
      {
        key: 'date',
        label: 'Ngày gửi khách',
        type: 'date',
        required: true,
        defaultValue: new Date().toLocaleDateString('vi-VN')
      }
    ]
  },
  {
    id: 'packaging-bag',
    name: 'Túi đóng gói',
    pattern: '{orderCode}-{designType}{sequence} {productName} - {weight} - Kích thước: {dimensions} - Ngày: {date}',
    description: 'Template cho thiết kế túi đóng gói',
    example: '0208DH-T003 Túi Man Xanh - 1 kg - Kích thước: 230 x 350 mm - Ngày: 14/10/2025',
    fields: [
      {
        key: 'orderCode',
        label: 'Mã đơn hàng',
        type: 'text',
        required: true,
        placeholder: 'VD: 0208DH',
        defaultValue: ''
      },
      {
        key: 'designType',
        label: 'Loại thiết kế',
        type: 'select',
        required: true,
        options: ['T', 'B', 'P'],
        defaultValue: 'T'
      },
      {
        key: 'sequence',
        label: 'Số thứ tự',
        type: 'auto',
        required: true,
        defaultValue: '001'
      },
      {
        key: 'productName',
        label: 'Tên sản phẩm',
        type: 'text',
        required: true,
        placeholder: 'VD: Túi Man Xanh',
        defaultValue: ''
      },
      {
        key: 'weight',
        label: 'Trọng lượng/Dung tích',
        type: 'text',
        required: true,
        placeholder: 'VD: 1 kg, 500ml',
        defaultValue: ''
      },
      {
        key: 'dimensions',
        label: 'Kích thước (mm)',
        type: 'text',
        required: true,
        placeholder: 'VD: 230 x 350 mm',
        defaultValue: ''
      },
      {
        key: 'date',
        label: 'Ngày gửi khách',
        type: 'date',
        required: true,
        defaultValue: new Date().toLocaleDateString('vi-VN')
      }
    ]
  }
];

export class DesignCodeGenerator {
  private static sequenceCounters: Record<string, number> = {};

  static generateCode(template: DesignCodeTemplate, values: Record<string, string>): GeneratedDesignCode {
    // Auto-generate sequence number if not provided
    if (template.fields.some(f => f.type === 'auto' && f.key === 'sequence')) {
      const key = `${values.orderCode}-${values.designType}`;
      if (!this.sequenceCounters[key]) {
        this.sequenceCounters[key] = 1;
      } else {
        this.sequenceCounters[key]++;
      }
      values.sequence = this.sequenceCounters[key].toString().padStart(3, '0');
    }

    // Auto-generate date if not provided (ngày gửi khách)
    if (template.fields.some(f => f.type === 'date' && f.key === 'date') && !values.date) {
      values.date = new Date().toLocaleDateString('vi-VN');
    }

    // Replace placeholders in pattern
    let code = template.pattern;
    Object.entries(values).forEach(([key, value]) => {
      if (value) {
        code = code.replace(`{${key}}`, value);
      }
    });

    // Remove any remaining empty placeholders
    code = code.replace(/\s*-\s*\{[^}]+\}/g, '');
    code = code.replace(/\{[^}]+\}/g, '');

    return {
      code,
      template,
      values,
      generatedAt: new Date()
    };
  }

  static validateFields(template: DesignCodeTemplate, values: Record<string, string>): string[] {
    const errors: string[] = [];
    
    template.fields.forEach(field => {
      if (field.required && !values[field.key]) {
        errors.push(`${field.label} là bắt buộc`);
      }
    });

    return errors;
  }

  static getTemplateByType(designType: string): DesignCodeTemplate | undefined {
    return designCodeTemplates.find(t => 
      t.fields.some(f => f.key === 'designType' && f.options?.includes(designType))
    );
  }

  static getAllTemplates(): DesignCodeTemplate[] {
    return designCodeTemplates;
  }
}