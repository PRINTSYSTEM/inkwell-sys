import type React from "react";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Check,
  ChevronsUpDown,
  Calendar,
  FileText,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  useAuth,
  useCreateCustomer,
  useCreateOrder,
  useCustomers,
  useDesignTypes,
  useMaterialsByDesignType,
  useOrders,
  useToast,
} from "@/hooks";
import {
  CreateDesignRequest,
  CustomerResponse,
  DesignResponse,
  DesignTypeResponse,
  MaterialTypeResponse,
} from "@/Schema";

// ===== UI model: CreateDesignRequest + field phục vụ UI =====
type CreateDesignRequestUI = CreateDesignRequest & {
  id: string; // id cho UI
  designCode?: string; // nếu sau này muốn show code
};

// Chuẩn hóa mọi kiểu response (items, data, array) về mảng
const normalizeArray = <T,>(raw: unknown): T[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as T[];
  const anyRaw = raw as any;
  if (Array.isArray(anyRaw.items)) return anyRaw.items as T[];
  if (Array.isArray(anyRaw.data)) return anyRaw.data as T[];
  return [];
};

// Tạo preview mã thiết kế từ loại thiết kế
const generateDesignCodePreview = (
  designTypeId: number,
  designTypes: DesignTypeResponse[]
) => {
  if (!designTypeId) return "";
  const dt = designTypes.find((x) => x.id === designTypeId);
  return dt ? `${dt.code}xxx` : "";
};

// ===== Component con: một yêu cầu thiết kế mới =====
type DesignRequestItemProps = {
  design: CreateDesignRequestUI;
  index: number;
  designTypes: DesignTypeResponse[];
  onChange: (id: string, patch: Partial<CreateDesignRequestUI>) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
};

const DesignRequestItem: React.FC<DesignRequestItemProps> = ({
  design,
  index,
  designTypes,
  onChange,
  onRemove,
  canRemove,
}) => {
  const designTypeNumericId =
    design.designTypeId && design.designTypeId > 0
      ? design.designTypeId
      : undefined;

  const {
    data: materials = [],
    isLoading: loadingMaterials,
    isError: materialsError,
  } = useMaterialsByDesignType(designTypeNumericId);

  return (
    <div className="border rounded-md p-4 bg-muted/20 relative border-l-4 border-l-primary/60">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-xs text-primary font-semibold">
            {index + 1}
          </div>
          <div>
            <p className="text-sm font-medium">
              {design.designName || `Thiết kế mới #${index + 1}`}
            </p>
            {design.designTypeId > 0 && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                Mã dự kiến:
                <span className="font-mono">
                  {generateDesignCodePreview(design.designTypeId, designTypes)}
                </span>
              </p>
            )}
          </div>
        </div>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemove(design.id)}
            className="h-8 w-8 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Loại thiết kế */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Loại thiết kế <span className="text-destructive">*</span>
          </Label>
          <Select
            value={
              design.designTypeId ? String(design.designTypeId) : undefined
            }
            onValueChange={(value) =>
              onChange(design.id, {
                designTypeId: Number(value) || 0,
                // đổi loại thiết kế thì reset chất liệu
                materialTypeId: 0,
              })
            }
          >
            <SelectTrigger className="bg-background h-10 text-sm">
              <SelectValue placeholder="Chọn loại thiết kế..." />
            </SelectTrigger>
            <SelectContent>
              {designTypes.map((type) => (
                <SelectItem
                  key={type.id.toString()}
                  value={type.id.toString()}
                  className="text-sm"
                >
                  <div className="flex flex-col">
                    <span>{type.name}</span>
                    {type.description && (
                      <span className="text-xs text-muted-foreground">
                        {type.description}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Chất liệu */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Chất liệu <span className="text-destructive">*</span>
          </Label>
          <Select
            value={
              design.materialTypeId ? String(design.materialTypeId) : undefined
            }
            onValueChange={(value) =>
              onChange(design.id, {
                materialTypeId: Number(value) || 0,
              })
            }
            disabled={!design.designTypeId}
          >
            <SelectTrigger className="bg-background h-10 text-sm">
              <SelectValue
                placeholder={
                  !design.designTypeId
                    ? "Chọn loại thiết kế trước"
                    : loadingMaterials
                    ? "Đang tải..."
                    : materialsError
                    ? "Lỗi tải chất liệu"
                    : "Chọn chất liệu..."
                }
              />
            </SelectTrigger>
            <SelectContent>
              {materialsError && (
                <SelectItem value="__error" disabled>
                  Không thể tải danh sách chất liệu
                </SelectItem>
              )}
              {!materialsError &&
                !loadingMaterials &&
                materials.length === 0 && (
                  <SelectItem value="__empty" disabled>
                    Không có chất liệu phù hợp
                  </SelectItem>
                )}
              {materials.map((material: MaterialTypeResponse) => (
                <SelectItem
                  key={material.id}
                  value={material.id.toString()}
                  className="text-sm"
                >
                  <div className="flex flex-col">
                    <span>{material.name}</span>
                    {material.description && (
                      <span className="text-xs text-muted-foreground">
                        {material.description}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tên thiết kế */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Tên thiết kế <span className="text-destructive">*</span>
          </Label>
          <Input
            placeholder="VD: Bao bì túi phân bón kali"
            value={design.designName}
            onChange={(e) =>
              onChange(design.id, { designName: e.target.value })
            }
            className="bg-background h-10 text-sm"
          />
        </div>

        {/* Rộng */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Rộng (mm) <span className="text-destructive">*</span>
          </Label>
          <Input
            type="number"
            placeholder="280"
            value={design.width || ""}
            onChange={(e) =>
              onChange(design.id, {
                width: e.target.value === "" ? 0 : Number(e.target.value),
              })
            }
            className="bg-background h-10 text-sm"
          />
        </div>

        {/* Cao */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Cao (mm) <span className="text-destructive">*</span>
          </Label>
          <Input
            type="number"
            placeholder="153"
            value={design.height || ""}
            onChange={(e) =>
              onChange(design.id, {
                height: e.target.value === "" ? 0 : Number(e.target.value),
              })
            }
            className="bg-background h-10 text-sm"
          />
        </div>

        {/* Số lượng */}
        <div className="space-y-2 ">
          <Label className="text-sm font-medium">
            Số lượng <span className="text-destructive">*</span>
          </Label>
          <Input
            type="number"
            placeholder="1000"
            value={design.quantity || ""}
            onChange={(e) =>
              onChange(design.id, {
                quantity: e.target.value === "" ? 0 : Number(e.target.value),
              })
            }
            className="bg-background h-10 text-sm max-w-[200px]"
          />
        </div>

        {/* Yêu cầu thiết kế */}
        <div className="space-y-2 md:col-span-2">
          <Label className="text-sm font-medium">
            Yêu cầu thiết kế <span className="text-destructive">*</span>
          </Label>
          <Textarea
            placeholder="Mô tả chi tiết: màu sắc, bố cục, nội dung, logo..."
            value={design.requirements}
            onChange={(e) =>
              onChange(design.id, { requirements: e.target.value })
            }
            rows={3}
            className="resize-none bg-background text-sm"
          />
        </div>

        {/* Ghi chú */}
        <div className="space-y-2 md:col-span-2">
          <Label className="text-sm font-medium">Ghi chú thêm</Label>
          <Textarea
            placeholder="Ghi chú bổ sung cho thiết kế này (nếu có)..."
            value={design.additionalNotes || ""}
            onChange={(e) =>
              onChange(design.id, { additionalNotes: e.target.value })
            }
            rows={2}
            className="resize-none bg-background text-sm"
          />
        </div>
      </div>
    </div>
  );
};

// ===== PAGE CHÍNH =====
export default function CreateOrderPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // ===== API hooks =====
  const {
    data: customersData,
    isLoading: loadingCustomers,
    isError: customersError,
  } = useCustomers({ pageSize: 100 });

  const {
    data: designTypesData,
    isLoading: loadingDesignTypes,
    isError: designTypesError,
  } = useDesignTypes({ status: "active" });

  // lấy toàn bộ order (sau đó filter theo customer ở FE)
  const { data: ordersData } = useOrders({ pageSize: 200 });

  const createOrderMutation = useCreateOrder();
  const createCustomerMutation = useCreateCustomer();

  const customers = normalizeArray<CustomerResponse>(customersData);
  const designTypes = normalizeArray<DesignTypeResponse>(designTypesData);

  // ===== Local UI state =====
  const [customerComboOpen, setCustomerComboOpen] = useState(false);
  const [showCreateCustomerDialog, setShowCreateCustomerDialog] =
    useState(false);

  const [formData, setFormData] = useState({
    customerId: "",
    notes: "",
    deliveryDate: "",
  });

  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerResponse | null>(null);

  // danh sách thiết kế mới
  const [designs, setDesigns] = useState<CreateDesignRequestUI[]>([
    {
      id: "1",
      designCode: "",
      designTypeId: 0,
      materialTypeId: 0,
      assignedDesignerId: 0,
      quantity: 0,
      designName: "",
      width: 0,
      height: 0,
      requirements: "",
      additionalNotes: "",
    },
  ]);

  // thiết kế cũ của khách được chọn
  const [selectedExistingDesignIds, setSelectedExistingDesignIds] = useState<
    number[]
  >([]);

  const [newCustomerData, setNewCustomerData] = useState({
    companyName: "",
    representativeName: "",
    phone: "",
    address: "",
    taxCode: "",
    maxDebt: "10000000",
  });

  // ===== Lấy danh sách design cũ của khách (từ orders) =====
  const existingDesignsForCustomer: DesignResponse[] = useMemo(() => {
    if (!selectedCustomer) return [];
    const allOrders = ordersData?.items ?? [];
    const relatedOrders = allOrders.filter(
      (o: any) => o.customerId === selectedCustomer.id
    );
    const allDesigns = relatedOrders.flatMap(
      (o: any) => (o.designs as DesignResponse[]) ?? []
    );
    // Có thể filter thêm theo status nếu muốn
    return allDesigns;
  }, [selectedCustomer, ordersData]);

  // ===== Handlers =====
  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find((c) => c.id.toString() === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      setFormData((prev) => ({ ...prev, customerId }));
      // reset lựa chọn thiết kế cũ khi đổi khách
      setSelectedExistingDesignIds([]);
    }
  };

  const addDesign = () => {
    const newId = (designs.length + 1).toString();
    setDesigns((prev) => [
      ...prev,
      {
        id: newId,
        designCode: "",
        designTypeId: 0,
        materialTypeId: 0,
        assignedDesignerId: 0,
        quantity: 0,
        designName: "",
        width: 0,
        height: 0,
        requirements: "",
        additionalNotes: "",
      },
    ]);
  };

  const removeDesign = (id: string) => {
    if (designs.length > 1) {
      setDesigns((prev) => prev.filter((design) => design.id !== id));
    }
  };

  const updateDesign = (id: string, patch: Partial<CreateDesignRequestUI>) => {
    setDesigns((prev) =>
      prev.map((design) => {
        if (design.id !== id) return design;
        const next: CreateDesignRequestUI = { ...design, ...patch };
        // Nếu đổi designTypeId nhưng chưa patch materialTypeId, reset nó
        if (
          patch.designTypeId !== undefined &&
          patch.designTypeId !== design.designTypeId &&
          patch.materialTypeId === undefined
        ) {
          next.materialTypeId = 0;
        }
        return next;
      })
    );
  };

  const toggleExistingDesign = (id: number) => {
    setSelectedExistingDesignIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // validate designs (UI)
  const validateDesigns = () =>
    designs.filter(
      (d) =>
        d.designTypeId > 0 &&
        d.materialTypeId > 0 &&
        d.designName.trim() &&
        d.quantity > 0 &&
        d.requirements.trim() &&
        d.width > 0 &&
        d.height > 0
    );

  // tạo khách hàng mới
  const handleCreateCustomer = () => {
    if (
      !newCustomerData.companyName ||
      !newCustomerData.representativeName ||
      !newCustomerData.phone
    ) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
        variant: "destructive",
      });
      return;
    }

    createCustomerMutation.mutate(
      {
        companyName: newCustomerData.companyName,
        representativeName: newCustomerData.representativeName,
        phone: newCustomerData.phone,
        address: newCustomerData.address || undefined,
        taxCode: newCustomerData.taxCode || undefined,
        maxDebt: Number(newCustomerData.maxDebt) || 0,
      },
      {
        onSuccess: (created: any) => {
          toast({
            title: "Thành công",
            description: "Đã tạo khách hàng mới",
          });
          setShowCreateCustomerDialog(false);
          setNewCustomerData({
            companyName: "",
            representativeName: "",
            phone: "",
            address: "",
            taxCode: "",
            maxDebt: "10000000",
          });

          if (created?.id) {
            setSelectedCustomer(created);
            setFormData((prev) => ({
              ...prev,
              customerId: created.id.toString(),
            }));
          }
        },
        onError: (err: any) => {
          toast({
            title: "Lỗi",
            description:
              err?.response?.data?.message ||
              "Không thể tạo khách hàng, vui lòng thử lại",
            variant: "destructive",
          });
        },
      }
    );
  };

  // logic submit
  const submitOrder = () => {
    if (!selectedCustomer) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn khách hàng",
        variant: "destructive",
      });
      return;
    }

    const validDesigns = validateDesigns();
    const selectedExisting = existingDesignsForCustomer.filter((d) =>
      selectedExistingDesignIds.includes(d.id)
    );

    if (validDesigns.length === 0 && selectedExisting.length === 0) {
      toast({
        title: "Lỗi",
        description:
          "Vui lòng chọn thiết kế có sẵn hoặc thêm ít nhất một yêu cầu thiết kế mới hợp lệ",
        variant: "destructive",
      });
      return;
    }

    // map thiết kế cũ -> CreateDesignRequest
    const reusedDesignRequests: CreateDesignRequest[] = selectedExisting.map(
      (d) => ({
        designTypeId: d.designTypeId,
        materialTypeId: d.materialTypeId,
        assignedDesignerId: user?.id || d.designer?.id || 0,
        quantity: d.quantity,
        designName: d.designName,
        width: d.width,
        height: d.height,
        requirements: d.requirements ?? "",
        additionalNotes: d.additionalNotes ?? "",
      })
    );

    // map UI model -> CreateDesignRequest gửi BE
    const newDesignRequests: CreateDesignRequest[] = validDesigns.map((d) => {
      const { id, designCode, ...rest } = d;
      return {
        ...rest,
        assignedDesignerId: user?.id || rest.assignedDesignerId || 0,
      };
    });

    const designRequests: CreateDesignRequest[] = [
      ...reusedDesignRequests,
      ...newDesignRequests,
    ];

    const deliveryDateIso = formData.deliveryDate
      ? new Date(formData.deliveryDate).toISOString()
      : new Date().toISOString();

    const payload = {
      customerId: selectedCustomer.id,
      assignedToUserId: user?.id || 0,
      // dùng địa chỉ của khách
      deliveryAddress: selectedCustomer.address || "",
      // bỏ nhập tiền, để 0 (hoặc để BE tính)
      totalAmount: 0,
      depositAmount: 0,
      deliveryDate: deliveryDateIso,
      note: formData.notes || "",
      designRequests,
    };

    createOrderMutation.mutate(
      {
        ...payload,
        deliveryDate: payload.deliveryDate,
      },
      {
        onSuccess: () => {
          toast({
            title: "Thành công",
            description: "Đã tạo đơn hàng mới",
          });
          navigate("/orders");
        },
        onError: (err: any) => {
          toast({
            title: "Lỗi",
            description:
              err?.response?.data?.message ||
              "Không thể tạo đơn hàng, vui lòng thử lại",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleFormSubmit: React.FormEventHandler = (e) => {
    e.preventDefault();
    submitOrder();
  };

  // ================= SUMMARY DATA =================
  const totalNewQuantity = designs.reduce(
    (sum, d) => sum + (d.quantity || 0),
    0
  );
  const totalExistingQuantity = existingDesignsForCustomer
    .filter((d) => selectedExistingDesignIds.includes(d.id))
    .reduce((sum, d) => sum + (d.quantity || 0), 0);
  const totalQuantity = totalNewQuantity + totalExistingQuantity;

  // ===== UI =====
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-muted/30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Link to="/orders">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-5 w-5" />
                Quay lại
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Tạo đơn hàng mới
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Chọn khách hàng, ngày giao và thiết kế (mới hoặc dùng lại)
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <form onSubmit={handleFormSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2.1fr)_minmax(260px,0.9fr)] gap-6">
            {/* LEFT: FORM */}
            <div className="space-y-6">
              {/* 1. CUSTOMER */}
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
                      1
                    </span>
                    Khách hàng
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-0 pb-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          Chọn khách hàng{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          onClick={() => setShowCreateCustomerDialog(true)}
                          className="h-auto p-0 text-xs"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Thêm mới
                        </Button>
                      </div>

                      <Popover
                        open={customerComboOpen}
                        onOpenChange={setCustomerComboOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between bg-background h-10 px-3 text-sm"
                          >
                            {selectedCustomer
                              ? `${
                                  selectedCustomer.name ||
                                  selectedCustomer.representativeName
                                } - ${selectedCustomer.code} - ${
                                  selectedCustomer.companyName
                                }`
                              : loadingCustomers
                              ? "Đang tải khách hàng..."
                              : "Tìm và chọn khách hàng..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[360px] p-0" align="start">
                          <Command>
                            <CommandInput
                              placeholder="Tìm theo tên hoặc mã khách hàng..."
                              className="h-9 text-sm"
                            />
                            <CommandList>
                              <CommandEmpty>
                                {customersError
                                  ? "Lỗi tải khách hàng"
                                  : "Không tìm thấy khách hàng"}
                              </CommandEmpty>
                              <CommandGroup>
                                {customers.map((customer) => (
                                  <CommandItem
                                    key={customer.id}
                                    value={`${customer.companyName} ${customer.code} ${customer.phone}`}
                                    onSelect={() => {
                                      handleCustomerSelect(
                                        customer.id.toString()
                                      );
                                      setCustomerComboOpen(false);
                                    }}
                                    className="py-1.5 text-sm"
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${
                                        selectedCustomer?.id === customer.id
                                          ? "opacity-100"
                                          : "opacity-0"
                                      }`}
                                    />
                                    <div className="flex flex-col gap-0.5">
                                      <span className="font-medium">
                                        {customer.name ||
                                          customer.representativeName}{" "}
                                        - {customer.code} -
                                        {customer.companyName}
                                      </span>

                                      {customer.companyName &&
                                        customer.representativeName && (
                                          <span className="text-[11px] text-muted-foreground">
                                            Người đại diện:{" "}
                                            {customer.representativeName}
                                          </span>
                                        )}

                                      <span className="text-[11px] text-muted-foreground">
                                        Mã: {customer.code} • {customer.phone}
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

                    {selectedCustomer && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Thông tin nhanh
                        </Label>
                        <div className="flex items-start gap-2 rounded-md border bg-muted/40 px-3 py-2">
                          <Badge
                            variant="outline"
                            className="font-mono text-xs mt-0.5"
                          >
                            {selectedCustomer.code}
                          </Badge>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium">
                              {selectedCustomer.companyName ||
                                selectedCustomer.representativeName}
                            </span>
                            {selectedCustomer.phone && (
                              <span className="text-xs text-muted-foreground">
                                {selectedCustomer.phone}
                              </span>
                            )}
                            {selectedCustomer.address && (
                              <span className="text-xs text-muted-foreground">
                                {selectedCustomer.address}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Ghi chú đơn</Label>
                    <Textarea
                      placeholder="Ghi chú thêm cho đơn hàng (nếu có)..."
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      rows={3}
                      className="resize-none bg-background text-sm"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 2. DELIVERY */}
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
                      2
                    </span>
                    Thông tin giao hàng
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-0 pb-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2 md:col-span-1">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Ngày giao dự kiến
                      </Label>
                      <Input
                        type="datetime-local"
                        value={formData.deliveryDate}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            deliveryDate: e.target.value,
                          }))
                        }
                        className="bg-background h-10 text-sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 3. DESIGNS */}
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
                      3
                    </span>
                    Thiết kế
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-0 pb-4">
                  {/* Thiết kế có sẵn */}
                  {/* Thiết kế có sẵn */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Thiết kế có sẵn của khách (tuỳ chọn)
                    </Label>

                    {!selectedCustomer ? (
                      <p className="text-sm text-muted-foreground italic">
                        Chọn khách hàng để xem các thiết kế cũ.
                      </p>
                    ) : existingDesignsForCustomer.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">
                        Khách hàng này chưa có thiết kế nào trước đó.
                      </p>
                    ) : (
                      <div className="grid gap-3 md:grid-cols-2">
                        {existingDesignsForCustomer.map((d) => {
                          const selected = selectedExistingDesignIds.includes(
                            d.id
                          );
                          const sizeLabel =
                            d.width && d.height
                              ? `${d.width} x ${d.height} mm`
                              : "—";

                          return (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => toggleExistingDesign(d.id)}
                              className={[
                                "w-full text-left rounded-md border p-3 flex flex-col gap-1.5 transition-all",
                                "hover:shadow-sm hover:-translate-y-[1px]",
                                selected
                                  ? "border-primary bg-primary/5"
                                  : "border-border bg-background",
                              ].join(" ")}
                            >
                              {/* Row 1: Code + tên + trạng thái */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant={selected ? "default" : "outline"}
                                      className="font-mono text-[11px]"
                                    >
                                      {d.code || `DES-${d.id}`}
                                    </Badge>
                                    {d.designStatus && (
                                      <span className="text-[11px] rounded-full px-2 py-0.5 bg-muted text-muted-foreground">
                                        {d.designStatus}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-sm font-medium line-clamp-2">
                                    {d.designName || "Không tên"}
                                  </span>
                                </div>

                                {/* Check icon */}
                                <div
                                  className={[
                                    "h-5 w-5 rounded-full border flex items-center justify-center",
                                    selected
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-muted-foreground/30 text-muted-foreground/50",
                                  ].join(" ")}
                                >
                                  {selected && <Check className="h-3 w-3" />}
                                </div>
                              </div>

                              {/* Row 2: Loại & chất liệu */}
                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                {d.designType?.name && (
                                  <span className="px-2 py-0.5 rounded-full bg-muted/80">
                                    Loại: {d.designType.name}
                                  </span>
                                )}
                                {d.materialType?.name && (
                                  <span className="px-2 py-0.5 rounded-full bg-muted/80">
                                    Chất liệu: {d.materialType.name}
                                  </span>
                                )}
                              </div>

                              {/* Row 3: Số lượng + kích thước + ngày */}
                              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground mt-1">
                                <span>
                                  SL:{" "}
                                  <span className="font-medium">
                                    {d.quantity?.toLocaleString("vi-VN") ?? 0}
                                  </span>
                                </span>
                                <span>Kích thước: {sizeLabel}</span>
                                {d.updatedAt && (
                                  <span>
                                    Cập nhật:{" "}
                                    {new Date(d.updatedAt).toLocaleDateString(
                                      "vi-VN"
                                    )}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <Separator className="my-2" />

                  {/* Thiết kế mới */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        Thiết kế mới ({designs.length})
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-sm"
                      onClick={addDesign}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Thêm yêu cầu
                    </Button>
                  </div>

                  {designTypesError && (
                    <p className="text-sm text-red-500">
                      Lỗi tải danh sách loại thiết kế
                    </p>
                  )}
                  {loadingDesignTypes && (
                    <p className="text-sm text-muted-foreground">
                      Đang tải loại thiết kế...
                    </p>
                  )}

                  {designs.map((design, index) => (
                    <DesignRequestItem
                      key={design.id}
                      design={design}
                      index={index}
                      designTypes={designTypes}
                      onChange={updateDesign}
                      onRemove={removeDesign}
                      canRemove={designs.length > 1}
                    />
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* RIGHT: SUMMARY + ACTION */}
            <div className="space-y-4 lg:sticky lg:top-24 self-start">
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Tóm tắt đơn hàng
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-0 pb-4 text-sm">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Khách hàng</p>
                    {selectedCustomer ? (
                      <div className="rounded-md border bg-muted/30 px-3 py-2 flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="font-mono text-xs"
                          >
                            {selectedCustomer.code}
                          </Badge>
                          <span className="text-sm">
                            {selectedCustomer.companyName ||
                              selectedCustomer.representativeName}
                          </span>
                        </div>

                        {selectedCustomer.address && (
                          <span className="text-xs text-muted-foreground">
                            Địa chỉ: {selectedCustomer.address}
                          </span>
                        )}

                        {selectedCustomer.phone && (
                          <span className="text-xs text-muted-foreground">
                            SĐT: {selectedCustomer.phone}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Chưa chọn khách hàng
                      </p>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ngày giao</span>
                      <span>
                        {formData.deliveryDate
                          ? new Date(formData.deliveryDate).toLocaleString(
                              "vi-VN"
                            )
                          : "Chưa đặt"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Thiết kế có sẵn
                      </span>
                      <span className="font-medium">
                        {selectedExistingDesignIds.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Thiết kế mới
                      </span>
                      <span className="font-medium">{designs.length}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t mt-1">
                      <span className="text-muted-foreground">
                        Tổng số lượng
                      </span>
                      <span className="font-semibold">
                        {totalQuantity.toLocaleString("vi-VN")}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <Button
                    type="submit"
                    className="w-full mt-2 gap-2"
                    size="sm"
                    disabled={createOrderMutation.isPending}
                  >
                    <Save className="h-4 w-4" />
                    {createOrderMutation.isPending
                      ? "Đang tạo đơn..."
                      : "Tạo đơn hàng"}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate("/orders")}
                  >
                    Hủy và quay lại danh sách
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>

      {/* Create Customer Dialog */}
      <Dialog
        open={showCreateCustomerDialog}
        onOpenChange={setShowCreateCustomerDialog}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Thêm khách hàng mới</DialogTitle>
            <DialogDescription className="text-sm">
              Điền thông tin khách hàng để thêm vào hệ thống
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-sm">
                Tên công ty <span className="text-destructive">*</span>
              </Label>
              <Input
                id="companyName"
                placeholder="VD: Công ty TNHH ABC"
                value={newCustomerData.companyName}
                onChange={(e) =>
                  setNewCustomerData((prev) => ({
                    ...prev,
                    companyName: e.target.value,
                  }))
                }
                className="h-10 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="representativeName" className="text-sm">
                Người đại diện <span className="text-destructive">*</span>
              </Label>
              <Input
                id="representativeName"
                placeholder="VD: Nguyễn Văn A"
                value={newCustomerData.representativeName}
                onChange={(e) =>
                  setNewCustomerData((prev) => ({
                    ...prev,
                    representativeName: e.target.value,
                  }))
                }
                className="h-10 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm">
                Số điện thoại <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                placeholder="0912345678"
                value={newCustomerData.phone}
                onChange={(e) =>
                  setNewCustomerData((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
                className="h-10 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm">
                Địa chỉ
              </Label>
              <Textarea
                id="address"
                placeholder="Địa chỉ công ty..."
                value={newCustomerData.address}
                onChange={(e) =>
                  setNewCustomerData((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
                rows={2}
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="taxCode" className="text-sm">
                  Mã số thuế
                </Label>
                <Input
                  id="taxCode"
                  placeholder="0123456789"
                  value={newCustomerData.taxCode}
                  onChange={(e) =>
                    setNewCustomerData((prev) => ({
                      ...prev,
                      taxCode: e.target.value,
                    }))
                  }
                  className="h-10 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxDebt" className="text-sm">
                  Hạn mức công nợ (VNĐ)
                </Label>
                <Input
                  id="maxDebt"
                  type="number"
                  placeholder="10000000"
                  value={newCustomerData.maxDebt}
                  onChange={(e) =>
                    setNewCustomerData((prev) => ({
                      ...prev,
                      maxDebt: e.target.value,
                    }))
                  }
                  className="h-10 text-sm"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCreateCustomerDialog(false)}
            >
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={handleCreateCustomer}
              disabled={createCustomerMutation.isPending}
            >
              {createCustomerMutation.isPending
                ? "Đang tạo..."
                : "Tạo khách hàng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
