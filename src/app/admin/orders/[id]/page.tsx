export const instant = false;

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { formatPrice } from "@/data/products";
import { AdminOrderActions } from "@/features/admin/AdminOrderActions";
import { requireAdmin } from "@/lib/auth/server";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, isAdmin } = await requireAdmin(`/admin/orders/${id}`);
  if (!isAdmin) redirect("/account?access=denied");
  const { data: order, error } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (error || !order) notFound();
  const { data: items } = await supabase.from("order_items").select("*").eq("order_id", id);
  const address = order.shipping_address as { fullName?: string; addressLine1?: string; city?: string; state?: string; postalCode?: string; country?: string };
  return <main className="admin-page"><Container>
    <Link className="back-link" href="/admin/orders">← Orders</Link><p className="eyebrow">MALYK / Studio</p><h1 className="admin-title">Order #{order.id.slice(0,8).toUpperCase()}</h1>
    <div className="admin-order-detail"><section><h2>Customer</h2><p>{order.customer_name}<br />{order.customer_email}<br />{order.phone || "No phone"}</p><p>{address.fullName}<br />{address.addressLine1}<br />{address.city}{address.state ? `, ${address.state}` : ""} {address.postalCode}<br />{address.country}</p></section>
    <section><h2>Payment</h2><dl><dt>Status</dt><dd>{order.payment_status}</dd><dt>Provider</dt><dd>{order.provider}</dd><dt>Reference</dt><dd>{order.provider_reference ?? "Pending"}</dd><dt>Total</dt><dd>{formatPrice(order.total_minor, order.currency_code)}</dd></dl></section></div>
    <section className="admin-order-items"><h2>Items</h2>{items?.map((item) => <article key={item.id}><span>{item.product_name}<small>{item.variant_sku} · {item.size} · {item.color_name}</small></span><strong>{item.quantity} × {formatPrice(item.unit_price_minor, order.currency_code)}</strong></article>)}</section>
    <AdminOrderActions orderId={order.id} currentStatus={order.fulfilment_status} />
  </Container></main>;
}
