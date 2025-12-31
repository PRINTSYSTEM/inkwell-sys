import type { OrderDetailResponse } from "@/Schema/order.schema";

/**
 * DesignItem - Transformed from OrderDetailResponse for proofing UI
 * Based on OrderDetailResponse schema with additional flattened fields
 */
export interface DesignItem {
  id: number; // orderDetailId from OrderDetailResponse
  code: string; // from design.code
  name: string; // from design.designName
  designTypeId: number; // from design.designTypeId
  designTypeName: string; // from design.designType?.name
  materialTypeId: number; // from design.materialTypeId
  materialTypeName: string; // from design.materialType?.name
  length: number; // from design.length
  width?: number; // from design.width
  height: number; // from design.height
  unit: string; // "mm" (constant)
  quantity: number; // from OrderDetailResponse.quantity
  availableQuantity?: number; // Số lượng tối đa có thể tạo bình bài (from design.availableQuantityForProofing in response, or fetched separately if missing)
  unitPrice: number; // from OrderDetailResponse.unitPrice
  orderId: string; // from OrderDetailResponse.orderId (converted to string)
  orderCode: string; // from design.latestOrderCode
  customerName: string; // from design.customer?.name
  customerCompanyName?: string; // from design.customer?.companyName
  processClassificationOptionName?: string; // from design.processClassification
  sidesClassification?: string; // from design.sidesClassification
  laminationType?: string; // from design.laminationType
  thumbnailUrl: string; // from design.designImageUrl
  createdAt: string; // from design.createdAt
  designId?: number; // from design.id (for fetching available quantity)
}

export interface FilterOption {
  id: number;
  name: string;
  count: number;
}

export interface AvailableDesignsForProofingResponse {
  designs: DesignItem[];
  designTypeOptions: FilterOption[];
  materialTypeOptions: FilterOption[];
  totalCount: number;
}

export type ViewFilter = "all" | "selected" | "unselected";

export type SortOption =
  | "code-asc"
  | "code-desc"
  | "name-asc"
  | "name-desc"
  | "quantity-desc"
  | "quantity-asc"
  | "date-desc"
  | "date-asc";

export type ViewMode = "grid" | "table";

export interface ProofingOrderPayload {
  designIds: number[];
  materialTypeId: number;
  assignedTo?: string;
  notes?: string;
}
