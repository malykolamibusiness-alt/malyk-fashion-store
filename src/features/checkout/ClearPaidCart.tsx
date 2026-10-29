"use client";

import { useEffect } from "react";
import { useCart } from "@/features/cart/CartProvider";

export function ClearPaidCart() {
  const { clearCart } = useCart();
  useEffect(() => { clearCart(); }, [clearCart]);
  return null;
}
