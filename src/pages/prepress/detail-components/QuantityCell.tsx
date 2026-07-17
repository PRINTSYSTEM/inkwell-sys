import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAvailableQuantity } from "@/hooks/use-proofing-order";

interface QuantityCellProps {
  pod: any; // Using any for now to avoid complex schema import if not strictly needed, or I can try to import it
  editingQuantityDesignId: number | null;
  inlineQuantityValue: string;
  setInlineQuantityValue: (value: string) => void;
  setEditingQuantityDesignId: (id: number | null) => void;
  handleUpdateDesignQuantity: (designId: number) => void;
  updatingDesignId: number | null;
}

export function QuantityCell({
  pod,
  editingQuantityDesignId,
  inlineQuantityValue,
  setInlineQuantityValue,
  setEditingQuantityDesignId,
  handleUpdateDesignQuantity,
  updatingDesignId,
}: QuantityCellProps) {
  const isEditing = editingQuantityDesignId === pod.id;
  const designId = pod.design?.id ?? null;
  const isDecal = pod.design?.designType?.name?.toLowerCase().includes("decal") ||
                  pod.design?.materialType?.name?.toLowerCase().includes("decal");
  const isBo = isDecal && pod.design?.sidesClassification === "two_side";

  const formatQtyFromPieces = (qty: number | undefined | null) => {
    if (qty == null) return "0";
    if (isBo) {
      const sets = Math.floor(qty / 2);
      return `${qty.toLocaleString()} / ${sets.toLocaleString()} bộ`;
    }
    return qty.toLocaleString();
  };

  const formatQtyFromSets = (qty: number | undefined | null) => {
    if (qty == null) return "0";
    if (isBo) {
      return `${(qty * 2).toLocaleString()} / ${qty.toLocaleString()} bộ`;
    }
    return qty.toLocaleString();
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

  if (isEditing) {
    return (
      <div className="space-y-1.5 pt-2">
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            min="1"
            max={maxAvailableQty}
            value={inlineQuantityValue}
            onChange={(e) => setInlineQuantityValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const qty = parseInt(inlineQuantityValue, 10);
                if (!isNaN(qty) && qty >= 1) {
                  handleUpdateDesignQuantity(pod.id!);
                }
              } else if (e.key === "Escape") {
                setEditingQuantityDesignId(null);
                setInlineQuantityValue("");
              }
            }}
            className="h-7 w-24 text-xs font-semibold"
            autoFocus
            disabled={isLoadingAvailableQty || updatingDesignId === pod.id}
          />
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
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
            className="h-7 px-2 text-xs"
            onClick={() => {
              setEditingQuantityDesignId(null);
              setInlineQuantityValue("");
            }}
            disabled={updatingDesignId === pod.id || isLoadingAvailableQty}
          >
            ✕
          </Button>
        </div>
        <div className="text-[10px] text-muted-foreground space-y-0.5">
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
              <p>
                Hiện tại:{" "}
                <span className="font-semibold text-foreground">
                  {formatQtyFromSets(pod.quantity)}
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
              <p>
                Hiện tại:{" "}
                <span className="font-semibold text-foreground">
                  {formatQtyFromSets(pod.quantity)}
                </span>
              </p>
            </>
          ) : (
            <p>
              Hiện tại:{" "}
              <span className="font-semibold text-foreground">
                {formatQtyFromSets(pod.quantity)}
              </span>
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0.5 pt-2">
      <p className={`text-xs font-semibold ${isBo ? "text-green-600 dark:text-green-400 font-bold" : ""}`}>
        {formatQtyFromSets(pod.quantity)}
      </p>
      {pod.design?.availableQuantityForProofing != null && (
        <p className="text-[10px] text-muted-foreground">
          Còn: {formatQtyFromPieces(pod.design.availableQuantityForProofing)}
        </p>
      )}
    </div>
  );
}
