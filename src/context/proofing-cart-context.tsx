import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface CartItem {
  readyDesignId: number;
  orderDetailId?: number;
  designCode: string;
  designName: string;
  designImageUrl?: string;
  designTypeName?: string;
  materialTypeName?: string;
  availableQuantity?: number;
  quantity: number | null; // nhập sau ở màn chi tiết
  length?: number;
  width?: number;
  height?: number;
  createdAt?: string | null;
}

interface ProofingCartContextValue {
  cartItems: CartItem[];
  addToCart: (items: CartItem[]) => void;
  removeFromCart: (readyDesignId: number) => void;
  updateQuantity: (readyDesignId: number, quantity: number | null) => void;
  clearCart: () => void;
  cartCount: number;
}

const STORAGE_KEY = "proofing_cart";

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

const ProofingCartContext = createContext<ProofingCartContextValue | undefined>(undefined);

export const ProofingCartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(loadCart);

  // Sync to localStorage whenever cartItems changes
  useEffect(() => {
    saveCart(cartItems);
  }, [cartItems]);

  const addToCart = useCallback((items: CartItem[]) => {
    setCartItems((prev) => {
      const existing = new Set(prev.map((i) => i.readyDesignId));
      const newItems = items.filter((i) => !existing.has(i.readyDesignId));
      return [...prev, ...newItems];
    });
  }, []);

  const removeFromCart = useCallback((readyDesignId: number) => {
    setCartItems((prev) => prev.filter((i) => i.readyDesignId !== readyDesignId));
  }, []);

  const updateQuantity = useCallback((readyDesignId: number, quantity: number | null) => {
    setCartItems((prev) =>
      prev.map((i) => (i.readyDesignId === readyDesignId ? { ...i, quantity } : i))
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  return (
    <ProofingCartContext.Provider
      value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartCount: cartItems.length }}
    >
      {children}
    </ProofingCartContext.Provider>
  );
};

export function useProofingCart() {
  const ctx = useContext(ProofingCartContext);
  if (!ctx) {
    throw new Error("useProofingCart must be used within a ProofingCartProvider");
  }
  return ctx;
}
