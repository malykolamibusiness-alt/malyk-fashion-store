"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useCart } from "@/features/cart/CartProvider";
import { formatPrice } from "@/data/products";
import type { Product } from "@/types/product";

export function CheckoutForm({ products, stripeEnabled, paystackEnabled }: { products: Product[]; stripeEnabled: boolean; paystackEnabled: boolean }) {
  const cart = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [shippingMethods, setShippingMethods] = useState<Array<{ id: string; name: string; description: string; shippingMinor: number; estimate: string }>>([]);
  const [shippingMethodId, setShippingMethodId] = useState("");
  const [shippingLoading, setShippingLoading] = useState(false);
  const [provider, setProvider] = useState<"stripe" | "paystack">(
    stripeEnabled ? "stripe" : "paystack",
  );
  const lines = useMemo(() => cart.items.map((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    const variant = product?.variants.find((candidate) => candidate.id === item.variantId);
    const color = product?.availableColors.find((candidate) => candidate.id === item.colorId);
    return { item, product, variant, color, image: product?.images[0] };
  }), [cart.items, products]);
  const subtotal = lines.reduce((sum, line) => sum + (line.product?.priceMinor ?? 0) * line.item.quantity, 0);
  const currency = lines.find((line) => line.product)?.product?.currency ?? "USD";
  const hasInvalidItems = lines.some((line) => !line.product || !line.variant || !line.variant.available || line.variant.stockQuantity < line.item.quantity);
  const selectedShipping = shippingMethods.find((method) => method.id === shippingMethodId);
  async function loadShippingMethods(nextCountry = country, nextRegion = region, nextPostalCode = postalCode) {
    if (!nextCountry.trim()) return;
    setShippingLoading(true);
    setError("");
    try {
      const response = await fetch("/api/checkout/shipping", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ address: { customerName: "Checkout recipient", customerEmail: "checkout@example.com", phone: "0000000000", country: nextCountry, addressLine1: "Address", city: "City", region: nextRegion, postalCode: nextPostalCode }, subtotalMinor: subtotal, currency }) });
      const result = await response.json() as { methods?: typeof shippingMethods; error?: string };
      if (!response.ok || !result.methods) throw new Error(result.error ?? "Shipping options could not be loaded.");
      setShippingMethods(result.methods); setShippingMethodId(result.methods[0]?.id ?? "");
    } catch (shippingError) { setShippingMethods([]); setShippingMethodId(""); setError(shippingError instanceof Error ? shippingError.message : "Shipping options could not be loaded."); }
    finally { setShippingLoading(false); }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const requiredFields = [
      ["customerEmail", "email address"],
      ["customerName", "full name"],
      ["shippingPhone", "phone number"],
      ["country", "country"],
      ["addressLine1", "address line"],
      ["city", "city"],
    ] as const;
    const missingField = requiredFields.find(([name]) => !String(form.get(name) ?? "").trim());
    const email = String(form.get("customerEmail") ?? "").trim();
    if (missingField) {
      setError(`Please enter your ${missingField[1]}.`);
      formElement.querySelector<HTMLInputElement>(`[name="${missingField[0]}"]`)?.focus();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      formElement.querySelector<HTMLInputElement>("[name=customerEmail]")?.focus();
      return;
    }
    if (!shippingMethodId) {
      setError("Select an available shipping method before continuing.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          idempotencyKey: crypto.randomUUID(),
          shippingMethodId,
          items: cart.items,
          address: {
            customerName: form.get("customerName"), customerEmail: form.get("customerEmail"), phone: form.get("shippingPhone"),
            country: form.get("country"), addressLine1: form.get("addressLine1"), addressLine2: form.get("addressLine2"),
            city: form.get("city"), region: form.get("region"), postalCode: form.get("postalCode"),
          },
        }),
      });
      const result = await response.json() as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error ?? "Checkout could not be started.");
      window.location.assign(result.url);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Checkout could not be started.");
      setSubmitting(false);
    }
  }

  if (!cart.items.length) return <p className="checkout-empty">Your bag is empty. <a href="/shop">Continue shopping</a>.</p>;
  return (
    <>
      <nav className="checkout-progress" aria-label="Checkout progress">
        <span className="checkout-progress__current"><strong>01</strong> Details</span>
        <span><strong>02</strong> Review</span>
        <span><strong>03</strong> Payment</span>
      </nav>
      {hasInvalidItems ? <p className="form-message form-message--error" role="alert">One or more bag items are unavailable or exceed current stock. Return to your bag to correct them before checkout.</p> : null}
      <form className="checkout-layout" onSubmit={submit} noValidate>
      <div className="checkout-details">
        <fieldset><legend>Contact information</legend>
          <label><span>Email</span><input name="customerEmail" type="email" autoComplete="email" required /></label>
          <label><span>Full name</span><input name="customerName" autoComplete="name" required /></label>
          <label><span>Phone</span><input name="shippingPhone" type="tel" autoComplete="tel" required /></label>
        </fieldset>
        <fieldset><legend>Shipping address</legend>
          <label><span>Country</span><input name="country" autoComplete="country-name" required value={country} onChange={(event) => setCountry(event.target.value)} onBlur={() => void loadShippingMethods()} /></label>
          <label><span>Address line 1</span><input name="addressLine1" autoComplete="address-line1" required /></label>
          <label><span>Address line 2 (optional)</span><input name="addressLine2" autoComplete="address-line2" /></label>
          <label><span>City</span><input name="city" autoComplete="address-level2" required /></label>
          <label><span>State / province / region</span><input name="region" autoComplete="address-level1" value={region} onChange={(event) => setRegion(event.target.value)} onBlur={() => void loadShippingMethods()} /></label>
          <label><span>Postal code</span><input name="postalCode" autoComplete="postal-code" value={postalCode} onChange={(event) => setPostalCode(event.target.value)} onBlur={() => void loadShippingMethods()} /></label>
          <fieldset><legend>Shipping method</legend>
            {shippingLoading ? <p role="status">Loading shipping options…</p> : shippingMethods.length ? shippingMethods.map((method) => (
              <label key={method.id}><input type="radio" name="shippingMethod" checked={shippingMethodId === method.id} onChange={() => setShippingMethodId(method.id)} /> {method.name} — {formatPrice(method.shippingMinor, currency)}{method.estimate ? ` · ${method.estimate}` : ""}<small>{method.description}</small></label>
            )) : <p>No shipping options loaded. Enter your destination to continue.</p>}
          </fieldset>
        </fieldset>
        {(stripeEnabled || paystackEnabled) ? <fieldset><legend>Payment provider</legend>
          {stripeEnabled ? <label><input type="radio" name="provider-choice" checked={provider === "stripe"} onChange={() => setProvider("stripe")} /> Stripe</label> : null}
          {paystackEnabled ? <label><input type="radio" name="provider-choice" checked={provider === "paystack"} onChange={() => setProvider("paystack")} /> Paystack</label> : null}
        </fieldset> : <p className="form-message form-message--error">Live payment is not configured yet.</p>}
      </div>
      <aside className="checkout-summary">
        <h2>Order summary</h2>
        <ul>{lines.map((line) => line.product && line.variant ? <li key={line.item.variantId}>
          {line.image ? <Image src={line.image.src} alt="" width={96} height={120} unoptimized /> : null}
          <div><strong>{line.product.name}</strong><span>Size {line.variant.size}{line.color ? ` · ${line.color.name}` : ""}</span><span>Quantity {line.item.quantity}</span></div>
          <strong>{formatPrice(line.product.priceMinor * line.item.quantity, line.product.currency)}</strong>
        </li> : null)}</ul>
        <dl><dt>Subtotal</dt><dd>{formatPrice(subtotal, currency)}</dd><dt>Shipping</dt><dd>{selectedShipping ? formatPrice(selectedShipping.shippingMinor, currency) : "Select a method"}</dd><dt>Tax</dt><dd>Calculated at payment</dd><dt>Estimated total</dt><dd>{formatPrice(subtotal + (selectedShipping?.shippingMinor ?? 0), currency)}</dd></dl>
        {error ? <p className="form-message form-message--error" role="alert">{error}</p> : null}
        <button className="button button--primary" disabled={submitting || hasInvalidItems || (!stripeEnabled && !paystackEnabled) || !shippingMethodId}>{submitting ? "Starting secure checkout…" : "Continue to secure payment"}</button>
      </aside>
      </form>
    </>
  );
}
