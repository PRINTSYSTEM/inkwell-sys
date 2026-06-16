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
}

export default function DesignCode(props: Props) {
  const [copied, setCopied] = useState(false);

  const { code, designName, dimensions, extraNote, createdAt, adhesiveOffset } =
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

  const handleCopyToClipboard = async () => {
    const text = `${code}: ${designName} - KT: ${dimensions}mm${adhesiveOffset > 0 ? `(bao gồm ${adhesiveOffset}mm mép dán)` : ""}${
      extraNote ? ` (${extraNote})` : ""
    } - Ngày ${formattedDate}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="flex flex-col gap-2 text-sm text-black pl-12">
      {/* ROW 1: CODE + DESIGN NAME */}
      <div className="flex items-start gap-2">
        <span className="font-bold shrink-0 whitespace-nowrap">{code}:</span>
        <span className="font-semibold uppercase break-all text-slate-900 dark:text-slate-100 max-w-[60%]">
          {designName}
        </span>
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

        {adhesiveOffset > 0 && (
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
