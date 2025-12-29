import type { DesignItem } from "@/types/proofing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Building2, User, FileText } from "lucide-react";
import { processClassificationLabels } from "@/lib/status-utils";

interface DesignCardProps {
  design: DesignItem;
  isSelected: boolean;
  canSelect: boolean;
  onToggle: (design: DesignItem) => void;
}

export function DesignCard({
  design,
  isSelected,
  canSelect,
  onToggle,
}: DesignCardProps) {
  const handleClick = () => {
    if (canSelect || isSelected) {
      onToggle(design);
    }
  };

  return (
    <Card
      className={cn(
        "relative cursor-pointer transition-all duration-200 hover:shadow-md",
        isSelected && "ring-2 ring-primary shadow-md",
        !canSelect && !isSelected && "opacity-50 cursor-not-allowed"
      )}
      onClick={handleClick}
    >
      {/* Checkbox */}
      <div className="absolute top-3 left-3 z-10">
        <Checkbox
          checked={isSelected}
          disabled={!canSelect && !isSelected}
          onCheckedChange={() => handleClick()}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Thumbnail */}
      <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden rounded-t-lg">
        <img
          src={design.thumbnailUrl}
          alt={design.name}
          className="w-full h-full object-cover"
        />
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Order Info */}
        {design.orderCode && (
          <div className="pb-2 border-b">
            <div className="flex items-center gap-1.5 mb-1">
              <FileText className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs font-semibold text-primary">
                {design.orderCode}
              </p>
            </div>
            {design.customerName && (
              <div className="flex items-center gap-1.5">
                {design.customerCompanyName ? (
                  <Building2 className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <User className="h-3 w-3 text-muted-foreground" />
                )}
                <p className="text-xs text-muted-foreground truncate">
                  {design.customerCompanyName || design.customerName}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Design Code */}
        <p className="text-xs text-muted-foreground font-mono truncate">
          {design.code}
        </p>

        {/* Name & Size */}
        <div>
          <h3 className="font-medium text-sm truncate">{design.name}</h3>
          <p className="text-xs text-muted-foreground">
            {design.width}x{design.height} {design.unit}
          </p>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary" className="text-xs">
            {design.designTypeName}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {design.materialTypeName}
          </Badge>
        </div>

        {/* Quantity */}
        <div className="text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">SL đặt hàng:</span>
            <span className="font-medium">
              {design.quantity.toLocaleString()}
            </span>
          </div>
          {design.availableQuantity !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">SL có thể bình bài:</span>
              <span
                className={`font-semibold ${
                  design.availableQuantity > 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {design.availableQuantity.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Quy trình sản xuất */}
        {design.processClassificationOptionName && (
          <div className="flex items-center gap-1.5 p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-xs border border-blue-200 dark:border-blue-800">
            <FileText className="h-3 w-3 text-blue-600 mt-0.5 shrink-0" />
            <span className="text-blue-800 dark:text-blue-200 font-medium">
              Quy trình:{" "}
              {processClassificationLabels[
                design.processClassificationOptionName
              ] || design.processClassificationOptionName}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
