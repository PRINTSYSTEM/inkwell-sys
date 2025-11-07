import {
  Material,
  CreateMaterialSchema,
  UpdateMaterialSchema,
  MaterialFilterSchema,
  validateSchema,
  formatValidationErrors,
  z
} from '@/Schema';
import type { MaterialFilter } from '@/Schema';
import { mockMaterials, mockMaterialTypeCategories } from '@/lib/mockData';

// Pagination and response types from Zod schemas
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

export interface MaterialSearchParams extends PaginationParams {
  filters?: MaterialFilter;
  sortBy?: 'name' | 'code' | 'currentStock' | 'unitPrice' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

// Simulated database storage - mutable for CRUD operations
// eslint-disable-next-line prefer-const
let materials: Material[] = [...mockMaterials];
// Note: MaterialTypeCategory removed as it's not in Zod schema

// Material CRUD Operations
export class MaterialService {
  // Get all materials with pagination and filtering
  static async getMaterials(params: MaterialSearchParams = { page: 1, pageSize: 10 }): Promise<PaginatedResponse<Material>> {
    await this.simulateDelay();

    // Validate filters using Zod
    if (params.filters) {
      const validationResult = validateSchema(MaterialFilterSchema, params.filters);
      if (!validationResult.success) {
        const errorResult = validationResult as { success: false; errors: z.ZodError };
        throw new Error(`Invalid filters: ${formatValidationErrors(errorResult.errors)}`);
      }
    }
    
    let filteredMaterials = [...materials];
    
    // Apply filters using validated data
    if (params.filters) {
      const filters = params.filters;
      
      if (filters.category) {
        filteredMaterials = filteredMaterials.filter(m => m.category === filters.category);
      }
      
      if (filters.supplierId) {
        filteredMaterials = filteredMaterials.filter(m => m.supplierId === filters.supplierId);
      }
      
      if (filters.lowStock) {
        filteredMaterials = filteredMaterials.filter(m => 
          m.inventory?.currentStock !== undefined && 
          m.inventory.currentStock <= (m.inventory.minimumThreshold || 0)
        );
      }

      if (filters.outOfStock) {
        filteredMaterials = filteredMaterials.filter(m => 
          m.inventory?.currentStock === 0
        );
      }
      
      if (filters.search) {
        const query = filters.search.toLowerCase();
        filteredMaterials = filteredMaterials.filter(m => 
          m.name?.toLowerCase().includes(query) ||
          m.code?.toLowerCase().includes(query) ||
          m.description?.toLowerCase().includes(query)
        );
      }

      if (filters.status) {
        filteredMaterials = filteredMaterials.filter(m => m.status === filters.status);
      }

      if (filters.isActive !== undefined) {
        filteredMaterials = filteredMaterials.filter(m => m.isActive === filters.isActive);
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
  static async createMaterial(materialData: unknown): Promise<Material> {
    await this.simulateDelay();

    // Validate input data using Zod
    const validationResult = validateSchema(CreateMaterialSchema, materialData);
    if (!validationResult.success) {
      const errorResult = validationResult as { success: false; errors: z.ZodError };
      throw new Error(`Validation failed: ${JSON.stringify(formatValidationErrors(errorResult.errors))}`);
    }

    const validatedData = validationResult.data;
    
    // Validate unique code
    const existingMaterial = materials.find(m => m.code === validatedData.code);
    if (existingMaterial) {
      throw new Error(`Material với mã ${validatedData.code} đã tồn tại`);
    }
    
    const newMaterial: Material = {
      ...validatedData,
      id: `mat${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    materials.push(newMaterial);
    return newMaterial;
  }

  // Update material
  static async updateMaterial(id: string, updates: unknown): Promise<Material> {
    await this.simulateDelay();

    // Validate update data using Zod
    const validationResult = validateSchema(UpdateMaterialSchema, updates);
    if (!validationResult.success) {
      const errorResult = validationResult as { success: false; errors: z.ZodError };
      throw new Error(`Validation failed: ${JSON.stringify(formatValidationErrors(errorResult.errors))}`);
    }

    const validatedUpdates = validationResult.data;
    
    const materialIndex = materials.findIndex(m => m.id === id);
    if (materialIndex === -1) {
      throw new Error(`Không tìm thấy material với ID ${id}`);
    }
    
    // Validate unique code if updating code
    if (validatedUpdates.code) {
      const existingMaterial = materials.find(m => m.code === validatedUpdates.code && m.id !== id);
      if (existingMaterial) {
        throw new Error(`Material với mã ${validatedUpdates.code} đã tồn tại`);
      }
    }
    
    const updatedMaterial: Material = {
      ...materials[materialIndex],
      ...validatedUpdates,
      updatedAt: new Date()
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