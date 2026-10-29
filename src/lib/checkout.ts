import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const SUPPORTED_CHECKOUT_CURRENCIES = new Set(["USD", "EUR", "GBP"]);

export type CheckoutItemInput = {
  productId: string;
  variantId: string;
  quantity: number;
};

export type CheckoutAddress = {
  customerName: string;
  customerEmail: string;
  phone: string;
  country: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region: string;
  postalCode: string;
};

export function validateCheckoutItems(value: unknown): CheckoutItemInput[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 50) {
    throw new Error("Your bag must contain between one and 50 items.");
  }

  const variantIds = new Set<string>();
  return value.map((entry) => {
    if (!entry || typeof entry !== "object") throw new Error("Invalid bag item.");
    const item = entry as Record<string, unknown>;
    if (
      typeof item.productId !== "string" || !item.productId ||
      typeof item.variantId !== "string" || !item.variantId ||
      !Number.isInteger(item.quantity) || Number(item.quantity) < 1 || Number(item.quantity) > 99
    ) {
      throw new Error("A bag item is invalid.");
    }
    if (variantIds.has(item.variantId)) throw new Error("Duplicate bag items are not allowed.");
    variantIds.add(item.variantId);
    return { productId: item.productId, variantId: item.variantId, quantity: Number(item.quantity) };
  });
}

export function validateCheckoutAddress(value: unknown): CheckoutAddress {
  if (!value || typeof value !== "object") throw new Error("Shipping details are required.");
  const address = value as Record<string, unknown>;
  const requiredText = (name: string, max = 160) => {
    const result = address[name];
    if (typeof result !== "string" || !result.trim() || result.trim().length > max) {
      throw new Error(`Please enter a valid ${name.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`)}.`);
    }
    return result.trim();
  };
  const email = requiredText("customerEmail", 320);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Please enter a valid email address.");
  const postalCode = typeof address.postalCode === "string" ? address.postalCode.trim() : "";
  const addressLine2 = typeof address.addressLine2 === "string" ? address.addressLine2.trim() : "";
  return {
    customerName: requiredText("customerName"),
    customerEmail: email,
    phone: requiredText("phone", 40),
    country: requiredText("country", 80),
    addressLine1: requiredText("addressLine1", 160),
    addressLine2,
    city: requiredText("city", 80),
    region: typeof address.region === "string" ? address.region.trim().slice(0, 80) : "",
    postalCode,
  };
}

export function normalizeCountryCode(value: string) {
  const normalized = value.trim().toUpperCase();
  const names: Record<string, string> = { UNITEDSTATES: "US", USA: "US", UNITEDKINGDOM: "GB", UK: "GB", CANADA: "CA", FRANCE: "FR", GERMANY: "DE", NETHERLANDS: "NL", AUSTRALIA: "AU", INDIA: "IN", NIGERIA: "NG" };
  if (/^[A-Z]{2}$/.test(normalized)) return normalized;
  return names[normalized.replace(/[^A-Z]/g, "")] ?? "";
}

export async function getShippingMethods(supabase: SupabaseClient<Database>, countryCode: string, region: string, subtotalMinor: number, postalCode: string, currencyCode?: string) {
  if (!countryCode) throw new Error("Enter a supported country code or country name.");
  const { data: zones, error } = await supabase.from("shipping_zones").select("id, name, country_codes, region_codes").eq("active", true);
  if (error) throw new Error("Shipping configuration is temporarily unavailable.");
  const normalizedRegion = region.trim().toUpperCase();
  const eligible = (zones ?? []).filter((zone) =>
    zone.country_codes.includes(countryCode) || zone.country_codes.includes("*") ||
    zone.region_codes.some((code) => `${countryCode}-${normalizedRegion}` === code.toUpperCase())
  );
  if (!eligible.length) throw new Error("We do not currently ship to this destination.");
  const zoneIds = eligible.map((zone) => zone.id);
  const { data: methods, error: methodsError } = await supabase.from("shipping_methods").select("id, zone_id, name, description, calculation_method, base_fee_minor, additional_fee_minor, free_shipping_min_minor, estimated_min_days, estimated_max_days, currency_code").eq("active", true).in("zone_id", zoneIds);
  if (methodsError) throw new Error("Shipping methods could not be loaded.");
  if (!methods?.length) throw new Error("No shipping methods are available for this destination.");
  const compatibleMethods = currencyCode ? methods.filter((method) => method.currency_code === currencyCode) : methods;
  if (!compatibleMethods.length) throw new Error("No shipping methods are available in the checkout currency.");
  return compatibleMethods.map((method) => {
    const free = method.calculation_method === "free" || (method.free_shipping_min_minor !== null && subtotalMinor >= method.free_shipping_min_minor);
    const fee = free ? 0 : method.base_fee_minor + method.additional_fee_minor;
    const estimate = method.estimated_min_days === null ? "" : method.estimated_max_days === null || method.estimated_min_days === method.estimated_max_days
      ? `${method.estimated_min_days} business days`
      : `${method.estimated_min_days}-${method.estimated_max_days} business days`;
    return { ...method, shippingMinor: fee, estimate, postalCodePresent: postalCode.length > 0 };
  });
}

export function getCheckoutCharges(subtotalMinor: number, currency: string, shippingMinor = 0, taxMinor = 0) {
  if (!SUPPORTED_CHECKOUT_CURRENCIES.has(currency)) throw new Error("This currency is not supported.");
  if (!Number.isSafeInteger(shippingMinor) || shippingMinor < 0 || !Number.isSafeInteger(taxMinor) || taxMinor < 0) throw new Error("Checkout charges are invalid.");
  return { shippingMinor, taxMinor, totalMinor: subtotalMinor + shippingMinor + taxMinor };
}

export function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) throw new Error("NEXT_PUBLIC_SITE_URL is required for payment redirects.");
  return new URL(configured).origin;
}
