"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { CartItem } from "@/types/product";

const STORAGE_KEY = "malyk-demo-cart-v2";
const LEGACY_STORAGE_KEY = "malyk-demo-cart-v1";
const emptyItems: CartItem[] = [];
const listeners = new Set<() => void>();
let snapshot = emptyItems;
let initialized = false;
let recoveryMessage = "";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateItem(value: unknown): CartItem | null {
  if (
    !isRecord(value) ||
    typeof value.productId !== "string" ||
    value.productId.length === 0 ||
    typeof value.variantId !== "string" ||
    value.variantId.length === 0 ||
    typeof value.size !== "string" ||
    typeof value.colorId !== "string" ||
    !Number.isInteger(value.quantity) ||
    Number(value.quantity) < 1 ||
    Number(value.quantity) > 99
  ) {
    return null;
  }

  return {
    productId: value.productId,
    variantId: value.variantId,
    size: value.size,
    colorId: value.colorId,
    quantity: Number(value.quantity),
  };
}

function persist(items: CartItem[]) {
  snapshot = items;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 2, items }),
    );
  } catch (error) {
    recoveryMessage =
      "Your bag is available for this visit but could not be saved in this browser.";
    console.warn("MALYK bag could not be persisted.", error);
  }
  listeners.forEach((listener) => listener());
}

function initialize() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      if (window.localStorage.getItem(LEGACY_STORAGE_KEY)) {
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
        recoveryMessage =
          "Your previous demonstration bag was cleared. Please add those items again.";
      }
      return;
    }

    const parsed: unknown = JSON.parse(stored);
    if (!isRecord(parsed) || parsed.version !== 2 || !Array.isArray(parsed.items)) {
      recoveryMessage = "Your saved bag was out of date and has been cleared.";
      persist(emptyItems);
      return;
    }

    const validItems = parsed.items
      .map(validateItem)
      .filter((item): item is CartItem => item !== null);
    if (validItems.length !== parsed.items.length) {
      recoveryMessage =
        "Some invalid items were removed from your saved bag.";
      persist(validItems);
      return;
    }
    snapshot = validItems;
  } catch (error) {
    recoveryMessage = "Your saved bag could not be restored.";
    console.warn("MALYK bag could not be restored.", error);
    snapshot = emptyItems;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  initialize();
  return snapshot;
}

function getServerSnapshot() {
  return emptyItems;
}

type CartContextValue = {
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const value: CartContextValue = {
    addItem(item) {
      const validItem = validateItem(item);
      if (!validItem) {
        throw new Error("Choose a valid product option and quantity.");
      }

      const existing = snapshot.find(
        (line) => line.variantId === validItem.variantId,
      );
      const nextQuantity = (existing?.quantity ?? 0) + validItem.quantity;
      if (nextQuantity > 99) {
        throw new Error("A bag line cannot contain more than 99 units.");
      }

      persist(
        existing
          ? snapshot.map((line) =>
              line.variantId === validItem.variantId
                ? { ...line, quantity: nextQuantity }
                : line,
            )
          : [...snapshot, validItem],
      );
    },
    removeItem(variantId) {
      persist(snapshot.filter((item) => item.variantId !== variantId));
    },
    updateQuantity(variantId, quantity) {
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        throw new Error("Quantity must be a whole number between 1 and 99.");
      }
      if (!snapshot.some((line) => line.variantId === variantId)) return;
      persist(
        snapshot.map((line) =>
          line.variantId === variantId ? { ...line, quantity } : line,
        ),
      );
    },
    clearCart() {
      persist(emptyItems);
    },
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const actions = useContext(CartContext);
  const items = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  if (!actions) throw new Error("useCart must be used inside CartProvider.");

  return {
    items,
    itemCount: items.reduce((count, item) => count + item.quantity, 0),
    recoveryMessage,
    ...actions,
  };
}
