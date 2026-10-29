"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/server";

export async function createShippingZoneAction(formData: FormData) {
  const { supabase, isAdmin } = await requireAdmin("/admin/shipping");
  if (!isAdmin) throw new Error("Administrator access is required.");
  const name = String(formData.get("name") ?? "").trim();
  const countries = String(formData.get("countries") ?? "").split(/[\s,]+/).map((value) => value.trim().toUpperCase()).filter((value) => /^[A-Z]{2}$/.test(value));
  if (name.length < 1 || !countries.length) throw new Error("Enter a name and at least one two-letter country code.");
  const { error } = await supabase.from("shipping_zones").insert({ name, country_codes: [...new Set(countries)], region_codes: [] });
  if (error) throw new Error("The shipping zone could not be created.");
  revalidatePath("/admin/shipping");
}

export async function createShippingMethodAction(formData: FormData) {
  const { supabase, isAdmin } = await requireAdmin("/admin/shipping");
  if (!isAdmin) throw new Error("Administrator access is required.");
  const zoneId = String(formData.get("zoneId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const currency = String(formData.get("currency") ?? "USD").trim().toUpperCase();
  const baseFee = Number(formData.get("baseFee") ?? 0);
  const freeThreshold = formData.get("freeThreshold") ? Number(formData.get("freeThreshold")) : null;
  if (!zoneId || !name || ! /^[A-Z]{3}$/.test(currency) || !Number.isSafeInteger(baseFee) || baseFee < 0 || (freeThreshold !== null && (!Number.isSafeInteger(freeThreshold) || freeThreshold < 0))) throw new Error("Check the shipping method values.");
  const { error } = await supabase.from("shipping_methods").insert({ zone_id: zoneId, name, description: String(formData.get("description") ?? "").trim(), calculation_method: "flat", base_fee_minor: baseFee, currency_code: currency, free_shipping_min_minor: freeThreshold });
  if (error) throw new Error("The shipping method could not be created.");
  revalidatePath("/admin/shipping");
}
