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
  { code: 'brochure', name: 'Brochure', description: 'Brochure quảng cáo' },
  { code: 'business_card', name: 'Name card', description: 'Danh thiếp' },
  { code: 'catalog', name: 'Catalog', description: 'Catalog sản phẩm' },
  { code: 'flyer', name: 'Flyer', description: 'Tờ rơi quảng cáo' },
  { code: 'banner', name: 'Banner', description: 'Banner quảng cáo' },
  { code: 'poster', name: 'Poster', description: 'Poster quảng cáo' },
  { code: 'menu', name: 'Menu', description: 'Menu thực đơn' },
];

/**
 * Lấy tên đầy đủ của loại thiết kế từ mã code
 */
export const getDesignTypeName = (designType: string): string => {
  const config = designTypeConfigs.find(config => config.code === designType);
  return config ? config.name : designType;
};

/**
 * Lấy mô tả của loại thiết kế từ mã code
 */
export const getDesignTypeDescription = (designType: string): string => {
  const config = designTypeConfigs.find(config => config.code === designType);
  return config?.description || '';
};

/**
 * Kiểm tra xem có phải mã code hay không
 */
export const isDesignTypeCode = (designType: string): boolean => {
  return ['T', 'C', 'D', 'H', 'R'].includes(designType);
};

/**
 * Nhóm các loại thiết kế
 */
export const getDesignTypeGroups = () => {
  return {
    codes: designTypeConfigs.filter(config => ['T', 'C', 'D', 'H', 'R'].includes(config.code)),
    descriptive: designTypeConfigs.filter(config => !['T', 'C', 'D', 'H', 'R'].includes(config.code))
  };
};