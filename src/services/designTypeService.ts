import { BaseService } from './BaseService';
import {
  DesignTypeEntity,
  DesignTypeEntitySchema,
  CreateDesignTypeRequest,
  UpdateDesignTypeRequest,
  DesignTypeListResponse,
  DesignTypeListSchema,
  DesignTypeStats,
  DesignTypeStatsSchema,
} from '../Schema/design-type.schema';

class DesignTypeService extends BaseService {
  constructor() {
    super('designs/types');
  }

  /**
   * Get all design types with pagination
   */
  async getDesignTypes(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
  }): Promise<DesignTypeListResponse> {
    const response = await this.findMany<DesignTypeEntity>(params);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch design types');
    }
    // Transform response to match expected format
    return DesignTypeListSchema.parse({
      data: response.data,
      pagination: {
        page: params?.page || 1,
        pageSize: params?.pageSize || 10,
        total: response.data?.length || 0,
        totalPages: Math.ceil((response.data?.length || 0) / (params?.pageSize || 10)),
      }
    });
  }

  /**
   * Get design type by ID
   */
  async getDesignTypeById(id: number): Promise<DesignTypeEntity> {
    const response = await this.findById<DesignTypeEntity>(id);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Design type not found');
    }
    return DesignTypeEntitySchema.parse(response.data);
  }

  /**
   * Create new design type
   */
  async createDesignType(data: CreateDesignTypeRequest): Promise<DesignTypeEntity> {
    const response = await this.create<DesignTypeEntity>(data);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create design type');
    }
    return DesignTypeEntitySchema.parse(response.data);
  }

  /**
   * Update design type
   */
  async updateDesignType(id: number, data: UpdateDesignTypeRequest): Promise<DesignTypeEntity> {
    const response = await this.update<DesignTypeEntity>(id, data);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update design type');
    }
    return DesignTypeEntitySchema.parse(response.data);
  }

  /**
   * Delete design type
   */
  async deleteDesignType(id: number): Promise<void> {
    const response = await this.delete(id);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete design type');
    }
  }

  /**
   * Get design type statistics
   */
  async getDesignTypeStats(): Promise<DesignTypeStats> {
    try {
      // Get all design types with a large page size to calculate stats
      const allDesignTypes: DesignTypeEntity[] = [];
      let page = 1;
      const pageSize = 100;
      
      while (true) {
        const response = await this.getDesignTypes({ page, pageSize });
        allDesignTypes.push(...response.data);
        
        if (page >= response.pagination.totalPages) {
          break;
        }
        page++;
      }

      const total = allDesignTypes.length;
      const active = allDesignTypes.filter(dt => dt.status === 'active').length;
      const inactive = total - active;

      return DesignTypeStatsSchema.parse({
        total,
        active,
        inactive,
      });
    } catch (error) {
      console.error('Error calculating design type stats:', error);
      return {
        total: 0,
        active: 0,
        inactive: 0,
      };
    }
  }

  /**
   * Get all active design types for dropdown/selection
   */
  async getActiveDesignTypes(): Promise<DesignTypeEntity[]> {
    const response = await this.getDesignTypes({ 
      pageSize: 1000, // Large number to get all active types
      status: 'active' 
    });
    return response.data;
  }
}

export const designTypeService = new DesignTypeService();