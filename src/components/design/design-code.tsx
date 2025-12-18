import { useState, useMemo } from "react";
import { Copy, Check } from "lucide-react";

interface Props {
  code: string;
  designName: string; // "KING AZ"
  dimensions: string; // "325 x 80"
  extraNote?: string; // "bao gồm 15mm mép dán"
  createdAt: string; // "2025-11-26T10:38:30.3642249"
}

export default function DesignCode(props: Props) {
  const [copied, setCopied] = useState(false);

  const { code, designName, dimensions, extraNote, createdAt } = props;

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
    const text = `${code}: ${designName} - KT: ${dimensions}mm${
      extraNote ? ` (${extraNote})` : ""
    } - Ngày ${formattedDate}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="flex items-center gap-2 text-sm text-black">
      {/* CODE: */}
      <span className="font-bold">{code}:</span>

      {/* MATERIAL + DESIGN NAME */}
      {/* <span className="font-bold uppercase">{materialType}</span> */}
      <span className="font-semibold uppercase">{designName}</span>

      {/* - KT: 325 x 80mm */}
      <span className="font-normal">-</span>
      <span>KT:</span>
      <span className="font-bold">{dimensions}mm</span>

      {/* (bao gồm 15mm mép dán) */}
      {extraNote && <span className="italic text-gray-700">({extraNote})</span>}

      {/* - Ngày 26/11/2025 */}
      <span className="font-normal">-</span>
      <span>Ngày: </span>
      <span className="font-bold">{formattedDate}</span>

      {/* Copy button */}
      <button
        type="button"
        onClick={handleCopyToClipboard}
        className="ml-2 inline-flex items-center rounded px-1 py-0.5 hover:bg-gray-100 transition"
        title="Copy nội dung"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-600" />
        ) : (
          <Copy className="w-4 h-4 text-gray-600" />
        )}
      </button>
    </div>
  );
}
