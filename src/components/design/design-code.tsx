import { useState, useMemo } from "react";
import { Copy, Check } from "lucide-react";

interface Props {
  code: string;
  designName: string; // "KING AZ"
  dimensions: string; // "325 x 80"
  extraNote?: string; // "bao gồm 15mm mép dán"
  createdAt: string; // "2025-11-26T10:38:30.3642249"
  adhesiveOffset?: number; // "15"
  showCopy?: boolean;
  customerName?: string;
  designerName?: string;
  updatedAt?: string;
}

export default function DesignCode(props: Props) {
  const [copied, setCopied] = useState(false);

  const { code, designName, dimensions, extraNote, createdAt, adhesiveOffset, customerName, designerName, updatedAt } =
    props;

  // 2) Format date string "2025-11-26T10:38:30.3642249" -> "26/11/2025"
  const formattedDate = useMemo(() => {
    const d = new Date(createdAt);
    if (Number.isNaN(d.getTime())) {
      // nếu parse lỗi thì trả ra chuỗi gốc
      return createdAt;
    }
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }, [createdAt]);

  // Format updatedAt string e.g. "2025-11-26T10:38:30.3642249" -> "26/11/2025 10:38"
  const formattedUpdatedAt = useMemo(() => {
    if (!updatedAt) return "";
    const d = new Date(updatedAt);
    if (Number.isNaN(d.getTime())) {
      return updatedAt;
    }
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [updatedAt]);

  const handleCopyToClipboard = async () => {
    const text = `${code}: ${designName} - KT: ${dimensions}mm${
      adhesiveOffset && adhesiveOffset > 0 ? `(bao gồm ${adhesiveOffset}mm mép dán)` : ""
    }${extraNote ? ` (${extraNote})` : ""}${
      customerName ? ` - KH: ${customerName}` : ""
    }${
      designerName ? ` - TK: ${designerName}` : ""
    } - Ngày ${formattedDate}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="flex flex-col gap-2 text-sm text-black">
      {/* ROW 1: CODE + DESIGN NAME + CUSTOMER + DESIGNER */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <div className="flex items-center gap-2">
          <span className="font-bold shrink-0 whitespace-nowrap">{code}:</span>
          <span className="font-semibold uppercase break-all text-slate-900 dark:text-slate-100">
            {designName}
          </span>
        </div>

        {customerName && (
          <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/20 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900/30">
            <span className="text-[10px] uppercase font-bold text-blue-700/60 dark:text-blue-400/60">
              Khách hàng:
            </span>
            <span className="font-bold text-blue-700 dark:text-blue-300">
              {customerName}
            </span>
          </div>
        )}

        {designerName && (
          <div className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/20 px-2 py-0.5 rounded border border-purple-100 dark:border-purple-900/30">
            <span className="text-[10px] uppercase font-bold text-purple-700/60 dark:text-purple-400/60">
              Thiết kế:
            </span>
            <span className="font-bold text-purple-700 dark:text-purple-300">
              {designerName}
            </span>
          </div>
        )}
      </div>

      {/* ROW 2: SPECS + DATE + ACTIONS */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
          <span className="text-[10px] uppercase font-bold opacity-60">
            KT:
          </span>
          <span className="font-bold text-slate-900 dark:text-slate-100">
            {dimensions}mm
          </span>
        </div>

        {adhesiveOffset !== undefined && adhesiveOffset > 0 && (
          <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded border border-amber-200/50">
            <span className="text-[10px] uppercase font-bold opacity-60">
              Mép dán:
            </span>
            <span className="font-bold">{adhesiveOffset}mm</span>
          </div>
        )}

        {extraNote && (
          <div className="flex items-center gap-1.5 italic text-slate-500 break-all">
            ({extraNote})
          </div>
        )}

        <div className="flex items-center gap-1.5 border-l pl-4 border-slate-200 dark:border-slate-800">
          <span className="text-[10px] uppercase font-bold opacity-60">
            Ngày tạo:
          </span>
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {formattedDate}
          </span>
        </div>

        {updatedAt && (
          <div className="flex items-center gap-1.5 border-l pl-4 border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold opacity-60">
              Cập nhật mới nhất:
            </span>
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {formattedUpdatedAt}
            </span>
          </div>
        )}

        {props.showCopy !== false && (
          <button
            type="button"
            onClick={handleCopyToClipboard}
            className="ml-auto inline-flex items-center gap-1 rounded bg-primary text-primary-foreground px-2 py-1 hover:opacity-90 transition shadow-sm active:scale-95"
            title="Copy nội dung"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span className="text-[10px] font-bold uppercase">Copy</span>
          </button>
        )}
      </div>
    </div>
  );
}
