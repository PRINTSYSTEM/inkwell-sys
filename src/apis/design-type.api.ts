// src/apis/design-type.api.ts
import { api } from "@/lib/http";
import { API_SUFFIX } from "./util.api";
import {
  DesignTypeEntity,
  DesignTypeQueryParams,
  CreateDesignTypeRequest,
} from "@/Schema";

// GET /designs/types
export const getDesignTypes = async (
  params?: DesignTypeQueryParams
): Promise<DesignTypeEntity[]> => {
  return api.get<DesignTypeEntity[]>(API_SUFFIX.DESIGN_TYPES, params);
};

// POST /designs/types
export const createDesignType = async (
  data: CreateDesignTypeRequest
): Promise<DesignTypeEntity> => {
  return api.post<DesignTypeEntity>(API_SUFFIX.DESIGN_TYPES, data);
};

// PUT /designs/types/{id}
export const updateDesignType = async (
  id: number,
  data: Partial<CreateDesignTypeRequest>
): Promise<DesignTypeEntity> => {
  return api.put<DesignTypeEntity>(`${API_SUFFIX.DESIGN_TYPES}/${id}`, data);
};

// DELETE /designs/types/{id}
export const deleteDesignType = async (id: number): Promise<void> => {
  return api.delete<void>(`${API_SUFFIX.DESIGN_TYPES}/${id}`);
};

export default {
  getDesignTypes,
  createDesignType,
  updateDesignType,
  deleteDesignType,
};
