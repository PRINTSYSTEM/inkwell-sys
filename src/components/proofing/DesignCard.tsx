import { DesignItem } from "@/types/proofing";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

      <CardContent className="p-4 space-y-2">
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

        {/* Quantity & Price */}
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">
            SL: {design.quantity.toLocaleString()}
          </span>
          {/* <span className="font-medium">{design.unitPrice.toLocaleString()}đ</span> */}
        </div>

        {/* Order ID */}
        <p className="text-xs text-muted-foreground">Order: {design.orderId}</p>
      </CardContent>
    </Card>
  );
}
