import { useState, useEffect } from 'react';
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
import { ArrowLeft, Save, User, Package, Calendar, DollarSign, AlertTriangle, Search, Plus, Trash2, Check, ChevronsUpDown } from 'lucide-react';
import { mockCustomers } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { checkDebtStatus, formatCurrency } from '@/lib/utils';
import { designTypesService } from '@/lib/mockData';

export default function CreateOrder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [showCreateCustomerDialog, setShowCreateCustomerDialog] = useState(false);
  const [customerComboOpen, setCustomerComboOpen] = useState(false);
  const [designTypes, setDesignTypes] = useState<{ code: string; name: string; description?: string }[]>([]);
  const [loadingDesignTypes, setLoadingDesignTypes] = useState(true);
  
  const [formData, setFormData] = useState({
    customerId: '',
    notes: '',
  });

  const [selectedCustomer, setSelectedCustomer] = useState<typeof mockCustomers[0] | null>(null);
  
  // Multi-design support cho giai đoạn thiết kế
  const [designs, setDesigns] = useState([
    {
      id: '1',
      designCode: '',
      designType: '',
      designName: '',
      dimensions: '',
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

  // Load design types on mount
  useEffect(() => {
    const loadDesignTypes = async () => {
      try {
        setLoadingDesignTypes(true);
        const activeDesignTypes = await designTypesService.getActive();
        setDesignTypes(activeDesignTypes.map(dt => ({
          code: dt.code,
          name: dt.name,
          description: dt.description
        })));
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách loại thiết kế",
          variant: "destructive",
        });
      } finally {
        setLoadingDesignTypes(false);
      }
    };
    
    loadDesignTypes();
  }, [toast]);

  const handleCustomerSelect = (customerId: string) => {
    const customer = mockCustomers.find(c => c.id === customerId);
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
      designType: '',
      designName: '',
      dimensions: '',
      quantity: '',
      requirements: '',
      notes: ''
    }]);
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
        
        // Tự động sinh mã thiết kế khi có đủ thông tin
        if (selectedCustomer && updatedDesign.designType && updatedDesign.designName) {
          updatedDesign.designCode = generateDesignCode(
            selectedCustomer.code, 
            updatedDesign.designType, 
            updatedDesign.id
          );
        }
        
        return updatedDesign;
      }
      return design;
    }));
  };

  // Tự động sinh mã thiết kế theo format từ Design Type service
  const generateDesignCode = (customerCode: string, designType: string, designId: string) => {
    try {
      const designNumber = parseInt(designId) || 1;
      return designTypesService.generateDesignCode(designType, customerCode, designNumber);
    } catch (error) {
      // Fallback to simple format if service fails
      const today = new Date();
      const dateStr = today.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
      const designNumber = designId.padStart(3, '0');
      return `${customerCode}-${designType}-${designNumber}-${dateStr}`;
    }
  };

  // Tạo mã thiết kế gợi ý cho người dùng (chưa submit)
  const generateDesignCodePreview = (designType: string, designId: string) => {
    if (!designType) return '';
    // Chỉ hiển thị loại thiết kế + xxx (VD: Hxxx, Txxx)
    return `${designType}xxx`;
  };

  // Validate thiết kế cho giai đoạn thiết kế (không cần giá)
  const validateDesigns = () => {
    return designs.filter(design => 
      design.designType && 
      design.designName.trim() && 
      design.dimensions.trim() && 
      design.quantity && 
      parseInt(design.quantity) > 0 &&
      design.requirements.trim()
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

    // Generate customer code
    const customerCode = `${String(mockCustomers.length + 1).padStart(4, '0')}${newCustomerData.representativeName.split(' ').pop()?.substring(0, 2).toUpperCase()}`;
    
    // In real app, this would be an API call
    console.log('Creating customer:', { 
      ...newCustomerData, 
      code: customerCode,
      maxDebt: parseFloat(newCustomerData.maxDebt)
    });

    toast({
      title: "Thành công",
      description: "Đã tạo khách hàng mới thành công",
    });

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
      // Generate order number
      const orderNumber = `DH${String(Date.now()).slice(-3).padStart(3, '0')}`;
      const today = new Date().toISOString().split('T')[0];

      // Tạo design data với mã thiết kế
      const designsWithCode = validDesigns.map(design => ({
        ...design,
        designCode: generateDesignCode(selectedCustomer.code, design.designType, design.id),
        quantity: parseInt(design.quantity),
        createdDate: today
      }));

      // Order data cho giai đoạn thiết kế (chỉ gửi thông tin cần thiết)
      const orderData = {
        orderNumber,
        customerId: formData.customerId, // ID khách hàng
        customerCode: selectedCustomer.code, // Mã khách hàng
        designs: designsWithCode,
        notes: formData.notes,
        status: 'new', // Đơn hàng mới tạo
        designStatus: 'pending', // Chờ thiết kế
        createdAt: today,
        createdBy: 'Lê Văn Thiết kế' // Thay bằng user thực tế
      };

      console.log('Creating design order:', orderData);

      toast({
        title: "Thành công",
        description: `Đơn hàng ${orderNumber} với ${validDesigns.length} yêu cầu thiết kế đã được tạo thành công`,
      });

      navigate('/orders');
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi tạo đơn hàng",
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
            <p className="text-sm text-muted-foreground mt-1">Nhập thông tin khách hàng và yêu cầu thiết kế</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer Information - Full Width */}
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
                        <CommandEmpty>Không tìm thấy khách hàng nào.</CommandEmpty>
                        <CommandGroup>
                          {mockCustomers.map((customer) => (
                            <CommandItem
                              key={customer.id}
                              value={`${customer.companyName || customer.representativeName} ${customer.code} ${customer.phone}`}
                              onSelect={() => {
                                handleCustomerSelect(customer.id);
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

              {/* Mã khách hàng - hiển thị mặc định */}
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
                      value={design.designType} 
                      onValueChange={(value) => updateDesign(design.id, 'designType', value)}
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
                            <SelectItem key={config.code} value={config.code}>
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
                    <Label>Số lượng *</Label>
                    <Input
                      type="number"
                      placeholder="Số lượng"
                      value={design.quantity}
                      onChange={(e) => updateDesign(design.id, 'quantity', e.target.value)}
                    />
                  </div>
                  
                  {/* Hiển thị mã thiết kế gợi ý cho người dùng */}
                  {design.designType && (
                    <div className="space-y-2">
                      <Label>Mã thiết kế (gợi ý)</Label>
                      <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-md">
                        <span className="text-amber-800 font-mono text-sm">
                          {generateDesignCodePreview(design.designType, design.id)}
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