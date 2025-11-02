/**
 * Design Type Configuration
 * Cấu hình các loại thiết kế với mã code và tên đầy đủ
 */

export interface DesignTypeConfig {
  code: string;
  name: string;
  description?: string;
}

export const designTypeConfigs: DesignTypeConfig[] = [
  { code: 'T', name: 'Túi giấy', description: 'Túi giấy các loại' },
  { code: 'C', name: 'Nhãn giấy', description: 'Nhãn giấy, sticker' },
  { code: 'D', name: 'Decal', description: 'Decal bế các loại' },
  { code: 'H', name: 'Hộp giấy', description: 'Hộp giấy, bao bì' },
  { code: 'R', name: 'Decal cuộn', description: 'Decal cuộn kích thước lớn' },
];

/**
 * Get design type name by code
 */
export function getDesignTypeName(code: string): string {
  const config = designTypeConfigs.find(c => c.code === code);
  return config?.name || code;
}

/**
 * Get design type description by code
 */
export function getDesignTypeDescription(code: string): string {
  const config = designTypeConfigs.find(c => c.code === code);
  return config?.description || '';
}

/**
 * Get all design type codes
 */
export function getDesignTypeCodes(): string[] {
  return designTypeConfigs.map(c => c.code);
}

/**
 * Check if design type code is valid
 */
export function isValidDesignType(code: string): boolean {
  return designTypeConfigs.some(c => c.code === code);
}