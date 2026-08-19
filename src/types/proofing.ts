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
  dimensions?: string; // dimension string (e.g. Length x Width x Height)
  unit: string; // "mm" (constant)
  quantity: number; // from OrderDetailResponse.quantity
  availableQuantity?: number; // Số lượng tối đa có thể tạo bình bài (from design.availableQuantityForProofing in response, or fetched separately if missing)
  unitPrice?: number; // from OrderDetailResponse.unitPrice
  orderId: string; // from OrderDetailResponse.orderId (converted to string)
  orderCode?: string; // from design.latestOrderCode
  customerName?: string; // from design.customer?.name
  customerCompanyName?: string; // from design.customer?.companyName
  processClassificationOptionName?: string; // from design.processClassification
  sidesClassification?: string; // from design.sidesClassification
  laminationType?: string; // from design.laminationType
  thumbnailUrl: string; // from design.designThumbnailUrl || design.designImageUrl
  largeImageUrl?: string; // from design.designImageUrl
  createdAt: string; // from design.createdAt
  designCreatedAt?: string;
  designUpdatedAt?: string;
  designId?: number; // from design.id (for fetching available quantity)
  designerName?: string; // from design.designer?.name
  accountantName?: string; // from design.accountant?.name
  specification?: string[]; // from design.specification
  queueItemId?: string; // from BE queueItemId ("RD_xxx" or "OD_xxx")
  readyDesignId?: number; // from BE readyDesignId
  availableForProofing?: number; // from BE availableForProofing
  basisWeight?: number; // from design.basisWeight
  unitName?: string; // from design.unitName (e.g. "Bộ")
  isDecalSet?: boolean; // from BE isDecalSet (true if decal set)
  availableFrontQty?: number | null; // Available quantity for front side (mặt trước) in sheets
  availableBackQty?: number | null; // Available quantity for back side (mặt sau) in sheets
  createdBy?: string;
  proofingAllocations?: ProofingAllocation[];
}

export interface ProofingAllocation {
  proofingOrderId?: number;
  proofingOrderCode?: string | null;
  side?: "both" | "front" | "back" | string;
  quantityTaken?: number;
  quantityInSheets?: number;
  proofingOrderStatus?: string | null;
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

export function checkIsDecalSet(item: {
  isDecalSet?: boolean;
  unitName?: string;
  designTypeName?: string;
  materialTypeName?: string;
  sidesClassification?: string;
} | null | undefined): boolean {
  if (!item) return false;
  if (item.isDecalSet === true) return true;
  if (item.unitName === "Bộ" || item.unitName === "bo" || item.unitName === "bộ") return true;
  const isDecal = (item.designTypeName || item.materialTypeName || "").toLowerCase().includes("decal");
  const isTwoSide = item.sidesClassification === "two_side" || item.sidesClassification === "both";
  return isDecal && isTwoSide;
}
