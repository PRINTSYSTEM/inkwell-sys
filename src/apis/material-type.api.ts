import { api } from "@/lib/http";
import { API_SUFFIX } from "./util.api";
import {
  CreateMaterialTypeRequest,
  MaterialTypeEntity,
  UpdateMaterialTypeRequest,
} from "@/Schema";

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
  data: UpdateMaterialTypeRequest
): Promise<MaterialTypeEntity> => {
  return api.put<MaterialTypeEntity>(API_SUFFIX.MATERIAL_TYPE_BY_ID(id), data);
};

export const deleteMaterialType = async (id: number): Promise<void> => {
  return api.delete<void>(API_SUFFIX.MATERIAL_TYPE_BY_ID(id));
};
