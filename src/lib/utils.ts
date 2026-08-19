import * as React from "react";
import { Link } from "react-router-dom";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Customer } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats relative image URLs returned by the API (e.g. /storage/... or uploads/...)
 * into absolute URLs pointing to the backend API host.
 */
export function formatImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, "");
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return apiBaseUrl ? `${apiBaseUrl}${cleanPath}` : cleanPath;
}

// Utility functions cho quản lý công nợ khách hàng
export function checkDebtStatus(customer: Customer): {
  status: "good" | "warning" | "blocked";
  message: string;
  canCreateOrder: boolean;
} {
  const debtRatio = customer.currentDebt / customer.maxDebt;

  if (customer.currentDebt > customer.maxDebt) {
    return {
      status: "blocked",
      message: `Khách hàng đã vượt mức công nợ cho phép. Hiện tại: ${customer.currentDebt.toLocaleString(
        "vi-VN"
      )}₫ / Tối đa: ${customer.maxDebt.toLocaleString("vi-VN")}₫`,
      canCreateOrder: false,
    };
  }

  if (debtRatio >= 0.8) {
    return {
      status: "warning",
      message: `Khách hàng gần đạt mức công nợ tối đa (${Math.round(
        debtRatio * 100
      )}%). Cần theo dõi chặt chẽ.`,
      canCreateOrder: true,
    };
  }

  return {
    status: "good",
    message: `Tình trạng công nợ tốt (${Math.round(
      debtRatio * 100
    )}% mức tối đa).`,
    canCreateOrder: true,
  };
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString("vi-VN") + "₫";
}

export function getDebtAlert(customer: Customer): React.ReactNode | null {
  const status = checkDebtStatus(customer);
  if (status.status === "blocked") {
    return React.createElement(
      "span",
      null,
      "🚫 CẢNH BÁO: ",
      React.createElement(
        Link,
        {
          to: `/customers/${customer.id}`,
          className: "font-semibold underline hover:text-red-800 transition-colors",
        },
        `${customer.representativeName} (${customer.code})`
      ),
      " đã vượt mức công nợ cho phép!"
    );
  }
  if (status.status === "warning") {
    return React.createElement(
      "span",
      null,
      "⚠️ CHÚ Ý: ",
      React.createElement(
        Link,
        {
          to: `/customers/${customer.id}`,
          className: "font-semibold underline hover:text-amber-800 transition-colors",
        },
        `${customer.representativeName} (${customer.code})`
      ),
      " gần đạt mức công nợ tối đa!"
    );
  }
  return null;
}
