// src/pages/admin-settings/MaterialHierarchyPage.tsx
import React, { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Settings,
  Database,
  Tag,
  Link as LinkIcon,
  HelpCircle,
  Check,
  X,
  FileSpreadsheet,
  Building2,
  Package,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { SimplePagination } from "@/components/ui/simple-pagination";
import { SearchableSelect } from "@/components/forms";

// Import hooks
import {
  useSupplierTypes,
  useCreateSupplierType,
  useUpdateSupplierType,
  useDeleteSupplierType,
} from "@/hooks/use-supplier-type";
import {
  useMaterialFamilies,
  useCreateMaterialFamily,
  useUpdateMaterialFamily,
  useDeleteMaterialFamily,
} from "@/hooks/use-material-family";
import { useUnitOfMeasures } from "@/hooks/use-unit-of-measure";
import {
  useMaterialTypeList,
  useCreateMaterialType,
  useUpdateMaterialType,
  useDeleteMaterialType,
} from "@/hooks/use-material-type";
import {
  useSpecTemplates,
  useCreateSpecTemplate,
  useUpdateSpecTemplate,
  useDeleteSpecTemplate,
} from "@/hooks/use-spec-template";
import {
  useSpecValues,
  useCreateSpecValue,
  useUpdateSpecValue,
  useDeleteSpecValue,
} from "@/hooks/use-spec-value";
import {
  useSupplierCatalogs,
  useCreateSupplierCatalog,
  useDeleteSupplierCatalog,
} from "@/hooks/use-supplier-catalog";
import { useVendors, useCreateVendor, useUpdateVendor, useDeleteVendor } from "@/hooks/use-vendor";
import { useMaterials, useDeleteMaterial } from "@/hooks/use-material";
import { CreateMaterialDialog } from "../stock/components/CreateMaterialDialog";
import { useConstants } from "@/hooks/use-constants";
import { getVendorTypeLabel } from "@/lib/status-utils";



export default function MaterialHierarchyPage() {
  const [activeTab, setActiveTab] = useState("supplier-types");

  return (
    <>
      <Helmet>
        <title>Cấu hình Phân cấp Vật tư | ERP</title>
      </Helmet>

      <div className="h-full flex flex-col space-y-4 p-6 bg-slate-50/50 min-h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between shrink-0 gap-3 border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
              <Layers className="h-6 w-6 text-indigo-600" />
              Cấu hình Phân cấp Vật tư (8 Tầng)
            </h1>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col space-y-4">
          <TabsList className="bg-white border border-slate-200 p-1 w-full justify-start overflow-x-auto flex h-auto md:w-max">
            <TabsTrigger value="supplier-types" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
              Loại nhà cung cấp (T1)
            </TabsTrigger>
            <TabsTrigger value="vendors" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
              Nhà cung cấp (T2)
            </TabsTrigger>
            <TabsTrigger value="material-families" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
              Nhóm vật tư (T3)
            </TabsTrigger>
            <TabsTrigger value="material-templates" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
              Định mức chất liệu (T4)
            </TabsTrigger>
            <TabsTrigger value="spec-templates" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
              Thuộc tính (T5)
            </TabsTrigger>
            <TabsTrigger value="spec-values" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
              Từ điển thông số (T6)
            </TabsTrigger>
            <TabsTrigger value="supplier-catalogs" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
              Danh mục NCC (T7)
            </TabsTrigger>
            <TabsTrigger value="materials" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
              Vật tư SKU (T8)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="supplier-types" className="flex-1 mt-0 outline-none">
            <SupplierTypesTab />
          </TabsContent>

          <TabsContent value="vendors" className="flex-1 mt-0 outline-none">
            <VendorsTab />
          </TabsContent>

          <TabsContent value="material-families" className="flex-1 mt-0 outline-none">
            <MaterialFamiliesTab />
          </TabsContent>

          <TabsContent value="material-templates" className="flex-1 mt-0 outline-none">
            <MaterialTemplatesTab />
          </TabsContent>

          <TabsContent value="spec-templates" className="flex-1 mt-0 outline-none">
            <SpecTemplatesTab />
          </TabsContent>

          <TabsContent value="spec-values" className="flex-1 mt-0 outline-none">
            <SpecValuesTab />
          </TabsContent>

          <TabsContent value="supplier-catalogs" className="flex-1 mt-0 outline-none">
            <SupplierCatalogsTab />
          </TabsContent>

          <TabsContent value="materials" className="flex-1 mt-0 outline-none">
            <MaterialsTab />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

// ==========================================
// TAB 1: SUPPLIER TYPES
// ==========================================
function SupplierTypesTab() {
  const [page, setPage] = useState(1);
  const { data: resp, isLoading, refetch } = useSupplierTypes({ page, size: 10 });
  const createMutation = useCreateSupplierType();
  const updateMutation = useUpdateSupplierType();
  const deleteMutation = useDeleteSupplierType();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  const items = resp?.items || [];

  const handleOpen = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setCode(item.code || "");
      setName(item.name || "");
    } else {
      setEditingId(null);
      setCode("");
      setName("");
    }
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!code || !name) {
      toast.error("Vui lòng điền đầy đủ Mã và Tên");
      return;
    }
    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          data: { code, name },
        });
      } else {
        await createMutation.mutateAsync({ code, name });
      }
      setIsOpen(false);
      refetch();
    } catch (e) { /* ignore */ }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Bạn có chắc muốn xóa loại nhà cung cấp này?")) {
      try {
        await deleteMutation.mutateAsync(id);
        refetch();
      } catch (e) { /* ignore */ }
    }
  };

  return (
    <Card className="shadow-sm border border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-slate-100">
        <div>
          <CardTitle className="text-lg">Loại nhà cung cấp (Supplier Types)</CardTitle>
        </div>
        <Button size="sm" onClick={() => handleOpen()} className="bg-indigo-600 hover:bg-indigo-700 gap-1.5 rounded-lg">
          <Plus className="h-4 w-4" /> Thêm loại
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-6 text-center text-slate-500">Đang tải...</div>
        ) : (
          <div className="border border-slate-100 rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Mã định danh</TableHead>
                  <TableHead>Tên loại nhà cung cấp</TableHead>
                  <TableHead className="w-24 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6 text-slate-400">
                      Không có loại nhà cung cấp nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell><Badge variant="secondary" className="font-mono text-[11px]">{item.code}</Badge></TableCell>
                      <TableCell className="font-semibold text-slate-700">{item.description || item.name || item.code || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button variant="ghost" size="icon" onClick={() => handleOpen(item)} className="h-8 w-8 hover:text-indigo-600">
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 hover:text-rose-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
        {!isLoading && items.length > 0 && (
          <SimplePagination
            currentPage={page}
            totalPages={resp?.totalPages || 1}
            totalItems={resp?.total || 0}
            itemsPerPage={10}
            onPageChange={setPage}
            itemType="loại nhà cung cấp"
          />
        )}
      </CardContent>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Sửa loại nhà cung cấp" : "Thêm loại nhà cung cấp mới"}</DialogTitle>
            <DialogDescription>Nhập thông tin loại nhà cung cấp để phân loại đối tác.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label htmlFor="code">Mã loại (VD: paper, film, ink)</Label>
              <Input id="code" value={code} onChange={(e) => setCode(e.target.value.toLowerCase())} placeholder="Nhập mã..." disabled={!!editingId} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Tên hiển thị (VD: Nhà cung cấp Giấy)</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nhập tên..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">Lưu lại</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ==========================================
// TAB 2: MATERIAL FAMILIES
// ==========================================
function MaterialFamiliesTab() {
  const [page, setPage] = useState(1);
  const { data: resp, isLoading, refetch } = useMaterialFamilies({ page, size: 10 });
  const createMutation = useCreateMaterialFamily();
  const updateMutation = useUpdateMaterialFamily();
  const deleteMutation = useDeleteMaterialFamily();
  const { data: constants } = useConstants();
  const { data: uoms } = useUnitOfMeasures();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [allowedUnits, setAllowedUnits] = useState("sheet,ram");
  const [defaultUnitId, setDefaultUnitId] = useState<number | undefined>(undefined);
  const [allowCutting, setAllowCutting] = useState(false);
  const [allowRollConversion, setAllowRollConversion] = useState(false);
  const [allowImposition, setAllowImposition] = useState(false);
  const [trackInventory, setTrackInventory] = useState(true);
  const [allowPurchase, setAllowPurchase] = useState(true);
  const [allowIssue, setAllowIssue] = useState(true);
  const [allowStockAdjustment, setAllowStockAdjustment] = useState(true);
  const [allowTransfer, setAllowTransfer] = useState(true);
  const [allowReturn, setAllowReturn] = useState(true);
  const [displayOrder, setDisplayOrder] = useState<number>(0);

  const items = resp?.items || [];
  const unitOptions = (constants?.materialUnits?.values || {}) as Record<string, string>;

  const unitsList = useMemo(() => {
    if (uoms && uoms.length > 0) {
      return uoms.map((u) => ({ id: u.id, label: u.name }));
    }
    // Fallback static map to keep dev environment working when API is not deployed
    const fallbackMap: Record<string, number> = {
      "tờ": 1,
      "cuộn": 2,
      "kg": 3,
      "hộp": 4,
      "cái": 5,
      "gói": 6,
      "chai": 7,
      "lon": 8,
      "mét": 9,
      "ram": 10
    };
    return Object.entries(unitOptions).map(([key, label]) => ({
      id: fallbackMap[key.toLowerCase()] || 1,
      label: String(label)
    }));
  }, [uoms, unitOptions]);

  const handleOpen = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setCode(item.code || "");
      setName(item.name || "");
      setAllowedUnits(Array.isArray(item.allowedUnits) ? item.allowedUnits.join(",") : item.allowedUnits || "sheet,ram");
      setDefaultUnitId(item.defaultUnitId);
      setAllowCutting(item.allowCutting ?? false);
      setAllowRollConversion(item.allowRollConversion ?? false);
      setAllowImposition(item.allowImposition ?? false);
      setTrackInventory(item.trackInventory ?? true);
      setAllowPurchase(item.allowPurchase ?? true);
      setAllowIssue(item.allowIssue ?? true);
      setAllowStockAdjustment(item.allowStockAdjustment ?? true);
      setAllowTransfer(item.allowTransfer ?? true);
      setAllowReturn(item.allowReturn ?? true);
      setDisplayOrder(item.displayOrder || 0);
    } else {
      setEditingId(null);
      setCode("");
      setName("");
      setAllowedUnits("sheet,ram");
      setDefaultUnitId(undefined); // don't select anything by default
      setAllowCutting(false);
      setAllowRollConversion(false);
      setAllowImposition(false);
      setTrackInventory(true);
      setAllowPurchase(true);
      setAllowIssue(true);
      setAllowStockAdjustment(true);
      setAllowTransfer(true);
      setAllowReturn(true);
      setDisplayOrder(0);
    }
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!code || !name) {
      toast.error("Vui lòng điền đầy đủ Mã và Tên");
      return;
    }
    if (!defaultUnitId) {
      toast.error("Vui lòng chọn Đơn vị mặc định");
      return;
    }
    const payload = {
      code,
      name,
      allowedUnits: allowedUnits.split(",").map((u) => u.trim()).filter(Boolean),
      defaultUnitId,
      allowCutting,
      allowRollConversion,
      allowImposition,
      trackInventory,
      allowPurchase,
      allowIssue,
      allowStockAdjustment,
      allowTransfer,
      allowReturn,
      displayOrder,
    };
    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          data: payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setIsOpen(false);
      refetch();
    } catch (e) { /* ignore */ }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Bạn có chắc muốn xóa nhóm vật tư này?")) {
      try {
        await deleteMutation.mutateAsync(id);
        refetch();
      } catch (e) { /* ignore */ }
    }
  };

  return (
    <Card className="shadow-sm border border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-slate-100">
        <div>
          <CardTitle className="text-lg">Nhóm vật tư (Material Families)</CardTitle>
        </div>
        <Button size="sm" onClick={() => handleOpen()} className="bg-indigo-600 hover:bg-indigo-700 gap-1.5 rounded-lg">
          <Plus className="h-4 w-4" /> Thêm nhóm
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-6 text-center text-slate-500">Đang tải...</div>
        ) : (
          <div className="border border-slate-100 rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Mã định danh</TableHead>
                  <TableHead>Tên nhóm vật tư</TableHead>
                  <TableHead>Đơn vị cho phép</TableHead>
                  <TableHead>Đơn vị mặc định</TableHead>
                  <TableHead>Cho phép cắt?</TableHead>
                  <TableHead className="w-24 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-slate-400">
                      Không có nhóm vật tư nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">{item.id}</TableCell>
                      <TableCell><Badge variant="secondary" className="font-mono text-[11px]">{item.code}</Badge></TableCell>
                      <TableCell className="font-semibold text-slate-700">{item.name}</TableCell>
                      <TableCell className="text-slate-500 font-mono text-xs">
                        {Array.isArray(item.allowedUnits) ? item.allowedUnits.join(", ") : item.allowedUnits || "—"}
                      </TableCell>
                      <TableCell className="text-slate-700 font-medium">
                        {item.defaultUnitName || `ID: ${item.defaultUnitId}`}
                      </TableCell>
                      <TableCell>
                        {item.allowCutting ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">Được phép cắt</Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-400 border-slate-200">Không cắt</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button variant="ghost" size="icon" onClick={() => handleOpen(item)} className="h-8 w-8 hover:text-indigo-600">
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 hover:text-rose-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
        {!isLoading && items.length > 0 && (
          <SimplePagination
            currentPage={page}
            totalPages={resp?.totalPages || 1}
            totalItems={resp?.total || 0}
            itemsPerPage={10}
            onPageChange={setPage}
            itemType="nhóm vật tư"
          />
        )}
      </CardContent>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Sửa nhóm vật tư" : "Thêm nhóm vật tư mới"}</DialogTitle>
            <DialogDescription>Nhập thông số cấu hình và phân quyền cho nhóm vật tư.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="code">Mã nhóm (VD: paper_sheet, paper_roll)</Label>
                <Input id="code" value={code} onChange={(e) => setCode(e.target.value.toLowerCase())} placeholder="Nhập mã..." disabled={!!editingId} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name">Tên nhóm (VD: Giấy Tờ)</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nhập tên..." />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="allowedUnits">Đơn vị đo lường cho phép</Label>
                <Input id="allowedUnits" value={allowedUnits} onChange={(e) => setAllowedUnits(e.target.value)} placeholder="sheet,ram" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="defaultUnit">Đơn vị mặc định</Label>
                <Select value={defaultUnitId ? String(defaultUnitId) : ""} onValueChange={(val) => setDefaultUnitId(val ? Number(val) : undefined)}>
                  <SelectTrigger id="defaultUnit" className="bg-white">
                    <SelectValue placeholder="Chọn đơn vị..." />
                  </SelectTrigger>
                  <SelectContent>
                    {unitsList.map((unit) => (
                      <SelectItem key={unit.id} value={String(unit.id)}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="displayOrder">Thứ tự hiển thị</Label>
              <Input id="displayOrder" type="number" value={displayOrder} onChange={(e) => setDisplayOrder(Number(e.target.value))} />
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-3">
              <Label className="text-slate-800 font-semibold block mb-1">Cấu hình Quy trình & Kho (Switches)</Label>
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex items-center justify-between p-1 bg-white rounded border border-slate-100">
                  <Label htmlFor="allowCutting" className="text-xs text-slate-700 cursor-pointer select-none">Cho phép cắt</Label>
                  <Switch id="allowCutting" checked={allowCutting} onCheckedChange={setAllowCutting} />
                </div>
                <div className="flex items-center justify-between p-1 bg-white rounded border border-slate-100">
                  <Label htmlFor="allowRollConversion" className="text-xs text-slate-700 cursor-pointer select-none">Cho phép xả cuộn</Label>
                  <Switch id="allowRollConversion" checked={allowRollConversion} onCheckedChange={setAllowRollConversion} />
                </div>
                <div className="flex items-center justify-between p-1 bg-white rounded border border-slate-100">
                  <Label htmlFor="allowImposition" className="text-xs text-slate-700 cursor-pointer select-none">Cho phép bình trang</Label>
                  <Switch id="allowImposition" checked={allowImposition} onCheckedChange={setAllowImposition} />
                </div>
                <div className="flex items-center justify-between p-1 bg-white rounded border border-slate-100">
                  <Label htmlFor="trackInventory" className="text-xs text-slate-700 cursor-pointer select-none">Theo dõi tồn kho</Label>
                  <Switch id="trackInventory" checked={trackInventory} onCheckedChange={setTrackInventory} />
                </div>
                <div className="flex items-center justify-between p-1 bg-white rounded border border-slate-100">
                  <Label htmlFor="allowPurchase" className="text-xs text-slate-700 cursor-pointer select-none">Cho phép mua</Label>
                  <Switch id="allowPurchase" checked={allowPurchase} onCheckedChange={setAllowPurchase} />
                </div>
                <div className="flex items-center justify-between p-1 bg-white rounded border border-slate-100">
                  <Label htmlFor="allowIssue" className="text-xs text-slate-700 cursor-pointer select-none">Cho phép xuất</Label>
                  <Switch id="allowIssue" checked={allowIssue} onCheckedChange={setAllowIssue} />
                </div>
                <div className="flex items-center justify-between p-1 bg-white rounded border border-slate-100">
                  <Label htmlFor="allowStockAdjustment" className="text-xs text-slate-700 cursor-pointer select-none">Cho phép điều chỉnh</Label>
                  <Switch id="allowStockAdjustment" checked={allowStockAdjustment} onCheckedChange={setAllowStockAdjustment} />
                </div>
                <div className="flex items-center justify-between p-1 bg-white rounded border border-slate-100">
                  <Label htmlFor="allowTransfer" className="text-xs text-slate-700 cursor-pointer select-none">Cho phép chuyển kho</Label>
                  <Switch id="allowTransfer" checked={allowTransfer} onCheckedChange={setAllowTransfer} />
                </div>
                <div className="flex items-center justify-between p-1 bg-white rounded border border-slate-100 col-span-2">
                  <Label htmlFor="allowReturn" className="text-xs text-slate-700 cursor-pointer select-none">Cho phép trả hàng</Label>
                  <Switch id="allowReturn" checked={allowReturn} onCheckedChange={setAllowReturn} />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">Lưu lại</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ==========================================
// TAB 3: MATERIAL TEMPLATES (MATERIAL TYPES)
// ==========================================
function MaterialTemplatesTab() {
  const [page, setPage] = useState(1);
  const { data: familiesResp } = useMaterialFamilies({ page: 1, size: 1000 });
  const { data: resp, isLoading, refetch } = useMaterialTypeList({ pageNumber: page, pageSize: 10 });
  const createMutation = useCreateMaterialType();
  const updateMutation = useUpdateMaterialType();
  const deleteMutation = useDeleteMaterialType();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [pricePerM2, setPricePerM2] = useState(0);
  const [materialFamilyId, setMaterialFamilyId] = useState<string>("none");
  const [status, setStatus] = useState("active");

  const items = resp?.items || [];
  const families = familiesResp?.items || [];

  const handleOpen = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setCode(item.code || "");
      setName(item.name || "");
      setPricePerM2(item.pricePerM2 || 0);
      setMaterialFamilyId(item.materialFamilyId?.toString() || "none");
      setStatus(item.status || "active");
    } else {
      setEditingId(null);
      setCode("");
      setName("");
      setPricePerM2(0);
      setMaterialFamilyId("none");
      setStatus("active");
    }
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!code || !name) {
      toast.error("Vui lòng điền đầy đủ Mã và Tên");
      return;
    }
    const familyIdNum = materialFamilyId === "none" ? undefined : Number(materialFamilyId);
    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          data: {
            name,
            pricePerM2,
            materialFamilyId: familyIdNum,
            status: status as "active" | "inactive",
          },
        });
      } else {
        await createMutation.mutateAsync({
          code,
          name,
          pricePerM2,
          materialFamilyId: familyIdNum,
          status: status as "active" | "inactive",
        });
      }
      setIsOpen(false);
      refetch();
    } catch (e) { /* ignore */ }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Bạn có chắc muốn xóa chất liệu này?")) {
      try {
        await deleteMutation.mutateAsync(id);
        refetch();
      } catch (e) { /* ignore */ }
    }
  };

  return (
    <Card className="shadow-sm border border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-slate-100">
        <div>
          <CardTitle className="text-lg">Định mức chất liệu (Material Templates)</CardTitle>
        </div>
        <Button size="sm" onClick={() => handleOpen()} className="bg-indigo-600 hover:bg-indigo-700 gap-1.5 rounded-lg">
          <Plus className="h-4 w-4" /> Thêm chất liệu
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-6 text-center text-slate-500">Đang tải...</div>
        ) : (
          <div className="border border-slate-100 rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Mã</TableHead>
                  <TableHead>Tên chất liệu (Template)</TableHead>
                  <TableHead>Nhóm vật tư (Family)</TableHead>
                  <TableHead className="text-right">Đơn giá định mức / m²</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-24 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-slate-400">
                      Không có chất liệu nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">{item.id}</TableCell>
                      <TableCell><Badge variant="secondary" className="font-mono text-[11px]">{item.code}</Badge></TableCell>
                      <TableCell className="font-semibold text-slate-700">{item.name}</TableCell>
                      <TableCell>
                        {item.materialFamilyName ? (
                          <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50/10">
                            {item.materialFamilyName}
                          </Badge>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-slate-600">
                        {item.pricePerM2 ? item.pricePerM2.toLocaleString("vi-VN") + " đ" : "0 đ"}
                      </TableCell>
                      <TableCell>
                        {item.status === "active" ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">Đang chạy</Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-400 border-slate-200">Tắt</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button variant="ghost" size="icon" onClick={() => handleOpen(item)} className="h-8 w-8 hover:text-indigo-600">
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 hover:text-rose-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
        {!isLoading && items.length > 0 && (
          <SimplePagination
            currentPage={page}
            totalPages={resp?.totalPages || 1}
            totalItems={resp?.total || 0}
            itemsPerPage={10}
            onPageChange={setPage}
            itemType="chất liệu"
          />
        )}
      </CardContent>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Sửa chất liệu" : "Thêm chất liệu mới"}</DialogTitle>
            <DialogDescription>Liên kết chất liệu với nhóm phân loại.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="code">Mã chất liệu</Label>
                <Input id="code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="VD: COUCHE" disabled={!!editingId} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="price">Giá / m² (đ)</Label>
                <Input id="price" type="number" value={pricePerM2} onChange={(e) => setPricePerM2(Number(e.target.value))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Tên chất liệu (Template)</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Giấy Couche" />
            </div>
            <div className="space-y-1.5 flex flex-col">
              <Label htmlFor="family">Thuộc nhóm vật tư (Family)</Label>
              <SearchableSelect
                value={materialFamilyId}
                onValueChange={setMaterialFamilyId}
                options={[
                  { value: "none", label: "Không liên kết" },
                  ...families.map((f: any) => ({
                    value: f.id.toString(),
                    label: f.name,
                  })),
                ]}
                placeholder="Chọn nhóm vật tư..."
                searchPlaceholder="Tìm nhóm vật tư..."
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Trạng thái hoạt động</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Hoạt động (Active)</SelectItem>
                  <SelectItem value="inactive">Tạm ngưng (Inactive)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">Lưu lại</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ==========================================
// TAB 4: SPECIFICATION TEMPLATES
// ==========================================
function SpecTemplatesTab() {
  const { data: familiesResp } = useMaterialFamilies({ page: 1, size: 1000 });
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>("all");

  const filterParams = selectedFamilyId === "all" ? {} : { familyId: Number(selectedFamilyId) };
  const { data: items, isLoading, refetch } = useSpecTemplates(filterParams);

  const createMutation = useCreateSpecTemplate();
  const updateMutation = useUpdateSpecTemplate();
  const deleteMutation = useDeleteSpecTemplate();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [materialFamilyId, setMaterialFamilyId] = useState("");
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [dataType, setDataType] = useState("string");
  const [isRequired, setIsRequired] = useState(false);

  const families = familiesResp?.items || [];

  const handleOpen = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setMaterialFamilyId(item.materialFamilyId?.toString() || "");
      setName(item.name || "");
      setKey(item.key || "");
      setDataType(item.dataType || "string");
      setIsRequired(item.isRequired || false);
    } else {
      setEditingId(null);
      setMaterialFamilyId(selectedFamilyId === "all" ? (families[0]?.id?.toString() || "") : selectedFamilyId);
      setName("");
      setKey("");
      setDataType("string");
      setIsRequired(false);
    }
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!materialFamilyId || !name || !key) {
      toast.error("Vui lòng nhập đầy đủ thông tin bắt buộc");
      return;
    }
    const payload = {
      materialFamilyId: Number(materialFamilyId),
      name,
      key,
      dataType,
      isRequired,
    };
    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          data: payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setIsOpen(false);
      refetch();
    } catch (e) { /* ignore */ }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Bạn có chắc muốn xóa thuộc tính này?")) {
      try {
        await deleteMutation.mutateAsync(id);
        refetch();
      } catch (e) { /* ignore */ }
    }
  };

  return (
    <Card className="shadow-sm border border-slate-200">
      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 border-b border-slate-100">
        <div>
          <CardTitle className="text-lg">Thuộc tính tùy biến (Specification Templates)</CardTitle>
        </div>
        <div className="flex items-center gap-3">
          <SearchableSelect
            value={selectedFamilyId}
            onValueChange={setSelectedFamilyId}
            options={[
              { value: "all", label: "Tất cả các nhóm" },
              ...families.map((f: any) => ({
                value: f.id.toString(),
                label: f.name,
              })),
            ]}
            placeholder="Lọc theo nhóm vật tư..."
            searchPlaceholder="Tìm nhóm vật tư..."
            className="w-56"
          />
          <Button size="sm" onClick={() => handleOpen()} className="bg-indigo-600 hover:bg-indigo-700 gap-1.5 rounded-lg whitespace-nowrap">
            <Plus className="h-4 w-4" /> Thêm thuộc tính
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-6 text-center text-slate-500">Đang tải...</div>
        ) : (
          <div className="border border-slate-100 rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Tên thuộc tính</TableHead>
                  <TableHead>Key định danh (Code)</TableHead>
                  <TableHead>Nhóm vật tư</TableHead>
                  <TableHead>Kiểu dữ liệu</TableHead>
                  <TableHead>Bắt buộc?</TableHead>
                  <TableHead className="w-24 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!items || items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-slate-400">
                      Không có cấu hình thuộc tính nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">{item.id}</TableCell>
                      <TableCell className="font-semibold text-slate-700">{item.name}</TableCell>
                      <TableCell><Badge variant="outline" className="font-mono text-xs bg-slate-50/50">{item.key}</Badge></TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50/10">
                          {item.materialFamilyName || `Nhóm #${item.materialFamilyId}`}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 font-mono text-xs">{item.dataType}</TableCell>
                      <TableCell>
                        {item.isRequired ? (
                          <Badge className="bg-rose-50 text-rose-700 border border-rose-200">Bắt buộc</Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-400 border-slate-200">Tùy chọn</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button variant="ghost" size="icon" onClick={() => handleOpen(item)} className="h-8 w-8 hover:text-indigo-600">
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 hover:text-rose-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Sửa cấu hình thuộc tính" : "Thêm cấu hình thuộc tính mới"}</DialogTitle>
            <DialogDescription>Quy định thuộc tính cho các SKU phát sinh của nhóm.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-1.5 flex flex-col">
              <Label htmlFor="familyId">Thuộc nhóm vật tư (Family) <span className="text-red-500">*</span></Label>
              <SearchableSelect
                value={materialFamilyId}
                onValueChange={setMaterialFamilyId}
                options={families.map((f: any) => ({
                  value: f.id.toString(),
                  label: f.name,
                }))}
                placeholder="Chọn nhóm..."
                searchPlaceholder="Tìm nhóm..."
                className="h-10"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="key">Key code (VD: gsm, color)</Label>
                <Input id="key" value={key} onChange={(e) => setKey(e.target.value.toLowerCase().replace(/\s+/g, ""))} placeholder="VD: finish" disabled={!!editingId} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dataType">Kiểu dữ liệu</Label>
                <Select value={dataType} onValueChange={setDataType}>
                  <SelectTrigger id="dataType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">Chữ tự do (String)</SelectItem>
                    <SelectItem value="number">Số (Number)</SelectItem>
                    <SelectItem value="boolean">Đúng / Sai (Boolean)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="specName">Tên hiển thị thuộc tính <span className="text-red-500">*</span></Label>
              <Input id="specName" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Độ bóng bề mặt" />
            </div>
            <div className="flex items-center justify-between border border-slate-100 rounded-lg p-3 bg-slate-50/50">
              <div className="space-y-0.5">
                <Label htmlFor="isRequired">Trường bắt buộc nhập</Label>
                <p className="text-xs text-muted-foreground">Phải nhập khi tạo vật tư SKU mới</p>
              </div>
              <Switch id="isRequired" checked={isRequired} onCheckedChange={setIsRequired} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">Lưu lại</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ==========================================
// TAB 5: SPEC VALUES (DICTIONARY)
// ==========================================
function SpecValuesTab() {
  const { data: familiesResp } = useMaterialFamilies({ page: 1, size: 1000 });
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>("none");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("all");

  const { data: specTemplates } = useSpecTemplates(
    selectedFamilyId !== "none" ? { familyId: Number(selectedFamilyId) } : {}
  );

  const filterParams = selectedTemplateId === "all" ? {} : { specTemplateId: Number(selectedTemplateId) };
  const { data: items, isLoading, refetch } = useSpecValues(filterParams);

  const createMutation = useCreateSpecValue();
  const updateMutation = useUpdateSpecValue();
  const deleteMutation = useDeleteSpecValue();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [specTemplateId, setSpecTemplateId] = useState("");
  const [value, setValue] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);

  const families = familiesResp?.items || [];
  const templates = specTemplates || [];

  const handleOpen = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setSpecTemplateId(item.specTemplateId?.toString() || "");
      setValue(item.value || "");
      setDisplayOrder(item.displayOrder || 0);
    } else {
      setEditingId(null);
      setSpecTemplateId(selectedTemplateId === "all" ? (templates[0]?.id?.toString() || "") : selectedTemplateId);
      setValue("");
      setDisplayOrder(0);
    }
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!specTemplateId || !value) {
      toast.error("Vui lòng điền giá trị");
      return;
    }
    const payload = {
      specTemplateId: Number(specTemplateId),
      value,
      displayOrder,
    };
    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          data: payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setIsOpen(false);
      refetch();
    } catch (e) { /* ignore */ }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Bạn có chắc muốn xóa giá trị này?")) {
      try {
        await deleteMutation.mutateAsync(id);
        refetch();
      } catch (e) { /* ignore */ }
    }
  };

  return (
    <Card className="shadow-sm border border-slate-200">
      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 border-b border-slate-100">
        <div>
          <CardTitle className="text-lg">Từ điển thông số (Value Dictionary)</CardTitle>
        </div>
        <div className="flex items-center gap-3">
          <SearchableSelect
            value={selectedFamilyId}
            onValueChange={(val) => {
              setSelectedFamilyId(val);
              setSelectedTemplateId("all");
            }}
            options={[
              { value: "none", label: "Tất cả các nhóm" },
              ...families.map((f: any) => ({
                value: f.id.toString(),
                label: f.name,
              })),
            ]}
            placeholder="Chọn nhóm vật tư..."
            searchPlaceholder="Tìm nhóm..."
            className="w-48"
          />

          <SearchableSelect
            value={selectedTemplateId}
            onValueChange={setSelectedTemplateId}
            options={[
              { value: "all", label: "Tất cả thuộc tính" },
              ...templates.map((t: any) => ({
                value: t.id.toString(),
                label: t.name,
              })),
            ]}
            placeholder="Lọc theo thuộc tính..."
            searchPlaceholder="Tìm thuộc tính..."
            disabled={templates.length === 0}
            className="w-48"
          />

          <Button size="sm" onClick={() => handleOpen()} className="bg-indigo-600 hover:bg-indigo-700 gap-1.5 rounded-lg whitespace-nowrap" disabled={templates.length === 0 && selectedTemplateId === "all"}>
            <Plus className="h-4 w-4" /> Thêm giá trị
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-6 text-center text-slate-500">Đang tải...</div>
        ) : (
          <div className="border border-slate-100 rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Thuộc tính tùy biến</TableHead>
                  <TableHead>Nhóm vật tư</TableHead>
                  <TableHead>Giá trị từ điển</TableHead>
                  <TableHead className="text-center w-28">Thứ tự hiển thị</TableHead>
                  <TableHead className="w-24 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!items || items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-slate-400">
                      Không tìm thấy giá trị từ điển nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">{item.id}</TableCell>
                      <TableCell className="font-semibold text-slate-700">{item.specTemplateName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50/10">
                          {item.materialFamilyName || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900 font-mono">{item.value}</TableCell>
                      <TableCell className="text-center font-mono text-slate-500">{item.displayOrder}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button variant="ghost" size="icon" onClick={() => handleOpen(item)} className="h-8 w-8 hover:text-indigo-600">
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 hover:text-rose-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Sửa giá trị từ điển" : "Thêm giá trị mới"}</DialogTitle>
            <DialogDescription>Gán giá trị hợp lệ cho thuộc tính tùy chọn.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-1.5 flex flex-col">
              <Label htmlFor="specTemplateId">Gán cho thuộc tính <span className="text-red-500">*</span></Label>
              <SearchableSelect
                value={specTemplateId}
                onValueChange={setSpecTemplateId}
                options={templates.map((t: any) => ({
                  value: t.id.toString(),
                  label: `${t.name} (${t.materialFamilyName})`,
                }))}
                placeholder="Chọn thuộc tính..."
                searchPlaceholder="Tìm thuộc tính..."
                className="h-10"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="specValue">Giá trị từ điển <span className="text-red-500">*</span></Label>
                <Input id="specValue" value={value} onChange={(e) => setValue(e.target.value)} placeholder="VD: 150 hoặc Gloss" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="order">Thứ tự hiển thị</Label>
                <Input id="order" type="number" value={displayOrder} onChange={(e) => setDisplayOrder(Number(e.target.value))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">Lưu lại</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ==========================================
// TAB 6: SUPPLIER CATALOGS (VENDOR MAPPING)
// ==========================================
function SupplierCatalogsTab() {
  const { data: vendorsData } = useVendors({ pageSize: 1000, isActive: true });
  const { data: templatesResp } = useMaterialTypeList({ pageSize: 1000 });
  const { data: specValuesData } = useSpecValues();

  const [selectedVendorId, setSelectedVendorId] = useState<string>("");

  const vendors = vendorsData?.items || [];
  const templates = templatesResp?.items || [];

  // Default selectedVendorId to the first vendor once loaded
  useEffect(() => {
    if (!selectedVendorId && vendors.length > 0) {
      setSelectedVendorId(vendors[0].id.toString());
    }
  }, [vendors, selectedVendorId]);

  const filterParams = selectedVendorId ? { vendorId: Number(selectedVendorId) } : { vendorId: 0 };
  const { data: items, isLoading, refetch } = useSupplierCatalogs(filterParams);

  const createMutation = useCreateSupplierCatalog();
  const deleteMutation = useDeleteSupplierCatalog();

  const [isOpen, setIsOpen] = useState(false);
  const [vendorId, setVendorId] = useState("");
  const [materialTypeId, setMaterialTypeId] = useState("");
  const [allowedSpecValueIds, setAllowedSpecValueIds] = useState<number[]>([]);

  // Fetch spec templates and values for selected material type's family
  const selectedTemplate = templates.find((t: any) => t.id === Number(materialTypeId));
  const familyId = selectedTemplate?.materialFamilyId;
  const { data: familySpecs } = useSpecTemplates(familyId ? { familyId } : undefined);

  const handleOpen = () => {
    setVendorId(selectedVendorId || (vendors[0]?.id?.toString() || ""));
    setMaterialTypeId(templates[0]?.id?.toString() || "");
    setAllowedSpecValueIds([]);
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!vendorId || !materialTypeId) {
      toast.error("Vui lòng chọn NCC và Chất liệu");
      return;
    }
    try {
      await createMutation.mutateAsync({
        vendorId: Number(vendorId),
        materialTypeId: Number(materialTypeId),
        allowedSpecValueIds,
      });
      setIsOpen(false);
      refetch();
    } catch (e) { /* ignore */ }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Bạn có chắc muốn gỡ chất liệu này khỏi danh mục của NCC?")) {
      try {
        await deleteMutation.mutateAsync(id);
        refetch();
      } catch (e) { /* ignore */ }
    }
  };

  const renderAllowedSpecs = (catalogItem: any) => {
    if (!catalogItem.allowedSpecValueIds || catalogItem.allowedSpecValueIds.length === 0) {
      return <span className="text-slate-400 font-normal">—</span>;
    }
    const linkedValues = specValuesData?.filter((v: any) => catalogItem.allowedSpecValueIds.includes(v.id)) || [];
    if (linkedValues.length === 0) return <span className="text-slate-400 font-normal">—</span>;

    const grouped: Record<string, string[]> = {};
    linkedValues.forEach((v) => {
      const name = v.specTemplateName || "Thuộc tính";
      if (!grouped[name]) grouped[name] = [];
      grouped[name].push(v.value);
    });

    return Object.entries(grouped).map(([specName, values]) => (
      <div key={specName} className="flex items-center gap-1.5 py-0.5">
        <span className="font-semibold text-slate-500">{specName}:</span>
        <span className="text-slate-700 font-medium">{values.join(", ")}</span>
      </div>
    ));
  };

  return (
    <Card className="shadow-sm border border-slate-200">
      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 border-b border-slate-100">
        <div>
          <CardTitle className="text-lg">Danh mục chất liệu nhà cung cấp (Supplier Catalog)</CardTitle>
        </div>
        <div className="flex items-center gap-3">
          <SearchableSelect
            value={selectedVendorId}
            onValueChange={setSelectedVendorId}
            options={vendors.map((v: any) => ({
              value: v.id.toString(),
              label: v.name,
            }))}
            placeholder="Lọc theo nhà cung cấp..."
            searchPlaceholder="Tìm nhà cung cấp..."
            className="w-64"
          />
          <Button size="sm" onClick={handleOpen} className="bg-indigo-600 hover:bg-indigo-700 gap-1.5 rounded-lg whitespace-nowrap">
            <LinkIcon className="h-4 w-4" /> Liên kết danh mục
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-6 text-center text-slate-500">Đang tải...</div>
        ) : (
          <div className="border border-slate-100 rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Nhà cung cấp (Supplier)</TableHead>
                  <TableHead>Chất liệu được bán (Template)</TableHead>
                  <TableHead>Thuộc tính được phân phối</TableHead>
                  <TableHead className="w-24 text-right">Gỡ liên kết</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!items || items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-slate-400">
                      Không có bản ghi liên kết nào. Vui lòng liên kết chất liệu vào NCC.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">{item.id}</TableCell>
                      <TableCell className="font-semibold text-slate-700">{item.vendorName || `NCC #${item.vendorId}`}</TableCell>
                      <TableCell className="font-semibold text-indigo-700">{item.materialTypeName || `Chất liệu #${item.materialTypeId}`}</TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          {renderAllowedSpecs(item)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 hover:text-rose-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Liên kết danh mục chất liệu NCC</DialogTitle>
            <DialogDescription>Gán chất liệu/giấy cho nhà cung cấp phân phối chính thức.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-1.5 flex flex-col">
              <Label htmlFor="catalogVendorId">Nhà cung cấp <span className="text-red-500">*</span></Label>
              <SearchableSelect
                value={vendorId}
                onValueChange={setVendorId}
                options={vendors.map((v: any) => ({
                  value: v.id.toString(),
                  label: v.name,
                }))}
                placeholder="Chọn nhà cung cấp..."
                searchPlaceholder="Tìm nhà cung cấp..."
                className="h-10"
              />
            </div>
            <div className="space-y-1.5 flex flex-col">
              <Label htmlFor="catalogTemplateId">Chất liệu được phép bán <span className="text-red-500">*</span></Label>
              <SearchableSelect
                value={materialTypeId}
                onValueChange={(val) => {
                  setMaterialTypeId(val);
                  setAllowedSpecValueIds([]); // Reset selection when template changes
                }}
                options={templates.map((t: any) => ({
                  value: t.id.toString(),
                  label: `${t.name} (${t.code})`,
                }))}
                placeholder="Chọn chất liệu..."
                searchPlaceholder="Tìm chất liệu..."
                className="h-10"
              />
            </div>

            {/* Checkbox Grouped Specs list */}
            {familySpecs && familySpecs.length > 0 && (
              <div className="space-y-3.5 border border-slate-100 rounded-lg p-3 bg-slate-50/50">
                <span className="font-semibold text-indigo-700 text-xs block mb-1">Cấu hình thuộc tính chi tiết</span>
                {familySpecs.map((spec) => {
                  const values = specValuesData?.filter((v: any) => v.specTemplateId === spec.id) || [];
                  if (values.length === 0) return null;
                  return (
                    <div key={spec.id} className="space-y-1.5 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                      <Label className="text-slate-800 font-semibold text-xs">{spec.name}</Label>
                      <div className="flex flex-wrap gap-2">
                        {values.map((v) => {
                          const isChecked = allowedSpecValueIds.includes(v.id);
                          return (
                            <label
                              key={v.id}
                              className={cn(
                                "flex items-center gap-1.5 px-2 py-1 rounded text-xs border cursor-pointer select-none transition-colors",
                                isChecked
                                  ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-medium"
                                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                              )}
                            >
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setAllowedSpecValueIds(prev => prev.filter(id => id !== v.id));
                                  } else {
                                    setAllowedSpecValueIds(prev => [...prev, v.id]);
                                  }
                                }}
                              />
                              {v.value}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">Liên kết</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ==========================================
// TAB 2: VENDORS (SUPPLIERS)
// ==========================================
function VendorsTab() {
  const [page, setPage] = useState(1);
  const { data: vendorsResp, isLoading, refetch } = useVendors({ pageNumber: page, pageSize: 10 });
  const { data: supplierTypesResp } = useSupplierTypes({ page: 1, size: 1000 });
  const createMutation = useCreateVendor();
  const updateMutation = useUpdateVendor();
  const deleteMutation = useDeleteVendor();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [supplierTypeId, setSupplierTypeId] = useState<string>("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");

  const vendors = vendorsResp?.items || [];
  const supplierTypes = supplierTypesResp?.items || [];

  const getSupplierTypeName = (typeId?: number) => {
    if (!typeId) return "—";
    const found = supplierTypes.find((t: any) => t.id === typeId);
    if (!found) return `ID #${typeId}`;
    return found.description || found.name || found.code;
  };

  const handleOpen = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setName(item.name || "");
      setSupplierTypeId(item.supplierTypeId?.toString() || "");
      setPhone(item.phone || "");
      setEmail(item.email || "");
      setAddress(item.address || "");
      setNote(item.note || "");
    } else {
      setEditingId(null);
      setName("");
      setSupplierTypeId("");
      setPhone("");
      setEmail("");
      setAddress("");
      setNote("");
    }
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên nhà cung cấp");
      return;
    }
    if (!supplierTypeId) {
      toast.error("Vui lòng chọn loại nhà cung cấp");
      return;
    }
    const selectedType = supplierTypes.find((t: any) => t.id === Number(supplierTypeId));
    const payload = {
      name: name.trim(),
      vendorType: selectedType?.code || "",
      supplierTypeId: Number(supplierTypeId),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      note: note.trim() || undefined,
    };
    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          data: { id: editingId, ...payload },
        });
        toast.success("Cập nhật nhà cung cấp thành công!");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Tạo nhà cung cấp thành công!");
      }
      setIsOpen(false);
      refetch();
    } catch (e) { /* ignore */ }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa nhà cung cấp này?")) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success("Xóa nhà cung cấp thành công!");
        refetch();
      } catch (e) { /* ignore */ }
    }
  };

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-slate-100 gap-4 flex-wrap">
        <div>
          <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-600" />
            Nhà cung cấp (Vendors / Suppliers)
          </CardTitle>
        </div>
        <Button size="sm" onClick={() => handleOpen()} className="bg-indigo-600 hover:bg-indigo-700 gap-1.5 rounded-lg">
          <Plus className="h-4 w-4" /> Thêm NCC
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-6 text-center text-slate-500">Đang tải...</div>
        ) : (
          <div className="border border-slate-100 rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Tên NCC</TableHead>
                  <TableHead>Mã NCC / Code</TableHead>
                  <TableHead>Phân loại (T1)</TableHead>
                  <TableHead>Liên hệ</TableHead>
                  <TableHead>Địa chỉ</TableHead>
                  <TableHead className="w-24 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-slate-400">
                      Chưa có nhà cung cấp nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  vendors.map((v: any) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-mono text-xs">{v.id}</TableCell>
                      <TableCell className="font-semibold text-slate-700">{v.name}</TableCell>
                      <TableCell className="font-mono text-xs">{v.code || v.vendorType || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none">
                          {getSupplierTypeName(v.supplierTypeId)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        <div className="text-xs">
                          {v.phone && <div>SĐT: {v.phone}</div>}
                          {v.email && <div>Email: {v.email}</div>}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500 max-w-[200px] truncate">{v.address || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button variant="ghost" size="icon" onClick={() => handleOpen(v)} className="h-8 w-8 hover:text-indigo-600">
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(v.id)} className="h-8 w-8 hover:text-rose-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
        {!isLoading && vendors.length > 0 && (
          <SimplePagination
            currentPage={page}
            totalPages={vendorsResp?.totalPages || 1}
            totalItems={vendorsResp?.total || 0}
            itemsPerPage={10}
            onPageChange={setPage}
            itemType="nhà cung cấp"
          />
        )}
      </CardContent>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Sửa nhà cung cấp" : "Thêm nhà cung cấp mới"}</DialogTitle>
            <DialogDescription>Nhập thông tin chi tiết của nhà cung cấp.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="vendorName">Tên nhà cung cấp <span className="text-red-500">*</span></Label>
                <Input id="vendorName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nhập tên NCC..." />
              </div>
              <div className="space-y-1.5 flex flex-col justify-end">
                <Label htmlFor="vendorType">Loại nhà cung cấp <span className="text-red-500">*</span></Label>
                <SearchableSelect
                  value={supplierTypeId}
                  onValueChange={setSupplierTypeId}
                  options={supplierTypes.map((type: any) => ({
                    value: type.id.toString(),
                    label: type.description || type.name || type.code,
                  }))}
                  placeholder="Chọn loại NCC..."
                  searchPlaceholder="Tìm loại NCC..."
                  className="h-10"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="vendorPhone">Số điện thoại</Label>
                <Input id="vendorPhone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Nhập SĐT..." />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vendorEmail">Email</Label>
                <Input id="vendorEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Nhập email..." />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vendorAddress">Địa chỉ</Label>
              <Input id="vendorAddress" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Nhập địa chỉ..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vendorNote">Ghi chú</Label>
              <Textarea id="vendorNote" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nhập ghi chú..." rows={2} className="resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
              {editingId ? "Cập nhật" : "Tạo NCC"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ==========================================
// TAB 8: MATERIAL SKU (MATERIALS)
// ==========================================
function MaterialsTab() {
  const [page, setPage] = useState(1);
  const { data: materialsResp, isLoading, refetch } = useMaterials({ page, size: 10 });
  const deleteMutation = useDeleteMaterial();
  const [isOpen, setIsOpen] = useState(false);

  const materials = materialsResp?.items || [];

  const handleDelete = async (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa SKU vật tư này?")) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success("Xóa vật tư thành công!");
        refetch();
      } catch (e) { /* ignore */ }
    }
  };

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-slate-100 gap-4 flex-wrap">
        <div>
          <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Package className="h-5 w-5 text-indigo-600" />
            Vật tư SKU (Material SKUs)
          </CardTitle>
        </div>
        <Button size="sm" onClick={() => setIsOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 gap-1.5 rounded-lg">
          <Plus className="h-4 w-4" /> Tạo vật tư SKU
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-6 text-center text-slate-500">Đang tải...</div>
        ) : (
          <div className="border border-slate-100 rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Tên SKU Vật tư</TableHead>
                  <TableHead>Mã SKU</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Kích thước</TableHead>
                  <TableHead>Tồn kho</TableHead>
                  <TableHead>Đơn giá</TableHead>
                  <TableHead className="w-24 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-slate-400">
                      Chưa có vật tư SKU nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  materials.map((m: any) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono text-xs">{m.id}</TableCell>
                      <TableCell className="font-semibold text-slate-700">{m.name}</TableCell>
                      <TableCell className="font-mono text-xs">{m.code || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={m.type === "cuon" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-blue-50 text-blue-700 border-blue-200"}>
                          {m.type === "cuon" ? "Cuộn" : "Tờ"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {m.type === "cuon" 
                          ? `Khổ ${m.width || 0} cm` 
                          : `${m.width || 0} x ${m.length || 0} cm`}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-700">
                        {m.currentStock?.toLocaleString() || 0} <span className="text-xs text-slate-400 font-normal">{m.unit}</span>
                      </TableCell>
                      <TableCell className="font-mono text-slate-600">
                        {m.unitPrice ? `${m.unitPrice.toLocaleString()} đ` : "0 đ"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)} className="h-8 w-8 hover:text-rose-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
        {!isLoading && materials.length > 0 && (
          <SimplePagination
            currentPage={page}
            totalPages={materialsResp?.totalPages || 1}
            totalItems={materialsResp?.total || 0}
            itemsPerPage={10}
            onPageChange={setPage}
            itemType="vật tư SKU"
          />
        )}
      </CardContent>

      <CreateMaterialDialog 
        open={isOpen} 
        onOpenChange={setIsOpen} 
        onSuccess={() => {
          refetch();
          toast.success("Tạo SKU vật tư thành công!");
        }}
      />
    </Card>
  );
}
