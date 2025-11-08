import { AlertData } from './AlertsWidget';

export const createSampleAlerts = (): AlertData[] => [
  {
    id: '1',
    type: 'warning',
    title: 'Hiệu suất giảm',
    description: 'Hiệu suất phòng ban giảm 15% so với tuần trước',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    actionRequired: true,
    priority: 'high',
    source: 'Hệ thống theo dõi'
  },
  {
    id: '2',
    type: 'error',
    title: 'Nhân viên quá tải',
    description: 'Nguyễn Văn A có khối lượng công việc > 120%',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    actionRequired: true,
    priority: 'urgent',
    source: 'Quản lý công việc'
  },
  {
    id: '3',
    type: 'info',
    title: 'Báo cáo tháng đã sẵn sàng',
    description: 'Báo cáo hiệu suất tháng 11 đã được tạo',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    actionRequired: false,
    priority: 'low',
    source: 'Hệ thống báo cáo'
  }
];

export const createEmployeeAlerts = (employees: Array<{ name: string; workload: number; performance: number }>): AlertData[] => {
  const alerts: AlertData[] = [];
  
  employees.forEach((employee, index) => {
    if (employee.workload > 100) {
      alerts.push({
        id: `workload-${index}`,
        type: 'warning',
        title: 'Nhân viên quá tải',
        description: `${employee.name} có khối lượng công việc ${employee.workload}%`,
        timestamp: new Date().toISOString(),
        actionRequired: true,
        priority: employee.workload > 120 ? 'urgent' : 'high',
        source: 'Quản lý công việc',
        relatedId: `employee-${index}`
      });
    }
    
    if (employee.performance < 60) {
      alerts.push({
        id: `performance-${index}`,
        type: 'error',
        title: 'Hiệu suất thấp',
        description: `${employee.name} có hiệu suất ${employee.performance}%`,
        timestamp: new Date().toISOString(),
        actionRequired: true,
        priority: 'high',
        source: 'Đánh giá hiệu suất',
        relatedId: `employee-${index}`
      });
    }
  });
  
  return alerts;
};

export const createInventoryAlerts = (items: Array<{ name: string; stock: number; minStock: number }>): AlertData[] => {
  const alerts: AlertData[] = [];
  
  items.forEach((item, index) => {
    if (item.stock === 0) {
      alerts.push({
        id: `out-of-stock-${index}`,
        type: 'error',
        title: 'Hết hàng',
        description: `${item.name} đã hết hàng`,
        timestamp: new Date().toISOString(),
        actionRequired: true,
        priority: 'urgent',
        source: 'Quản lý kho',
        relatedId: `item-${index}`
      });
    } else if (item.stock <= item.minStock) {
      alerts.push({
        id: `low-stock-${index}`,
        type: 'warning',
        title: 'Sắp hết hàng',
        description: `${item.name} chỉ còn ${item.stock} sản phẩm`,
        timestamp: new Date().toISOString(),
        actionRequired: true,
        priority: 'medium',
        source: 'Quản lý kho',
        relatedId: `item-${index}`
      });
    }
  });
  
  return alerts;
};