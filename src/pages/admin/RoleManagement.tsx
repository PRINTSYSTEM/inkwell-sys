import React, { useState, useEffect } from 'react';
import {
  Shield,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Download,
  Upload,
  Users,
  Key,
  AlertTriangle,
  CheckCircle,
  Eye,
  Settings,
  RefreshCw,
  Archive,
  FileText,
  BarChart3
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';

import { Role, RoleTemplate, PermissionGroup, RoleFormData, RoleAnalytics } from '@/types/role';
import { Permission } from '@/types';
import { RoleManagementService } from '@/services/roleService';

// Role card component
const RoleCard: React.FC<{
  role: Role;
  onEdit: (role: Role) => void;
  onClone: (role: Role) => void;
  onDelete: (role: Role) => void;
  onViewUsers: (role: Role) => void;
}> = ({ role, onEdit, onClone, onDelete, onViewUsers }) => {
  const getRiskColor = (permissions: Permission[]) => {
    const hasHighRisk = permissions.some(p => 
      p.includes('delete') || p.includes('settings') || p === 'users.create'
    );
    if (hasHighRisk) return 'text-red-600 bg-red-50';
    if (permissions.length > 10) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  const getRiskLevel = (permissions: Permission[]) => {
    const hasHighRisk = permissions.some(p => 
      p.includes('delete') || p.includes('settings') || p === 'users.create'
    );
    if (hasHighRisk) return 'Cao';
    if (permissions.length > 10) return 'Trung bình';
    return 'Thấp';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle className="text-lg">{role.displayName}</CardTitle>
              <CardDescription className="text-sm">{role.description}</CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Hành động</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(role)}>
                <Edit className="h-4 w-4 mr-2" />
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onClone(role)}>
                <Copy className="h-4 w-4 mr-2" />
                Sao chép
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewUsers(role)}>
                <Users className="h-4 w-4 mr-2" />
                Xem người dùng
              </DropdownMenuItem>
              {!role.isSystem && (
                <DropdownMenuItem 
                  onClick={() => onDelete(role)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{role.userCount}</p>
              <p className="text-xs text-muted-foreground">Người dùng</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{role.permissions.length}</p>
              <p className="text-xs text-muted-foreground">Quyền</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge 
              variant={role.isActive ? 'default' : 'secondary'}
              className="text-xs"
            >
              {role.isActive ? 'Hoạt động' : 'Tạm dừng'}
            </Badge>
            {role.isSystem && (
              <Badge variant="outline" className="text-xs">
                Hệ thống
              </Badge>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Mức độ rủi ro:</span>
            <Badge variant="outline" className={`text-xs ${getRiskColor(role.permissions)}`}>
              {getRiskLevel(role.permissions)}
            </Badge>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Cập nhật:</span>
            <span className="text-xs">
              {new Date(role.updatedAt).toLocaleDateString('vi-VN')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Role form dialog component
const RoleFormDialog: React.FC<{
  role?: Role;
  isOpen: boolean;
  onClose: () => void;
  onSave: (roleData: RoleFormData) => void;
  permissionGroups: PermissionGroup[];
}> = ({ role, isOpen, onClose, onSave, permissionGroups }) => {
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    displayName: '',
    description: '',
    permissions: [],
    isActive: true
  });

  const [selectedPermissions, setSelectedPermissions] = useState<Set<Permission>>(new Set());

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        permissions: role.permissions,
        isActive: role.isActive
      });
      setSelectedPermissions(new Set(role.permissions));
    } else {
      setFormData({
        name: '',
        displayName: '',
        description: '',
        permissions: [],
        isActive: true
      });
      setSelectedPermissions(new Set());
    }
  }, [role, isOpen]);

  const handlePermissionToggle = (permission: Permission) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permission)) {
      newSelected.delete(permission);
    } else {
      newSelected.add(permission);
    }
    setSelectedPermissions(newSelected);
    setFormData({ ...formData, permissions: Array.from(newSelected) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleSelectAllInGroup = (groupPermissions: Permission[]) => {
    const newSelected = new Set(selectedPermissions);
    const allSelected = groupPermissions.every(p => newSelected.has(p));
    
    if (allSelected) {
      groupPermissions.forEach(p => newSelected.delete(p));
    } else {
      groupPermissions.forEach(p => newSelected.add(p));
    }
    
    setSelectedPermissions(newSelected);
    setFormData({ ...formData, permissions: Array.from(newSelected) });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {role ? 'Chỉnh sửa vai trò' : 'Tạo vai trò mới'}
          </DialogTitle>
          <DialogDescription>
            {role ? 'Cập nhật thông tin và quyền hạn của vai trò' : 'Tạo vai trò mới với các quyền hạn phù hợp'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="displayName">Tên hiển thị *</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => {
                  const displayName = e.target.value;
                  setFormData({ 
                    ...formData, 
                    displayName,
                    name: displayName.toLowerCase().replace(/\s+/g, '_')
                  });
                }}
                placeholder="Ví dụ: Quản lý thiết kế"
                required
              />
            </div>
            <div>
              <Label htmlFor="name">Tên hệ thống</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="design_manager"
                disabled={role?.isSystem}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả vai trò và trách nhiệm..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
            <Label htmlFor="isActive">Kích hoạt vai trò</Label>
          </div>

          <div>
            <Label className="text-base font-medium">Phân quyền</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Chọn các quyền hạn cho vai trò này
            </p>
            
            <Tabs defaultValue={permissionGroups[0]?.id} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                {permissionGroups.map((group) => (
                  <TabsTrigger key={group.id} value={group.id}>
                    {group.displayName}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {permissionGroups.map((group) => (
                <TabsContent key={group.id} value={group.id} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{group.displayName}</h4>
                      <p className="text-sm text-muted-foreground">{group.description}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectAllInGroup(group.permissions.map(p => p.id))}
                    >
                      {group.permissions.every(p => selectedPermissions.has(p.id)) 
                        ? 'Bỏ chọn tất cả' 
                        : 'Chọn tất cả'
                      }
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {group.permissions.map((permission) => (
                      <div key={permission.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          id={permission.id}
                          checked={selectedPermissions.has(permission.id)}
                          onCheckedChange={() => handlePermissionToggle(permission.id)}
                          disabled={role?.isSystem && permission.isSystem}
                        />
                        <div className="flex-1">
                          <Label htmlFor={permission.id} className="text-sm font-medium">
                            {permission.name}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {permission.description}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                permission.risk === 'high' ? 'text-red-600' :
                                permission.risk === 'medium' ? 'text-orange-600' :
                                'text-green-600'
                              }`}
                            >
                              {permission.risk === 'high' ? 'Cao' :
                               permission.risk === 'medium' ? 'TB' : 'Thấp'}
                            </Badge>
                            {permission.isSystem && (
                              <Badge variant="secondary" className="text-xs">
                                Hệ thống
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit">
              {role ? 'Cập nhật' : 'Tạo vai trò'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Template selection dialog
const TemplateSelectionDialog: React.FC<{
  templates: RoleTemplate[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: RoleTemplate) => void;
}> = ({ templates, isOpen, onClose, onSelect }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Chọn mẫu vai trò</DialogTitle>
          <DialogDescription>
            Chọn một mẫu vai trò có sẵn để tạo nhanh
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
          {templates.map((template) => (
            <Card 
              key={template.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onSelect(template)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{template.displayName}</CardTitle>
                  {template.isRecommended && (
                    <Badge variant="secondary" className="text-xs">
                      Khuyến nghị
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-sm">
                  {template.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {template.permissions.length} quyền
                  </span>
                  <Badge variant="outline" className="text-xs capitalize">
                    {template.category}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [templates, setTemplates] = useState<RoleTemplate[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const [analytics, setAnalytics] = useState<RoleAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // Dialog states
  const [roleFormOpen, setRoleFormOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rolesResponse, templatesData, permissionGroupsData, analyticsData] = await Promise.all([
        RoleManagementService.getRoles({ limit: 100 }),
        RoleManagementService.getRoleTemplates(),
        RoleManagementService.getPermissionGroups(),
        RoleManagementService.getRoleAnalytics()
      ]);

      setRoles(rolesResponse.roles);
      setTemplates(templatesData);
      setPermissionGroups(permissionGroupsData);
      setAnalytics(analyticsData);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu vai trò",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter roles
  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && role.isActive) ||
                         (statusFilter === 'inactive' && !role.isActive);
    
    return matchesSearch && matchesStatus;
  });

  // Handle create role
  const handleCreateRole = async (roleData: RoleFormData) => {
    try {
      await RoleManagementService.createRole(roleData);
      toast({
        title: "Thành công",
        description: "Tạo vai trò mới thành công",
      });
      setRoleFormOpen(false);
      loadData();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tạo vai trò",
        variant: "destructive",
      });
    }
  };

  // Handle update role
  const handleUpdateRole = async (roleData: RoleFormData) => {
    if (!editingRole) return;

    try {
      await RoleManagementService.updateRole(editingRole.id, roleData);
      toast({
        title: "Thành công",
        description: "Cập nhật vai trò thành công",
      });
      setRoleFormOpen(false);
      setEditingRole(null);
      loadData();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật vai trò",
        variant: "destructive",
      });
    }
  };

  // Handle delete role
  const handleDeleteRole = async (role: Role) => {
    try {
      await RoleManagementService.deleteRole(role.id);
      toast({
        title: "Thành công",
        description: "Xóa vai trò thành công",
      });
      loadData();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể xóa vai trò",
        variant: "destructive",
      });
    }
  };

  // Handle clone role
  const handleCloneRole = async (role: Role) => {
    try {
      const cloneName = `${role.displayName} (Copy)`;
      await RoleManagementService.cloneRole(role.id, cloneName);
      toast({
        title: "Thành công",
        description: "Sao chép vai trò thành công",
      });
      loadData();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể sao chép vai trò",
        variant: "destructive",
      });
    }
  };

  // Handle template selection
  const handleTemplateSelect = (template: RoleTemplate) => {
    setEditingRole(null);
    setTemplateDialogOpen(false);
    setRoleFormOpen(true);
    
    // Pre-fill form with template data
    setTimeout(() => {
      const formData: RoleFormData = {
        name: template.name,
        displayName: template.displayName,
        description: template.description,
        permissions: template.permissions,
        isActive: true
      };
      // This would be handled by the form dialog
    }, 100);
  };

  // Handle bulk operations
  const handleBulkStatusUpdate = async (status: boolean) => {
    if (selectedRoles.length === 0) return;

    try {
      await RoleManagementService.bulkUpdateRoles(selectedRoles, { isActive: status });
      toast({
        title: "Thành công",
        description: `Cập nhật trạng thái ${selectedRoles.length} vai trò`,
      });
      setSelectedRoles([]);
      loadData();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái",
        variant: "destructive",
      });
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      const blob = await RoleManagementService.exportRoles(
        selectedRoles.length > 0 ? selectedRoles : undefined
      );
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `roles-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Thành công",
        description: "Xuất dữ liệu vai trò thành công",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xuất dữ liệu",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý vai trò</h1>
          <p className="text-muted-foreground">
            Quản lý vai trò và phân quyền trong hệ thống
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Xuất dữ liệu
          </Button>
          <Button onClick={() => setTemplateDialogOpen(true)} variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Từ mẫu
          </Button>
          <Button onClick={() => {
            setEditingRole(null);
            setRoleFormOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo vai trò
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng vai trò</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.length}</div>
            <p className="text-xs text-muted-foreground">
              {roles.filter(r => r.isActive).length} đang hoạt động
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Người dùng</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {roles.reduce((sum, role) => sum + role.userCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Tổng người dùng được phân quyền
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quyền hạn</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {permissionGroups.reduce((sum, group) => sum + group.permissions.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Tổng quyền hạn có sẵn
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rủi ro cao</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.filter(a => a.riskLevel === 'high').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Vai trò có mức rủi ro cao
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center justify-between space-x-4">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Tìm kiếm vai trò..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="active">Hoạt động</SelectItem>
              <SelectItem value="inactive">Tạm dừng</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          {selectedRoles.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {selectedRoles.length} được chọn
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatusUpdate(true)}
              >
                Kích hoạt
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatusUpdate(false)}
              >
                Tạm dừng
              </Button>
            </div>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Hiển thị
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setViewMode('cards')}>
                <Eye className="h-4 w-4 mr-2" />
                Dạng thẻ
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode('table')}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Dạng bảng
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Role List */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              onEdit={(role) => {
                setEditingRole(role);
                setRoleFormOpen(true);
              }}
              onClone={handleCloneRole}
              onDelete={handleDeleteRole}
              onViewUsers={(role) => {
                // Navigate to user list filtered by role
                toast({
                  title: "Chức năng đang phát triển",
                  description: "Tính năng xem người dùng theo vai trò đang được phát triển",
                });
              }}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedRoles.length === filteredRoles.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedRoles(filteredRoles.map(r => r.id));
                        } else {
                          setSelectedRoles([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Quyền hạn</TableHead>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Cập nhật</TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRoles.includes(role.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedRoles([...selectedRoles, role.id]);
                          } else {
                            setSelectedRoles(selectedRoles.filter(id => id !== role.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <div>
                          <div className="font-medium">{role.displayName}</div>
                          {role.isSystem && (
                            <Badge variant="outline" className="text-xs">
                              Hệ thống
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate text-sm text-muted-foreground">
                        {role.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{role.permissions.length}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{role.userCount}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={role.isActive ? 'default' : 'secondary'}>
                        {role.isActive ? 'Hoạt động' : 'Tạm dừng'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(role.updatedAt).toLocaleDateString('vi-VN')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setEditingRole(role);
                            setRoleFormOpen(true);
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCloneRole(role)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Sao chép
                          </DropdownMenuItem>
                          {!role.isSystem && (
                            <DropdownMenuItem 
                              onClick={() => handleDeleteRole(role)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Xóa
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {filteredRoles.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Không tìm thấy vai trò</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Thử thay đổi bộ lọc hoặc tạo vai trò mới' 
                : 'Bắt đầu bằng cách tạo vai trò đầu tiên'
              }
            </p>
            <div className="space-x-2">
              <Button onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}>
                Xóa bộ lọc
              </Button>
              <Button onClick={() => setRoleFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tạo vai trò
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <RoleFormDialog
        role={editingRole}
        isOpen={roleFormOpen}
        onClose={() => {
          setRoleFormOpen(false);
          setEditingRole(null);
        }}
        onSave={editingRole ? handleUpdateRole : handleCreateRole}
        permissionGroups={permissionGroups}
      />

      <TemplateSelectionDialog
        templates={templates}
        isOpen={templateDialogOpen}
        onClose={() => setTemplateDialogOpen(false)}
        onSelect={handleTemplateSelect}
      />
    </div>
  );
};

export default RoleManagement;