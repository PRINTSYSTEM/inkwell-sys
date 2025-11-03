import { Material, MaterialType, MaterialTypeCategory } from '@/types';
import { mockMaterials, mockMaterialTypeCategories } from '@/lib/mockData';

// Pagination interface
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Filter interfaces
export interface MaterialFilters {
  type?: MaterialType | MaterialType[];
  category?: string;
  supplier?: string;
  lowStock?: boolean;
  searchQuery?: string;
}

export interface MaterialSearchParams extends PaginationParams {
  filters?: MaterialFilters;
  sortBy?: 'name' | 'code' | 'currentStock' | 'unitPrice' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

// Simulated database storage - mutable for CRUD operations
// eslint-disable-next-line prefer-const
let materials: Material[] = [...mockMaterials];
// eslint-disable-next-line prefer-const  
let materialTypeCategories: MaterialTypeCategory[] = [...mockMaterialTypeCategories];

// Material CRUD Operations
export class MaterialService {
  // Get all materials with pagination and filtering
  static async getMaterials(params: MaterialSearchParams = { page: 1, pageSize: 10 }): Promise<PaginatedResponse<Material>> {
    await this.simulateDelay();
    
    let filteredMaterials = [...materials];
    
    // Apply filters
    if (params.filters) {
      const { type, category, supplier, lowStock, searchQuery } = params.filters;
      
      if (type) {
        const types = Array.isArray(type) ? type : [type];
        filteredMaterials = filteredMaterials.filter(m => types.includes(m.type));
      }
      
      if (category) {
        filteredMaterials = filteredMaterials.filter(m => 
          m.category.toLowerCase().includes(category.toLowerCase())
        );
      }
      
      if (supplier) {
        filteredMaterials = filteredMaterials.filter(m => 
          m.supplier.toLowerCase().includes(supplier.toLowerCase())
        );
      }
      
      if (lowStock) {
        filteredMaterials = filteredMaterials.filter(m => m.currentStock <= m.minStock);
      }
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredMaterials = filteredMaterials.filter(m => 
          m.name.toLowerCase().includes(query) ||
          m.code.toLowerCase().includes(query) ||
          m.category.toLowerCase().includes(query) ||
          m.supplier.toLowerCase().includes(query)
        );
      }
    }
    
    // Apply sorting
    if (params.sortBy) {
      filteredMaterials.sort((a, b) => {
        const aValue = a[params.sortBy!];
        const bValue = b[params.sortBy!];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue);
          return params.sortOrder === 'desc' ? -comparison : comparison;
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          const comparison = aValue - bValue;
          return params.sortOrder === 'desc' ? -comparison : comparison;
        }
        
        return 0;
      });
    }
    
    // Apply pagination
    const total = filteredMaterials.length;
    const totalPages = Math.ceil(total / params.pageSize);
    const startIndex = (params.page - 1) * params.pageSize;
    const paginatedData = filteredMaterials.slice(startIndex, startIndex + params.pageSize);
    
    return {
      data: paginatedData,
      total,
      page: params.page,
      pageSize: params.pageSize,
      totalPages
    };
  }
  
  // Get material by ID
  static async getMaterialById(id: string): Promise<Material | null> {
    await this.simulateDelay();
    return materials.find(m => m.id === id) || null;
  }
  
  // Get material by code
  static async getMaterialByCode(code: string): Promise<Material | null> {
    await this.simulateDelay();
    return materials.find(m => m.code === code) || null;
  }
  
  // Create new material
  static async createMaterial(materialData: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>): Promise<Material> {
    await this.simulateDelay();
    
    // Validate unique code
    const existingMaterial = materials.find(m => m.code === materialData.code);
    if (existingMaterial) {
      throw new Error(`Material với mã ${materialData.code} đã tồn tại`);
    }
    
    const newMaterial: Material = {
      ...materialData,
      id: `mat${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    materials.push(newMaterial);
    return newMaterial;
  }
  
  // Update material
  static async updateMaterial(id: string, updates: Partial<Omit<Material, 'id' | 'createdAt'>>): Promise<Material> {
    await this.simulateDelay();
    
    const materialIndex = materials.findIndex(m => m.id === id);
    if (materialIndex === -1) {
      throw new Error(`Không tìm thấy material với ID ${id}`);
    }
    
    // Validate unique code if updating code
    if (updates.code) {
      const existingMaterial = materials.find(m => m.code === updates.code && m.id !== id);
      if (existingMaterial) {
        throw new Error(`Material với mã ${updates.code} đã tồn tại`);
      }
    }
    
    const updatedMaterial: Material = {
      ...materials[materialIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    materials[materialIndex] = updatedMaterial;
    return updatedMaterial;
  }
  
  // Delete material
  static async deleteMaterial(id: string): Promise<boolean> {
    await this.simulateDelay();
    
    const materialIndex = materials.findIndex(m => m.id === id);
    if (materialIndex === -1) {
      throw new Error(`Không tìm thấy material với ID ${id}`);
    }
    
    materials.splice(materialIndex, 1);
    return true;
  }
  
  // Get materials by type
  static async getMaterialsByType(type: MaterialType): Promise<Material[]> {
    await this.simulateDelay();
    return materials.filter(m => m.type === type);
  }
  
  // Get low stock materials
  static async getLowStockMaterials(): Promise<Material[]> {
    await this.simulateDelay();
    return materials.filter(m => m.currentStock <= m.minStock);
  }
  
  // Update stock levels
  static async updateStock(id: string, newStock: number, reason?: string): Promise<Material> {
    await this.simulateDelay();
    
    const material = await this.getMaterialById(id);
    if (!material) {
      throw new Error(`Không tìm thấy material với ID ${id}`);
    }
    
    return await this.updateMaterial(id, {
      currentStock: newStock,
      notes: reason ? `${material.notes || ''}\n[${new Date().toLocaleDateString()}] Stock update: ${reason}` : material.notes
    });
  }
  
  // Bulk update prices
  static async bulkUpdatePrices(updates: Array<{ id: string; unitPrice: number }>): Promise<Material[]> {
    await this.simulateDelay();
    
    const updatedMaterials: Material[] = [];
    
    for (const update of updates) {
      try {
        const updated = await this.updateMaterial(update.id, { unitPrice: update.unitPrice });
        updatedMaterials.push(updated);
      } catch (error) {
        console.warn(`Failed to update price for material ${update.id}:`, error);
      }
    }
    
    return updatedMaterials;
  }
  
  // Get unique suppliers
  static async getSuppliers(): Promise<string[]> {
    await this.simulateDelay();
    const suppliers = new Set(materials.map(m => m.supplier));
    return Array.from(suppliers).sort();
  }
  
  // Get unique categories by type
  static async getCategoriesByType(type?: MaterialType): Promise<string[]> {
    await this.simulateDelay();
    const filtered = type ? materials.filter(m => m.type === type) : materials;
    const categories = new Set(filtered.map(m => m.category));
    return Array.from(categories).sort();
  }
  
  // Simulate network delay
  private static async simulateDelay(ms: number = 100): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Material Type Category Operations
export class MaterialTypeCategoryService {
  // Get all material type categories
  static async getMaterialTypeCategories(): Promise<MaterialTypeCategory[]> {
    await this.simulateDelay();
    return [...materialTypeCategories];
  }
  
  // Get active material type categories
  static async getActiveMaterialTypeCategories(): Promise<MaterialTypeCategory[]> {
    await this.simulateDelay();
    return materialTypeCategories.filter(c => c.isActive);
  }
  
  // Get categories by material type
  static async getCategoriesByMaterialType(materialType: MaterialType): Promise<MaterialTypeCategory[]> {
    await this.simulateDelay();
    return materialTypeCategories.filter(c => c.materialType === materialType && c.isActive);
  }
  
  // Get category by ID
  static async getCategoryById(id: string): Promise<MaterialTypeCategory | null> {
    await this.simulateDelay();
    return materialTypeCategories.find(c => c.id === id) || null;
  }
  
  // Create new category
  static async createCategory(categoryData: Omit<MaterialTypeCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<MaterialTypeCategory> {
    await this.simulateDelay();
    
    const newCategory: MaterialTypeCategory = {
      ...categoryData,
      id: `mtc${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    materialTypeCategories.push(newCategory);
    return newCategory;
  }
  
  // Update category
  static async updateCategory(id: string, updates: Partial<Omit<MaterialTypeCategory, 'id' | 'createdAt'>>): Promise<MaterialTypeCategory> {
    await this.simulateDelay();
    
    const categoryIndex = materialTypeCategories.findIndex(c => c.id === id);
    if (categoryIndex === -1) {
      throw new Error(`Không tìm thấy category với ID ${id}`);
    }
    
    const updatedCategory: MaterialTypeCategory = {
      ...materialTypeCategories[categoryIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    materialTypeCategories[categoryIndex] = updatedCategory;
    return updatedCategory;
  }
  
  // Delete category
  static async deleteCategory(id: string): Promise<boolean> {
    await this.simulateDelay();
    
    const categoryIndex = materialTypeCategories.findIndex(c => c.id === id);
    if (categoryIndex === -1) {
      throw new Error(`Không tìm thấy category với ID ${id}`);
    }
    
    materialTypeCategories.splice(categoryIndex, 1);
    return true;
  }
  
  // Toggle category active status
  static async toggleCategoryStatus(id: string): Promise<MaterialTypeCategory> {
    await this.simulateDelay();
    
    const category = await this.getCategoryById(id);
    if (!category) {
      throw new Error(`Không tìm thấy category với ID ${id}`);
    }
    
    return await this.updateCategory(id, { isActive: !category.isActive });
  }
  
  // Simulate network delay
  private static async simulateDelay(ms: number = 100): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export individual functions for convenience
export const {
  getMaterials,
  getMaterialById,
  getMaterialByCode,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  getMaterialsByType,
  getLowStockMaterials,
  updateStock,
  bulkUpdatePrices,
  getSuppliers,
  getCategoriesByType
} = MaterialService;

export const {
  getMaterialTypeCategories,
  getActiveMaterialTypeCategories,
  getCategoriesByMaterialType,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus
} = MaterialTypeCategoryService;