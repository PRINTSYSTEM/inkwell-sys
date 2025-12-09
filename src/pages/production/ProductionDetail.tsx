import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Factory,
  PlayCircle,
  CheckCircle,
  Edit,
  UserIcon,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { productionStatusLabels } from "@/lib/status-utils";
import {
  useProduction,
  useStartProduction,
  useUpdateProduction,
  useCompleteProduction,
} from "@/hooks/use-production";
import { IdSchema } from "@/Schema/common";

export default function ProductionDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);

  // Form states
  const [startNotes, setStartNotes] = useState("");
  const [progressPercent, setProgressPercent] = useState("0");
  const [wastage, setWastage] = useState("0");
  const [defectNotes, setDefectNotes] = useState("");
  const [completeNotes, setCompleteNotes] = useState("");

  const idValue = params.id ? Number(params.id) : Number.NaN;
  const idValid = IdSchema.safeParse(idValue).success;

  const {
    data: production,
    isLoading,
    error,
  } = useProduction(idValid ? idValue : null, idValid);

  const { mutate: startProduction, isPending: starting } = useStartProduction();
  const { mutate: updateProduction, isPending: updating } =
    useUpdateProduction();
  const { mutate: completeProduction, isPending: completing } =
    useCompleteProduction();

  useEffect(() => {
    if (production) {
      setProgressPercent(production.progressPercent?.toString() || "0");
      setDefectNotes(production.defectNotes || "");
      setWastage(
        production.wastage !== undefined && production.wastage !== null
          ? production.wastage.toString()
          : "0"
      );
    }
  }, [production]);

  const handleStartProduction = async () => {
    if (!production?.id) return;
    try {
      await startProduction({
        id: production.id,
        data: { notes: startNotes || undefined },
      });
      setIsStartDialogOpen(false);
      setStartNotes("");
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleUpdateProgress = async () => {
    if (!production?.id) return;

    const progressValue =
      progressPercent.trim() === "" ? 0 : Number(progressPercent);
    const wastageValue = wastage.trim() === "" ? 0 : Number(wastage);

    try {
      await updateProduction({
        id: production.id,
        data: {
          progressPercent: progressValue,
          defectNotes: defectNotes || undefined,
          wastage: wastageValue,
        },
      });
      setIsUpdateDialogOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleCompleteProduction = async () => {
    if (!production?.id) return;

    const wastageValue = wastage.trim() === "" ? 0 : Number(wastage);

    try {
      await completeProduction({
        id: production.id,
        data: {
          notes: completeNotes || undefined,
          defectNotes: defectNotes || undefined,
          wastage: wastageValue,
        },
      });
      setIsCompleteDialogOpen(false);
      setCompleteNotes("");
    } catch (error) {
      // Error handled by hook
    }
  };

  const formatDateTime = (dateStr?: string | null) =>
    dateStr
      ? new Date(dateStr).toLocaleString("vi-VN", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "Chưa cập nhật";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!production || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-lg font-medium">Không tìm thấy đơn sản xuất</p>
            <Button
              onClick={() => navigate("/productions")}
              className="mt-4"
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/productions")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-balance">
              Chi tiết đơn sản xuất
            </h1>
            <p className="text-muted-foreground text-pretty">
              ID đơn: {production.id ?? "N/A"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge
            status={production.status || "pending"}
            label={
              productionStatusLabels[production.status || "pending"] ||
              production.status ||
              "N/A"
            }
          />

          {production.status === "pending" && (
            <Button
              className="gap-2"
              onClick={() => setIsStartDialogOpen(true)}
              disabled={starting}
            >
              <PlayCircle className="h-4 w-4" />
              {starting ? "Đang xử lý..." : "Bắt đầu sản xuất"}
            </Button>
          )}

          {production.status === "in_progress" && (
            <>
              <Button
                variant="outline"
                className="gap-2 bg-transparent"
                onClick={() => setIsUpdateDialogOpen(true)}
                disabled={updating}
              >
                <Edit className="h-4 w-4" />
                Cập nhật tiến độ
              </Button>
              <Button
                className="gap-2"
                onClick={() => setIsCompleteDialogOpen(true)}
                disabled={completing}
              >
                <CheckCircle className="h-4 w-4" />
                Hoàn thành
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Production Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5" />
                Thông tin sản xuất
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">
                    ID đơn sản xuất
                  </Label>
                  <p className="font-semibold text-lg">
                    {production.id ?? "N/A"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">
                    ID lệnh bình bài
                  </Label>
                  <p className="font-medium">
                    {production.proofingOrderId ?? "N/A"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">
                    ID người phụ trách
                  </Label>
                  <p className="font-medium">
                    {production.productionLeadId ?? "Chưa phân công"}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground text-xs">
                    Tiến độ sản xuất
                  </Label>
                  <span className="text-sm font-semibold">
                    {production.progressPercent || 0}%
                  </span>
                </div>
                <Progress
                  value={production.progressPercent || 0}
                  className="h-3"
                />
              </div>

              <Separator />

              {production.wastage !== undefined &&
                production.wastage !== null &&
                production.wastage > 0 && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">
                        Hao hụt
                      </Label>
                      <p className="text-sm font-medium text-orange-600">
                        {production.wastage} đơn vị
                      </p>
                    </div>
                    <Separator />
                  </>
                )}

              {production.defectNotes && (
                <>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">
                      Ghi chú lỗi
                    </Label>
                    <p className="text-sm text-red-600">
                      {production.defectNotes}
                    </p>
                  </div>
                  <Separator />
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Info */}
        <div className="space-y-6">
          {/* People Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Người phụ trách
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">
                    {production.productionLead?.fullName ||
                      "Chưa phân công người phụ trách"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {production.productionLead?.email || "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Thời gian
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">
                  Ngày tạo
                </Label>
                <p className="text-sm font-medium">
                  {formatDateTime(production.createdAt)}
                </p>
              </div>

              {production.startedAt && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">
                      Bắt đầu sản xuất
                    </Label>
                    <p className="text-sm font-medium">
                      {formatDateTime(production.startedAt)}
                    </p>
                  </div>
                </>
              )}

              {production.completedAt && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">
                      Hoàn thành
                    </Label>
                    <p className="text-sm font-medium">
                      {formatDateTime(production.completedAt)}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Start Production Dialog */}
      <Dialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bắt đầu sản xuất</DialogTitle>
            <DialogDescription>
              Xác nhận bắt đầu quá trình sản xuất
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Ghi chú (tùy chọn)</Label>
              <Textarea
                placeholder="Nhập ghi chú khi bắt đầu sản xuất..."
                value={startNotes}
                onChange={(e) => setStartNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStartDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button onClick={handleStartProduction} disabled={starting}>
              <PlayCircle className="h-4 w-4 mr-2" />
              {starting ? "Đang xử lý..." : "Bắt đầu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Progress Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật tiến độ</DialogTitle>
            <DialogDescription>
              Cập nhật tiến độ sản xuất và ghi chú
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tiến độ (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={progressPercent}
                onChange={(e) => setProgressPercent(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Hao hụt (tùy chọn)</Label>
              <Input
                type="number"
                min="0"
                value={wastage}
                onChange={(e) => setWastage(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Ghi chú lỗi (tùy chọn)</Label>
              <Textarea
                placeholder="Ghi chú về lỗi hoặc vấn đề..."
                value={defectNotes}
                onChange={(e) => setDefectNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUpdateDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button onClick={handleUpdateProgress} disabled={updating}>
              <Edit className="h-4 w-4 mr-2" />
              {updating ? "Đang cập nhật..." : "Cập nhật"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Production Dialog */}
      <Dialog
        open={isCompleteDialogOpen}
        onOpenChange={setIsCompleteDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hoàn thành sản xuất</DialogTitle>
            <DialogDescription>
              Xác nhận hoàn thành quá trình sản xuất
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Hao hụt cuối cùng</Label>
              <Input
                type="number"
                min="0"
                value={wastage}
                onChange={(e) => setWastage(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Ghi chú lỗi (nếu có)</Label>
              <Textarea
                placeholder="Ghi chú về lỗi hoặc vấn đề cuối cùng..."
                value={defectNotes}
                onChange={(e) => setDefectNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Ghi chú hoàn thành (tùy chọn)</Label>
              <Textarea
                placeholder="Ghi chú thêm khi hoàn thành đơn sản xuất..."
                value={completeNotes}
                onChange={(e) => setCompleteNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCompleteDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button onClick={handleCompleteProduction} disabled={completing}>
              <CheckCircle className="h-4 w-4 mr-2" />
              {completing ? "Đang xử lý..." : "Hoàn thành"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
