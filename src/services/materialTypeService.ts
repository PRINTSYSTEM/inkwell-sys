import { BaseService } from './BaseService';
import {
  MaterialTypeEntity,
  MaterialTypeEntitySchema,
  CreateMaterialTypeRequest,
  UpdateMaterialTypeRequest,
  MaterialTypeListResponse,
  MaterialTypeListSchema,
  MaterialTypeStats,
  MaterialTypeStatsSchema,
} from '../Schema/material-type.schema';

class MaterialTypeService extends BaseService {
  constructor() {
    super('designs/materials');
  }

  /**
   * Get all material types with pagination
   */
  async getMaterialTypes(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
  }): Promise<MaterialTypeListResponse> {
    try {
      const response = await this.findMany<MaterialTypeEntity>(params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch material types');
      }
      
      // Transform response to match expected format
      return MaterialTypeListSchema.parse({
        data: response.data,
        pagination: {
          page: params?.page || 1,
          pageSize: params?.pageSize || 10,
          total: response.data?.length || 0,
          totalPages: Math.ceil((response.data?.length || 0) / (params?.pageSize || 10)),
        }
      });
    } catch (error) {
      console.error('Error in getMaterialTypes:', error);
      throw error;
    }
  }

  /**
   * Get material type by ID
   */
  async getMaterialTypeById(id: number): Promise<MaterialTypeEntity> {
    const response = await this.findById<MaterialTypeEntity>(id);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Material type not found');
    }
    return MaterialTypeEntitySchema.parse(response.data);
  }

  /**
   * Create new material type
   */
  async createMaterialType(data: CreateMaterialTypeRequest): Promise<MaterialTypeEntity> {
    const response = await this.create<MaterialTypeEntity>(data);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create material type');
    }
    return MaterialTypeEntitySchema.parse(response.data);
  }

  /**
   * Update material type
   */
  async updateMaterialType(id: number, data: UpdateMaterialTypeRequest): Promise<MaterialTypeEntity> {
    const response = await this.update<MaterialTypeEntity>(id, data);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update material type');
    }
    return MaterialTypeEntitySchema.parse(response.data);
  }

  /**
   * Delete material type
   */
  async deleteMaterialType(id: number): Promise<void> {
    const response = await this.delete(id);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete material type');
    }
  }

  /**
   * Get material type statistics
   */
  async getMaterialTypeStats(): Promise<MaterialTypeStats> {
    try {
      // Get all material types with a large page size to calculate stats
      const allMaterialTypes: MaterialTypeEntity[] = [];
      let page = 1;
      const pageSize = 100;
      
      while (true) {
        const response = await this.getMaterialTypes({ page, pageSize });
        allMaterialTypes.push(...response.data);
        
        if (page >= response.pagination.totalPages) {
          break;
        }
        page++;
      }

      const total = allMaterialTypes.length;
      const active = allMaterialTypes.filter(mt => mt.status === 'active').length;
      const inactive = total - active;

      return MaterialTypeStatsSchema.parse({
        total,
        active,
        inactive,
      });
    } catch (error) {
      console.error('Error calculating material type stats:', error);
      return {
        total: 0,
        active: 0,
        inactive: 0,
      };
    }
  }

  /**
   * Get all active material types for dropdown/selection
   */
  async getActiveMaterialTypes(): Promise<MaterialTypeEntity[]> {
    const response = await this.getMaterialTypes({ 
      pageSize: 1000, // Large number to get all active types
      status: 'active' 
    });
    return response.data;
  }
}

export const materialTypeService = new MaterialTypeService();