import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Eye, Edit, Trash2, Package, AlertTriangle } from 'lucide-react';
import { DataTable, TableColumn, TableAction } from './DataTable';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  currentStock: number;
  minStock: number;
  maxStock?: number;
  unitPrice: number;
  supplier: string;
  lastUpdated: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  location?: string;
  description?: string;
  [key: string]: unknown;
}

interface InventoryTableProps {
  data: InventoryItem[];
  loading?: boolean;
  onView?: (item: InventoryItem) => void;
  onEdit?: (item: InventoryItem) => void;
  onDelete?: (item: InventoryItem) => void;
  onBulkAction?: (items: InventoryItem[], action: string) => void;
  className?: string;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  data,
  loading = false,
  onView,
  onEdit,
  onDelete,
  onBulkAction,
  className
}) => {
  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock === 0) return 'out_of_stock';
    if (item.currentStock <= item.minStock) return 'low_stock';
    return 'in_stock';
  };

  const getStatusBadge = (status: InventoryItem['status']) => {
    const statusMap = {
      in_stock: { label: 'Còn hàng', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      low_stock: { label: 'Sắp hết', variant: 'destructive' as const, color: 'bg-yellow-100 text-yellow-800' },
      out_of_stock: { label: 'Hết hàng', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' }
    };
    return statusMap[status];
  };

  const getStockLevel = (item: InventoryItem) => {
    if (item.maxStock) {
      return (item.currentStock / item.maxStock) * 100;
    }
    return item.currentStock > item.minStock ? 100 : (item.currentStock / item.minStock) * 100;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const columns: TableColumn<InventoryItem>[] = [
    {
      key: 'sku',
      label: 'SKU',
      width: 'w-32',
      sortable: true,
      render: (value) => (
        <span className="font-mono text-sm">{value as string}</span>
      )
    },
    {
      key: 'name',
      label: 'Tên sản phẩm',
      sortable: true,
      render: (value, row) => (
        <div className="min-w-0">
          <div className="font-medium truncate">{value as string}</div>
          <div className="text-sm text-muted-foreground truncate">{row.category}</div>
        </div>
      )
    },
    {
      key: 'currentStock',
      label: 'Tồn kho',
      width: 'w-32',
      sortable: true,
      align: 'center',
      render: (value, row) => {
        const status = getStockStatus(row);
        const statusBadge = getStatusBadge(status);
        
        return (
          <div className="space-y-1">
            <div className="font-bold">{value as number}</div>
            <Badge className={statusBadge.color} variant="outline">
              {statusBadge.label}
            </Badge>
          </div>
        );
      }
    },
    {
      key: 'stock_level',
      label: 'Mức tồn',
      width: 'w-24',
      render: (_, row) => {
        const level = getStockLevel(row);
        return (
          <div className="space-y-1">
            <Progress 
              value={level} 
              className="h-2"
            />
            <div className="text-xs text-muted-foreground text-center">
              {Math.round(level)}%
            </div>
          </div>
        );
      }
    },
    {
      key: 'unitPrice',
      label: 'Giá đơn vị',
      width: 'w-32',
      sortable: true,
      align: 'right',
      render: (value) => (
        <span className="font-medium">{formatCurrency(value as number)}</span>
      )
    },
    {
      key: 'supplier',
      label: 'Nhà cung cấp',
      width: 'w-40',
      sortable: true,
      render: (value) => (
        <span className="truncate">{value as string}</span>
      )
    },
    {
      key: 'location',
      label: 'Vị trí',
      width: 'w-24',
      render: (value) => (
        value ? <span className="text-sm">{value as string}</span> : <span className="text-muted-foreground">-</span>
      )
    },
    {
      key: 'lastUpdated',
      label: 'Cập nhật',
      width: 'w-32',
      sortable: true,
      render: (value) => (
        <span className="text-sm">
          {new Date(value as string).toLocaleDateString('vi-VN')}
        </span>
      )
    }
  ];

  const actions: TableAction<InventoryItem>[] = [
    ...(onView ? [{
      label: 'Xem chi tiết',
      icon: Eye,
      onClick: onView
    }] : []),
    ...(onEdit ? [{
      label: 'Chỉnh sửa',
      icon: Edit,
      onClick: onEdit
    }] : []),
    ...(onDelete ? [{
      label: 'Xóa',
      icon: Trash2,
      onClick: onDelete,
      variant: 'destructive' as const,
      show: (item: InventoryItem) => item.currentStock === 0 // Only allow delete if out of stock
    }] : [])
  ];

  return (
    <DataTable<InventoryItem>
      data={data}
      columns={columns}
      actions={actions}
      loading={loading}
      searchable={true}
      filterable={true}
      selection={{
        enabled: !!onBulkAction,
        onSelectionChange: onBulkAction ? (items) => {
          // Could trigger bulk actions UI here
        } : undefined
      }}
      pagination={{
        pageSize: 20,
        showSizeSelector: true
      }}
      emptyState={{
        title: 'Không có sản phẩm nào',
        description: 'Thêm sản phẩm đầu tiên vào kho',
        icon: Package
      }}
      className={className}
    />
  );
};