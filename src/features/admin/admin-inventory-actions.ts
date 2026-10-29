"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/server";

export async function adjustInventoryAction(formData: FormData): Promise<{ error?: string }> {
  const { supabase, isAdmin } = await requireAdmin("/admin/inventory");
  if (!isAdmin) return { error: "Administrator access is required." };
  const variantId = String(formData.get("variantId") ?? "");
  const adjustment = Number(formData.get("adjustment"));
  const reason = String(formData.get("reason") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 2000);
  if (!Number.isInteger(adjustment) || adjustment === 0) return { error: "Enter a non-zero whole-unit adjustment." };
  if (Math.abs(adjustment) > 100000) return { error: "Adjustment is too large." };
  const { error } = await supabase.rpc("adjust_variant_stock", { p_variant_id: variantId, p_adjustment: adjustment, p_reason: reason, p_note: note, p_idempotency_key: randomUUID() });
  if (error) return { error: "Stock could not be adjusted. Check the variant and adjustment limits." };
  revalidatePath("/admin/inventory");
  return {};
}
