import React, { useState } from "react";
import {
  useSystemSettings,
  useUpdateSystemSetting,
} from "@/hooks/use-system-setting";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
} from "@/components/ui";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Search,
  Settings,
  Edit2,
  Lock,
  Calendar,
  User,
  RefreshCw,
  Building2,
  Percent,
  Sliders,
} from "lucide-react";
import { SystemSettingFormDialog } from "./components/SystemSettingFormDialog";
import type { SystemSettingResponse } from "@/Schema";

export default function AdminSettings() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState<"all" | "finance" | "prefix" | "other">("all");
  const [editingSetting, setEditingSetting] = useState<SystemSettingResponse | null>(null);

  const { data: settings = [], isLoading, isError, refetch } = useSystemSettings();
  const { mutateAsync: updateSetting, isPending: isUpdating } = useUpdateSystemSetting();

  // Handle Search and Tab Filters
  const filteredSettings = settings.filter((s) => {
    // 1. Search term match (Key, Description, Value)
    const matchesSearch =
      s.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.value.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // 2. Category Tab match
    if (selectedTab === "all") return true;
    if (selectedTab === "finance") {
      return s.key.toLowerCase().includes("vat") || s.key.toLowerCase().includes("price") || s.key.toLowerCase().includes("tax");
    }
    if (selectedTab === "prefix") {
      return s.key.toLowerCase().includes("prefix") || s.key.toLowerCase().includes("code");
    }
    if (selectedTab === "other") {
      const isFinance = s.key.toLowerCase().includes("vat") || s.key.toLowerCase().includes("price") || s.key.toLowerCase().includes("tax");
      const isPrefix = s.key.toLowerCase().includes("prefix") || s.key.toLowerCase().includes("code");
      return !isFinance && !isPrefix;
    }

    return true;
  });

  const handleUpdate = async (key: string, value: string, description: string) => {
    try {
      await updateSetting({ key, payload: { value, description } });
    } catch (error) {
      // Hook handles showing toast error
    }
  };

  // Helper to format values elegantly (e.g. VAT percent)
  const formatValueDisplay = (setting: SystemSettingResponse) => {
    if (setting.key === "DefaultVatRate") {
      const val = Number(setting.value);
      if (!isNaN(val)) {
        return (
          <div className="flex items-center gap-1.5 font-mono">
            <span className="font-semibold text-foreground bg-slate-100 px-2 py-0.5 rounded border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
              {setting.value}
            </span>
            <span className="text-xs text-green-600 font-semibold bg-green-50 px-1.5 py-0.5 rounded border border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900">
              {(val * 100).toFixed(0)}%
            </span>
          </div>
        );
      }
    }
    return (
      <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200 dark:bg-slate-800 dark:border-slate-700 font-semibold text-foreground text-sm">
        {setting.value}
      </span>
    );
  };

  // Format date helper
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  // Helper to get audit modifier name
  const getModifierName = (modifier: any) => {
    if (!modifier) return "";
    if (typeof modifier === "string") return modifier;
    if (typeof modifier === "object") {
      return modifier.fullName || modifier.username || "";
    }
    return "";
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="h-10 w-64 bg-slate-200 animate-pulse rounded" />
          <div className="h-10 w-24 bg-slate-200 animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-lg border" />
          ))}
        </div>
        <div className="h-96 bg-slate-100 animate-pulse rounded-lg border" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto py-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-destructive">Lỗi tải thiết lập hệ thống</h2>
        <p className="text-muted-foreground text-sm">Không thể kết nối với máy chủ. Vui lòng tải lại trang.</p>
        <Button onClick={() => refetch()} className="mx-auto flex items-center gap-2">
          <RefreshCw className="h-4 w-4" /> Tải lại
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-2">
            <Settings className="h-8 w-8 text-primary" /> Thiết lập hệ thống
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Quản lý các thông số cấu hình hoạt động của toàn bộ hệ thống in ấn và đơn hàng.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="flex items-center gap-1.5 self-start sm:self-center"
        >
          <RefreshCw className="h-4 w-4" /> Làm mới
        </Button>
      </div>

      {/* Tabs / Filtering categories */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-px">
        <button
          onClick={() => setSelectedTab("all")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            selectedTab === "all"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Tất cả ({settings.length})
        </button>
        <button
          onClick={() => setSelectedTab("finance")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            selectedTab === "finance"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Tài chính & Thuế
        </button>
        <button
          onClick={() => setSelectedTab("prefix")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            selectedTab === "prefix"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Định dạng mã số
        </button>
        <button
          onClick={() => setSelectedTab("other")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            selectedTab === "other"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Thiết lập khác
        </button>
      </div>

      {/* Main Settings Panel */}
      <Card className="border border-border/80 bg-card shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/10 border-b border-border/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">Danh sách tham số cấu hình</CardTitle>
              <CardDescription className="text-xs">
                Tìm kiếm và thay đổi các cấu hình động.
              </CardDescription>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo Key, Value hoặc Mô tả..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                  <TableHead className="font-bold text-foreground py-3">Mã tham số (Key)</TableHead>
                  <TableHead className="font-bold text-foreground py-3">Mô tả chi tiết</TableHead>
                  <TableHead className="font-bold text-foreground py-3 min-w-[150px]">Giá trị cấu hình</TableHead>
                  <TableHead className="font-bold text-foreground py-3">Chế độ quản lý</TableHead>
                  <TableHead className="font-bold text-foreground py-3 text-right pr-6">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSettings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground text-sm font-medium">
                      Không tìm thấy thiết lập nào phù hợp.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSettings.map((setting) => (
                    <TableRow key={setting.key} className="hover:bg-slate-50/40 border-b border-border/40">
                      {/* KEY */}
                      <TableCell className="font-mono text-xs font-bold text-primary select-all py-4">
                        {setting.key}
                      </TableCell>

                      {/* DESCRIPTION */}
                      <TableCell className="text-sm text-foreground/80 max-w-sm py-4">
                        <div className="font-medium text-foreground">{setting.description || "—"}</div>
                        {/* Audit Details nested subtext */}
                        {(setting.lastModifiedAt || setting.lastModifiedBy) && (
                          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                            {setting.lastModifiedAt && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground/60" />
                                {formatDate(setting.lastModifiedAt)}
                              </span>
                            )}
                            {setting.lastModifiedBy && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3 text-muted-foreground/60" />
                                {getModifierName(setting.lastModifiedBy)}
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>

                      {/* VALUE */}
                      <TableCell className="py-4">
                        {formatValueDisplay(setting)}
                      </TableCell>

                      {/* MODE STATE */}
                      <TableCell className="py-4">
                        {setting.isEditable ? (
                          <Badge variant="outline" className="bg-blue-50/50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900 font-semibold flex items-center gap-1 w-fit">
                            <Sliders className="h-3 w-3" /> Tùy chỉnh
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-slate-200 font-semibold flex items-center gap-1 w-fit">
                            <Lock className="h-3 w-3" /> System Managed
                          </Badge>
                        )}
                      </TableCell>

                      {/* ACTIONS */}
                      <TableCell className="text-right pr-6 py-4">
                        {setting.isEditable ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingSetting(setting)}
                            className="hover:bg-primary/5 hover:text-primary hover:border-primary/40 flex items-center gap-1.5 ml-auto text-xs"
                          >
                            <Edit2 className="h-3.5 w-3.5" /> Chỉnh sửa
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground/60 italic font-medium">Chỉ xem</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Editing Form Modal */}
      {editingSetting && (
        <SystemSettingFormDialog
          open={!!editingSetting}
          onOpenChange={(open) => !open && setEditingSetting(null)}
          setting={editingSetting}
          onSubmit={handleUpdate}
          isPending={isUpdating}
        />
      )}
    </div>
  );
}
