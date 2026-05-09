import React, { useState, useEffect, useCallback } from 'react';
import { Material, MaterialType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { TruncatedText } from '@/components/ui/truncated-text';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertTriangle,
  Package,
  Download,
  Upload,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

// TODO: MaterialService needs to be implemented
// Temporary stub for MaterialService
const MaterialService = {
  getMaterials: async (params: any) => Promise.resolve({ data: [], totalPages: 1, total: 0 }),
  getSuppliers: async () => Promise.resolve([]),
  getCategoriesByType: async () => Promise.resolve([]),
  createMaterial: async (data: any) => Promise.resolve(data),
  updateMaterial: async (id: string, data: any) => Promise.resolve(data),
  deleteMaterial: async (id: string) => Promise.resolve(),
  updateStock: async (id: string, stock: number, reason: string) => Promise.resolve(),
};

// Material type options
const MATERIAL_TYPE_OPTIONS: Array<{ value: MaterialType; label: string }> = [
  { value: 'paper', label: 'Giấy' },
  { value: 'plastic', label: 'Nhựa' },
  { value: 'ink', label: 'Mực in' },
  { value: 'coating', label: 'Phủ bóng' },
  { value: 'foil', label: 'Giấy bạc/Foil' },
  { value: 'glue', label: 'Keo dán' },
  { value: 'hardware', label: 'Phụ kiện' },
  { value: 'packaging', label: 'Bao bì' },
  { value: 'ribbon', label: 'Dây/Ruy băng' }
];

// Material form data type
type MaterialFormData = Partial<Material>;

// TODO: Update initial form data to match CreateMaterial schema structure
const initialFormData = {
  code: '',
  name: '',
  category: 'paper' as const, // Use enum value
  unit: 'sheet' as const, // Use enum value
  pricing: {
    unitPrice: 0,
    currency: 'VND' as const
  },
  suppliers: [],
  inventory: {
    currentStock: 0,
    minimumThreshold: 0,
    location: ''
  },
  specifications: [],
  isActive: true,
  tags: [],
  notes: ''
};

export default function MaterialManagement() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<MaterialType | 'all'>('all');
  const [showLowStock, setShowLowStock] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<MaterialFormData>(initialFormData);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMaterials, setTotalMaterials] = useState(0);
  
  const pageSize = 10;

  // Load data
  // Load data
  const loadMaterials = useCallback(async () => {
    try {
      setLoading(true);
      const response = await MaterialService.getMaterials({
        page,
        pageSize,
        filters: {
          searchQuery: searchQuery || undefined,
          type: selectedType !== 'all' ? selectedType : undefined,
          lowStock: showLowStock || undefined
        },
        sortBy: 'currentStock',
        sortOrder: 'asc'
      });
      
      setMaterials(response.data);
      setTotalPages(response.totalPages);
      setTotalMaterials(response.total);
    } catch (error) {
      console.error('Error loading materials:', error);
      toast.error('Lỗi', {
        description: 'Không thể tải dữ liệu chất liệu',
      });
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, selectedType, showLowStock, pageSize]);

  useEffect(() => {
    loadMaterials();
    loadSuppliers();
    loadCategories();
  }, [page, searchQuery, selectedType, showLowStock, loadMaterials]);

  const loadSuppliers = async () => {
    try {
      const data = await MaterialService.getSuppliers();
      setSuppliers(data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await MaterialService.getCategoriesByType();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code.trim() || !formData.name.trim() || !formData.type) {
      toast.error('Lỗi', {
        description: 'Vui lòng điền đầy đủ thông tin bắt buộc',
      });
      return;
    }

    try {
      const materialData = {
        ...formData,
        type: formData.type as MaterialType
      };

      if (isEditing && editingId) {
        await MaterialService.updateMaterial(editingId, materialData);
        toast.success('Thành công', {
          description: 'Cập nhật chất liệu thành công',
        });
      } else {
        await MaterialService.createMaterial(materialData);
        toast.success('Thành công', {
          description: 'Tạo chất liệu thành công',
        });
      }
      
      await loadMaterials();
      await loadSuppliers();
      await loadCategories();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving material:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể lưu chất liệu';
      toast.error('Lỗi', {
        description: errorMessage,
      });
    }
  };

  // Handle edit
  const handleEdit = (material: Material) => {
    setIsEditing(true);
    setEditingId(material.id);
    setFormData({
      code: material.code,
      name: material.name,
      type: material.type,
      category: material.category,
      specification: material.specification,
      unit: material.unit,
      unitPrice: material.unitPrice,
      supplier: material.supplier,
      minStock: material.minStock,
      currentStock: material.currentStock,
      location: material.location,
      notes: material.notes || ''
    });
    setIsDialogOpen(true);
  };

  // Handle delete
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa chất liệu "${name}"?`)) {
      return;
    }

    try {
      await MaterialService.deleteMaterial(id);
      toast.success('Thành công', {
        description: 'Xóa chất liệu thành công',
      });
      await loadMaterials();
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error('Lỗi', {
        description: 'Không thể xóa chất liệu',
      });
    }
  };

  // Handle stock update
  const handleStockUpdate = async (id: string, newStock: number, reason: string) => {
    try {
      await MaterialService.updateStock(id, newStock, reason);
      toast.success('Thành công', {
        description: 'Cập nhật tồn kho thành công',
      });
      await loadMaterials();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Lỗi', {
        description: 'Không thể cập nhật tồn kho',
      });
    }
  };

  // Handle close dialog
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setIsEditing(false);
    setEditingId(null);
    setFormData(initialFormData);
  };

  // Handle add new
  const handleAddNew = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  // Calculate stock status
  const getStockStatus = (material: Material) => {
    if (material.currentStock <= 0) return { status: 'out', label: 'Hết hàng', color: 'destructive' };
    if (material.currentStock <= material.minStock) return { status: 'low', label: 'Sắp hết', color: 'destructive' };
    if (material.currentStock <= material.minStock * 1.5) return { status: 'warning', label: 'Cảnh báo', color: 'default' };
    return { status: 'good', label: 'Đủ hàng', color: 'secondary' };
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  // Handle filter change
  const handleFilterChange = (type: MaterialType | 'all') => {
    setSelectedType(type);
    setPage(1);
  };

  // Handle low stock filter
  const handleLowStockFilter = (show: boolean) => {
    setShowLowStock(show);
    setPage(1);
  };

  if (loading && materials.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>📦 Quản lý Chất liệu</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleAddNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm chất liệu
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {isEditing ? 'Chỉnh sửa chất liệu' : 'Thêm chất liệu mới'}
                    </DialogTitle>
                    <DialogDescription>
                      Điền thông tin để {isEditing ? 'cập nhật' : 'tạo'} chất liệu
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="code">Mã chất liệu *</Label>
                        <Input
                          id="code"
                          value={formData.code}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                          placeholder="VD: P-DUPLEX-250"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="name">Tên chất liệu *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="VD: Giấy Duplex 250gsm"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="type">Loại chất liệu *</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value) => setFormData({ ...formData, type: value as MaterialType })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn loại chất liệu" />
                          </SelectTrigger>
                          <SelectContent>
                            {MATERIAL_TYPE_OPTIONS.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="category">Phân loại</Label>
                        <Input
                          id="category"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          placeholder="VD: Giấy Duplex"
                          list="categories"
                        />
                        <datalist id="categories">
                          {categories.map(category => (
                            <option key={category} value={category} />
                          ))}
                        </datalist>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="specification">Thông số kỹ thuật</Label>
                        <Input
                          id="specification"
                          value={formData.specification}
                          onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
                          placeholder="VD: 250gsm, 70x100cm"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="unit">Đơn vị tính</Label>
                        <Input
                          id="unit"
                          value={formData.unit}
                          onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                          placeholder="VD: tờ, kg, m2"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="unitPrice">Đơn giá (VNĐ)</Label>
                        <Input
                          id="unitPrice"
                          type="number"
                          value={formData.unitPrice}
                          onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                          placeholder="0"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="supplier">Nhà cung cấp</Label>
                        <Input
                          id="supplier"
                          value={formData.supplier}
                          onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                          placeholder="Tên nhà cung cấp"
                          list="suppliers"
                        />
                        <datalist id="suppliers">
                          {suppliers.map(supplier => (
                            <option key={supplier} value={supplier} />
                          ))}
                        </datalist>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="minStock">Tồn kho tối thiểu</Label>
                        <Input
                          id="minStock"
                          type="number"
                          value={formData.minStock}
                          onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                          placeholder="0"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="currentStock">Tồn kho hiện tại</Label>
                        <Input
                          id="currentStock"
                          type="number"
                          value={formData.currentStock}
                          onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
                          placeholder="0"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="location">Vị trí kho</Label>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          placeholder="VD: Kho A-01"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="notes">Ghi chú</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Ghi chú thêm về chất liệu"
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={handleCloseDialog}>
                        Hủy
                      </Button>
                      <Button type="submit">
                        {isEditing ? 'Cập nhật' : 'Tạo mới'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm theo mã, tên, nhà cung cấp..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedType} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Lọc theo loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                {MATERIAL_TYPE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant={showLowStock ? "default" : "outline"}
              onClick={() => handleLowStockFilter(!showLowStock)}
              className="flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Sắp hết hàng
            </Button>
          </div>
          
          {/* Results summary */}
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Hiển thị {materials.length} / {totalMaterials} chất liệu
              {showLowStock && ' (chỉ hiển thị sắp hết hàng)'}
            </p>
          </div>
          
          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã chất liệu</TableHead>
                  <TableHead>Tên chất liệu</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Thông số</TableHead>
                  <TableHead>Đơn giá</TableHead>
                  <TableHead>Tồn kho</TableHead>
                  <TableHead>Nhà cung cấp</TableHead>
                  <TableHead>Vị trí</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((material) => {
                  const stockStatus = getStockStatus(material);
                  return (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">{material.code}</TableCell>
                      <TableCell>
                        <TruncatedText text={material.name} />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {MATERIAL_TYPE_OPTIONS.find(opt => opt.value === material.type)?.label || material.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <TruncatedText text={material.specification} maxWidth="20rem" />
                      </TableCell>
                      <TableCell>
                        {material.unitPrice.toLocaleString('vi-VN')} VNĐ/{material.unit}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span>{material.currentStock}/{material.minStock}</span>
                            <Badge 
                              variant={stockStatus.color as "default" | "secondary" | "destructive" | "outline"} 
                              className="text-xs"
                            >
                              {stockStatus.label}
                            </Badge>
                          </div>
                          {stockStatus.status === 'low' || stockStatus.status === 'out' ? (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <TruncatedText text={material.supplier} maxWidth="20rem" />
                      </TableCell>
                      <TableCell>{material.location}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(material)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(material.id, material.name)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            
            {materials.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Không tìm thấy chất liệu nào phù hợp
              </div>
            )}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Trước
              </Button>
              <span className="text-sm text-gray-600">
                Trang {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Sau
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}