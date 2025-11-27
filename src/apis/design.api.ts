import { http } from "@/lib/http";
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
 * Get designs assigned to current user
 */
export const getMyDesigns = async (
  params?: DesignQueryParams
): Promise<DesignListResponse> => {
  return http.get<DesignListResponse>(API_SUFFIX.MY_DESIGNS, params);
};

/**
 * Add timeline entry to design
 */
export const addTimelineEntry = async (
  id: number,
  entry: CreateTimelineEntry
): Promise<void> => {
  return http.post<void>(API_SUFFIX.DESIGN_TIMELINE(id), entry);
};

/**
 * Get timeline for design
 */
export const getTimelineEntries = async (
  id: number
): Promise<TimelineEntry[]> => {
  return http.get<TimelineEntry[]>(API_SUFFIX.DESIGN_TIMELINE(id));
};

/**
 * Generate Excel file for design
 */
export const generateDesignExcel = async (designId: number): Promise<void> => {
  // Using download utility for direct file download
  return http.download(
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

  return http.upload<void>(API_SUFFIX.DESIGN_UPLOAD(id), formData);
};

export const getDesignEmployees = async (): Promise<UserListResponse> => {
  return http.get<UserListResponse>(API_SUFFIX.DESIGN_EMPLOYEES());
};

export const getEmployeeDesigns = async (
  params: DesignQueryParams
): Promise<DesignListResponse> => {
  const { designerId, ...rest } = params;

  return http.get<DesignListResponse>(
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
  getMyDesigns,
  addTimelineEntry,
  getTimelineEntries,
  generateDesignExcel,
  uploadDesignFile,
};
