// src/lib/status-utils.ts
import { ENTITY_CONFIG } from "@/config/entities.config";

// ===== LABEL MAPPING CHO CÁC STATUS (từ ENTITY_CONFIG) =====

// Trạng thái đơn hàng
export const orderStatusLabels: Record<string, string> = {
  ...ENTITY_CONFIG.orderStatuses.values,
  ...ENTITY_CONFIG.designStatuses.values,
};

// Mô tả chi tiết cho từng trạng thái đơn hàng (đồng bộ với ENTITY_CONFIG)
export const orderStatusDescription: Record<string, string> = {
  pending: "Đơn hàng vừa được tạo, mới nhận thông tin từ khách.",
  designing: "Đơn hàng đang được thiết kế.",
  waiting_for_customer_approval: "Đang chờ khách xem và duyệt thiết kế.",
  editing: "Đang chỉnh sửa theo yêu cầu khách.",
  confirmed_for_printing:
    "Khách đã chốt file in, có thể tạo bình bài / sản xuất.",
  waiting_for_deposit: "Khách cần đặt cọc trước khi tiếp tục xử lý đơn.",
  deposit_received: "Đã nhận tiền cọc từ khách.",
  debt_approved: "Khách công ty đã được duyệt công nợ.",
  waiting_for_proofing: "Chờ tạo mã bài.",
  waiting_for_production: "Chờ tạo lệnh sản xuất.",
  in_production: "Đơn đang được xử lý tại xưởng.",
  production_completed: "Sản xuất xong, chờ giao hàng / tất toán.",
  waiting_for_delivery: "Sản phẩm đã sẵn sàng, chờ giao hàng.",
  waiting_for_redelivery: "Chờ giao lại hàng sau lần giao trước.",
  delivering: "Đang giao hàng cho khách.",
  delivered: "Đã giao hàng thành công cho khách.",
  invoice_issued: "Đã xuất hóa đơn cho đơn hàng.",
  completed: "Đơn hàng đã hoàn tất.",
  return_processing: "Đang xử lý trả/đổi hàng từ khách.",
  cancelled: "Đơn hàng bị hủy.",
};

// Trạng thái thiết kế (Design)
export const designStatusLabels: Record<string, string> = {
  ...ENTITY_CONFIG.designStatuses.values,
  available: "Sẵn sàng",
  ordered: "Đã lên đơn",
};

// Trạng thái bình bài (ProofingOrder)
export const proofingStatusLabels: Record<string, string> =
  ENTITY_CONFIG.proofingOrderStatuses.values;

// Trạng thái sản xuất (Production)
export const productionStatusLabels: Record<string, string> = {
  waiting_for_production: "Chờ điều lệnh",
  in_production: "Đang sản xuất",
  waiting: "Chờ điều lệnh",
  pending_dispatch: "Chờ điều lệnh",
  waiting_for_print: "Chờ in",
  dispatched: "Đã điều lệnh",
  completed: "Hoàn thành",
  done: "Hoàn thành",
  paused: "Tạm dừng",
  cancelled: "Đã hủy",
  overdue: "Quá hạn",
  ...ENTITY_CONFIG.productionStatuses.values,
};

export function getProductionStatusLabel(
  status: string | null | undefined,
  isDispatched?: boolean
): string {
  if (!status) return "—";
  const normalized = status.toLowerCase().trim();

  // Prioritize "Chờ điều lệnh" when order has NOT been dispatched yet
  if (
    isDispatched === false &&
    (normalized === "waiting" ||
      normalized === "waiting_for_production" ||
      normalized === "pending_dispatch" ||
      normalized === "waiting_for_print" ||
      normalized === "pending" ||
      normalized === "not_completed")
  ) {
    return "Chờ điều lệnh";
  }

  return productionStatusLabels[normalized] || productionStatusLabels[status] || status;
}

export function getProductionStepName(step: any): string {
  if (!step) return "Công đoạn";
  let rawName = "";
  if (typeof step === "string") {
    rawName = step;
  } else {
    rawName = step.stepName || step.stepTypeName || step.name || "";
  }
  if (!rawName) return "Công đoạn";

  const norm = rawName.trim().toLowerCase();
  const stepTypeMap: Record<string, string> = {
    print: "In",
    lamination: "Cán màng",
    die_cut: "Bế",
    cut: "Cắt",
    mounting: "Bồi",
    glue: "Dán",
    packaging: "Đóng gói",
    stripping: "Gỡ",
    material_export: "Xuất nguyên liệu",
    zipper: "Zipper",
    folding: "Xếp hông",
    slitting: "Xả cuộn",
    foil_stamping: "Ép kim",
    embossing: "Dập nổi",
  };
  return stepTypeMap[norm] || productionStepTypeLabels[norm] || rawName.trim();
}

/**
 * Standardize stage codes to Backend canonical lowercase stageCode values.
 */
export function toCanonicalBeStageCode(code: string): string {
  const norm = String(code || "").toLowerCase().trim();
  switch (norm) {
    case "print": case "in": return "print";
    case "lamination": case "lam": case "can": return "lamination";
    case "mounting": case "boi": return "mounting";
    case "side_seal": case "side-seal": case "pressing": case "ep_bien": case "ep-bien": return "pressing";
    case "die_cut": case "die-cut": case "be": return "die_cut";
    case "cut": case "cat": return "cut";
    case "stripping": case "go": return "go";
    case "glue": case "dan": return "glue";
    case "unwind": case "xa_cuon": case "xa-cuon": return "xa_cuon";
    case "top_seal": case "top-seal": case "ep_mieng": case "ep-mieng": return "ep_mieng";
    case "zipper": case "zip": case "chay_zip": case "chay-zip": return "chay_zip";
    case "gusset": case "xep_hong": case "xep-hong": return "xep_hong";
    case "slit": case "chia_cuon": case "chia-cuon": return "chia_cuon";
    case "chay_thanh_pham": case "chay-thanh-pham": case "finished_run": return "chay_thanh_pham";
    case "packaging": case "dong_goi": case "dong-goi": return "packaging";
    default: return norm;
  }
}

// Mô tả chi tiết cho từng trạng thái sản xuất (đồng bộ với ENTITY_CONFIG)
export const productionStatusDescription: Record<string, string> = {
  waiting_for_production:
    "Lệnh sản xuất đã được tạo, đang chờ bắt đầu sản xuất.",
  in_production: "Lệnh sản xuất đang được xử lý tại xưởng.",
  completed: "Lệnh sản xuất đã hoàn thành.",
  paused: "Lệnh sản xuất đang tạm dừng.",
  cancelled: "Lệnh sản xuất đã bị hủy.",
};

// Trạng thái mục chi tiết đơn hàng (OrderDetail)
export const orderDetailItemStatusLabels: Record<string, string> =
  ENTITY_CONFIG.orderDetailItemStatuses.values;

export const orderDetailDerivedStatusLabels: Record<string, string> =
  ENTITY_CONFIG.orderDetailDerivedStatuses.values;

// Trạng thái thanh toán (Accounting)
export const paymentStatusLabels: Record<string, string> =
  ENTITY_CONFIG.paymentStatuses.values;

// Loại khách hàng
export const customerTypeLabels: Record<string, string> =
  ENTITY_CONFIG.customerTypes.values;

// Trạng thái chung (MaterialType, DesignType, ...)
export const commonStatusLabels: Record<string, string> =
  ENTITY_CONFIG.commonStatuses.values;

// Phương thức thanh toán
export const paymentMethodLabels: Record<string, string> =
  ENTITY_CONFIG.paymentMethods.values;

// Mapping từ code API (TM, CK, TT, etc.) sang key constants
const paymentMethodCodeToKey: Record<string, string> = {
  // Vietnamese codes
  tm: "cash",
  "tiền mặt": "cash",
  "tien mat": "cash",
  cash: "cash",
  // Bank transfer
  ck: "bank_transfer",
  "chuyển khoản": "bank_transfer",
  "chuyen khoan": "bank_transfer",
  "chuyển khoản ngân hàng": "bank_transfer",
  bank_transfer: "bank_transfer",
  "bank transfer": "bank_transfer",
  // Card
  tt: "card",
  thẻ: "card",
  the: "card",
  "thẻ tín dụng": "card",
  "the tin dung": "card",
  card: "card",
  // E-wallet
  "ví điện tử": "e_wallet",
  "vi dien tu": "e_wallet",
  e_wallet: "e_wallet",
  "e wallet": "e_wallet",
  wallet: "e_wallet",
};

// ===== HELPER FUNCTIONS FOR MAPPING RESPONSE FIELDS =====

/**
 * Map payment method code/name to Vietnamese label from constants
 * Falls back to provided name if not found in constants
 */
export function getPaymentMethodLabel(
  codeOrName: string | null | undefined,
  fallbackName?: string | null
): string {
  if (!codeOrName && !fallbackName) return "—";

  // Normalize inputs
  const normalizedCode = codeOrName?.toLowerCase().trim() || "";
  const normalizedFallback = fallbackName?.toLowerCase().trim() || "";

  // If fallbackName is already Vietnamese label from constants, use it directly
  if (normalizedFallback) {
    for (const label of Object.values(paymentMethodLabels)) {
      if (label.toLowerCase() === normalizedFallback) {
        return fallbackName!;
      }
    }
  }

  // Try to find in constants by code/name
  if (normalizedCode) {
    // First, try to map code to constant key (e.g., "tm" -> "cash", "ck" -> "bank_transfer")
    const constantKey = paymentMethodCodeToKey[normalizedCode];
    if (constantKey && paymentMethodLabels[constantKey]) {
      return paymentMethodLabels[constantKey];
    }

    // Direct match with keys in paymentMethodLabels (e.g., "cash", "bank_transfer")
    if (paymentMethodLabels[normalizedCode]) {
      return paymentMethodLabels[normalizedCode];
    }

    // Try partial match without underscores
    const normalizedNoUnderscore = normalizedCode.replace(/_/g, "");
    for (const [key, label] of Object.entries(paymentMethodLabels)) {
      const keyNoUnderscore = key.replace(/_/g, "");
      if (normalizedNoUnderscore === keyNoUnderscore) {
        return label;
      }
    }

    // Try to match with label values (in case name is already Vietnamese)
    for (const label of Object.values(paymentMethodLabels)) {
      if (label.toLowerCase() === normalizedCode) {
        return label;
      }
    }
  }

  // Fallback: if fallbackName exists and is not empty, use it
  if (fallbackName && fallbackName.trim()) {
    return fallbackName;
  }

  // Last resort: return codeOrName or "—"
  return codeOrName || "—";
}

/**
 * Get Vietnamese label for cash payment/receipt status
 */
export function getCashTransactionStatusLabel(
  status: string | null | undefined
): string {
  if (!status) return "—";

  const statusLower = status.toLowerCase();

  // Map common statuses
  if (statusLower.includes("draft") || statusLower === "draft") {
    return "Nháp";
  }
  if (statusLower.includes("approved") || statusLower === "approved") {
    return "Đã duyệt";
  }
  if (statusLower.includes("posted") || statusLower === "posted") {
    return "Đã hạch toán";
  }
  if (statusLower.includes("cancelled") || statusLower === "cancelled") {
    return "Đã hủy";
  }

  // Return as-is if not mapped
  return status;
}

// Loại cán màng (LaminationType)
export const laminationTypeLabels: Record<string, string> =
  ENTITY_CONFIG.laminationTypes.values;

/**
 * Trích xuất tên loại cán màng (Chỉ trả về: Cán bóng, Cán mờ, hoặc Không cán)
 */
export function getLaminationTypeName(target: any): string {
  if (!target) return "Không cán";

  // 1. Direct fields
  const directType =
    target.laminationTypeName ||
    target.laminationType ||
    target.lamination ||
    target.laminationTypeDisplay ||
    target.proofingOrder?.laminationTypeName ||
    target.proofingOrder?.laminationType ||
    target.design?.laminationTypeName ||
    target.design?.laminationType ||
    target.designs?.[0]?.laminationTypeName ||
    target.designs?.[0]?.laminationType;

  if (directType) {
    const dLower = String(directType).toLowerCase();
    if (dLower === "none" || dLower.includes("không") || dLower.includes("khong")) return "Không cán";
    if (dLower.includes("bóng") || dLower.includes("bong") || dLower.includes("gloss")) return "Cán bóng";
    if (dLower.includes("mờ") || dLower.includes("mo") || dLower.includes("matte")) return "Cán mờ";
  }

  // 2. Parse from specification strings / notes / product title
  const rawSpec = target.specification || target.specs || target.proofingOrder?.specification;
  const specStr = typeof rawSpec === "string" ? rawSpec : Array.isArray(rawSpec) ? rawSpec.join(" ") : "";
  const combinedText = [
    specStr,
    target.productName,
    target.productionFlowName,
    target.notes,
    target.additionalNotes,
    target.proofingOrderTitle,
    target.title,
    target.name,
    ...(Array.isArray(target.designs) ? target.designs.map((d: any) => `${d.name || ""} ${d.specification || ""}`) : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (combinedText.includes("không cán") || combinedText.includes("khong can")) return "Không cán";
  if (combinedText.includes("bóng") || combinedText.includes("gloss")) return "Cán bóng";
  if (combinedText.includes("mờ") || combinedText.includes("matte")) return "Cán mờ";

  // 3. Fallback: Check if order has a Cán step
  const steps = target.steps || target.proofingOrder?.steps;
  const hasCanStep = Array.isArray(steps) && steps.some((s: any) => {
    const n = (s.stepName || s.name || s.stepCode || "").toLowerCase();
    return n.includes("cán") || n.includes("can") || n.includes("lamination");
  });

  if (hasCanStep) {
    return "Cán mờ";
  }

  return "Không cán";
}

// Loại mặt (SidesClassification)
export const sidesClassificationLabels: Record<string, string> =
  ENTITY_CONFIG.sidesClassification.values;

// Loại quy trình (ProcessClassification)
export const processClassificationLabels: Record<string, string> =
  ENTITY_CONFIG.processClassification.values;

const EXCLUDED_SPEC_STEPS = new Set([
  "bình bài",
  "binh bai",
  "proofing",
  "điều lệnh",
  "dieu lenh",
  "dispatch",
  "đóng gói",
  "dong goi",
  "packaging",
]);

const SPEC_STEP_ORDER: Record<string, number> = {
  "in": 1,
  "cán": 2,
  "cán bóng": 2,
  "cán mờ": 2,
  "cán màng": 2,
  "bồi": 3,
  "ép kim": 4,
  "ép": 4,
  "zipper": 5,
  "chạy zip": 5,
  "ép biên": 6,
  "xếp hông": 7,
  "xả cuộn": 8,
  "chia cuộn": 8,
  "cắt": 9,
  "bế": 10,
  "gỡ": 11,
  "ép miệng": 12,
  "dán": 13,
  "dán thành phẩm": 13,
  "chạy thành phẩm": 14,
};

export function sortSpecificationSteps(steps: string[], flowCode?: string): string[] {
  if (!steps || steps.length === 0) return [];
  const flowCodeUpper = typeof flowCode === "string" ? flowCode.trim().toUpperCase() : "";
  const flowSteps = flowCodeUpper ? FLOW_SPEC_STEPS_MAP[flowCodeUpper] : null;

  const result = Array.from(new Set(steps)).filter((s) => s && s !== "—");

  return result.sort((a, b) => {
    const normA = a.trim().toLowerCase();
    const normB = b.trim().toLowerCase();

    if (flowSteps) {
      const idxA = flowSteps.findIndex((s) => s.toLowerCase() === normA);
      const idxB = flowSteps.findIndex((s) => s.toLowerCase() === normB);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
    }

    const orderA = SPEC_STEP_ORDER[normA] ?? 99;
    const orderB = SPEC_STEP_ORDER[normB] ?? 99;
    return orderA - orderB;
  });
}

export const FLOW_SPEC_STEPS_MAP: Record<string, string[]> = {
  F01: ["In", "Cán", "Bế", "Gỡ", "Dán"],
  F02: ["In", "Cán", "Bế", "Gỡ", "Dán"],
  F03: ["In", "Cán", "Bồi", "Bế", "Gỡ", "Dán"],
  F04: ["In", "Cán", "Bồi", "Bế", "Gỡ", "Dán"],
  F05: ["In", "Cán", "Cắt"],
  F06: ["In", "Cán", "Cắt", "Bế", "Gỡ", "Dán"],
  F07: ["In", "Cán", "Cắt"],
  F08: ["In", "Cán", "Cắt", "Bế", "Gỡ"],
  F09: ["In", "Cán", "Cắt", "Bế", "Gỡ"],
  F10: ["In", "Cán", "Ép biên", "Xả cuộn", "Cắt", "Ép miệng"],
  F11: ["In", "Cán", "Ép biên", "Xả cuộn", "Cắt", "Ép miệng"],
  F12: ["In", "Cán", "Xếp hông", "Cắt", "Ép miệng"],
  F13: ["In", "Cán", "Xếp hông", "Cắt", "Ép miệng"],
  F14: ["In", "Cán", "Zipper", "Ép biên", "Cắt"],
  F15: ["In", "Cán", "Chạy thành phẩm"],
  F16: ["In", "Cán", "Zipper", "Chạy thành phẩm"],
  F17: ["In", "Cán", "Bế", "Chia cuộn", "Cắt"],
  F18: ["In", "Cán", "Bế", "Chia cuộn", "Cắt"],
  F19: ["In", "Cán", "Cắt", "Bế", "Gỡ", "Dán"],
};

export function getFlowCode(item: any): string {
  if (!item) return "F01";
  const target = item.design ? { ...item.design, ...item } : item;

  const rawFlowCode =
    target.flowCode ||
    target.productionFlowCode ||
    target.flow ||
    target.productionFlow?.code ||
    target.flow_code;

  if (typeof rawFlowCode === "string" && rawFlowCode.trim()) {
    const upper = rawFlowCode.trim().toUpperCase();
    if (FLOW_SPEC_STEPS_MAP[upper]) return upper;
  }

  const dtName = (target.designTypeName || target.designType?.name || "").toLowerCase();
  const matName = (target.materialTypeName || target.materialType?.name || "").toLowerCase();
  const notes = (target.notes || target.additionalNotes || "").toLowerCase();
  const pc = (target.processClassification || target.processClassificationOptionName || "").toLowerCase();

  const isZipper =
    target.isZipper ||
    target.hasZipper ||
    target.hasZip ||
    target.isZip ||
    notes.includes("zipper") ||
    notes.includes("zip");

  const isGusseted =
    target.gusseted ||
    target.isGusset ||
    target.isGusseted ||
    notes.includes("xếp hông");

  const isRoll = dtName.includes("cuộn") || matName.includes("cuộn");
  const isDecal = dtName.includes("decal") || matName.includes("decal") || dtName.includes("nhãn") || matName.includes("nhãn");
  const isBox = dtName.includes("hộp") || dtName.includes("hop");
  const isBag = dtName.includes("túi") || dtName.includes("tui");

  const isFlute = matName.includes("sóng") || matName.includes("song") || matName.includes("bồi") || matName.includes("boi") || matName.includes("carton");
  const isFilm = matName.includes("pe") || matName.includes("pp") || matName.includes("pet") || matName.includes("màng") || matName.includes("mang");

  const dtCode = (target.designTypeCode || target.designType?.code || "").toLowerCase();
  const isPaperBag =
    dtCode.includes("tui-giay") ||
    dtCode.includes("tui_giay") ||
    dtName.includes("túi giấy") ||
    dtName.includes("tui giay") ||
    notes.includes("túi giấy") ||
    notes.includes("tui giay");

  if (isPaperBag) {
    return "F19";
  }

  if (isBag && (isFilm || isZipper || isGusseted)) {
    if (isZipper) return "F14";
    if (isGusseted) return "F12";
    return "F10";
  }

  if (isRoll) {
    if (isZipper) return "F16";
    if (isDecal) return "F17";
    return "F15";
  }

  if (isDecal) {
    if (pc === "die_cut" || pc.includes("bế")) return "F08";
    return "F07";
  }

  if (isBox) {
    if (isFlute) return "F03";
    return "F01";
  }

  if (isBag) {
    return "F01";
  }

  return "F01";
}

/**
 * Extract and format specification badges for prepress / proofing items.
 * Excludes non-specification administrative steps: Bình bài, Điều lệnh, Đóng gói.
 * Retains all actual production steps (In, Cán, Bế, Gỡ, Dán, Ép, Cắt, Zipper, Xếp hông, etc.).
 */
export function getSpecificationBadges(item: any): string[] {
  if (!item) return [];

  // Merge nested design object if present (e.g., pod.design or orderDetail.design)
  const target = item.design ? { ...item.design, ...item } : item;
  const set = new Set<string>();

  // 1. Check for flow code (F01–F19)
  const flowCodeUpper = getFlowCode(target);

  // 2. Collect from raw specification / specifications / steps array or string
  const rawSpecs =
    target.specification ||
    target.specifications ||
    target.productionFlowSteps ||
    target.steps;

  if (Array.isArray(rawSpecs)) {
    rawSpecs.forEach((s: any) => {
      if (typeof s === "string" && s.trim()) set.add(s.trim());
      else if (s && typeof s.name === "string" && s.name.trim()) set.add(s.name.trim());
      else if (s && typeof s.stepName === "string" && s.stepName.trim()) set.add(s.stepName.trim());
    });
  } else if (typeof rawSpecs === "string" && rawSpecs.trim()) {
    const trimmed = rawSpecs.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          parsed.forEach((s: any) => {
            if (typeof s === "string" && s.trim()) set.add(s.trim());
            else if (s && typeof s.name === "string" && s.name.trim()) set.add(s.name.trim());
          });
        }
      } catch (e) {
        trimmed.split(",").forEach((s) => s.trim() && set.add(s.trim()));
      }
    } else {
      trimmed.split(",").forEach((s) => s.trim() && set.add(s.trim()));
    }
  }

  // If set is empty and flowCodeUpper matches F01-F19, populate default steps from flow map
  if (set.size === 0 && flowCodeUpper && FLOW_SPEC_STEPS_MAP[flowCodeUpper]) {
    FLOW_SPEC_STEPS_MAP[flowCodeUpper].forEach((step) => set.add(step));
  }

  // 3. Complement missing steps if set is empty or missing gluing/stripping for bags/boxes
  const dtName = (target.designTypeName || target.designType?.name || "").toLowerCase();
  const matName = (target.materialTypeName || target.materialType?.name || "").toLowerCase();
  const notes = (target.notes || target.additionalNotes || "").toLowerCase();
  const isBox = dtName.includes("hộp") || dtName.includes("hop");
  const isBag = (dtName.includes("túi") || dtName.includes("tui")) && !dtName.includes("cuộn") && !dtName.includes("cuon");
  const pc = target.processClassification || target.processClassificationOptionName;

  if (set.size === 0) {
    set.add("In");

    const lamType = target.laminationType || target.laminationTypeName;
    if (lamType && lamType !== "none" && lamType !== "Không cán") {
      set.add(laminationTypeLabels[lamType] || lamType);
    }

    if (pc) {
      set.add(processClassificationLabels[pc] || pc);
    }

    if (isBox || pc === "die_cut") {
      set.add("Bế");
    }
  } else {
    // Convert raw keys to human labels if needed (e.g. glossy -> Cán bóng)
    if (target.laminationType && laminationTypeLabels[target.laminationType]) {
      const lamLabel = laminationTypeLabels[target.laminationType];
      if (set.has(target.laminationType)) {
        set.delete(target.laminationType);
        set.add(lamLabel);
      }
    }
    if (target.processClassification && processClassificationLabels[target.processClassification]) {
      const pcLabel = processClassificationLabels[target.processClassification];
      if (set.has(target.processClassification)) {
        set.delete(target.processClassification);
        set.add(pcLabel);
      }
    }
  }

  // Rename "Dán thành phẩm" -> "Dán"
  if (set.has("Dán thành phẩm")) {
    set.delete("Dán thành phẩm");
    set.add("Dán");
  }

  // Ensure "Gỡ" and "Dán" steps are present if design involves Bế or Dán or is a Box/Paper Bag with gluing
  const hasBe = set.has("Bế") || pc === "die_cut";
  const hasDan = set.has("Dán") || set.has("Dán thành phẩm");
  const isPaperMat = matName.includes("giấy") || matName.includes("duplex") || matName.includes("couche") || matName.includes("kraft") || matName.includes("ivory") || matName.includes("bristol") || matName.includes("metaline");

  if (hasBe || (hasDan && (isBox || (isBag && isPaperMat)))) {
    if (!set.has("Gỡ")) set.add("Gỡ");
    if (!set.has("Dán")) set.add("Dán");
  }

  // 4. Add explicit Zipper / Gusseted / Ép Kim flags or notes
  const isZipper =
    target.isZipper ||
    target.hasZipper ||
    (target as any).hasZip ||
    (target as any).isZip ||
    notes.includes("zipper");

  if (isZipper) {
    set.add("Zipper");
  }

  const isGusseted =
    target.gusseted ||
    target.isGusset ||
    (target as any).isGusseted ||
    notes.includes("xếp hông");

  if (isGusseted) {
    set.add("Xếp hông");
  }

  if (notes.includes("ép kim") || notes.includes("ep kim")) {
    set.add("Ép kim");
  }

  // 5. Filter out EXCLUDED administrative steps (Bình bài, Điều lệnh, Đóng gói)
  const result = Array.from(set).filter((spec) => {
    if (!spec || spec === "—") return false;
    const lower = spec.trim().toLowerCase();
    return !EXCLUDED_SPEC_STEPS.has(lower);
  });

  // 6. Sort by standard production flow sequence
  return sortSpecificationSteps(result, flowCodeUpper);
}

// Loại nhà cung cấp (VendorType)
export const vendorTypeLabels: Record<string, string> =
  ENTITY_CONFIG.vendorTypes.values;

// Hình thức sản xuất (ProductionMethod)
export const productionMethodLabels: Record<string, string> =
  ENTITY_CONFIG.productionMethods.values;

/**
 * Get Vietnamese label for vendor type
 */
export function getVendorTypeLabel(type: string | null | undefined): string {
  if (!type) return "—";
  const normalized = type.toLowerCase();
  return vendorTypeLabels[normalized] || type;
}

// Vai trò người dùng (Role)
export const roleLabels: Record<string, string> = ENTITY_CONFIG.roles.values;

// Trạng thái phiếu giao hàng (DeliveryNote)
export const deliveryNoteStatusLabels: Record<string, string> =
  ENTITY_CONFIG.deliveryNoteStatuses.values;

// Trạng thái dòng giao hàng (DeliveryNoteLine)
export const deliveryLineStatusLabels: Record<string, string> =
  ENTITY_CONFIG.deliveryLineStatuses.values;

// Trạng thái công nợ khách hàng (Customer Debt)
export const debtStatusLabels: Record<string, string> =
  ENTITY_CONFIG.debtStatuses.values;

// Loại công đoạn sản xuất (ProductionStepType)
export const productionStepTypeLabels: Record<string, string> =
  ENTITY_CONFIG.productionStepTypes.values;

// Trạng thái công đoạn sản xuất (ProductionStepStatus)
export const productionStepStatusLabels: Record<string, string> = {
  pending: "Chờ",
  ready: "Sẵn sàng",
  in_progress: "Đang thực hiện",
  running: "Đang thực hiện",
  done: "Hoàn thành",
  completed: "Hoàn thành",
  blocked: "Tạm dừng",
  paused: "Tạm dừng",
  cancelled: "Đã hủy",
  draft: "Bản nháp",
  dispatched: "Đã điều lệnh",
  re_dispatched: "Điều in lại",
  started: "Bắt đầu in",
  returned_by_print: "Lệnh in trả về",
  returned_to_dispatch: "Lệnh in trả về",
  returned_to_proofing: "Trả về bình bài",
  reproofed: "Đã bình lại",
  ...ENTITY_CONFIG.productionStepStatuses.values,
};

export function getStepStatusLabel(status: string | null | undefined): string {
  if (!status) return "—";
  const normalized = status.toLowerCase().trim();
  return productionStepStatusLabels[normalized] || productionStepStatusLabels[status] || status;
}

// Nguồn nhập kho (StockInSource)
export const stockInSourceLabels: Record<string, string> =
  ENTITY_CONFIG.stockInSources.values;

// Loại vật phẩm nhập kho (StockInItemType)
export const stockInItemTypeLabels: Record<string, string> =
  ENTITY_CONFIG.stockInItemTypes.values;

// Trạng thái nhập kho (StockInStatus)
export const stockInStatusLabels: Record<string, string> =
  ENTITY_CONFIG.stockInStatuses.values;

// Mục đích xuất kho (StockOutPurpose)
export const stockOutPurposeLabels: Record<string, string> = {
  ...ENTITY_CONFIG.stockOutPurposes.values,
  outsource: "In gia công",
  outsource_print: "In gia công",
  return_vendor: "Trả hàng NCC",
  sale: "Bán hàng",
  manual: "Điều chỉnh",
};

// Loại vật phẩm xuất kho (StockOutItemType)
export const stockOutItemTypeLabels: Record<string, string> =
  ENTITY_CONFIG.stockOutItemTypes.values;

// Trạng thái xuất kho (StockOutStatus)
export const stockOutStatusLabels: Record<string, string> =
  ENTITY_CONFIG.stockOutStatuses.values;

// Loại tìm kiếm khuôn (DieSearchRelevance)
export const dieSearchRelevanceLabels: Record<string, string> =
  ENTITY_CONFIG.dieSearchRelevances.values;

// Loại lý do giao hàng thất bại (DeliveryFailureType)
export const deliveryFailureTypeLabels: Record<string, string> =
  ENTITY_CONFIG.deliveryFailureTypes.values;

// Trạng thái hóa đơn VAT (InvoiceStatus)
export const invoiceStatusLabels: Record<string, string> =
  ENTITY_CONFIG.invoiceStatuses.values;

// Loại thanh toán (PaymentType)
export const paymentTypeLabels: Record<string, string> =
  ENTITY_CONFIG.paymentTypes.values;

// Loại thay đổi công nợ (DebtChangeType)
export const debtChangeTypeLabels: Record<string, string> =
  ENTITY_CONFIG.debtChangeTypes.values;

// Loại sử dụng khuôn bế (DieUsageType)
export const dieUsageTypeLabels: Record<string, string> =
  ENTITY_CONFIG.dieUsageTypes.values;

// Trạng thái khuôn bế (DieStatus)
export const dieStatusLabels: Record<string, string> =
  ENTITY_CONFIG.dieStatuses.values;

// Vị trí khuôn bế (DieLocation)
export const dieLocationLabels: Record<string, string> =
  ENTITY_CONFIG.dieLocations.values;

// Loại chứng từ công nợ NCC (APDocumentType)
export const apDocumentTypeLabels: Record<string, string> = {
  StockIn: "Nhập kho vật tư",
  StockInLabor: "Nhân công",
  PlateExport: "Xuất kẽm",
  PrintingExport: "In gia công",
  DieExport: "Xuất khuôn",
  Settlement: "Tất toán công nợ (ngoài hệ thống)",
};

// Trạng thái thanh toán AP (APPaymentStatusFilter)
export const apPaymentStatusLabels: Record<string, string> = {
  unpaid: "Chưa thanh toán",
  paid: "Đã thanh toán",
  overdue: "Quá hạn",
  all: "Tất cả",
};

// Loại thay đổi công nợ NCC (VendorDebtChangeType)
export const vendorDebtChangeTypeLabels: Record<string, string> = {
  StockIn: "Nhập kho vật tư",
  StockInLabor: "Nhân công",
  Payment: "Thanh toán",
  PlateExport: "Xuất kẽm",
  DieExport: "Xuất khuôn",
  Cancellation: "Hủy bỏ",
  Settlement: "Tất toán công nợ (ngoài hệ thống)",
};

// ===== DESIGN STATUS CONFIG (cho UI) =====
export type DesignStatusKey = keyof typeof ENTITY_CONFIG.designStatuses.values;

export const designStatusConfig: Record<
  DesignStatusKey,
  {
    label: string;
    color: string;
    bgColor: string;
  }
> = {
  received_info: {
    label: ENTITY_CONFIG.designStatuses.values.received_info,
    color: "bg-slate-200 text-slate-900 border-slate-400 border-2",
    bgColor: "bg-slate-50",
  },
  designing: {
    label: ENTITY_CONFIG.designStatuses.values.designing,
    color: "bg-blue-200 text-blue-900 border-blue-400 border-2",
    bgColor: "bg-blue-50",
  },
  editing: {
    label: ENTITY_CONFIG.designStatuses.values.editing,
    color: "bg-amber-200 text-amber-900 border-amber-400 border-2",
    bgColor: "bg-amber-50",
  },
  waiting_for_customer_approval: {
    label: ENTITY_CONFIG.designStatuses.values.waiting_for_customer_approval,
    color: "bg-orange-200 text-orange-900 border-orange-400 border-2",
    bgColor: "bg-orange-50",
  },
  confirmed_for_printing: {
    label: ENTITY_CONFIG.designStatuses.values.confirmed_for_printing,
    color: "bg-green-200 text-green-900 border-green-400 border-2",
    bgColor: "bg-green-50",
  },
  returned: {
    label: ENTITY_CONFIG.designStatuses.values.returned,
    color: "bg-red-200 text-red-900 border-red-400 border-2",
    bgColor: "bg-red-50",
  },
  cancelled: {
    label: ENTITY_CONFIG.designStatuses.values.cancelled,
    color: "bg-rose-200 text-rose-900 border-rose-400 border-2 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50",
    bgColor: "bg-rose-50",
  },
};

// ===== VARIANT CŨ (CHO CÁC CHỖ ĐÃ DÙNG) =====

export function getStatusVariant(
  status: string | null
): "default" | "secondary" | "success" | "warning" | "destructive" | "outline" {
  if (!status) return "default";

  const warningStatuses = [
    "pending",
    "waiting_for_customer_approval",
    "waiting_for_proofing",
    "waiting_for_production",
    "waiting_for_delivery",
    "waiting_for_redelivery",
    "waiting_for_file",
    "waiting_for_deposit",
    "not_paid",
    "not_completed",
    "draft",
    "failed_reschedule",
  ];

  const successStatuses = [
    "confirmed_for_printing",
    "debt_approved",
    "production_completed",
    "completed",
    "fully_paid",
    "invoice_issued",
    "delivered",
  ];

  const inProgressStatuses = [
    "designing",
    "editing",
    "in_production",
    "deposit_received",
    "delivering",
    "return_processing",
    "confirmed",
    "ready_to_ship",
    "handed_over",
    "in_transit",
    "partially_completed",
  ];

  if (successStatuses.includes(status)) return "success";
  if (warningStatuses.includes(status)) return "warning";
  if (inProgressStatuses.includes(status)) return "secondary";

  if (status === "cancelled") return "destructive";

  return "default";
}

// ===== COLOR MAPPING TỪNG STATUS (TAILWIND CLASS) =====

// Mỗi trạng thái một màu, vẫn tuân flow:
// - xám / vàng: pending, waiting, not_paid
// - xanh dương / tím / cyan: đang xử lý (designing, editing, in_production, proofing,...)
// - xanh lá / emerald: các trạng thái done / confirmed / fully_paid
// - đỏ: cancelled / not_paid (nếu muốn nhấn mạnh)
export const statusColorMap: Record<string, string> = {
  // ===== ORDER STATUSES =====
  pending: "bg-slate-100 text-slate-800 border-slate-200",
  designing: "bg-blue-50 text-blue-700 border-blue-200",
  editing: "bg-sky-50 text-sky-700 border-sky-200",
  waiting_for_customer_approval: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed_for_printing: "bg-emerald-50 text-emerald-700 border-emerald-200",
  waiting_for_deposit: "bg-amber-100 text-amber-800 border-amber-300",
  deposit_received: "bg-indigo-50 text-indigo-700 border-indigo-200",
  debt_approved: "bg-green-50 text-green-700 border-green-200",
  waiting_for_proofing: "bg-violet-50 text-violet-700 border-violet-200",
  waiting_for_production: "bg-indigo-50 text-indigo-700 border-indigo-200",
  in_production: "bg-cyan-50 text-cyan-700 border-cyan-200",
  production_completed: "bg-green-50 text-green-700 border-green-200",
  waiting_for_delivery: "bg-amber-50 text-amber-700 border-amber-200",
  waiting_for_redelivery: "bg-orange-50 text-orange-700 border-orange-200",
  delivering: "bg-blue-50 text-blue-700 border-blue-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  invoice_issued: "bg-teal-50 text-teal-700 border-teal-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  return_processing: "bg-purple-50 text-purple-700 border-purple-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",

  // ===== DESIGN STATUSES (dùng chung với Order) =====
  received_info: "bg-slate-100 text-slate-800 border-slate-200",
  available: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30",
  ordered: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30",

  // ===== PROOFING ORDER STATUSES =====
  not_completed: "bg-slate-100 text-slate-800 border-slate-200",
  // completed đã được định nghĩa ở ORDER STATUSES ở trên
  paused: "bg-yellow-50 text-yellow-700 border-yellow-200",
  production_returned: "bg-red-50 text-red-700 border-red-200",

  // ===== ORDER DETAIL ITEM STATUSES (dùng chung với Order) =====
  // waiting_for_proofing, waiting_for_production, in_production,
  // production_completed, delivering, completed đã được định nghĩa ở trên
  // V4 statuses:
  partially_delivered: "bg-amber-50 text-amber-700 border-amber-200",
  // waiting_for_delivery đã được định nghĩa ở ORDER STATUSES ở trên

  // ===== PRODUCTION STATUSES =====
  // waiting_for_production, in_production, completed đã được định nghĩa ở trên
  // paused cho production (khác với paused của proofing)
  // paused: "bg-yellow-50 text-yellow-700 border-yellow-200", // đã được định nghĩa ở PROOFING ORDER STATUSES

  // ===== PAYMENT =====
  not_paid: "bg-rose-50 text-rose-700 border-rose-200",
  deposited: "bg-amber-50 text-amber-700 border-amber-200",
  fully_paid: "bg-green-50 text-green-700 border-green-200",

  // ===== INVOICE =====
  not_issued: "bg-amber-50 text-amber-700 border-amber-200",
  issued: "bg-green-50 text-green-700 border-green-200",

  // ===== CUSTOMER TYPE =====
  retail: "bg-blue-50 text-blue-700 border-blue-200",
  company: "bg-purple-50 text-purple-700 border-purple-200",

  // ===== COMMON =====
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-slate-100 text-slate-800 border-slate-200",

  // ===== LAMINATION TYPES =====
  glossy: "bg-blue-50 text-blue-700 border-blue-200",
  matte: "bg-slate-50 text-slate-700 border-slate-200",
  none: "bg-gray-50 text-gray-700 border-gray-200",

  // ===== SIDES CLASSIFICATION =====
  one_side: "bg-indigo-50 text-indigo-700 border-indigo-200",
  two_side: "bg-purple-50 text-purple-700 border-purple-200",

  // ===== PROCESS CLASSIFICATION =====
  cut: "bg-cyan-50 text-cyan-700 border-cyan-200",
  die_cut: "bg-teal-50 text-teal-700 border-teal-200",

  // ===== VENDOR TYPES =====
  plate: "bg-blue-50 text-blue-700 border-blue-200",
  die: "bg-violet-50 text-violet-700 border-violet-200",
  printing: "bg-orange-50 text-orange-700 border-orange-200",

  // ===== DELIVERY NOTE STATUSES =====
  draft: "bg-slate-100 text-slate-800 border-slate-200",
  approved: "bg-blue-50 text-blue-700 border-blue-200",
  posted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  ready_to_ship: "bg-cyan-50 text-cyan-700 border-cyan-200",
  handed_over: "bg-indigo-50 text-indigo-700 border-indigo-200",
  in_transit: "bg-blue-50 text-blue-700 border-blue-200",
  partially_completed: "bg-amber-50 text-amber-700 border-amber-200",
  partial: "bg-amber-50 text-amber-700 border-amber-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  failure: "bg-red-50 text-red-700 border-red-200",
  // completed đã được định nghĩa ở ORDER STATUSES ở trên
  // cancelled đã được định nghĩa ở ORDER STATUSES ở trên

  // ===== DELIVERY LINE STATUSES =====
  // pending đã được định nghĩa ở ORDER STATUSES ở trên
  // delivered đã được định nghĩa ở ORDER STATUSES ở trên (sử dụng màu xanh lá cho thành công)
  failed_reschedule: "bg-orange-50 text-orange-700 border-orange-200",
  partially_returned: "bg-amber-50 text-amber-700 border-amber-200",
  returned: "bg-rose-50 text-rose-700 border-rose-200",
  // cancelled đã được định nghĩa ở ORDER STATUSES ở trên

  // ===== DEBT STATUSES =====
  normal: "bg-green-50 text-green-700 border-green-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  exceeded: "bg-red-50 text-red-700 border-red-200",

  // ===== PRODUCTION STEP TYPES =====
  // Note: cut và die_cut đã được định nghĩa ở PROCESS CLASSIFICATION ở trên
  material_export: "bg-slate-50 text-slate-700 border-slate-200",
  print: "bg-blue-50 text-blue-700 border-blue-200",
  lamination: "bg-purple-50 text-purple-700 border-purple-200",
  glue: "bg-orange-50 text-orange-700 border-orange-200",
  packaging: "bg-green-50 text-green-700 border-green-200",

  // ===== PRODUCTION STEP STATUSES =====
  // pending đã được định nghĩa ở ORDER STATUSES ở trên
  ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
  in_progress: "bg-cyan-50 text-cyan-700 border-cyan-200",
  done: "bg-green-50 text-green-700 border-green-200", // tương tự completed
  blocked: "bg-red-50 text-red-700 border-red-200",

  // ===== STOCK IN STATUSES =====
  // pending đã được định nghĩa ở ORDER STATUSES ở trên
  // completed đã được định nghĩa ở ORDER STATUSES ở trên
  // cancelled đã được định nghĩa ở ORDER STATUSES ở trên

  // partially_returned already defined in DELIVERY LINE STATUSES above
  // cancelled defined in ORDER STATUSES above

  // ===== DELIVERY FAILURE TYPES =====
  customer_refused: "bg-red-50 text-red-700 border-red-200",
  company_issue: "bg-orange-50 text-orange-700 border-orange-200",

  // ===== INVOICE STATUSES =====
  pending_issue: "bg-amber-50 text-amber-700 border-amber-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  voided: "bg-slate-100 text-slate-800 border-slate-200",
  adjusted: "bg-blue-50 text-blue-700 border-blue-200",
  replaced: "bg-purple-50 text-purple-700 border-purple-200",
  // draft đã được định nghĩa ở DELIVERY NOTE STATUSES ở trên
  // issued đã được định nghĩa ở INVOICE ở trên

  // ===== PAYMENT TYPES =====
  deposit: "bg-indigo-50 text-indigo-700 border-indigo-200",
  payment: "bg-green-50 text-green-700 border-green-200",

  // ===== DEBT CHANGE TYPES =====
  order_created: "bg-blue-50 text-blue-700 border-blue-200",
  payment_received: "bg-green-50 text-green-700 border-green-200",
  // deposit_received đã được định nghĩa ở ORDER STATUSES ở trên
  debt_adjustment: "bg-amber-50 text-amber-700 border-amber-200",

  // ===== DIE USAGE TYPES =====
  one_time: "bg-orange-50 text-orange-700 border-orange-200",
  reusable: "bg-green-50 text-green-700 border-green-200",

  // ===== DIE STATUSES =====
  new: "bg-blue-50 text-blue-700 border-blue-200",
  // ready đã được định nghĩa ở PRODUCTION STEP STATUSES ở trên
  // in_production đã được định nghĩa ở ORDER STATUSES ở trên
  broken: "bg-red-50 text-red-700 border-red-200",
  disposed: "bg-slate-100 text-slate-800 border-slate-200",

  // ===== DIE LOCATIONS =====
  InStock: "bg-green-50 text-green-700 border-green-200",
  InUse: "bg-blue-50 text-blue-700 border-blue-200",
};

// Hàm helper: trả về class tailwind cho badge
export function getStatusColorClass(status?: string | null): string {
  if (!status) {
    return "bg-slate-100 text-slate-800 border-slate-200";
  }
  return (
    statusColorMap[status] ?? "bg-slate-100 text-slate-800 border-slate-200" // fallback
  );
}

// ===== Helper format =====

export const formatCurrency = (
  value: number | null | undefined,
  options?: {
    currency?: string;
    minimumFractionDigits?: number;
  }
): string => {
  const val = typeof value === "number" ? value : 0;
  const { currency = "VND", minimumFractionDigits } = options || {};

  try {
    const formatOptions: Intl.NumberFormatOptions = {
      style: "decimal",
      minimumFractionDigits: minimumFractionDigits || 0,
      maximumFractionDigits: minimumFractionDigits || 0,
    };

    const result = new Intl.NumberFormat("de-DE", formatOptions).format(val);
    return result;
  } catch {
    // fallback đơn giản nếu Intl lỗi
    return `${val.toLocaleString("vi-VN")} ${currency}`;
  }
};

export const formatDate = (value: string | Date | null | undefined): string => {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const formatDateTime = (
  value: string | Date | null | undefined
): string => {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function getSpecBadgeStyle(spec: string): string {
  if (!spec) return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";

  const lower = spec.trim().toLowerCase();

  // 1. Flow Codes (F01–F19)
  if (/^f\d{2}$/i.test(lower)) {
    return "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-none font-bold shadow-sm";
  }

  // 2. Lamination / Cán
  if (lower === "cán bóng") {
    return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700 font-medium";
  }
  if (lower === "cán mờ") {
    return "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-700 font-medium";
  }
  if (lower === "không cán") {
    return "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 italic";
  }
  if (lower.startsWith("cán")) {
    return "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-700 font-medium";
  }

  // 3. Cutting / Cắt & Slitting / Xả cuộn, Chia cuộn
  if (lower === "cắt") {
    return "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700 font-semibold";
  }
  if (lower.includes("xả cuộn") || lower.includes("chia cuộn")) {
    return "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-700 font-medium";
  }

  // 4. Die-cutting / Bế & Stripping / Gỡ
  if (lower === "bế") {
    return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700 font-semibold";
  }
  if (lower === "gỡ") {
    return "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800";
  }

  // 5. Printing / In & Mounting / Bồi
  if (lower === "in") {
    return "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-700 font-medium";
  }
  if (lower === "bồi") {
    return "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/60 dark:text-yellow-300 dark:border-yellow-700 font-medium";
  }

  // 6. Finishing / Zipper, Ép biên, Ép miệng, Dán
  if (lower === "zipper" || lower.includes("zip")) {
    return "bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-700 font-bold";
  }
  if (lower.includes("ép biên") || lower.includes("ép miệng") || lower.includes("xếp hông")) {
    return "bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-700 font-medium";
  }
  if (lower.includes("dán") || lower.includes("ép")) {
    return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700 font-medium";
  }

  return "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
}
