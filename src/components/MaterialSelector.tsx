import React, { useState, useEffect, useCallback } from 'react';
import { MaterialService } from '@/services/materialService';
import { Material } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Package } from 'lucide-react';

interface MaterialSelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  showStock?: boolean;
  disabled?: boolean;
}

export const MaterialSelector: React.FC<MaterialSelectorProps> = ({
  value,
  onValueChange,
  placeholder = "Chọn chất liệu",
  className,
  showStock = true,
  disabled = false
}) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const loadMaterials = useCallback(async () => {
    try {
      setLoading(true);
      const response = await MaterialService.getMaterials({
        page: 1,
        pageSize: 50,
        filters: {
          searchQuery: searchQuery || undefined
        },
        sortBy: 'name',
        sortOrder: 'asc'
      });
      
      setMaterials(response.data);
    } catch (error) {
      console.error('Error loading materials:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const selectedMaterial = materials.find(m => m.id === value);

  const getStockStatus = (material: Material) => {
    if (material.currentStock <= material.minStock) {
      return { label: 'Hết hàng', color: 'destructive' as const };
    } else if (material.currentStock <= material.minStock * 2) {
      return { label: 'Sắp hết', color: 'secondary' as const };
    }
    return { label: 'Còn hàng', color: 'default' as const };
  };

  return (
    <Select 
      value={value} 
      onValueChange={onValueChange}
      disabled={disabled}
      onOpenChange={setIsOpen}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder}>
          {selectedMaterial && (
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span>{selectedMaterial.name}</span>
              {showStock && (
                <Badge 
                  variant={getStockStatus(selectedMaterial).color}
                  className="text-xs"
                >
                  {getStockStatus(selectedMaterial).label}
                </Badge>
              )}
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="w-80">
        {isOpen && (
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm chất liệu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        )}
        
        {loading ? (
          <SelectItem value="loading" disabled>
            Đang tải...
          </SelectItem>
        ) : materials.length === 0 ? (
          <SelectItem value="no-results" disabled>
            Không tìm thấy chất liệu
          </SelectItem>
        ) : (
          materials.map((material) => {
            const stockStatus = getStockStatus(material);
            return (
              <SelectItem key={material.id} value={material.id}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <span className="font-medium">{material.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {material.code} • {material.type}
                    </div>
                    {showStock && (
                      <div className="text-xs text-muted-foreground">
                        Tồn kho: {material.currentStock} {material.unit}
                      </div>
                    )}
                  </div>
                  {showStock && (
                    <Badge 
                      variant={stockStatus.color}
                      className="text-xs ml-2"
                    >
                      {stockStatus.label}
                    </Badge>
                  )}
                </div>
              </SelectItem>
            );
          })
        )}
      </SelectContent>
    </Select>
  );
};

export default MaterialSelector;