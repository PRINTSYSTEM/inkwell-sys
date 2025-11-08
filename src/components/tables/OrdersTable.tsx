import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Truck, FileText, DollarSign } from 'lucide-react';
import { DataTable, TableColumn, TableAction } from './DataTable';

export interface OrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  status: 'pending' | 'confirmed' | 'in_production' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  orderDate: string;
  dueDate: string;
  completedDate?: string;
  totalAmount: number;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  assignedTo?: string;
  notes?: string;
  [key: string]: unknown;
}

interface OrdersTableProps {
  data: OrderItem[];
  loading?: boolean;
  onView?: (order: OrderItem) => void;
  onEdit?: (order: OrderItem) => void;
  onUpdateStatus?: (order: OrderItem, status: OrderItem['status']) => void;
  onBulkAction?: (orders: OrderItem[], action: string) => void;
  className?: string;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
  data,
  loading = false,
  onView,
  onEdit,
  onUpdateStatus,
  onBulkAction,
  className
}) => {
  const getStatusBadge = (status: OrderItem['status']) => {
    const statusMap = {
      pending: { label: 'Chờ xử lý', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800' },
      confirmed: { label: 'Đã xác nhận', variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
      in_production: { label: 'Đang sản xuất', variant: 'default' as const, color: 'bg-yellow-100 text-yellow-800' },
      completed: { label: 'Hoàn thành', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Đã hủy', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' }
    };
    return statusMap[status];
  };

  const getPriorityBadge = (priority: OrderItem['priority']) => {
    const priorityMap = {
      low: { label: 'Thấp', color: 'bg-green-100 text-green-800' },
      medium: { label: 'Trung bình', color: 'bg-yellow-100 text-yellow-800' },
      high: { label: 'Cao', color: 'bg-orange-100 text-orange-800' },
      urgent: { label: 'Khẩn cấp', color: 'bg-red-100 text-red-800' }
    };
    return priorityMap[priority];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const isOverdue = (dueDate: string, status: OrderItem['status']) => {
    return new Date(dueDate) < new Date() && 
           !['completed', 'cancelled'].includes(status);
  };

  const getDaysRemaining = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const columns: TableColumn<OrderItem>[] = [
    {
      key: 'orderNumber',
      label: 'Số đơn hàng',
      width: 'w-32',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-mono font-medium">{value as string}</div>
          {isOverdue(row.dueDate, row.status) && (
            <Badge className="bg-red-100 text-red-800 text-xs" variant="outline">
              Quá hạn
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'customerName',
      label: 'Khách hàng',
      sortable: true,
      render: (value, row) => (
        <div className="min-w-0">
          <div className="font-medium truncate">{value as string}</div>
          {row.customerEmail && (
            <div className="text-sm text-muted-foreground truncate">{row.customerEmail}</div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Trạng thái',
      width: 'w-32',
      sortable: true,
      align: 'center',
      render: (value) => {
        const status = getStatusBadge(value as OrderItem['status']);
        return (
          <Badge className={status.color} variant="outline">
            {status.label}
          </Badge>
        );
      }
    },
    {
      key: 'priority',
      label: 'Ưu tiên',
      width: 'w-24',
      sortable: true,
      align: 'center',
      render: (value) => {
        const priority = getPriorityBadge(value as OrderItem['priority']);
        return (
          <Badge className={priority.color} variant="outline">
            {priority.label}
          </Badge>
        );
      }
    },
    {
      key: 'orderDate',
      label: 'Ngày đặt',
      width: 'w-28',
      sortable: true,
      render: (value) => (
        <span className="text-sm">{formatDate(value as string)}</span>
      )
    },
    {
      key: 'dueDate',
      label: 'Hạn giao',
      width: 'w-28',
      sortable: true,
      render: (value, row) => {
        const overdue = isOverdue(value as string, row.status);
        const daysRemaining = getDaysRemaining(value as string);
        
        return (
          <div className="space-y-1">
            <span className={`text-sm ${overdue ? 'text-red-600 font-medium' : ''}`}>
              {formatDate(value as string)}
            </span>
            {!['completed', 'cancelled'].includes(row.status) && (
              <div className={`text-xs ${overdue ? 'text-red-600' : daysRemaining <= 3 ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                {overdue ? `Trễ ${Math.abs(daysRemaining)} ngày` : 
                 daysRemaining === 0 ? 'Hôm nay' :
                 daysRemaining === 1 ? 'Ngày mai' :
                 `${daysRemaining} ngày nữa`}
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'totalAmount',
      label: 'Tổng tiền',
      width: 'w-32',
      sortable: true,
      align: 'right',
      render: (value) => (
        <div className="font-medium">{formatCurrency(value as number)}</div>
      )
    },
    {
      key: 'items',
      label: 'Sản phẩm',
      width: 'w-20',
      align: 'center',
      render: (value) => {
        const items = value as OrderItem['items'];
        return (
          <Badge variant="secondary">
            {items.length} SP
          </Badge>
        );
      }
    },
    {
      key: 'assignedTo',
      label: 'Phụ trách',
      width: 'w-32',
      render: (value) => (
        value ? (
          <span className="text-sm">{value as string}</span>
        ) : (
          <span className="text-muted-foreground text-sm">Chưa phân công</span>
        )
      )
    }
  ];

  const actions: TableAction<OrderItem>[] = [
    ...(onView ? [{
      label: 'Xem chi tiết',
      icon: Eye,
      onClick: onView
    }] : []),
    ...(onEdit ? [{
      label: 'Chỉnh sửa',
      icon: Edit,
      onClick: onEdit,
      show: (order: OrderItem) => !['completed', 'cancelled'].includes(order.status)
    }] : []),
    ...(onUpdateStatus ? [{
      label: 'Cập nhật trạng thái',
      icon: Truck,
      onClick: (order: OrderItem) => {
        // This would typically open a status update modal
        // For now, we'll cycle through statuses as an example
        const statuses: OrderItem['status'][] = ['pending', 'confirmed', 'in_production', 'completed'];
        const currentIndex = statuses.indexOf(order.status);
        const nextStatus = statuses[(currentIndex + 1) % statuses.length];
        onUpdateStatus(order, nextStatus);
      },
      show: (order: OrderItem) => order.status !== 'completed' && order.status !== 'cancelled'
    }] : [])
  ];

  return (
    <DataTable<OrderItem>
      data={data}
      columns={columns}
      actions={actions}
      loading={loading}
      searchable={true}
      filterable={true}
      selection={{
        enabled: !!onBulkAction,
        onSelectionChange: onBulkAction ? (orders) => {
          // Could trigger bulk actions UI here
        } : undefined
      }}
      pagination={{
        pageSize: 15,
        showSizeSelector: true
      }}
      emptyState={{
        title: 'Không có đơn hàng nào',
        description: 'Tạo đơn hàng đầu tiên',
        icon: FileText
      }}
      className={className}
    />
  );
};