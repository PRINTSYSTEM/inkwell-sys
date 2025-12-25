export interface DesignItem {
  id: number;
  code: string;
  name: string;
  designTypeId: number;
  designTypeName: string;
  materialTypeId: number;
  materialTypeName: string;
  width: number;
  height: number;
  unit: string;
  quantity: number;
  availableQuantity?: number; // Số lượng tối đa có thể tạo bình bài
  unitPrice: number;
  orderId: string;
  orderCode: string;
  customerName: string;
  customerCompanyName?: string;
  processClassificationOptionName?: string; // Quy trình sản xuất
  thumbnailUrl: string;
  createdAt: string;
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
