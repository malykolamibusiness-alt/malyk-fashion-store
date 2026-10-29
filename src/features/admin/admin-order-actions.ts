"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/server";

export async function updateAdminOrderFulfilment(formData: FormData): Promise<{ error?: string }> {
  const { supabase, isAdmin } = await requireAdmin("/admin/orders");
  if (!isAdmin) return { error: "Administrator access is required." };
  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "");
  const carrier = String(formData.get("carrier") ?? "").trim().slice(0, 120);
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim().slice(0, 160);
  const trackingUrl = String(formData.get("trackingUrl") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim().slice(0, 2000);
  if (trackingUrl) {
    try { const url = new URL(trackingUrl); if (url.protocol !== "https:") return { error: "Tracking URLs must use HTTPS." }; }
    catch { return { error: "Enter a valid tracking URL." }; }
  }
  const { error } = await supabase.rpc("update_order_fulfilment", {
    p_order_id: orderId,
    p_status: status,
    p_tracking_carrier: carrier,
    p_tracking_number: trackingNumber,
    p_tracking_url: trackingUrl,
    p_note: note,
    p_idempotency_key: randomUUID(),
  });
  if (error) return { error: "The order status could not be updated." };
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/account/orders/${orderId}`);
  return {};
}
