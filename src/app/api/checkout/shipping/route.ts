import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/server";
import { getShippingMethods, normalizeCountryCode, validateCheckoutAddress } from "@/lib/checkout";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { address?: unknown; subtotalMinor?: unknown; currency?: unknown };
    const address = validateCheckoutAddress(body.address);
    const country = normalizeCountryCode(address.country);
    const subtotalMinor = typeof body.subtotalMinor === "number" && Number.isSafeInteger(body.subtotalMinor) && body.subtotalMinor >= 0 ? body.subtotalMinor : 0;
    const { supabase } = await requireUser("/checkout");
    const currency = typeof body.currency === "string" ? body.currency.toUpperCase() : undefined;
    const methods = await getShippingMethods(supabase, country, address.region, subtotalMinor, address.postalCode, currency);
    return NextResponse.json({ methods });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Shipping options could not be loaded.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
