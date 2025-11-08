import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Eye, 
  Edit, 
  Phone, 
  Mail, 
  Calendar,
  Users,
  MapPin,
  Clock
} from 'lucide-react';
import { DataTable, TableColumn, TableAction } from './DataTable';

export interface EmployeeItem {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar?: string;
  email: string;
  phone?: string;
  position: string;
  department: string;
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  startDate: string;
  endDate?: string;
  salary?: number;
  address?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  skills?: string[];
  workSchedule?: {
    type: 'full_time' | 'part_time' | 'contract';
    hoursPerWeek: number;
  };
  manager?: string;
  lastLogin?: string;
  [key: string]: unknown;
}

interface EmployeeTableProps {
  data: EmployeeItem[];
  loading?: boolean;
  onView?: (employee: EmployeeItem) => void;
  onEdit?: (employee: EmployeeItem) => void;
  onUpdateStatus?: (employee: EmployeeItem, status: EmployeeItem['status']) => void;
  onAssignRole?: (employee: EmployeeItem) => void;
  onBulkAction?: (employees: EmployeeItem[], action: string) => void;
  className?: string;
}

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  data,
  loading = false,
  onView,
  onEdit,
  onUpdateStatus,
  onAssignRole,
  onBulkAction,
  className
}) => {
  const getStatusBadge = (status: EmployeeItem['status']) => {
    const statusMap = {
      active: { label: 'Đang làm việc', color: 'bg-green-100 text-green-800' },
      inactive: { label: 'Tạm ngưng', color: 'bg-gray-100 text-gray-800' },
      on_leave: { label: 'Nghỉ phép', color: 'bg-yellow-100 text-yellow-800' },
      terminated: { label: 'Đã nghỉ việc', color: 'bg-red-100 text-red-800' }
    };
    return statusMap[status];
  };

  const getWorkTypeBadge = (type?: string) => {
    if (!type) return null;
    
    const typeMap = {
      full_time: { label: 'Toàn thời gian', color: 'bg-blue-100 text-blue-800' },
      part_time: { label: 'Bán thời gian', color: 'bg-purple-100 text-purple-800' },
      contract: { label: 'Hợp đồng', color: 'bg-orange-100 text-orange-800' }
    };
    return typeMap[type as keyof typeof typeMap];
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

  const calculateWorkYears = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffTime = end.getTime() - start.getTime();
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
    return Math.round(diffYears * 10) / 10; // Round to 1 decimal place
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatLastSeen = (lastLogin?: string) => {
    if (!lastLogin) return 'Chưa từng đăng nhập';
    
    const now = new Date();
    const login = new Date(lastLogin);
    const diffHours = (now.getTime() - login.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) return 'Vừa truy cập';
    if (diffHours < 24) return `${Math.floor(diffHours)} giờ trước`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return formatDate(lastLogin);
  };

  const columns: TableColumn<EmployeeItem>[] = [
    {
      key: 'employeeCode',
      label: 'Mã NV',
      width: 'w-24',
      sortable: true,
      render: (value) => (
        <span className="font-mono font-medium text-sm">{value as string}</span>
      )
    },
    {
      key: 'fullName',
      label: 'Nhân viên',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center space-x-3 min-w-0">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={row.avatar} alt={value as string} />
            <AvatarFallback className="text-xs">
              {getInitials(row.firstName, row.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="font-medium truncate">{value as string}</div>
            <div className="text-sm text-muted-foreground truncate">{row.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'position',
      label: 'Vị trí',
      sortable: true,
      render: (value, row) => (
        <div className="space-y-1">
          <div className="font-medium text-sm">{value as string}</div>
          <div className="text-xs text-muted-foreground">{row.department}</div>
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
        const status = getStatusBadge(value as EmployeeItem['status']);
        return (
          <Badge className={status.color} variant="outline">
            {status.label}
          </Badge>
        );
      }
    },
    {
      key: 'workSchedule',
      label: 'Loại hình',
      width: 'w-28',
      align: 'center',
      render: (value, row) => {
        const schedule = value as EmployeeItem['workSchedule'];
        if (!schedule) return <span className="text-muted-foreground text-sm">-</span>;
        
        const workType = getWorkTypeBadge(schedule.type);
        return workType ? (
          <div className="space-y-1">
            <Badge className={workType.color} variant="outline">
              {workType.label}
            </Badge>
            <div className="text-xs text-muted-foreground">
              {schedule.hoursPerWeek}h/tuần
            </div>
          </div>
        ) : null;
      }
    },
    {
      key: 'startDate',
      label: 'Ngày vào làm',
      width: 'w-28',
      sortable: true,
      render: (value, row) => {
        const years = calculateWorkYears(value as string, row.endDate);
        return (
          <div className="space-y-1">
            <span className="text-sm">{formatDate(value as string)}</span>
            <div className="text-xs text-muted-foreground">
              {years} năm
            </div>
          </div>
        );
      }
    },
    {
      key: 'phone',
      label: 'Liên hệ',
      width: 'w-32',
      render: (value, row) => (
        <div className="space-y-1">
          {value && (
            <div className="flex items-center space-x-1 text-sm">
              <Phone className="h-3 w-3" />
              <span>{value as string}</span>
            </div>
          )}
          {row.address && (
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate max-w-20">{row.address}</span>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'salary',
      label: 'Lương',
      width: 'w-28',
      sortable: true,
      align: 'right',
      render: (value) => (
        value ? (
          <div className="font-medium text-sm">{formatCurrency(value as number)}</div>
        ) : (
          <span className="text-muted-foreground text-sm">Bảo mật</span>
        )
      )
    },
    {
      key: 'skills',
      label: 'Kỹ năng',
      width: 'w-32',
      render: (value) => {
        const skills = value as string[] | undefined;
        if (!skills || skills.length === 0) {
          return <span className="text-muted-foreground text-sm">-</span>;
        }
        
        return (
          <div className="flex flex-wrap gap-1">
            {skills.slice(0, 2).map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {skills.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{skills.length - 2}
              </Badge>
            )}
          </div>
        );
      }
    },
    {
      key: 'lastLogin',
      label: 'Hoạt động',
      width: 'w-28',
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{formatLastSeen(value as string | undefined)}</span>
        </div>
      )
    }
  ];

  const actions: TableAction<EmployeeItem>[] = [
    ...(onView ? [{
      label: 'Xem hồ sơ',
      icon: Eye,
      onClick: onView
    }] : []),
    ...(onEdit ? [{
      label: 'Chỉnh sửa',
      icon: Edit,
      onClick: onEdit,
      show: (employee: EmployeeItem) => employee.status !== 'terminated'
    }] : []),
    ...(onAssignRole ? [{
      label: 'Phân quyền',
      icon: Users,
      onClick: onAssignRole,
      show: (employee: EmployeeItem) => employee.status === 'active'
    }] : []),
    ...(onUpdateStatus ? [{
      label: 'Cập nhật trạng thái',
      icon: Calendar,
      onClick: (employee: EmployeeItem) => {
        // This would typically open a status update modal
        // For now, we'll cycle through statuses as an example
        const statuses: EmployeeItem['status'][] = ['active', 'inactive', 'on_leave'];
        const currentIndex = statuses.indexOf(employee.status);
        const nextStatus = statuses[(currentIndex + 1) % statuses.length];
        onUpdateStatus(employee, nextStatus);
      },
      show: (employee: EmployeeItem) => employee.status !== 'terminated'
    }] : [])
  ];

  return (
    <DataTable<EmployeeItem>
      data={data}
      columns={columns}
      actions={actions}
      loading={loading}
      searchable={true}
      filterable={true}
      selection={{
        enabled: !!onBulkAction,
        onSelectionChange: onBulkAction ? (employees) => {
          // Could trigger bulk actions UI here
        } : undefined
      }}
      pagination={{
        pageSize: 20,
        showSizeSelector: true
      }}
      emptyState={{
        title: 'Không có nhân viên nào',
        description: 'Thêm nhân viên đầu tiên vào hệ thống',
        icon: Users
      }}
      className={className}
    />
  );
};