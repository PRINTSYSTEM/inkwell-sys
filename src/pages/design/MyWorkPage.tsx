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
import { useMyDesigns } from '@/hooks/use-design';
import { useAuth } from '@/hooks/use-auth';
import type { Design } from '@/Schema';

export default function MyWorkPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20; // Load more items for work list
  
  // Use React Query hook to fetch my designs
  const { data: designsResponse, isLoading, error } = useMyDesigns({
    pageNumber: currentPage,
    pageSize: pageSize,
  });
  
  // Extract designs from response
  const designs = designsResponse?.items || [];
  const totalCount = designsResponse?.totalCount || 0;
  
  // Handle error
  React.useEffect(() => {
    if (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách công việc",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Status configuration for designs
  const statusConfig = {
    pending: { label: 'Chờ làm', color: 'bg-gray-100 text-gray-800', icon: Clock },
    in_progress: { label: 'Đang làm', color: 'bg-blue-100 text-blue-800', icon: Play },
    review: { label: 'Đang xem xét', color: 'bg-yellow-100 text-yellow-800', icon: Eye },
    approved: { label: 'Đã duyệt', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    rejected: { label: 'Từ chối', color: 'bg-red-100 text-red-800', icon: AlertCircle },
    cancelled: { label: 'Hủy bỏ', color: 'bg-gray-100 text-gray-800', icon: AlertCircle },
  } as const;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getStatusStats = () => {
    const stats = {
      pending: designs.filter(d => d.designStatus === 'pending').length,
      in_progress: designs.filter(d => d.designStatus === 'in_progress').length,
      review: designs.filter(d => d.designStatus === 'review').length,
      approved: designs.filter(d => d.designStatus === 'approved').length,
      completed: designs.filter(d => d.designStatus === 'completed').length,
      rejected: designs.filter(d => d.designStatus === 'rejected').length,
      cancelled: designs.filter(d => d.designStatus === 'cancelled').length,
    };
    return stats;
  };

  const getRecentDesigns = () => {
    // Get designs updated in last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return designs.filter(d => new Date(d.updatedAt) > weekAgo);
  };

  const getActiveDesigns = () => {
    // Get designs that are in progress or pending
    return designs.filter(d => 
      ['pending', 'in_progress', 'review'].includes(d.designStatus)
    );
  };

  const groupDesignsByStatus = () => {
    const grouped: { [key: string]: Design[] } = {};
    Object.keys(statusConfig).forEach(status => {
      grouped[status] = designs.filter(d => d.designStatus === status);
    });
    return grouped;
  };

  const DesignCard = ({ design }: { design: Design }) => {
    const status = statusConfig[design.designStatus as keyof typeof statusConfig] || statusConfig.pending;
    const StatusIcon = status.icon;
    
    return (
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/design/detail/${design.id}`)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <CardTitle className="text-base line-clamp-2">
                {design.designType?.name || 'Design'}
              </CardTitle>
              <p className="text-sm text-muted-foreground font-mono">{design.code}</p>
              <p className="text-sm text-muted-foreground">Order #{design.orderId}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge className={`${status.color} flex items-center gap-1 text-xs`}>
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Design Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4" />
              <span className="text-muted-foreground">
                {design.materialType?.name || 'Material'}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              <span className="text-muted-foreground">
                Cập nhật: {formatDate(design.updatedAt)}
              </span>
            </div>
          </div>

          {/* Timeline Progress */}
          {design.timelineEntries && design.timelineEntries.length > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Timeline</span>
                <span>{design.timelineEntries.length} mục</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((design.timelineEntries.length / 5) * 100, 100)}%` }}
                />
              </div>
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

  if (isLoading) {
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
  const recentDesigns = getRecentDesigns();
  const activeDesigns = getActiveDesigns();
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
          title="Cần xem xét"
          value={statusStats.review}
          icon={Eye}
          color="bg-yellow-500"
        />
        <StatCard
          title="Hoàn thành"
          value={statusStats.completed + statusStats.approved}
          icon={CheckCircle}
          color="bg-blue-500"
          description={`${recentDesigns.length} cập nhật tuần này`}
        />
      </div>

      {/* Active Designs Alert */}
      {activeDesigns.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <Play className="h-5 w-5" />
              Đang thực hiện ({activeDesigns.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeDesigns.slice(0, 5).map(design => (
                <div key={design.id} className="flex items-center justify-between p-2 rounded bg-white">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{design.code}</p>
                    <p className="text-xs text-muted-foreground">
                      {design.designType?.name} • Order #{design.orderId}
                    </p>
                  </div>
                  <Badge 
                    className={statusConfig[design.designStatus as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'} 
                    variant="secondary"
                  >
                    {statusConfig[design.designStatus as keyof typeof statusConfig]?.label || design.designStatus}
                  </Badge>
                </div>
              ))}
              {activeDesigns.length > 5 && (
                <p className="text-sm text-blue-600 text-center pt-2">
                  ... và {activeDesigns.length - 5} thiết kế khác
                </p>
              )}
            </div>
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
          <TabsTrigger value="completed">Hoàn thành ({statusStats.approved + statusStats.completed})</TabsTrigger>
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
                  Hoạt động gần đây
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentDesigns.length > 0 ? (
                  recentDesigns.slice(0, 5).map((design) => (
                    <div key={design.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer" 
                         onClick={() => navigate(`/design/detail/${design.id}`)}>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{design.code}</p>
                        <p className="text-xs text-muted-foreground">
                          {design.designType?.name} • Cập nhật {formatDateTime(design.updatedAt)}
                        </p>
                      </div>
                      <Badge className={statusConfig[design.designStatus as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'} variant="secondary">
                        {statusConfig[design.designStatus as keyof typeof statusConfig]?.label || design.designStatus}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Không có hoạt động gần đây
                  </p>
                )}
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
                Đã hoàn thành ({statusStats.approved + statusStats.completed})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(statusStats.approved + statusStats.completed) > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...groupedDesigns.approved, ...groupedDesigns.completed].map(design => (
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