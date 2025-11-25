import { api } from "@/lib/http";
import { API_SUFFIX } from "./util.api";
import type {
  Design,
  DesignListResponse,
  DesignQueryParams,
  CreateDesignRequest,
  UpdateDesignRequest,
  CreateTimelineEntry,
  TimelineEntry,
  UserListResponse,
  UserType,
} from "@/Schema";

/**
 * Get all designs with pagination and filters
 */
export const getDesigns = async (
  params?: DesignQueryParams
): Promise<DesignListResponse> => {
  return api.paginated<Design>(API_SUFFIX.DESIGNS, params);
};

/**
 * Get designs assigned to current user
 */
export const getMyDesigns = async (
  params?: DesignQueryParams
): Promise<DesignListResponse> => {
  return api.paginated<Design>(API_SUFFIX.MY_DESIGNS, params);
};

/**
 * Get design by ID
 */
export const getDesignById = async (id: number): Promise<Design> => {
  return api.get<Design>(API_SUFFIX.DESIGN_BY_ID(id));
};

/**
 * Create new design
 */
export const createDesign = async (
  data: CreateDesignRequest
): Promise<Design> => {
  return api.post<Design>(API_SUFFIX.DESIGNS, data);
};

/**
 * Update design
 */
export const updateDesign = async (
  id: number,
  data: UpdateDesignRequest
): Promise<Design> => {
  return api.put<Design>(API_SUFFIX.DESIGN_BY_ID(id), data);
};

/**
 * Delete design
 */
export const deleteDesign = async (id: number): Promise<void> => {
  return api.delete<void>(API_SUFFIX.DESIGN_BY_ID(id));
};

/**
 * Add timeline entry to design
 */
export const addTimelineEntry = async (
  id: number,
  entry: CreateTimelineEntry
): Promise<void> => {
  return api.post<void>(API_SUFFIX.DESIGN_TIMELINE(id), entry);
};

/**
 * Get timeline for design
 */
export const getTimelineEntries = async (
  id: number
): Promise<TimelineEntry[]> => {
  return api.get<TimelineEntry[]>(API_SUFFIX.DESIGN_TIMELINE(id));
};

/**
 * Generate Excel file for design
 */
export const generateDesignExcel = async (designId: number): Promise<void> => {
  // Using download utility for direct file download
  return api.download(
    API_SUFFIX.DESIGN_GENERATE_EXCEL(designId),
    `design_${designId}.xlsx`
  );
};

/**
 * Upload design file
 */
export const uploadDesignFile = async (
  id: number,
  file: File
): Promise<void> => {
  const formData = new FormData();
  formData.append("file", file);

  return api.upload<void>(API_SUFFIX.DESIGN_UPLOAD(id), formData);
};

export const getDesignEmployees = async (): Promise<UserListResponse> => {
  return api.get<UserListResponse>(API_SUFFIX.DESIGN_EMPLOYEES());
};

export const getEmployeeDesigns = async (
  params: DesignQueryParams
): Promise<DesignListResponse> => {
  const { designerId, ...rest } = params;

  return api.get<DesignListResponse>(
    API_SUFFIX.DESIGN_EMPLOYEE_ID(designerId),
    {
      pageNumber: rest.pageNumber,
      pageSize: rest.pageSize,
      search: rest.search || "",
      sortBy: rest.sortBy || "",
      sortOrder: rest.sortOrder || "",
      status: rest.status || "",
    }
  );
};

export default {
  getDesigns,
  getMyDesigns,
  getDesignById,
  createDesign,
  updateDesign,
  deleteDesign,
  addTimelineEntry,
  getTimelineEntries,
  generateDesignExcel,
  uploadDesignFile,
};
