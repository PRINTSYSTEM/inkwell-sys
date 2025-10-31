import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Customer } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Utility functions cho quản lý công nợ khách hàng
export function checkDebtStatus(customer: Customer): {
  status: 'good' | 'warning' | 'blocked';
  message: string;
  canCreateOrder: boolean;
} {
  const debtRatio = customer.currentDebt / customer.maxDebt;
  
  if (customer.currentDebt > customer.maxDebt) {
    return {
      status: 'blocked',
      message: `Khách hàng đã vượt mức công nợ cho phép. Hiện tại: ${customer.currentDebt.toLocaleString('vi-VN')}₫ / Tối đa: ${customer.maxDebt.toLocaleString('vi-VN')}₫`,
      canCreateOrder: false
    };
  }
  
  if (debtRatio >= 0.8) {
    return {
      status: 'warning',
      message: `Khách hàng gần đạt mức công nợ tối đa (${Math.round(debtRatio * 100)}%). Cần theo dõi chặt chẽ.`,
      canCreateOrder: true
    };
  }
  
  return {
    status: 'good',
    message: `Tình trạng công nợ tốt (${Math.round(debtRatio * 100)}% mức tối đa).`,
    canCreateOrder: true
  };
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('vi-VN') + '₫';
}

export function getDebtAlert(customer: Customer): string | null {
  const status = checkDebtStatus(customer);
  if (status.status === 'blocked') {
    return `🚫 CẢNH BÁO: ${customer.representativeName} (${customer.code}) đã vượt mức công nợ cho phép!`;
  }
  if (status.status === 'warning') {
    return `⚠️ CHÚ Ý: ${customer.representativeName} (${customer.code}) gần đạt mức công nợ tối đa!`;
  }
  return null;
}
