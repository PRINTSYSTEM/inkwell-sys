import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAvailableQuantity } from "@/hooks/use-proofing-order";

import { checkIsDecalSet } from "@/types/proofing";

interface QuantityCellProps {
  pod: any;
  editingQuantityDesignId: number | null;
  inlineQuantityValue: string;
  setInlineQuantityValue: (value: string) => void;
  inlineItemsPerSheetValue?: string;
  setInlineItemsPerSheetValue?: (value: string) => void;
  setEditingQuantityDesignId: (id: number | null) => void;
  handleUpdateDesignQuantity: (designId: number) => void;
  updatingDesignId: number | null;
}

export function QuantityCell({
  pod,
  editingQuantityDesignId,
  inlineQuantityValue,
  setInlineQuantityValue,
  inlineItemsPerSheetValue,
  setInlineItemsPerSheetValue,
  setEditingQuantityDesignId,
  handleUpdateDesignQuantity,
  updatingDesignId,
}: QuantityCellProps) {
  const isEditing = editingQuantityDesignId === pod.id;
  const designId = pod.design?.id ?? null;
  const isDecalSet = checkIsDecalSet(pod.design);
  const side = pod.side || "both";
  const isBoBoth = isDecalSet && (side === "both" || !side);

  const formatQtyFromPieces = (qty: number | undefined | null) => {
    if (qty == null) return "0";
    if (side === "front" || side === "back") {
      return qty.toLocaleString("vi-VN");
    }
    if (isBoBoth) {
      const sets = Math.floor(qty / 2);
      return `${qty.toLocaleString("vi-VN")} / ${sets.toLocaleString("vi-VN")} bộ`;
    }
    return qty.toLocaleString("vi-VN");
  };

  // Get available quantity from API when editing this design
  const { data: availableQuantityFromApi, isLoading: isLoadingAvailableQty } =
    useAvailableQuantity(
      isEditing && designId ? designId : null,
      isEditing && !!designId
    );

  // Extract quantity from API response (could be number or object)
  const extractAvailableQuantity = (data: unknown): number | null => {
    if (data == null) return null;
    if (typeof data === "number") return data;
    if (typeof data === "string") {
      const parsed = parseInt(data, 10);
      return !isNaN(parsed) ? parsed : null;
    }
    if (typeof data === "object" && data !== null) {
      // Try common field names
      const obj = data as Record<string, unknown>;
      if ("quantity" in obj && typeof obj.quantity === "number") {
        return obj.quantity;
      }
      if (
        "availableQuantity" in obj &&
        typeof obj.availableQuantity === "number"
      ) {
        return obj.availableQuantity;
      }
      if (
        "availableQuantityForProofing" in obj &&
        typeof obj.availableQuantityForProofing === "number"
      ) {
        return obj.availableQuantityForProofing;
      }
      // Log for debugging if structure is unexpected
      console.warn("Unexpected available quantity response structure:", data);
    }
    return null;
  };

  const apiAvailableQty = extractAvailableQuantity(availableQuantityFromApi);

  const maxAvailableQty =
    apiAvailableQty != null
      ? apiAvailableQty
      : pod.design?.availableQuantityForProofing != null
        ? pod.design.availableQuantityForProofing
        : undefined;

  const itemsPerSheet =
    pod.itemsPerSheet != null && pod.itemsPerSheet > 0 ? pod.itemsPerSheet : 1;

  if (isEditing) {
    return (
      <div className="space-y-1.5 pt-1 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground w-11 shrink-0 font-medium">SL:</span>
          <Input
            type="number"
            min="1"
            max={maxAvailableQty}
            value={inlineQuantityValue}
            onChange={(e) => setInlineQuantityValue(e.target.value)}
            className="h-7 w-20 text-xs font-semibold"
            autoFocus
            disabled={isLoadingAvailableQty || updatingDesignId === pod.id}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground w-11 shrink-0 font-medium">Số con:</span>
          <Input
            type="number"
            min="1"
            value={inlineItemsPerSheetValue ?? "1"}
            onChange={(e) => setInlineItemsPerSheetValue?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const qty = parseInt(inlineQuantityValue, 10);
                if (!isNaN(qty) && qty >= 1) {
                  handleUpdateDesignQuantity(pod.id!);
                }
              } else if (e.key === "Escape") {
                setEditingQuantityDesignId(null);
                setInlineQuantityValue("");
                setInlineItemsPerSheetValue?.("");
              }
            }}
            className="h-7 w-20 text-xs font-semibold"
            disabled={isLoadingAvailableQty || updatingDesignId === pod.id}
          />
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs border-green-300 hover:bg-green-50 text-green-700"
            onClick={() => {
              const qty = parseInt(inlineQuantityValue, 10);
              if (!isNaN(qty) && qty >= 1) {
                handleUpdateDesignQuantity(pod.id!);
              }
            }}
            disabled={updatingDesignId === pod.id || isLoadingAvailableQty}
          >
            {updatingDesignId === pod.id ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              "✓"
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              setEditingQuantityDesignId(null);
              setInlineQuantityValue("");
              setInlineItemsPerSheetValue?.("");
            }}
            disabled={updatingDesignId === pod.id || isLoadingAvailableQty}
          >
            ✕
          </Button>
        </div>
        <div className="text-[10px] text-muted-foreground space-y-0.5 pt-0.5">
          {isLoadingAvailableQty ? (
            <div className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Đang tải số lượng...</span>
            </div>
          ) : apiAvailableQty != null ? (
            <>
              <p>
                Có thể bình bài:{" "}
                <span className="font-semibold text-foreground">
                  {formatQtyFromPieces(apiAvailableQty)}
                </span>
              </p>
            </>
          ) : pod.design?.availableQuantityForProofing != null ? (
            <>
              <p>
                Có thể bình bài:{" "}
                <span className="font-semibold text-foreground">
                  {formatQtyFromPieces(pod.design.availableQuantityForProofing)}
                </span>
              </p>
            </>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 py-1 min-w-[70px]">
      <span className={`text-xs font-black tracking-tight ${isDecalSet ? "text-emerald-700 dark:text-emerald-400 font-extrabold" : "text-slate-900 dark:text-slate-100"}`}>
        {formatQtyFromPieces(pod.quantity)}
      </span>
      <div className="flex items-center">
        <span className="inline-flex items-center text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 shadow-2xs">
          {itemsPerSheet} con/bài
        </span>
      </div>
      {pod.outputQty != null && pod.outputQty > 0 && (
        <div className="mt-0.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded px-1.5 py-0.5 shadow-2xs">
            SLSX: {pod.outputQty.toLocaleString("vi-VN")}
          </span>
        </div>
      )}
      {pod.design?.availableQuantityForProofing != null && (
        <p className="text-[10px] text-slate-500 font-medium">
          Còn: {formatQtyFromPieces(pod.design.availableQuantityForProofing)}
        </p>
      )}
    </div>
  );
}
