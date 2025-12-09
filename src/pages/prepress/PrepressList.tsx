"use client";

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Search,
  Plus,
  Printer,
  Package,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  ImageIcon,
  Layers,
} from "lucide-react";
import { toast } from "@/hooks";
import { useDebounce } from "use-debounce";
import {
  useProofingOrders,
  useAvailableDesignsForProofing,
  useCreateProofingOrderFromDesigns,
} from "@/hooks/use-proofing-order";
import { ProofingOrderResponsePagedResponseSchema } from "@/Schema/proofing-order.schema";
import { DesignResponseSchema } from "@/Schema/design.schema";
import { ProofingOrderListParamsSchema } from "@/Schema/params.schema";
import { safeParseSchema } from "@/Schema";
import { StatusBadge } from "@/components/ui/status-badge";
import { proofingStatusLabels } from "@/lib/status-utils";

type ProofingOrder =
  import("@/Schema/proofing-order.schema").ProofingOrderResponse;
type Design = import("@/Schema/design.schema").DesignResponse;

export default function ProofingOrdersPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"orders" | "available">("orders");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMaterialType, setSelectedMaterialType] =
    useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const [selectedDesigns, setSelectedDesigns] = useState<number[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [debouncedSearch] = useDebounce(searchTerm, 300);

  const queryParams = useMemo(() => {
    const raw = {
      status: selectedStatus === "all" ? null : selectedStatus,
    };
    const parsed = ProofingOrderListParamsSchema.safeParse(raw);
    return parsed.success ? parsed.data : {};
  }, [selectedStatus]);

  const {
    data: ordersResp,
    isLoading: loadingOrders,
    error: ordersError,
  } = useProofingOrders(queryParams);

  const parsedOrdersResp = safeParseSchema(
    ProofingOrderResponsePagedResponseSchema,
    ordersResp
  );
  const proofingOrders: ProofingOrder[] = parsedOrdersResp?.items ?? [];

  const materialTypeIdFilter =
    selectedMaterialType === "all" ? undefined : Number(selectedMaterialType);
  const {
    data: availableDesignsResp,
    isLoading: loadingDesigns,
    error: designsError,
  } = useAvailableDesignsForProofing(materialTypeIdFilter);

  const availableDesigns = useMemo(() => {
    const list = availableDesignsResp ?? [];
    return list.filter((d) => !!safeParseSchema(DesignResponseSchema, d));
  }, [availableDesignsResp]);

  const { mutate: createFromDesigns } = useCreateProofingOrderFromDesigns();

  const materialTypes = useMemo(
    () =>
      Array.from(
        new Map(
          (availableDesigns ?? [])
            .filter((d) => d.materialType?.id)
            .map((d) => [d.materialType!.id, d.materialType!])
        ).values()
      ),
    [availableDesigns]
  );

  const filteredAvailableDesigns = useMemo(
    () =>
      availableDesigns.filter((design) => {
        const matchSearch =
          design.code?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          design.designName
            ?.toLowerCase()
            .includes(debouncedSearch.toLowerCase());

        const matchMaterial =
          selectedMaterialType === "all" ||
          design.materialType.id.toString() === selectedMaterialType;

        return matchSearch && matchMaterial;
      }),
    [availableDesigns, debouncedSearch, selectedMaterialType]
  );

  const filteredProofingOrders = useMemo(
    () =>
      proofingOrders.filter((order) => {
        const matchSearch =
          order.code?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          order.materialType?.name
            ?.toLowerCase()
            .includes(debouncedSearch.toLowerCase());

        const matchMaterial =
          selectedMaterialType === "all" ||
          order.materialType?.id?.toString() === selectedMaterialType;

        const matchStatus =
          selectedStatus === "all" || order.status === selectedStatus;

        return matchSearch && matchMaterial && matchStatus;
      }),
    [proofingOrders, debouncedSearch, selectedMaterialType, selectedStatus]
  );

  const handleDesignSelect = (designId: number, materialTypeId: number) => {
    const currentMaterialType =
      selectedDesigns.length > 0
        ? availableDesigns.find((d) => d.id === selectedDesigns[0])
            ?.materialType.id
        : null;

    if (currentMaterialType && currentMaterialType !== materialTypeId) {
      toast({
        variant: "warning",
        title: "Không thể chọn",
        description: "Chỉ có thể chọn các design có cùng loại chất liệu",
      });
      return;
    }

    setSelectedDesigns((prev) =>
      prev.includes(designId)
        ? prev.filter((id) => id !== designId)
        : [...prev, designId]
    );
  };

  const handleCreateProofingOrder = async () => {
    if (selectedDesigns.length === 0) {
      toast({
        variant: "warning",
        title: "Chưa chọn design",
        description: "Vui lòng chọn ít nhất một design để tạo lệnh bình bài",
      });
      return;
    }

    try {
      await createFromDesigns({ designIds: selectedDesigns, notes });
      setSelectedDesigns([]);
      setNotes("");
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast({
        variant: "warning",
        title: "Lỗi",
        description: "Không thể tạo lệnh bình bài",
      });
    }
  };

  const stats = useMemo(
    () => ({
      totalOrders: proofingOrders.length,
      waiting: proofingOrders.filter((o) => o.status === "waiting_for_file")
        .length,
      inProgress: proofingOrders.filter((o) => o.status === "in_progress")
        .length,
      completed: proofingOrders.filter(
        (o) => o.status === "completed" || o.status === "done"
      ).length,
    }),
    [proofingOrders]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Quản lý Bình bài</h1>
          <p className="text-muted-foreground text-pretty">
            Quản lý lệnh bình bài và chọn design để tạo lệnh mới
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng lệnh</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Tất cả lệnh bình bài
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chờ xử lý</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.waiting}</div>
            <p className="text-xs text-muted-foreground">Đang chờ file</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang xử lý</CardTitle>
            <Printer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Đang bình bài</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoàn thành</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Đã hoàn thành</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "orders" | "available")}
          >
            <div className="flex items-center justify-between mb-6">
              <TabsList>
                <TabsTrigger value="orders" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Lệnh bình bài
                </TabsTrigger>
                <TabsTrigger value="available" className="gap-2">
                  <Layers className="h-4 w-4" />
                  Design có thể tạo lệnh
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={
                      activeTab === "orders"
                        ? "Tìm theo mã lệnh..."
                        : "Tìm theo mã design..."
                    }
                    className="pl-10 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Material Type Filter */}
                <Select
                  value={selectedMaterialType}
                  onValueChange={setSelectedMaterialType}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Loại chất liệu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả chất liệu</SelectItem>
                    {materialTypes.map((mt) => (
                      <SelectItem key={mt.id} value={mt.id.toString()}>
                        {mt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Status Filter - only for orders tab */}
                {activeTab === "orders" && (
                  <Select
                    value={selectedStatus}
                    onValueChange={setSelectedStatus}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="waiting_for_file">Chờ file</SelectItem>
                      <SelectItem value="in_progress">Đang xử lý</SelectItem>
                      <SelectItem value="completed">Hoàn thành</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Tab 1: Proofing Orders List */}
            <TabsContent value="orders" className="mt-0">
              {loadingOrders ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Đang tải lệnh bình bài...
                  </p>
                </div>
              ) : ordersError ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-red-500 mx-auto mb-3" />
                  <p className="text-sm text-red-600">
                    Không thể tải lệnh bình bài
                  </p>
                </div>
              ) : filteredProofingOrders.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Không tìm thấy lệnh bình bài nào
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mã lệnh</TableHead>
                        <TableHead>Chất liệu</TableHead>
                        <TableHead>Số lượng design</TableHead>
                        <TableHead>Tổng số lượng</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Người tạo</TableHead>
                        <TableHead>Ngày tạo</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProofingOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            {order.code}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {order.materialType?.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {order.materialType?.code}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {order.proofingOrderDesigns?.length ?? 0}
                          </TableCell>
                          <TableCell>
                            {order.totalQuantity.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              status={order.status}
                              label={
                                proofingStatusLabels[order.status] ||
                                order.status
                              }
                            />
                          </TableCell>
                          <TableCell>{order.createdBy.fullName}</TableCell>
                          <TableCell>
                            {new Date(order.createdAt).toLocaleDateString(
                              "vi-VN"
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2"
                              onClick={() => navigate(`/proofing/${order.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                              Xem
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Tab 2: Available Designs */}
            <TabsContent value="available" className="mt-0">
              <div className="space-y-4">
                {/* Action bar */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={
                        selectedDesigns.length ===
                          filteredAvailableDesigns.length &&
                        filteredAvailableDesigns.length > 0
                      }
                      onCheckedChange={(checked) => {
                        if (checked) {
                          // Check if all designs have same material type
                          const firstMaterialType =
                            filteredAvailableDesigns[0]?.materialType.id;
                          const allSameMaterial =
                            filteredAvailableDesigns.every(
                              (d) => d.materialType.id === firstMaterialType
                            );

                          if (allSameMaterial) {
                            setSelectedDesigns(
                              filteredAvailableDesigns.map((d) => d.id)
                            );
                          } else {
                            toast({
                              variant: "warning",
                              title: "Không thể chọn tất cả",
                              description:
                                "Các design phải có cùng loại chất liệu",
                            });
                          }
                        } else {
                          setSelectedDesigns([]);
                        }
                      }}
                    />
                    <span className="text-sm font-medium">
                      Đã chọn {selectedDesigns.length} design
                    </span>
                  </div>
                  <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    disabled={selectedDesigns.length === 0}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Tạo lệnh bình bài ({selectedDesigns.length})
                  </Button>
                </div>

                {/* Designs grid */}
                {loadingDesigns ? (
                  <div className="text-center py-12">
                    <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Đang tải design...
                    </p>
                  </div>
                ) : designsError ? (
                  <div className="text-center py-12">
                    <Layers className="h-12 w-12 text-red-500 mx-auto mb-3" />
                    <p className="text-sm text-red-600">
                      Không thể tải danh sách design
                    </p>
                  </div>
                ) : filteredAvailableDesigns.length === 0 ? (
                  <div className="text-center py-12">
                    <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Không tìm thấy design nào phù hợp
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAvailableDesigns.map((design) => (
                      <Card
                        key={design.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedDesigns.includes(design.id)
                            ? "ring-2 ring-primary shadow-md"
                            : ""
                        }`}
                        onClick={() =>
                          handleDesignSelect(design.id, design.materialType.id)
                        }
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={selectedDesigns.includes(design.id)}
                              onCheckedChange={() =>
                                handleDesignSelect(
                                  design.id,
                                  design.materialType.id
                                )
                              }
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex-1 min-w-0">
                              {/* Design image */}
                              {design.designImageUrl ? (
                                <div className="w-full h-32 bg-muted rounded-md mb-3 overflow-hidden">
                                  <img
                                    src={
                                      design.designImageUrl ||
                                      "/placeholder.svg"
                                    }
                                    alt={design.designName}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-full h-32 bg-muted rounded-md mb-3 flex items-center justify-center">
                                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}

                              <div className="space-y-2">
                                <div>
                                  <p className="font-semibold text-sm truncate">
                                    {design.designName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {design.code}
                                  </p>
                                </div>

                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">
                                    SL:
                                  </span>
                                  <span className="font-medium">
                                    {design.quantity.toLocaleString()}
                                  </span>
                                </div>

                                {design.dimensions && (
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">
                                      Kích thước:
                                    </span>
                                    <span className="font-medium">
                                      {design.dimensions}
                                    </span>
                                  </div>
                                )}

                                <div className="pt-2 border-t">
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {design.materialType.name}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Proofing Order Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tạo lệnh bình bài mới</DialogTitle>
            <DialogDescription>
              Tạo lệnh bình bài từ {selectedDesigns.length} design đã chọn
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Design đã chọn ({selectedDesigns.length})</Label>
              <div className="max-h-40 overflow-y-auto space-y-2 p-3 bg-muted/50 rounded-lg">
                {selectedDesigns.map((designId) => {
                  const design = availableDesigns.find(
                    (d) => d.id === designId
                  );
                  if (!design) return null;
                  return (
                    <div
                      key={designId}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="font-medium">{design.code}</span>
                      <span className="text-muted-foreground">
                        {design.designName}
                      </span>
                      <span className="text-xs">SL: {design.quantity}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea
                id="notes"
                placeholder="Nhập ghi chú cho lệnh bình bài..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button onClick={handleCreateProofingOrder} className="gap-2">
              <Plus className="h-4 w-4" />
              {"Tạo lệnh bình bài"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
