import type { DieResponse } from "@/Schema";

/**
 * Format dimensions to string (handles width = 0 case)
 */
export function formatDimensions(
  length: number,
  width: number | undefined,
  height: number
): string {
  if (width && width > 0) {
    return `${length}x${width}x${height}`;
  }
  return `${length}x${height}`;
}

/**
 * Format design dimensions for display (handles width = 0 case)
 * @param length - Length in cm (will be multiplied by multiplier)
 * @param width - Width in cm (will be multiplied by multiplier, can be 0 or undefined)
 * @param height - Height in cm (will be multiplied by multiplier)
 * @param multiplier - Multiplier to convert units (default: 1, use 10 for cm to mm)
 * @param separator - Separator between dimensions (default: " × ")
 * @returns Formatted string like "100 × 50" or "100 × 50 × 30" (if width > 0)
 */
export function formatDesignDimensions(
  length: number | undefined,
  width: number | undefined,
  height: number | undefined,
  multiplier: number = 1,
  separator: string = " × "
): string {
  if (length == null || height == null) {
    return "—";
  }

  const lengthValue = length * multiplier;
  const heightValue = height * multiplier;

  // If width is 0 or undefined, only show length × height
  if (!width || width === 0) {
    return `${lengthValue}${separator}${heightValue}`;
  }

  // If width > 0, show length × width × height
  const widthValue = width * multiplier;
  return `${lengthValue}${separator}${widthValue}${separator}${heightValue}`;
}

/**
 * Format die size display (handles width = 0 case)
 * If width is 0, only displays length x height
 */
export function formatDieSize(die?: DieResponse | null): string {
  if (!die) return "—";

  // If die has length, width, height fields, use them to format
  if (
    die.length != null &&
    die.height != null &&
    typeof die.length === "number" &&
    typeof die.height === "number"
  ) {
    const width = typeof die.width === "number" ? die.width : undefined;
    return formatDimensions(die.length, width, die.height);
  }
  // Fallback to die.size if available
  if (die.size) {
    // Try to parse and reformat if it contains "x0x" pattern
    const sizeStr = die.size.trim();
    // Match patterns like "100x0x100", "100x0x100 cm", etc.
    const match = sizeStr.match(
      /^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)/i
    );
    if (match) {
      const length = parseFloat(match[1]);
      const width = parseFloat(match[2]);
      const height = parseFloat(match[3]);
      // If width is 0, format as length x height only
      if (width === 0) {
        // Extract unit if present (cm, mm, etc.)
        const unitMatch = sizeStr.match(/\s*([a-z]+)$/i);
        const unit = unitMatch ? ` ${unitMatch[1]}` : "";
        return `${length}x${height}${unit}`;
      }
    }
    return sizeStr;
  }
  return "—";
}
