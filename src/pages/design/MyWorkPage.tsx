import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Badge, 
  Button,
  Avatar,
  AvatarFallback,
  Progress,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/index';
import { 
  Eye,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Play,
  FileText,
  Image as ImageIcon,
  BarChart3,
  TrendingUp,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Design } from '@/types';
import { designService, users } from '@/lib/mockData';
import { statusConfig, priorityConfig } from '@/lib/mockData';

export default function MyWorkPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Mock current user ID - should come from auth context
  const currentUserId = 'designer1';

  useEffect(() => {
    const fetchMyDesigns = async () => {
      try {
        setLoading(true);
        const data = await designService.getMyDesigns(currentUserId);
        setDesigns(data);
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách công việc",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMyDesigns();
  }, [toast]);

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.fullName || 'Không xác định';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getStatusStats = () => {
    const stats = {
      pending: designs.filter(d => d.status === 'pending').length,
      in_progress: designs.filter(d => d.status === 'in_progress').length,
      review: designs.filter(d => d.status === 'review').length,
      revision: designs.filter(d => d.status === 'revision').length,
      approved: designs.filter(d => d.status === 'approved').length,
      delivered: designs.filter(d => d.status === 'delivered').length,
    };
    return stats;
  };

  const getPriorityStats = () => {
    const stats = {
      urgent: designs.filter(d => d.priority === 'urgent').length,
      high: designs.filter(d => d.priority === 'high').length,
      medium: designs.filter(d => d.priority === 'medium').length,
      low: designs.filter(d => d.priority === 'low').length,
    };
    return stats;
  };

  const getOverdueDesigns = () => {
    return designs.filter(d => d.dueDate && new Date(d.dueDate) < new Date());
  };

  const getTodayDueDesigns = () => {
    const today = new Date().toDateString();
    return designs.filter(d => d.dueDate && new Date(d.dueDate).toDateString() === today);
  };

  const groupDesignsByStatus = () => {
    const grouped: { [key: string]: Design[] } = {};
    Object.keys(statusConfig).forEach(status => {
      grouped[status] = designs.filter(d => d.status === status);
    });
    return grouped;
  };

  const DesignCard = ({ design }: { design: Design }) => {
    const status = statusConfig[design.status];
    const priority = priorityConfig[design.priority];
    const StatusIcon = status.icon;
    const isOverdue = design.dueDate && new Date(design.dueDate) < new Date();
    const isDueToday = design.dueDate && new Date(design.dueDate).toDateString() === new Date().toDateString();
    
    return (
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/design/detail/${design.id}`)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <CardTitle className="text-base line-clamp-2">{design.designName}</CardTitle>
              <p className="text-sm text-muted-foreground font-mono">{design.designCode}</p>
              <p className="text-sm text-muted-foreground">{design.customerName}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge className={`${status.color} flex items-center gap-1 text-xs`}>
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </Badge>
              <Badge className={`${priority.color} text-xs`}>
                {priority.label}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Progress */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Tiến độ</span>
              <span>{design.progressImages.length} hình</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min((design.progressImages.length / 5) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Due Date */}
          {design.dueDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              <span className={`${isOverdue ? 'text-red-600 font-medium' : isDueToday ? 'text-orange-600 font-medium' : 'text-muted-foreground'}`}>
                {isOverdue && '⚠️ '}
                {isDueToday && '📅 '}
                {formatDate(design.dueDate)}
              </span>
            </div>
          )}

          {/* Dimensions & Quantity */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{design.dimensions}</span>
            <span>{design.quantity.toLocaleString()} sản phẩm</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  const StatCard = ({ title, value, icon: Icon, color, description }: {
    title: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    description?: string;
  }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </div>
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Đang tải công việc của bạn...</p>
        </div>
      </div>
    );
  }

  const statusStats = getStatusStats();
  const priorityStats = getPriorityStats();
  const overdueDesigns = getOverdueDesigns();
  const todayDueDesigns = getTodayDueDesigns();
  const groupedDesigns = groupDesignsByStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Công việc của tôi</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Dashboard cá nhân - {designs.length} thiết kế được giao cho bạn
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng công việc"
          value={designs.length}
          icon={Target}
          color="bg-blue-500"
        />
        <StatCard
          title="Đang thực hiện"
          value={statusStats.in_progress}
          icon={Play}
          color="bg-green-500"
        />
        <StatCard
          title="Cần review"
          value={statusStats.review}
          icon={Eye}
          color="bg-yellow-500"
        />
        <StatCard
          title="Quá hạn"
          value={overdueDesigns.length}
          icon={AlertCircle}
          color="bg-red-500"
          description={todayDueDesigns.length > 0 ? `${todayDueDesigns.length} hết hạn hôm nay` : undefined}
        />
      </div>

      {/* Priority Alerts */}
      {(overdueDesigns.length > 0 || todayDueDesigns.length > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Cảnh báo deadline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdueDesigns.length > 0 && (
              <div className="mb-3">
                <p className="text-red-700 font-medium mb-2">⚠️ {overdueDesigns.length} thiết kế đã quá hạn:</p>
                <div className="space-y-1">
                  {overdueDesigns.slice(0, 3).map(design => (
                    <p key={design.id} className="text-sm text-red-600">
                      • {design.designName} - Hạn: {formatDate(design.dueDate!)}
                    </p>
                  ))}
                  {overdueDesigns.length > 3 && (
                    <p className="text-sm text-red-600">... và {overdueDesigns.length - 3} thiết kế khác</p>
                  )}
                </div>
              </div>
            )}
            {todayDueDesigns.length > 0 && (
              <div>
                <p className="text-orange-700 font-medium mb-2">📅 {todayDueDesigns.length} thiết kế hết hạn hôm nay:</p>
                <div className="space-y-1">
                  {todayDueDesigns.map(design => (
                    <p key={design.id} className="text-sm text-orange-600">
                      • {design.designName}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="pending">Chờ xử lý ({statusStats.pending})</TabsTrigger>
          <TabsTrigger value="in_progress">Đang làm ({statusStats.in_progress})</TabsTrigger>
          <TabsTrigger value="review">Review ({statusStats.review})</TabsTrigger>
          <TabsTrigger value="completed">Hoàn thành ({statusStats.approved + statusStats.delivered})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Phân bổ theo trạng thái
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(statusStats).map(([status, count]) => {
                  const config = statusConfig[status];
                  const percentage = designs.length > 0 ? (count / designs.length) * 100 : 0;
                  return (
                    <div key={status} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <config.icon className="h-4 w-4" />
                          {config.label}
                        </span>
                        <span>{count}</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Phân bổ theo độ ưu tiên
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(priorityStats).map(([priority, count]) => {
                  const config = priorityConfig[priority];
                  const percentage = designs.length > 0 ? (count / designs.length) * 100 : 0;
                  return (
                    <div key={priority} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <config.icon className="h-4 w-4" />
                          {config.label}
                        </span>
                        <span>{count}</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Recent Designs */}
          <Card>
            <CardHeader>
              <CardTitle>Thiết kế gần đây</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {designs
                  .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                  .slice(0, 6)
                  .map(design => (
                    <DesignCard key={design.id} design={design} />
                  ))}
              </div>
              {designs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chưa có thiết kế nào được giao cho bạn</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Status-specific tabs */}
        {Object.entries(groupedDesigns).map(([status, statusDesigns]) => {
          const StatusIcon = statusConfig[status].icon;
          return (
            <TabsContent key={status} value={status}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <StatusIcon className="h-5 w-5" />
                    {statusConfig[status].label} ({statusDesigns.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {statusDesigns.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {statusDesigns.map(design => (
                        <DesignCard key={design.id} design={design} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <StatusIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Không có thiết kế nào ở trạng thái này</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Đã hoàn thành ({statusStats.approved + statusStats.delivered})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(statusStats.approved + statusStats.delivered) > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...groupedDesigns.approved, ...groupedDesigns.delivered].map(design => (
                    <DesignCard key={design.id} design={design} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chưa có thiết kế nào hoàn thành</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}