import { useState, useMemo, useEffect } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  useCustomers,
  useDesignTypes,
  useMaterialsByDesignType,
  useCreateDesign,
  getDesignTypeItems,
} from "@/hooks";
import { ENTITY_CONFIG } from "@/config/entities.config";
import type { CustomerSummaryResponse } from "@/Schema/customer.schema";
import type { DesignTypeResponse, MaterialTypeResponse } from "@/components/orders";

interface DesignCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// Helpers for design types
const isDecalDesignType = (name: string) => name.toLowerCase().includes("decal");
const isTuiDesignType = (name: string) =>
  name.toLowerCase().includes("túi") ||
  name.toLowerCase().includes("tui") ||
  name.toLowerCase().includes("bag") ||
  name.toLowerCase().includes("pe") ||
  name.toLowerCase().includes("pa") ||
  name.toLowerCase().includes("metaline");
const isHopDesignType = (name: string) =>
  name.toLowerCase().includes("hộp") || name.toLowerCase().includes("hop");
const isNhanDesignType = (name: string) =>
  name.toLowerCase().includes("nhãn") || name.toLowerCase().includes("nhan");
const isTuiXepHongDesignType = (name: string) =>
  name.toLowerCase().includes("túi xếp hông") ||
  name.toLowerCase().includes("tui xep hong") ||
  name.toLowerCase().includes("túi xếp") ||
  name.toLowerCase().includes("tui xep");
const isDecalCuonDesignType = (name: string) =>
  name.toLowerCase().includes("decal cuộn") ||
  name.toLowerCase().includes("decal cuon");
const isTuiCuonDesignType = (name: string) =>
  name.toLowerCase().includes("túi cuộn") ||
  name.toLowerCase().includes("tui cuon");

export default function DesignCreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: DesignCreateDialogProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummaryResponse | null>(null);
  const [customerComboOpen, setCustomerComboOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [debouncedCustomerSearch] = useDebounce(customerSearch, 300);

  const [designTypeId, setDesignTypeId] = useState<number | null>(null);
  const [materialTypeId, setMaterialTypeId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1000);
  const [designName, setDesignName] = useState<string>("");
  const [length, setLength] = useState<number>(0);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [adhesiveOffset, setAdhesiveOffset] = useState<number | undefined>(undefined);
  const [sidesClassification, setSidesClassification] = useState<string | undefined>(undefined);
  const [processClassification, setProcessClassification] = useState<string | undefined>(undefined);
  const [laminationType, setLaminationType] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState<string>("");

  // API query for customers
  const { data: customersData, isLoading: loadingCustomers } = useCustomers({
    pageNumber: 1,
    pageSize: 50,
    search: debouncedCustomerSearch || undefined,
  });
  const customers = customersData?.items || [];

  // API query for design types
  const { data: designTypesData, isLoading: loadingDesignTypes } = useDesignTypes({
    page: 1,
    size: 100,
  });
  const designTypes = useMemo(() => {
    return (getDesignTypeItems(designTypesData) || []).filter(
      (dt): dt is DesignTypeResponse => !!dt.id
    ) as DesignTypeResponse[];
  }, [designTypesData]);

  // API query for material types based on selected design type
  const { data: materialsData = [], isLoading: loadingMaterials } = useMaterialsByDesignType(
    designTypeId || undefined,
    "active"
  );
  const materials = useMemo(() => {
    return (materialsData || []).filter(
      (m): m is MaterialTypeResponse => !!m.id
    ) as MaterialTypeResponse[];
  }, [materialsData]);

  const selectedDesignType = useMemo(() => {
    return designTypes.find((dt) => dt.id === designTypeId);
  }, [designTypes, designTypeId]);

  const designTypeName = selectedDesignType?.name || "";

  const isDecal = isDecalDesignType(designTypeName);
  const isTui = isTuiDesignType(designTypeName);
  const isHop = isHopDesignType(designTypeName);
  const isNhan = isNhanDesignType(designTypeName);
  const isTuiXepHong = isTuiXepHongDesignType(designTypeName);
  const isDecalCuon = isDecalCuonDesignType(designTypeName);
  const isTuiCuon = isTuiCuonDesignType(designTypeName);

  const selectedMaterial = useMemo(() => {
    return materials.find((m) => m.id === materialTypeId);
  }, [materials, materialTypeId]);

  const materialName = selectedMaterial?.name || "";
  const isTheTreo = materialName.toLowerCase().includes("thẻ treo") || materialName.toLowerCase().includes("the treo");

  // Determine visibility rules
  const needsWidth = isHop || isTuiXepHong;
  const needsAdhesiveOffset = (isNhan || isDecal) && !isHop && !isTuiXepHong;

  const shouldShowSidesClassification =
    isDecal || (isTheTreo && isNhan) || isDecalCuon || isTuiCuon;

  const shouldShowProcessClassification =
    isDecal || isHop || (isNhan && !isTheTreo) || (isTui && !isTuiXepHong) || isTuiXepHong;

  // Auto-set classifications based on design type rules
  useEffect(() => {
    if (!designTypeId) return;

    if (isHop) {
      setProcessClassification("die_cut");
      setSidesClassification("one_side");
    } else if (isNhan && !isTheTreo) {
      setProcessClassification("cut");
      setSidesClassification("one_side");
    } else if (isTheTreo && isNhan) {
      setProcessClassification("cut");
    } else if (isDecal && !isDecalCuon) {
      setProcessClassification("die_cut");
      setSidesClassification("one_side");
    } else if (isTui && !isTuiXepHong && !isTuiCuon) {
      setProcessClassification("cut");
      setSidesClassification("two_side");
    } else if (isTuiXepHong) {
      setProcessClassification("die_cut");
      setSidesClassification("two_side");
    } else if (isDecalCuon) {
      setProcessClassification(undefined);
      setSidesClassification("one_side");
    } else if (isTuiCuon) {
      setProcessClassification(undefined);
      setSidesClassification("two_side");
    }
  }, [designTypeId, isTheTreo, isNhan, isHop, isDecal, isDecalCuon, isTui, isTuiXepHong, isTuiCuon]);

  // Reset material and lamination type if design type changes
  useEffect(() => {
    setMaterialTypeId(null);
    setLaminationType(undefined);
  }, [designTypeId]);

  // Lamination types allowed
  const allowedLaminationOptions = useMemo(() => {
    return Object.entries(ENTITY_CONFIG.laminationTypes.values).filter(([key]) => {
      if (isNhan || isDecal) {
        return key === "glossy" || key === "matte" || key === "none";
      }
      return key === "glossy" || key === "matte";
    });
  }, [isNhan, isDecal]);

  // Mutation for creating design standalone
  const { mutateAsync: createDesign, loading: isCreating } = useCreateDesign();

  const handleCustomerSelect = (customer: CustomerSummaryResponse) => {
    setSelectedCustomer(customer);
    setCustomerComboOpen(false);
    setCustomerSearch("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomer) {
      toast.error("Vui lòng chọn khách hàng");
      return;
    }
    if (!designTypeId) {
      toast.error("Vui lòng chọn loại thiết kế");
      return;
    }
    if (!materialTypeId) {
      toast.error("Vui lòng chọn chất liệu");
      return;
    }
    if (!designName.trim()) {
      toast.error("Vui lòng nhập tên thiết kế");
      return;
    }
    if (!quantity || quantity <= 0) {
      toast.error("Vui lòng nhập số lượng hợp lệ");
      return;
    }
    if (!laminationType) {
      toast.error("Vui lòng chọn loại cán màng");
      return;
    }

    try {
      await createDesign({
        customerId: selectedCustomer.id!,
        designTypeId: designTypeId,
        materialTypeId: materialTypeId,
        quantity: quantity,
        designName: designName.trim(),
        length: length || 0,
        width: needsWidth ? width || 0 : undefined,
        height: height || 0,
        adhesiveOffset: needsAdhesiveOffset ? adhesiveOffset : undefined,
        sidesClassification: sidesClassification || null,
        processClassification: processClassification || null,
        laminationType: laminationType,
        notes: notes.trim() || undefined,
      });

      // Clear state and close
      setSelectedCustomer(null);
      setDesignTypeId(null);
      setMaterialTypeId(null);
      setQuantity(1000);
      setDesignName("");
      setLength(0);
      setWidth(0);
      setHeight(0);
      setAdhesiveOffset(undefined);
      setSidesClassification(undefined);
      setProcessClassification(undefined);
      setLaminationType(undefined);
      setNotes("");

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      // Error handled by mutation hook toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-background/95 backdrop-blur-md border border-border/60 shadow-2xl rounded-2xl">
        <DialogHeader className="pb-3 border-b border-border/40">
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
            Tạo thiết kế độc lập mới
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto py-4 px-1 space-y-5 text-sm">
          {/* 1. Customer Selector */}
          <div className="space-y-2">
            <Label className="font-semibold text-foreground flex items-center gap-1">
              Khách hàng <span className="text-destructive">*</span>
            </Label>
            <Popover open={customerComboOpen} onOpenChange={setCustomerComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between bg-background border-border/80 h-11 px-3 text-left font-normal"
                >
                  <span className="truncate">
                    {selectedCustomer
                      ? `${selectedCustomer.name ?? ""} - ${selectedCustomer.code ?? ""}` +
                        (selectedCustomer.companyName ? ` (${selectedCustomer.companyName})` : "")
                      : "Tìm và chọn khách hàng..."}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover border border-border" align="start">
                <Command shouldFilter={false} className="w-full">
                  <CommandInput
                    placeholder="Tìm theo tên hoặc mã khách hàng..."
                    className="h-9 text-sm w-full"
                    value={customerSearch}
                    onValueChange={setCustomerSearch}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {loadingCustomers ? (
                        <div className="flex items-center justify-center py-2 text-xs text-muted-foreground gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" /> Đang tải...
                        </div>
                      ) : (
                        "Không tìm thấy khách hàng"
                      )}
                    </CommandEmpty>
                    <CommandGroup>
                      {customers.map((customer) => (
                        <CommandItem
                          key={customer.id}
                          value={customer.id.toString()}
                          onSelect={() => handleCustomerSelect(customer)}
                          className="py-2 text-sm cursor-pointer hover:bg-accent"
                        >
                          <Check
                            className={`mr-2 h-4 w-4 shrink-0 ${
                              selectedCustomer?.id === customer.id ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{customer.name}</span>
                            <span className="text-xs text-muted-foreground">
                              Mã: {customer.code} {customer.companyName ? `· ${customer.companyName}` : ""}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 2. Design Type Selector */}
            <div className="space-y-2">
              <Label className="font-semibold text-foreground">
                Loại thiết kế <span className="text-destructive">*</span>
              </Label>
              <Select
                value={designTypeId ? designTypeId.toString() : ""}
                onValueChange={(v) => setDesignTypeId(Number(v))}
              >
                <SelectTrigger className="h-11 bg-background border-border/80">
                  <SelectValue placeholder="Chọn loại thiết kế..." />
                </SelectTrigger>
                <SelectContent>
                  {loadingDesignTypes ? (
                    <div className="p-2 text-center text-xs text-muted-foreground">Đang tải...</div>
                  ) : (
                    designTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()} className="text-sm">
                        <div className="flex items-center justify-between w-full">
                          <span>{type.name}</span>
                          <Badge variant="secondary" className="text-[10px] font-mono ml-2 py-0">
                            {type.code}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* 3. Material Type Selector */}
            <div className="space-y-2">
              <Label className="font-semibold text-foreground">
                Chất liệu <span className="text-destructive">*</span>
              </Label>
              <Select
                value={materialTypeId ? materialTypeId.toString() : ""}
                onValueChange={(v) => setMaterialTypeId(Number(v))}
                disabled={!designTypeId || loadingMaterials}
              >
                <SelectTrigger className="h-11 bg-background border-border/80">
                  <SelectValue
                    placeholder={
                      !designTypeId ? "Vui lòng chọn loại thiết kế trước" : "Chọn chất liệu..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {loadingMaterials ? (
                    <div className="p-2 text-center text-xs text-muted-foreground">Đang tải...</div>
                  ) : materials.length === 0 ? (
                    <div className="p-2 text-center text-xs text-muted-foreground">Không tìm thấy chất liệu</div>
                  ) : (
                    materials.map((mat) => (
                      <SelectItem key={mat.id} value={mat.id.toString()} className="text-sm">
                        <div className="flex flex-col text-left">
                          <span className="font-medium">{mat.name}</span>
                          {mat.description && (
                            <span className="text-xs text-muted-foreground truncate max-w-[250px]">
                              {mat.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 4. Design Name */}
          <div className="space-y-2">
            <Label className="font-semibold text-foreground">
              Tên thiết kế <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="VD: Hộp giấy carton đựng trái cây"
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
              className="h-11 border-border/80 bg-background"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 5. Dimensions */}
            <div className="space-y-2">
              <Label className="font-semibold text-foreground">Kích thước (Dài x Cao {needsWidth && "x Rộng"}) (mm)</Label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Dài *</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Dài"
                    value={length || ""}
                    onChange={(e) => setLength(e.target.value === "" ? 0 : Number(e.target.value))}
                    className="h-11 bg-background"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Cao *</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Cao"
                    value={height || ""}
                    onChange={(e) => setHeight(e.target.value === "" ? 0 : Number(e.target.value))}
                    className="h-11 bg-background"
                  />
                </div>
                {needsWidth ? (
                  <div>
                    <Label className="text-xs text-muted-foreground">Rộng *</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="Rộng"
                      value={width || ""}
                      onChange={(e) => setWidth(e.target.value === "" ? 0 : Number(e.target.value))}
                      className="h-11 bg-background"
                    />
                  </div>
                ) : needsAdhesiveOffset ? (
                  <div>
                    <Label className="text-xs text-muted-foreground">Mép dán</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="Mép dán"
                      value={adhesiveOffset !== undefined ? adhesiveOffset : ""}
                      onChange={(e) =>
                        setAdhesiveOffset(e.target.value === "" ? undefined : Number(e.target.value))
                      }
                      className="h-11 bg-background"
                    />
                  </div>
                ) : (
                  <div className="invisible" />
                )}
              </div>
            </div>

            {/* 6. Quantity */}
            <div className="space-y-2">
              <Label className="font-semibold text-foreground flex items-center justify-between">
                <span>Số lượng *</span>
                {selectedMaterial?.minimumQuantity ? (
                  <span className="text-[11px] text-indigo-500 font-normal">
                    (Tối thiểu: {selectedMaterial.minimumQuantity.toLocaleString("vi-VN")})
                  </span>
                ) : null}
              </Label>
              <Input
                type="number"
                min="1"
                placeholder="Số lượng sản phẩm"
                value={quantity || ""}
                onChange={(e) => setQuantity(e.target.value === "" ? 0 : Number(e.target.value))}
                className="h-11 bg-background"
              />
            </div>
          </div>

          {/* 7. Classifications (Sides, Process, Lamination) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-border/40 pt-4">
            {/* Lamination type (Always show) */}
            <div className="space-y-2">
              <Label className="font-semibold text-foreground">
                Cán màng <span className="text-destructive">*</span>
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {allowedLaminationOptions.map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setLaminationType(key)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                      laminationType === key
                        ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                        : "border-border/80 bg-background hover:bg-accent text-muted-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sides classification */}
            <div className="space-y-2">
              <Label className="font-semibold text-foreground">Số mặt in</Label>
              {shouldShowSidesClassification && ((isTheTreo && isNhan) || (isDecal && !isDecalCuon)) ? (
                <div className="flex gap-1.5">
                  {Object.entries(ENTITY_CONFIG.sidesClassification.values).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSidesClassification(key)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                        sidesClassification === key
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border/80 bg-background hover:bg-accent text-muted-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center h-8 gap-1 text-xs font-semibold text-muted-foreground bg-muted/60 px-2 py-1 rounded-md border border-border/40">
                  <Badge variant="outline" className="text-[11px] bg-background">
                    {sidesClassification
                      ? ENTITY_CONFIG.sidesClassification.values[
                          sidesClassification as keyof typeof ENTITY_CONFIG.sidesClassification.values
                        ]
                      : "—"}
                  </Badge>
                  <span className="text-[10px] font-normal">(Tự động)</span>
                </div>
              )}
            </div>

            {/* Process classification */}
            <div className="space-y-2">
              <Label className="font-semibold text-foreground">Quy trình sản xuất</Label>
              {isDecal && !isDecalCuon ? (
                <div className="flex gap-1.5">
                  {Object.entries(ENTITY_CONFIG.processClassification.values).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setProcessClassification(key)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                        processClassification === key
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border/80 bg-background hover:bg-accent text-muted-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center h-8 gap-1 text-xs font-semibold text-muted-foreground bg-muted/60 px-2 py-1 rounded-md border border-border/40">
                  <Badge variant="outline" className="text-[11px] bg-background">
                    {processClassification
                      ? ENTITY_CONFIG.processClassification.values[
                          processClassification as keyof typeof ENTITY_CONFIG.processClassification.values
                        ]
                      : "—"}
                  </Badge>
                  <span className="text-[10px] font-normal">(Tự động)</span>
                </div>
              )}
            </div>
          </div>

          {/* 8. Notes */}
          <div className="space-y-2">
            <Label className="font-semibold text-foreground">Ghi chú thiết kế</Label>
            <Textarea
              placeholder="Yêu cầu chi tiết về màu sắc, thiết kế, quy cách gia công, hoặc các ghi chú khác..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px] bg-background resize-none border-border/80"
            />
          </div>
        </form>

        <DialogFooter className="pt-3 border-t border-border/40 gap-2 shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Hủy bỏ
          </Button>
          <Button onClick={handleSave} disabled={isCreating} className="font-semibold">
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tạo...
              </>
            ) : (
              "Tạo thiết kế"
            )}
          </Button>
        </DialogFooter>
        </DialogContent>
      </Dialog>
    );
}
