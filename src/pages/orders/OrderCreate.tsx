import { useState, useMemo } from "react";
import {
  ArrowLeft,
  Save,
  Plus,
  Check,
  ChevronsUpDown,
  Calendar,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "sonner";

import {
  DesignCard,
  DesignModal,
  ExistingDesignModal,
  type CreateDesignRequestUI,
  type DesignTypeResponse,
  type MaterialTypeResponse,
} from "@/components/orders";
import type { DesignResponse } from "@/Schema/design.schema";
import type { CustomerSummaryResponse } from "@/Schema/customer.schema";
import {
  useCustomers,
  useDesignTypes,
  useMaterialsByDesignType,
  useDesignsByCustomer,
  getDesignTypeItems,
  useCreateOrder,
} from "@/hooks";
import type { CreateOrderRequest } from "@/Schema/order.schema";
import { ImageViewerDialog } from "@/components/design/image-viewer-dialog";

// ===== Main Component =====
export default function OrderCreatePage() {
  const navigate = useNavigate();
  const { mutateAsync: createOrder, isPending: isCreatingOrder } =
    useCreateOrder();

  // API Hooks
  const { data: customersData, isLoading: loadingCustomers } = useCustomers({
    page: 1,
    size: 1000, // Get all customers
  });
  const customers = customersData?.items || [];

  const { data: designTypesData, isLoading: loadingDesignTypes } =
    useDesignTypes({
      page: 1,
      size: 1000,
    });
  const designTypes = (getDesignTypeItems(designTypesData) || []).filter(
    (dt): dt is DesignTypeResponse => !!dt.id
  ) as DesignTypeResponse[];

  const [currentDesignTypeId, setCurrentDesignTypeId] = useState<number>(0);

  const { data: materialsData = [], isLoading: loadingMaterials } =
    useMaterialsByDesignType(
      currentDesignTypeId > 0 ? currentDesignTypeId : undefined,
      "active"
    );
  const materials = (materialsData || []).filter(
    (m): m is MaterialTypeResponse => !!m.id
  ) as MaterialTypeResponse[];

  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerSummaryResponse | null>(null);

  const { data: existingDesigns = [], isLoading: loadingExistingDesigns } =
    useDesignsByCustomer(selectedCustomer?.id || 0);

  // Customer state
  const [customerComboOpen, setCustomerComboOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    notes: "",
    deliveryDate: "",
  });

  // Designs state
  const [designs, setDesigns] = useState<CreateDesignRequestUI[]>([]);

  // Modal states
  const [designModalOpen, setDesignModalOpen] = useState(false);
  const [editingDesign, setEditingDesign] =
    useState<CreateDesignRequestUI | null>(null);
  const [existingDesignModalOpen, setExistingDesignModalOpen] = useState(false);
  const [selectedExistingDesign, setSelectedExistingDesign] =
    useState<DesignResponse | null>(null);

  // Image viewer state
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [viewingImageUrl, setViewingImageUrl] = useState<string>("");

  // Handlers
  const handleCustomerSelect = (customer: CustomerSummaryResponse) => {
    setSelectedCustomer(customer);
    setDesigns([]);
    setCustomerComboOpen(false);
  };

  const handleAddNewDesign = () => {
    setEditingDesign(null);
    setCurrentDesignTypeId(0);
    setDesignModalOpen(true);
  };

  const handleEditDesign = (design: CreateDesignRequestUI) => {
    // If it's an existing design, don't allow editing through DesignModal
    // User should use ExistingDesignModal or we should prevent editing
    if (design.isFromExisting && design.designId) {
      toast.info(
        "Thiết kế có sẵn chỉ có thể chỉnh sửa số lượng. Vui lòng xóa và thêm lại với số lượng mới."
      );
      return;
    }
    setEditingDesign(design);
    setCurrentDesignTypeId(design.designTypeId);
    setDesignModalOpen(true);
  };

  const handleSaveDesign = (design: CreateDesignRequestUI) => {
    if (editingDesign) {
      // Update existing
      setDesigns((prev) => prev.map((d) => (d.id === design.id ? design : d)));
      toast.success("Đã cập nhật thiết kế");
    } else {
      // Add new
      setDesigns((prev) => [...prev, { ...design, id: `new-${Date.now()}` }]);
      toast.success("Đã thêm thiết kế mới");
    }
  };

  const handleRemoveDesign = (id: string) => {
    setDesigns((prev) => prev.filter((d) => d.id !== id));
    toast.success("Đã xóa thiết kế");
  };

  const handleSelectExistingDesign = (design: DesignResponse) => {
    // Check if already added
    const alreadyAdded = designs.some(
      (d) => d.isFromExisting && d.designId === design.id
    );
    if (alreadyAdded) {
      toast.error("Thiết kế này đã được thêm");
      return;
    }
    setSelectedExistingDesign(design);
    setExistingDesignModalOpen(true);
  };

  const handleConfirmExistingDesign = (
    design: DesignResponse,
    quantity: number
  ) => {
    const newDesign: CreateDesignRequestUI = {
      id: `existing-${design.id}-${Date.now()}`,
      designId: design.id,
      designCode: design.code,
      isFromExisting: true,
      designTypeId: design.designTypeId || 0,
      materialTypeId: design.materialTypeId || 0,
      quantity,
      designName: design.designName || "",
      length: design.length || 0,
      width: design.width || 0,
      height: design.height || 0,
    };
    setDesigns((prev) => [...prev, newDesign]);
    toast.success("Đã thêm thiết kế có sẵn");
  };

  const isDesignSelected = (design: DesignResponse) => {
    return designs.some((d) => d.isFromExisting && d.designId === design.id);
  };

  const handleDesignTypeChange = (typeId: number) => {
    setCurrentDesignTypeId(typeId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate customer
    if (!selectedCustomer) {
      toast.error("Vui lòng chọn khách hàng");
      return;
    }

    // Validate designs
    if (designs.length === 0) {
      toast.error("Vui lòng thêm ít nhất một thiết kế");
      return;
    }

    // Validate each design
    for (const design of designs) {
      // Check required fields for new designs
      if (!design.isFromExisting) {
        if (!design.designTypeId || design.designTypeId <= 0) {
          toast.error(
            `Thiết kế "${
              design.designName || "Chưa đặt tên"
            }" chưa chọn loại thiết kế`
          );
          return;
        }
        if (!design.materialTypeId || design.materialTypeId <= 0) {
          toast.error(
            `Thiết kế "${
              design.designName || "Chưa đặt tên"
            }" chưa chọn chất liệu`
          );
          return;
        }
        if (!design.designName?.trim()) {
          toast.error(`Thiết kế chưa có tên`);
          return;
        }
      }

      // Check quantity
      if (!design.quantity || design.quantity <= 0) {
        toast.error(
          `Thiết kế "${design.designName || "Chưa đặt tên"}" chưa nhập số lượng`
        );
        return;
      }

      // Check minimum quantity
      if (
        design.minQuantity &&
        design.minQuantity > 0 &&
        design.quantity < design.minQuantity
      ) {
        toast.error(
          `Thiết kế "${
            design.designName || "Chưa đặt tên"
          }" có số lượng (${design.quantity.toLocaleString(
            "vi-VN"
          )}) nhỏ hơn mức tối thiểu (${design.minQuantity.toLocaleString(
            "vi-VN"
          )})`
        );
        return;
      }
    }

    try {
      // Transform designs to API format
      const designRequests = designs.map((design) => {
        if (design.isFromExisting && design.designId) {
          // Existing design: only need designId and quantity
          return {
            designId: design.designId,
            quantity: design.quantity,
          };
        } else {
          // New design: include all fields
          return {
            designTypeId: design.designTypeId > 0 ? design.designTypeId : null,
            materialTypeId:
              design.materialTypeId > 0 ? design.materialTypeId : null,
            assignedDesignerId:
              design.assignedDesignerId && design.assignedDesignerId > 0
                ? design.assignedDesignerId
                : null,
            designName: design.designName?.trim() || null,
            length: design.length && design.length > 0 ? design.length : null,
            width: design.width && design.width > 0 ? design.width : null,
            height: design.height && design.height > 0 ? design.height : null,
            depth: design.depth && design.depth > 0 ? design.depth : null,
            sidesClassificationOptionId:
              design.sidesClassificationOptionId &&
              design.sidesClassificationOptionId > 0
                ? design.sidesClassificationOptionId
                : null,
            processClassificationOptionId:
              design.processClassificationOptionId &&
              design.processClassificationOptionId > 0
                ? design.processClassificationOptionId
                : null,
            requirements: design.requirements?.trim() || null,
            additionalNotes: design.additionalNotes?.trim() || null,
            quantity: design.quantity,
          };
        }
      });

      // Prepare payload
      const payload: CreateOrderRequest = {
        customerId: selectedCustomer.id!,
        deliveryDate: formData.deliveryDate
          ? new Date(formData.deliveryDate).toISOString()
          : null,
        note: formData.notes?.trim() || null,
        designRequests: designRequests,
      };

      // Call API
      const result = await createOrder(payload);

      // Success: navigate to order detail page
      if (result?.id) {
        toast.success("Đã tạo đơn hàng thành công!");
        navigate(`/orders/${result.id}`);
      } else {
        toast.success("Đã tạo đơn hàng thành công!");
        navigate("/orders");
      }
    } catch (error) {
      // Error handling is done in the hook
      console.error("Error creating order:", error);
    }
  };

  // Summary calculations
  const totalQuantity = designs.reduce((sum, d) => sum + (d.quantity || 0), 0);
  const fromExistingCount = designs.filter((d) => d.isFromExisting).length;
  const newDesignCount = designs.length - fromExistingCount;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Link to="/">
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
        <form onSubmit={handleSubmit}>
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
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Chọn khách hàng{" "}
                      <span className="text-destructive">*</span>
                    </Label>
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
                            ? `${selectedCustomer.name} - ${selectedCustomer.code} - ${selectedCustomer.companyName}`
                            : "Tìm và chọn khách hàng..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-full p-0 bg-popover"
                        align="start"
                      >
                        <Command>
                          <CommandInput
                            placeholder="Tìm theo tên, mã KH..."
                            className="h-9 text-sm"
                          />
                          <CommandList>
                            <CommandEmpty>
                              {loadingCustomers
                                ? "Đang tải..."
                                : "Không tìm thấy khách hàng"}
                            </CommandEmpty>
                            <CommandGroup>
                              {customers.map((customer) => (
                                <CommandItem
                                  key={customer.id}
                                  value={`${customer.companyName || ""} ${
                                    customer.code || ""
                                  } ${customer.phone || ""}`}
                                  onSelect={() =>
                                    handleCustomerSelect(customer)
                                  }
                                  className="py-2 text-sm"
                                  disabled={loadingCustomers}
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
                                      {customer.name || ""} -{" "}
                                      {customer.code || ""} -{" "}
                                      {customer.companyName || ""}
                                    </span>
                                    {customer.phone && (
                                      <span className="text-xs text-muted-foreground">
                                        {customer.phone}
                                      </span>
                                    )}
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
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
                      rows={2}
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
                <CardContent className="pt-0 pb-4">
                  <div className="space-y-2">
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
                      className="bg-background h-10 text-sm max-w-xs"
                    />
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
                  {/* Existing designs selection */}
                  {selectedCustomer && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Chọn thiết kế có sẵn của khách (tuỳ chọn)
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Click vào thiết kế để thêm vào đơn hàng
                        </p>
                        <div className="grid gap-3 md:grid-cols-2">
                          {loadingExistingDesigns ? (
                            <div className="col-span-2 text-center py-4 text-sm text-muted-foreground">
                              Đang tải thiết kế có sẵn...
                            </div>
                          ) : existingDesigns.length === 0 ? (
                            <div className="col-span-2 text-center py-4 text-sm text-muted-foreground">
                              Không có thiết kế có sẵn
                            </div>
                          ) : (
                            existingDesigns.map((d) => {
                              const selected = isDesignSelected(d);
                              // Format kích thước: chỉ hiển thị các giá trị > 0
                              const sizeParts: number[] = [];
                              if (d.length && d.length > 0)
                                sizeParts.push(d.length);
                              if (d.width && d.width > 0)
                                sizeParts.push(d.width);
                              if (d.height && d.height > 0)
                                sizeParts.push(d.height);
                              const sizeLabel =
                                sizeParts.length > 0
                                  ? `${sizeParts.join(" × ")} mm`
                                  : "—";

                              const handleImageClick = (
                                e: React.MouseEvent,
                                imageUrl: string
                              ) => {
                                e.stopPropagation();
                                setViewingImageUrl(imageUrl);
                                setImageViewerOpen(true);
                              };

                              return (
                                <div
                                  key={d.id}
                                  className={`
                                  w-full rounded-lg border p-3 flex flex-col gap-2 transition-all relative
                                  ${
                                    selected
                                      ? "border-primary bg-primary/5"
                                      : "border-border bg-background hover:border-primary/50"
                                  }
                                `}
                                >
                                  {/* Check button - Outside, top right */}
                                  <div
                                    className={`
                                    absolute top-3 right-3 h-5 w-5 rounded-full border flex items-center justify-center shrink-0 z-10
                                    ${
                                      selected
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-muted-foreground/30 bg-background"
                                    }
                                  `}
                                  >
                                    {selected && <Check className="h-3 w-3" />}
                                  </div>

                                  <div className="flex flex-row gap-3 pr-8">
                                    {/* Main Content */}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleSelectExistingDesign(d)
                                      }
                                      className="flex-1 text-left flex flex-col gap-1.5 min-w-0"
                                    >
                                      <div className="flex flex-col gap-0.5">
                                        <Badge
                                          variant={
                                            selected ? "default" : "outline"
                                          }
                                          className="font-mono text-xs w-fit"
                                        >
                                          {d.code}
                                        </Badge>
                                        <span className="text-sm font-medium line-clamp-2 mt-1">
                                          {d.designName}
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                        {d.designType?.name && (
                                          <span className="px-2 py-0.5 rounded-full bg-muted">
                                            {d.designType.name}
                                          </span>
                                        )}
                                        {d.materialType?.name && (
                                          <span className="px-2 py-0.5 rounded-full bg-muted">
                                            {d.materialType.name}
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-xs text-muted-foreground">
                                        Kích thước: {sizeLabel}
                                      </span>
                                    </button>

                                    {/* Design Image - Compact Preview */}
                                    {d.designImageUrl && (
                                      <button
                                        type="button"
                                        onClick={(e) =>
                                          handleImageClick(e, d.designImageUrl!)
                                        }
                                        className="relative group shrink-0 rounded-md overflow-hidden border border-border hover:border-primary/50 transition-colors bg-muted"
                                        style={{
                                          width: "80px",
                                          height: "80px",
                                        }}
                                      >
                                        <img
                                          src={d.designImageUrl}
                                          alt={d.designName || "Design image"}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            const target =
                                              e.target as HTMLImageElement;
                                            target.style.display = "none";
                                          }}
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                          <ImageIcon className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                        </div>
                                      </button>
                                    )}
                                  </div>

                                  {/* Requirements */}
                                  {(d.latestRequirements || d.notes) && (
                                    <div className="pt-2 border-t">
                                      <div className="flex items-start gap-2">
                                        <FileText className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium text-muted-foreground mb-1">
                                            Yêu cầu thiết kế:
                                          </p>
                                          <p className="text-xs text-foreground line-clamp-2">
                                            {d.latestRequirements || d.notes}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Design list header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        Danh sách thiết kế ({designs.length})
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-sm"
                      onClick={handleAddNewDesign}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Thêm thiết kế mới
                    </Button>
                  </div>

                  {/* Design cards */}
                  {designs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                      <p className="text-sm">Chưa có thiết kế nào</p>
                      <p className="text-xs mt-1">
                        Chọn thiết kế có sẵn hoặc thêm thiết kế mới
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {designs.map((design, index) => (
                        <DesignCard
                          key={design.id}
                          design={design}
                          index={index}
                          designTypes={designTypes}
                          materials={materials}
                          onEdit={handleEditDesign}
                          onRemove={handleRemoveDesign}
                          canRemove={true}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* RIGHT: SUMMARY */}
            <div className="lg:sticky lg:top-6 h-fit">
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-base font-semibold">
                    Tổng quan đơn hàng
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-0 pb-4">
                  {/* Customer info */}
                  {selectedCustomer && (
                    <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                      <p className="text-sm font-medium">
                        {selectedCustomer.companyName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedCustomer.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedCustomer.phone}
                      </p>
                    </div>
                  )}

                  <Separator />

                  {/* Design summary */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Thiết kế mới
                      </span>
                      <span className="font-medium">{newDesignCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Thiết kế có sẵn
                      </span>
                      <span className="font-medium">{fromExistingCount}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">
                        Tổng số lượng
                      </span>
                      <span className="font-bold text-lg text-primary">
                        {totalQuantity.toLocaleString("vi-VN")}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <Button
                    type="submit"
                    className="w-full gap-2"
                    size="sm"
                    disabled={isCreatingOrder}
                  >
                    <Save className="h-4 w-4" />
                    {isCreatingOrder ? "Đang tạo..." : "Tạo đơn hàng"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <Link to="/">Hủy và quay lại</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>

      {/* Design Modal */}
      <DesignModal
        open={designModalOpen}
        onOpenChange={setDesignModalOpen}
        design={editingDesign}
        designTypes={designTypes}
        materials={materials}
        loadingMaterials={loadingMaterials}
        onSave={handleSaveDesign}
        onDesignTypeChange={handleDesignTypeChange}
        isNew={!editingDesign}
      />

      {/* Existing Design Modal */}
      <ExistingDesignModal
        open={existingDesignModalOpen}
        onOpenChange={setExistingDesignModalOpen}
        design={selectedExistingDesign}
        onConfirm={handleConfirmExistingDesign}
      />

      {/* Image Viewer Dialog */}
      <ImageViewerDialog
        open={imageViewerOpen}
        onOpenChange={setImageViewerOpen}
        imageUrl={viewingImageUrl}
        title="Ảnh thiết kế"
      />
    </div>
  );
}
