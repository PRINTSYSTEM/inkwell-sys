import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Clock,
  Play,
  CheckCircle,
  User,
  Calendar,
  AlertTriangle,
  Calculator,
  Package,
  Plus,
  Eye,
  Edit
} from 'lucide-react';
import { productions, orders, customers, mockUsers, mockMaterials } from '@/lib/mockData';

interface Production {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  productType: string;
  quantity: number;
  assignedTo?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'paused';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  startDate?: string;
  endDate?: string;
  estimatedDuration: number;
  progress: number;
  notes?: string;
  materialRequirements?: MaterialRequirement[];
}

interface MaterialRequirement {
  materialId: string;
  materialName: string;
  requiredQuantity: number;
  unit: string;
  availableStock: number;
  shortage: number;
  stockStatus: 'sufficient' | 'low' | 'insufficient';
}

export default function ProductionManagement() {
  const [productionList, setProductionList] = useState<Production[]>([]);
  const [selectedProduction, setSelectedProduction] = useState<Production | null>(null);
  const [showMaterialCalculator, setShowMaterialCalculator] = useState(false);
  const [materialCalculations, setMaterialCalculations] = useState<MaterialRequirement[]>([]);

  useEffect(() => {
    // Tạo production data từ orders
    const productionData: Production[] = orders.map(order => {
      const customer = customers.find(c => c.id === order.customerId);
      const existingProduction = productions.find(p => p.orderId === order.id);
      
      return {
        id: existingProduction?.id || `prod-${order.id}`,
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: customer?.representativeName || 'Unknown Customer',
        productType: order.description || 'General Print',
        quantity: order.quantity || 100,
        assignedTo: existingProduction?.assignedTo,
        status: existingProduction?.status || 'pending',
        priority: 'medium' as Production['priority'],
        startDate: existingProduction?.startedAt,
        endDate: undefined,
        estimatedDuration: 3,
        progress: existingProduction?.progress || 0,
        notes: existingProduction?.notes
      };
    });

    setProductionList(productionData);
  }, []);

  const calculateMaterialRequirements = (production: Production) => {
    // Mock material calculation logic
    const baseMaterials: MaterialRequirement[] = [
      {
        materialId: 'paper-a4',
        materialName: 'Giấy A4 80gsm',
        requiredQuantity: production.quantity * 1.1, // 10% waste factor
        unit: 'tờ',
        availableStock: 5000,
        shortage: 0,
        stockStatus: 'sufficient'
      },
      {
        materialId: 'ink-black',
        materialName: 'Mực đen CMYK',
        requiredQuantity: Math.ceil(production.quantity / 100) * 2, // 2ml per 100 sheets
        unit: 'ml',
        availableStock: 500,
        shortage: 0,
        stockStatus: 'sufficient'
      }
    ];

    // Calculate shortages and stock status
    const calculations = baseMaterials.map(material => {
      const shortage = Math.max(0, material.requiredQuantity - material.availableStock);
      let stockStatus: 'sufficient' | 'low' | 'insufficient' = 'sufficient';
      
      if (shortage > 0) {
        stockStatus = 'insufficient';
      } else if (material.availableStock < material.requiredQuantity * 1.2) {
        stockStatus = 'low';
      }

      return {
        ...material,
        shortage,
        stockStatus
      };
    });

    setMaterialCalculations(calculations);
    return calculations;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'in_progress':
        return <Play className="h-4 w-4 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'paused':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 border-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 border-blue-200';
      case 'completed':
        return 'bg-green-100 border-green-200';
      case 'paused':
        return 'bg-orange-100 border-orange-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'secondary';
      case 'medium':
        return 'outline';
      case 'low':
        return 'default';
      default:
        return 'outline';
    }
  };

  const updateProductionStatus = (productionId: string, newStatus: string) => {
    setProductionList(prev => 
      prev.map(prod => 
        prod.id === productionId 
          ? { 
              ...prod, 
              status: newStatus as Production['status'],
              startDate: newStatus === 'in_progress' && !prod.startDate ? new Date().toISOString() : prod.startDate,
              endDate: newStatus === 'completed' ? new Date().toISOString() : prod.endDate,
              progress: newStatus === 'completed' ? 100 : prod.progress
            }
          : prod
      )
    );
  };

  const groupedProductions = {
    pending: productionList.filter(p => p.status === 'pending'),
    in_progress: productionList.filter(p => p.status === 'in_progress'),
    completed: productionList.filter(p => p.status === 'completed'),
    paused: productionList.filter(p => p.status === 'paused')
  };

  const ProductionCard = ({ production }: { production: Production }) => (
    <Card className={`mb-4 ${getStatusColor(production.status)}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon(production.status)}
            <CardTitle className="text-lg">#{production.orderNumber}</CardTitle>
            <Badge variant={getPriorityColor(production.priority)}>
              {production.priority === 'urgent' ? 'Khẩn cấp' :
               production.priority === 'high' ? 'Cao' :
               production.priority === 'medium' ? 'Trung bình' : 'Thấp'}
            </Badge>
          </div>
          <div className="flex space-x-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" onClick={() => setSelectedProduction(production)}>
                  <Eye className="h-4 w-4 mr-1" />
                  Chi tiết
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Chi tiết sản xuất #{production.orderNumber}</DialogTitle>
                </DialogHeader>
                <ProductionDetails production={production} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="font-medium">{production.customerName}</p>
            <p className="text-sm text-muted-foreground">{production.productType}</p>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span>Số lượng: <strong>{production.quantity.toLocaleString()}</strong></span>
            {production.assignedTo && (
              <span className="flex items-center">
                <User className="h-3 w-3 mr-1" />
                {mockUsers.find(u => u.id === production.assignedTo)?.name}
              </span>
            )}
          </div>

          {production.status === 'in_progress' && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Tiến độ</span>
                <span>{production.progress}%</span>
              </div>
              <Progress value={production.progress} />
            </div>
          )}

          <div className="flex justify-between">
            <Select
              value={production.status}
              onValueChange={(value) => updateProductionStatus(production.id, value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Chờ sản xuất</SelectItem>
                <SelectItem value="in_progress">Đang sản xuất</SelectItem>
                <SelectItem value="paused">Tạm dừng</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
              </SelectContent>
            </Select>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedProduction(production);
                calculateMaterialRequirements(production);
                setShowMaterialCalculator(true);
              }}
            >
              <Calculator className="h-4 w-4 mr-1" />
              Tính nguyên liệu
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ProductionDetails = ({ production }: { production: Production }) => (
    <Tabs defaultValue="overview" className="mt-4">
      <TabsList>
        <TabsTrigger value="overview">Tổng quan</TabsTrigger>
        <TabsTrigger value="materials">Nguyên liệu</TabsTrigger>
        <TabsTrigger value="timeline">Tiến độ</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Khách hàng:</span>
                <span className="text-sm font-medium">{production.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Sản phẩm:</span>
                <span className="text-sm font-medium">{production.productType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Số lượng:</span>
                <span className="text-sm font-medium">{production.quantity.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Ưu tiên:</span>
                <Badge variant={getPriorityColor(production.priority)}>
                  {production.priority === 'urgent' ? 'Khẩn cấp' :
                   production.priority === 'high' ? 'Cao' :
                   production.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tiến độ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Trạng thái:</span>
                <Badge variant={production.status === 'completed' ? 'default' : 'secondary'}>
                  {production.status === 'pending' ? 'Chờ sản xuất' :
                   production.status === 'in_progress' ? 'Đang sản xuất' :
                   production.status === 'completed' ? 'Hoàn thành' : 'Tạm dừng'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tiến độ:</span>
                <span className="text-sm font-medium">{production.progress}%</span>
              </div>
              {production.startDate && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Bắt đầu:</span>
                  <span className="text-sm font-medium">
                    {new Date(production.startDate).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              )}
              {production.endDate && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Hoàn thành:</span>
                  <span className="text-sm font-medium">
                    {new Date(production.endDate).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="materials" className="space-y-4">
        <Button
          onClick={() => {
            calculateMaterialRequirements(production);
            setShowMaterialCalculator(true);
          }}
          className="mb-4"
        >
          <Calculator className="h-4 w-4 mr-2" />
          Tính toán nguyên liệu
        </Button>
        
        {materialCalculations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Yêu cầu nguyên liệu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {materialCalculations.map((material, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{material.materialName}</p>
                      <p className="text-sm text-muted-foreground">
                        Cần: {material.requiredQuantity} {material.unit} | 
                        Có: {material.availableStock} {material.unit}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {material.shortage > 0 && (
                        <span className="text-sm text-red-600 font-medium">
                          Thiếu: {material.shortage} {material.unit}
                        </span>
                      )}
                      <Badge 
                        variant={
                          material.stockStatus === 'sufficient' ? 'default' :
                          material.stockStatus === 'low' ? 'secondary' : 'destructive'
                        }
                      >
                        {material.stockStatus === 'sufficient' ? 'Đủ' :
                         material.stockStatus === 'low' ? 'Ít' : 'Thiếu'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="timeline" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Thời gian ước tính</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Thời gian dự kiến:</span>
                <span className="text-sm font-medium">{production.estimatedDuration} ngày</span>
              </div>
              {production.notes && (
                <div>
                  <span className="text-sm text-muted-foreground">Ghi chú:</span>
                  <p className="text-sm mt-1">{production.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý sản xuất</h1>
          <p className="text-muted-foreground">
            Theo dõi và quản lý tiến độ sản xuất các đơn hàng
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Thêm công việc
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chờ sản xuất</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groupedProductions.pending.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang sản xuất</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groupedProductions.in_progress.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoàn thành</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groupedProductions.completed.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tạm dừng</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groupedProductions.paused.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Production Kanban Board */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Pending */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5 text-yellow-600" />
              Chờ sản xuất ({groupedProductions.pending.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {groupedProductions.pending.map(production => (
                <ProductionCard key={production.id} production={production} />
              ))}
              {groupedProductions.pending.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Không có công việc chờ sản xuất
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* In Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Play className="mr-2 h-5 w-5 text-blue-600" />
              Đang sản xuất ({groupedProductions.in_progress.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {groupedProductions.in_progress.map(production => (
                <ProductionCard key={production.id} production={production} />
              ))}
              {groupedProductions.in_progress.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Không có công việc đang sản xuất
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Completed & Paused */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
              Hoàn thành ({groupedProductions.completed.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {groupedProductions.completed.map(production => (
                <ProductionCard key={production.id} production={production} />
              ))}
              {groupedProductions.paused.length > 0 && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium text-orange-600 mb-2 flex items-center">
                    <AlertTriangle className="mr-1 h-4 w-4" />
                    Tạm dừng ({groupedProductions.paused.length})
                  </h4>
                  {groupedProductions.paused.map(production => (
                    <ProductionCard key={production.id} production={production} />
                  ))}
                </div>
              )}
              {groupedProductions.completed.length === 0 && groupedProductions.paused.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Chưa có công việc hoàn thành
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Material Calculator Modal */}
      <Dialog open={showMaterialCalculator} onOpenChange={setShowMaterialCalculator}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Calculator className="mr-2 h-5 w-5" />
              Tính toán nguyên liệu
            </DialogTitle>
          </DialogHeader>
          
          {selectedProduction && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Đơn hàng #{selectedProduction.orderNumber}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Khách hàng:</span>
                      <p className="font-medium">{selectedProduction.customerName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Sản phẩm:</span>
                      <p className="font-medium">{selectedProduction.productType}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Số lượng:</span>
                      <p className="font-medium">{selectedProduction.quantity.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {materialCalculations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Yêu cầu nguyên liệu</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {materialCalculations.map((material, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center space-x-3">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{material.materialName}</p>
                              <p className="text-sm text-muted-foreground">
                                Yêu cầu: <strong>{material.requiredQuantity} {material.unit}</strong> | 
                                Tồn kho: {material.availableStock} {material.unit}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {material.shortage > 0 && (
                              <Alert className="p-2 border-red-200">
                                <AlertDescription className="text-sm text-red-600">
                                  Thiếu: {material.shortage} {material.unit}
                                </AlertDescription>
                              </Alert>
                            )}
                            <Badge 
                              variant={
                                material.stockStatus === 'sufficient' ? 'default' :
                                material.stockStatus === 'low' ? 'secondary' : 'destructive'
                              }
                            >
                              {material.stockStatus === 'sufficient' ? 'Đủ nguyên liệu' :
                               material.stockStatus === 'low' ? 'Sắp hết' : 'Không đủ'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowMaterialCalculator(false)}>
                  Đóng
                </Button>
                <Button onClick={() => {
                  // TODO: Save material calculations
                  setShowMaterialCalculator(false);
                }}>
                  Lưu tính toán
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}