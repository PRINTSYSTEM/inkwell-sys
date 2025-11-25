// Bulk add materials API
export interface BulkAddMaterialsRequest {
  designTypeId: number;
  materials: Array<{
    code: string;
    name: string;
    displayOrder: number;
    description?: string;
    price: number;
    pricePerCm2: number;
    status: string;
  }>;
}

export const bulkAddMaterials = async (
  data: BulkAddMaterialsRequest
): Promise<void> => {
  return api.post<void>("designs/materials/bulk", data);
};
import { api } from "@/lib/http";
import { API_SUFFIX } from "./util.api";
import { MaterialTypeEntity } from "@/Schema";

// Material Type API Types
export interface MaterialType {
  id: number;
  code: string;
  name: string;
  description?: string;
  displayOrder: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: number;
    username: string;
    fullName: string;
  };
}

export interface MaterialTypesResponse {
  items: MaterialType[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface CreateMaterialTypeRequest {
  code: string;
  name: string;
  description?: string;
  displayOrder: number;
  status?: string;
}

// Design Type API Types
export interface DesignType {
  id: number;
  code: string;
  name: string;
  description?: string;
  displayOrder: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: number;
    username: string;
    fullName: string;
  };
}

export interface DesignTypesResponse {
  items: DesignType[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface CreateDesignTypeRequest {
  code: string;
  name: string;
  description?: string;
  displayOrder: number;
  status?: string;
}

// Material Type API Functions
export const getMaterialTypes = async (params?: {
  status?: string;
}): Promise<MaterialTypeEntity[]> => {
  return api.get<MaterialTypeEntity[]>(API_SUFFIX.MATERIAL_TYPES, params);
};

export const getMaterialTypeById = async (
  id: number
): Promise<MaterialTypeEntity> => {
  return api.get<MaterialTypeEntity>(API_SUFFIX.MATERIAL_TYPE_BY_ID(id));
};

export const createMaterialType = async (
  data: CreateMaterialTypeRequest
): Promise<MaterialTypeEntity> => {
  return api.post<MaterialTypeEntity>(API_SUFFIX.MATERIAL_TYPES, data);
};

export const updateMaterialType = async (
  id: number,
  data: Partial<CreateMaterialTypeRequest>
): Promise<MaterialTypeEntity> => {
  return api.put<MaterialTypeEntity>(API_SUFFIX.MATERIAL_TYPE_BY_ID(id), data);
};

export const deleteMaterialType = async (id: number): Promise<void> => {
  return api.delete<void>(API_SUFFIX.MATERIAL_TYPE_BY_ID(id));
};

// Design Type API Functions
export const getDesignTypes = async (params?: {
  pageNumber?: number;
  pageSize?: number;
  status?: string;
}): Promise<DesignType[]> => {
  return api.get<DesignType[]>(API_SUFFIX.DESIGN_TYPES, { params });
};

export const getDesignTypeById = async (id: number): Promise<DesignType> => {
  return api.get<DesignType>(API_SUFFIX.DESIGN_TYPE_BY_ID(id));
};

export const createDesignType = async (
  data: CreateDesignTypeRequest
): Promise<DesignType> => {
  return api.post<DesignType>(API_SUFFIX.DESIGN_TYPES, data);
};

export const updateDesignType = async (
  id: number,
  data: Partial<CreateDesignTypeRequest>
): Promise<DesignType> => {
  return api.put<DesignType>(API_SUFFIX.DESIGN_TYPE_BY_ID(id), data);
};

export const deleteDesignType = async (id: number): Promise<void> => {
  return api.delete<void>(API_SUFFIX.DESIGN_TYPE_BY_ID(id));
};
