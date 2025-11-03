export interface DesignCodeTemplate {
  id: string;
  name: string;
  pattern: string;
  description: string;
  fields: DesignCodeField[];
  example: string;
}

export interface DesignCodeField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'auto';
  required: boolean;
  options?: string[]; // For select type
  placeholder?: string;
  defaultValue?: string;
}

export interface GeneratedDesignCode {
  code: string;
  template: DesignCodeTemplate;
  values: Record<string, string>;
  generatedAt: Date;
}

// Predefined design types and materials
export const DESIGN_TYPES = [
  'Hộp',
  'Túi',
  'Nhãn',
  'Tem',
  'Catalog',
  'Brochure',
  'Poster',
  'Banner',
  'Card',
  'Sticker'
];

export const PAPER_TYPES = [
  'D350',
  'D400',
  'D450',
  'Couche 250gsm',
  'Couche 300gsm',
  'Art Paper 230gsm',
  'Art Paper 300gsm',
  'Kraft Paper',
  'Duplex',
  'Ivory'
];

export const PRINT_TECHNIQUES = [
  'Offset 4 màu',
  'Offset 1 màu',
  'Digital Print',
  'UV Print',
  'Silk Screen',
  'Flexo Print'
];

export const FINISHING_OPTIONS = [
  'Cán màng',
  'Ép kim',
  'Ép nhiệt',
  'Đóng gói',
  'Cắt die',
  'Gấp',
  'Dán'
];