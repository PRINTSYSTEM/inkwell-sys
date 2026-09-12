import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Clock,
  Save,
  Copy,
  Info,
  HelpCircle,
  History,
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  RotateCcw,
  User,
  Calendar,
  X,
  FileCheck,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";

// 19 Flows grouped into 7 Product Categories
// 19 Flows grouped into 7 Product Categories
const FLOW_GROUPS = [
  {
    category: "HỘP GIẤY",
    flows: [
      { id: "F01", name: "Hộp thường", code: "HOP-THUONG" },
      { id: "F02", name: "Hộp Metalize", code: "HOP-METALIZE" },
      { id: "F03", name: "Hộp Duplex bồi sóng", code: "HOP-DUPLEX-BOI-SONG" },
      { id: "F04", name: "Hộp Metalize bồi sóng", code: "HOP-METALIZE-BOI-SONG" },
    ],
  },
  {
    category: "NHÃN",
    flows: [
      { id: "F05", name: "Nhãn giấy C / Tờ rơi", code: "NHAN-GIAY" },
      { id: "F06", name: "Folder / Bao thư / Thẻ treo", code: "FOLDER" },
      { id: "F07", name: "Nhãn Metalize", code: "NHAN-METALIZE" },
    ],
  },
  {
    category: "DECAL TỜ",
    flows: [
      { id: "F08", name: "Decal giấy", code: "DECAL-GIAY" },
      { id: "F09", name: "Decal khác", code: "DECAL-METALIZE" },
    ],
  },
  {
    category: "TÚI PE/PA",
    flows: [
      { id: "F10", name: "Túi PE/PA", code: "TUI-PE-PA" },
      { id: "F11", name: "Túi Metalize", code: "TUI-METALIZE" },
      { id: "F12", name: "Túi PE/PA xếp hông", code: "TUI-PE-PA-XEP-HONG" },
      { id: "F13", name: "Túi Metalize xếp hông", code: "TUI-METALIZE-XEP-HONG" },
      { id: "F14", name: "Túi PE/PA Zipper", code: "TUI-PE-PA-ZIPPER" },
      { id: "F19", name: "Túi giấy", code: "TUI-GIAY" },
    ],
  },
  {
    category: "TÚI CUỘN",
    flows: [
      { id: "F15", name: "Túi cuộn PE/PA/Metaline", code: "TUI-CUON-METLINE" },
      { id: "F16", name: "Túi cuộn Zipper", code: "TUI-CUON-ZIPPER" },
    ],
  },
  {
    category: "DECAL CUỘN",
    flows: [
      { id: "F17", name: "Decal cuộn thường", code: "DECAL-CUON-THUONG" },
      { id: "F18", name: "Decal cuộn Metalize", code: "DECAL-CUON-METALIZE" },
    ],
  },
];

interface StageSlaConfig {
  stepIndex: number;
  stepName: string;
  stageCode: string;
  waitWarning: number | null;
  waitLate: number | null;
  execWarning: number | null;
  execLate: number | null;
  condition: string;
  note: string;
  isCustom: boolean;
}

// Tailored distinct SLA configurations for each of the 19 Flows (F01–F19) according to matrix standard
const INITIAL_FLOW_SLA_MAP: Record<string, StageSlaConfig[]> = {
  F01: [
    { stepIndex: 1, stepName: "Bình bài", stageCode: "BINH_BAI", waitWarning: null, waitLate: null, execWarning: null, execLate: null, condition: "Luôn áp dụng", note: "Bình bài sản xuất", isCustom: false },
    { stepIndex: 2, stepName: "Điều lệnh", stageCode: "DISPATCH", waitWarning: 360, waitLate: 720, execWarning: null, execLate: null, condition: "Luôn áp dụng", note: "Điều lệnh & xuất giấy", isCustom: true },
    { stepIndex: 3, stepName: "In", stageCode: "PRINT", waitWarning: 360, waitLate: 720, execWarning: 45, execLate: 90, condition: "Luôn áp dụng", note: "In sản phẩm", isCustom: true },
    { stepIndex: 4, stepName: "Cán", stageCode: "LAMINATION", waitWarning: 30, waitLate: 60, execWarning: 30, execLate: 60, condition: "Luôn áp dụng", note: "Cán màng", isCustom: true },
    { stepIndex: 5, stepName: "Bế", stageCode: "DIE_CUT", waitWarning: 30, waitLate: 60, execWarning: 40, execLate: 80, condition: "Luôn áp dụng", note: "Bế hình", isCustom: true },
    { stepIndex: 6, stepName: "Gỡ", stageCode: "STRIPPING", waitWarning: 20, waitLate: 40, execWarning: 20, execLate: 40, condition: "Luôn áp dụng", note: "Gỡ phế liệu", isCustom: true },
    { stepIndex: 7, stepName: "Dán", stageCode: "GLUE", waitWarning: 30, waitLate: 60, execWarning: 30, execLate: 60, condition: "Luôn áp dụng", note: "Dán keo", isCustom: true },
    { stepIndex: 8, stepName: "Đóng gói", stageCode: "PACKAGING", waitWarning: 30, waitLate: 60, execWarning: 30, execLate: 60, condition: "Luôn áp dụng", note: "Đóng gói thành phẩm", isCustom: true },
  ],
  F02: [
    { stepIndex: 1, stepName: "Bình bài", stageCode: "BINH_BAI", waitWarning: null, waitLate: null, execWarning: null, execLate: null, condition: "Luôn áp dụng", note: "Bình bài Metalize", isCustom: false },
    { stepIndex: 2, stepName: "Điều lệnh", stageCode: "DISPATCH", waitWarning: 480, waitLate: 960, execWarning: null, execLate: null, condition: "Luôn áp dụng", note: "Xuất màng Metalize", isCustom: true },
    { stepIndex: 3, stepName: "In", stageCode: "PRINT", waitWarning: 480, waitLate: 960, execWarning: 60, execLate: 120, condition: "Luôn áp dụng", note: "In Metalize", isCustom: true },
    { stepIndex: 4, stepName: "Cán", stageCode: "LAMINATION", waitWarning: 45, waitLate: 90, execWarning: 40, execLate: 80, condition: "Luôn áp dụng", note: "Cán màng/Phủ bóng", isCustom: true },
    { stepIndex: 5, stepName: "Bế", stageCode: "DIE_CUT", waitWarning: 30, waitLate: 60, execWarning: 40, execLate: 80, condition: "Luôn áp dụng", note: "Bế hộp", isCustom: true },
    { stepIndex: 6, stepName: "Gỡ", stageCode: "STRIPPING", waitWarning: 20, waitLate: 40, execWarning: 20, execLate: 40, condition: "Luôn áp dụng", note: "Gỡ phế liệu", isCustom: true },
    { stepIndex: 7, stepName: "Dán", stageCode: "GLUE", waitWarning: 30, waitLate: 60, execWarning: 30, execLate: 60, condition: "Luôn áp dụng", note: "Dán keo", isCustom: true },
    { stepIndex: 8, stepName: "Đóng gói", stageCode: "PACKAGING", waitWarning: 30, waitLate: 60, execWarning: 30, execLate: 60, condition: "Luôn áp dụng", note: "Đóng gói thành phẩm", isCustom: true },
  ],
  F03: [
    { stepIndex: 1, stepName: "Bình bài", stageCode: "BINH_BAI", waitWarning: null, waitLate: null, execWarning: null, execLate: null, condition: "Luôn áp dụng", note: "Bình bài bồi sóng", isCustom: false },
    { stepIndex: 2, stepName: "Điều lệnh", stageCode: "DISPATCH", waitWarning: 360, waitLate: 720, execWarning: null, execLate: null, condition: "Luôn áp dụng", note: "Xuất giấy duplex & sóng", isCustom: true },
    { stepIndex: 3, stepName: "In", stageCode: "PRINT", waitWarning: 360, waitLate: 720, execWarning: 45, execLate: 90, condition: "Luôn áp dụng", note: "In mặt duplex", isCustom: true },
    { stepIndex: 4, stepName: "Cán", stageCode: "LAMINATION", waitWarning: 30, waitLate: 60, execWarning: 30, execLate: 60, condition: "Luôn áp dụng", note: "Cán màng", isCustom: true },
    { stepIndex: 5, stepName: "Bồi", stageCode: "MOUNTING", waitWarning: 45, waitLate: 90, execWarning: 45, execLate: 90, condition: "Luôn áp dụng", note: "Bồi sóng carton", isCustom: true },
    { stepIndex: 6, stepName: "Bế", stageCode: "DIE_CUT", waitWarning: 30, waitLate: 60, execWarning: 40, execLate: 80, condition: "Luôn áp dụng", note: "Bế sóng", isCustom: true },
    { stepIndex: 7, stepName: "Gỡ", stageCode: "STRIPPING", waitWarning: 20, waitLate: 40, execWarning: 20, execLate: 40, condition: "Luôn áp dụng", note: "Gỡ viền phế liệu", isCustom: true },
    { stepIndex: 8, stepName: "Dán", stageCode: "GLUE", waitWarning: 30, waitLate: 60, execWarning: 35, execLate: 70, condition: "Luôn áp dụng", note: "Dán keo", isCustom: true },
    { stepIndex: 9, stepName: "Đóng gói", stageCode: "PACKAGING", waitWarning: 30, waitLate: 60, execWarning: 30, execLate: 60, condition: "Luôn áp dụng", note: "Đóng gói thùng carton", isCustom: true },
  ],
  F04: [
    { stepIndex: 1, stepName: "Bình bài", stageCode: "BINH_BAI", waitWarning: null, waitLate: null, execWarning: null, execLate: null, condition: "Luôn áp dụng", note: "Bình bài Metalize bồi sóng", isCustom: false },
    { stepIndex: 2, stepName: "Điều lệnh", stageCode: "DISPATCH", waitWarning: 480, waitLate: 960, execWarning: null, execLate: null, condition: "Luôn áp dụng", note: "Xuất nguyên liệu Metalize", isCustom: true },
    { stepIndex: 3, stepName: "In", stageCode: "PRINT", waitWarning: 480, waitLate: 960, execWarning: 60, execLate: 120, condition: "Luôn áp dụng", note: "In Metalize", isCustom: true },
    { stepIndex: 4, stepName: "Cán", stageCode: "LAMINATION", waitWarning: 30, waitLate: 60, execWarning: 30, execLate: 60, condition: "Luôn áp dụng", note: "Cán màng bảo vệ", isCustom: true },
    { stepIndex: 5, stepName: "Bồi", stageCode: "MOUNTING", waitWarning: 45, waitLate: 90, execWarning: 45, execLate: 90, condition: "Luôn áp dụng", note: "Bồi sóng", isCustom: true },
    { stepIndex: 6, stepName: "Bế", stageCode: "DIE_CUT", waitWarning: 30, waitLate: 60, execWarning: 40, execLate: 80, condition: "Luôn áp dụng", note: "Bế sóng Metalize", isCustom: true },
    { stepIndex: 7, stepName: "Gỡ", stageCode: "STRIPPING", waitWarning: 20, waitLate: 40, execWarning: 20, execLate: 40, condition: "Luôn áp dụng", note: "Gỡ lề", isCustom: true },
    { stepIndex: 8, stepName: "Dán", stageCode: "GLUE", waitWarning: 30, waitLate: 60, execWarning: 35, execLate: 70, condition: "Luôn áp dụng", note: "Dán keo", isCustom: true },
    { stepIndex: 9, stepName: "Đóng gói", stageCode: "PACKAGING", waitWarning: 30, waitLate: 60, execWarning: 30, execLate: 60, condition: "Luôn áp dụng", note: "Đóng gói thành phẩm", isCustom: true },
  ],
  F05: [
    { stepIndex: 1, stepName: "Bình bài", stageCode: "BINH_BAI", waitWarning: null, waitLate: null, execWarning: null, execLate: null, condition: "Luôn áp dụng", note: "Bình bài nhãn giấy / tờ rơi", isCustom: false },
    { stepIndex: 2, stepName: "Điều lệnh", stageCode: "DISPATCH", waitWarning: 360, waitLate: 720, execWarning: null, execLate: null, condition: "Luôn áp dụng", note: "Điều lệnh", isCustom: true },
    { stepIndex: 3, stepName: "In", stageCode: "PRINT", waitWarning: 360, waitLate: 720, execWarning: 30, execLate: 60, condition: "Luôn áp dụng", note: "In nhãn", isCustom: true },
    { stepIndex: 4, stepName: "Cán", stageCode: "LAMINATION", waitWarning: 20, waitLate: 40, execWarning: 20, execLate: 40, condition: "Tùy chọn", note: "Cán bóng/mờ", isCustom: true },
    { stepIndex: 5, stepName: "Cắt", stageCode: "CUT", waitWarning: 20, waitLate: 40, execWarning: 25, execLate: 50, condition: "Luôn áp dụng", note: "Cắt thành phẩm", isCustom: true },
    { stepIndex: 6, stepName: "Đóng gói", stageCode: "PACKAGING", waitWarning: 20, waitLate: 40, execWarning: 20, execLate: 40, condition: "Luôn áp dụng", note: "Đóng gói", isCustom: true },
  ],
  F06: [
    { stepIndex: 1, stepName: "Bình bài", stageCode: "BINH_BAI", waitWarning: null, waitLate: null, execWarning: null, execLate: null, condition: "Luôn áp dụng", note: "Bình bài Folder / Bao thư", isCustom: false },
    { stepIndex: 2, stepName: "Điều lệnh", stageCode: "DISPATCH", waitWarning: 360, waitLate: 720, execWarning: null, execLate: null, condition: "Luôn áp dụng", note: "Điều lệnh", isCustom: true },
    { stepIndex: 3, stepName: "In", stageCode: "PRINT", waitWarning: 360, waitLate: 720, execWarning: 40, execLate: 80, condition: "Luôn áp dụng", note: "In ấn", isCustom: true },
    { stepIndex: 4, stepName: "Cán", stageCode: "LAMINATION", waitWarning: 30, waitLate: 60, execWarning: 30, execLate: 60, condition: "Luôn áp dụng", note: "Cán màng", isCustom: true },
    { stepIndex: 5, stepName: "Cắt", stageCode: "CUT", waitWarning: 20, waitLate: 40, execWarning: 25, execLate: 50, condition: "Luôn áp dụng", note: "Cắt xả", isCustom: true },
    { stepIndex: 6, stepName: "Bế", stageCode: "DIE_CUT", waitWarning: 30, waitLate: 60, execWarning: 35, execLate: 70, condition: "Luôn áp dụng", note: "Bế hình", isCustom: true },
    { stepIndex: 7, stepName: "Gỡ", stageCode: "STRIPPING", waitWarning: 20, waitLate: 40, execWarning: 20, execLate: 40, condition: "Luôn áp dụng", note: "Gỡ phế liệu", isCustom: true },
    { stepIndex: 8, stepName: "Dán", stageCode: "GLUE", waitWarning: 25, waitLate: 50, execWarning: 30, execLate: 60, condition: "Luôn áp dụng", note: "Dán keo / dán tai", isCustom: true },
    { stepIndex: 9, stepName: "Đóng gói", stageCode: "PACKAGING", waitWarning: 20, waitLate: 40, execWarning: 20, execLate: 40, condition: "Luôn áp dụng", note: "Đóng gói", isCustom: true },
  ],
  F07: [
    { stepIndex: 1, stepName: "Bình bài", stageCode: "BINH_BAI", waitWarning: null, waitLate: null, execWarning: null, execLate: null, condition: "Luôn áp dụng", note: "Bình bài nhãn Metalize", isCustom: false },
    { stepIndex: 2, stepName: "Điều lệnh", stageCode: "DISPATCH", waitWarning: 480, waitLate: 960, execWarning: null, execLate: null, condition: "Luôn áp dụng", note: "Xuất giấy Metalize", isCustom: true },
    { stepIndex: 3, stepName: "In", stageCode: "PRINT", waitWarning: 480, waitLate: 960, execWarning: 50, execLate: 100, condition: "Luôn áp dụng", note: "In nhãn Metalize", isCustom: true },
    { stepIndex: 4, stepName: "Cán", stageCode: "LAMINATION", waitWarning: 30, waitLate: 60, execWarning: 30, execLate: 60, condition: "Luôn áp dụng", note: "Cán màng/Phủ bóng", isCustom: true },
    { stepIndex: 5, stepName: "Cắt", stageCode: "CUT", waitWarning: 20, waitLate: 40, execWarning: 30, execLate: 60, condition: "Luôn áp dụng", note: "Cắt xấp nhãn", isCustom: true },
    { stepIndex: 6, stepName: "Đóng gói", stageCode: "PACKAGING", waitWarning: 20, waitLate: 40, execWarning: 20, execLate: 40, condition: "Luôn áp dụng", note: "Đóng gói", isCustom: true },
  ],
  F08: [
    { stepIndex: 1, stepName: "Bình bài", stageCode: "BINH_BAI", waitWarning: null, waitLate: null, execWarning: null, execLate: null, condition: "Luôn áp dụng", note: "Bình bài Decal giấy", isCustom: false },
    { stepIndex: 2, stepName: "Điều lệnh", stageCode: "DISPATCH", waitWarning: 360, waitLate: 720, execWarning: null, execLate: null, condition: "Luôn áp dụng", note: "Điều lệnh", isCustom: true },
    { stepIndex: 3, stepName: "In", stageCode: "PRINT", waitWarning: 360, waitLate: 720, execWarning: 35, execLate: 70, condition: "Luôn áp dụng", note: "In decal tờ", isCustom: true },
    { stepIndex: 4, stepName: "Cán", stageCode: "LAMINATION", waitWarning: 25, waitLate: 50, execWarning: 25, execLate: 50, condition: "Tùy chọn", note: "Cán màng", isCustom: true },
    { stepIndex: 5, stepName: "Cắt", stageCode: "CUT", waitWarning: 20, waitLate: 40, execWarning: 25, execLate: 50, condition: "Luôn áp dụng", note: "Cắt xả tờ", isCustom: true },
    { stepIndex: 6, stepName: "Bế", stageCode: "DIE_CUT", waitWarning: 30, waitLate: 60, execWarning: 35, execLate: 70, condition: "Luôn áp dụng", note: "Bế đờ-mi nhãn", isCustom: true },
    { stepIndex: 7, stepName: "Gỡ", stageCode: "STRIPPING", waitWarning: 20, waitLate: 40, execWarning: 20, execLate: 40, condition: "Luôn áp dụng", note: "Gỡ khung phế", isCustom: true },
    { stepIndex: 8, stepName: "Đóng gói", stageCode: "PACKAGING", waitWarning: 20, waitLate: 40, execWarning: 20, execLate: 40, condition: "Luôn áp dụng", note: "Đóng gói", isCustom: true },
  ],
  F09: [
    { stepIndex: 1, stepName: "Bình bài", stageCode: "BINH_BAI", waitWarning: null, waitLate: null, execWarning: null, execLate: null, condition: "Luôn áp dụng", note: "Bình bài Decal khác", isCustom: false },
    { stepIndex: 2, stepName: "Điều lệnh", stageCode: "DISPATCH", waitWarning: 480, waitLate: 960, execWarning: null, execLate: null, condition: "Luôn áp dụng", note: "Điều lệnh", isCustom: true },
    { stepIndex: 3, stepName: "In", stageCode: "PRINT", waitWarning: 480, waitLate: 960, execWarning: 50, execLate: 100, condition: "Luôn áp dụng", note: "In decal", isCustom: true },
    { stepIndex: 4, stepName: "Cán", stageCode: "LAMINATION", waitWarning: 30, waitLate: 60, execWarning: 30, execLate: 60, condition: "Luôn áp dụng", note: "Cán màng", isCustom: true },
    { stepIndex: 5, stepName: "Cắt", stageCode: "CUT", waitWarning: 20, waitLate: 40, execWarning: 25, execLate: 50, condition: "Luôn áp dụng", note: "Cắt xả tờ", isCustom: true },
    { stepIndex: 6, stepName: "Bế", stageCode: "DIE_CUT", waitWarning: 30, waitLate: 60, execWarning: 35, execLate: 70, condition: "Luôn áp dụng", note: "Bế con nhãn", isCustom: true },
    { stepIndex: 7, stepName: "Gỡ", stageCode: "STRIPPING", waitWarning: 20, waitLate: 40, execWarning: 20, execLate: 40, condition: "Luôn áp dụng", note: "Gỡ phế liệu", isCustom: true },
    { stepIndex: 8, stepName: "Đóng gói", stageCode: "PACKAGING", waitWarning: 20, waitLate: 40, execWarning: 20, execLate: 40, condition: "Luôn áp dụng", note: "Đóng gói", isCustom: true },
  ],
  F10: [
    { stepIndex: 1, stepName: "Bình bài", stageCode: "BINH_BAI", waitWarning: null, waitLate: null, execWarning: null, execLate: null, condition: "Luôn áp dụng", note: "Bình bài màng PE/PA", isCustom: false },
    { stepIndex: 2, stepName: "Điều lệnh", stageCode: "DISPATCH", waitWarning: 720, waitLate: 1440, execWarning: null, execLate: null, condition: "Luôn áp dụng", note: "Xuất màng phức hợp", isCustom: true },
    { stepIndex: 3, stepName: "In", stageCode: "PRINT", waitWarning: 720, waitLate: 1440, execWarning: 60, execLate: 120, condition: "Luôn áp dụng", note: "In màng PE/PA", isCustom: true },
    { stepIndex: 4, stepName: "Cán", stageCode: "LAMINATION", waitWarning: 60, waitLate: 120, execWarning: 60, execLate: 120, condition: "Luôn áp dụng", note: "Cán/Ghép màng", isCustom: true },
    { stepIndex: 5, stepName: "Ép biên", stageCode: "SIDE_SEAL", waitWarning: 30, waitLate: 60, execWarning: 45, execLate: 90, condition: "Luôn áp dụng", note: "Ép biên gia nhiệt", isCustom: true },
    { stepIndex: 6, stepName: "Xả cuộn", stageCode: "UNWIND", waitWarning: 30, waitLate: 60, execWarning: 35, execLate: 70, condition: "Luôn áp dụng", note: "Xả cuộn túi", isCustom: true },
    { stepIndex: 7, stepName: "Cắt", stageCode: "CUT", waitWarning: 20, waitLate: 40, execWarning: 30, execLate: 60, condition: "Luôn áp dụng", note: "Cắt túi rời", isCustom: true },
    { stepIndex: 8, stepName: "Ép miệng", stageCode: "TOP_SEAL", waitWarning: 30, waitLate: 60, execWarning: 40, execLate: 80, condition: "Luôn áp dụng", note: "Ép miệng túi", isCustom: true },
    { stepIndex: 9, stepName: "Đóng gói", stageCode: "PACKAGING", waitWarning: 20, waitLate: 40, execWarning: 20, execLate: 40, condition: "Luôn áp dụng", note: "Đóng gói thành phẩm", isCustom: true },
  ],
  F11: [
    { stepIndex: 1, stepName: "Bình bài", stageCode: "BINH_BAI", waitWarning: null, waitLate: null, execWarning: null, execLate: null, condition: "Luôn áp dụng", note: "Bình bài túi Metalize", isCustom: false },
    { stepIndex: 2, stepName: "Điều lệnh", stageCode: "DISPATCH", waitWarning: 720, waitLate: 1440, execWarning: null, execLate: null, condition: "Luôn áp dụng", note: "Xuất cuộn Metalize", isCustom: true },
    { stepIndex: 3, stepName: "In", stageCode: "PRINT", waitWarning: 720, waitLate: 1440, execWarning: 65, execLate: 130, condition: "Luôn áp dụng", note: "In Metalize", isCustom: true },
    { stepIndex: 4, stepName: "Cán", stageCode: "LAMINATION", waitWarning: 60, waitLate: 120, execWarning: 60, execLate: 120, condition: "Luôn áp dụng", note: "Cán/Ghép màng Metalize", isCustom: true },
    { stepIndex: 5, stepName: "Ép biên", stageCode: "SIDE_SEAL", waitWarning: 30, waitLate: 60, execWarning: 45, execLate: 90, condition: "Luôn áp dụng", note: "Ép biên gia nhiệt", isCustom: true },
    { stepIndex: 6, stepName: "Xả cuộn", stageCode: "UNWIND", waitWarning: 30, waitLate: 60, execWarning: 35, execLate: 70, condition: "Luôn áp dụng", note: "Xả cuộn", isCustom: true },
    { stepIndex: 7, stepName: "Cắt", stageCode: "CUT", waitWarning: 20, waitLate: 40, execWarning: 30, execLate: 60, condition: "Luôn áp dụng", note: "Cắt túi rời", isCustom: true },
    { stepIndex: 8, stepName: "Ép miệng", stageCode: "TOP_SEAL", waitWarning: 30, waitLate: 60, execWarning: 40, execLate: 80, condition: "Luôn áp dụng", note: "Ép miệng túi", isCustom: true },
    { stepIndex: 9, stepName: "Đóng gói", stageCode: "PACKAGING", waitWarning: 20, waitLate: 40, execWarning: 20, execLate: 40, condition: "Luôn áp dụng", note: "Đóng gói", isCustom: true },
  ],
  F12: [
    { stepIndex: 1, stepName: "Bình bài", stageCode: "BINH_BAI", waitWarning: null, waitLate: null, execWarning: null, execLate: null, condition: "Luôn áp dụng", note: "Bình bài túi xếp hông", isCustom: false },
    { stepIndex: 2, stepName: "Điều lệnh", stageCode: "DISPATCH", waitWarning: 720, waitLate: 1440, execWarning: null, execLate: null, condition: "Luôn áp dụng", note: "Điều lệnh", isCustom: true },
    { stepIndex: 3, stepName: "In", stageCode: "PRINT", waitWarning: 720, waitLate: 1440, execWarning: 60, execLate: 120, condition: "Luôn áp dụng", note: "In màng", isCustom: true },
    { stepIndex: 4, stepName: "Cán", stageCode: "LAMINATION", waitWarning: 60, waitLate: 120, execWarning: 60, execLate: 120, condition: "Luôn áp dụng", note: "Cán/Ghép màng", isCustom: true },
    { stepIndex: 5, stepName: "Xếp hông", stageCode: "GUSSET", waitWarning: 45, waitLate: 90, execWarning: 45, execLate: 90, condition: "Luôn áp dụng", note: "Tạo hông 2 bên", isCustom: true },
    { stepIndex: 6, stepName: "Cắt", stageCode: "CUT", waitWarning: 20, waitLate: 40, execWarning: 30, execLate: 60, condition: "Luôn áp dụng", note: "Cắt túi", isCustom: true },
    { stepIndex: 7, stepName: "Ép miệng", stageCode: "TOP_SEAL", waitWarning: 30, waitLate: 60, execWarning: 40, execLate: 80, condition: "Luôn áp dụng", note: "Ép miệng túi", isCustom: true },
    { stepIndex: 8, stepName: "Đóng gói", stageCode: "PACKAGING", waitWarning: 20, waitLate: 40, execWarning: 20, execLate: 40, condition: "Luôn áp dụng", note: "Đóng gói", isCustom: true },
  ],
  F13: [
    { stepIndex: 1, stepName: "Bình bài", stageCode: "BINH_BAI", waitWarning: null, waitLate: null, execWarning: null, execLate: null, condition: "Luôn áp dụng", note: "Bình bài túi Metalize xếp hông", isCustom: false },
    { stepIndex: 2, stepName: "Điều lệnh", stageCode: "DISPATCH", waitWarning: 720, waitLate: 1440, execWarning: null, execLate: null, condition: "Luôn áp dụng", note: "Điều lệnh", isCustom: true },
    { stepIndex: 3, stepName: "In", stageCode: "PRINT", waitWarning: 720, waitLate: 1440, execWarning: 65, execLate: 130, condition: "Luôn áp dụng", note: "In Metalize", isCustom: true },
    { stepIndex: 4, stepName: "Cán", stageCode: "LAMINATION", waitWarning: 60, waitLate: 120, execWarning: 60, execLate: 120, condition: "Luôn áp dụng", note: "Cán/Ghép màng Metalize", isCustom: true },
    { stepIndex: 5, stepName: "Xếp hông", stageCode: "GUSSET", waitWarning: 45, waitLate: 90, execWarning: 45, execLate: 90, condition: "Luôn áp dụng", note: "Tạo hông 2 bên", isCustom: true },
    { stepIndex: 6, stepName: "Cắt", stageCode: "CUT", waitWarning: 20, waitLate: 40, execWarning: 30, execLate: 60, condition: "Luôn áp dụng", note: "Cắt túi", isCustom: true },
    { stepIndex: 7, stepName: "Ép miệng", stageCode: "TOP_SEAL", waitWarning: 30, waitLate: 60, execWarning: 40, execLate: 80, condition: "Luôn áp dụng", note: "Ép miệng túi", isCustom: true },
    { stepIndex: 8, stepName: "Đóng gói", stageCode: "PACKAGING", waitWarning: 20, waitLate: 40, execWarning: 20, execLate: 40, condition: "Luôn áp dụng", note: "Đóng gói", isCustom: true },
  ],
  F14: [
    { stepIndex: 1, stepName: "Bình bài", stageCode: "BINH_BAI", waitWarning: null, waitLate: null, execWarning: null, execLate: null, condition: "Luôn áp dụng", note: "Bình bài túi Zipper", isCustom: false },
    { stepIndex: 2, stepName: "Điều lệnh", stageCode: "DISPATCH", waitWarning: 720, waitLate: 1440, execWarning: null, execLate: null, condition: "Luôn áp dụng", note: "Xuất dây zipper & màng", isCustom: true },
    { stepIndex: 3, stepName: "In", stageCode: "PRINT", waitWarning: 720, waitLate: 1440, execWarning: 60, execLate: 120, condition: "Luôn áp dụng", note: "In màng", isCustom: true },
    { stepIndex: 4, stepName: "Cán", stageCode: "LAMINATION", waitWarning: 60, waitLate: 120, execWarning: 60, execLate: 120, condition: "Luôn áp dụng", note: "Cán/Ghép màng", isCustom: true },
    { stepIndex: 5, stepName: "Chạy zip", stageCode: "ZIPPER", waitWarning: 40, waitLate: 80, execWarning: 45, execLate: 90, condition: "Luôn áp dụng", note: "Gắn dây zipper", isCustom: true },
    { stepIndex: 6, stepName: "Ép biên", stageCode: "SIDE_SEAL", waitWarning: 30, waitLate: 60, execWarning: 40, execLate: 80, condition: "Luôn áp dụng", note: "Ép đường biên", isCustom: true },
    { stepIndex: 7, stepName: "Cắt", stageCode: "CUT", waitWarning: 20, waitLate: 40, execWarning: 30, execLate: 60, condition: "Luôn áp dụng", note: "Cắt rời túi", isCustom: true },
    { stepIndex: 8, stepName: "Đóng gói", stageCode: "PACKAGING", waitWarning: 20, waitLate: 40, execWarning: 20, execLate: 40, condition: "Luôn áp dụng", note: "Đóng gói", isCustom: true },
  ],
  F15: [
    { stepIndex: 1, stepName: "Bình bài", stageCode: "BINH_BAI", waitWarning: null, waitLate: null, execWarning: null, execLate: null, condition: "Luôn áp dụng", note: "Bình bài túi cuộn", isCustom: false },
    { stepIndex: 2, stepName: "Điều lệnh", stageCode: "DISPATCH", waitWarning: 720, waitLate: 1440, execWarning: null, execLate: null, condition: "Luôn áp dụng", note: "Xuất màng cuộn", isCustom: true },
    { stepIndex: 3, stepName: "In", stageCode: "PRINT", waitWarning: 720, waitLate: 1440, execWarning: 60, execLate: 120, condition: "Luôn áp dụng", note: "In cuộn", isCustom: true },
    { stepIndex: 4, stepName: "Cán", stageCode: "LAMINATION", waitWarning: 60, waitLate: 120, execWarning: 60, execLate: 120, condition: "Luôn áp dụng", note: "Cán/Ghép cuộn", isCustom: true },
    { stepIndex: 5, stepName: "Chạy thành phẩm", stageCode: "FINISHING", waitWarning: 30, waitLate: 60, execWarning: 45, execLate: 90, condition: "Luôn áp dụng", note: "Tạo cuộn thành phẩm", isCustom: true },
    { stepIndex: 6, stepName: "Đóng gói", stageCode: "PACKAGING", waitWarning: 20, waitLate: 40, execWarning: 20, execLate: 40, condition: "Luôn áp dụng", note: "Bọc màng co & đóng gói", isCustom: true },
  ],
  F16: [
    { stepIndex: 1, stepName: "Bình bài", stageCode: "BINH_BAI", waitWarning: null, waitLate: null, execWarning: null, execLate: null, condition: "Luôn áp dụng", note: "Bình bài túi cuộn Zipper", isCustom: false },
    { stepIndex: 2, stepName: "Điều lệnh", stageCode: "DISPATCH", waitWarning: 720, waitLate: 1440, execWarning: null, execLate: null, condition: "Luôn áp dụng", note: "Xuất dây zip & màng cuộn", isCustom: true },
    { stepIndex: 3, stepName: "In", stageCode: "PRINT", waitWarning: 720, waitLate: 1440, execWarning: 60, execLate: 120, condition: "Luôn áp dụng", note: "In cuộn", isCustom: true },
    { stepIndex: 4, stepName: "Cán", stageCode: "LAMINATION", waitWarning: 60, waitLate: 120, execWarning: 60, execLate: 120, condition: "Luôn áp dụng", note: "Cán/Ghép màng cuộn", isCustom: true },
    { stepIndex: 5, stepName: "Chạy zip", stageCode: "ZIPPER", waitWarning: 40, waitLate: 80, execWarning: 45, execLate: 90, condition: "Luôn áp dụng", note: "Hàn dây zipper cuộn", isCustom: true },
    { stepIndex: 6, stepName: "Chạy thành phẩm", stageCode: "FINISHING", waitWarning: 30, waitLate: 60, execWarning: 45, execLate: 90, condition: "Luôn áp dụng", note: "Cuộn thành phẩm Zipper", isCustom: true },
    { stepIndex: 7, stepName: "Đóng gói", stageCode: "PACKAGING", waitWarning: 20, waitLate: 40, execWarning: 20, execLate: 40, condition: "Luôn áp dụng", note: "Đóng gói cuộn", isCustom: true },
  ],
  F17: [
    { stepIndex: 1, stepName: "Bình bài", stageCode: "BINH_BAI", waitWarning: null, waitLate: null, execWarning: null, execLate: null, condition: "Luôn áp dụng", note: "Bình bài Decal cuộn", isCustom: false },
    { stepIndex: 2, stepName: "Điều lệnh", stageCode: "DISPATCH", waitWarning: 720, waitLate: 1440, execWarning: null, execLate: null, condition: "Luôn áp dụng", note: "Xuất giấy cuộn", isCustom: true },
    { stepIndex: 3, stepName: "In", stageCode: "PRINT", waitWarning: 720, waitLate: 1440, execWarning: 45, execLate: 120, condition: "Luôn áp dụng", note: "In cuộn decal", isCustom: true },
    { stepIndex: 4, stepName: "Cán", stageCode: "LAMINATION", waitWarning: 30, waitLate: 60, execWarning: 30, execLate: 60, condition: "Luôn áp dụng", note: "Cán màng", isCustom: true },
    { stepIndex: 5, stepName: "Bế", stageCode: "DIE_CUT", waitWarning: 30, waitLate: 60, execWarning: 35, execLate: 70, condition: "Luôn áp dụng", note: "Bế cuộn", isCustom: true },
    { stepIndex: 6, stepName: "Chia cuộn", stageCode: "SLIT", waitWarning: 30, waitLate: 60, execWarning: 30, execLate: 60, condition: "Luôn áp dụng", note: "Chia cuộn nhỏ theo lõi", isCustom: true },
    { stepIndex: 7, stepName: "Cắt", stageCode: "CUT", waitWarning: 20, waitLate: 40, execWarning: 25, execLate: 50, condition: "Luôn áp dụng", note: "Cắt đầu cuộn thành phẩm", isCustom: true },
    { stepIndex: 8, stepName: "Đóng gói", stageCode: "PACKAGING", waitWarning: 20, waitLate: 40, execWarning: 20, execLate: 40, condition: "Luôn áp dụng", note: "Đóng gói màng co", isCustom: true },
  ],
  F18: [
    { stepIndex: 1, stepName: "Bình bài", stageCode: "BINH_BAI", waitWarning: null, waitLate: null, execWarning: null, execLate: null, condition: "Luôn áp dụng", note: "Bình bài Decal Metalize cuộn", isCustom: false },
    { stepIndex: 2, stepName: "Điều lệnh", stageCode: "DISPATCH", waitWarning: 720, waitLate: 1440, execWarning: null, execLate: null, condition: "Luôn áp dụng", note: "Xuất cuộn Metalize", isCustom: true },
    { stepIndex: 3, stepName: "In", stageCode: "PRINT", waitWarning: 720, waitLate: 1440, execWarning: 60, execLate: 130, condition: "Luôn áp dụng", note: "In Decal Metalize", isCustom: true },
    { stepIndex: 4, stepName: "Cán", stageCode: "LAMINATION", waitWarning: 30, waitLate: 60, execWarning: 30, execLate: 60, condition: "Luôn áp dụng", note: "Cán màng", isCustom: true },
    { stepIndex: 5, stepName: "Bế", stageCode: "DIE_CUT", waitWarning: 30, waitLate: 60, execWarning: 35, execLate: 70, condition: "Luôn áp dụng", note: "Bế cuộn Metalize", isCustom: true },
    { stepIndex: 6, stepName: "Chia cuộn", stageCode: "SLIT", waitWarning: 30, waitLate: 60, execWarning: 30, execLate: 60, condition: "Luôn áp dụng", note: "Chia cuộn", isCustom: true },
    { stepIndex: 7, stepName: "Cắt", stageCode: "CUT", waitWarning: 20, waitLate: 40, execWarning: 25, execLate: 50, condition: "Luôn áp dụng", note: "Cắt cuộn thành phẩm", isCustom: true },
    { stepIndex: 8, stepName: "Đóng gói", stageCode: "PACKAGING", waitWarning: 20, waitLate: 40, execWarning: 20, execLate: 40, condition: "Luôn áp dụng", note: "Đóng gói cuộn Metalize", isCustom: true },
  ],
  F19: [
    { stepIndex: 1, stepName: "Bình bài", stageCode: "BINH_BAI", waitWarning: null, waitLate: null, execWarning: null, execLate: null, condition: "Luôn áp dụng", note: "Bình bài Túi giấy", isCustom: false },
    { stepIndex: 2, stepName: "Điều lệnh", stageCode: "DISPATCH", waitWarning: 360, waitLate: 720, execWarning: null, execLate: null, condition: "Luôn áp dụng", note: "Xuất giấy làm túi", isCustom: true },
    { stepIndex: 3, stepName: "In", stageCode: "PRINT", waitWarning: 360, waitLate: 720, execWarning: 45, execLate: 90, condition: "Luôn áp dụng", note: "In túi giấy", isCustom: true },
    { stepIndex: 4, stepName: "Cán", stageCode: "LAMINATION", waitWarning: 30, waitLate: 60, execWarning: 30, execLate: 60, condition: "Luôn áp dụng", note: "Cán màng túi", isCustom: true },
    { stepIndex: 5, stepName: "Cắt", stageCode: "CUT", waitWarning: 20, waitLate: 40, execWarning: 25, execLate: 50, condition: "Luôn áp dụng", note: "Cắt xả mảng túi", isCustom: true },
    { stepIndex: 6, stepName: "Bế", stageCode: "DIE_CUT", waitWarning: 30, waitLate: 60, execWarning: 35, execLate: 70, condition: "Luôn áp dụng", note: "Bế hình & tạo gân túi", isCustom: true },
    { stepIndex: 7, stepName: "Gỡ", stageCode: "STRIPPING", waitWarning: 20, waitLate: 40, execWarning: 20, execLate: 40, condition: "Luôn áp dụng", note: "Gỡ lề phế liệu", isCustom: true },
    { stepIndex: 8, stepName: "Dán", stageCode: "GLUE", waitWarning: 30, waitLate: 60, execWarning: 40, execLate: 80, condition: "Luôn áp dụng", note: "Dán hông & dán đáy túi", isCustom: true },
    { stepIndex: 9, stepName: "Đóng gói", stageCode: "PACKAGING", waitWarning: 25, waitLate: 50, execWarning: 30, execLate: 60, condition: "Luôn áp dụng", note: "Đóng gói túi giấy", isCustom: true },
  ],
};

const DEFAULT_GLOBAL_STAGES = [
  { stageCode: "BINH_BAI", stageName: "Bình bài", waitWarning: 360, waitLate: 720, execWarning: 30, execLate: 60 },
  { stageCode: "DISPATCH", stageName: "Điều lệnh", waitWarning: 720, waitLate: 1440, execWarning: 60, execLate: 120 },
  { stageCode: "PRINT", stageName: "In", waitWarning: 720, waitLate: 1440, execWarning: 45, execLate: 120 },
  { stageCode: "LAMINATION", stageName: "Cán", waitWarning: 30, waitLate: 60, execWarning: 30, execLate: 60 },
  { stageCode: "MOUNTING", stageName: "Bồi", waitWarning: 45, waitLate: 90, execWarning: 45, execLate: 90 },
  { stageCode: "DIE_CUT", stageName: "Bế", waitWarning: 30, waitLate: 60, execWarning: 30, execLate: 60 },
  { stageCode: "STRIPPING", stageName: "Gỡ", waitWarning: 20, waitLate: 40, execWarning: 20, execLate: 40 },
  { stageCode: "GLUE", stageName: "Dán", waitWarning: 30, waitLate: 60, execWarning: 30, execLate: 60 },
  { stageCode: "SIDE_SEAL", stageName: "Ép biên", waitWarning: 30, waitLate: 60, execWarning: 30, execLate: 60 },
  { stageCode: "UNWIND", stageName: "Xả cuộn", waitWarning: 20, waitLate: 40, execWarning: 20, execLate: 40 },
  { stageCode: "GUSSET", stageName: "Xếp hông", waitWarning: 30, waitLate: 60, execWarning: 30, execLate: 60 },
  { stageCode: "ZIPPER", stageName: "Chạy zip", waitWarning: 30, waitLate: 60, execWarning: 30, execLate: 60 },
  { stageCode: "CUT", stageName: "Cắt", waitWarning: 30, waitLate: 60, execWarning: 30, execLate: 60 },
  { stageCode: "SLIT", stageName: "Chia cuộn", waitWarning: 30, waitLate: 60, execWarning: 30, execLate: 60 },
  { stageCode: "TOP_SEAL", stageName: "Ép miệng", waitWarning: 30, waitLate: 60, execWarning: 30, execLate: 60 },
  { stageCode: "PACKAGING", stageName: "Đóng gói", waitWarning: 30, waitLate: 60, execWarning: 30, execLate: 60 },
];

const INITIAL_HISTORY = [
  { id: 1, timestamp: "2026-09-12 14:30", user: "Nguyễn Văn Quản", flowId: "F17", flowName: "Decal cuộn thường", action: "Cập nhật SLA", details: "Thay đổi Thời gian chờ (Vàng): 720m, (Đỏ): 1440m tại khâu In", status: "Thành công" },
  { id: 2, timestamp: "2026-09-11 09:15", user: "Trần Thị Trưởng", flowId: "F01", flowName: "Hộp thường", action: "Sao chép SLA", details: "Sao chép cấu hình SLA từ F01 sang F03", status: "Thành công" },
  { id: 3, timestamp: "2026-09-10 16:45", user: "Nguyễn Văn Quản", flowId: "F10", flowName: "Túi PE/PA", action: "Cập nhật SLA", details: "Điều chỉnh SLA thời gian thực hiện khâu Ép biên: 45m → 60m", status: "Thành công" },
];

export default function ProductionSlaConfigPage() {
  const [selectedFlowId, setSelectedFlowId] = useState<string>("F17");
  const [searchFlowQuery, setSearchFlowQuery] = useState<string>("");

  // State map mapping Flow ID -> distinct Stage SLA array
  const [flowSlaMap, setFlowSlaMap] = useState<Record<string, StageSlaConfig[]>>(INITIAL_FLOW_SLA_MAP);
  const [globalDefaults, setGlobalDefaults] = useState(DEFAULT_GLOBAL_STAGES);
  const [sourceCopyFlow, setSourceCopyFlow] = useState<string>("");
  const [copyWaitTime, setCopyWaitTime] = useState<boolean>(true);
  const [copyExecTime, setCopyExecTime] = useState<boolean>(true);

  // Dialog States
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isNotesOpen, setIsNotesOpen] = useState<boolean>(false);
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState<boolean>(false);
  const [isFlowchartOpen, setIsFlowchartOpen] = useState<boolean>(false);
  const [historyLogs, setHistoryLogs] = useState(INITIAL_HISTORY);

  // Find selected flow info
  const currentFlow = useMemo(() => {
    for (const group of FLOW_GROUPS) {
      const found = group.flows.find((f) => f.id === selectedFlowId);
      if (found) return { ...found, category: group.category };
    }
    return { id: "F17", name: "Decal cuộn thường", code: "DECAL-CUON-THUONG", category: "DECAL CUỘN" };
  }, [selectedFlowId]);

  // Active stages list specifically for the selected flow
  const currentStages = useMemo(() => {
    return flowSlaMap[selectedFlowId] || INITIAL_FLOW_SLA_MAP[selectedFlowId] || INITIAL_FLOW_SLA_MAP["F17"];
  }, [flowSlaMap, selectedFlowId]);

  const filteredFlowGroups = useMemo(() => {
    if (!searchFlowQuery.trim()) return FLOW_GROUPS;
    const query = searchFlowQuery.toLowerCase();
    return FLOW_GROUPS.map((group) => ({
      ...group,
      flows: group.flows.filter(
        (f) => f.id.toLowerCase().includes(query) || f.name.toLowerCase().includes(query) || f.code.toLowerCase().includes(query)
      ),
    })).filter((group) => group.flows.length > 0);
  }, [searchFlowQuery]);

  const handleStageValueChange = (
    index: number,
    field: "waitWarning" | "waitLate" | "execWarning" | "execLate" | "note",
    val: string
  ) => {
    setFlowSlaMap((prevMap) => {
      const flowStages = prevMap[selectedFlowId] || currentStages;
      const updatedStages = flowStages.map((s, idx) => {
        if (idx !== index) return s;
        if (field === "note") {
          return { ...s, note: val, isCustom: true };
        }
        const num = val === "" ? null : parseInt(val, 10);
        return { ...s, [field]: num, isCustom: true };
      });
      return { ...prevMap, [selectedFlowId]: updatedStages };
    });
  };

  const handleGlobalValueChange = (
    index: number,
    field: "waitWarning" | "waitLate" | "execWarning" | "execLate",
    val: string
  ) => {
    const num = val === "" ? null : parseInt(val, 10);
    setGlobalDefaults((prev) =>
      prev.map((s, idx) => (idx === index ? { ...s, [field]: num } : s))
    );
  };

  const handleSaveSla = () => {
    const now = new Date().toISOString().replace("T", " ").substring(0, 16);
    const newLog = {
      id: Date.now(),
      timestamp: now,
      user: "Người dùng hiện tại",
      flowId: currentFlow.id,
      flowName: currentFlow.name,
      action: "Cập nhật SLA",
      details: `Đã lưu cấu hình SLA tùy chỉnh cho ${currentFlow.id} (${currentStages.length} công đoạn)`,
      status: "Thành công",
    };
    setHistoryLogs((prev) => [newLog, ...prev]);

    toast.success(`Đã lưu cấu hình SLA riêng cho ${currentFlow.id} thành công!`, {
      description: `Cấu hình SLA cho ${currentFlow.id} - ${currentFlow.name} đã được lưu riêng biệt vào hệ thống.`,
    });
  };

  const handleSaveGlobalDefaults = () => {
    toast.success("Đã lưu SLA mặc định theo công đoạn!", {
      description: "Cấu hình SLA toàn hệ thống cho 16 công đoạn sản xuất đã được cập nhật.",
    });
  };

  const handleCopySla = () => {
    if (!sourceCopyFlow) {
      toast.error("Vui lòng chọn Flow nguồn để sao chép!");
      return;
    }

    const sourceStages = flowSlaMap[sourceCopyFlow] || INITIAL_FLOW_SLA_MAP[sourceCopyFlow];
    if (!sourceStages) {
      toast.error(`Không tìm thấy cấu hình SLA của Flow nguồn ${sourceCopyFlow}!`);
      return;
    }

    // Merge SLA values from source flow stages into target flow matching stage codes
    setFlowSlaMap((prevMap) => {
      const targetStages = prevMap[selectedFlowId] || currentStages;
      const copiedStages = targetStages.map((targetStep) => {
        const matchedSource = sourceStages.find((s) => s.stageCode === targetStep.stageCode);
        if (!matchedSource) return targetStep;

        return {
          ...targetStep,
          waitWarning: copyWaitTime ? matchedSource.waitWarning : targetStep.waitWarning,
          waitLate: copyWaitTime ? matchedSource.waitLate : targetStep.waitLate,
          execWarning: copyExecTime ? matchedSource.execWarning : targetStep.execWarning,
          execLate: copyExecTime ? matchedSource.execLate : targetStep.execLate,
          isCustom: true,
        };
      });

      return { ...prevMap, [selectedFlowId]: copiedStages };
    });

    const now = new Date().toISOString().replace("T", " ").substring(0, 16);
    const newLog = {
      id: Date.now(),
      timestamp: now,
      user: "Người dùng hiện tại",
      flowId: currentFlow.id,
      flowName: currentFlow.name,
      action: "Sao chép SLA",
      details: `Sao chép cấu hình SLA từ ${sourceCopyFlow} sang ${currentFlow.id}`,
      status: "Thành công",
    };
    setHistoryLogs((prev) => [newLog, ...prev]);

    toast.success(`Đã sao chép mốc SLA từ ${sourceCopyFlow} sang ${currentFlow.id}!`, {
      description: `Áp dụng thành công mốc thời gian chờ (${copyWaitTime ? "Có" : "Không"}) và thời gian thực hiện (${copyExecTime ? "Có" : "Không"}).`,
    });

    setIsCopyDialogOpen(false);
  };

  const handleResetDefaults = () => {
    const initialForFlow = INITIAL_FLOW_SLA_MAP[selectedFlowId] || INITIAL_FLOW_SLA_MAP["F17"];
    setFlowSlaMap((prevMap) => ({
      ...prevMap,
      [selectedFlowId]: initialForFlow,
    }));
    toast.info(`Đã đặt lại SLA cho ${selectedFlowId} về mặc định ban đầu!`, {
      description: `Mốc SLA cho ${currentFlow.id} - ${currentFlow.name} đã khôi phục quy trình chuẩn.`,
    });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden gap-2 p-3 bg-slate-50/50 dark:bg-background">
      {/* Header Bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-2 shrink-0">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-900 dark:text-amber-500" />
            Cấu hình Thời gian sản xuất
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs font-semibold gap-1 bg-card"
            onClick={() => setIsHelpOpen(true)}
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" /> Hướng dẫn
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs font-semibold gap-1 bg-card"
            onClick={() => setIsNotesOpen(true)}
          >
            <Info className="w-3.5 h-3.5 text-amber-600" /> Lưu ý
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs font-semibold gap-1 bg-card"
            onClick={() => setIsCopyDialogOpen(true)}
          >
            <Copy className="w-3.5 h-3.5 text-amber-600" /> Sao chép cấu hình
          </Button>

          <Button
            variant="default"
            size="sm"
            className="h-8 text-xs font-bold gap-1 shadow-sm bg-amber-900 hover:bg-amber-950 text-white"
            onClick={handleSaveSla}
          >
            <Save className="w-3.5 h-3.5" /> Lưu thay đổi ({currentFlow.id})
          </Button>
        </div>
      </div>

      {/* Main Top Navigation Tabs */}
      <Tabs defaultValue="sla_by_flow" className="w-full flex-1 flex flex-col min-h-0 overflow-hidden">
        <TabsList className="h-8 bg-card border shrink-0 hidden">
          <TabsTrigger value="sla_by_flow" className="text-xs font-bold px-4">
            Thời gian sản xuất theo Flow (F01 – F19)
          </TabsTrigger>
          <TabsTrigger value="sla_default" className="text-xs font-bold px-4">
            Thời gian sản xuất mặc định theo công đoạn
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs font-bold px-4">
            Lịch sử thay đổi ({historyLogs.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: SLA Theo Flow (F01 - F19) */}
        <TabsContent value="sla_by_flow" className="pt-0 flex-1 min-h-0 overflow-hidden flex flex-col mt-0">
          <div className="flex flex-col lg:flex-row gap-2.5 flex-1 min-h-0 overflow-hidden">
            {/* Left Sidebar: 19 Flows list (Compact width) */}
            <Card className="w-full lg:w-60 xl:w-64 shrink-0 shadow-sm border flex flex-col min-h-0 h-full overflow-hidden">
              <div className="p-1.5 border-b bg-card shrink-0">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Tìm mã hoặc tên flow..."
                    value={searchFlowQuery}
                    onChange={(e) => setSearchFlowQuery(e.target.value)}
                    className="h-7 text-xs pl-8 bg-muted/30"
                  />
                </div>
              </div>
              <CardContent className="p-1 space-y-1 flex-1 overflow-y-auto min-h-0">
                {filteredFlowGroups.map((group, groupIdx) => {
                  const GROUP_BG_CLASSES = [
                    "bg-slate-100/70 dark:bg-slate-800/40",
                    "bg-amber-50/70 dark:bg-amber-950/20",
                    "bg-blue-50/70 dark:bg-blue-950/20",
                    "bg-indigo-50/70 dark:bg-indigo-950/20",
                    "bg-purple-50/70 dark:bg-purple-950/20",
                    "bg-orange-50/70 dark:bg-orange-950/20",
                    "bg-teal-50/70 dark:bg-teal-950/20",
                  ];
                  const groupBg = GROUP_BG_CLASSES[groupIdx % GROUP_BG_CLASSES.length];

                  return (
                    <React.Fragment key={group.category || groupIdx}>
                      <div className={cn("p-0.5 rounded-md space-y-0.5 border border-black/5 dark:border-white/5", groupBg)}>
                        {group.flows.map((flow) => {
                          const isSelected = flow.id === selectedFlowId;
                          const flowStepsCount = (flowSlaMap[flow.id] || INITIAL_FLOW_SLA_MAP[flow.id] || []).length;
                          return (
                            <div
                              key={flow.id}
                              className={cn(
                                "flex items-center justify-between px-1.5 py-1 rounded-md text-[11px] transition-all cursor-pointer font-medium",
                                isSelected
                                  ? "bg-emerald-600 text-white font-bold shadow-xs"
                                  : "hover:bg-black/10 dark:hover:bg-white/10 text-foreground"
                              )}
                              onClick={() => setSelectedFlowId(flow.id)}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Badge
                                  variant={isSelected ? "outline" : "secondary"}
                                  className={cn(
                                    "text-[9px] px-1 py-0 font-bold shrink-0",
                                    isSelected
                                      ? "border-emerald-300/50 text-white bg-emerald-950/90"
                                      : "bg-background text-muted-foreground border"
                                  )}
                                >
                                  {flow.id}
                                </Badge>
                                <span className="truncate">{flow.name}</span>
                              </div>
                              <span className={cn("text-[9px] shrink-0 ml-1", isSelected ? "font-bold text-emerald-100" : "text-muted-foreground")}>
                                {flowStepsCount} bước
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {groupIdx < filteredFlowGroups.length - 1 && (
                        <div className="border-b border-slate-200 dark:border-slate-800 my-0.5 mx-0.5" />
                      )}
                    </React.Fragment>
                  );
                })}
              </CardContent>
            </Card>

            {/* Right Main SLA Details Area (Expanded width) */}
            <div className="flex-1 min-w-0 flex flex-col min-h-0 h-full overflow-y-auto gap-2 pr-1">
              {/* Selected Flow Header & Step Flowchart Unified Card */}
              <div className="p-2.5 bg-card rounded-lg border shadow-xs space-y-2 shrink-0">
                {/* Top Flow Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-md bg-amber-900 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                      {currentFlow.id}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">
                        {currentFlow.name}
                      </h2>
                      <Badge variant="outline" className="text-[9px] font-bold border-amber-800 text-amber-900 dark:text-amber-300 px-1.5 py-0">
                        {currentFlow.category}
                      </Badge>
                      <span className="text-[11px] font-mono text-muted-foreground">({currentFlow.code})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <Badge variant="secondary" className="text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-none px-2 py-0.5">
                      {currentStages.length} công đoạn
                    </Badge>
                    <button
                      type="button"
                      onClick={() => setIsFlowchartOpen(true)}
                      className="text-xs text-amber-900 dark:text-amber-400 font-bold cursor-pointer hover:underline flex items-center gap-1"
                    >
                      Xem chi tiết sơ đồ <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Horizontal Compact Step Flowchart */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs">
                  {currentStages.map((st, idx) => {
                    const fmtM = (m: number | null) => {
                      if (!m) return "—";
                      if (m < 60) return `${m}m`;
                      const hrs = m / 60;
                      if (Number.isInteger(hrs)) return `${hrs}h`;
                      return `${hrs.toFixed(1).replace(".0", "")}h`;
                    };

                    return (
                      <React.Fragment key={st.stepIndex}>
                        <div className="px-2.5 py-1.5 rounded-lg border bg-card text-center min-w-[105px] space-y-1 shadow-2xs shrink-0 border-slate-200 dark:border-slate-800">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-amber-900 text-white text-[10px] font-extrabold inline-flex items-center justify-center shrink-0">
                              {st.stepIndex}
                            </span>
                            <span className="font-bold text-[11px] text-foreground truncate">{st.stepName}</span>
                          </div>
                          {st.execWarning ? (
                            <p className="text-[10px] text-blue-700 dark:text-blue-300 font-mono font-bold leading-none bg-blue-50 dark:bg-blue-950/40 px-1 py-0.5 rounded">
                              Làm: {fmtM(st.execWarning)} → {fmtM(st.execLate)}
                            </p>
                          ) : (
                            <p className="text-[10px] text-muted-foreground italic leading-none">—</p>
                          )}
                        </div>
                        {idx < currentStages.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Main SLA Configuration Table */}
              <Card className="shadow-xs border overflow-hidden">
                <CardContent className="p-0 overflow-x-auto">
                  <Table className="text-xs border-collapse">
                    <TableHeader className="bg-muted/30">
                      <TableRow className="border-b">
                        <TableHead className="w-10 text-center font-bold">#</TableHead>
                        <TableHead className="font-bold min-w-[120px]">Công đoạn</TableHead>

                        {/* Distinct Header: THỜI GIAN CHỜ */}
                        <TableHead className="font-extrabold text-center bg-amber-100/90 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 border-x border-amber-300/80 uppercase tracking-wider py-2" colSpan={2}>
                          ⏳ Thời gian chờ (phút)
                        </TableHead>

                        {/* Distinct Header: THỜI GIAN THỰC HIỆN */}
                        <TableHead className="font-extrabold text-center bg-blue-100/90 dark:bg-blue-950/60 text-blue-950 dark:text-blue-200 border-x border-blue-300/80 uppercase tracking-wider py-2" colSpan={2}>
                          ⚙️ Thời gian thực hiện (phút)
                        </TableHead>
                      </TableRow>

                      <TableRow className="text-[10px] border-b">
                        <TableHead colSpan={2}></TableHead>
                        <TableHead className="text-center font-bold text-amber-800 dark:text-amber-300 bg-amber-50/90 dark:bg-amber-950/40 border-l border-amber-300/70">
                          Cảnh báo (Vàng)
                        </TableHead>
                        <TableHead className="text-center font-bold text-red-700 dark:text-red-300 bg-amber-50/90 dark:bg-amber-950/40 border-r border-amber-300/70">
                          Quá hạn (Đỏ)
                        </TableHead>
                        <TableHead className="text-center font-bold text-amber-800 dark:text-amber-300 bg-blue-50/90 dark:bg-blue-950/40 border-l border-blue-300/70">
                          Cảnh báo (Vàng)
                        </TableHead>
                        <TableHead className="text-center font-bold text-red-700 dark:text-red-300 bg-blue-50/90 dark:bg-blue-950/40 border-r border-blue-300/70">
                          Quá hạn (Đỏ)
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {currentStages.map((st, idx) => (
                        <TableRow key={st.stepIndex} className="hover:bg-muted/40 transition-colors border-b">
                          <TableCell className="text-center font-bold text-muted-foreground">{st.stepIndex}</TableCell>
                          <TableCell className="font-bold text-foreground">
                            <div className="flex items-center gap-1.5 group/code cursor-help" title={`Mã khâu: ${st.stageCode}`}>
                              <span>{st.stepName}</span>
                              <span className="text-[10px] font-mono text-muted-foreground bg-muted/80 px-1 py-0.5 rounded opacity-0 group-hover/code:opacity-100 transition-opacity">
                                ({st.stageCode})
                              </span>
                            </div>
                          </TableCell>

                          {/* WAIT SLA: Yellow Warning (Amber Column Tint) */}
                          <TableCell className="p-1 text-center bg-amber-50/30 dark:bg-amber-950/10 border-l border-amber-200/50">
                            <Input
                              type="number"
                              placeholder="—"
                              value={st.waitWarning ?? ""}
                              onChange={(e) => handleStageValueChange(idx, "waitWarning", e.target.value)}
                              className="h-7 w-16 text-center text-xs font-mono font-extrabold border-amber-300 bg-amber-100/70 dark:bg-amber-950/50 text-amber-950 dark:text-amber-100 focus:ring-2 focus:ring-amber-500 mx-auto"
                            />
                          </TableCell>

                          {/* WAIT SLA: Red Late (Amber Column Tint) */}
                          <TableCell className="p-1 text-center bg-amber-50/30 dark:bg-amber-950/10 border-r border-amber-200/50">
                            <Input
                              type="number"
                              placeholder="—"
                              value={st.waitLate ?? ""}
                              onChange={(e) => handleStageValueChange(idx, "waitLate", e.target.value)}
                              className="h-7 w-16 text-center text-xs font-mono font-extrabold border-red-300 bg-red-100/70 dark:bg-red-950/50 text-red-950 dark:text-red-100 focus:ring-2 focus:ring-red-500 mx-auto"
                            />
                          </TableCell>

                          {/* EXEC SLA: Yellow Warning (Blue Column Tint) */}
                          <TableCell className="p-1 text-center bg-blue-50/30 dark:bg-blue-950/10 border-l border-blue-200/50">
                            <Input
                              type="number"
                              placeholder="—"
                              value={st.execWarning ?? ""}
                              onChange={(e) => handleStageValueChange(idx, "execWarning", e.target.value)}
                              className="h-7 w-16 text-center text-xs font-mono font-extrabold border-amber-300 bg-amber-100/70 dark:bg-amber-950/50 text-amber-950 dark:text-amber-100 focus:ring-2 focus:ring-amber-500 mx-auto"
                            />
                          </TableCell>

                          {/* EXEC SLA: Red Late (Blue Column Tint) */}
                          <TableCell className="p-1 text-center bg-blue-50/30 dark:bg-blue-950/10 border-r border-blue-200/50">
                            <Input
                              type="number"
                              placeholder="—"
                              value={st.execLate ?? ""}
                              onChange={(e) => handleStageValueChange(idx, "execLate", e.target.value)}
                              className="h-7 w-16 text-center text-xs font-mono font-extrabold border-red-300 bg-red-100/70 dark:bg-red-950/50 text-red-950 dark:text-red-100 focus:ring-2 focus:ring-red-500 mx-auto"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

            </div>
          </div>
        </TabsContent>

        {/* TAB 2: SLA Mặc Định Theo Công Đoạn */}
        <TabsContent value="sla_default" className="pt-3">
          <Card className="shadow-sm border">
            <CardHeader className="py-3 px-4 border-b bg-card flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  SLA mặc định theo công đoạn (Toàn hệ thống)
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Áp dụng mặc định khi tạo mới Flow hoặc khi công đoạn chưa có SLA riêng.
                </p>
              </div>
              <Button size="sm" className="h-8 text-xs font-bold gap-1" onClick={handleSaveGlobalDefaults}>
                <Save className="w-3.5 h-3.5" /> Lưu SLA Mặc định
              </Button>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table className="text-xs">
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="w-12 text-center font-bold">STT</TableHead>
                    <TableHead className="font-bold">Mã khâu</TableHead>
                    <TableHead className="font-bold">Tên công đoạn</TableHead>
                    <TableHead className="font-bold text-center bg-amber-50/50 dark:bg-amber-950/20" colSpan={2}>
                      Thời gian chờ mặc định (phút)
                    </TableHead>
                    <TableHead className="font-bold text-center bg-blue-50/50 dark:bg-blue-950/20" colSpan={2}>
                      Thời gian thực hiện mặc định (phút)
                    </TableHead>
                  </TableRow>
                  <TableRow className="bg-muted/20 text-[10px]">
                    <TableHead colSpan={3}></TableHead>
                    <TableHead className="text-center font-bold text-amber-700">Vàng (Cảnh báo)</TableHead>
                    <TableHead className="text-center font-bold text-red-700">Đỏ (Quá hạn)</TableHead>
                    <TableHead className="text-center font-bold text-amber-700">Vàng (Cảnh báo)</TableHead>
                    <TableHead className="text-center font-bold text-red-700">Đỏ (Quá hạn)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {globalDefaults.map((st, idx) => (
                    <TableRow key={st.stageCode} className="hover:bg-muted/50">
                      <TableCell className="text-center font-bold text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-mono font-bold text-primary">{st.stageCode}</TableCell>
                      <TableCell className="font-bold text-foreground">{st.stageName}</TableCell>
                      <TableCell className="p-1 text-center">
                        <Input
                          type="number"
                          value={st.waitWarning ?? ""}
                          onChange={(e) => handleGlobalValueChange(idx, "waitWarning", e.target.value)}
                          className="h-7 w-20 text-center text-xs font-mono font-bold border-amber-200 bg-amber-50/40 mx-auto"
                        />
                      </TableCell>
                      <TableCell className="p-1 text-center">
                        <Input
                          type="number"
                          value={st.waitLate ?? ""}
                          onChange={(e) => handleGlobalValueChange(idx, "waitLate", e.target.value)}
                          className="h-7 w-20 text-center text-xs font-mono font-bold border-red-200 bg-red-50/40 mx-auto"
                        />
                      </TableCell>
                      <TableCell className="p-1 text-center">
                        <Input
                          type="number"
                          value={st.execWarning ?? ""}
                          onChange={(e) => handleGlobalValueChange(idx, "execWarning", e.target.value)}
                          className="h-7 w-20 text-center text-xs font-mono font-bold border-amber-200 bg-amber-50/40 mx-auto"
                        />
                      </TableCell>
                      <TableCell className="p-1 text-center">
                        <Input
                          type="number"
                          value={st.execLate ?? ""}
                          onChange={(e) => handleGlobalValueChange(idx, "execLate", e.target.value)}
                          className="h-7 w-20 text-center text-xs font-mono font-bold border-red-200 bg-red-50/40 mx-auto"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Lịch Sử Thay Đổi */}
        <TabsContent value="history" className="pt-3">
          <Card className="shadow-sm border">
            <CardHeader className="py-3 px-4 border-b bg-card flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  Nhật ký lịch sử thay đổi SLA
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ghi lại thời gian, tài khoản thực hiện và nội dung điều chỉnh mốc thời gian sản xuất.
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-8 text-center text-xs text-muted-foreground">
                Chưa có dữ liệu nhật ký thay đổi mốc thời gian sản xuất.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIALOG 1: Hướng Dẫn Cấu Hình */}
      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-primary">
              <HelpCircle className="w-5 h-5 text-blue-600 shrink-0" />
              Hướng dẫn cấu hình Thời gian sản xuất 2 chiều cho 19 Flow
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-muted-foreground">
              Quy định và cách thiết lập ngưỡng mốc Vàng (Cảnh báo) & Đỏ (Quá hạn) riêng biệt cho từng dòng sản phẩm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5 text-sm leading-relaxed py-2">
            <div className="p-3.5 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-950 space-y-1 shadow-2xs">
              <p className="font-bold text-base text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" /> 1. Thời gian chờ
              </p>
              <p className="text-sm text-amber-900/90 leading-normal">
                Là khoảng thời gian cho phép kể từ khi <strong>công đoạn trước hoàn thành</strong> cho đến khi <strong>công đoạn hiện tại được bắt đầu</strong>.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-blue-50/80 border border-blue-200 text-blue-950 space-y-1 shadow-2xs">
              <p className="font-bold text-base text-blue-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-700 shrink-0" /> 2. Thời gian thực hiện
              </p>
              <p className="text-sm text-blue-900/90 leading-normal">
                Là thời gian tối đa cho phép để <strong>hoàn tất thao tác</strong> trực tiếp tại công đoạn (In, Cán màng, Bế, Cắt, Dán, Xếp hông, Chạy zip...).
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2 shadow-2xs">
              <p className="font-bold text-base text-foreground">3. Độc lập theo 19 Flow sản xuất (F01 - F19):</p>
              <ul className="list-disc list-inside space-y-1.5 text-sm text-foreground/90 leading-relaxed pl-1">
                <li>Mỗi Flow có chuỗi các bước công đoạn và mốc thời gian sản xuất hoàn toàn độc lập.</li>
                <li>Chỉnh sửa mốc thời gian ở Flow nào sẽ chỉ tác động tới Flow đó (ví dụ F12 có bước Xếp hông, F14 có bước Chạy Zip).</li>
                <li>Để trống (—) nếu công đoạn đó không cài mốc cảnh báo.</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button size="default" className="font-bold px-5" onClick={() => setIsHelpOpen(false)}>
              Đã hiểu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 4: Lưu Ý Vận Hành */}
      <Dialog open={isNotesOpen} onOpenChange={setIsNotesOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-amber-900 dark:text-amber-400">
              <Info className="w-5 h-5 text-amber-600 shrink-0" />
              Lưu ý quan trọng khi vận hành & cấu hình Thời gian sản xuất
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-muted-foreground">
              Các nguyên tắc áp dụng mốc thời gian, cảnh báo hệ thống và quản lý chỉ số hiệu suất sản xuất.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 text-sm leading-relaxed py-2">
            <div className="p-3.5 rounded-lg bg-amber-50/90 border border-amber-200 text-amber-950 space-y-1 shadow-2xs">
              <p className="font-bold text-base text-amber-900 flex items-center gap-2">
                📌 1. Ngưỡng Vàng (Cảnh báo nhắc nhở)
              </p>
              <p className="text-sm text-amber-900/90 leading-normal">
                Khi công đoạn vượt quá mốc <strong>Thời gian Vàng</strong>, hệ thống tự động bật cảnh báo màu vàng trên màn hình Điều độ và gửi thông báo tới Trưởng ca để chủ động kiểm tra, xử lý nghẽn lệnh.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-red-50/80 border border-red-200 text-red-950 space-y-1 shadow-2xs">
              <p className="font-bold text-base text-red-900 flex items-center gap-2">
                🚨 2. Ngưỡng Đỏ (Tính lỗi Quá hạn sản xuất)
              </p>
              <p className="text-sm text-red-900/90 leading-normal">
                Khi công đoạn vượt quá mốc <strong>Thời gian Đỏ</strong>, công đoạn đó chính thức bị ghi nhận vi phạm thời gian sản xuất (Late), ảnh hưởng trực tiếp tới chỉ số đánh giá hiệu suất KPI của xưởng.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button size="default" className="font-bold px-5 bg-amber-900 hover:bg-amber-950 text-white" onClick={() => setIsNotesOpen(false)}>
              Đã hiểu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: Sao Chép Cấu Hình */}
      <Dialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Copy className="w-4 h-4 text-primary" />
              Sao chép cấu hình Thời gian sản xuất sang {currentFlow.id}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Chọn Flow nguồn để sao chép mốc thời gian sang <strong>{currentFlow.id} - {currentFlow.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-foreground">Chọn Flow nguồn:</label>
              <Select value={sourceCopyFlow} onValueChange={setSourceCopyFlow}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Chọn flow nguồn..." />
                </SelectTrigger>
                <SelectContent>
                  {FLOW_GROUPS.flatMap((g) => g.flows)
                    .filter((f) => f.id !== selectedFlowId)
                    .map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.id} - {f.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 border-t pt-3">
              <label className="font-bold text-foreground block">Tùy chọn sao chép:</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={copyWaitTime} onCheckedChange={(v) => setCopyWaitTime(!!v)} />
                  <span>Sao chép toàn bộ Mốc thời gian chờ</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={copyExecTime} onCheckedChange={(v) => setCopyExecTime(!!v)} />
                  <span>Sao chép toàn bộ Mốc thời gian thực hiện</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsCopyDialogOpen(false)}>
              Hủy bỏ
            </Button>
            <Button size="sm" className="font-bold gap-1" onClick={handleCopySla}>
              <Copy className="w-3.5 h-3.5" /> Thao tác Sao Chép
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: Flowchart Chi Tiết Các Flow */}
      <Dialog open={isFlowchartOpen} onOpenChange={setIsFlowchartOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-primary">
              <Layers className="w-5 h-5 text-amber-900 dark:text-amber-400" />
              Sơ đồ quy trình Thời gian sản xuất 2 chiều ({currentFlow.id} - {currentFlow.name})
            </DialogTitle>
            <DialogDescription className="text-sm">
              Trình bày chuỗi công đoạn sản xuất và mốc giới hạn Vàng/Đỏ (tự động quy đổi ra Giờ & Phút) dành riêng cho {currentFlow.id}.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-4 max-h-[600px] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {currentStages.map((st) => {
                const formatSingleValue = (m: number | null) => {
                  if (m === null || m === undefined) return "—";
                  if (m < 60) return `${m} phút`;
                  const hrs = m / 60;
                  if (Number.isInteger(hrs)) return `${hrs}h (${m}m)`;
                  return `${hrs.toFixed(1).replace(".0", "")}h (${m}m)`;
                };

                return (
                  <div key={st.stepIndex} className="p-3.5 rounded-xl border bg-card space-y-3 relative shadow-xs hover:border-amber-400 transition-colors">
                    <div className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-amber-900 text-white font-extrabold text-xs flex items-center justify-center shadow-2xs">
                          {st.stepIndex}
                        </span>
                        <h4 className="font-bold text-base text-foreground">{st.stepName}</h4>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono font-bold bg-muted/60">
                        {st.stageCode}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-xs">
                      {/* Wait SLA */}
                      <div className="p-2 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 space-y-0.5">
                        <span className="text-[11px] font-semibold text-amber-900 dark:text-amber-300 block">
                          Chờ (Vàng → Đỏ):
                        </span>
                        <p className="font-mono font-bold text-xs text-amber-800 dark:text-amber-200">
                          {st.waitWarning || st.waitLate
                            ? `${formatSingleValue(st.waitWarning)} → ${formatSingleValue(st.waitLate)}`
                            : "—"}
                        </p>
                      </div>

                      {/* Exec SLA */}
                      <div className="p-2 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 space-y-0.5">
                        <span className="text-[11px] font-semibold text-blue-900 dark:text-blue-300 block">
                          Làm (Vàng → Đỏ):
                        </span>
                        <p className="font-mono font-bold text-xs text-blue-800 dark:text-blue-200">
                          {st.execWarning || st.execLate
                            ? `${formatSingleValue(st.execWarning)} → ${formatSingleValue(st.execLate)}`
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button size="default" className="font-bold px-6 bg-amber-900 hover:bg-amber-950 text-white" onClick={() => setIsFlowchartOpen(false)}>
              Đóng sơ đồ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
