import { randomUUID } from "node:crypto";
import Stripe from "stripe";
import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/server";
import { getCheckoutCharges, getShippingMethods, normalizeCountryCode, siteUrl, validateCheckoutAddress, validateCheckoutItems } from "@/lib/checkout";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items = validateCheckoutItems(body.items);
    const address = validateCheckoutAddress(body.address);
    const provider = body.provider as string;
    if (provider !== "stripe" && provider !== "paystack") throw new Error("Select a supported payment provider.");

    const { supabase, user } = await requireUser("/checkout");
    const variantIds = items.map((item) => item.variantId);
    const { data: variants, error } = await supabase
      .from("product_variants")
      .select("id, product_id, sku, size, color_name, stock_quantity, active, product:products(id, name, slug, status, currency_code, price_minor)")
      .in("id", variantIds);
    if (error) throw error;

    let subtotalMinor = 0;
    let currency = "";
    for (const item of items) {
      const row = variants?.find((variant) => variant.id === item.variantId);
      const product = Array.isArray(row?.product) ? row.product[0] : row?.product;
      if (!row || !product || product.id !== item.productId || row.active !== true || product.status !== "published") {
        throw new Error("One or more bag items are no longer available.");
      }
      if (row.stock_quantity < item.quantity) throw new Error("One or more bag items are out of stock.");
      if (currency && currency !== product.currency_code) throw new Error("Mixed checkout currencies are not supported.");
      currency = product.currency_code;
      subtotalMinor += product.price_minor * item.quantity;
    }
    const { data: currencyConfig, error: currencyError } = await supabase.from("checkout_currencies").select("active, stripe_enabled, paystack_enabled").eq("currency_code", currency).maybeSingle();
    if (currencyError || !currencyConfig?.active || (provider === "stripe" && !currencyConfig.stripe_enabled) || (provider === "paystack" && !currencyConfig.paystack_enabled)) {
      throw new Error("This payment provider does not support the checkout currency.");
    }

    const countryCode = normalizeCountryCode(address.country);
    const availableMethods = await getShippingMethods(supabase, countryCode, address.region, subtotalMinor, address.postalCode, currency);
    const selectedMethod = availableMethods.find((method) => method.id === body.shippingMethodId);
    if (!selectedMethod) throw new Error("Select an available shipping method for this destination.");
    const taxRuleResult = await supabase.rpc("get_checkout_tax_rule", {
      p_country_code: countryCode,
      p_region_code: address.region.trim().toUpperCase(),
    });
    if (taxRuleResult.error) throw taxRuleResult.error;
    const taxRule = Array.isArray(taxRuleResult.data) ? taxRuleResult.data[0] as { tax_rate_basis_points: number; prices_include_tax: boolean } | undefined : undefined;
    const taxMinor = taxRule?.prices_include_tax ? 0 : Math.floor(subtotalMinor * (taxRule?.tax_rate_basis_points ?? 0) / 10000);
    const charges = getCheckoutCharges(subtotalMinor, currency, selectedMethod.shippingMinor, taxMinor);
    const idempotencyKey = typeof body.idempotencyKey === "string" && body.idempotencyKey.length >= 16 ? body.idempotencyKey : randomUUID();
    const { data: orderId, error: orderError } = await supabase.rpc("create_checkout_order", {
      p_idempotency_key: idempotencyKey,
      p_customer_email: user.email ?? address.customerEmail,
      p_customer_name: address.customerName,
      p_phone: address.phone,
      p_shipping_address: address,
      p_provider: provider,
      p_currency_code: currency,
      p_subtotal_minor: subtotalMinor,
      p_shipping_minor: charges.shippingMinor,
      p_tax_minor: charges.taxMinor,
      p_total_minor: charges.totalMinor,
      p_items: items,
    });
    if (orderError || !orderId) throw orderError ?? new Error("The order could not be created.");
    const { error: snapshotError } = await supabase.rpc("set_checkout_shipping_snapshot", {
      p_order_id: orderId,
      p_method_id: selectedMethod.id,
      p_method_name: selectedMethod.name,
      p_method_description: selectedMethod.description,
      p_estimated_delivery: selectedMethod.estimate,
      p_tax_rule_id: null,
      p_tax_rate_basis_points: taxRule?.tax_rate_basis_points ?? 0,
    });
    if (snapshotError) throw snapshotError;

    if (provider === "stripe") {
      const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
      if (!secretKey) return NextResponse.json({ error: "Stripe is not configured on this server." }, { status: 503 });
      const stripe = new Stripe(secretKey);
      const baseUrl = siteUrl();
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: user.email ?? address.customerEmail,
        client_reference_id: orderId,
        line_items: [{ price_data: { currency: currency.toLowerCase(), unit_amount: charges.totalMinor, product_data: { name: "MALYK order" } }, quantity: 1 }],
        metadata: { order_id: orderId, idempotency_key: idempotencyKey },
        success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/checkout/cancel?order_id=${encodeURIComponent(orderId)}`,
      }, { idempotencyKey: `malyk-order-${orderId}` });
      await supabase.rpc("set_checkout_provider_reference", { p_order_id: orderId, p_reference: session.id });
      return NextResponse.json({ url: session.url });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY?.trim();
    if (!secretKey) return NextResponse.json({ error: "Paystack is not configured on this server." }, { status: 503 });
    const reference = `MALYK-${orderId}`;
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email ?? address.customerEmail, amount: charges.totalMinor, currency, reference, callback_url: `${siteUrl()}/checkout/success?provider=paystack&reference=${encodeURIComponent(reference)}`, metadata: { order_id: orderId } }),
    });
    const data = (await response.json()) as { status?: boolean; data?: { authorization_url?: string }; message?: string };
    if (!response.ok || !data.status || !data.data?.authorization_url) throw new Error(data.message ?? "Paystack could not initialize payment.");
    await supabase.rpc("set_checkout_provider_reference", { p_order_id: orderId, p_reference: reference });
    return NextResponse.json({ url: data.data.authorization_url });
  } catch (error) {
    console.error("MALYK checkout initialization failed.", error);
    const message = error instanceof Error ? error.message : "Checkout could not be completed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
