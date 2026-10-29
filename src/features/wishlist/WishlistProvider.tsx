"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { productById } from "@/data/products";

const STORAGE_KEY = "malyk-demo-wishlist-v1";
const emptyWishlist: string[] = [];
const listeners = new Set<() => void>();
let snapshot = emptyWishlist;
let initialized = false;

function initialize() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    snapshot = Array.isArray(parsed)
      ? [...new Set(parsed.filter((id): id is string =>
          typeof id === "string" && productById.has(id),
        ))]
      : emptyWishlist;
  } catch (error) {
    snapshot = emptyWishlist;
    console.warn("MALYK demo wishlist could not be restored.", error);
  }
}

function getSnapshot() {
  initialize();
  return snapshot;
}

function getServerSnapshot() {
  return emptyWishlist;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function publish(next: string[]) {
  snapshot = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn("MALYK demo wishlist could not be persisted.", error);
  }
  listeners.forEach((listener) => listener());
}

type WishlistActions = {
  toggleWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
};

const WishlistContext = createContext<WishlistActions | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const actions: WishlistActions = {
    toggleWishlist(productId) {
      if (!productById.has(productId)) return;
      publish(
        snapshot.includes(productId)
          ? snapshot.filter((id) => id !== productId)
          : [...snapshot, productId],
      );
    },
    removeFromWishlist(productId) {
      publish(snapshot.filter((id) => id !== productId));
    },
  };

  return (
    <WishlistContext.Provider value={actions}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const actions = useContext(WishlistContext);
  const productIds = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  if (!actions) {
    throw new Error("useWishlist must be used inside WishlistProvider.");
  }
  return { productIds, ...actions };
}
