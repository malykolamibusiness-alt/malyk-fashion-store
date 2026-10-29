export const instant = false;

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { formatPrice } from "@/data/products";
import { requireAdmin } from "@/lib/auth/server";

export const metadata: Metadata = { title: "Orders | MALYK Studio", description: "Manage MALYK customer orders." };

export default async function AdminOrdersPage() {
  const { supabase, isAdmin } = await requireAdmin("/admin/orders");
  if (!isAdmin) redirect("/account?access=denied");
  const { data: orders, error } = await supabase.from("orders").select("id, customer_email, created_at, total_minor, currency_code, payment_status, fulfilment_status").order("created_at", { ascending: false }).limit(50);
  return <main className="admin-page"><Container><p className="eyebrow">MALYK / Studio</p><h1 className="admin-title">Orders</h1>
    {error ? <p className="form-message form-message--error" role="alert">Orders could not be loaded.</p> : null}
    {orders?.length ? <div className="admin-order-list">{orders.map((order) => <article key={order.id}><div><Link href={`/admin/orders/${order.id}`}>#{order.id.slice(0,8).toUpperCase()}</Link><span>{order.customer_email}</span></div><div><strong>{formatPrice(order.total_minor, order.currency_code)}</strong><span>{order.payment_status} · {order.fulfilment_status}</span></div></article>)}</div> : !error ? <div className="admin-empty"><h2>No orders yet.</h2></div> : null}
  </Container></main>;
}
