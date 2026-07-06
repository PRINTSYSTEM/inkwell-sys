import { format } from "date-fns";

/**
 * Định dạng ngày tháng sang DD-MM-YYYY thống nhất cho toàn hệ thống
 */
export function formatDateForFilename(date?: string | Date | null): string {
  if (!date) return "";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (d instanceof Date && !isNaN(d.getTime())) {
      return format(d, "dd-MM-yyyy");
    }
  } catch (e) {
    console.error("Lỗi định dạng ngày cho tên file:", e);
  }
  return "";
}

/**
 * Loại bỏ/thay thế các ký tự không hợp lệ trong tên file (Windows/macOS/Linux)
 * Ví dụ: Công ty TNHH A/B -> Công ty TNHH A_B
 */
export function sanitizeFilename(name?: string | null): string {
  if (!name) return "";
  // Thay thế \ / : * ? " < > | bằng "_"
  return name.replace(/[\/\\:*?"<>|]/g, "_").trim();
}

/**
 * Ghép các phần của tên file bằng dấu " - ", tự động loại bỏ các phần rỗng/undefined
 */
export function buildFilename(
  parts: Array<string | null | undefined>,
  extension: string
): string {
  const sanitizedParts = parts
    .map((part) => {
      if (part === null || part === undefined) return "";
      return sanitizeFilename(String(part));
    })
    .filter((part) => part !== "");

  const ext = extension.startsWith(".") ? extension : `.${extension}`;
  return `${sanitizedParts.join(" - ")}${ext}`;
}
