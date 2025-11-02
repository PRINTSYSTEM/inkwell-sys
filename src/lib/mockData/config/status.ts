import { 
  Clock, 
  Play, 
  Eye, 
  FileText, 
  CheckCircle, 
  Truck,
  AlertCircle,
  Flag,
  Target,
  Zap
} from 'lucide-react';

// Status configuration for designs
export const statusConfig = {
  pending: {
    label: 'Chờ xử lý',
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    icon: Clock,
  },
  in_progress: {
    label: 'Đang thực hiện',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: Play,
  },
  review: {
    label: 'Đang duyệt',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: Eye,
  },
  revision: {
    label: 'Yêu cầu sửa',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    icon: FileText,
  },
  approved: {
    label: 'Đã duyệt',
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: CheckCircle,
  },
  delivered: {
    label: 'Đã giao',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    icon: Truck,
  },
};

// Priority configuration
export const priorityConfig = {
  low: {
    label: 'Thấp',
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    icon: Flag,
  },
  medium: {
    label: 'Trung bình',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: Target,
  },
  high: {
    label: 'Cao',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    icon: AlertCircle,
  },
  urgent: {
    label: 'Khẩn cấp',
    color: 'bg-red-100 text-red-800 border-red-300',
    icon: Zap,
  },
};

// Order status configuration
export const orderStatusConfig = {
  new: {
    label: 'Mới',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  designing: {
    label: 'Đang thiết kế',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  design_approved: {
    label: 'Thiết kế đã duyệt',
    color: 'bg-green-100 text-green-800 border-green-300',
  },
  waiting_quote: {
    label: 'Chờ báo giá',
    color: 'bg-gray-100 text-gray-800 border-gray-300',
  },
  quoted: {
    label: 'Đã báo giá',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  deposited: {
    label: 'Đã cọc',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  },
  prepress_ready: {
    label: 'Sẵn sàng bình bài',
    color: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  },
  in_production: {
    label: 'Đang sản xuất',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  completed: {
    label: 'Hoàn thành',
    color: 'bg-green-100 text-green-800 border-green-300',
  },
  cancelled: {
    label: 'Đã hủy',
    color: 'bg-red-100 text-red-800 border-red-300',
  },
};

// Helper functions
export function getStatusConfig(status: string) {
  return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
}

export function getPriorityConfig(priority: string) {
  return priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
}

export function getOrderStatusConfig(status: string) {
  return orderStatusConfig[status as keyof typeof orderStatusConfig] || orderStatusConfig.new;
}