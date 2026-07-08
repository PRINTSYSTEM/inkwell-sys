import { useState, useCallback, useMemo } from "react";
import { DesignItem } from "@/types/proofing";

interface UseProofingSelectionResult {
  selectedDesigns: DesignItem[];
  selectedIds: Set<number>;
  currentMaterialTypeId: number | null;
  toggleSelection: (design: DesignItem) => void;
  clearSelection: () => void;
  isSelected: (designId: number) => boolean;
  canSelect: (design: DesignItem) => boolean;
}

export function useProofingSelection(): UseProofingSelectionResult {
  const [selectedDesigns, setSelectedDesigns] = useState<DesignItem[]>([]);

  const selectedIds = useMemo(
    () => new Set(selectedDesigns.map((d) => d.id)),
    [selectedDesigns]
  );

  const currentMaterialTypeId = useMemo(
    () =>
      selectedDesigns.length > 0 ? selectedDesigns[0].materialTypeId : null,
    [selectedDesigns]
  );

  const isSelected = useCallback(
    (designId: number) => selectedIds.has(designId),
    [selectedIds]
  );

  const canSelect = useCallback(
    (design: DesignItem) => {
      // Can always select if nothing is selected yet
      if (selectedDesigns.length === 0) return true;
      // If different design type, selecting it will clear previous selections, so it is allowed
      if (design.designTypeId !== selectedDesigns[0].designTypeId) return true;
      // Can only select if same materialTypeId
      return design.materialTypeId === currentMaterialTypeId;
    },
    [selectedDesigns, currentMaterialTypeId]
  );

  const toggleSelection = useCallback((design: DesignItem) => {
    setSelectedDesigns((prev) => {
      const isCurrentlySelected = prev.some((d) => d.id === design.id);

      if (isCurrentlySelected) {
        // Remove from selection
        return prev.filter((d) => d.id !== design.id);
      } else {
        // Add to selection (only if same materialType or first selection)
        if (prev.length === 0) {
          return [design];
        }

        // If different design type, clear previous selections and start new with this one
        if (design.designTypeId !== prev[0].designTypeId) {
          return [design];
        }

        if (design.materialTypeId === prev[0].materialTypeId) {
          return [...prev, design];
        }
        return prev;
      }
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedDesigns([]);
  }, []);

  return {
    selectedDesigns,
    selectedIds,
    currentMaterialTypeId,
    toggleSelection,
    clearSelection,
    isSelected,
    canSelect,
  };
}
