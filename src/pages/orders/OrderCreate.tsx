import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Package, 
  Plus, 
  Trash2, 
  Check, 
  ChevronsUpDown 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useCreateOrder } from '@/hooks/use-order';
import { useCustomers, useCreateCustomer } from '@/hooks/use-customer';
import { useMaterialTypes, useDesignTypes } from '@/hooks/use-material-type';
import { useMaterialsByDesignType } from '@/hooks/use-material-type';
import type { MaterialType } from '@/apis/material-type.api';
import { useAuth } from '@/contexts/auth';

// Helper: normalize mọi kiểu response về mảng
const normalizeArray = <T,>(raw: unknown): T[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as T[];
  if (Array.isArray(raw.data)) return raw.data as T[];
  if (Array.isArray(raw.items)) return raw.items as T[];
  return [];
};

export default function CreateOrder() {
      // State to store materials for each designTypeId
      const [materialsByTypeMap, setMaterialsByTypeMap] = useState<Record<string, MaterialType[]>>({});
      const [loadingMaterialsByTypeMap, setLoadingMaterialsByTypeMap] = useState<Record<string, boolean>>({});

      // Fetch materials when designTypeId changes for any design
      useEffect(() => {
        designs.forEach((design) => {
          const designTypeId = design.designTypeId;
          if (designTypeId && !materialsByTypeMap[designTypeId]) {
            setLoadingMaterialsByTypeMap((prev) => ({ ...prev, [designTypeId]: true }));
            fetch(`designs/materials/design-type/${designTypeId}?status=active`)
              .then((res) => res.json())
              .then((data) => {
                setMaterialsByTypeMap((prev) => ({ ...prev, [designTypeId]: data }));
              })
              .finally(() => {
                setLoadingMaterialsByTypeMap((prev) => ({ ...prev, [designTypeId]: false }));
              });
          }
        });
      }, [designs, materialsByTypeMap]);
    const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [showCreateCustomerDialog, setShowCreateCustomerDialog] = useState(false);
  const [customerComboOpen, setCustomerComboOpen] = useState(false);

  // React Query hooks
  const { data: designTypesData, isLoading: loadingDesignTypes } = useDesignTypes({ status: 'active' });
  const { data: materialTypesData, isLoading: loadingMaterialTypes } = useMaterialTypes({ status: 'active' });
  const { data: customersData, isLoading: loadingCustomers } = useCustomers({ pageSize: 100 });
  const createOrderMutation = useCreateOrder();
  const createCustomerMutation = useCreateCustomer();
  
  // Chuẩn hóa data từ API
  const designTypes = normalizeArray<{ id: number; code: string; name: string; description?: string }>(designTypesData);
  const materialTypes = normalizeArray<{ id: number; name: string; description?: string }>(materialTypesData);
  const customers = normalizeArray<{ id: number; companyName: string; representativeName: string; code: string; phone: string }>(customersData);

  const [formData, setFormData] = useState({
    customerId: '',
    notes: '',
  });

  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: number;
    companyName: string;
    representativeName: string;
    code: string;
    phone: string;
  } | null>(null);
  
  // Multi-design support
  const [designs, setDesigns] = useState([
    {
      id: '1',
      designCode: '',
      designTypeId: '',
      materialTypeId: '',
      designName: '',
      dimensions: '',
      width: '',
      height: '',
      quantity: '',
      requirements: '',
      notes: ''
    }
  ]);

  // New customer form
  const [newCustomerData, setNewCustomerData] = useState({
    companyName: '',
    representativeName: '',
    phone: '',
    address: '',
    taxCode: '',
    maxDebt: '10000000', // Default 10M VND
  });

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find((c) => c.id.toString() === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      setFormData(prev => ({
        ...prev,
        customerId,
      }));
    }
  };

  const addDesign = () => {
    const newId = (designs.length + 1).toString();
    setDesigns([...designs, {
      id: newId,
      designCode: '',
      designTypeId: '',
      materialTypeId: '',
      designName: '',
      dimensions: '',
      width: '',
      height: '',
      quantity: '',
      requirements: '',
      notes: ''
    }]);
  };

  // Filter material types based on selected design type
  // Hiện tại chưa cần lọc, cứ trả về full list (nhưng vẫn nhận designTypeId cho đúng call site)
  const getFilteredMaterialTypes = (designTypeId?: string) => {
    // Nếu sau này API trả kèm designTypeId trong material, có thể bật filter:
    // return materialTypes.filter((m: any) => !m.designTypeId || m.designTypeId === Number(designTypeId));
    return materialTypes;
  };

  const removeDesign = (id: string) => {
    if (designs.length > 1) {
      setDesigns(designs.filter(design => design.id !== id));
    }
  };

  const updateDesign = (id: string, field: string, value: string) => {
    setDesigns(designs.map(design => {
      if (design.id === id) {
        const updatedDesign = { ...design, [field]: value };
        
        // Clear material type if design type changed
        if (field === 'designTypeId' && updatedDesign.designTypeId !== design.designTypeId) {
          updatedDesign.materialTypeId = '';
        }
        
        // Tự động sinh mã thiết kế khi có đủ thông tin
        if (selectedCustomer && updatedDesign.designTypeId && updatedDesign.designName) {
          const designType = designTypes.find(
            (dt) => dt.id.toString() === updatedDesign.designTypeId
          );
          if (designType) {
              updatedDesign.designCode = generateDesignCode(
                selectedCustomer.code, 
                designType.code, 
                updatedDesign.id
              );
              // <-- Added missing semicolon above
          }
        }
        
        return updatedDesign;
      }
      return design;
    }));
  };

  // Tự động sinh mã thiết kế theo format đơn giản
  const generateDesignCode = (customerCode: string, designType: string, designId: string) => {
    const today = new Date();
    const dateStr = today.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
    const designNumber = designId.padStart(3, '0');
    return `${customerCode}-${designType}-${designNumber}-${dateStr}`;
  };

  // Tạo mã thiết kế gợi ý cho người dùng (chưa submit)
  const generateDesignCodePreview = (designTypeId: string, designId: string) => {
    if (!designTypeId) return '';
    const designType = designTypes.find((dt) => dt.id.toString() === designTypeId);
    if (!designType) return '';
    // Chỉ hiển thị loại thiết kế + xxx (VD: Hxxx, Txxx)
    return `${designType.code}xxx`;
  };

  // Validate thiết kế cho giai đoạn thiết kế (không cần giá)
  const validateDesigns = () => {
    return designs.filter(design => 
      design.designTypeId && 
      design.materialTypeId &&
      design.designName.trim() && 
      design.dimensions.trim() && 
      design.quantity && 
      parseInt(design.quantity) > 0 &&
      design.requirements.trim() &&
      design.width !== undefined && design.height !== undefined
    );
  };

  const handleCreateCustomer = () => {
    // Validate required fields
    if (!newCustomerData.companyName || !newCustomerData.representativeName || !newCustomerData.phone) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
        variant: "destructive",
      });
      return;
    }

    createCustomerMutation.mutate({
      companyName: newCustomerData.companyName,
      representativeName: newCustomerData.representativeName,
      phone: newCustomerData.phone,
      address: newCustomerData.address || undefined,
      taxCode: newCustomerData.taxCode || undefined,
      maxDebt: parseFloat(newCustomerData.maxDebt)
    }, {
      onSuccess: () => {
        // Close dialog and reset form
        setShowCreateCustomerDialog(false);
        setNewCustomerData({
          companyName: '',
          representativeName: '',
          phone: '',
          address: '',
          taxCode: '',
          maxDebt: '10000000',
        });
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomer) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn khách hàng",
        variant: "destructive",
      });
      return;
    }

    // Validate designs cho giai đoạn thiết kế
    const validDesigns = validateDesigns();

    if (validDesigns.length === 0) {
      toast({
        title: "Lỗi", 
        description: "Vui lòng thêm ít nhất một yêu cầu thiết kế hợp lệ",
        variant: "destructive",
      });
      return;
    }

    try {
      // Prepare design requests for API
      const designRequests = validDesigns.map(design => ({
        designTypeId: parseInt(design.designTypeId),
        materialTypeId: parseInt(design.materialTypeId),
        assignedDesignerId: user?.id || 0,
        quantity: parseInt(design.quantity),
        dimensions: design.dimensions,
        width: parseInt(design.width) || 0,
        height: parseInt(design.height) || 0,
        requirements: design.requirements,
        additionalNotes: design.notes
      }));

      // Order data theo API schema
      const orderData = {
        customerId: selectedCustomer.id,
        assignedToUserId: user?.id || 0,
        deliveryAddress: '', 
        totalAmount: 0, 
        depositAmount: 0, 
        deliveryDate: new Date().toISOString(),
        note: formData.notes,
        designRequests
      };

      createOrderMutation.mutate(orderData, {
        onSuccess: () => {
          navigate('/orders');
        }
      });
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra khi tạo đơn hàng",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/orders')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tạo yêu cầu thiết kế</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Nhập thông tin khách hàng và yêu cầu thiết kế
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-4 w-4" />
              Thông tin khách hàng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-4 lg:grid-cols-3">
              {/* Customer Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Chọn khách hàng *</Label>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowCreateCustomerDialog(true)}
                    className="gap-1 h-8 px-3"
                  >
                    <Plus className="h-3 w-3" />
                    Thêm mới
                  </Button>
                </div>
                
                <Popover open={customerComboOpen} onOpenChange={setCustomerComboOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={customerComboOpen}
                      className="w-full justify-between h-9"
                    >
                      {selectedCustomer
                        ? `${selectedCustomer.companyName || selectedCustomer.representativeName} - ${selectedCustomer.code}`
                        : "Tìm và chọn khách hàng..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Tìm theo mã hoặc tên khách hàng..." />
                      <CommandList>
                        <CommandEmpty>
                          {loadingCustomers ? "Đang tải khách hàng..." : "Không tìm thấy khách hàng nào."}
                        </CommandEmpty>
                        <CommandGroup>
                          {customers.map((customer) => (
                            <CommandItem
                              key={customer.id}
                              value={`${customer.companyName || customer.representativeName} ${customer.code} ${customer.phone}`}
                              onSelect={() => {
                                handleCustomerSelect(customer.id.toString());
                                setCustomerComboOpen(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  selectedCustomer?.id === customer.id ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {customer.companyName || customer.representativeName}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {customer.code} - {customer.phone}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Mã khách hàng */}
              <div className="space-y-2">
                <Label className="text-sm">Mã khách hàng</Label>
                <Input
                  value={selectedCustomer?.code || ''}
                  placeholder="Chưa chọn khách hàng"
                  readOnly
                  className="bg-muted/50 cursor-not-allowed"
                />
              </div>

              {selectedCustomer && (
                <div className="space-y-2">
                  <Label className="text-sm">Thông tin khách hàng</Label>
                  <div className="flex items-center h-9 px-3 bg-muted/50 rounded-md border">
                    <Badge variant="outline" className="text-xs font-mono">
                      {selectedCustomer.code}
                    </Badge>
                    <span className="ml-2 text-sm text-muted-foreground">
                      ({selectedCustomer.companyName || selectedCustomer.representativeName})
                    </span>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm">Ghi chú đơn hàng</Label>
                <Textarea
                  id="notes"
                  placeholder="Ghi chú thêm cho đơn hàng..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Design Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Yêu cầu thiết kế
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addDesign}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Thêm yêu cầu
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {designs.map((design, index) => (
              <Card key={design.id} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Yêu cầu thiết kế {index + 1}</h4>
                  {designs.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDesign(design.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Loại thiết kế *</Label>
                    <Select 
                      value={design.designTypeId} 
                      onValueChange={(value) => updateDesign(design.id, 'designTypeId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại thiết kế..." />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingDesignTypes ? (
                          <SelectItem value="loading" disabled>
                            Đang tải...
                          </SelectItem>
                        ) : (
                          designTypes.map((config) => (
                            <SelectItem key={config.id} value={config.id.toString()}>
                              {config.name}
                              {config.description && (
                                <span className="text-sm text-muted-foreground ml-2">
                                  - {config.description}
                                </span>
                              )}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Loại chất liệu *</Label>
                    <Select 
                      value={design.materialTypeId} 
                      onValueChange={(value) => updateDesign(design.id, 'materialTypeId', value)}
                      disabled={!design.designTypeId}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            design.designTypeId
                              ? "Chọn loại chất liệu..."
                              : "Chọn loại thiết kế trước"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingMaterialsByTypeMap[design.designTypeId] ? (
                          <SelectItem value="loading" disabled>
                            Đang tải...
                          </SelectItem>
                        ) : (
                          (materialsByTypeMap[design.designTypeId] ?? []).map((material: MaterialType) => (
                            <SelectItem key={material.id} value={material.id.toString()}>
                              {material.name}
                              {material.description && (
                                <span className="text-sm text-muted-foreground ml-2">
                                  - {material.description}
                                </span>
                              )}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Tên thiết kế *</Label>
                    <Input
                      placeholder="VD: Mẫu bìa túi phân bón kali"
                      value={design.designName}
                      onChange={(e) => updateDesign(design.id, 'designName', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Kích thước *</Label>
                    <Input
                      placeholder="VD: 280x153mm"
                      value={design.dimensions}
                      onChange={(e) => updateDesign(design.id, 'dimensions', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Chiều rộng (mm) *</Label>
                    <Input
                      type="number"
                      placeholder="Chiều rộng"
                      value={design.width}
                      onChange={(e) => updateDesign(design.id, 'width', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Chiều cao (mm) *</Label>
                    <Input
                      type="number"
                      placeholder="Chiều cao"
                      value={design.height}
                      onChange={(e) => updateDesign(design.id, 'height', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Số lượng *</Label>
                    <Input
                      type="number"
                      placeholder="Số lượng"
                      value={design.quantity}
                      onChange={(e) => updateDesign(design.id, 'quantity', e.target.value)}
                    />
                  </div>
                  
                  {/* Mã thiết kế gợi ý */}
                  {design.designTypeId && (
                    <div className="space-y-2">
                      <Label>Mã thiết kế (gợi ý)</Label>
                      <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-md">
                        <span className="text-amber-800 font-mono text-sm">
                          {generateDesignCodePreview(design.designTypeId, design.id)}
                        </span>
                        <p className="text-xs text-amber-600 mt-1">
                          Mã thiết kế sẽ được tạo tự động khi lưu đơn hàng
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="lg:col-span-3 space-y-2">
                    <Label>Yêu cầu thiết kế *</Label>
                    <Textarea
                      placeholder="Mô tả chi tiết yêu cầu thiết kế (màu sắc, kiểu dáng, nội dung, chất liệu...)"
                      value={design.requirements}
                      onChange={(e) => updateDesign(design.id, 'requirements', e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                
                {/* Ghi chú thiết kế */}
                <div className="mt-4 space-y-2">
                  <Label>Ghi chú thêm</Label>
                  <Textarea
                    placeholder="Ghi chú bổ sung cho thiết kế này..."
                    value={design.notes}
                    onChange={(e) => updateDesign(design.id, 'notes', e.target.value)}
                    rows={2}
                  />
                </div>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" size="sm" onClick={() => navigate('/orders')}>
            Hủy
          </Button>
          <Button type="submit" className="gap-2" size="sm">
            <Save className="h-4 w-4" />
            Tạo yêu cầu thiết kế
          </Button>
        </div>
      </form>

      {/* Create Customer Dialog */}
      <Dialog open={showCreateCustomerDialog} onOpenChange={setShowCreateCustomerDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg">Thêm khách hàng mới</DialogTitle>
            <DialogDescription className="text-sm">
              Điền thông tin khách hàng mới để thêm vào hệ thống
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-sm">Tên công ty *</Label>
              <Input
                id="companyName"
                placeholder="Nhập tên công ty"
                value={newCustomerData.companyName}
                onChange={(e) => setNewCustomerData(prev => ({ ...prev, companyName: e.target.value }))}
                className="h-9"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="representativeName" className="text-sm">Người đại diện *</Label>
              <Input
                id="representativeName"
                placeholder="Nhập tên người đại diện"
                value={newCustomerData.representativeName}
                onChange={(e) => setNewCustomerData(prev => ({ ...prev, representativeName: e.target.value }))}
                className="h-9"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm">Số điện thoại *</Label>
              <Input
                id="phone"
                placeholder="Nhập số điện thoại"
                value={newCustomerData.phone}
                onChange={(e) => setNewCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                className="h-9"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm">Địa chỉ</Label>
              <Textarea
                id="address"
                placeholder="Nhập địa chỉ"
                value={newCustomerData.address}
                onChange={(e) => setNewCustomerData(prev => ({ ...prev, address: e.target.value }))}
                rows={2}
                className="text-sm"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="taxCode" className="text-sm">Mã số thuế</Label>
                <Input
                  id="taxCode"
                  placeholder="Nhập mã số thuế"
                  value={newCustomerData.taxCode}
                  onChange={(e) => setNewCustomerData(prev => ({ ...prev, taxCode: e.target.value }))}
                  className="h-9"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxDebt" className="text-sm">Hạn mức công nợ (VNĐ)</Label>
                <Input
                  id="maxDebt"
                  type="number"
                  placeholder="10,000,000"
                  value={newCustomerData.maxDebt}
                  onChange={(e) => setNewCustomerData(prev => ({ ...prev, maxDebt: e.target.value }))}
                  className="h-9"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => setShowCreateCustomerDialog(false)}
            >
              Hủy
            </Button>
            <Button onClick={handleCreateCustomer} size="sm">
              Tạo khách hàng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
