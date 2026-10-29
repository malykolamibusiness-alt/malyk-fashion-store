import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/server";
import { getShippingMethods, normalizeCountryCode, validateCheckoutItems } from "@/lib/checkout";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { country?: unknown; region?: unknown; postalCode?: unknown; items?: unknown; currency?: unknown };
    if (typeof body.country !== "string" || !body.country.trim()) throw new Error("Enter a destination country.");
    const country = normalizeCountryCode(body.country);
    const region = typeof body.region === "string" ? body.region : "";
    const postalCode = typeof body.postalCode === "string" ? body.postalCode : "";
    const items = validateCheckoutItems(body.items);
    const { supabase } = await requireUser("/checkout");
    const currency = typeof body.currency === "string" ? body.currency.toUpperCase() : undefined;
    const { data: variants, error } = await supabase
      .from("product_variants")
      .select("id, active, stock_quantity, product:products(id, status, currency_code, price_minor)")
      .in("id", items.map((item) => item.variantId));
    if (error) throw error;
    let subtotalMinor = 0;
    for (const item of items) {
      const variant = variants?.find((candidate) => candidate.id === item.variantId);
      const product = Array.isArray(variant?.product) ? variant.product[0] : variant?.product;
      if (!variant?.active || !product || product.status !== "published") throw new Error("A bag item is no longer available.");
      if (product.currency_code !== currency) throw new Error("All bag items must use the checkout currency.");
      subtotalMinor += Number(product.price_minor) * item.quantity;
    }
    const methods = await getShippingMethods(supabase, country, region, subtotalMinor, postalCode, currency);
    return NextResponse.json({ methods });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Shipping options could not be loaded.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
