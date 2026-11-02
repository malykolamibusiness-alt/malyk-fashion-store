"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "malyk-demo-wishlist-v1";

function supabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim(),
  );
}
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
          typeof id === "string" && id.trim().length > 0,
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
  announcement: string;
};

const WishlistContext = createContext<WishlistActions | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (!supabaseConfigured()) return;
    let active = true;
    const supabase = createClient();
    async function synchronize(sessionUserId: string | undefined) {
      if (!sessionUserId) return;
      const guestIds = [...snapshot];
      const { data: stored, error } = await supabase
        .from("wishlist_items")
        .select("product_id")
        .eq("user_id", sessionUserId);
      if (!active || error) return;
      const merged = [...new Set([...(stored ?? []).map((item) => item.product_id), ...guestIds])];
      if (guestIds.length) {
        await supabase.from("wishlist_items").upsert(
          guestIds.map((product_id) => ({ user_id: sessionUserId, product_id })),
          { onConflict: "user_id,product_id" },
        );
      }
      publish(merged);
    }
    void supabase.auth.getUser().then(({ data }) => synchronize(data.user?.id));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      void synchronize(session?.user.id);
    });
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const actions: WishlistActions = {
    toggleWishlist(productId) {
      if (!productId.trim()) return;
      const removing = snapshot.includes(productId);
      publish(
        removing
          ? snapshot.filter((id) => id !== productId)
          : [...snapshot, productId],
      );
      setAnnouncement(removing ? "Removed from wishlist." : "Saved to wishlist.");
      if (supabaseConfigured()) {
        void createClient().auth.getUser().then(({ data }) => {
          const user = data.user;
          if (!user) return;
          if (removing) {
            void createClient().from("wishlist_items").delete().eq("user_id", user.id).eq("product_id", productId);
          } else {
            void createClient().from("wishlist_items").upsert({ user_id: user.id, product_id: productId }, { onConflict: "user_id,product_id" });
          }
        });
      }
    },
    removeFromWishlist(productId) {
      publish(snapshot.filter((id) => id !== productId));
      setAnnouncement("Removed from wishlist.");
      if (supabaseConfigured()) {
        void createClient().auth.getUser().then(({ data }) => {
          if (data.user) void createClient().from("wishlist_items").delete().eq("user_id", data.user.id).eq("product_id", productId);
        });
      }
    },
    announcement,
  };

  return (
    <WishlistContext.Provider value={actions}>
      {children}
      {announcement ? (
        <p className="wishlist-announcement" role="status" aria-live="polite">
          {announcement}
        </p>
      ) : null}
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
