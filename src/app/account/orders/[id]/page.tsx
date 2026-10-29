export const instant = false;

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { formatPrice } from "@/data/products";
import { requireUser } from "@/lib/auth/server";

export const metadata: Metadata = { title: "Order details | MALYK", description: "View your MALYK order." };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireUser(`/account/orders/${id}`);
  const { data: order, error } = await supabase.from("orders").select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (error || !order) notFound();
  const { data: items } = await supabase.from("order_items").select("*").eq("order_id", id).order("created_at", { ascending: true });
  const address = order.shipping_address as { fullName?: string; addressLine1?: string; addressLine2?: string; city?: string; state?: string; postalCode?: string; country?: string };
  let trackingUrl = "";
  try { const parsed = new URL(order.tracking_url); if (parsed.protocol === "https:" || parsed.protocol === "http:") trackingUrl = parsed.toString(); } catch {}
  return (
    <main id="main-content" className="account-page">
      <Container>
        <Link className="back-link" href="/account/orders">← Order history</Link>
        <p className="eyebrow">MALYK / Order #{order.id.slice(0, 8).toUpperCase()}</p><h1>Order details.</h1>
        <div className="order-detail-grid">
          <section><h2>Payment and fulfilment</h2><dl><dt>Payment</dt><dd>{order.payment_status}</dd><dt>Fulfilment</dt><dd>{order.fulfilment_status}</dd>{trackingUrl ? <><dt>Tracking</dt><dd><a href={trackingUrl} rel="noreferrer" target="_blank">{order.tracking_number || "Track shipment"}</a></dd></> : null}</dl></section>
          <section><h2>Shipping address</h2><p>{address.fullName}<br />{address.addressLine1}{address.addressLine2 ? <><br />{address.addressLine2}</> : null}<br />{address.city}{address.state ? `, ${address.state}` : ""} {address.postalCode}<br />{address.country}</p></section>
        </div>
        <section className="order-items"><h2>Items</h2>{items?.map((item) => <article key={item.id}><div><strong>{item.product_name}</strong><p>{item.size} · {item.color_name} · Qty {item.quantity}</p></div><strong>{formatPrice(item.line_total_minor, order.currency_code)}</strong></article>)}</section>
        <dl className="order-totals"><dt>Subtotal</dt><dd>{formatPrice(order.subtotal_minor, order.currency_code)}</dd><dt>Shipping</dt><dd>{formatPrice(order.shipping_minor, order.currency_code)}</dd><dt>Tax</dt><dd>{formatPrice(order.tax_minor, order.currency_code)}</dd><dt>Total</dt><dd>{formatPrice(order.total_minor, order.currency_code)}</dd></dl>
      </Container>
    </main>
  );
}
