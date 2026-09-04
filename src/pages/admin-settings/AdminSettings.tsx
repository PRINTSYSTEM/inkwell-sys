import { useState } from "react";
import {
  useSystemSettings,
  useUpdateSystemSetting,
} from "@/hooks/use-system-setting";
import { Button } from "@/components/ui/button";
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
  Sliders,
} from "lucide-react";
import { SystemSettingFormDialog } from "./components/SystemSettingFormDialog";
import type { SystemSettingResponse } from "@/Schema";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function AdminSettings() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState<"all" | "finance" | "prefix" | "other">("all");
  const [editingSetting, setEditingSetting] = useState<SystemSettingResponse | null>(null);

  const { data: settings = [], isLoading, isError, refetch } = useSystemSettings();
  const { mutateAsync: updateSetting, isPending: isUpdating } = useUpdateSystemSetting();

  // Handle Search and Tab Filters
  const filteredSettings = settings.filter((s) => {
    const matchesSearch =
      s.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.value.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

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
    } catch {
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
            <span className="font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              {setting.value}
            </span>
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/60">
              {(val * 100).toFixed(0)}% VAT
            </span>
          </div>
        );
      }
    }
    return (
      <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 text-xs">
        {setting.value || "—"}
      </span>
    );
  };

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

  const getModifierName = (modifier: any) => {
    if (!modifier) return "";
    if (typeof modifier === "string") return modifier;
    if (typeof modifier === "object") {
      return modifier.fullName || modifier.username || "";
    }
    return "";
  };

  return (
    <div className="h-full flex flex-col justify-between overflow-hidden bg-slate-50/50 dark:bg-slate-950 p-4 sm:p-5 gap-3.5 text-xs">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs shrink-0">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Settings className="h-5 w-5 text-[#93631F]" />
            Thiết Lập Hệ Thống
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Quản lý các thông số cấu hình hoạt động của toàn bộ hệ thống in ấn và đơn hàng
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-8 text-xs font-bold px-3 border-slate-200 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Toolbar & Category Tabs */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs shrink-0">
        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedTab("all")}
            className={cn(
              "px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer",
              selectedTab === "all"
                ? "bg-[#93631F] text-white shadow-2xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            Tất cả ({settings.length})
          </button>
          <button
            onClick={() => setSelectedTab("finance")}
            className={cn(
              "px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer",
              selectedTab === "finance"
                ? "bg-[#93631F] text-white shadow-2xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            Tài chính & Thuế
          </button>
          <button
            onClick={() => setSelectedTab("prefix")}
            className={cn(
              "px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer",
              selectedTab === "prefix"
                ? "bg-[#93631F] text-white shadow-2xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            Định dạng mã số
          </button>
          <button
            onClick={() => setSelectedTab("other")}
            className={cn(
              "px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer",
              selectedTab === "other"
                ? "bg-[#93631F] text-white shadow-2xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            Thiết lập khác
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Tìm theo Key, Value hoặc Mô tả..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-8 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
          />
        </div>
      </div>

      {/* Settings Table Area (Single-Screen Fit) */}
      <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          <Table className="min-w-full">
            <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-950 z-10 border-b border-slate-200 dark:border-slate-800">
              <TableRow className="bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-300">
                <TableHead className="h-10 font-bold text-slate-700 dark:text-slate-300 w-[200px]">Mã tham số (Key)</TableHead>
                <TableHead className="h-10 font-bold text-slate-700 dark:text-slate-300 w-[260px]">Mô tả chi tiết</TableHead>
                <TableHead className="h-10 font-bold text-slate-700 dark:text-slate-300 min-w-[380px]">Giá trị cấu hình</TableHead>
                <TableHead className="h-10 font-bold text-slate-700 dark:text-slate-300 w-[130px]">Chế độ quản lý</TableHead>
                <TableHead className="h-10 font-bold text-slate-700 dark:text-slate-300 text-right w-[90px] pr-4">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i} className="h-11">
                    <TableCell colSpan={5} className="py-2">
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-rose-500 font-medium">
                    Không thể tải thiết lập hệ thống. Vui lòng thử lại.
                  </TableCell>
                </TableRow>
              ) : filteredSettings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                    <Settings className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Không tìm thấy tham số cấu hình nào phù hợp.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSettings.map((setting) => (
                  <TableRow
                    key={setting.key}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 cursor-pointer transition-colors text-xs py-2.5 border-b border-slate-100 dark:border-slate-800/60"
                    onClick={() => setting.isEditable && setEditingSetting(setting)}
                  >
                    {/* KEY */}
                    <TableCell className="py-2.5 font-mono font-bold text-[#93631F] dark:text-amber-400 text-[13px] select-all">
                      {setting.key}
                    </TableCell>

                    {/* DESCRIPTION & AUDIT */}
                    <TableCell className="py-2.5 text-slate-800 dark:text-slate-200">
                      <div className="font-semibold text-[13px]">{setting.description || "—"}</div>
                      {(setting.lastModifiedAt || setting.lastModifiedBy) && (
                        <div className="flex items-center gap-3 mt-0.5 text-[10px] text-slate-400">
                          {setting.lastModifiedAt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(setting.lastModifiedAt)}
                            </span>
                          )}
                          {setting.lastModifiedBy && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {getModifierName(setting.lastModifiedBy)}
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>

                    {/* VALUE */}
                    <TableCell className="py-2.5">
                      {formatValueDisplay(setting)}
                    </TableCell>

                    {/* MODE */}
                    <TableCell className="py-2.5">
                      {setting.isEditable ? (
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 font-bold text-[10px] px-2 py-0.5 rounded-md shadow-2xs"
                        >
                          <Sliders className="h-3 w-3 mr-1" />
                          Tùy chỉnh
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 font-bold text-[10px] px-2 py-0.5 rounded-md"
                        >
                          <Lock className="h-3 w-3 mr-1" />
                          Hệ thống
                        </Badge>
                      )}
                    </TableCell>

                    {/* ACTIONS */}
                    <TableCell className="py-2.5 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                      {setting.isEditable ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingSetting(setting)}
                          className="h-7 text-xs font-bold border-slate-200 hover:bg-[#93631F] hover:text-white transition-colors px-2.5"
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          Sửa
                        </Button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Chỉ xem</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Editing Form Modal Popup */}
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
